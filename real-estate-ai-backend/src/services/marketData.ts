import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config/index.js';
import { logDataProcessing } from '../middleware/gdprLogger.js';

export interface MarketDataRequest {
  location: string;
  propertyType?: string;
  period?: '3months' | '6months' | '1year';
}

export interface MarketDataResponse {
  location: string;
  propertyType: string;
  averagePrice?: number | null;
  medianPrice?: number | null;
  pricePerSqm?: number | null;
  totalListings?: number | null;
  soldListings?: number | null;
  averageDaysOnMarket?: number | null;
  priceTrend?: string | null;
  trendPercentage?: number | null;
  dataPeriod: string;
  lastUpdated: Date;
  comparableSales: ComparableSaleData[];
  cached: boolean;
}

export interface ComparableSaleData {
  id: string;
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size?: number | null;
  landSize?: number | null;
  salePrice: number;
  saleDate: Date;
  daysOnMarket?: number | null;
  source: string;
}

export interface Property24ApiResponse {
  data: {
    properties: Array<{
      id: string;
      address: string;
      suburb: string;
      city: string;
      propertyType: string;
      bedrooms?: number;
      bathrooms?: number;
      size?: number;
      landSize?: number;
      price: number;
      saleDate: string;
      daysOnMarket?: number;
      features?: string[];
      images?: string[];
      coordinates?: { lat: number; lng: number };
    }>;
    marketStats: {
      averagePrice: number;
      medianPrice: number;
      pricePerSqm: number;
      totalListings: number;
      soldListings: number;
      averageDaysOnMarket: number;
      priceTrend: string;
      trendPercentage: number;
    };
  };
}

export class MarketDataService {
  private prisma: PrismaClient;
  private redis: Redis;
  private httpClient: AxiosInstance;
  private rateLimiter: Map<string, { count: number; resetTime: number }>;
  private circuitBreaker: { failures: number; lastFailureTime: number; state: 'closed' | 'open' | 'half-open' };

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(config.redis.url);
    this.rateLimiter = new Map();
    this.circuitBreaker = { failures: 0, lastFailureTime: 0, state: 'closed' };

    this.httpClient = axios.create({
      baseURL: config.marketData.property24BaseUrl,
      timeout: config.marketData.requestTimeout,
      headers: {
        'Authorization': `Bearer ${config.marketData.property24ApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'RealEstateAI-MarketData/1.0',
      },
    });

    // Setup axios interceptors for error handling
    this.setupAxiosInterceptors();
  }

  async getMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
    const { location, propertyType = 'house', period = '6months' } = request;

    try {
      // Check rate limiting
      if (!this.checkRateLimit(location)) {
        throw new Error('Rate limit exceeded for market data requests');
      }

      // Check circuit breaker
      if (!this.checkCircuitBreaker()) {
        throw new Error('Market data service temporarily unavailable');
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(location, propertyType, period);

      // Check cache first
      const cachedData = await this.getCachedMarketData(cacheKey);
      if (cachedData) {
        return { ...cachedData, cached: true };
      }

      // Check database for recent data
      const dbData = await this.getMarketDataFromDatabase(location, propertyType, period);
      if (dbData && this.isDataFresh(dbData.lastUpdated)) {
        await this.cacheMarketData(cacheKey, dbData);
        return { ...dbData, cached: false };
      }

      // Fetch fresh data from API
      const freshData = await this.fetchMarketDataFromAPI(location, propertyType, period);

      // Store in database and cache
      await this.storeMarketData(freshData);
      await this.cacheMarketData(cacheKey, freshData);

      // GDPR logging
      if (config.gdpr.compliance) {
        await logDataProcessing({
          action: 'market_data_retrieved',
          resource: `market_data_${location}_${propertyType}`,
          details: {
            location,
            propertyType,
            period,
            dataPoints: freshData.comparableSales.length,
          },
          ipAddress: 'system',
          userAgent: 'MarketDataService',
        });
      }

      return { ...freshData, cached: false };

    } catch (error) {
      console.error('Market data retrieval error:', error);
      this.recordCircuitBreakerFailure();

      // Try to return stale data if available
      const staleData = await this.getStaleMarketData(location, propertyType, period);
      if (staleData) {
        return { ...staleData, cached: true };
      }

      throw error;
    }
  }

  private generateCacheKey(location: string, propertyType: string, period: string): string {
    return `market:${location.toLowerCase().replace(/\s+/g, '_')}:${propertyType}:${period}`;
  }

  private async getCachedMarketData(cacheKey: string): Promise<MarketDataResponse | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid
        if (new Date() < new Date(parsed.expiry)) {
          return parsed.data;
        } else {
          await this.redis.del(cacheKey);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  private async cacheMarketData(cacheKey: string, data: MarketDataResponse): Promise<void> {
    try {
      const cacheData = {
        data,
        expiry: new Date(Date.now() + config.marketData.cacheTtl * 1000),
      };
      await this.redis.setex(cacheKey, config.marketData.cacheTtl, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private async getMarketDataFromDatabase(location: string, propertyType: string, period: string): Promise<MarketDataResponse | null> {
    try {
      const marketData = await this.prisma.marketData.findFirst({
        where: {
          location: location.toLowerCase(),
          propertyType: propertyType.toLowerCase(),
          dataPeriod: period,
          isActive: true,
        },
        include: {
          comparableSales: {
            where: { isActive: true },
            orderBy: { saleDate: 'desc' },
            take: 20,
          },
        },
        orderBy: { lastUpdated: 'desc' },
      });

      if (!marketData) return null;

      return {
        location: marketData.location,
        propertyType: marketData.propertyType,
        averagePrice: marketData.averagePrice,
        medianPrice: marketData.medianPrice,
        pricePerSqm: marketData.pricePerSqm,
        totalListings: marketData.totalListings,
        soldListings: marketData.soldListings,
        averageDaysOnMarket: marketData.averageDaysOnMarket,
        priceTrend: marketData.priceTrend,
        trendPercentage: marketData.trendPercentage,
        dataPeriod: marketData.dataPeriod,
        lastUpdated: marketData.lastUpdated,
        comparableSales: marketData.comparableSales.map(sale => ({
          id: sale.id,
          address: sale.address,
          suburb: sale.suburb,
          city: sale.city,
          propertyType: sale.propertyType,
          bedrooms: sale.bedrooms,
          bathrooms: sale.bathrooms,
          size: sale.size,
          landSize: sale.landSize,
          salePrice: sale.salePrice,
          saleDate: sale.saleDate,
          daysOnMarket: sale.daysOnMarket,
          source: sale.source,
        })),
        cached: false,
      };
    } catch (error) {
      console.error('Database read error:', error);
      return null;
    }
  }

  private async fetchMarketDataFromAPI(location: string, propertyType: string, period: string): Promise<MarketDataResponse> {
    const params = {
      location,
      propertyType,
      period,
      includeComparableSales: true,
      limit: 20,
    };

    try {
      const response: AxiosResponse<Property24ApiResponse> = await this.httpClient.get('/market-data', { params });

      const apiData = response.data.data;

      return {
        location,
        propertyType,
        averagePrice: apiData.marketStats.averagePrice,
        medianPrice: apiData.marketStats.medianPrice,
        pricePerSqm: apiData.marketStats.pricePerSqm,
        totalListings: apiData.marketStats.totalListings,
        soldListings: apiData.marketStats.soldListings,
        averageDaysOnMarket: apiData.marketStats.averageDaysOnMarket,
        priceTrend: apiData.marketStats.priceTrend,
        trendPercentage: apiData.marketStats.trendPercentage,
        dataPeriod: period,
        lastUpdated: new Date(),
        comparableSales: apiData.properties.map(prop => ({
          id: prop.id,
          address: prop.address,
          suburb: prop.suburb,
          city: prop.city,
          propertyType: prop.propertyType,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          size: prop.size,
          landSize: prop.landSize,
          salePrice: prop.price,
          saleDate: new Date(prop.saleDate),
          daysOnMarket: prop.daysOnMarket,
          source: 'property24',
        })),
        cached: false,
      };
    } catch (error) {
      console.error('API fetch error:', error);
      throw new Error(`Failed to fetch market data from Property24 API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async storeMarketData(data: MarketDataResponse): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Upsert market data
        const marketData = await tx.marketData.upsert({
          where: {
            location_propertyType_dataPeriod: {
              location: data.location,
              propertyType: data.propertyType,
              dataPeriod: data.dataPeriod,
            },
          },
          update: {
            averagePrice: data.averagePrice || null,
            medianPrice: data.medianPrice || null,
            pricePerSqm: data.pricePerSqm || null,
            totalListings: data.totalListings || null,
            soldListings: data.soldListings || null,
            averageDaysOnMarket: data.averageDaysOnMarket || null,
            priceTrend: data.priceTrend || null,
            trendPercentage: data.trendPercentage || null,
            lastUpdated: data.lastUpdated,
            nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next update in 24 hours
            isActive: true,
            metadata: {
              source: 'property24',
              fetchedAt: new Date(),
            },
          },
          create: {
            location: data.location,
            propertyType: data.propertyType,
            dataSource: 'property24',
            averagePrice: data.averagePrice || null,
            medianPrice: data.medianPrice || null,
            pricePerSqm: data.pricePerSqm || null,
            totalListings: data.totalListings || null,
            soldListings: data.soldListings || null,
            averageDaysOnMarket: data.averageDaysOnMarket || null,
            priceTrend: data.priceTrend || null,
            trendPercentage: data.trendPercentage || null,
            dataPeriod: data.dataPeriod,
            lastUpdated: data.lastUpdated,
            nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isActive: true,
            metadata: {
              source: 'property24',
              fetchedAt: new Date(),
            },
          },
        });

        // Store comparable sales
        for (const sale of data.comparableSales) {
          await tx.comparableSale.upsert({
            where: { id: sale.id },
            update: {
              address: sale.address,
              suburb: sale.suburb,
              city: sale.city,
              propertyType: sale.propertyType,
              bedrooms: sale.bedrooms || null,
              bathrooms: sale.bathrooms || null,
              size: sale.size || null,
              landSize: sale.landSize || null,
              salePrice: sale.salePrice,
              saleDate: sale.saleDate,
              daysOnMarket: sale.daysOnMarket || null,
              source: sale.source,
              features: [],
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              id: sale.id,
              marketDataId: marketData.id,
              address: sale.address,
              suburb: sale.suburb,
              city: sale.city,
              propertyType: sale.propertyType,
              bedrooms: sale.bedrooms || null,
              bathrooms: sale.bathrooms || null,
              size: sale.size || null,
              landSize: sale.landSize || null,
              salePrice: sale.salePrice,
              saleDate: sale.saleDate,
              daysOnMarket: sale.daysOnMarket || null,
              source: sale.source,
              features: [],
              isActive: true,
            },
          });
        }
      });
    } catch (error) {
      console.error('Database store error:', error);
      throw new Error('Failed to store market data in database');
    }
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - config.marketData.rateLimitWindowMs;
    const key = `ratelimit:${identifier}`;

    const current = this.rateLimiter.get(key);
    if (!current || current.resetTime < now) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + config.marketData.rateLimitWindowMs });
      return true;
    }

    if (current.count >= config.marketData.rateLimitRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  private checkCircuitBreaker(): boolean {
    const now = Date.now();

    switch (this.circuitBreaker.state) {
      case 'open':
        // Allow limited requests after timeout
        if (now - this.circuitBreaker.lastFailureTime > 60000) { // 1 minute timeout
          this.circuitBreaker.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      case 'closed':
      default:
        return true;
    }
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= 5) {
      this.circuitBreaker.state = 'open';
    }
  }

  private recordCircuitBreakerSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.state = 'closed';
      this.circuitBreaker.failures = 0;
    }
  }

  private isDataFresh(lastUpdated: Date): boolean {
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // Consider data fresh if less than 24 hours old
  }

  private async getStaleMarketData(location: string, propertyType: string, period: string): Promise<MarketDataResponse | null> {
    // Return data that's up to 7 days old in case of API failure
    try {
      const marketData = await this.prisma.marketData.findFirst({
        where: {
          location: location.toLowerCase(),
          propertyType: propertyType.toLowerCase(),
          dataPeriod: period,
          isActive: true,
          lastUpdated: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
        include: {
          comparableSales: {
            where: { isActive: true },
            orderBy: { saleDate: 'desc' },
            take: 10,
          },
        },
        orderBy: { lastUpdated: 'desc' },
      });

      if (!marketData) return null;

      return {
        location: marketData.location,
        propertyType: marketData.propertyType,
        averagePrice: marketData.averagePrice,
        medianPrice: marketData.medianPrice,
        pricePerSqm: marketData.pricePerSqm,
        totalListings: marketData.totalListings,
        soldListings: marketData.soldListings,
        averageDaysOnMarket: marketData.averageDaysOnMarket,
        priceTrend: marketData.priceTrend,
        trendPercentage: marketData.trendPercentage,
        dataPeriod: marketData.dataPeriod,
        lastUpdated: marketData.lastUpdated,
        comparableSales: marketData.comparableSales.map(sale => ({
          id: sale.id,
          address: sale.address,
          suburb: sale.suburb,
          city: sale.city,
          propertyType: sale.propertyType,
          bedrooms: sale.bedrooms,
          bathrooms: sale.bathrooms,
          size: sale.size,
          landSize: sale.landSize,
          salePrice: sale.salePrice,
          saleDate: sale.saleDate,
          daysOnMarket: sale.daysOnMarket,
          source: sale.source,
        })),
        cached: true,
      };
    } catch (error) {
      console.error('Stale data retrieval error:', error);
      return null;
    }
  }

  private setupAxiosInterceptors(): void {
    this.httpClient.interceptors.response.use(
      (response) => {
        // Record success for circuit breaker
        this.recordCircuitBreakerSuccess();
        return response;
      },
      (error) => {
        // Enhanced error handling
        if (error.response) {
          const status = error.response.status;
          switch (status) {
            case 401:
              throw new Error('Property24 API authentication failed');
            case 403:
              throw new Error('Property24 API access forbidden');
            case 429:
              throw new Error('Property24 API rate limit exceeded');
            case 500:
            case 502:
            case 503:
            case 504:
              throw new Error('Property24 API server error');
            default:
              throw new Error(`Property24 API error: ${status}`);
          }
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Property24 API request timeout');
        } else {
          throw new Error('Property24 API network error');
        }
      }
    );
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      await this.redis.ping();

      // Check API connectivity (lightweight call)
      if (config.marketData.property24ApiKey) {
        await this.httpClient.get('/health', { timeout: 5000 });
      }

      return true;
    } catch (error) {
      console.error('Market data service health check failed:', error);
      return false;
    }
  }
}

export default MarketDataService;
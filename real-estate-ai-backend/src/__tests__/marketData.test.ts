import { MarketDataService } from '../services/marketData.js';
import { ContentGenerationService } from '../services/contentGeneration.js';
import { OpenAIService } from '../services/openai.js';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Mock external dependencies
jest.mock('ioredis');
jest.mock('@prisma/client');
jest.mock('axios');
jest.mock('../config/index.js');
jest.mock('../middleware/gdprLogger.js');

const prisma = new PrismaClient();
const marketDataService = new MarketDataService();
const contentService = new ContentGenerationService();
const openaiService = new OpenAIService();

describe('MarketDataService', () => {
  let mockRedis: jest.Mocked<Redis>;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeAll(async () => {
    // Setup mocks
    mockRedis = new Redis() as jest.Mocked<Redis>;
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  afterAll(async () => {
    await marketDataService.disconnect();
    await contentService.disconnect();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMarketData', () => {
    it('should return market data for a valid location', async () => {
      const request = {
        location: 'Cape Town',
        propertyType: 'house',
        period: '6months' as const,
      };

      const mockMarketData = {
        location: 'Cape Town',
        propertyType: 'house',
        averagePrice: 2500000,
        medianPrice: 2400000,
        pricePerSqm: 15000,
        totalListings: 150,
        soldListings: 45,
        averageDaysOnMarket: 28,
        priceTrend: 'upward',
        trendPercentage: 8.5,
        dataPeriod: '6months',
        lastUpdated: new Date(),
        comparableSales: [
          {
            id: '1',
            address: '123 Main St',
            suburb: 'Claremont',
            city: 'Cape Town',
            propertyType: 'house',
            bedrooms: 3,
            bathrooms: 2,
            size: 150,
            salePrice: 2500000,
            saleDate: new Date(),
            daysOnMarket: 25,
            source: 'property24',
          },
        ],
        cached: false,
      };

      // Mock Redis to return null (no cache)
      mockRedis.get.mockResolvedValue(null);
      // Mock database to return null (no stored data)
      mockPrisma.marketData.findFirst.mockResolvedValue(null);
      // Mock API call
      const mockAxiosResponse = {
        data: {
          data: {
            properties: [mockMarketData.comparableSales[0]],
            marketStats: {
              averagePrice: 2500000,
              medianPrice: 2400000,
              pricePerSqm: 15000,
              totalListings: 150,
              soldListings: 45,
              averageDaysOnMarket: 28,
              priceTrend: 'upward',
              trendPercentage: 8.5,
            },
          },
        },
      };

      // Mock axios
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockAxiosResponse),
      }));

      const result = await marketDataService.getMarketData(request);

      expect(result).toBeDefined();
      expect(result.location).toBe(request.location);
      expect(result.propertyType).toBe(request.propertyType);
      expect(result.dataPeriod).toBe(request.period);
      expect(Array.isArray(result.comparableSales)).toBe(true);
      expect(result.comparableSales.length).toBeGreaterThan(0);
    });

    it('should handle rate limiting', async () => {
      const request = {
        location: 'Johannesburg',
        propertyType: 'apartment',
      };

      // Mock rate limiter to exceed limit
      const marketDataServiceWithLimit = new MarketDataService();
      // Force rate limit by mocking internal state
      (marketDataServiceWithLimit as any).rateLimiter.set('johannesburg', {
        count: 100,
        resetTime: Date.now() + 60000,
      });

      await expect(marketDataServiceWithLimit.getMarketData(request))
        .rejects.toThrow('Rate limit exceeded for market data requests');
    });

    it('should handle API failures gracefully with stale data fallback', async () => {
      const request = {
        location: 'Cape Town',
        propertyType: 'house',
        period: '6months' as const,
      };

      // Mock Redis cache miss
      mockRedis.get.mockResolvedValue(null);
      // Mock database miss
      mockPrisma.marketData.findFirst.mockResolvedValue(null);
      // Mock API failure
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockRejectedValue(new Error('API Error')),
      }));

      // Mock stale data availability
      const staleData = {
        location: 'Cape Town',
        propertyType: 'house',
        averagePrice: 2400000,
        medianPrice: 2300000,
        pricePerSqm: 14000,
        dataPeriod: '6months',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        comparableSales: [],
        cached: true,
      };
      mockPrisma.marketData.findFirst.mockResolvedValueOnce(staleData as any);

      const result = await marketDataService.getMarketData(request);

      expect(result).toBeDefined();
      expect(result.cached).toBe(true);
      expect(result.location).toBe(request.location);
    });

    it('should return cached data when available', async () => {
      const request = {
        location: 'Durban',
        propertyType: 'house',
        period: '3months' as const,
      };

      const cachedData = {
        data: {
          location: 'Durban',
          propertyType: 'house',
          averagePrice: 1800000,
          dataPeriod: '3months',
          lastUpdated: new Date(),
          comparableSales: [],
          cached: false,
        },
        expiry: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await marketDataService.getMarketData(request);

      expect(result).toBeDefined();
      expect(result.cached).toBe(true);
      expect(result.location).toBe('Durban');
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should handle circuit breaker open state', async () => {
      const request = {
        location: 'Pretoria',
        propertyType: 'apartment',
      };

      // Mock circuit breaker as open
      const marketDataServiceWithBreaker = new MarketDataService();
      (marketDataServiceWithBreaker as any).circuitBreaker.state = 'open';
      (marketDataServiceWithBreaker as any).circuitBreaker.lastFailureTime = Date.now() - 30000; // 30 seconds ago

      await expect(marketDataServiceWithBreaker.getMarketData(request))
        .rejects.toThrow('Market data service temporarily unavailable');
    });

    it('should validate required location parameter', async () => {
      const request = {
        location: '',
        propertyType: 'house',
      };

      await expect(marketDataService.getMarketData(request as any))
        .rejects.toThrow();
    });

    it('should handle database storage errors gracefully', async () => {
      const request = {
        location: 'Bloemfontein',
        propertyType: 'house',
        period: '1year' as const,
      };

      // Mock successful API call but database failure
      const mockAxiosResponse = {
        data: {
          data: {
            properties: [{
              id: '1',
              address: '123 Test St',
              suburb: 'Test Suburb',
              city: 'Bloemfontein',
              propertyType: 'house',
              bedrooms: 3,
              bathrooms: 2,
              size: 120,
              price: 1500000,
              saleDate: '2024-01-01',
              daysOnMarket: 30,
            }],
            marketStats: {
              averagePrice: 1500000,
              medianPrice: 1450000,
              pricePerSqm: 12500,
              totalListings: 50,
              soldListings: 15,
              averageDaysOnMarket: 30,
              priceTrend: 'stable',
              trendPercentage: 2.1,
            },
          },
        },
      };

      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockAxiosResponse),
      }));

      // Mock Redis operations
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.marketData.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockRejectedValue(new Error('Database connection failed'));

      // Should still return data even if storage fails
      const result = await marketDataService.getMarketData(request);

      expect(result).toBeDefined();
      expect(result.location).toBe('Bloemfontein');
      expect(result.averagePrice).toBe(1500000);
    });

    it('should handle malformed API responses', async () => {
      const request = {
        location: 'Port Elizabeth',
        propertyType: 'townhouse',
      };

      // Mock malformed API response
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            data: {
              properties: null, // Malformed
              marketStats: null, // Malformed
            },
          },
        }),
      }));

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.marketData.findFirst.mockResolvedValue(null);

      await expect(marketDataService.getMarketData(request))
        .rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return true when all services are healthy', async () => {
      // Mock healthy services
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockRedis.ping.mockResolvedValue('PONG');

      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ status: 200 }),
      }));

      const isHealthy = await marketDataService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when database is unhealthy', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('DB Error'));
      mockRedis.ping.mockResolvedValue('PONG');

      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ status: 200 }),
      }));

      const isHealthy = await marketDataService.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return false when Redis is unhealthy', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([1]);
      mockRedis.ping.mockRejectedValue(new Error('Redis Error'));

      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ status: 200 }),
      }));

      const isHealthy = await marketDataService.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});

describe('ContentGenerationService with Market Data', () => {
  let testPropertyId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and property
    const user = await prisma.user.create({
      data: {
        email: 'test-market-data@example.com',
        password: 'hashedpassword',
        subscriptionTier: 'premium',
      },
    });
    testUserId = user.id;

    const property = await prisma.property.create({
      data: {
        userId: testUserId,
        location: 'Cape Town',
        size: 150,
        bedrooms: 3,
        bathrooms: 2,
        price: 2500000,
        features: ['pool', 'garden', 'modern kitchen'],
        propertyType: 'house',
        yearBuilt: 2015,
      },
    });
    testPropertyId = property.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.generatedContent.deleteMany({
      where: { propertyId: testPropertyId },
    });
    await prisma.property.delete({
      where: { id: testPropertyId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('generateContent with market data', () => {
    it('should generate content with market data when includeMarketData is true', async () => {
      const request = {
        propertyId: testPropertyId,
        platform: 'property24' as const,
        tone: 'professional' as const,
        length: 'full' as const,
        userId: testUserId,
        includeMarketData: true,
      };

      const result = await contentService.generateContent(request);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.platform).toBe('property24');
      expect(result.tone).toBe('professional');
      expect(result.length).toBe('full');
      expect(typeof result.wordCount).toBe('number');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    it('should generate content without market data when includeMarketData is false', async () => {
      const request = {
        propertyId: testPropertyId,
        platform: 'facebook' as const,
        tone: 'enthusiastic' as const,
        length: 'short' as const,
        userId: testUserId,
        includeMarketData: false,
      };

      const result = await contentService.generateContent(request);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.platform).toBe('facebook');
      expect(result.tone).toBe('enthusiastic');
      expect(result.length).toBe('short');
    });

    it('should fallback gracefully when market data fetch fails', async () => {
      // Mock market data service to throw error
      const originalGetMarketData = marketDataService.getMarketData;
      marketDataService.getMarketData = jest.fn().mockRejectedValue(new Error('Market data unavailable'));

      const request = {
        propertyId: testPropertyId,
        platform: 'whatsapp' as const,
        tone: 'friendly' as const,
        length: 'short' as const,
        userId: testUserId,
        includeMarketData: true,
      };

      const result = await contentService.generateContent(request);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.platform).toBe('whatsapp');

      // Restore original method
      marketDataService.getMarketData = originalGetMarketData;
    });

    it('should generate content for all platforms with market data', async () => {
      const platforms = ['property24', 'facebook', 'whatsapp'] as const;
      const tones = ['professional', 'enthusiastic', 'friendly'] as const;

      for (const platform of platforms) {
        for (const tone of tones.slice(0, 1)) { // Test one tone per platform to avoid too many tests
          const request = {
            propertyId: testPropertyId,
            platform,
            tone,
            length: 'short' as const,
            userId: testUserId,
            includeMarketData: true,
          };

          const result = await contentService.generateContent(request);

          expect(result).toBeDefined();
          expect(result.content).toBeDefined();
          expect(result.platform).toBe(platform);
          expect(result.tone).toBe(tone);
          expect(result.content.length).toBeGreaterThan(20);
        }
      }
    });
  });

  describe('previewContent with market data', () => {
    it('should preview content with market data', async () => {
      const request = {
        propertyId: testPropertyId,
        platform: 'property24' as const,
        tone: 'professional' as const,
        length: 'full' as const,
        userId: testUserId,
        includeMarketData: true,
      };

      const content = await contentService.previewContent(request);

      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(50);
    });
  });
});

describe('OpenAIService with Market Data', () => {
  describe('generatePropertyDescription with market data', () => {
    const mockPropertyData = {
      location: 'Cape Town',
      size: 150,
      bedrooms: 3,
      bathrooms: 2,
      price: 2500000,
      features: ['pool', 'garden'],
      propertyType: 'house',
      yearBuilt: 2015,
    };

    const mockMarketData = {
      averagePrice: 2200000,
      medianPrice: 2100000,
      pricePerSqm: 15000,
      priceTrend: 'quarterly',
      trendPercentage: 8.5,
      comparableSales: [
        { salePrice: 2400000, bedrooms: 3, bathrooms: 2, size: 140 },
        { salePrice: 2300000, bedrooms: 3, bathrooms: 2, size: 150 },
      ],
    };

    it('should generate Property24 content with market data', async () => {
      const options = {
        platform: 'property24' as const,
        tone: 'professional' as const,
        length: 'full' as const,
        propertyData: mockPropertyData,
        marketData: mockMarketData,
      };

      const result = await openaiService.generatePropertyDescription(options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
      expect(result.content.length).toBeGreaterThan(100);
      expect(result.costTracking).toBeDefined();
    });

    it('should generate Facebook content with market data', async () => {
      const options = {
        platform: 'facebook' as const,
        tone: 'enthusiastic' as const,
        length: 'short' as const,
        propertyData: mockPropertyData,
        marketData: mockMarketData,
      };

      const result = await openaiService.generatePropertyDescription(options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.includes('📊')).toBe(true); // Should include market insight emoji
    });

    it('should generate WhatsApp content with market data', async () => {
      const options = {
        platform: 'whatsapp' as const,
        tone: 'friendly' as const,
        length: 'short' as const,
        propertyData: mockPropertyData,
        marketData: mockMarketData,
      };

      const result = await openaiService.generatePropertyDescription(options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content.includes('💡')).toBe(true); // Should include market insight emoji
    });

    it('should generate content without market data', async () => {
      const options = {
        platform: 'property24' as const,
        tone: 'professional' as const,
        length: 'short' as const,
        propertyData: mockPropertyData,
        marketData: null,
      };

      const result = await openaiService.generatePropertyDescription(options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(typeof result.content).toBe('string');
    });

    it('should handle market data validation', async () => {
      const invalidMarketData = {
        averagePrice: -1000, // Invalid negative price
        medianPrice: null,
        pricePerSqm: null,
        priceTrend: null,
        trendPercentage: null,
        comparableSales: [],
      };

      const options = {
        platform: 'property24' as const,
        tone: 'professional' as const,
        length: 'short' as const,
        propertyData: mockPropertyData,
        marketData: invalidMarketData,
      };

      const result = await openaiService.generatePropertyDescription(options);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      // Should still generate content even with invalid market data
    });
  });
});
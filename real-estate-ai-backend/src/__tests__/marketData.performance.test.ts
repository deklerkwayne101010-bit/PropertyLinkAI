import { MarketDataService } from '../services/marketData.js';

// Mock external dependencies
jest.mock('ioredis');
jest.mock('@prisma/client');
jest.mock('axios');
jest.mock('../config/index.js');
jest.mock('../middleware/gdprLogger.js');

describe('Market Data Performance Optimization Tests', () => {
  let marketDataService: MarketDataService;

  beforeAll(async () => {
    marketDataService = new MarketDataService();
  });

  afterAll(async () => {
    await marketDataService.disconnect();
  });

  describe('Response Time Optimization', () => {
    it('should achieve sub-2-second response times for fresh data', async () => {
      const request = {
        location: 'Cape Town',
        propertyType: 'house',
        period: '6months' as const,
      };

      // Mock successful API response with realistic data
      const mockApiResponse = {
        data: {
          data: {
            properties: Array.from({ length: 20 }, (_, i) => ({
              id: `sale-${i}`,
              address: `${i + 1} Main Street`,
              suburb: 'Claremont',
              city: 'Cape Town',
              propertyType: 'house',
              bedrooms: 3,
              bathrooms: 2,
              size: 140 + i * 10,
              price: 2000000 + i * 50000,
              saleDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
              daysOnMarket: 20 + i,
            })),
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

      // Mock axios for API calls
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockApiResponse),
      }));

      // Mock Redis and Prisma for clean state
      const mockRedis = require('ioredis');
      const mockPrisma = require('@prisma/client');

      mockRedis.Redis.prototype.get.mockResolvedValue(null);
      mockPrisma.PrismaClient.prototype.marketData.findFirst.mockResolvedValue(null);
      mockPrisma.PrismaClient.prototype.$transaction.mockResolvedValue(undefined);

      const startTime = performance.now();

      const result = await marketDataService.getMarketData(request);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      console.log(`Fresh data response time: ${responseTime.toFixed(2)}ms`);

      // Validate response time meets target
      expect(responseTime).toBeLessThan(2000); // 2 seconds target
      expect(result).toBeDefined();
      expect(result.cached).toBe(false);
      expect(result.comparableSales.length).toBe(20);
    }, 3000); // 3 second timeout to allow for 2s target + buffer

    it('should achieve sub-500ms response times for cached data', async () => {
      const request = {
        location: 'Johannesburg',
        propertyType: 'apartment',
        period: '3months' as const,
      };

      // Pre-populate cache with data
      const cachedData = {
        data: {
          location: 'Johannesburg',
          propertyType: 'apartment',
          averagePrice: 1800000,
          medianPrice: 1750000,
          pricePerSqm: 12000,
          totalListings: 200,
          soldListings: 60,
          averageDaysOnMarket: 25,
          priceTrend: 'stable',
          trendPercentage: 2.1,
          dataPeriod: '3months',
          lastUpdated: new Date(),
          comparableSales: [],
          cached: false,
        },
        expiry: new Date(Date.now() + 3600000), // 1 hour from now
      };

      const mockRedis = require('ioredis');
      mockRedis.Redis.prototype.get.mockResolvedValue(JSON.stringify(cachedData));

      const startTime = performance.now();

      const result = await marketDataService.getMarketData(request);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      console.log(`Cached data response time: ${responseTime.toFixed(2)}ms`);

      // Validate cache performance
      expect(responseTime).toBeLessThan(500); // 500ms target for cached data
      expect(result).toBeDefined();
      expect(result.cached).toBe(true);
      expect(result.location).toBe('Johannesburg');
    }, 1000); // 1 second timeout

    it('should maintain performance under database load', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        location: `TestCity${i}`,
        propertyType: 'house',
        period: '6months' as const,
      }));

      // Mock database with slight delay to simulate load
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient.prototype.marketData.findFirst.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 50))
      );

      // Mock API responses
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            data: {
              properties: [],
              marketStats: {
                averagePrice: 2000000,
                medianPrice: 1900000,
                pricePerSqm: 13000,
                totalListings: 100,
                soldListings: 30,
                averageDaysOnMarket: 22,
                priceTrend: 'upward',
                trendPercentage: 5.2,
              },
            },
          },
        }),
      }));

      const startTime = performance.now();

      const results = await Promise.all(
        requests.map(request => marketDataService.getMarketData(request))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / requests.length;

      console.log(`Database load test - Total: ${totalTime.toFixed(2)}ms, Average: ${averageTime.toFixed(2)}ms`);

      // Validate performance under load
      expect(averageTime).toBeLessThan(1500); // 1.5 seconds average under load
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.cached).toBe(false);
      });
    }, 5000); // 5 second timeout for load test
  });

  describe('Memory and Resource Optimization', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const request = {
        location: 'Durban',
        propertyType: 'townhouse',
        period: '1year' as const,
      };

      // Perform 50 consecutive requests
      for (let i = 0; i < 50; i++) {
        await marketDataService.getMarketData({
          ...request,
          location: `Durban${i}`, // Vary location to avoid cache hits
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory usage test - Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB, Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (< 10MB for 50 requests)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    }, 30000); // 30 second timeout for memory test

    it('should efficiently handle large result sets', async () => {
      const request = {
        location: 'Pretoria',
        propertyType: 'house',
        period: '6months' as const,
      };

      // Mock API response with large dataset (100 comparable sales)
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `large-sale-${i}`,
        address: `${i + 1} Large Street`,
        suburb: 'Moreleta Park',
        city: 'Pretoria',
        propertyType: 'house',
        bedrooms: 3 + (i % 3),
        bathrooms: 2 + (i % 2),
        size: 150 + i * 5,
        price: 1800000 + i * 20000,
        saleDate: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(), // Spread over time
        daysOnMarket: 15 + (i % 30),
      }));

      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            data: {
              properties: largeDataset,
              marketStats: {
                averagePrice: 2000000,
                medianPrice: 1950000,
                pricePerSqm: 13500,
                totalListings: 300,
                soldListings: 100,
                averageDaysOnMarket: 25,
                priceTrend: 'upward',
                trendPercentage: 6.8,
              },
            },
          },
        }),
      }));

      const startTime = performance.now();

      const result = await marketDataService.getMarketData(request);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      console.log(`Large dataset response time: ${responseTime.toFixed(2)}ms for ${largeDataset.length} records`);

      // Should handle large datasets within reasonable time
      expect(responseTime).toBeLessThan(3000); // 3 seconds for large dataset
      expect(result).toBeDefined();
      expect(result.comparableSales.length).toBe(100);
    }, 5000); // 5 second timeout
  });

  describe('Concurrent Performance Validation', () => {
    it('should maintain performance under high concurrency', async () => {
      const concurrentRequests = 20;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
        location: `ConcurrentCity${i}`,
        propertyType: ['house', 'apartment', 'townhouse'][i % 3] as any,
        period: ['3months', '6months', '1year'][i % 3] as any,
      }));

      // Mock fast API responses
      const axios = require('axios');
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          data: {
            data: {
              properties: [],
              marketStats: {
                averagePrice: 2200000,
                medianPrice: 2100000,
                pricePerSqm: 14000,
                totalListings: 120,
                soldListings: 35,
                averageDaysOnMarket: 24,
                priceTrend: 'stable',
                trendPercentage: 1.5,
              },
            },
          },
        }),
      }));

      const startTime = performance.now();

      const results = await Promise.all(
        requests.map(request => marketDataService.getMarketData(request))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;

      console.log(`Concurrent load test - Total: ${totalTime.toFixed(2)}ms, Average: ${averageTime.toFixed(2)}ms for ${concurrentRequests} requests`);

      // Validate concurrent performance
      expect(averageTime).toBeLessThan(2000); // 2 seconds average under concurrency
      expect(results.length).toBe(concurrentRequests);
      expect(results.filter(r => r !== undefined).length).toBe(concurrentRequests);

      // Check that no request took excessively long
      expect(totalTime).toBeLessThan(15000); // 15 seconds total for 20 concurrent requests
    }, 20000); // 20 second timeout for concurrent test
  });

  describe('Caching Strategy Effectiveness', () => {
    it('should demonstrate cache hit ratio improvements', async () => {
      const request = {
        location: 'Bloemfontein',
        propertyType: 'house',
        period: '6months' as const,
      };

      const mockRedis = require('ioredis');
      const axios = require('axios');

      // First request - cache miss
      mockRedis.Redis.prototype.get.mockResolvedValueOnce(null);
      axios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValueOnce({
          data: {
            data: {
              properties: [],
              marketStats: {
                averagePrice: 1600000,
                medianPrice: 1550000,
                pricePerSqm: 11000,
                totalListings: 80,
                soldListings: 25,
                averageDaysOnMarket: 20,
                priceTrend: 'upward',
                trendPercentage: 4.2,
              },
            },
          },
        }),
      }));

      const firstRequestStart = performance.now();
      await marketDataService.getMarketData(request);
      const firstRequestTime = performance.now() - firstRequestStart;

      // Second request - cache hit
      const cachedData = {
        data: {
          location: 'Bloemfontein',
          propertyType: 'house',
          averagePrice: 1600000,
          dataPeriod: '6months',
          lastUpdated: new Date(),
          comparableSales: [],
          cached: false,
        },
        expiry: new Date(Date.now() + 3600000),
      };

      mockRedis.Redis.prototype.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const secondRequestStart = performance.now();
      const result = await marketDataService.getMarketData(request);
      const secondRequestTime = performance.now() - secondRequestStart;

      const performanceImprovement = ((firstRequestTime - secondRequestTime) / firstRequestTime) * 100;

      console.log(`Cache effectiveness test - First request: ${firstRequestTime.toFixed(2)}ms, Cached request: ${secondRequestTime.toFixed(2)}ms, Improvement: ${performanceImprovement.toFixed(1)}%`);

      // Validate caching effectiveness
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
      expect(performanceImprovement).toBeGreaterThan(50); // At least 50% improvement
      expect(result.cached).toBe(true);
    });
  });

  describe('Database Query Optimization', () => {
    it('should efficiently query market data with proper indexing', async () => {
      const request = {
        location: 'East London',
        propertyType: 'apartment',
        period: '3months' as const,
      };

      // Mock database query with realistic timing
      const mockPrisma = require('@prisma/client');
      mockPrisma.PrismaClient.prototype.marketData.findFirst.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          location: 'east london',
          propertyType: 'apartment',
          dataPeriod: '3months',
          averagePrice: 1400000,
          medianPrice: 1350000,
          pricePerSqm: 9500,
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          comparableSales: [],
        }), 10)) // 10ms database query time
      );

      const startTime = performance.now();

      const result = await marketDataService.getMarketData(request);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      console.log(`Database query optimization test - Response time: ${responseTime.toFixed(2)}ms`);

      // Database queries should be fast when data exists
      expect(responseTime).toBeLessThan(500); // 500ms for database + processing
      expect(result).toBeDefined();
      expect(result.cached).toBe(false); // From database, not cache
    });
  });
});
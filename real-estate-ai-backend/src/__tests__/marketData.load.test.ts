import { MarketDataService } from '../services/marketData.js';

// Mock external dependencies to avoid actual API calls during load testing
jest.mock('ioredis');
jest.mock('@prisma/client');
jest.mock('axios');
jest.mock('../config/index.js');
jest.mock('../middleware/gdprLogger.js');

describe('Market Data Load Tests', () => {
  let marketDataService: MarketDataService;

  beforeAll(async () => {
    marketDataService = new MarketDataService();
  });

  afterAll(async () => {
    await marketDataService.disconnect();
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests within time limits', async () => {
      const locations = ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'];
      const propertyTypes = ['house', 'apartment', 'townhouse'];
      const periods = ['3months', '6months', '1year'];

      const generateRequest = () => ({
        location: locations[Math.floor(Math.random() * locations.length)],
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        period: periods[Math.floor(Math.random() * periods.length)] as '3months' | '6months' | '1year',
      });

      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () => generateRequest());

      const startTime = Date.now();

      // Execute all requests concurrently
      const promises = requests.map(request => marketDataService.getMarketData(request));

      // Use Promise.allSettled to handle both resolved and rejected promises
      const results = await Promise.allSettled(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentRequests;

      console.log(`Load test results:
        Total time: ${totalTime}ms
        Average time per request: ${averageTime}ms
        Successful requests: ${results.filter(r => r.status === 'fulfilled').length}
        Failed requests: ${results.filter(r => r.status === 'rejected').length}`);

      // Performance assertions
      expect(averageTime).toBeLessThan(2000); // Average response time < 2 seconds
      expect(totalTime).toBeLessThan(10000); // Total time for 10 concurrent requests < 10 seconds

      // At least 80% success rate
      const successRate = (results.filter(r => r.status === 'fulfilled').length / concurrentRequests) * 100;
      expect(successRate).toBeGreaterThanOrEqual(80);
    }, 15000); // 15 second timeout for load test
  });

  describe('Rate Limiting Under Load', () => {
    it('should properly enforce rate limits under concurrent load', async () => {
      const requests = Array.from({ length: 50 }, () => ({
        location: 'Cape Town',
        propertyType: 'house',
        period: '6months' as const,
      }));

      const startTime = Date.now();

      // Execute requests with small delay between batches to test rate limiting
      const results = [];
      for (let i = 0; i < requests.length; i += 5) {
        const batch = requests.slice(i, i + 5);
        const batchPromises = batch.map(request => marketDataService.getMarketData(request));
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      const rateLimitedRequests = results.filter(r =>
        r.status === 'rejected' &&
        r.reason?.message?.includes('Rate limit exceeded')
      ).length;

      console.log(`Rate limiting test results:
        Total requests: ${requests.length}
        Successful: ${successfulRequests}
        Rate limited: ${rateLimitedRequests}
        Total time: ${totalTime}ms`);

      // Should have some successful requests and some rate limited
      expect(successfulRequests).toBeGreaterThan(0);
      expect(rateLimitedRequests).toBeGreaterThan(0);
    }, 30000); // 30 second timeout
  });

  describe('Memory Usage Under Load', () => {
    it('should not have excessive memory growth under load', async () => {
      const initialMemory = process.memoryUsage();

      const requests = Array.from({ length: 20 }, () => ({
        location: 'Johannesburg',
        propertyType: 'apartment',
        period: '3months' as const,
      }));

      // Execute requests sequentially to test memory usage
      for (const request of requests) {
        await marketDataService.getMarketData(request);
        // Force garbage collection if available (in test environments)
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory usage test results:
        Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be reasonable (< 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 60000); // 60 second timeout for memory test
  });

  describe('Cache Performance Under Load', () => {
    it('should serve cached data faster than fresh data', async () => {
      const request = {
        location: 'Durban',
        propertyType: 'house',
        period: '6months' as const,
      };

      // First request (should fetch fresh data)
      const freshStartTime = Date.now();
      await marketDataService.getMarketData(request);
      const freshTime = Date.now() - freshStartTime;

      // Second request (should use cache)
      const cachedStartTime = Date.now();
      await marketDataService.getMarketData(request);
      const cachedTime = Date.now() - cachedStartTime;

      console.log(`Cache performance test results:
        Fresh data time: ${freshTime}ms
        Cached data time: ${cachedTime}ms
        Performance improvement: ${((freshTime - cachedTime) / freshTime * 100).toFixed(1)}%`);

      // Cached requests should be significantly faster
      expect(cachedTime).toBeLessThan(freshTime);
      expect(cachedTime).toBeLessThan(500); // Cached data should be very fast
    });
  });

  describe('Error Recovery Under Load', () => {
    it('should recover gracefully from intermittent failures', async () => {
      // This test would require mocking intermittent API failures
      // For now, we'll test with a basic scenario

      const requests = Array.from({ length: 15 }, (_, i) => ({
        location: `TestCity${i}`,
        propertyType: 'house',
        period: '6months' as const,
      }));

      const results = await Promise.allSettled(
        requests.map(request => marketDataService.getMarketData(request))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Error recovery test results:
        Total requests: ${requests.length}
        Successful: ${successful}
        Failed: ${failed}
        Success rate: ${((successful / requests.length) * 100).toFixed(1)}%`);

      // Should maintain reasonable success rate even with potential failures
      const successRate = (successful / requests.length) * 100;
      expect(successRate).toBeGreaterThanOrEqual(70);
    }, 45000); // 45 second timeout
  });
});
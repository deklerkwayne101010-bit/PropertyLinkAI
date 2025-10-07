import request from 'supertest';
import express from 'express';
import marketDataRoutes from '../routes/marketData.js';
import { MarketDataService } from '../services/marketData.js';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
jest.mock('../services/marketData.js');
jest.mock('@prisma/client');

const prisma = new PrismaClient();
const mockMarketDataService = MarketDataService as jest.MockedClass<typeof MarketDataService>;

describe('Market Data API End-to-End Tests', () => {
  let app: express.Application;
  let mockMarketDataServiceInstance: jest.Mocked<MarketDataService>;

  beforeAll(async () => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use('/api/market-data', (req: any, res, next) => {
      req.user = { id: 'test-user-id', email: 'test@example.com', subscriptionTier: 'premium' };
      next();
    });

    app.use('/api/market-data', marketDataRoutes);

    // Setup service mock
    mockMarketDataServiceInstance = {
      getMarketData: jest.fn(),
      healthCheck: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    mockMarketDataService.mockImplementation(() => mockMarketDataServiceInstance);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/market-data/:location', () => {
    it('should return market data for a valid location', async () => {
      const mockResponse = {
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

      mockMarketDataServiceInstance.getMarketData.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/market-data/Cape%20Town')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(mockMarketDataServiceInstance.getMarketData).toHaveBeenCalledWith({
        location: 'Cape Town',
        propertyType: 'house',
        period: '6months',
      });
    });

    it('should handle query parameters correctly', async () => {
      const mockResponse = {
        location: 'Johannesburg',
        propertyType: 'apartment',
        dataPeriod: '3months',
        lastUpdated: new Date(),
        comparableSales: [],
        cached: false,
      };

      mockMarketDataServiceInstance.getMarketData.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/market-data/Johannesburg?propertyType=apartment&period=3months')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockMarketDataServiceInstance.getMarketData).toHaveBeenCalledWith({
        location: 'Johannesburg',
        propertyType: 'apartment',
        period: '3months',
      });
    });

    it('should handle rate limiting errors', async () => {
      mockMarketDataServiceInstance.getMarketData.mockRejectedValue(
        new Error('Rate limit exceeded for market data requests')
      );

      const response = await request(app)
        .get('/api/market-data/Pretoria')
        .expect(429);

      expect(response.body.error).toBe('Too many requests. Please try again later.');
    });

    it('should handle service unavailable errors', async () => {
      mockMarketDataServiceInstance.getMarketData.mockRejectedValue(
        new Error('Market data service temporarily unavailable')
      );

      const response = await request(app)
        .get('/api/market-data/Durban')
        .expect(503);

      expect(response.body.error).toBe('Market data service temporarily unavailable. Please try again later.');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .get('/api/market-data/')
        .expect(404); // Express will handle empty params as 404

      // Test with invalid period
      mockMarketDataServiceInstance.getMarketData.mockRejectedValue(
        new Error('Invalid period specified')
      );

      const invalidPeriodResponse = await request(app)
        .get('/api/market-data/Cape%20Town?period=invalid')
        .expect(500);

      expect(invalidPeriodResponse.body.error).toBeDefined();
    });

    it('should require authentication', async () => {
      // Create app without auth middleware
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use('/api/market-data', marketDataRoutes);

      const response = await request(unauthApp)
        .get('/api/market-data/Cape%20Town')
        .expect(401); // Should fail without auth
    });
  });

  describe('GET /api/market-data/options', () => {
    it('should return available market data options', async () => {
      const response = await request(app)
        .get('/api/market-data/options')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('propertyTypes');
      expect(response.body.data).toHaveProperty('periods');
      expect(response.body.data).toHaveProperty('description');

      expect(Array.isArray(response.body.data.propertyTypes)).toBe(true);
      expect(Array.isArray(response.body.data.periods)).toBe(true);
      expect(response.body.data.propertyTypes).toContain('house');
      expect(response.body.data.periods).toContain('6months');
    });
  });

  describe('GET /api/market-data/admin/stats', () => {
    it('should return market data service stats for premium users', async () => {
      mockMarketDataServiceInstance.healthCheck.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/market-data/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('healthy');
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data.healthy).toBe(true);
      expect(response.body.data.service).toBe('MarketDataService');
    });

    it('should deny access to non-premium users', async () => {
      const nonPremiumApp = express();
      nonPremiumApp.use(express.json());

      // Mock non-premium user
      nonPremiumApp.use('/api/market-data', (req: any, res, next) => {
        req.user = { id: 'test-user-id', email: 'test@example.com', subscriptionTier: 'basic' };
        next();
      });

      nonPremiumApp.use('/api/market-data', marketDataRoutes);

      const response = await request(nonPremiumApp)
        .get('/api/market-data/admin/stats')
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected service errors', async () => {
      mockMarketDataServiceInstance.getMarketData.mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .get('/api/market-data/Test%20City')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBeUndefined(); // Should not expose internal errors in production
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .get('/api/market-data/Cape%20Town')
        .send({ invalidField: 'invalidValue' }) // Body in GET request
        .expect(200); // Express ignores body in GET, so it should work

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const mockResponse = {
        location: 'Cape Town',
        propertyType: 'house',
        dataPeriod: '6months',
        lastUpdated: new Date(),
        comparableSales: [],
        cached: true,
      };

      mockMarketDataServiceInstance.getMarketData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/market-data/Cape%20Town')
        .expect(200);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body.success).toBe(true);
    });
  });
});
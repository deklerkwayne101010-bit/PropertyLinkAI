import { Request, Response } from 'express';
import MarketDataService, { MarketDataRequest } from '../services/marketData.js';
import { ValidationError } from '../middleware/errorHandler.js';

const marketDataService = new MarketDataService();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

// Get market data for a location
export const getMarketData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { location } = req.params;
    const { propertyType, period } = req.query;

    if (!location) {
      throw new ValidationError('Location is required');
    }

    const request: MarketDataRequest = {
      location: location.trim(),
      ...(typeof propertyType === 'string' && { propertyType }),
      ...(typeof period === 'string' && ['3months', '6months', '1year'].includes(period) && {
        period: period as '3months' | '6months' | '1year'
      }),
    };

    const result = await marketDataService.getMarketData(request);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Market data retrieval error:', error);

    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('Rate limit exceeded')) {
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }
      if (error.message.includes('temporarily unavailable')) {
        res.status(503).json({ error: 'Market data service temporarily unavailable. Please try again later.' });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get market data statistics (admin endpoint)
export const getMarketDataStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user has admin access (you might want to implement proper admin check)
    if (req.user?.subscriptionTier !== 'premium') {
      res.status(403).json({
        error: 'Admin access required'
      });
      return;
    }

    const isHealthy = await marketDataService.healthCheck();

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        service: 'MarketDataService',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Market data stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get available market data options
export const getMarketDataOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyTypes = ['house', 'apartment', 'townhouse', 'duplex', 'vacant_land'];
    const periods = ['3months', '6months', '1year'];

    res.json({
      success: true,
      data: {
        propertyTypes,
        periods,
        description: 'Market data provides average prices, trends, and comparable sales for property valuation',
      },
    });
  } catch (error) {
    console.error('Get market data options error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
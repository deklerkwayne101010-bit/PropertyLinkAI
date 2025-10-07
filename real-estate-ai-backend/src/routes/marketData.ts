import express from 'express';
import { getMarketData, getMarketDataStats, getMarketDataOptions } from '../controllers/marketData.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get market data for a location
router.get('/:location', authenticateToken, getMarketData);

// Get market data options (available property types, periods, etc.)
router.get('/options', getMarketDataOptions);

// Get market data service statistics (admin only)
router.get('/admin/stats', authenticateToken, getMarketDataStats);

export default router;
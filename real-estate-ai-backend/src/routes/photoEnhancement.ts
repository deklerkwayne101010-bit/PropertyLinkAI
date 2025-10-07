import { Router } from 'express';
import {
  processEnhancement,
  getEnhancementStatus,
  getEnhancementHistory,
} from '../controllers/photoEnhancement';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/photo-enhancement/process
 * Process a photo enhancement request
 * Body: { orderId, originalName, userId?, enhancementOptions? }
 */
router.post('/process', processEnhancement);

/**
 * GET /api/photo-enhancement/status/:orderId
 * Get the status of a photo enhancement
 */
router.get('/status/:orderId', getEnhancementStatus);

/**
 * GET /api/photo-enhancement/history
 * Get user's photo enhancement history (requires authentication)
 */
router.get('/history', authenticateToken, getEnhancementHistory);

export default router;
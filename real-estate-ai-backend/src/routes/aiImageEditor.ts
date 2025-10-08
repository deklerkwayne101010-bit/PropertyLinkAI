import { Router } from 'express';
import {
  processImageEdit,
  getImageEditStatus,
  getImageEditHistory,
  deleteImageEdit,
} from '../controllers/aiImageEditor';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/ai-image-edit/process
 * Process an image with AI editing
 * Body: { image: string, prompt: string, imageName?: string, sessionId?: string }
 */
router.post('/process', processImageEdit);

/**
 * GET /api/ai-image-edit/status/:editId
 * Get the status of an image edit
 */
router.get('/status/:editId', getImageEditStatus);

/**
 * GET /api/ai-image-edit/history
 * Get user's image edit history (requires authentication)
 * Query: { limit?: number, offset?: number, status?: string }
 */
router.get('/history', authenticateToken, getImageEditHistory);

/**
 * DELETE /api/ai-image-edit/:editId
 * Delete an image edit from history (requires authentication)
 */
router.delete('/:editId', authenticateToken, deleteImageEdit);

export default router;
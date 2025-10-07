import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams, aiContentSchemas } from '../middleware/validation.js';
import {
  generateContent,
  previewContent,
  getGeneratedContent,
  getTemplates,
  getCacheStats,
  clearCache,
  getAIUsage,
  testAllTemplates,
} from '../controllers/aiContent.js';

const router = express.Router();

// All AI content routes require authentication
router.use(authenticateToken);

// Content generation endpoints with validation
router.post('/generate', validateBody(aiContentSchemas.generateContent), generateContent);
router.post('/preview', validateBody(aiContentSchemas.previewContent), previewContent);

// Content management endpoints with validation
router.get('/property/:propertyId', validateParams(aiContentSchemas.getGeneratedContent), getGeneratedContent);
router.get('/templates', getTemplates);

// Cache management endpoints (admin only)
router.get('/cache/stats', getCacheStats);
router.delete('/cache/clear', clearCache);

// Usage analytics endpoints with validation
router.get('/usage', validateQuery(aiContentSchemas.getAIUsage), getAIUsage);

// Testing endpoints (development only)
router.get('/test/:propertyId', authenticateToken, testAllTemplates);

export default router;
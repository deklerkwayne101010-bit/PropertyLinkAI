import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getPopularCategories,
  createCategoryValidation
} from '../controllers/category';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getCategories);
router.get('/popular', getPopularCategories);
router.get('/:id', getCategoryById);

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, createCategoryValidation, createCategory);
router.put('/:id', authenticateToken, requireAdmin, createCategoryValidation, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
import { Router } from 'express';
import {
  updateProfile,
  updateWorkerProfile,
  updateClientProfile,
  getUserProfile,
  getUserById,
  deleteAccount,
  updateProfileValidation,
  updateWorkerProfileValidation,
  updateClientProfileValidation,
} from '../controllers/user';
import { authenticateToken, requirePoster, requireDoer } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// Profile management routes
router.get('/profile', getUserProfile);
router.put('/profile', updateProfileValidation, updateProfile);

// Role-specific profile routes
router.put('/profile/worker', requireDoer, updateWorkerProfileValidation, updateWorkerProfile);
router.put('/profile/client', requirePoster, updateClientProfileValidation, updateClientProfile);

// User lookup routes
router.get('/:userId', getUserById);

// Account management
router.delete('/account', deleteAccount);

export default router;
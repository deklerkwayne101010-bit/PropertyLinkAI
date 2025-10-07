import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserProfile, updateUserProfile, deleteUserAccount } from '../controllers/user';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/account', deleteUserAccount);

export default router;
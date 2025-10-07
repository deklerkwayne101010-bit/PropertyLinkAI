import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  changePassword,
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

// Apply stricter rate limiting to authentication routes
router.use('/login', authRateLimit);
router.use('/register', authRateLimit);

// Public routes (no authentication required)
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/verify-email', verifyEmail);

// Protected routes (authentication required)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, changePasswordValidation, changePassword);

export default router;
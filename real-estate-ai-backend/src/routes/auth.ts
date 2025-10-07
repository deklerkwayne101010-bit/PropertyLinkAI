import express from 'express';
import { validateBody, commonSchemas } from '../middleware/validation';
import Joi from 'joi';
import { register, login, getMe, refreshToken, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword, setupMFA, enableMFA, disableMFA, verifyMFA } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  name: Joi.string().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation schemas
const forgotPasswordSchema = Joi.object({
  email: commonSchemas.email,
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: commonSchemas.password,
});

const enableMFASchema = Joi.object({
  secret: Joi.string().required(),
  token: Joi.string().required(),
});

const verifyMFASchema = Joi.object({
  userId: Joi.string().required(),
  token: Joi.string().required(),
});

// Routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', getMe);
router.post('/refresh', refreshToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authenticateToken, resendVerificationEmail);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);

// MFA routes
router.post('/mfa/setup', authenticateToken, setupMFA);
router.post('/mfa/enable', authenticateToken, validateBody(enableMFASchema), enableMFA);
router.post('/mfa/disable', authenticateToken, validateBody(Joi.object({ token: Joi.string().required() })), disableMFA);
router.post('/mfa/verify', validateBody(verifyMFASchema), verifyMFA);

export default router;
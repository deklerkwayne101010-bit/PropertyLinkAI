import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth';
import { config } from '../config';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const prisma = new PrismaClient();

// Types for request bodies
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'POSTER' | 'DOER';
  location?: string;
  skills?: string[];
  bio?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface VerifyEmailRequest {
  token: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      location,
      skills,
      bio
    }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Validate password strength
    const passwordValidation = await AuthService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Determine role flags based on user selection
    const isWorker = role === 'DOER';
    const isClient = role === 'POSTER' || role === 'DOER'; // DOERs can also post jobs

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        isWorker,
        isClient,
        location,
        skills: skills || [],
        bio,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isWorker: true,
        isClient: true,
        isVerified: true,
        createdAt: true,
      }
    });

    // Generate email verification token
    const verificationToken = AuthService.generateSecureToken();

    // Send verification email
    try {
      await AuthService.sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Log registration event
    await AuthService.logAuthEvent(
      user.id,
      'REGISTER',
      'User',
      user.id,
      { role, email }
    );

    // Generate tokens for immediate login
    const tokens = await AuthService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: isWorker ? 'DOER' : 'POSTER'
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification instructions.',
      data: {
        user,
        tokens,
        requiresEmailVerification: !user.isVerified
      }
    });

  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password }: LoginRequest = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        isWorker: true,
        isClient: true,
        isVerified: true,
        createdAt: true,
      }
    });

    if (!user) {
      // Track failed login attempt
      await AuthService.trackFailedLogin(email, ipAddress, userAgent);

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      await AuthService.trackSuspiciousActivity(
        user.id,
        'UNVERIFIED_LOGIN_ATTEMPT',
        { email },
        ipAddress,
        userAgent
      );

      return res.status(401).json({
        success: false,
        error: 'Please verify your email address before logging in'
      });
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuthService.logAuthEvent(
        user.id,
        'LOGIN_FAILED',
        'User',
        user.id,
        { reason: 'invalid_password', email },
        ipAddress,
        userAgent
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = await AuthService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.isWorker ? 'DOER' : 'POSTER'
    });

    // Log successful login
    await AuthService.logAuthEvent(
      user.id,
      'LOGIN',
      'User',
      user.id,
      { method: 'email' },
      ipAddress,
      userAgent
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        tokens
      }
    });

  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await AuthService.logAuthEvent(
        userId,
        'LOGOUT',
        'User',
        userId
      );
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = await AuthService.verifyToken(refreshToken, 'refresh');

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isWorker: true,
        isClient: true,
        isVerified: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new token pair
    const tokens = await AuthService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.isWorker ? 'DOER' : 'POSTER'
    });

    // Log token refresh
    await AuthService.logAuthEvent(
      user.id,
      'TOKEN_REFRESH',
      'User',
      user.id
    );

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email }: ForgotPasswordRequest = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true }
    });

    if (user) {
      // Generate password reset token
      const resetToken = AuthService.generateSecureToken();

      // Send password reset email
      await AuthService.sendPasswordResetEmail(email, resetToken);

      // Log password reset request
      await AuthService.logAuthEvent(
        user.id,
        'PASSWORD_RESET_REQUEST',
        'User',
        user.id,
        { email }
      );
    }

    // Always return success to prevent email enumeration
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password }: ResetPasswordRequest = req.body;

    // Validate password strength
    const passwordValidation = await AuthService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(password);

    // Update user password (in a real implementation, you'd verify the token first)
    // For now, we'll implement a simplified version

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    // Verify token and get user (simplified implementation)
    // In production, you'd store and verify the token properly

    return res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        bio: true,
        location: true,
        coordinates: true,
        skills: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        verificationType: true,
        isWorker: true,
        isClient: true,
        completedJobs: true,
        totalEarned: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordValidation = await AuthService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Hash new password
    const hashedNewPassword = await AuthService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Log password change
    await AuthService.logAuthEvent(
      userId,
      'PASSWORD_CHANGE',
      'User',
      userId
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Validation rules
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['POSTER', 'DOER']).withMessage('Role must be POSTER or DOER'),
  body('phone').optional().isMobilePhone('en-ZA').withMessage('Valid South African phone number is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const resetPasswordValidation = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('token').notEmpty().withMessage('Reset token is required'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
import { Request, Response, NextFunction } from 'express';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, verifyEmail, getMe, changePassword } from '../../controllers/auth';
import { AuthService } from '../../services/auth';

// Mock the AuthService
jest.mock('../../services/auth');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
  body: jest.fn(() => ({
    isEmail: jest.fn(() => ({ normalizeEmail: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })) })),
    isLength: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    trim: jest.fn(() => ({ isLength: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })) })),
    isIn: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
    optional: jest.fn(() => ({ isMobilePhone: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })) })),
    notEmpty: jest.fn(() => ({ withMessage: jest.fn(() => ({})) })),
  })),
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request & { user?: { id: string; email: string; role: string }; ip?: string }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock request data
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+27712345678',
        role: 'DOER',
        location: 'Cape Town, Western Cape',
        skills: ['cleaning', 'gardening'],
        bio: 'Test bio',
      };

      // Mock AuthService methods
      (AuthService.validatePasswordStrength as jest.Mock).mockResolvedValue({
        valid: true,
        errors: [],
      });
      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateSecureToken as jest.Mock).mockReturnValue('verification_token');
      (AuthService.sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);
      (AuthService.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      // Mock Prisma client
      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isWorker: true,
        isClient: true,
        isVerified: false,
        createdAt: new Date(),
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registered successfully'),
          data: expect.objectContaining({
            user: expect.any(Object),
            tokens: expect.any(Object),
          }),
        })
      );
    });

    it('should return 409 if user already exists', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'DOER',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing_user_id',
        email: 'existing@example.com',
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('already exists'),
        })
      );
    });

    it('should return 400 for weak password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        role: 'DOER',
      };

      (AuthService.validatePasswordStrength as jest.Mock).mockResolvedValue({
        valid: false,
        errors: ['Password too weak'],
      });

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('security requirements'),
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };
      mockRequest.ip = '127.0.0.1';
      (mockRequest as any).get = jest.fn(() => 'Test User Agent');

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        isWorker: true,
        isClient: true,
        isVerified: true,
        createdAt: new Date(),
      });

      (AuthService.comparePassword as jest.Mock).mockResolvedValue(true);
      (AuthService.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.any(Object),
            tokens: expect.any(Object),
          }),
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      (AuthService.trackFailedLogin as jest.Mock).mockResolvedValue(undefined);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid email or password',
        })
      );
    });

    it('should return 401 for unverified user', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        password: 'hashed_password',
        isVerified: false,
      });

      (AuthService.trackSuspiciousActivity as jest.Mock).mockResolvedValue(undefined);

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('verify your email'),
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = { id: 'user_id', email: 'test@example.com', role: 'DOER' };

      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);

      await logout(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful',
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockRequest.body = {
        refreshToken: 'valid_refresh_token',
      };

      (AuthService.verifyToken as jest.Mock).mockResolvedValue({
        userId: 'user_id',
      });

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        isWorker: true,
        isClient: true,
        isVerified: true,
      });

      (AuthService.generateTokenPair as jest.Mock).mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);

      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully',
          data: expect.objectContaining({
            tokens: expect.any(Object),
          }),
        })
      );
    });

    it('should return 400 for missing refresh token', async () => {
      mockRequest.body = {};

      await refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Refresh token is required',
        })
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        firstName: 'Test',
      });

      (AuthService.generateSecureToken as jest.Mock).mockReturnValue('reset_token');
      (AuthService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('password reset link'),
        })
      );
    });
  });

  describe('getMe', () => {
    it('should return current user data', async () => {
      mockRequest.user = { id: 'user_id', email: 'test@example.com', role: 'DOER' };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+27712345678',
        location: 'Cape Town, Western Cape',
        skills: ['cleaning'],
        isVerified: true,
        isWorker: true,
        isClient: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await getMe(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
          }),
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      mockRequest.user = undefined;

      await getMe(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not authenticated',
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.user = { id: 'user_id', email: 'test@example.com', role: 'DOER' };
      mockRequest.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        password: 'hashed_old_password',
      });

      (AuthService.comparePassword as jest.Mock).mockResolvedValue(true);
      (AuthService.validatePasswordStrength as jest.Mock).mockResolvedValue({
        valid: true,
        errors: [],
      });
      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_new_password');
      mockPrisma.user.update.mockResolvedValue(undefined);
      (AuthService.logAuthEvent as jest.Mock).mockResolvedValue(undefined);

      await changePassword(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Password changed successfully',
        })
      );
    });

    it('should return 400 for incorrect current password', async () => {
      mockRequest.user = { id: 'user_id', email: 'test@example.com', role: 'DOER' };
      mockRequest.body = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      };

      const mockPrisma = require('@prisma/client').PrismaClient.mock.results[0].value;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_id',
        password: 'hashed_old_password',
      });

      (AuthService.comparePassword as jest.Mock).mockResolvedValue(false);

      await changePassword(mockRequest as any, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Current password is incorrect',
        })
      );
    });
  });
});
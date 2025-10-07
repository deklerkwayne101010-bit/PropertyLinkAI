import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth';

const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isWorker: boolean;
    isClient: boolean;
  };
}

// Types for request bodies
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  skills?: string[];
  profileImage?: string;
}

interface UpdateWorkerProfileRequest {
  skills: string[];
  bio?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  profileImage?: string;
  portfolio?: string[];
  certifications?: string[];
  experience?: string;
  availability?: string;
}

interface UpdateClientProfileRequest {
  bio?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  profileImage?: string;
  preferences?: string[];
  budget?: number;
}

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const updateData: UpdateProfileRequest = req.body;

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateProfileRequest] === undefined) {
        delete updateData[key as keyof UpdateProfileRequest];
      }
    });

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        isWorker: true,
        isClient: true,
        completedJobs: true,
        totalEarned: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Log profile update
    await AuthService.logAuthEvent(
      userId,
      'PROFILE_UPDATE',
      'User',
      userId,
      { updatedFields: Object.keys(updateData) }
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    next(error);
  }
};

export const updateWorkerProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify user is a worker
    if (!req.user?.isWorker) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Worker profile required'
      });
    }

    const {
      skills,
      bio,
      location,
      coordinates,
      profileImage,
      portfolio,
      certifications,
      experience,
      availability
    }: UpdateWorkerProfileRequest = req.body;

    // Update user profile with worker-specific fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        skills,
        bio,
        location,
        coordinates,
        profileImage,
      },
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
        isWorker: true,
        isClient: true,
        completedJobs: true,
        totalEarned: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Log worker profile update
    await AuthService.logAuthEvent(
      userId,
      'WORKER_PROFILE_UPDATE',
      'User',
      userId,
      { updatedFields: ['skills', 'bio', 'location', 'coordinates', 'profileImage'] }
    );

    return res.json({
      success: true,
      message: 'Worker profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    next(error);
  }
};

export const updateClientProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify user is a client
    if (!req.user?.isClient) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Client profile required'
      });
    }

    const {
      bio,
      location,
      coordinates,
      profileImage,
      preferences,
      budget
    }: UpdateClientProfileRequest = req.body;

    // Update user profile with client-specific fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        location,
        coordinates,
        profileImage,
      },
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
        isWorker: true,
        isClient: true,
        completedJobs: true,
        totalEarned: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Log client profile update
    await AuthService.logAuthEvent(
      userId,
      'CLIENT_PROFILE_UPDATE',
      'User',
      userId,
      { updatedFields: ['bio', 'location', 'coordinates', 'profileImage'] }
    );

    return res.json({
      success: true,
      message: 'Client profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bio: true,
        location: true,
        skills: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        isWorker: true,
        isClient: true,
        completedJobs: true,
        totalEarned: true,
        createdAt: true,
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

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Soft delete - set account as inactive instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        // You might want to add an 'isActive' field to your schema for proper soft deletes
      }
    });

    // Log account deletion
    await AuthService.logAuthEvent(
      userId,
      'ACCOUNT_DELETION',
      'User',
      userId,
      { method: 'soft_delete' }
    );

    return res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Validation rules
export const updateProfileValidation = [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone('en-ZA').withMessage('Valid South African phone number is required'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
  body('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];

export const updateWorkerProfileValidation = [
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
  body('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
  body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];

export const updateClientProfileValidation = [
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
  body('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
  body('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];
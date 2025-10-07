import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
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

// JWT Authentication middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    // Verify access token
    const decoded = await AuthService.verifyToken(token, 'access');

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

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Email not verified'
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.isWorker ? 'DOER' : 'POSTER',
      isWorker: user.isWorker,
      isClient: user.isClient,
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
    return;
  }
};

// Role-based authorization middleware factory
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: {
            required: allowedRoles,
            current: userRole
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Specific role middleware functions
export const requirePoster = authorizeRoles('POSTER');
export const requireDoer = authorizeRoles('DOER');
export const requireAdmin = authorizeRoles('ADMIN');
export const requirePosterOrDoer = authorizeRoles('POSTER', 'DOER');
export const requireAnyRole = authorizeRoles('POSTER', 'DOER', 'ADMIN');

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = await AuthService.verifyToken(token, 'access');

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

      if (user && user.isVerified) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.isWorker ? 'DOER' : 'POSTER',
          isWorker: user.isWorker,
          isClient: user.isClient,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Middleware to check if user owns resource or is admin
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
      const currentUserId = req.user.id;
      const userRole = req.user.role;

      // Admin can access any resource
      if (userRole === 'ADMIN') {
        return next();
      }

      // Users can only access their own resources
      if (resourceUserId !== currentUserId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: can only access your own resources'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware to check if user can access specific job
export const requireJobAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const jobId = req.params.jobId || req.body.jobId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Get job with poster and worker info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        posterId: true,
        workerId: true,
        status: true,
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Admin can access any job
    if (userRole === 'ADMIN') {
      return next();
    }

    // Poster can access their own jobs
    if (userRole === 'POSTER' && job.posterId === userId) {
      return next();
    }

    // Worker can access assigned jobs
    if (userRole === 'DOER' && job.workerId === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Access denied: insufficient permissions for this job'
    });

  } catch (error) {
    next(error);
  }
};
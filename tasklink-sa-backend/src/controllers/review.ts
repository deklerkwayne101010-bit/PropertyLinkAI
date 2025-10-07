import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

// Define enums locally since they're not exported from Prisma
enum JobStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

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

const prisma = new PrismaClient();

// Types for request bodies and responses
interface CreateReviewRequest {
  rating: number;
  comment?: string;
  jobId: string;
  revieweeId: string;
  isPublic?: boolean;
}

interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  isPublic?: boolean;
}

interface ReviewSearchQuery {
  userId?: string;
  jobId?: string;
  reviewerId?: string;
  revieweeId?: string;
  minRating?: number;
  maxRating?: number;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Validation rules
export const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('revieweeId').notEmpty().withMessage('Reviewee ID is required'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
];

export const updateReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
];

export const reviewSearchValidation = [
  query('minRating').optional().isInt({ min: 1, max: 5 }).withMessage('Minimum rating must be 1-5'),
  query('maxRating').optional().isInt({ min: 1, max: 5 }).withMessage('Maximum rating must be 1-5'),
  query('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

// Helper function to check if user can review a job
const canUserReviewJob = async (userId: string, jobId: string): Promise<{
  canReview: boolean;
  reason?: string;
  job?: any;
  userRole?: 'poster' | 'worker';
}> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      poster: { select: { id: true } },
      worker: { select: { id: true } }
    }
  });

  if (!job) {
    return { canReview: false, reason: 'Job not found' };
  }

  if (job.status !== JobStatus.COMPLETED) {
    return { canReview: false, reason: 'Can only review completed jobs', job };
  }

  // Check if user is either the poster or the assigned worker
  if (job.posterId === userId) {
    return { canReview: true, job, userRole: 'poster' };
  }

  if (job.workerId === userId) {
    return { canReview: true, job, userRole: 'worker' };
  }

  return { canReview: false, reason: 'User is not a participant in this job', job };
};

// Helper function to check if user already reviewed a job
const hasUserReviewedJob = async (userId: string, jobId: string): Promise<boolean> => {
  const existingReview = await prisma.review.findFirst({
    where: {
      jobId,
      reviewerId: userId
    }
  });

  return !!existingReview;
};

// Helper function to calculate user rating
const calculateUserRating = async (userId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}> => {
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: userId,
      isPublic: true
    },
    select: { rating: true }
  });

  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
  }

  const totalReviews = reviews.length;
  const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let sum = 0;
  reviews.forEach((review: any) => {
    sum += review.rating;
    ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
  });

  const averageRating = Math.round((sum / totalReviews) * 10) / 10;

  return { averageRating, totalReviews, ratingDistribution };
};

// Helper function to update user rating and review count
const updateUserRating = async (userId: string): Promise<void> => {
  const { averageRating, totalReviews } = await calculateUserRating(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      rating: averageRating,
      reviewCount: totalReviews
    }
  });
};

// Helper function to create review notification
const createReviewNotification = async (
  reviewerId: string,
  revieweeId: string,
  jobId: string,
  reviewId: string
): Promise<void> => {
  const [reviewer, reviewee, job] = await Promise.all([
    prisma.user.findUnique({ where: { id: reviewerId }, select: { firstName: true, lastName: true } }),
    prisma.user.findUnique({ where: { id: revieweeId }, select: { firstName: true, lastName: true } }),
    prisma.job.findUnique({ where: { id: jobId }, select: { title: true } })
  ]);

  if (reviewer && reviewee && job) {
    await prisma.notification.create({
      data: {
        userId: revieweeId,
        title: 'New Review Received',
        message: `${reviewer.firstName} ${reviewer.lastName} left you a review for "${job.title}"`,
        type: 'REVIEW_RECEIVED',
        jobId,
        actionUrl: `/reviews/${reviewId}`
      }
    });
  }
};

// Create a new review
export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const reviewData: CreateReviewRequest = req.body;

    // Check if user can review this job
    const { canReview, reason, job, userRole } = await canUserReviewJob(userId, reviewData.jobId);

    if (!canReview) {
      return res.status(400).json({
        success: false,
        error: reason || 'Cannot create review for this job'
      });
    }

    // Check if user already reviewed this job
    const alreadyReviewed = await hasUserReviewedJob(userId, reviewData.jobId);
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this job'
      });
    }

    // Determine the reviewee (the other party in the job)
    let revieweeId = reviewData.revieweeId;
    if (!revieweeId) {
      if (userRole === 'poster') {
        revieweeId = job!.workerId!;
      } else {
        revieweeId = job!.posterId;
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: reviewData.rating,
        comment: reviewData.comment,
        jobId: reviewData.jobId,
        reviewerId: userId,
        revieweeId,
        isPublic: reviewData.isPublic ?? true
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    // Update the reviewee's rating and review count
    await updateUserRating(revieweeId);

    // Create notification for the reviewee
    await createReviewNotification(userId, revieweeId, reviewData.jobId, review.id);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review }
    });

  } catch (error) {
    next(error);
  }
};

// Get review by ID
export const getReviewById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            reviewCount: true
          }
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            reviewCount: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if review is public or if user is the reviewer/reviewee
    const userId = req.user?.id;
    if (!review.isPublic && userId !== review.reviewerId && userId !== review.revieweeId) {
      return res.status(403).json({
        success: false,
        error: 'This review is private'
      });
    }

    return res.json({
      success: true,
      data: { review }
    });

  } catch (error) {
    next(error);
  }
};

// Update own review
export const updateReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const { id } = req.params;
    const userId = req.user?.id;
    const updateData: UpdateReviewRequest = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if review exists and user owns it
    const existingReview = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        reviewerId: true,
        revieweeId: true,
        createdAt: true,
        rating: true,
        comment: true,
        isPublic: true
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (existingReview.reviewerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own reviews'
      });
    }

    // Check if review can still be edited (24-hour window)
    const reviewAge = Date.now() - existingReview.createdAt.getTime();
    const editWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (reviewAge > editWindow) {
      return res.status(400).json({
        success: false,
        error: 'Reviews can only be edited within 24 hours of submission'
      });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true
          }
        }
      }
    });

    // Update the reviewee's rating if rating changed
    if (updateData.rating && updateData.rating !== existingReview.rating) {
      await updateUserRating(existingReview.revieweeId);
    }

    return res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview }
    });

  } catch (error) {
    next(error);
  }
};

// Delete own review
export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if review exists and user owns it
    const existingReview = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        reviewerId: true,
        revieweeId: true,
        createdAt: true,
        rating: true
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (existingReview.reviewerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own reviews'
      });
    }

    // Check if review can still be deleted (30-day window)
    const reviewAge = Date.now() - existingReview.createdAt.getTime();
    const deleteWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (reviewAge > deleteWindow) {
      return res.status(400).json({
        success: false,
        error: 'Reviews can only be deleted within 30 days of submission'
      });
    }

    // Delete review
    await prisma.review.delete({
      where: { id }
    });

    // Update the reviewee's rating and review count
    await updateUserRating(existingReview.revieweeId);

    return res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific user
export const getUserReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const { userId } = req.params;
    const queryData: ReviewSearchQuery = req.query;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Build where clause
    const where: any = {
      revieweeId: userId,
      isPublic: true
    };

    // If user is requesting their own reviews, show all (including private)
    if (currentUserId === userId) {
      delete where.isPublic;
    }

    if (queryData.minRating) {
      where.rating = { ...where.rating, gte: queryData.minRating };
    }

    if (queryData.maxRating) {
      where.rating = { ...where.rating, lte: queryData.maxRating };
    }

    // Pagination
    const page = parseInt(queryData.page?.toString() || '1');
    const limit = Math.min(parseInt(queryData.limit?.toString() || '20'), 100);
    const skip = (page - 1) * limit;

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (queryData.sortBy) {
      orderBy = { [queryData.sortBy]: queryData.sortOrder || 'desc' };
    }

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            reviewCount: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
            completedAt: true
          }
        }
      },
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.review.count({ where });

    // Get user's rating statistics
    const ratingStats = await calculateUserRating(userId);

    return res.json({
      success: true,
      data: {
        reviews,
        ratingStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific job
export const getJobReviews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Check if job exists and is completed
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true, posterId: true, workerId: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== JobStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Reviews are only available for completed jobs'
      });
    }

    // Check if user is a participant in the job
    const isParticipant = userId === job.posterId || userId === job.workerId;
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You can only view reviews for jobs you participated in'
      });
    }

    const reviews = await prisma.review.findMany({
      where: { jobId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            reviewCount: true
          }
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            reviewCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: { reviews, jobId }
    });

  } catch (error) {
    next(error);
  }
};

// Get user's overall rating and statistics
export const getUserRating = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rating: true,
        reviewCount: true,
        profileImage: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const ratingStats = await calculateUserRating(userId);

    return res.json({
      success: true,
      data: {
        user,
        ...ratingStats
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get detailed rating statistics for a user
export const getUserRatingStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const ratingStats = await calculateUserRating(userId);

    // Get recent reviews for trend analysis
    const recentReviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        isPublic: true
      },
      select: {
        rating: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Calculate rating trends (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentReviews30Days = recentReviews.filter((r: any) => r.createdAt >= thirtyDaysAgo);
    const previousReviews30Days = recentReviews.filter((r: any) =>
      r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo
    );

    const currentPeriodAvg = recentReviews30Days.length > 0
      ? recentReviews30Days.reduce((sum: number, r: any) => sum + r.rating, 0) / recentReviews30Days.length
      : 0;

    const previousPeriodAvg = previousReviews30Days.length > 0
      ? previousReviews30Days.reduce((sum: number, r: any) => sum + r.rating, 0) / previousReviews30Days.length
      : 0;

    const trend = currentPeriodAvg - previousPeriodAvg;

    return res.json({
      success: true,
      data: {
        ...ratingStats,
        trend: Math.round(trend * 10) / 10,
        trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        recentReviewsCount: recentReviews30Days.length,
        previousReviewsCount: previousReviews30Days.length,
        ratingDistribution: ratingStats.ratingDistribution
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get rating breakdown for a user
export const getUserRatingBreakdown = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const ratingStats = await calculateUserRating(userId);

    // Get reviews by category if needed (for future enhancement)
    const categoryBreakdown: { [category: string]: { average: number; count: number } } = {};

    return res.json({
      success: true,
      data: {
        ...ratingStats,
        categoryBreakdown
      }
    });

  } catch (error) {
    next(error);
  }
};
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Extend Request interface for admin
interface AdminAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Types for admin requests
interface UserStatusUpdateRequest {
  status: 'ACTIVE' | 'SUSPENDED';
  reason?: string;
}

interface JobModerationRequest {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

interface PaymentRefundRequest {
  reason: string;
  amount?: number;
}

interface DisputeResolutionRequest {
  resolution: string;
  action: 'RESOLVE' | 'ESCALATE' | 'CLOSE';
}

interface AnnouncementRequest {
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  targetAudience?: 'ALL' | 'CLIENTS' | 'WORKERS';
}

// Audit logging helper
const logAdminAction = async (
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) => {
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    },
  });
};

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      if (role === 'ADMIN') {
        where.role = 'ADMIN';
      } else if (role === 'WORKER') {
        where.isWorker = true;
      } else if (role === 'CLIENT') {
        where.isClient = true;
      }
    }

    if (status) {
      if (status === 'SUSPENDED') {
        where.isSuspended = true;
      } else if (status === 'ACTIVE') {
        where.isSuspended = false;
      }
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        role: true,
        isWorker: true,
        isClient: true,
        isVerified: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
        rating: true,
        reviewCount: true,
        completedJobs: true,
        totalEarned: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            postedJobs: true,
            takenJobs: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.user.count({ where });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'USER_LIST_VIEW',
      'User',
      'BULK',
      undefined,
      { filters: req.query },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDetails = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        postedJobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        takenJobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviewsReceived: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'USER_DETAIL_VIEW',
      'User',
      id,
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { status, reason }: UserStatusUpdateRequest = req.body;

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
        suspendedBy: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: status === 'SUSPENDED',
        suspensionReason: status === 'SUSPENDED' ? reason : null,
        suspendedAt: status === 'SUSPENDED' ? new Date() : null,
        suspendedBy: status === 'SUSPENDED' ? req.user?.id ?? 'system' : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuspended: true,
        suspensionReason: true,
        suspendedAt: true,
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      `USER_${status}`,
      'User',
      id,
      {
        isSuspended: currentUser.isSuspended,
        suspensionReason: currentUser.suspensionReason,
      },
      {
        isSuspended: updatedUser.isSuspended,
        suspensionReason: updatedUser.suspensionReason,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: `User ${status.toLowerCase()} successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isVerified: true,
        verificationType: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user verification
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isVerified: true,
        verificationType: 'admin',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        verificationType: true,
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'USER_VERIFY',
      'User',
      id,
      {
        isVerified: currentUser.isVerified,
        verificationType: currentUser.verificationType,
      },
      {
        isVerified: updatedUser.isVerified,
        verificationType: updatedUser.verificationType,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: 'User verified successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get user data for audit log before deletion
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Soft delete by updating fields (in production, you might want hard delete)
    await prisma.user.update({
      where: { id },
      data: {
        email: `deleted_${user.id}@deleted.local`,
        firstName: '[DELETED]',
        lastName: '[USER]',
        isSuspended: true,
        suspensionReason: 'Account deleted by admin',
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'USER_DELETE',
      'User',
      id,
      user,
      { deleted: true },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      verifiedUsers,
      unverifiedUsers,
      workers,
      clients,
      admins,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSuspended: false } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { isWorker: true } }),
      prisma.user.count({ where: { isClient: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Location distribution
    const locationStats = await prisma.user.groupBy({
      by: ['location'],
      where: { location: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Registration trends (last 30 days)
    const registrationTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= DATE('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          verifiedUsers,
          unverifiedUsers,
          workers,
          clients,
          admins,
        },
        growth: {
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
        },
        demographics: {
          locationDistribution: locationStats,
          registrationTrends,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== JOB MODERATION ====================

export const getAllJobs = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        poster: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            rating: true,
          },
        },
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            rating: true,
          },
        },
        _count: {
          select: {
            applications: true,
            messages: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.job.count({ where });

    return res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const moderateJob = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { action, reason }: JobModerationRequest = req.body;

    // Get current job data for audit log
    const currentJob = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        posterId: true,
      },
    });

    if (!currentJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    let newStatus;
    if (action === 'APPROVE') {
      newStatus = 'OPEN';
    } else if (action === 'REJECT') {
      newStatus = 'CANCELLED';
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        title: true,
        status: true,
        poster: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      `JOB_${action}`,
      'Job',
      id,
      {
        status: currentJob.status,
      },
      {
        status: newStatus,
        reason,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: `Job ${action.toLowerCase()}d successfully`,
      data: { job: updatedJob },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get job data for audit log before deletion
    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        posterId: true,
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Delete job (cascade delete will handle related records)
    await prisma.job.delete({
      where: { id },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'JOB_DELETE',
      'Job',
      id,
      job,
      { deleted: true },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getJobStats = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalJobs,
      draftJobs,
      openJobs,
      assignedJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      disputedJobs,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'DRAFT' } }),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.job.count({ where: { status: 'ASSIGNED' } }),
      prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'CANCELLED' } }),
      prisma.job.count({ where: { status: 'DISPUTED' } }),
    ]);

    // Category distribution
    const categoryStats = await prisma.job.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Priority distribution
    const priorityStats = await prisma.job.groupBy({
      by: ['priority'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Jobs created trends (last 30 days)
    const creationTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM jobs
      WHERE createdAt >= DATE('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return res.json({
      success: true,
      data: {
        overview: {
          totalJobs,
          draftJobs,
          openJobs,
          assignedJobs,
          inProgressJobs,
          completedJobs,
          cancelledJobs,
          disputedJobs,
        },
        distribution: {
          byCategory: categoryStats,
          byPriority: priorityStats,
        },
        trends: {
          creationTrends,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PAYMENT ADMINISTRATION ====================

export const getAllPayments = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (amountMin || amountMax) {
      where.amount = {};
      if (amountMin) where.amount.gte = parseFloat(amountMin as string);
      if (amountMax) where.amount.lte = parseFloat(amountMax as string);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.payment.count({ where });

    return res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { reason, amount }: PaymentRefundRequest = req.body;

    // Get payment data for audit log
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded',
      });
    }

    const refundAmount = amount || payment.amount;

    // Update payment status to refunded
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'REFUNDED',
      },
      select: {
        id: true,
        amount: true,
        status: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'PAYMENT_REFUND',
      'Payment',
      id,
      {
        status: payment.status,
        amount: payment.amount,
      },
      {
        status: 'REFUNDED',
        refundAmount,
        reason,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: { payment: updatedPayment },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentAnalyticsOverview = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalRevenue,
      totalFees,
      totalRefunds,
      completedPayments,
      pendingPayments,
      failedPayments,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { fee: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'REFUNDED' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    // Revenue trends (last 30 days)
    const revenueTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        SUM(amount) as revenue,
        COUNT(*) as paymentCount
      FROM payments
      WHERE status = 'COMPLETED' AND createdAt >= DATE('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    // Payment method distribution
    const paymentMethodStats = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { paymentMethod: { not: null } },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalRevenue._sum.amount || 0,
          totalFees: totalFees._sum.fee || 0,
          totalRefunds: totalRefunds._sum.amount || 0,
          netRevenue: (totalRevenue._sum.amount || 0) - (totalRefunds._sum.amount || 0),
          completedPayments,
          pendingPayments,
          failedPayments,
        },
        trends: {
          revenueTrends,
        },
        distribution: {
          byPaymentMethod: paymentMethodStats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PLATFORM ANALYTICS ====================

export const getPlatformOverview = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalPayments,
      activeUsers,
      completedJobs,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.payment.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    // Calculate key metrics
    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    const averageRevenuePerJob = completedJobs > 0 ? (totalRevenue._sum.amount || 0) / completedJobs : 0;

    return res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalJobs,
          totalPayments,
          activeUsers,
          completedJobs,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        metrics: {
          completionRate: Math.round(completionRate * 100) / 100,
          averageRevenuePerJob: Math.round(averageRevenuePerJob * 100) / 100,
          userEngagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAnalytics = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // User growth over time
    const userGrowth = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as newUsers
      FROM users
      WHERE createdAt >= DATE('now', '-90 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    // User activity metrics
    const activityMetrics = await prisma.user.aggregate({
      _avg: {
        rating: true,
        completedJobs: true,
      },
      _count: {
        id: true,
      },
    });

    return res.json({
      success: true,
      data: {
        growth: userGrowth,
        metrics: activityMetrics,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobAnalytics = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Job completion trends
    const completionTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as totalJobs,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedJobs
      FROM jobs
      WHERE createdAt >= DATE('now', '-90 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return res.json({
      success: true,
      data: {
        trends: completionTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentAnalytics = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Payment trends
    const paymentTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        SUM(amount) as totalAmount,
        COUNT(*) as paymentCount
      FROM payments
      WHERE status = 'COMPLETED' AND createdAt >= DATE('now', '-90 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return res.json({
      success: true,
      data: {
        trends: paymentTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CONTENT MODERATION ====================

export const getAllReviews = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (rating) {
      where.rating = parseInt(rating as string);
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.review.count({ where });

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    // Get current review data for audit log
    const currentReview = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        rating: true,
        comment: true,
        isPublic: true,
      },
    });

    if (!currentReview) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    let updateData: any = {};

    if (action === 'HIDE') {
      updateData.isPublic = false;
    } else if (action === 'DELETE') {
      // Delete the review
      await prisma.review.delete({
        where: { id },
      });

      // Log admin action
      await logAdminAction(
        req.user?.id ?? 'system',
        'REVIEW_DELETE',
        'Review',
        id,
        currentReview,
        { deleted: true, reason },
        req.ip,
        req.get('User-Agent')
      );

      return res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    }

    // Update review visibility
    const updatedReview = await prisma.review.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        rating: true,
        comment: true,
        isPublic: true,
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      `REVIEW_${action}`,
      'Review',
      id,
      {
        isPublic: currentReview.isPublic,
      },
      {
        isPublic: updatedReview.isPublic,
        reason,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: `Review ${action.toLowerCase()}d successfully`,
      data: { review: updatedReview },
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewStats = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalReviews,
      publicReviews,
      privateReviews,
      averageRating,
      fiveStarReviews,
      fourStarReviews,
      threeStarReviews,
      twoStarReviews,
      oneStarReviews,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { isPublic: true } }),
      prisma.review.count({ where: { isPublic: false } }),
      prisma.review.aggregate({
        where: { isPublic: true },
        _avg: { rating: true },
      }),
      prisma.review.count({ where: { rating: 5, isPublic: true } }),
      prisma.review.count({ where: { rating: 4, isPublic: true } }),
      prisma.review.count({ where: { rating: 3, isPublic: true } }),
      prisma.review.count({ where: { rating: 2, isPublic: true } }),
      prisma.review.count({ where: { rating: 1, isPublic: true } }),
    ]);

    // Reviews created trends (last 30 days)
    const reviewTrends = await prisma.$queryRaw`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM reviews
      WHERE createdAt >= DATE('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    // Top reviewers and reviewees
    const topReviewers = await prisma.review.groupBy({
      by: ['reviewerId'],
      where: { isPublic: true },
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topReviewees = await prisma.review.groupBy({
      by: ['revieweeId'],
      where: { isPublic: true },
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get user details for top reviewers and reviewees
    const topReviewerIds = topReviewers.map((r: any) => r.reviewerId);
    const topRevieweeIds = topReviewees.map((r: any) => r.revieweeId);

    const [reviewerUsers, revieweeUsers] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: topReviewerIds } },
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      }),
      prisma.user.findMany({
        where: { id: { in: topRevieweeIds } },
        select: { id: true, firstName: true, lastName: true, profileImage: true },
      }),
    ]);

    const topReviewersWithDetails = topReviewers.map((reviewer: any) => ({
      ...reviewer,
      user: reviewerUsers.find((u: any) => u.id === reviewer.reviewerId),
    }));

    const topRevieweesWithDetails = topReviewees.map((reviewee: any) => ({
      ...reviewee,
      user: revieweeUsers.find((u: any) => u.id === reviewee.revieweeId),
    }));

    return res.json({
      success: true,
      data: {
        overview: {
          totalReviews,
          publicReviews,
          privateReviews,
          averageRating: Math.round((averageRating._avg.rating || 0) * 100) / 100,
        },
        distribution: {
          fiveStarReviews,
          fourStarReviews,
          threeStarReviews,
          twoStarReviews,
          oneStarReviews,
        },
        trends: {
          reviewTrends,
        },
        leaders: {
          topReviewers: topReviewersWithDetails,
          topReviewees: topRevieweesWithDetails,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SYSTEM MANAGEMENT ====================

export const getSystemHealth = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Database connectivity check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // System metrics (simplified - in production you'd use a monitoring service)
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return res.json({
      success: true,
      data: {
        database: {
          status: 'healthy',
          latency: `${dbLatency}ms`,
        },
        system: {
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
          memoryUsage: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemLogs = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      action,
      entityType,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (level) {
      where.level = level;
    }

    if (action) {
      where.action = { contains: action as string };
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.auditLog.count({ where });

    return res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { title, message, priority, targetAudience }: AnnouncementRequest = req.body;

    // Create announcement notification for target users
    const whereClause: any = {};
    if (targetAudience === 'CLIENTS') {
      whereClause.isClient = true;
    } else if (targetAudience === 'WORKERS') {
      whereClause.isWorker = true;
    }
    // For 'ALL', no additional filters needed

    const targetUsers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    // Create notifications for all target users
    const notifications = await Promise.all(
      targetUsers.map((user: { id: string }) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title,
            message,
            type: 'SYSTEM_ANNOUNCEMENT',
            actionUrl: '/announcements',
          },
        })
      )
    );

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      'ANNOUNCEMENT_CREATE',
      'System',
      'BULK',
      undefined,
      {
        title,
        message,
        priority,
        targetAudience,
        recipientCount: targetUsers.length,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: 'Announcement created successfully',
      data: {
        announcement: {
          title,
          message,
          priority,
          targetAudience,
          recipientCount: targetUsers.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== DISPUTE RESOLUTION ====================

export const getAllDisputes = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.dispute.count({ where });

    return res.json({
      success: true,
      data: {
        disputes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { resolution, action }: DisputeResolutionRequest = req.body;

    // Get current dispute data for audit log
    const currentDispute = await prisma.dispute.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        assignedAdminId: true,
        resolution: true,
        resolvedAt: true,
      },
    });

    if (!currentDispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found',
      });
    }

    const updateData: any = {
      resolution,
      resolvedAt: new Date(),
    };

    if (action === 'RESOLVE') {
      updateData.status = 'RESOLVED';
      updateData.closedAt = new Date();
    } else if (action === 'ESCALATE') {
      updateData.status = 'ESCALATED';
    } else if (action === 'CLOSE') {
      updateData.status = 'CLOSED';
      updateData.closedAt = new Date();
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        closedAt: true,
      },
    });

    // Log admin action
    await logAdminAction(
      req.user?.id ?? 'system',
      `DISPUTE_${action}`,
      'Dispute',
      id,
      {
        status: currentDispute.status,
        resolution: currentDispute.resolution,
      },
      {
        status: updatedDispute.status,
        resolution: updatedDispute.resolution,
        action,
      },
      req.ip,
      req.get('User-Agent')
    );

    return res.json({
      success: true,
      message: `Dispute ${action.toLowerCase()}d successfully`,
      data: { dispute: updatedDispute },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SECURITY MONITORING ====================

export const getSecurityEvents = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 50,
      eventType,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (eventType) {
      where.action = { contains: eventType as string };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    // Get security-related audit logs
    const securityEvents = await prisma.auditLog.findMany({
      where: {
        ...where,
        OR: [
          { action: { contains: 'LOGIN' } },
          { action: { contains: 'SUSPICIOUS' } },
          { action: { contains: 'FAILED' } },
          { action: { contains: 'SECURITY' } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.auditLog.count({
      where: {
        ...where,
        OR: [
          { action: { contains: 'LOGIN' } },
          { action: { contains: 'SUSPICIOUS' } },
          { action: { contains: 'FAILED' } },
          { action: { contains: 'SECURITY' } },
        ],
      },
    });

    return res.json({
      success: true,
      data: {
        events: securityEvents,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFailedLogins = async (req: AdminAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 50,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {
      action: { contains: 'FAILED' },
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const failedLogins = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limitNum,
      skip: offset,
    });

    const total = await prisma.auditLog.count({ where });

    return res.json({
      success: true,
      data: {
        failedLogins,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==================== VALIDATION RULES ====================

export const userStatusValidation = [
  body('status').isIn(['ACTIVE', 'SUSPENDED']).withMessage('Status must be ACTIVE or SUSPENDED'),
  body('reason').optional().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
];

export const jobModerationValidation = [
  body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
  body('reason').optional().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
];

export const paymentRefundValidation = [
  body('reason').isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

export const disputeResolutionValidation = [
  body('resolution').isLength({ min: 20 }).withMessage('Resolution must be at least 20 characters'),
  body('action').isIn(['RESOLVE', 'ESCALATE', 'CLOSE']).withMessage('Action must be RESOLVE, ESCALATE, or CLOSE'),
];

export const announcementValidation = [
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('message').isLength({ min: 20, max: 1000 }).withMessage('Message must be between 20 and 1000 characters'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('targetAudience').optional().isIn(['ALL', 'CLIENTS', 'WORKERS']).withMessage('Target audience must be ALL, CLIENTS, or WORKERS'),
];
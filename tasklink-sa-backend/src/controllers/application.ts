import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, validationResult } from 'express-validator';

// Define ApplicationStatus enum locally
enum ApplicationStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
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

// Types for request bodies
interface CreateApplicationRequest {
  jobId: string;
  message?: string;
  proposedRate?: number;
}

interface UpdateApplicationRequest {
  status?: ApplicationStatusEnum;
  message?: string;
}

// Application validation rules
export const createApplicationValidation = [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('message').optional().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
  body('proposedRate').optional().isFloat({ min: 50, max: 50000 }).withMessage('Proposed rate must be between R50 and R50,000'),
];

export const updateApplicationValidation = [
  body('status').optional().isIn(Object.values(ApplicationStatusEnum)).withMessage('Invalid application status'),
  body('message').optional().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
];

// Apply for a job
export const applyForJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // Check if user is a worker (can apply for jobs)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isWorker: true, firstName: true, lastName: true }
    });

    if (!user?.isWorker) {
      return res.status(403).json({
        success: false,
        error: 'Only workers can apply for jobs'
      });
    }

    const { jobId, message, proposedRate }: CreateApplicationRequest = req.body;

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        status: true,
        posterId: true,
        budget: true,
        budgetType: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Job is not open for applications'
      });
    }

    if (job.posterId === userId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot apply for your own job'
      });
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: userId
        }
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied for this job'
      });
    }

    // Validate proposed rate if provided
    if (proposedRate && job.budgetType === 'fixed' && proposedRate > job.budget) {
      return res.status(400).json({
        success: false,
        error: 'Proposed rate cannot exceed job budget'
      });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        applicantId: userId,
        message,
        proposedRate,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            poster: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            reviewCount: true,
            profileImage: true,
          }
        }
      }
    });

    // Create notification for job poster
    await prisma.notification.create({
      data: {
        userId: job.posterId,
        title: 'New Job Application',
        message: `${user.firstName} ${user.lastName} has applied for your job "${job.title}"`,
        type: 'APPLICATION_RECEIVED',
        jobId: job.id,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application }
    });

  } catch (error) {
    next(error);
  }
};

// Get applications for a job (job poster only)
export const getJobApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if job exists and user owns it
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, posterId: true, title: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.posterId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view applications for your own jobs'
      });
    }

    // Get applications for the job
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            bio: true,
            location: true,
            skills: true,
            rating: true,
            reviewCount: true,
            completedJobs: true,
            totalEarned: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: {
        applications,
        job: {
          id: job.id,
          title: job.title
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get applications by user (for workers to see their applications)
export const getUserApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is a worker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isWorker: true }
    });

    if (!user?.isWorker) {
      return res.status(403).json({
        success: false,
        error: 'Only workers can view their applications'
      });
    }

    // Build where clause
    const where: any = { applicantId: userId };

    if (status) {
      where.status = status;
    }

    // Get applications
    const applications = await prisma.application.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            budget: true,
            budgetType: true,
            status: true,
            priority: true,
            createdAt: true,
            poster: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
                reviewCount: true,
                profileImage: true,
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: { applications }
    });

  } catch (error) {
    next(error);
  }
};

// Update application status (job poster only)
export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    const { status, message }: UpdateApplicationRequest = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get application with job details
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            posterId: true,
            status: true
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if user owns the job
    if (application.job.posterId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update applications for your own jobs'
      });
    }

    // Check if job is still open
    if (application.job.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update application for a closed job'
      });
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        message,
        respondedAt: new Date(),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    // If application is accepted, update job status and assign worker
    if (status === ApplicationStatusEnum.ACCEPTED) {
      await prisma.job.update({
        where: { id: application.job.id },
        data: {
          status: 'ASSIGNED',
          workerId: application.applicant.id,
        }
      });

      // Create notifications
      await prisma.notification.create({
        data: {
          userId: application.applicant.id,
          title: 'Application Accepted!',
          message: `Your application for "${application.job.title}" has been accepted!`,
          type: 'APPLICATION_ACCEPTED',
          jobId: application.job.id,
        }
      });

      // Reject all other applications for this job
      await prisma.application.updateMany({
        where: {
          jobId: application.job.id,
          id: { not: id },
          status: ApplicationStatusEnum.PENDING
        },
        data: {
          status: ApplicationStatusEnum.REJECTED,
          respondedAt: new Date(),
        }
      });

      // Notify other applicants that their applications were rejected
      const rejectedApplications = await prisma.application.findMany({
        where: {
          jobId: application.job.id,
          status: ApplicationStatusEnum.REJECTED,
          respondedAt: { not: null }
        },
        select: {
          applicantId: true,
          job: {
            select: { title: true }
          }
        }
      });

      for (const rejectedApp of rejectedApplications) {
        await prisma.notification.create({
          data: {
            userId: rejectedApp.applicantId,
            title: 'Application Update',
            message: `Unfortunately, your application for "${rejectedApp.job.title}" was not selected.`,
            type: 'APPLICATION_REJECTED',
            jobId: application.job.id,
          }
        });
      }
    } else if (status === ApplicationStatusEnum.REJECTED) {
      // Create notification for rejected applicant
      await prisma.notification.create({
        data: {
          userId: application.applicant.id,
          title: 'Application Update',
          message: `Unfortunately, your application for "${application.job.title}" was not selected.`,
          type: 'APPLICATION_REJECTED',
          jobId: application.job.id,
        }
      });
    }

    return res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    next(error);
  }
};

// Withdraw application (applicant only)
export const withdrawApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        applicantId: true,
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            posterId: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if user owns the application
    if (application.applicantId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only withdraw your own applications'
      });
    }

    // Check if application can be withdrawn
    if (application.status !== ApplicationStatusEnum.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw application that has already been processed'
      });
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatusEnum.WITHDRAWN,
        respondedAt: new Date(),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    next(error);
  }
};

// Get application by ID
export const getApplicationById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            location: true,
            budget: true,
            budgetType: true,
            status: true,
            poster: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
                reviewCount: true,
                profileImage: true,
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            bio: true,
            location: true,
            skills: true,
            rating: true,
            reviewCount: true,
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if user has permission to view this application
    if (application.applicant.id !== userId && application.job.poster.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this application'
      });
    }

    return res.json({
      success: true,
      data: { application }
    });

  } catch (error) {
    next(error);
  }
};
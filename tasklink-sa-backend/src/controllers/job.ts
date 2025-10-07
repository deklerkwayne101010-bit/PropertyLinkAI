import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js';
import { LocationService, Coordinates } from '../services/location';

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

enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
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
const googleMapsClient = new GoogleMapsClient({});

// Types for request bodies
interface CreateJobRequest {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  budget: number;
  budgetType: 'fixed' | 'hourly';
  estimatedHours?: number;
  requirements?: string[];
  preferredSkills?: string[];
  equipmentNeeded?: string[];
  ageRequirement?: string;
  genderPref?: string;
  deadline?: string;
  images?: string[];
}

interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
  priority?: JobPriority;
}

interface JobSearchQuery {
  category?: string;
  subcategory?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: 'fixed' | 'hourly';
  status?: JobStatus;
  priority?: JobPriority;
  skills?: string[];
  radius?: number; // in kilometers
  urgent?: boolean;
  featured?: boolean;
  sortBy?: 'createdAt' | 'budget' | 'deadline' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Job validation rules
export const createJobValidation = [
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('budget').isFloat({ min: 50, max: 50000 }).withMessage('Budget must be between R50 and R50,000'),
  body('budgetType').isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
  body('estimatedHours').optional().isInt({ min: 1, max: 1000 }).withMessage('Estimated hours must be 1-1000'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
];

export const updateJobValidation = [
  body('title').optional().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').optional().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('budget').optional().isFloat({ min: 50, max: 50000 }).withMessage('Budget must be between R50 and R50,000'),
  body('budgetType').optional().isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
  body('status').optional().isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
  body('priority').optional().isIn(Object.values(JobPriority)).withMessage('Invalid job priority'),
];

export const searchValidation = [
  query('category').optional().notEmpty().withMessage('Category cannot be empty'),
  query('minBudget').optional().isFloat({ min: 0 }).withMessage('Minimum budget must be positive'),
  query('maxBudget').optional().isFloat({ min: 0 }).withMessage('Maximum budget must be positive'),
  query('budgetType').optional().isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
  query('status').optional().isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
  query('priority').optional().isIn(Object.values(JobPriority)).withMessage('Invalid job priority'),
  query('radius').optional().isFloat({ min: 1, max: 200 }).withMessage('Radius must be 1-200 km'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

// Enhanced geocoding service using LocationService
const geocodeLocation = async (address: string): Promise<{ lat: number; lng: number }> => {
  try {
    const result = await LocationService.geocodeAddress(address);
    return result.coordinates;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode location');
  }
};

// Enhanced distance calculation using LocationService
const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  return LocationService.calculateDistance(coord1, coord2, 'km');
};

// Create job
export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    // Check if user is a client (can post jobs)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isClient: true, firstName: true, lastName: true }
    });

    if (!user?.isClient) {
      return res.status(403).json({
        success: false,
        error: 'Only clients can post jobs'
      });
    }

    const jobData: CreateJobRequest = req.body;

    // Geocode location if coordinates not provided
    let coordinates = jobData.coordinates;
    if (!coordinates && jobData.location) {
      coordinates = await geocodeLocation(jobData.location);
    }

    // Validate category exists (you might want to create a categories table)
    // For now, we'll accept any category

    // Set default priority based on budget and urgency
    let priority = JobPriority.MEDIUM;
    if (jobData.budget >= 1000) {
      priority = JobPriority.HIGH;
    }
    if (jobData.deadline && new Date(jobData.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      priority = JobPriority.URGENT;
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        subcategory: jobData.subcategory,
        location: jobData.location,
        coordinates,
        budget: jobData.budget,
        budgetType: jobData.budgetType,
        estimatedHours: jobData.estimatedHours,
        requirements: jobData.requirements || [],
        preferredSkills: jobData.preferredSkills || [],
        equipmentNeeded: jobData.equipmentNeeded || [],
        ageRequirement: jobData.ageRequirement,
        genderPref: jobData.genderPref,
        expiresAt: jobData.deadline ? new Date(jobData.deadline) : null,
        priority,
        posterId: userId,
        images: jobData.images || [],
      },
      include: {
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
    });

    // Create notification for job posting
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Job Posted Successfully',
        message: `Your job "${job.title}" has been posted and is now visible to workers.`,
        type: 'JOB_POSTED',
        jobId: job.id,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job }
    });

  } catch (error) {
    next(error);
  }
};

// Get all jobs with filtering and search
export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const queryData: JobSearchQuery = req.query;
    const userId = req.user?.id;
    const userCoordinates = userId ? await getUserCoordinates(userId) : null;

    // Build where clause
    const where: any = {
      status: JobStatus.OPEN, // Only show open jobs by default
    };

    if (queryData.category) {
      where.category = queryData.category;
    }

    if (queryData.subcategory) {
      where.subcategory = queryData.subcategory;
    }

    if (queryData.minBudget || queryData.maxBudget) {
      where.budget = {};
      if (queryData.minBudget) where.budget.gte = queryData.minBudget;
      if (queryData.maxBudget) where.budget.lte = queryData.maxBudget;
    }

    if (queryData.budgetType) {
      where.budgetType = queryData.budgetType;
    }

    if (queryData.status) {
      where.status = queryData.status;
    }

    if (queryData.priority) {
      where.priority = queryData.priority;
    }

    if (queryData.urgent) {
      where.priority = JobPriority.URGENT;
    }

    if (queryData.featured) {
      where.featured = true;
    }

    if (queryData.skills && queryData.skills.length > 0) {
      where.preferredSkills = {
        hasSome: queryData.skills
      };
    }

    // Location-based filtering
    if (queryData.location && userCoordinates && queryData.radius) {
      // This would require a more complex query with distance calculation
      // For now, we'll filter by location string match
      where.location = {
        contains: queryData.location,
        mode: 'insensitive'
      };
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

    // Get jobs
    const jobs = await prisma.job.findMany({
      where,
      include: {
        poster: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            reviewCount: true,
            profileImage: true,
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy,
      skip,
      take: limit,
    });

    // Add distance information if user location is available
    let jobsWithDistance: any[] = jobs;
    if (userCoordinates) {
      jobsWithDistance = jobs.map((job: any) => {
        if (job.coordinates) {
          const distance = calculateDistance(
            userCoordinates,
            job.coordinates as Coordinates
          );
          return { ...job, distance };
        }
        return job;
      });

      // Sort by distance if requested
      if (queryData.sortBy === 'distance') {
        jobsWithDistance.sort((a: any, b: any) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return queryData.sortOrder === 'asc' ? distA - distB : distB - distA;
        });
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.job.count({ where });

    return res.json({
      success: true,
      data: {
        jobs: jobsWithDistance,
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

// Get job by ID
export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        poster: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            reviewCount: true,
            profileImage: true,
            location: true,
            skills: true,
            completedJobs: true,
          }
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
                reviewCount: true,
                profileImage: true,
                location: true,
                skills: true,
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Add distance if user location is available
    let jobWithDistance = job;
    if (userId) {
      const userCoordinates = await getUserCoordinates(userId);
      if (userCoordinates && job.coordinates) {
        const distance = calculateDistance(
          userCoordinates,
          job.coordinates as Coordinates
        );
        jobWithDistance = { ...job, distance };
      }
    }

    return res.json({
      success: true,
      data: { job: jobWithDistance }
    });

  } catch (error) {
    next(error);
  }
};

// Update job
export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    const updateData: UpdateJobRequest = req.body;

    if (!id) {
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
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, posterId: true, status: true }
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (existingJob.posterId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own jobs'
      });
    }

    // Geocode location if provided and coordinates not included
    let coordinates = updateData.coordinates;
    if (updateData.location && !coordinates) {
      coordinates = await geocodeLocation(updateData.location);
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...updateData,
        coordinates,
      },
      include: {
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
    });

    return res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });

  } catch (error) {
    next(error);
  }
};

// Delete job
export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
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
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, posterId: true, status: true, title: true }
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (existingJob.posterId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own jobs'
      });
    }

    // Check if job can be deleted (not in progress or completed)
    if (existingJob.status === JobStatus.IN_PROGRESS || existingJob.status === JobStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a job that is in progress or completed'
      });
    }

    // Delete job (applications will be cascade deleted)
    await prisma.job.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Get jobs near user location
export const getNearbyJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { radius = 50, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userCoordinates = await getUserCoordinates(userId);
    if (!userCoordinates) {
      return res.status(400).json({
        success: false,
        error: 'User location not available'
      });
    }

    const radiusKm = parseFloat(radius.toString());
    const limitNum = parseInt(limit.toString());

    // Get all open jobs with coordinates
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.OPEN,
        coordinates: {
          not: null
        }
      },
      include: {
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
    });

    // Filter jobs by distance and add distance info
    const jobsWithDistance = jobs
      .map((job: any) => {
        if (job.coordinates) {
          const distance = calculateDistance(
            userCoordinates,
            job.coordinates as Coordinates
          );
          return { ...job, distance };
        }
        return null;
      })
      .filter((job: any) => job !== null && job.distance! <= radiusKm)
      .sort((a: any, b: any) => a.distance! - b.distance!)
      .slice(0, limitNum);

    return res.json({
      success: true,
      data: {
        jobs: jobsWithDistance,
        userLocation: userCoordinates,
        searchRadius: radiusKm
      }
    });

  } catch (error) {
    next(error);
  }
};

// Search jobs with advanced filters
export const searchJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

    const searchQuery: JobSearchQuery = req.query;
    const userId = req.user?.id;

    // Build search where clause
    const where: any = {
      status: JobStatus.OPEN,
    };

    // Text search in title and description
    if (searchQuery.location) {
      where.OR = [
        { title: { contains: searchQuery.location, mode: 'insensitive' } },
        { description: { contains: searchQuery.location, mode: 'insensitive' } },
        { location: { contains: searchQuery.location, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (searchQuery.category) {
      where.category = searchQuery.category;
    }

    // Budget range
    if (searchQuery.minBudget || searchQuery.maxBudget) {
      where.budget = {};
      if (searchQuery.minBudget) where.budget.gte = searchQuery.minBudget;
      if (searchQuery.maxBudget) where.budget.lte = searchQuery.maxBudget;
    }

    // Skills matching
    if (searchQuery.skills && searchQuery.skills.length > 0) {
      where.preferredSkills = {
        hasSome: searchQuery.skills
      };
    }

    // Pagination
    const page = parseInt(searchQuery.page?.toString() || '1');
    const limit = Math.min(parseInt(searchQuery.limit?.toString() || '20'), 100);
    const skip = (page - 1) * limit;

    // Full-text search ranking
    const jobs = await prisma.job.findMany({
      where,
      include: {
        poster: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            reviewCount: true,
            profileImage: true,
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [
        // Prioritize urgent jobs
        { priority: 'desc' },
        // Then by relevance score (simplified)
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    });

    const totalCount = await prisma.job.count({ where });

    return res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        searchCriteria: searchQuery
      }
    });

  } catch (error) {
    next(error);
  }
};

// Make job featured (premium feature)
export const makeJobFeatured = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
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
      where: { id },
      select: { id: true, posterId: true, title: true, featured: true }
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
        error: 'You can only feature your own jobs'
      });
    }

    // Update job to featured
    const updatedJob = await prisma.job.update({
      where: { id },
      data: { featured: true },
      select: { id: true, title: true, featured: true }
    });

    return res.json({
      success: true,
      message: 'Job is now featured',
      data: { job: updatedJob }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to get user coordinates
const getUserCoordinates = async (userId: string): Promise<{ lat: number; lng: number } | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coordinates: true }
  });

  return user?.coordinates as { lat: number; lng: number } | null;
};
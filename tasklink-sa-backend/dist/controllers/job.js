"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeJobFeatured = exports.searchJobs = exports.getNearbyJobs = exports.deleteJob = exports.updateJob = exports.getJobById = exports.getJobs = exports.createJob = exports.searchValidation = exports.updateJobValidation = exports.createJobValidation = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const google_maps_services_js_1 = require("@googlemaps/google-maps-services-js");
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["OPEN"] = "OPEN";
    JobStatus["ASSIGNED"] = "ASSIGNED";
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["CANCELLED"] = "CANCELLED";
    JobStatus["DISPUTED"] = "DISPUTED";
})(JobStatus || (JobStatus = {}));
var JobPriority;
(function (JobPriority) {
    JobPriority["LOW"] = "LOW";
    JobPriority["MEDIUM"] = "MEDIUM";
    JobPriority["HIGH"] = "HIGH";
    JobPriority["URGENT"] = "URGENT";
})(JobPriority || (JobPriority = {}));
const prisma = new client_1.PrismaClient();
const googleMapsClient = new google_maps_services_js_1.Client({});
exports.createJobValidation = [
    (0, express_validator_1.body)('title').isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    (0, express_validator_1.body)('description').isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('location').notEmpty().withMessage('Location is required'),
    (0, express_validator_1.body)('budget').isFloat({ min: 50, max: 50000 }).withMessage('Budget must be between R50 and R50,000'),
    (0, express_validator_1.body)('budgetType').isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
    (0, express_validator_1.body)('estimatedHours').optional().isInt({ min: 1, max: 1000 }).withMessage('Estimated hours must be 1-1000'),
    (0, express_validator_1.body)('deadline').optional().isISO8601().withMessage('Invalid deadline format'),
];
exports.updateJobValidation = [
    (0, express_validator_1.body)('title').optional().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    (0, express_validator_1.body)('description').optional().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
    (0, express_validator_1.body)('budget').optional().isFloat({ min: 50, max: 50000 }).withMessage('Budget must be between R50 and R50,000'),
    (0, express_validator_1.body)('budgetType').optional().isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
    (0, express_validator_1.body)('status').optional().isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
    (0, express_validator_1.body)('priority').optional().isIn(Object.values(JobPriority)).withMessage('Invalid job priority'),
];
exports.searchValidation = [
    (0, express_validator_1.query)('category').optional().notEmpty().withMessage('Category cannot be empty'),
    (0, express_validator_1.query)('minBudget').optional().isFloat({ min: 0 }).withMessage('Minimum budget must be positive'),
    (0, express_validator_1.query)('maxBudget').optional().isFloat({ min: 0 }).withMessage('Maximum budget must be positive'),
    (0, express_validator_1.query)('budgetType').optional().isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
    (0, express_validator_1.query)('status').optional().isIn(Object.values(JobStatus)).withMessage('Invalid job status'),
    (0, express_validator_1.query)('priority').optional().isIn(Object.values(JobPriority)).withMessage('Invalid job priority'),
    (0, express_validator_1.query)('radius').optional().isFloat({ min: 1, max: 200 }).withMessage('Radius must be 1-200 km'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];
const geocodeLocation = async (address) => {
    try {
        const response = await googleMapsClient.geocode({
            params: {
                address: address + ', South Africa',
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
        });
        if (response.data.results.length === 0) {
            throw new Error('Location not found');
        }
        const locationData = response.data.results[0]?.geometry?.location;
        if (!locationData) {
            throw new Error('Location geometry not found');
        }
        const { lat, lng } = locationData;
        return { lat, lng };
    }
    catch (error) {
        console.error('Geocoding error:', error);
        throw new Error('Failed to geocode location');
    }
};
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const createJob = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
        const jobData = req.body;
        let coordinates = jobData.coordinates;
        if (!coordinates && jobData.location) {
            coordinates = await geocodeLocation(jobData.location);
        }
        let priority = JobPriority.MEDIUM;
        if (jobData.budget >= 1000) {
            priority = JobPriority.HIGH;
        }
        if (jobData.deadline && new Date(jobData.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
            priority = JobPriority.URGENT;
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
const getJobs = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const queryData = req.query;
        const userId = req.user?.id;
        const userCoordinates = userId ? await getUserCoordinates(userId) : null;
        const where = {
            status: JobStatus.OPEN,
        };
        if (queryData.category) {
            where.category = queryData.category;
        }
        if (queryData.subcategory) {
            where.subcategory = queryData.subcategory;
        }
        if (queryData.minBudget || queryData.maxBudget) {
            where.budget = {};
            if (queryData.minBudget)
                where.budget.gte = queryData.minBudget;
            if (queryData.maxBudget)
                where.budget.lte = queryData.maxBudget;
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
        if (queryData.location && userCoordinates && queryData.radius) {
            where.location = {
                contains: queryData.location,
                mode: 'insensitive'
            };
        }
        const page = parseInt(queryData.page?.toString() || '1');
        const limit = Math.min(parseInt(queryData.limit?.toString() || '20'), 100);
        const skip = (page - 1) * limit;
        let orderBy = { createdAt: 'desc' };
        if (queryData.sortBy) {
            orderBy = { [queryData.sortBy]: queryData.sortOrder || 'desc' };
        }
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
        let jobsWithDistance = jobs;
        if (userCoordinates) {
            jobsWithDistance = jobs.map((job) => {
                if (job.coordinates) {
                    const distance = calculateDistance(userCoordinates.lat, userCoordinates.lng, job.coordinates.lat, job.coordinates.lng);
                    return { ...job, distance };
                }
                return job;
            });
            if (queryData.sortBy === 'distance') {
                jobsWithDistance.sort((a, b) => {
                    const distA = a.distance || Infinity;
                    const distB = b.distance || Infinity;
                    return queryData.sortOrder === 'asc' ? distA - distB : distB - distA;
                });
            }
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res, next) => {
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
        let jobWithDistance = job;
        if (userId) {
            const userCoordinates = await getUserCoordinates(userId);
            if (userCoordinates && job.coordinates) {
                const distance = calculateDistance(userCoordinates.lat, userCoordinates.lng, job.coordinates.lat, job.coordinates.lng);
                jobWithDistance = { ...job, distance };
            }
        }
        return res.json({
            success: true,
            data: { job: jobWithDistance }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobById = getJobById;
const updateJob = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { id } = req.params;
        const userId = req.user?.id;
        const updateData = req.body;
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
        let coordinates = updateData.coordinates;
        if (updateData.location && !coordinates) {
            coordinates = await geocodeLocation(updateData.location);
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res, next) => {
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
        if (existingJob.status === JobStatus.IN_PROGRESS || existingJob.status === JobStatus.COMPLETED) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete a job that is in progress or completed'
            });
        }
        await prisma.job.delete({
            where: { id }
        });
        return res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
const getNearbyJobs = async (req, res, next) => {
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
        const jobsWithDistance = jobs
            .map((job) => {
            if (job.coordinates) {
                const distance = calculateDistance(userCoordinates.lat, userCoordinates.lng, job.coordinates.lat, job.coordinates.lng);
                return { ...job, distance };
            }
            return null;
        })
            .filter((job) => job !== null && job.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limitNum);
        return res.json({
            success: true,
            data: {
                jobs: jobsWithDistance,
                userLocation: userCoordinates,
                searchRadius: radiusKm
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNearbyJobs = getNearbyJobs;
const searchJobs = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const searchQuery = req.query;
        const userId = req.user?.id;
        const where = {
            status: JobStatus.OPEN,
        };
        if (searchQuery.location) {
            where.OR = [
                { title: { contains: searchQuery.location, mode: 'insensitive' } },
                { description: { contains: searchQuery.location, mode: 'insensitive' } },
                { location: { contains: searchQuery.location, mode: 'insensitive' } },
            ];
        }
        if (searchQuery.category) {
            where.category = searchQuery.category;
        }
        if (searchQuery.minBudget || searchQuery.maxBudget) {
            where.budget = {};
            if (searchQuery.minBudget)
                where.budget.gte = searchQuery.minBudget;
            if (searchQuery.maxBudget)
                where.budget.lte = searchQuery.maxBudget;
        }
        if (searchQuery.skills && searchQuery.skills.length > 0) {
            where.preferredSkills = {
                hasSome: searchQuery.skills
            };
        }
        const page = parseInt(searchQuery.page?.toString() || '1');
        const limit = Math.min(parseInt(searchQuery.limit?.toString() || '20'), 100);
        const skip = (page - 1) * limit;
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
                { priority: 'desc' },
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
    }
    catch (error) {
        next(error);
    }
};
exports.searchJobs = searchJobs;
const makeJobFeatured = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.makeJobFeatured = makeJobFeatured;
const getUserCoordinates = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { coordinates: true }
    });
    return user?.coordinates;
};
//# sourceMappingURL=job.js.map
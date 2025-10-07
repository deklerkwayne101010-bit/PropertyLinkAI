"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationById = exports.withdrawApplication = exports.updateApplicationStatus = exports.getUserApplications = exports.getJobApplications = exports.applyForJob = exports.updateApplicationValidation = exports.createApplicationValidation = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
var ApplicationStatusEnum;
(function (ApplicationStatusEnum) {
    ApplicationStatusEnum["PENDING"] = "PENDING";
    ApplicationStatusEnum["ACCEPTED"] = "ACCEPTED";
    ApplicationStatusEnum["REJECTED"] = "REJECTED";
    ApplicationStatusEnum["WITHDRAWN"] = "WITHDRAWN";
})(ApplicationStatusEnum || (ApplicationStatusEnum = {}));
const prisma = new client_1.PrismaClient();
exports.createApplicationValidation = [
    (0, express_validator_1.body)('jobId').notEmpty().withMessage('Job ID is required'),
    (0, express_validator_1.body)('message').optional().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
    (0, express_validator_1.body)('proposedRate').optional().isFloat({ min: 50, max: 50000 }).withMessage('Proposed rate must be between R50 and R50,000'),
];
exports.updateApplicationValidation = [
    (0, express_validator_1.body)('status').optional().isIn(Object.values(ApplicationStatusEnum)).withMessage('Invalid application status'),
    (0, express_validator_1.body)('message').optional().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
];
const applyForJob = async (req, res, next) => {
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
            select: { id: true, isWorker: true, firstName: true, lastName: true }
        });
        if (!user?.isWorker) {
            return res.status(403).json({
                success: false,
                error: 'Only workers can apply for jobs'
            });
        }
        const { jobId, message, proposedRate } = req.body;
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
        if (proposedRate && job.budgetType === 'fixed' && proposedRate > job.budget) {
            return res.status(400).json({
                success: false,
                error: 'Proposed rate cannot exceed job budget'
            });
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.applyForJob = applyForJob;
const getJobApplications = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getJobApplications = getJobApplications;
const getUserApplications = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { status } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
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
        const where = { applicantId: userId };
        if (status) {
            where.status = status;
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUserApplications = getUserApplications;
const updateApplicationStatus = async (req, res, next) => {
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
        const { status, message } = req.body;
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
        if (application.job.posterId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only update applications for your own jobs'
            });
        }
        if (application.job.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: 'Cannot update application for a closed job'
            });
        }
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
        if (status === ApplicationStatusEnum.ACCEPTED) {
            await prisma.job.update({
                where: { id: application.job.id },
                data: {
                    status: 'ASSIGNED',
                    workerId: application.applicant.id,
                }
            });
            await prisma.notification.create({
                data: {
                    userId: application.applicant.id,
                    title: 'Application Accepted!',
                    message: `Your application for "${application.job.title}" has been accepted!`,
                    type: 'APPLICATION_ACCEPTED',
                    jobId: application.job.id,
                }
            });
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
        }
        else if (status === ApplicationStatusEnum.REJECTED) {
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
const withdrawApplication = async (req, res, next) => {
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
        if (application.applicantId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only withdraw your own applications'
            });
        }
        if (application.status !== ApplicationStatusEnum.PENDING) {
            return res.status(400).json({
                success: false,
                error: 'Cannot withdraw application that has already been processed'
            });
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.withdrawApplication = withdrawApplication;
const getApplicationById = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getApplicationById = getApplicationById;
//# sourceMappingURL=application.js.map
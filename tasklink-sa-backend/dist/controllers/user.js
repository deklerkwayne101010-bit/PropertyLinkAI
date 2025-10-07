"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientProfileValidation = exports.updateWorkerProfileValidation = exports.updateProfileValidation = exports.deleteAccount = exports.getUserById = exports.getUserProfile = exports.updateClientProfile = exports.updateWorkerProfile = exports.updateProfile = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const auth_1 = require("../services/auth");
const prisma = new client_1.PrismaClient();
const updateProfile = async (req, res, next) => {
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
        const updateData = req.body;
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
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
        await auth_1.AuthService.logAuthEvent(userId, 'PROFILE_UPDATE', 'User', userId, { updatedFields: Object.keys(updateData) });
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const updateWorkerProfile = async (req, res, next) => {
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
        if (!req.user?.isWorker) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: Worker profile required'
            });
        }
        const { skills, bio, location, coordinates, profileImage, portfolio, certifications, experience, availability } = req.body;
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
        await auth_1.AuthService.logAuthEvent(userId, 'WORKER_PROFILE_UPDATE', 'User', userId, { updatedFields: ['skills', 'bio', 'location', 'coordinates', 'profileImage'] });
        return res.json({
            success: true,
            message: 'Worker profile updated successfully',
            data: { user: updatedUser }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateWorkerProfile = updateWorkerProfile;
const updateClientProfile = async (req, res, next) => {
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
        if (!req.user?.isClient) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: Client profile required'
            });
        }
        const { bio, location, coordinates, profileImage, preferences, budget } = req.body;
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
        await auth_1.AuthService.logAuthEvent(userId, 'CLIENT_PROFILE_UPDATE', 'User', userId, { updatedFields: ['bio', 'location', 'coordinates', 'profileImage'] });
        return res.json({
            success: true,
            message: 'Client profile updated successfully',
            data: { user: updatedUser }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateClientProfile = updateClientProfile;
const getUserProfile = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUserProfile = getUserProfile;
const getUserById = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        await prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: false,
            }
        });
        await auth_1.AuthService.logAuthEvent(userId, 'ACCOUNT_DELETION', 'User', userId, { method: 'soft_delete' });
        return res.json({
            success: true,
            message: 'Account deactivated successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
exports.updateProfileValidation = [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('en-ZA').withMessage('Valid South African phone number is required'),
    (0, express_validator_1.body)('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    (0, express_validator_1.body)('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
    (0, express_validator_1.body)('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
    (0, express_validator_1.body)('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
    (0, express_validator_1.body)('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
    (0, express_validator_1.body)('skills').optional().isArray().withMessage('Skills must be an array'),
    (0, express_validator_1.body)('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];
exports.updateWorkerProfileValidation = [
    (0, express_validator_1.body)('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
    (0, express_validator_1.body)('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    (0, express_validator_1.body)('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
    (0, express_validator_1.body)('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
    (0, express_validator_1.body)('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
    (0, express_validator_1.body)('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
    (0, express_validator_1.body)('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];
exports.updateClientProfileValidation = [
    (0, express_validator_1.body)('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    (0, express_validator_1.body)('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
    (0, express_validator_1.body)('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
    (0, express_validator_1.body)('coordinates.lat').optional().isFloat().withMessage('Latitude must be a valid number'),
    (0, express_validator_1.body)('coordinates.lng').optional().isFloat().withMessage('Longitude must be a valid number'),
    (0, express_validator_1.body)('profileImage').optional().isURL().withMessage('Profile image must be a valid URL'),
];
//# sourceMappingURL=user.js.map
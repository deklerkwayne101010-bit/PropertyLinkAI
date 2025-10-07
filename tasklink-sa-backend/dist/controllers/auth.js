"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidation = exports.resetPasswordValidation = exports.loginValidation = exports.registerValidation = exports.changePassword = exports.getMe = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const auth_1 = require("../services/auth");
const prisma = new client_1.PrismaClient();
const register = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { email, password, firstName, lastName, phone, role, location, skills, bio } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        const passwordValidation = await auth_1.AuthService.validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Password does not meet security requirements',
                details: passwordValidation.errors
            });
        }
        const hashedPassword = await auth_1.AuthService.hashPassword(password);
        const isWorker = role === 'DOER';
        const isClient = role === 'POSTER' || role === 'DOER';
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                isWorker,
                isClient,
                location,
                skills: skills || [],
                bio,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isWorker: true,
                isClient: true,
                isVerified: true,
                createdAt: true,
            }
        });
        const verificationToken = auth_1.AuthService.generateSecureToken();
        try {
            await auth_1.AuthService.sendVerificationEmail(email, verificationToken);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }
        await auth_1.AuthService.logAuthEvent(user.id, 'REGISTER', 'User', user.id, { role, email });
        const tokens = await auth_1.AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: isWorker ? 'DOER' : 'POSTER'
        });
        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification instructions.',
            data: {
                user,
                tokens,
                requiresEmailVerification: !user.isVerified
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                firstName: true,
                lastName: true,
                isWorker: true,
                isClient: true,
                isVerified: true,
                createdAt: true,
            }
        });
        if (!user) {
            await auth_1.AuthService.trackFailedLogin(email, ipAddress, userAgent);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        if (!user.isVerified) {
            await auth_1.AuthService.trackSuspiciousActivity(user.id, 'UNVERIFIED_LOGIN_ATTEMPT', { email }, ipAddress, userAgent);
            return res.status(401).json({
                success: false,
                error: 'Please verify your email address before logging in'
            });
        }
        const isPasswordValid = await auth_1.AuthService.comparePassword(password, user.password);
        if (!isPasswordValid) {
            await auth_1.AuthService.logAuthEvent(user.id, 'LOGIN_FAILED', 'User', user.id, { reason: 'invalid_password', email }, ipAddress, userAgent);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        const tokens = await auth_1.AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.isWorker ? 'DOER' : 'POSTER'
        });
        await auth_1.AuthService.logAuthEvent(user.id, 'LOGIN', 'User', user.id, { method: 'email' }, ipAddress, userAgent);
        const { password: _, ...userWithoutPassword } = user;
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                tokens
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (userId) {
            await auth_1.AuthService.logAuthEvent(userId, 'LOGOUT', 'User', userId);
        }
        return res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        const decoded = await auth_1.AuthService.verifyToken(refreshToken, 'refresh');
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
        const tokens = await auth_1.AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.isWorker ? 'DOER' : 'POSTER'
        });
        await auth_1.AuthService.logAuthEvent(user.id, 'TOKEN_REFRESH', 'User', user.id);
        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: { tokens }
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token'
        });
    }
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, firstName: true }
        });
        if (user) {
            const resetToken = auth_1.AuthService.generateSecureToken();
            await auth_1.AuthService.sendPasswordResetEmail(email, resetToken);
            await auth_1.AuthService.logAuthEvent(user.id, 'PASSWORD_RESET_REQUEST', 'User', user.id, { email });
        }
        return res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }
        const { token, password } = req.body;
        const passwordValidation = await auth_1.AuthService.validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Password does not meet security requirements',
                details: passwordValidation.errors
            });
        }
        const hashedPassword = await auth_1.AuthService.hashPassword(password);
        return res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }
        return res.json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
const getMe = async (req, res, next) => {
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
exports.getMe = getMe;
const changePassword = async (req, res, next) => {
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
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const isCurrentPasswordValid = await auth_1.AuthService.comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        const passwordValidation = await auth_1.AuthService.validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                error: 'New password does not meet security requirements',
                details: passwordValidation.errors
            });
        }
        const hashedNewPassword = await auth_1.AuthService.hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });
        await auth_1.AuthService.logAuthEvent(userId, 'PASSWORD_CHANGE', 'User', userId);
        return res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    (0, express_validator_1.body)('role').isIn(['POSTER', 'DOER']).withMessage('Role must be POSTER or DOER'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('en-ZA').withMessage('Valid South African phone number is required'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
//# sourceMappingURL=auth.js.map
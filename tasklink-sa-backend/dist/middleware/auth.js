"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireJobAccess = exports.requireOwnershipOrAdmin = exports.optionalAuth = exports.requireAnyRole = exports.requirePosterOrDoer = exports.requireAdmin = exports.requireDoer = exports.requirePoster = exports.authorizeRoles = exports.authenticateToken = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../services/auth");
const prisma = new client_1.PrismaClient();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }
        const decoded = await auth_1.AuthService.verifyToken(token, 'access');
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
        req.user = {
            id: user.id,
            email: user.email,
            role: user.isWorker ? 'DOER' : 'POSTER',
            isWorker: user.isWorker,
            isClient: user.isClient,
        };
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
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
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorizeRoles = authorizeRoles;
exports.requirePoster = (0, exports.authorizeRoles)('POSTER');
exports.requireDoer = (0, exports.authorizeRoles)('DOER');
exports.requireAdmin = (0, exports.authorizeRoles)('ADMIN');
exports.requirePosterOrDoer = (0, exports.authorizeRoles)('POSTER', 'DOER');
exports.requireAnyRole = (0, exports.authorizeRoles)('POSTER', 'DOER', 'ADMIN');
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = await auth_1.AuthService.verifyToken(token, 'access');
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
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
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
            if (userRole === 'ADMIN') {
                return next();
            }
            if (resourceUserId !== currentUserId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied: can only access your own resources'
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnershipOrAdmin = requireOwnershipOrAdmin;
const requireJobAccess = async (req, res, next) => {
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
        if (userRole === 'ADMIN') {
            return next();
        }
        if (userRole === 'POSTER' && job.posterId === userId) {
            return next();
        }
        if (userRole === 'DOER' && job.workerId === userId) {
            return next();
        }
        return res.status(403).json({
            success: false,
            error: 'Access denied: insufficient permissions for this job'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.requireJobAccess = requireJobAccess;
//# sourceMappingURL=auth.js.map
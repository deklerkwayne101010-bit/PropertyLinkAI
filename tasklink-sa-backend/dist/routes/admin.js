"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const admin_1 = require("../controllers/admin");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAdmin);
router.get('/users', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty'),
    (0, express_validator_1.query)('role').optional().isIn(['ALL', 'ADMIN', 'WORKER', 'CLIENT']).withMessage('Invalid role filter'),
    (0, express_validator_1.query)('status').optional().isIn(['ACTIVE', 'SUSPENDED']).withMessage('Invalid status filter'),
    (0, express_validator_1.query)('isVerified').optional().isIn(['true', 'false']).withMessage('isVerified must be true or false'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], admin_1.getAllUsers);
router.get('/users/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
], admin_1.getUserDetails);
router.put('/users/:id/status', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
    ...admin_1.userStatusValidation,
], admin_1.updateUserStatus);
router.put('/users/:id/verify', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
], admin_1.verifyUser);
router.delete('/users/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid user ID'),
], admin_1.deleteUser);
router.get('/users/stats', admin_1.getUserStats);
router.get('/jobs', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status').optional().isIn(['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).withMessage('Invalid status filter'),
    (0, express_validator_1.query)('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority filter'),
    (0, express_validator_1.query)('category').optional().isLength({ min: 1 }).withMessage('Category must not be empty'),
    (0, express_validator_1.query)('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'title', 'budget', 'status']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], admin_1.getAllJobs);
router.put('/jobs/:id/approve', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid job ID'),
    ...admin_1.jobModerationValidation,
], admin_1.moderateJob);
router.put('/jobs/:id/reject', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid job ID'),
    ...admin_1.jobModerationValidation,
], admin_1.moderateJob);
router.delete('/jobs/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid job ID'),
], admin_1.deleteJob);
router.get('/jobs/stats', admin_1.getJobStats);
router.get('/payments', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).withMessage('Invalid status filter'),
    (0, express_validator_1.query)('amountMin').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
    (0, express_validator_1.query)('amountMax').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'amount', 'status']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], admin_1.getAllPayments);
router.post('/payments/:id/refund', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid payment ID'),
    ...admin_1.paymentRefundValidation,
], admin_1.processRefund);
router.get('/payments/analytics', admin_1.getPaymentAnalyticsOverview);
router.get('/analytics/overview', admin_1.getPlatformOverview);
router.get('/analytics/users', admin_1.getUserAnalytics);
router.get('/analytics/jobs', admin_1.getJobAnalytics);
router.get('/analytics/payments', admin_1.getPaymentAnalytics);
router.get('/reviews', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    (0, express_validator_1.query)('isPublic').optional().isIn(['true', 'false']).withMessage('isPublic must be true or false'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'rating']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], admin_1.getAllReviews);
router.put('/reviews/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid review ID'),
    (0, express_validator_1.body)('action').isIn(['HIDE', 'DELETE']).withMessage('Action must be HIDE or DELETE'),
    (0, express_validator_1.body)('reason').optional().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
], admin_1.moderateReview);
router.get('/system/health', admin_1.getSystemHealth);
router.get('/system/logs', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('level').optional().isLength({ min: 1 }).withMessage('Level must not be empty'),
    (0, express_validator_1.query)('action').optional().isLength({ min: 1 }).withMessage('Action must not be empty'),
    (0, express_validator_1.query)('entityType').optional().isLength({ min: 1 }).withMessage('Entity type must not be empty'),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], admin_1.getSystemLogs);
router.post('/announcements', admin_1.announcementValidation, admin_1.createAnnouncement);
router.get('/disputes', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('status').optional().isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED']).withMessage('Invalid status filter'),
    (0, express_validator_1.query)('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority filter'),
    (0, express_validator_1.query)('category').optional().isLength({ min: 1 }).withMessage('Category must not be empty'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['createdAt', 'priority', 'status']).withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], admin_1.getAllDisputes);
router.post('/disputes/:id/resolve', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid dispute ID'),
    ...admin_1.disputeResolutionValidation,
], admin_1.resolveDispute);
router.get('/security/events', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('eventType').optional().isLength({ min: 1 }).withMessage('Event type must not be empty'),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], admin_1.getSecurityEvents);
router.get('/security/failed-logins', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.query)('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], admin_1.getFailedLogins);
exports.default = router;
//# sourceMappingURL=admin.js.map
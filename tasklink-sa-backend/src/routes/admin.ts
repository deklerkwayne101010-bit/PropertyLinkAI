import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  verifyUser,
  deleteUser,
  getUserStats,

  // Job Moderation
  getAllJobs,
  moderateJob,
  deleteJob,
  getJobStats,

  // Payment Administration
  getAllPayments,
  processRefund,
  getPaymentAnalyticsOverview,

  // Platform Analytics
  getPlatformOverview,
  getUserAnalytics,
  getJobAnalytics,
  getPaymentAnalytics,

  // Content Moderation
  getAllReviews,
  moderateReview,
  getReviewStats,

  // System Management
  getSystemHealth,
  getSystemLogs,
  createAnnouncement,

  // Dispute Resolution
  getAllDisputes,
  resolveDispute,

  // Security Monitoring
  getSecurityEvents,
  getFailedLogins,

  // Validation Rules
  userStatusValidation,
  jobModerationValidation,
  paymentRefundValidation,
  disputeResolutionValidation,
  announcementValidation,
} from '../controllers/admin';

const router = Router();

// ==================== MIDDLEWARE ====================
// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== USER MANAGEMENT ====================
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty'),
  query('role').optional().isIn(['ALL', 'ADMIN', 'WORKER', 'CLIENT']).withMessage('Invalid role filter'),
  query('status').optional().isIn(['ACTIVE', 'SUSPENDED']).withMessage('Invalid status filter'),
  query('isVerified').optional().isIn(['true', 'false']).withMessage('isVerified must be true or false'),
  query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], getAllUsers);

router.get('/users/:id', [
  param('id').isUUID().withMessage('Invalid user ID'),
], getUserDetails);

router.put('/users/:id/status', [
  param('id').isUUID().withMessage('Invalid user ID'),
  ...userStatusValidation,
], updateUserStatus);

router.put('/users/:id/verify', [
  param('id').isUUID().withMessage('Invalid user ID'),
], verifyUser);

router.delete('/users/:id', [
  param('id').isUUID().withMessage('Invalid user ID'),
], deleteUser);

router.get('/users/stats', getUserStats);

// ==================== JOB MODERATION ====================
router.get('/jobs', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED']).withMessage('Invalid status filter'),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority filter'),
  query('category').optional().isLength({ min: 1 }).withMessage('Category must not be empty'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term must not be empty'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'budget', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], getAllJobs);

router.put('/jobs/:id/approve', [
  param('id').isUUID().withMessage('Invalid job ID'),
  ...jobModerationValidation,
], moderateJob);

router.put('/jobs/:id/reject', [
  param('id').isUUID().withMessage('Invalid job ID'),
  ...jobModerationValidation,
], moderateJob);

router.delete('/jobs/:id', [
  param('id').isUUID().withMessage('Invalid job ID'),
], deleteJob);

router.get('/jobs/stats', getJobStats);

// ==================== PAYMENT ADMINISTRATION ====================
router.get('/payments', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']).withMessage('Invalid status filter'),
  query('amountMin').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  query('amountMax').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
  query('sortBy').optional().isIn(['createdAt', 'amount', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], getAllPayments);

router.post('/payments/:id/refund', [
  param('id').isUUID().withMessage('Invalid payment ID'),
  ...paymentRefundValidation,
], processRefund);

router.get('/payments/analytics', getPaymentAnalyticsOverview);

// ==================== PLATFORM ANALYTICS ====================
router.get('/analytics/overview', getPlatformOverview);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/jobs', getJobAnalytics);
router.get('/analytics/payments', getPaymentAnalytics);

// ==================== CONTENT MODERATION ====================
router.get('/reviews', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  query('isPublic').optional().isIn(['true', 'false']).withMessage('isPublic must be true or false'),
  query('sortBy').optional().isIn(['createdAt', 'rating']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], getAllReviews);

router.put('/reviews/:id', [
  param('id').isUUID().withMessage('Invalid review ID'),
  body('action').isIn(['HIDE', 'DELETE']).withMessage('Action must be HIDE or DELETE'),
  body('reason').optional().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
], moderateReview);

// Review statistics and analytics
router.get('/reviews/stats', getReviewStats);

// ==================== SYSTEM MANAGEMENT ====================
router.get('/system/health', getSystemHealth);

router.get('/system/logs', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('level').optional().isLength({ min: 1 }).withMessage('Level must not be empty'),
  query('action').optional().isLength({ min: 1 }).withMessage('Action must not be empty'),
  query('entityType').optional().isLength({ min: 1 }).withMessage('Entity type must not be empty'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], getSystemLogs);

router.post('/announcements', announcementValidation, createAnnouncement);

// ==================== DISPUTE RESOLUTION ====================
router.get('/disputes', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED']).withMessage('Invalid status filter'),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority filter'),
  query('category').optional().isLength({ min: 1 }).withMessage('Category must not be empty'),
  query('sortBy').optional().isIn(['createdAt', 'priority', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
], getAllDisputes);

router.post('/disputes/:id/resolve', [
  param('id').isUUID().withMessage('Invalid dispute ID'),
  ...disputeResolutionValidation,
], resolveDispute);

// ==================== SECURITY MONITORING ====================
router.get('/security/events', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('eventType').optional().isLength({ min: 1 }).withMessage('Event type must not be empty'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], getSecurityEvents);

router.get('/security/failed-logins', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
], getFailedLogins);

export default router;
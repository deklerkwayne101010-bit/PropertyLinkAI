import { Router } from 'express';
import {
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  getUserReviews,
  getJobReviews,
  getUserRating,
  getUserRatingStats,
  getUserRatingBreakdown
} from '../controllers/review';
import { authenticateToken } from '../middleware/auth';
import {
  createReviewValidation,
  updateReviewValidation,
  reviewSearchValidation
} from '../controllers/review';

const router = Router();

// All review routes require authentication
router.use(authenticateToken);

// Review Management Routes
router.post('/', createReviewValidation, createReview);
router.get('/:id', getReviewById);
router.put('/:id', updateReviewValidation, updateReview);
router.delete('/:id', deleteReview);

// User Review Routes
router.get('/user/:userId', reviewSearchValidation, getUserReviews);
router.get('/job/:jobId', getJobReviews);

// Rating & Reputation Routes
router.get('/rating/user/:userId', getUserRating);
router.get('/rating/stats/:userId', getUserRatingStats);
router.get('/rating/breakdown/:userId', getUserRatingBreakdown);

export default router;
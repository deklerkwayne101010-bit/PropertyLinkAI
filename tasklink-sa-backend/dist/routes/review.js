"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_1 = require("../controllers/review");
const auth_1 = require("../middleware/auth");
const review_2 = require("../controllers/review");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/', review_2.createReviewValidation, review_1.createReview);
router.get('/:id', review_1.getReviewById);
router.put('/:id', review_2.updateReviewValidation, review_1.updateReview);
router.delete('/:id', review_1.deleteReview);
router.get('/user/:userId', review_2.reviewSearchValidation, review_1.getUserReviews);
router.get('/job/:jobId', review_1.getJobReviews);
router.get('/rating/user/:userId', review_1.getUserRating);
router.get('/rating/stats/:userId', review_1.getUserRatingStats);
router.get('/rating/breakdown/:userId', review_1.getUserRatingBreakdown);
exports.default = router;
//# sourceMappingURL=review.js.map
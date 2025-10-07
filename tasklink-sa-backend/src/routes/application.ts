import { Router } from 'express';
import {
  applyForJob,
  getJobApplications,
  getUserApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationById,
  createApplicationValidation,
  updateApplicationValidation
} from '../controllers/application';
import { authenticateToken, requirePoster, requireDoer } from '../middleware/auth';

const router = Router();

// All application routes require authentication
router.use(authenticateToken);

// Apply for a job (workers only)
router.post('/', requireDoer, createApplicationValidation, applyForJob);

// Get applications for a specific job (job poster only)
router.get('/job/:jobId', requirePoster, getJobApplications);

// Get current user's applications (workers only)
router.get('/my', requireDoer, getUserApplications);

// Get application by ID (both poster and applicant can view)
router.get('/:id', getApplicationById);

// Update application status (job poster only)
router.put('/:id', requirePoster, updateApplicationValidation, updateApplicationStatus);

// Withdraw application (applicant only)
router.delete('/:id', requireDoer, withdrawApplication);

export default router;
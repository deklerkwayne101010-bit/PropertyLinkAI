import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getNearbyJobs,
  searchJobs,
  makeJobFeatured,
  createJobValidation,
  updateJobValidation,
  searchValidation
} from '../controllers/job';
import { authenticateToken, requirePosterOrDoer, requirePoster } from '../middleware/auth';

const router = Router();

// All job routes require authentication
router.use(authenticateToken);

// Job CRUD operations
router.post('/', requirePoster, createJobValidation, createJob);
router.get('/', searchValidation, getJobs);
router.get('/nearby', getNearbyJobs);
router.get('/search', searchValidation, searchJobs);
router.get('/:id', getJobById);
router.put('/:id', requirePoster, updateJobValidation, updateJob);
router.delete('/:id', requirePoster, deleteJob);

// Featured jobs (premium feature)
router.post('/:id/featured', requirePoster, makeJobFeatured);

export default router;
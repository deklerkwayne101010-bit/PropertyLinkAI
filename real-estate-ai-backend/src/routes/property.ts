import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All property routes require authentication
router.use(authenticateToken);

// Placeholder routes - to be implemented
router.get('/', (req, res) => {
  res.json({ message: 'Property routes - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create property - to be implemented' });
});

export default router;
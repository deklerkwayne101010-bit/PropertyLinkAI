import { Router } from 'express';
import { authenticateToken, requireJobAccess } from '../middleware/auth';
import {
  getChatHistory,
  sendMessage,
  getUnreadCount,
  markMessagesAsRead,
  deleteMessage,
  getChatRooms,
  searchMessages
} from '../controllers/message';

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

// Get chat history for a specific job
router.get('/:jobId/history', requireJobAccess, getChatHistory);

// Send a message to a job chat
router.post('/:jobId', requireJobAccess, sendMessage);

// Get unread message count for a job
router.get('/:jobId/unread', requireJobAccess, getUnreadCount);

// Mark messages as read for a job
router.put('/:jobId/read', requireJobAccess, markMessagesAsRead);

// Delete a specific message (only by sender)
router.delete('/:messageId', deleteMessage);

// Get user's active chat rooms
router.get('/rooms', getChatRooms);

// Search messages within a job
router.get('/:jobId/search', requireJobAccess, searchMessages);

export default router;
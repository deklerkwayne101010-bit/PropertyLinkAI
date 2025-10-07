import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Message validation and sanitization utilities
const sanitizeHtml = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

const validateMessageContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Message content is required' };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return { isValid: false, error: 'Message content cannot be empty' };
  }

  if (trimmedContent.length > 2000) {
    return { isValid: false, error: 'Message too long (max 2000 characters)' };
  }

  // Check for excessive repetition (potential spam)
  const words = trimmedContent.split(/\s+/);
  if (words.length > 5) {
    const firstWord = words[0]?.toLowerCase();
    if (firstWord) {
      const repeatedCount = words.filter(word => word?.toLowerCase() === firstWord).length;
      if (repeatedCount > words.length * 0.8) {
        return { isValid: false, error: 'Message contains excessive repetition' };
      }
    }
  }

  return { isValid: true };
};

const validateAttachment = (attachment: any): { isValid: boolean; error?: string } => {
  if (!attachment) return { isValid: true };

  if (!attachment.url || typeof attachment.url !== 'string') {
    return { isValid: false, error: 'Attachment URL is required' };
  }

  if (!attachment.filename || typeof attachment.filename !== 'string') {
    return { isValid: false, error: 'Attachment filename is required' };
  }

  if (!attachment.size || typeof attachment.size !== 'number' || attachment.size <= 0) {
    return { isValid: false, error: 'Attachment size must be a positive number' };
  }

  // Max file size: 10MB
  if (attachment.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'Attachment too large (max 10MB)' };
  }

  // Validate file extension for images
  const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = attachment.filename.toLowerCase().substring(attachment.filename.lastIndexOf('.'));

  if (!allowedImageExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Only image files are allowed (jpg, jpeg, png, gif, webp)' };
  }

  return { isValid: true };
};

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isWorker: boolean;
    isClient: boolean;
  };
}

// Types for API responses
interface MessageResponse {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  jobId?: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachment?: {
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  };
  isRead: boolean;
  readBy: string[];
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatHistoryResponse {
  messages: MessageResponse[];
  totalCount: number;
  hasMore: boolean;
}

// Get chat history for a specific job
export const getChatHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        posterId: true,
        workerId: true,
        status: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const hasAccess = job.posterId === userId || job.workerId === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to job chat'
      });
    }

    // Get messages with pagination
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: { jobId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.message.count({
        where: { jobId }
      })
    ]);

    // Format messages for response
    const formattedMessages: MessageResponse[] = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      jobId: message.jobId || undefined,
      messageType: message.messageType,
      isRead: message.isRead,
      readBy: [], // We'll implement read tracking separately
      readAt: message.readAt?.toISOString(),
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString()
    }));

    const response: ChatHistoryResponse = {
      messages: formattedMessages,
      totalCount,
      hasMore: offset + limit < totalCount
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve chat history'
    });
  }
};

// Send a message (alternative to socket - for offline/retry scenarios)
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;
    const { content, messageType = 'TEXT', attachment } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Validate and sanitize message content
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const sanitizedContent = sanitizeHtml(content);

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        posterId: true,
        workerId: true,
        status: true
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const hasAccess = job.posterId === userId || job.workerId === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to job chat'
      });
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        content: sanitizedContent,
        senderId: userId,
        jobId,
        messageType,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Format message for response
    const messageResponse: MessageResponse = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      jobId: message.jobId || undefined,
      messageType: message.messageType,
      isRead: message.isRead,
      readBy: [],
      readAt: message.readAt?.toISOString(),
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString()
    };

    res.status(201).json({
      success: true,
      data: messageResponse,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Get unread message count for a job
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, posterId: true, workerId: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const hasAccess = job.posterId === userId || job.workerId === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to job chat'
      });
    }

    // Count unread messages (messages not sent by the current user)
    const unreadCount = await prisma.message.count({
      where: {
        jobId,
        senderId: { not: userId },
        isRead: false
      }
    });

    res.status(200).json({
      success: true,
      data: {
        jobId,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread message count'
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;
    const { messageIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message IDs array is required'
      });
    }

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, posterId: true, workerId: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const hasAccess = job.posterId === userId || job.workerId === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to job chat'
      });
    }

    // Update messages as read
    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        jobId,
        senderId: { not: userId }, // Don't mark own messages as read
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        markedCount: result.count,
        messageIds
      },
      message: `${result.count} messages marked as read`
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
};

// Delete a message (only by sender)
export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = req.params.messageId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    // Get message to verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        jobId: true,
        createdAt: true
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only delete your own messages'
      });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId }
    });

    res.status(200).json({
      success: true,
      data: { messageId },
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

// Get user's active chat rooms
export const getChatRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get jobs where user is either poster or worker
    const jobs = await prisma.job.findMany({
      where: {
        OR: [
          { posterId: userId },
          { workerId: userId }
        ],
        status: {
          not: 'COMPLETED' // Only active jobs
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        posterId: true,
        workerId: true,
        updatedAt: true,
        // Get latest message for each job
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get unread counts for each job
    const jobsWithUnreadCounts = await Promise.all(
      jobs.map(async (job: any) => {
        const unreadCount = await prisma.message.count({
          where: {
            jobId: job.id,
            senderId: { not: userId },
            isRead: false
          }
        });

        const otherParticipantId = job.posterId === userId ? job.workerId : job.posterId;
        const otherParticipant = await prisma.user.findUnique({
          where: { id: otherParticipantId },
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        });

        return {
          jobId: job.id,
          jobTitle: job.title,
          jobStatus: job.status,
          otherParticipant: otherParticipant ? {
            id: otherParticipant.id,
            name: `${otherParticipant.firstName} ${otherParticipant.lastName}`
          } : null,
          lastMessage: job.messages[0] ? {
            id: job.messages[0].id,
            content: job.messages[0].content,
            createdAt: job.messages[0].createdAt.toISOString(),
            isRead: job.messages[0].isRead,
            isFromMe: job.messages[0].senderId === userId
          } : null,
          unreadCount,
          updatedAt: job.updatedAt.toISOString()
        };
      })
    );

    res.status(200).json({
      success: true,
      data: jobsWithUnreadCounts
    });

  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat rooms'
    });
  }
};

// Create system message for job status updates
export const createSystemMessage = async (
  jobId: string,
  message: string,
  messageType: 'TEXT' | 'SYSTEM' = 'SYSTEM'
) => {
  try {
    const systemMessage = await prisma.message.create({
      data: {
        content: message,
        senderId: 'system', // System sender ID
        jobId,
        messageType,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return systemMessage;
  } catch (error) {
    console.error('Error creating system message:', error);
    throw error;
  }
};

// Generate system message for job status changes
export const generateJobStatusMessage = (
  oldStatus: string,
  newStatus: string,
  jobTitle: string
): string => {
  const statusMessages: { [key: string]: string } = {
    'DRAFT->OPEN': `Job "${jobTitle}" has been published and is now open for applications.`,
    'OPEN->ASSIGNED': `Job "${jobTitle}" has been assigned to a worker.`,
    'ASSIGNED->IN_PROGRESS': `Work has started on "${jobTitle}".`,
    'IN_PROGRESS->COMPLETED': `Job "${jobTitle}" has been completed successfully.`,
    'COMPLETED->CANCELLED': `Job "${jobTitle}" has been cancelled.`,
    'OPEN->CANCELLED': `Job "${jobTitle}" has been cancelled.`,
    'ASSIGNED->CANCELLED': `Job "${jobTitle}" has been cancelled.`,
    'DRAFT->CANCELLED': `Job "${jobTitle}" has been cancelled.`,
    'COMPLETED->DISPUTED': `Job "${jobTitle}" is under dispute.`,
    'IN_PROGRESS->DISPUTED': `Job "${jobTitle}" is under dispute.`,
    'ASSIGNED->DISPUTED': `Job "${jobTitle}" is under dispute.`,
  };

  const key = `${oldStatus}->${newStatus}`;
  return statusMessages[key] || `Job "${jobTitle}" status changed from ${oldStatus} to ${newStatus}.`;
};

// Search messages within a job
export const searchMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.jobId;
    const { query, limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, posterId: true, workerId: true }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const hasAccess = job.posterId === userId || job.workerId === userId;
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to job chat'
      });
    }

    // Search messages
    const messages = await prisma.message.findMany({
      where: {
        jobId,
        content: {
          contains: query.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string), 50)
    });

    // Format messages for response
    const formattedMessages: MessageResponse[] = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      jobId: message.jobId || undefined,
      messageType: message.messageType,
      isRead: message.isRead,
      readBy: [],
      readAt: message.readAt?.toISOString(),
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString()
    }));

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        jobId,
        messages: formattedMessages,
        totalCount: formattedMessages.length
      }
    });

  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages'
    });
  }
};
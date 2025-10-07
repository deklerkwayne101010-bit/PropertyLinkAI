import { Server as SocketServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth';
import { createNotification } from '../controllers/notification';

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

  return { isValid: true };
};

const prisma = new PrismaClient();

// Socket event types for comprehensive chat system
export interface ServerToClientEvents {
  // Connection & Authentication
  authenticated: (data: { userId: string; userName: string }) => void;
  authentication_failed: (data: { error: string }) => void;

  // Chat Room Management
  joined_room: (data: { roomId: string; roomType: 'job' | 'direct' }) => void;
  left_room: (data: { roomId: string }) => void;
  room_error: (data: { error: string; roomId?: string }) => void;

  // Messaging
  message_sent: (data: { message: MessageData }) => void;
  message_received: (data: { message: MessageData }) => void;
  message_updated: (data: { messageId: string; updates: Partial<MessageData> }) => void;
  message_deleted: (data: { messageId: string }) => void;

  // Read Receipts
  messages_read: (data: { messageIds: string[]; readBy: string; readAt: string }) => void;
  read_status_updated: (data: { messageId: string; readBy: string[]; readAt: string }) => void;

  // Typing Indicators
  typing_start: (data: { userId: string; userName: string; roomId: string }) => void;
  typing_stop: (data: { userId: string; userName: string; roomId: string }) => void;

  // Online Status
  user_online: (data: { userId: string; userName: string }) => void;
  user_offline: (data: { userId: string; userName: string }) => void;
  user_status_changed: (data: { userId: string; status: 'online' | 'offline'; lastSeen: string }) => void;

  // System Events
  system_message: (data: { message: MessageData; roomId: string }) => void;
  job_status_updated: (data: { jobId: string; oldStatus: string; newStatus: string; message: string }) => void;

  // Notifications
  notification: (data: { title: string; message: string; type: string; actionUrl?: string }) => void;

  // Connection Health
  ping: () => void;
  pong: (data: { timestamp: number }) => void;

  // Error Handling
  error: (data: { code: string; message: string; details?: any }) => void;
}

export interface ClientToServerEvents {
  // Connection & Authentication
  authenticate: (data: { token: string }) => void;

  // Chat Room Management
  join_job_room: (data: { jobId: string }) => void;
  leave_job_room: (data: { jobId: string }) => void;

  // Messaging
  send_message: (data: { jobId: string; content: string; messageType?: 'TEXT' | 'IMAGE' | 'FILE'; attachment?: { url: string; filename: string; size: number } }) => void;
  mark_messages_read: (data: { messageIds: string[] }) => void;
  delete_message: (data: { messageId: string }) => void;

  // Typing Indicators
  typing_start: (data: { jobId: string }) => void;
  typing_stop: (data: { jobId: string }) => void;

  // Status Updates
  update_status: (data: { status: 'online' | 'offline' }) => void;

  // Connection Health
  ping: (data: { timestamp: number }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  userName?: string;
  email?: string;
  status?: 'online' | 'offline';
  lastSeen?: Date;
  joinedRooms?: Set<string>;
}

// Message data structure
export interface MessageData {
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

// User status tracking
interface UserStatus {
  userId: string;
  userName: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  joinedRooms: Set<string>;
}

// Global user status tracking
const connectedUsers = new Map<string, UserStatus>();

// Setup Socket.io event handlers for comprehensive chat system
export const setupSocketHandlers = (io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {

  // Middleware to authenticate socket connections
  io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, next) => {
    try {
      console.log(`Socket connection attempt from ${socket.handshake.address}`);
      // Authentication will be handled by the 'authenticate' event
      next();
    } catch (error) {
      next(new Error('Socket authentication middleware failed'));
    }
  });

  // Handle client connections
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    console.log(`User connected: ${socket.id}`);

    // Initialize socket data
    socket.data = {
      userId: undefined,
      userName: undefined,
      email: undefined,
      status: 'online',
      lastSeen: new Date(),
      joinedRooms: new Set<string>()
    };

    // Handle authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        // Verify JWT token
        const decoded = await AuthService.verifyToken(data.token, 'access');

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isWorker: true,
            isClient: true,
            isVerified: true,
          }
        });

        if (!user || !user.isVerified) {
          socket.emit('authentication_failed', { error: 'User not found or not verified' });
          socket.disconnect();
          return;
        }

        // Update socket data with authenticated user
        socket.data.userId = user.id;
        socket.data.userName = `${user.firstName} ${user.lastName}`;
        socket.data.email = user.email;
        socket.data.status = 'online';
        socket.data.lastSeen = new Date();

        // Track user connection
        const userStatus: UserStatus = {
          userId: user.id,
          userName: socket.data.userName,
          status: 'online',
          lastSeen: new Date(),
          joinedRooms: new Set<string>()
        };
        connectedUsers.set(user.id, userStatus);

        // Confirm authentication
        socket.emit('authenticated', {
          userId: user.id,
          userName: socket.data.userName
        });

        console.log(`User authenticated: ${socket.data.userName} (${user.id})`);

      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authentication_failed', { error: 'Invalid or expired token' });
        socket.disconnect();
      }
    });

    // Handle joining job-specific chat rooms
    socket.on('join_job_room', async (data: { jobId: string }) => {
      try {
        if (!socket.data.userId) {
          socket.emit('room_error', { error: 'Authentication required', roomId: data.jobId });
          return;
        }

        // Verify user has access to this job
        const job = await prisma.job.findUnique({
          where: { id: data.jobId },
          select: {
            id: true,
            posterId: true,
            workerId: true,
            status: true
          }
        });

        if (!job) {
          socket.emit('room_error', { error: 'Job not found', roomId: data.jobId });
          return;
        }

        // Check if user is authorized to join this job's chat
        const hasAccess = job.posterId === socket.data.userId || job.workerId === socket.data.userId;
        if (!hasAccess) {
          socket.emit('room_error', { error: 'Access denied to job chat', roomId: data.jobId });
          return;
        }

        // Create job-specific room name
        const roomName = `job_${data.jobId}`;

        // Join the room
        await socket.join(roomName);
        socket.data.joinedRooms?.add(roomName);

        // Update user's joined rooms
        const userStatus = connectedUsers.get(socket.data.userId);
        if (userStatus) {
          userStatus.joinedRooms.add(roomName);
        }

        // Confirm room join
        socket.emit('joined_room', { roomId: roomName, roomType: 'job' });

        // Notify other users in the room
        socket.to(roomName).emit('user_online', {
          userId: socket.data.userId,
          userName: socket.data.userName!
        });

        console.log(`User ${socket.data.userName} joined job room: ${roomName}`);

      } catch (error) {
        console.error('Error joining job room:', error);
        socket.emit('room_error', { error: 'Failed to join room', roomId: data.jobId });
      }
    });

    // Handle leaving job-specific chat rooms
    socket.on('leave_job_room', async (data: { jobId: string }) => {
      try {
        const roomName = `job_${data.jobId}`;
        await socket.leave(roomName);
        socket.data.joinedRooms?.delete(roomName);

        // Update user's joined rooms
        const userStatus = connectedUsers.get(socket.data.userId!);
        if (userStatus) {
          userStatus.joinedRooms.delete(roomName);
        }

        // Confirm room leave
        socket.emit('left_room', { roomId: roomName });

        // Notify other users in the room
        socket.to(roomName).emit('user_offline', {
          userId: socket.data.userId!,
          userName: socket.data.userName!
        });

        console.log(`User ${socket.data.userName} left job room: ${roomName}`);

      } catch (error) {
        console.error('Error leaving job room:', error);
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      jobId: string;
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'FILE';
      attachment?: { url: string; filename: string; size: number }
    }) => {
      try {
        if (!socket.data.userId) {
          socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
          return;
        }

        // Verify user has access to this job
        const job = await prisma.job.findUnique({
          where: { id: data.jobId },
          select: { id: true, posterId: true, workerId: true }
        });

        if (!job) {
          socket.emit('error', { code: 'JOB_NOT_FOUND', message: 'Job not found' });
          return;
        }

        const hasAccess = job.posterId === socket.data.userId || job.workerId === socket.data.userId;
        if (!hasAccess) {
          socket.emit('error', { code: 'ACCESS_DENIED', message: 'Access denied to job chat' });
          return;
        }

        // Validate and sanitize message content
        const validation = validateMessageContent(data.content);
        if (!validation.isValid) {
          socket.emit('error', { code: 'INVALID_MESSAGE', message: validation.error || 'Invalid message' });
          return;
        }

        const sanitizedContent = sanitizeHtml(data.content);

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: sanitizedContent,
            senderId: socket.data.userId,
            jobId: data.jobId,
            messageType: data.messageType || 'TEXT',
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

        // Prepare message data for broadcasting
        const messageData: MessageData = {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: `${message.sender.firstName} ${message.sender.lastName}`,
          jobId: message.jobId || undefined,
          messageType: message.messageType,
          isRead: message.isRead,
          readBy: [],
          createdAt: message.createdAt.toISOString()
        };

        // Get job details for notification
        const jobDetails = await prisma.job.findUnique({
          where: { id: data.jobId },
          select: {
            id: true,
            title: true,
            posterId: true,
            workerId: true
          }
        });

        if (jobDetails) {
          // Send notification to the other participant
          const otherParticipantId = jobDetails.posterId === socket.data.userId ? jobDetails.workerId : jobDetails.posterId;
          if (otherParticipantId) {
            try {
              await createNotification(
                otherParticipantId,
                'New Message',
                `${socket.data.userName} sent you a message about "${job.title}"`,
                'MESSAGE_RECEIVED',
                {
                  actionUrl: `/jobs/${job.id}/chat`,
                  jobId: job.id
                }
              );
            } catch (notificationError) {
              console.error('Error creating notification:', notificationError);
            }
          }
        }

        // Broadcast to all users in the job room
        const roomName = `job_${data.jobId}`;
        io.to(roomName).emit('message_received', { message: messageData });

        // Confirm message sent to sender
        socket.emit('message_sent', { message: messageData });

        console.log(`Message sent by ${socket.data.userName} in job ${data.jobId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { code: 'SEND_FAILED', message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { jobId: string }) => {
      if (!socket.data.userId || !socket.data.userName) return;

      const roomName = `job_${data.jobId}`;
      socket.to(roomName).emit('typing_start', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        roomId: roomName
      });
    });

    socket.on('typing_stop', (data: { jobId: string }) => {
      if (!socket.data.userId || !socket.data.userName) return;

      const roomName = `job_${data.jobId}`;
      socket.to(roomName).emit('typing_stop', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        roomId: roomName
      });
    });

    // Handle marking messages as read
    socket.on('mark_messages_read', async (data: { messageIds: string[] }) => {
      try {
        if (!socket.data.userId) return;

        // Update messages as read in database
        await prisma.message.updateMany({
          where: {
            id: { in: data.messageIds },
            senderId: { not: socket.data.userId } // Don't mark own messages as read
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });

        // Get messages to find their job IDs for room notification
        const messages = await prisma.message.findMany({
          where: { id: { in: data.messageIds } },
          select: { id: true, jobId: true }
        });

        // Notify other users in the respective job rooms about read status
        for (const message of messages) {
          if (message.jobId) {
            const roomName = `job_${message.jobId}`;
            io.to(roomName).emit('messages_read', {
              messageIds: [message.id],
              readBy: socket.data.userId,
              readAt: new Date().toISOString()
            });
          }
        }

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle status updates
    socket.on('update_status', (data: { status: 'online' | 'offline' }) => {
      if (!socket.data.userId) return;

      socket.data.status = data.status;
      socket.data.lastSeen = new Date();

      // Update global user status
      const userStatus = connectedUsers.get(socket.data.userId);
      if (userStatus) {
        userStatus.status = data.status;
        userStatus.lastSeen = new Date();
      }

      // Broadcast status change to all connected clients
      socket.broadcast.emit('user_status_changed', {
        userId: socket.data.userId,
        status: data.status,
        lastSeen: socket.data.lastSeen.toISOString()
      });
    });

    // Handle connection health check
    socket.on('ping', (data: { timestamp: number }) => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnections
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      if (socket.data.userId) {
        // Update user status to offline
        const userStatus = connectedUsers.get(socket.data.userId);
        if (userStatus) {
          userStatus.status = 'offline';
          userStatus.lastSeen = new Date();
        }

        // Notify users in joined rooms about offline status
        if (socket.data.joinedRooms) {
          for (const roomName of socket.data.joinedRooms) {
            socket.to(roomName).emit('user_offline', {
              userId: socket.data.userId,
              userName: socket.data.userName!
            });
          }
        }

        // Broadcast offline status to all connected clients
        socket.broadcast.emit('user_status_changed', {
          userId: socket.data.userId,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
      }
    });
  });

  // Setup periodic ping to check connection health
  setInterval(() => {
    io.emit('ping');
  }, 30000); // Every 30 seconds

  console.log('Comprehensive Socket.io chat handlers setup complete');
};
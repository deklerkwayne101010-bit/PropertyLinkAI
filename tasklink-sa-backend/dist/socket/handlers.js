"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../services/auth");
const notification_1 = require("../controllers/notification");
const sanitizeHtml = (text) => {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
};
const validateMessageContent = (content) => {
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
const prisma = new client_1.PrismaClient();
const connectedUsers = new Map();
const setupSocketHandlers = (io) => {
    io.use(async (socket, next) => {
        try {
            console.log(`Socket connection attempt from ${socket.handshake.address}`);
            next();
        }
        catch (error) {
            next(new Error('Socket authentication middleware failed'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.data = {
            userId: undefined,
            userName: undefined,
            email: undefined,
            status: 'online',
            lastSeen: new Date(),
            joinedRooms: new Set()
        };
        socket.on('authenticate', async (data) => {
            try {
                const decoded = await auth_1.AuthService.verifyToken(data.token, 'access');
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
                socket.data.userId = user.id;
                socket.data.userName = `${user.firstName} ${user.lastName}`;
                socket.data.email = user.email;
                socket.data.status = 'online';
                socket.data.lastSeen = new Date();
                const userStatus = {
                    userId: user.id,
                    userName: socket.data.userName,
                    status: 'online',
                    lastSeen: new Date(),
                    joinedRooms: new Set()
                };
                connectedUsers.set(user.id, userStatus);
                socket.emit('authenticated', {
                    userId: user.id,
                    userName: socket.data.userName
                });
                console.log(`User authenticated: ${socket.data.userName} (${user.id})`);
            }
            catch (error) {
                console.error('Socket authentication error:', error);
                socket.emit('authentication_failed', { error: 'Invalid or expired token' });
                socket.disconnect();
            }
        });
        socket.on('join_job_room', async (data) => {
            try {
                if (!socket.data.userId) {
                    socket.emit('room_error', { error: 'Authentication required', roomId: data.jobId });
                    return;
                }
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
                const hasAccess = job.posterId === socket.data.userId || job.workerId === socket.data.userId;
                if (!hasAccess) {
                    socket.emit('room_error', { error: 'Access denied to job chat', roomId: data.jobId });
                    return;
                }
                const roomName = `job_${data.jobId}`;
                await socket.join(roomName);
                socket.data.joinedRooms?.add(roomName);
                const userStatus = connectedUsers.get(socket.data.userId);
                if (userStatus) {
                    userStatus.joinedRooms.add(roomName);
                }
                socket.emit('joined_room', { roomId: roomName, roomType: 'job' });
                socket.to(roomName).emit('user_online', {
                    userId: socket.data.userId,
                    userName: socket.data.userName
                });
                console.log(`User ${socket.data.userName} joined job room: ${roomName}`);
            }
            catch (error) {
                console.error('Error joining job room:', error);
                socket.emit('room_error', { error: 'Failed to join room', roomId: data.jobId });
            }
        });
        socket.on('leave_job_room', async (data) => {
            try {
                const roomName = `job_${data.jobId}`;
                await socket.leave(roomName);
                socket.data.joinedRooms?.delete(roomName);
                const userStatus = connectedUsers.get(socket.data.userId);
                if (userStatus) {
                    userStatus.joinedRooms.delete(roomName);
                }
                socket.emit('left_room', { roomId: roomName });
                socket.to(roomName).emit('user_offline', {
                    userId: socket.data.userId,
                    userName: socket.data.userName
                });
                console.log(`User ${socket.data.userName} left job room: ${roomName}`);
            }
            catch (error) {
                console.error('Error leaving job room:', error);
            }
        });
        socket.on('send_message', async (data) => {
            try {
                if (!socket.data.userId) {
                    socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Authentication required' });
                    return;
                }
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
                const validation = validateMessageContent(data.content);
                if (!validation.isValid) {
                    socket.emit('error', { code: 'INVALID_MESSAGE', message: validation.error || 'Invalid message' });
                    return;
                }
                const sanitizedContent = sanitizeHtml(data.content);
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
                const messageData = {
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
                    const otherParticipantId = jobDetails.posterId === socket.data.userId ? jobDetails.workerId : jobDetails.posterId;
                    if (otherParticipantId) {
                        try {
                            await (0, notification_1.createNotification)(otherParticipantId, 'New Message', `${socket.data.userName} sent you a message about "${job.title}"`, 'MESSAGE_RECEIVED', {
                                actionUrl: `/jobs/${job.id}/chat`,
                                jobId: job.id
                            });
                        }
                        catch (notificationError) {
                            console.error('Error creating notification:', notificationError);
                        }
                    }
                }
                const roomName = `job_${data.jobId}`;
                io.to(roomName).emit('message_received', { message: messageData });
                socket.emit('message_sent', { message: messageData });
                console.log(`Message sent by ${socket.data.userName} in job ${data.jobId}`);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { code: 'SEND_FAILED', message: 'Failed to send message' });
            }
        });
        socket.on('typing_start', (data) => {
            if (!socket.data.userId || !socket.data.userName)
                return;
            const roomName = `job_${data.jobId}`;
            socket.to(roomName).emit('typing_start', {
                userId: socket.data.userId,
                userName: socket.data.userName,
                roomId: roomName
            });
        });
        socket.on('typing_stop', (data) => {
            if (!socket.data.userId || !socket.data.userName)
                return;
            const roomName = `job_${data.jobId}`;
            socket.to(roomName).emit('typing_stop', {
                userId: socket.data.userId,
                userName: socket.data.userName,
                roomId: roomName
            });
        });
        socket.on('mark_messages_read', async (data) => {
            try {
                if (!socket.data.userId)
                    return;
                await prisma.message.updateMany({
                    where: {
                        id: { in: data.messageIds },
                        senderId: { not: socket.data.userId }
                    },
                    data: {
                        isRead: true,
                        readAt: new Date()
                    }
                });
                const messages = await prisma.message.findMany({
                    where: { id: { in: data.messageIds } },
                    select: { id: true, jobId: true }
                });
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
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        socket.on('update_status', (data) => {
            if (!socket.data.userId)
                return;
            socket.data.status = data.status;
            socket.data.lastSeen = new Date();
            const userStatus = connectedUsers.get(socket.data.userId);
            if (userStatus) {
                userStatus.status = data.status;
                userStatus.lastSeen = new Date();
            }
            socket.broadcast.emit('user_status_changed', {
                userId: socket.data.userId,
                status: data.status,
                lastSeen: socket.data.lastSeen.toISOString()
            });
        });
        socket.on('ping', (data) => {
            socket.emit('pong', { timestamp: Date.now() });
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            if (socket.data.userId) {
                const userStatus = connectedUsers.get(socket.data.userId);
                if (userStatus) {
                    userStatus.status = 'offline';
                    userStatus.lastSeen = new Date();
                }
                if (socket.data.joinedRooms) {
                    for (const roomName of socket.data.joinedRooms) {
                        socket.to(roomName).emit('user_offline', {
                            userId: socket.data.userId,
                            userName: socket.data.userName
                        });
                    }
                }
                socket.broadcast.emit('user_status_changed', {
                    userId: socket.data.userId,
                    status: 'offline',
                    lastSeen: new Date().toISOString()
                });
            }
        });
    });
    setInterval(() => {
        io.emit('ping');
    }, 30000);
    console.log('Comprehensive Socket.io chat handlers setup complete');
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=handlers.js.map
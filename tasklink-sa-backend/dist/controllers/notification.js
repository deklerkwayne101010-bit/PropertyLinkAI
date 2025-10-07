"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = exports.createNotification = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createNotification = async (userId, title, message, type, options) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                actionUrl: options?.actionUrl,
                jobId: options?.jobId,
                isRead: false,
            }
        });
        return notification;
    }
    catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
exports.createNotification = createNotification;
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const [notifications, totalCount] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.notification.count({
                where: { userId }
            })
        ]);
        const formattedNotifications = notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.isRead,
            readAt: notification.readAt?.toISOString(),
            actionUrl: notification.actionUrl || undefined,
            jobId: notification.jobId || undefined,
            createdAt: notification.createdAt.toISOString()
        }));
        res.status(200).json({
            success: true,
            data: {
                notifications: formattedNotifications,
                totalCount,
                hasMore: offset + limit < totalCount
            }
        });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve notifications'
        });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (!notificationId) {
            return res.status(400).json({
                success: false,
                error: 'Notification ID is required'
            });
        }
        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                userId
            },
            data: {
                isRead: true,
                readAt: new Date()
            }
        });
        res.status(200).json({
            success: true,
            data: {
                id: notification.id,
                isRead: notification.isRead,
                readAt: notification.readAt?.toISOString()
            },
            message: 'Notification marked as read'
        });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const result = await prisma.notification.updateMany({
            where: {
                userId,
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
                markedCount: result.count
            },
            message: `${result.count} notifications marked as read`
        });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notifications as read'
        });
    }
};
exports.markAllAsRead = markAllAsRead;
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
        res.status(200).json({
            success: true,
            data: {
                unreadCount
            }
        });
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread notification count'
        });
    }
};
exports.getUnreadCount = getUnreadCount;
//# sourceMappingURL=notification.js.map
import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        isWorker: boolean;
        isClient: boolean;
    };
}
export declare const createNotification: (userId: string, title: string, message: string, type: string, options?: {
    actionUrl?: string;
    jobId?: string;
}) => Promise<{
    message: string;
    type: import(".prisma/client").$Enums.NotificationType;
    userId: string;
    id: string;
    createdAt: Date;
    jobId: string | null;
    title: string;
    isRead: boolean;
    readAt: Date | null;
    actionUrl: string | null;
}>;
export declare const getNotifications: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAsRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markAllAsRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadCount: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=notification.d.ts.map
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
export declare const getChatHistory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendMessage: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadCount: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markMessagesAsRead: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMessage: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getChatRooms: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createSystemMessage: (jobId: string, message: string, messageType?: "TEXT" | "SYSTEM") => Promise<{
    id: string;
    createdAt: Date;
    jobId: string | null;
    isRead: boolean;
    readAt: Date | null;
    content: string;
    messageType: import(".prisma/client").$Enums.MessageType;
    senderId: string;
    receiverId: string;
}>;
export declare const generateJobStatusMessage: (oldStatus: string, newStatus: string, jobTitle: string) => string;
export declare const searchMessages: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=message.d.ts.map
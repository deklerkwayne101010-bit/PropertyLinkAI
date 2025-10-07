import { Server as SocketServer } from 'socket.io';
export interface ServerToClientEvents {
    authenticated: (data: {
        userId: string;
        userName: string;
    }) => void;
    authentication_failed: (data: {
        error: string;
    }) => void;
    joined_room: (data: {
        roomId: string;
        roomType: 'job' | 'direct';
    }) => void;
    left_room: (data: {
        roomId: string;
    }) => void;
    room_error: (data: {
        error: string;
        roomId?: string;
    }) => void;
    message_sent: (data: {
        message: MessageData;
    }) => void;
    message_received: (data: {
        message: MessageData;
    }) => void;
    message_updated: (data: {
        messageId: string;
        updates: Partial<MessageData>;
    }) => void;
    message_deleted: (data: {
        messageId: string;
    }) => void;
    messages_read: (data: {
        messageIds: string[];
        readBy: string;
        readAt: string;
    }) => void;
    read_status_updated: (data: {
        messageId: string;
        readBy: string[];
        readAt: string;
    }) => void;
    typing_start: (data: {
        userId: string;
        userName: string;
        roomId: string;
    }) => void;
    typing_stop: (data: {
        userId: string;
        userName: string;
        roomId: string;
    }) => void;
    user_online: (data: {
        userId: string;
        userName: string;
    }) => void;
    user_offline: (data: {
        userId: string;
        userName: string;
    }) => void;
    user_status_changed: (data: {
        userId: string;
        status: 'online' | 'offline';
        lastSeen: string;
    }) => void;
    system_message: (data: {
        message: MessageData;
        roomId: string;
    }) => void;
    job_status_updated: (data: {
        jobId: string;
        oldStatus: string;
        newStatus: string;
        message: string;
    }) => void;
    notification: (data: {
        title: string;
        message: string;
        type: string;
        actionUrl?: string;
    }) => void;
    ping: () => void;
    pong: (data: {
        timestamp: number;
    }) => void;
    error: (data: {
        code: string;
        message: string;
        details?: any;
    }) => void;
}
export interface ClientToServerEvents {
    authenticate: (data: {
        token: string;
    }) => void;
    join_job_room: (data: {
        jobId: string;
    }) => void;
    leave_job_room: (data: {
        jobId: string;
    }) => void;
    send_message: (data: {
        jobId: string;
        content: string;
        messageType?: 'TEXT' | 'IMAGE' | 'FILE';
        attachment?: {
            url: string;
            filename: string;
            size: number;
        };
    }) => void;
    mark_messages_read: (data: {
        messageIds: string[];
    }) => void;
    delete_message: (data: {
        messageId: string;
    }) => void;
    typing_start: (data: {
        jobId: string;
    }) => void;
    typing_stop: (data: {
        jobId: string;
    }) => void;
    update_status: (data: {
        status: 'online' | 'offline';
    }) => void;
    ping: (data: {
        timestamp: number;
    }) => void;
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
export declare const setupSocketHandlers: (io: SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => void;
//# sourceMappingURL=handlers.d.ts.map
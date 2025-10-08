interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}
interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private static transporter;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hashedPassword: string): Promise<boolean>;
    static generateToken(payload: JWTPayload, type?: 'access' | 'refresh'): Promise<string>;
    static generateTokenPair(payload: Omit<JWTPayload, 'type'>): Promise<TokenPair>;
    static verifyToken(token: string, type?: 'access' | 'refresh'): Promise<JWTPayload>;
    static sendVerificationEmail(email: string, token: string): Promise<void>;
    static sendPasswordResetEmail(email: string, token: string): Promise<void>;
    static generateSecureToken(): string;
    static createVerificationToken(userId: string, email: string): Promise<string>;
    static createPasswordResetToken(email: string): Promise<string>;
    static validatePasswordStrength(password: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    static logAuthEvent(userId: string | null, action: string, entityType: string, entityId: string, metadata?: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static logSecurityEvent(userId: string | null, event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any, ipAddress?: string, userAgent?: string): Promise<void>;
    static trackFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    static trackAccountLockout(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    static trackSuspiciousActivity(userId: string | null, activity: string, details: any, ipAddress?: string, userAgent?: string): Promise<void>;
}
export {};
//# sourceMappingURL=auth.d.ts.map
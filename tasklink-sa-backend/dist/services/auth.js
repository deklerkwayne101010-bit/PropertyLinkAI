"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const prisma = new client_1.PrismaClient();
class AuthService {
    static async hashPassword(password) {
        const saltRounds = config_1.config.bcryptRounds;
        return bcryptjs_1.default.hash(password, saltRounds);
    }
    static async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    static async generateToken(payload, type = 'access') {
        const secret = type === 'access' ? config_1.config.jwtSecret : config_1.config.jwtRefreshSecret;
        const expiresIn = type === 'access' ? config_1.config.jwtExpiresIn : config_1.config.jwtRefreshExpiresIn;
        return jsonwebtoken_1.default.sign({ ...payload, type }, secret, { expiresIn: expiresIn });
    }
    static async generateTokenPair(payload) {
        const basePayload = { ...payload, type: 'access' };
        const refreshPayload = { ...payload, type: 'refresh' };
        const accessToken = await this.generateToken(basePayload, 'access');
        const refreshToken = await this.generateToken(refreshPayload, 'refresh');
        return { accessToken, refreshToken };
    }
    static async verifyToken(token, type = 'access') {
        const secret = type === 'access' ? config_1.config.jwtSecret : config_1.config.jwtRefreshSecret;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.type !== type) {
                throw new Error('Invalid token type');
            }
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    static async sendVerificationEmail(email, token) {
        const verificationUrl = `${config_1.config.apiBaseUrl}/api/auth/verify-email?token=${token}`;
        const mailOptions = {
            from: `"${config_1.config.fromName}" <${config_1.config.fromEmail}>`,
            to: email,
            subject: 'Verify Your TaskLink SA Account',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to TaskLink SA!</h2>
          <p>Thank you for registering with TaskLink SA. Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p><small>If you didn't create an account with TaskLink SA, please ignore this email.</small></p>
          <p><small>This verification link will expire in 24 hours.</small></p>
        </div>
      `,
        };
        await this.transporter.sendMail(mailOptions);
    }
    static async sendPasswordResetEmail(email, token) {
        const resetUrl = `${config_1.config.clientUrl}/reset-password?token=${token}`;
        const mailOptions = {
            from: `"${config_1.config.fromName}" <${config_1.config.fromEmail}>`,
            to: email,
            subject: 'Reset Your TaskLink SA Password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You have requested to reset your password for your TaskLink SA account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p><small>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</small></p>
          <p><small>This reset link will expire in 1 hour.</small></p>
        </div>
      `,
        };
        await this.transporter.sendMail(mailOptions);
    }
    static generateSecureToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    static async createVerificationToken(userId, email) {
        const token = this.generateSecureToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.emailVerificationToken.create({
            data: {
                token,
                email,
                userId,
                expiresAt,
            },
        });
        return token;
    }
    static async createPasswordResetToken(email) {
        const token = this.generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        return token;
    }
    static async validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/(?=.*[@$!%*?&])/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    static async logAuthEvent(userId, action, entityType, entityId, metadata, ipAddress, userAgent) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    entityType,
                    entityId,
                    newValues: metadata ? JSON.stringify(metadata) : null,
                    ipAddress,
                    userAgent,
                },
            });
        }
        catch (error) {
            console.error('Failed to log auth event:', error);
        }
    }
    static async logSecurityEvent(userId, event, severity, details, ipAddress, userAgent) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: `SECURITY_${event.toUpperCase()}`,
                    entityType: 'Security',
                    entityId: `security_${Date.now()}`,
                    newValues: JSON.stringify({
                        event,
                        severity,
                        details,
                        timestamp: new Date().toISOString(),
                    }),
                    ipAddress,
                    userAgent,
                },
            });
        }
        catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
    static async trackFailedLogin(email, ipAddress, userAgent) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true }
            });
            await this.logSecurityEvent(user?.id || null, 'FAILED_LOGIN', 'medium', { email, reason: 'invalid_credentials' }, ipAddress, userAgent);
        }
        catch (error) {
            console.error('Failed to track failed login:', error);
        }
    }
    static async trackAccountLockout(userId, ipAddress, userAgent) {
        await this.logSecurityEvent(userId, 'ACCOUNT_LOCKOUT', 'high', { reason: 'multiple_failed_attempts' }, ipAddress, userAgent);
    }
    static async trackSuspiciousActivity(userId, activity, details, ipAddress, userAgent) {
        await this.logSecurityEvent(userId, 'SUSPICIOUS_ACTIVITY', 'high', { activity, details }, ipAddress, userAgent);
    }
}
exports.AuthService = AuthService;
AuthService.transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtpHost,
    port: config_1.config.smtpPort,
    secure: false,
    auth: {
        user: config_1.config.smtpUser,
        pass: config_1.config.smtpPass,
    },
});
//# sourceMappingURL=auth.js.map
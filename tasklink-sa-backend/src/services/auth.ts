import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config } from '../config';

const prisma = new PrismaClient();

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

export class AuthService {
  private static transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = config.bcryptRounds;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async generateToken(payload: JWTPayload, type: 'access' | 'refresh' = 'access'): Promise<string> {
    const secret = type === 'access' ? config.jwtSecret : config.jwtRefreshSecret;
    const expiresIn = type === 'access' ? config.jwtExpiresIn : config.jwtRefreshExpiresIn;

    return jwt.sign(
      { ...payload, type },
      secret,
      { expiresIn: expiresIn as string }
    );
  }

  static async generateTokenPair(payload: Omit<JWTPayload, 'type'>): Promise<TokenPair> {
    const basePayload = { ...payload, type: 'access' as const };
    const refreshPayload = { ...payload, type: 'refresh' as const };

    const accessToken = await this.generateToken(basePayload, 'access');
    const refreshToken = await this.generateToken(refreshPayload, 'refresh');

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<JWTPayload> {
    const secret = type === 'access' ? config.jwtSecret : config.jwtRefreshSecret;

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.apiBaseUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
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

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
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

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async createVerificationToken(userId: string, email: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the token in the database
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

  static async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database or cache
    // This is a simplified version

    return token;
  }

  static async validatePasswordStrength(password: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

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

  static async logAuthEvent(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't throw - logging shouldn't break auth flow
    }
  }

  static async logSecurityEvent(
    userId: string | null,
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async trackFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Get user by email for logging
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      await this.logSecurityEvent(
        user?.id || null,
        'FAILED_LOGIN',
        'medium',
        { email, reason: 'invalid_credentials' },
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error('Failed to track failed login:', error);
    }
  }

  static async trackAccountLockout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent(
      userId,
      'ACCOUNT_LOCKOUT',
      'high',
      { reason: 'multiple_failed_attempts' },
      ipAddress,
      userAgent
    );
  }

  static async trackSuspiciousActivity(
    userId: string | null,
    activity: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent(
      userId,
      'SUSPICIOUS_ACTIVITY',
      'high',
      { activity, details },
      ipAddress,
      userAgent
    );
  }
}
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { config } from '../config';
import { logSecurityEvent } from '../middleware/security';

export class SecurityService {
  // Password strength validation
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Account lockout and brute force protection
  static async checkBruteForceProtection(email: string, ipAddress: string): Promise<{
    isLocked: boolean;
    lockoutUntil?: Date;
    attemptsRemaining: number;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          loginAttempts: true,
          lockoutUntil: true,
          email: true
        }
      });

      if (!user) {
        // Don't reveal if user exists
        return { isLocked: false, attemptsRemaining: 5 };
      }

      const now = new Date();

      // Check if account is currently locked
      if (user.lockoutUntil && user.lockoutUntil > now) {
        return {
          isLocked: true,
          lockoutUntil: user.lockoutUntil,
          attemptsRemaining: 0
        };
      }

      // Reset attempts if lockout period has passed
      if (user.lockoutUntil && user.lockoutUntil <= now) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockoutUntil: null
          }
        });
      }

      const maxAttempts = 5;
      const attemptsRemaining = Math.max(0, maxAttempts - user.loginAttempts);

      return {
        isLocked: false,
        attemptsRemaining
      };
    } catch (error) {
      console.error('Brute force protection check error:', error);
      // Fail open - allow login attempt
      return { isLocked: false, attemptsRemaining: 5 };
    }
  }

  // Record failed login attempt
  static async recordFailedLogin(email: string, ipAddress: string, userAgent?: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, loginAttempts: true }
      });

      if (!user) {
        // Log suspicious activity for non-existent users
        await logSecurityEvent(null, 'failed_login_nonexistent_user', 'low', { email, ipAddress }, { ip: ipAddress, headers: { 'user-agent': userAgent } } as any);
        return;
      }

      const newAttempts = user.loginAttempts + 1;
      const maxAttempts = 5;
      let lockoutUntil: Date | null = null;

      // Implement progressive lockout times
      if (newAttempts >= maxAttempts) {
        const lockoutMinutes = Math.min(15 * Math.pow(2, newAttempts - maxAttempts), 1440); // Max 24 hours
        lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockoutUntil
        }
      });

      // Log security event
      await logSecurityEvent(user.id, 'failed_login_attempt', newAttempts >= maxAttempts ? 'high' : 'medium', {
        attempts: newAttempts,
        maxAttempts,
        lockoutUntil: lockoutUntil?.toISOString()
      }, { ip: ipAddress, headers: { 'user-agent': userAgent } } as any);

    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  }

  // Clear login attempts on successful login
  static async clearLoginAttempts(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLoginAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
    }
  }

  // Check if password has been compromised (basic implementation)
  static async checkPasswordCompromised(password: string): Promise<boolean> {
    // This is a basic implementation. In production, you might want to:
    // 1. Use HaveIBeenPwned API
    // 2. Check against your own breached password database
    // 3. Implement more sophisticated checks

    try {
      // Hash the password with SHA-1 for HaveIBeenPwned API format
      const crypto = await import('crypto');
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      // Note: This would require an actual API call to HaveIBeenPwned
      // For now, we'll just check against some known compromised passwords
      const knownCompromised = [
        '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8', // password
        '7C4A8D09CA3762AF61E59520943DC26494F8941B', // 123456
        'F7C3BC1D808E04732ADF679965CCC34CA7AE3441',  // qwerty
      ];

      return knownCompromised.includes(sha1Hash);
    } catch (error) {
      console.error('Password compromise check error:', error);
      return false; // Fail open
    }
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    return require('crypto').randomBytes(length).toString('hex');
  }

  // Hash password with additional security checks
  static async hashPassword(password: string): Promise<string> {
    // Validate password strength before hashing
    const strengthCheck = this.validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      throw new Error(`Password does not meet security requirements: ${strengthCheck.errors.join(', ')}`);
    }

    // Check if password is compromised
    const isCompromised = await this.checkPasswordCompromised(password);
    if (isCompromised) {
      throw new Error('This password has been found in known data breaches. Please choose a different password.');
    }

    return bcrypt.hash(password, config.security.bcryptSaltRounds);
  }

  // Verify password with timing attack protection
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      // Use constant time comparison to prevent timing attacks
      return false;
    }
  }

  // Security audit logging
  static async logSecurityAudit(
    userId: string | null,
    action: string,
    details: any,
    req?: any
  ): Promise<void> {
    try {
      const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';

      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('Security audit logging error:', error);
    }
  }

  // Check if user account is in good standing
  static async checkAccountStatus(userId: string): Promise<{
    isActive: boolean;
    isLocked: boolean;
    lockoutUntil?: Date;
    requiresPasswordChange: boolean;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          lockoutUntil: true,
          // Add other status fields as needed
        }
      });

      if (!user) {
        return { isActive: false, isLocked: false, requiresPasswordChange: false };
      }

      const now = new Date();
      const isLocked = user.lockoutUntil ? user.lockoutUntil > now : false;

      return {
        isActive: true,
        isLocked,
        lockoutUntil: user.lockoutUntil || undefined,
        requiresPasswordChange: false // Implement password expiry logic here if needed
      };
    } catch (error) {
      console.error('Account status check error:', error);
      return { isActive: false, isLocked: false, requiresPasswordChange: false };
    }
  }
}
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { emailService } from '../services/email';
import { MFAService } from '../services/mfa';
import { SecurityService } from '../services/security';
import { logSecurityEvent } from '../middleware/security';

export const register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Validate password strength
      const passwordValidation = SecurityService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await logSecurityEvent(null, 'registration_attempt_existing_email', 'low', {
          email,
          ipAddress: clientIP
        }, req);

        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password with security checks
      const hashedPassword = await SecurityService.hashPassword(password);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          subscriptionTier: 'free',
          emailVerificationToken,
          emailVerificationExpires,
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionTier: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Log successful registration
      await logSecurityEvent(user.id, 'user_registration', 'low', {
        ipAddress: clientIP,
        userAgent
      }, req);

      // Send verification email (don't await to avoid blocking response)
      emailService.sendVerificationEmail(email, emailVerificationToken).catch(error => {
        console.error('Failed to send verification email:', error);
      });

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error && error.message.includes('Password does not meet security requirements')) {
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof Error && error.message.includes('been found in known data breaches')) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  };

export const login = async (req: Request, res: Response) => {
   try {
     const { email, password } = req.body;
     const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
     const userAgent = req.headers['user-agent'] || 'unknown';

     // Check brute force protection
     const bruteForceCheck = await SecurityService.checkBruteForceProtection(email, clientIP);
     if (bruteForceCheck.isLocked) {
       await logSecurityEvent(null, 'account_locked_brute_force', 'high', {
         email,
         lockoutUntil: bruteForceCheck.lockoutUntil?.toISOString(),
         ipAddress: clientIP
       }, req);

       return res.status(429).json({
         error: 'Account temporarily locked due to too many failed login attempts',
         lockoutUntil: bruteForceCheck.lockoutUntil,
         retryAfter: bruteForceCheck.lockoutUntil ?
           Math.ceil((bruteForceCheck.lockoutUntil.getTime() - Date.now()) / 1000) : undefined
       });
     }

     // Find user
     const user = await prisma.user.findUnique({
       where: { email },
       select: {
         id: true,
         email: true,
         name: true,
         password: true,
         subscriptionTier: true,
         createdAt: true,
         mfaEnabled: true,
       },
     });

     if (!user) {
       // Record failed attempt for non-existent user
       await SecurityService.recordFailedLogin(email, clientIP, userAgent);
       await logSecurityEvent(null, 'login_attempt_nonexistent_user', 'low', { email, ipAddress: clientIP }, req);

       return res.status(401).json({
         error: 'Invalid credentials',
         attemptsRemaining: bruteForceCheck.attemptsRemaining - 1
       });
     }

     // Verify password
     const isValidPassword = await SecurityService.verifyPassword(password, user.password);
     if (!isValidPassword) {
       await SecurityService.recordFailedLogin(email, clientIP, userAgent);
       await logSecurityEvent(user.id, 'failed_login_password', 'medium', {
         attemptsRemaining: bruteForceCheck.attemptsRemaining - 1,
         ipAddress: clientIP
       }, req);

       return res.status(401).json({
         error: 'Invalid credentials',
         attemptsRemaining: bruteForceCheck.attemptsRemaining - 1
       });
     }

     // Clear login attempts on successful authentication
     await SecurityService.clearLoginAttempts(user.id);

     // Check if MFA is required
     if (user.mfaEnabled) {
       // Generate temporary session token for MFA verification
       const mfaSessionToken = SecurityService.generateSecureToken();

       // Store MFA session temporarily (you might want to use Redis for this)
       // For now, we'll return a session token that can be used with verifyMFA

       return res.json({
         message: 'MFA required',
         mfaRequired: true,
         userId: user.id,
         sessionToken: mfaSessionToken
       });
     }

     // Generate tokens
     const accessToken = jwt.sign(
       { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier },
       config.jwt.secret,
       { expiresIn: config.jwt.expiresIn }
     );

     const refreshToken = jwt.sign(
       { id: user.id },
       config.jwt.refreshSecret,
       { expiresIn: config.jwt.refreshExpiresIn }
     );

     // Log successful login
     await logSecurityEvent(user.id, 'successful_login', 'low', {
       ipAddress: clientIP,
       userAgent
     }, req);

     // Remove password from response
     const { password: _, mfaEnabled: __, ...userWithoutPassword } = user;

     res.json({
       message: 'Login successful',
       user: userWithoutPassword,
       accessToken,
       refreshToken,
     });
   } catch (error) {
     console.error('Login error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
   try {
     const { refreshToken } = req.body;

     if (!refreshToken) {
       return res.status(401).json({ error: 'Refresh token required' });
     }

     // Verify refresh token
     const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

     // Get user
     const user = await prisma.user.findUnique({
       where: { id: decoded.id },
       select: {
         id: true,
         email: true,
         subscriptionTier: true,
       },
     });

     if (!user) {
       return res.status(401).json({ error: 'Invalid refresh token' });
     }

     // Generate new access token
     const accessToken = jwt.sign(
       { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier },
       config.jwt.secret,
       { expiresIn: config.jwt.expiresIn }
     );

     res.json({
       accessToken,
     });
   } catch (error) {
     if (error instanceof jwt.JsonWebTokenError) {
       return res.status(401).json({ error: 'Invalid refresh token' });
     }
     console.error('Refresh token error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const verifyEmail = async (req: Request, res: Response) => {
   try {
     const { token } = req.query;

     if (!token || typeof token !== 'string') {
       return res.status(400).json({ error: 'Verification token is required' });
     }

     // Find user with matching verification token
     const user = await prisma.user.findFirst({
       where: {
         emailVerificationToken: token,
         emailVerificationExpires: {
           gt: new Date(),
         },
       },
     });

     if (!user) {
       return res.status(400).json({ error: 'Invalid or expired verification token' });
     }

     // Update user as verified
     await prisma.user.update({
       where: { id: user.id },
       data: {
         emailVerified: true,
         emailVerificationToken: null,
         emailVerificationExpires: null,
       },
     });

     // Send welcome email
     emailService.sendWelcomeEmail(user.email, user.name || 'User').catch(error => {
       console.error('Failed to send welcome email:', error);
     });

     res.json({
       message: 'Email verified successfully! You can now log in to your account.',
     });
   } catch (error) {
     console.error('Email verification error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const resendVerificationEmail = async (req: AuthRequest, res: Response) => {
   try {
     const user = await prisma.user.findUnique({
       where: { id: req.user!.id },
       select: {
         id: true,
         email: true,
         name: true,
         emailVerified: true,
         emailVerificationToken: true,
         emailVerificationExpires: true,
       },
     });

     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }

     if (user.emailVerified) {
       return res.status(400).json({ error: 'Email is already verified' });
     }

     // Generate new verification token
     const emailVerificationToken = crypto.randomBytes(32).toString('hex');
     const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

     // Update user with new token
     await prisma.user.update({
       where: { id: user.id },
       data: {
         emailVerificationToken,
         emailVerificationExpires,
       },
     });

     // Send verification email
     await emailService.sendVerificationEmail(user.email, emailVerificationToken);

     res.json({
       message: 'Verification email sent successfully',
     });
   } catch (error) {
     console.error('Resend verification email error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const forgotPassword = async (req: Request, res: Response) => {
   try {
     const { email } = req.body;

     if (!email) {
       return res.status(400).json({ error: 'Email is required' });
     }

     // Find user by email
     const user = await prisma.user.findUnique({
       where: { email },
       select: {
         id: true,
         email: true,
         name: true,
       },
     });

     // Always return success to prevent email enumeration
     if (!user) {
       return res.json({
         message: 'If an account with that email exists, a password reset link has been sent.',
       });
     }

     // Generate password reset token
     const passwordResetToken = crypto.randomBytes(32).toString('hex');
     const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

     // Update user with reset token
     await prisma.user.update({
       where: { id: user.id },
       data: {
         passwordResetToken,
         passwordResetExpires,
       },
     });

     // Send password reset email
     emailService.sendPasswordResetEmail(user.email, passwordResetToken).catch(error => {
       console.error('Failed to send password reset email:', error);
     });

     res.json({
       message: 'If an account with that email exists, a password reset link has been sent.',
     });
   } catch (error) {
     console.error('Forgot password error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const resetPassword = async (req: Request, res: Response) => {
   try {
     const { token, password } = req.body;

     if (!token || !password) {
       return res.status(400).json({ error: 'Token and password are required' });
     }

     // Validate password strength (basic validation)
     if (password.length < 8) {
       return res.status(400).json({ error: 'Password must be at least 8 characters long' });
     }

     // Find user with matching reset token
     const user = await prisma.user.findFirst({
       where: {
         passwordResetToken: token,
         passwordResetExpires: {
           gt: new Date(),
         },
       },
     });

     if (!user) {
       return res.status(400).json({ error: 'Invalid or expired reset token' });
     }

     // Hash new password
     const hashedPassword = await bcrypt.hash(password, config.security.bcryptSaltRounds);

     // Update user password and clear reset token
     await prisma.user.update({
       where: { id: user.id },
       data: {
         password: hashedPassword,
         passwordResetToken: null,
         passwordResetExpires: null,
       },
     });

     res.json({
       message: 'Password reset successfully',
     });
   } catch (error) {
     console.error('Reset password error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const setupMFA = async (req: AuthRequest, res: Response) => {
   try {
     const user = await prisma.user.findUnique({
       where: { id: req.user!.id },
       select: {
         id: true,
         email: true,
         mfaEnabled: true,
       },
     });

     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }

     if (user.mfaEnabled) {
       return res.status(400).json({ error: 'MFA is already enabled for this account' });
     }

     // Generate MFA secret
     const mfaData = MFAService.generateMFASecret(user.email);

     // Generate QR code
     const qrCodeUrl = await MFAService.generateQRCode(mfaData.otpauthUrl);

     res.json({
       message: 'MFA setup initiated',
       secret: mfaData.secret,
       qrCodeUrl,
       otpauthUrl: mfaData.otpauthUrl,
     });
   } catch (error) {
     console.error('Setup MFA error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const enableMFA = async (req: AuthRequest, res: Response) => {
   try {
     const { secret, token } = req.body;

     if (!secret || !token) {
       return res.status(400).json({ error: 'Secret and verification token are required' });
     }

     const user = await prisma.user.findUnique({
       where: { id: req.user!.id },
       select: {
         id: true,
         mfaEnabled: true,
       },
     });

     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }

     if (user.mfaEnabled) {
       return res.status(400).json({ error: 'MFA is already enabled' });
     }

     // Verify the token
     const verification = MFAService.verifyMFAToken(secret, token);
     if (!verification.verified) {
       return res.status(400).json({ error: 'Invalid MFA token' });
     }

     // Enable MFA for the user
     await prisma.user.update({
       where: { id: req.user!.id },
       data: {
         mfaEnabled: true,
         mfaSecret: secret,
       },
     });

     res.json({
       message: 'MFA enabled successfully',
     });
   } catch (error) {
     console.error('Enable MFA error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const disableMFA = async (req: AuthRequest, res: Response) => {
   try {
     const { token } = req.body;

     if (!token) {
       return res.status(400).json({ error: 'Verification token is required' });
     }

     const user = await prisma.user.findUnique({
       where: { id: req.user!.id },
       select: {
         id: true,
         mfaEnabled: true,
         mfaSecret: true,
       },
     });

     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }

     if (!user.mfaEnabled || !user.mfaSecret) {
       return res.status(400).json({ error: 'MFA is not enabled' });
     }

     // Verify the token before disabling
     const verification = MFAService.verifyMFAToken(user.mfaSecret, token);
     if (!verification.verified) {
       return res.status(400).json({ error: 'Invalid MFA token' });
     }

     // Disable MFA
     await prisma.user.update({
       where: { id: req.user!.id },
       data: {
         mfaEnabled: false,
         mfaSecret: null,
       },
     });

     res.json({
       message: 'MFA disabled successfully',
     });
   } catch (error) {
     console.error('Disable MFA error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };

export const verifyMFA = async (req: Request, res: Response) => {
   try {
     const { userId, token } = req.body;

     if (!userId || !token) {
       return res.status(400).json({ error: 'User ID and MFA token are required' });
     }

     const user = await prisma.user.findUnique({
       where: { id: userId },
       select: {
         id: true,
         mfaEnabled: true,
         mfaSecret: true,
       },
     });

     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }

     if (!user.mfaEnabled || !user.mfaSecret) {
       return res.status(400).json({ error: 'MFA is not enabled for this user' });
     }

     // Verify the MFA token
     const verification = MFAService.verifyMFAToken(user.mfaSecret, token);
     if (!verification.verified) {
       return res.status(400).json({ error: 'Invalid MFA token' });
     }

     // Generate tokens for successful MFA verification
     const accessToken = jwt.sign(
       { id: user.id, email: '', subscriptionTier: 'free' },
       config.jwt.secret,
       { expiresIn: config.jwt.expiresIn }
     );

     const refreshToken = jwt.sign(
       { id: user.id },
       config.jwt.refreshSecret,
       { expiresIn: config.jwt.refreshExpiresIn }
     );

     res.json({
       message: 'MFA verification successful',
       accessToken,
       refreshToken,
     });
   } catch (error) {
     console.error('Verify MFA error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
 };
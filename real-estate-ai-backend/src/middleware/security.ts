import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { config } from '../config';

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://autoenhance.ai",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // HSTS (HTTP Strict Transport Security) - only in production
  if (config.server.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// CSRF protection middleware
export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API routes that don't need it (like login)
  if (req.path.startsWith('/api/auth/') && ['POST'].includes(req.method)) {
    return next();
  }

  try {
    const token = req.headers['x-csrf-token'] as string ||
                  req.body._csrf ||
                  req.query._csrf as string;

    if (!token) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    // Verify token exists in database and is not expired
    const csrfToken = await prisma.csrfToken.findUnique({
      where: { token },
      include: { user: true, session: true }
    });

    if (!csrfToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    if (csrfToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.csrfToken.delete({ where: { token } });
      return res.status(403).json({ error: 'CSRF token expired' });
    }

    // Attach user/session info to request for later use
    (req as any).csrfUser = csrfToken.user;
    (req as any).csrfSession = csrfToken.session;

    next();
  } catch (error) {
    console.error('CSRF verification error:', error);
    res.status(500).json({ error: 'CSRF verification failed' });
  }
};

// Generate CSRF token
export const generateCSRFToken = async (userId?: string, sessionId?: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.csrfToken.create({
    data: {
      token,
      userId,
      sessionId,
      expiresAt
    }
  });

  return token;
};

// Rate limiting middleware
export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const endpoint = req.path;
      const key = `${clientIP}:${endpoint}`;

      const windowStart = new Date(Date.now() - windowMs);

      // Check current hits in the window
      const existingRecord = await prisma.rateLimit.findUnique({
        where: { key }
      });

      const now = new Date();
      let hits = 1;

      if (existingRecord) {
        // Check if we're in a new window
        if (existingRecord.windowStart < windowStart) {
          // Reset for new window
          hits = 1;
          await prisma.rateLimit.update({
            where: { key },
            data: {
              hits: 1,
              windowStart: now,
              windowEnd: new Date(now.getTime() + windowMs),
              blocked: false
            }
          });
        } else {
          hits = existingRecord.hits + 1;

          if (hits > maxRequests) {
            // Block the request
            await prisma.rateLimit.update({
              where: { key },
              data: { hits, blocked: true }
            });
            return res.status(429).json({
              error: 'Too many requests',
              retryAfter: Math.ceil((existingRecord.windowEnd.getTime() - now.getTime()) / 1000)
            });
          }

          // Update hit count
          await prisma.rateLimit.update({
            where: { key },
            data: { hits }
          });
        }
      } else {
        // Create new rate limit record
        await prisma.rateLimit.create({
          data: {
            key,
            endpoint,
            hits: 1,
            windowStart: now,
            windowEnd: new Date(now.getTime() + windowMs)
          }
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - hits));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now.getTime() + windowMs) / 1000));

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Don't block on rate limiting errors, just log and continue
      next();
    }
  };
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS prevention - escape HTML characters in string inputs
  const sanitizeString = (str: string): string => {
    return str.replace(/[&<>"']/g, (char) => {
      const entityMap: { [key: string]: string } = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#x27;'
      };
      return entityMap[char] || char;
    });
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Security event logging middleware
export const logSecurityEvent = async (
  userId: string | null,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  details?: any,
  req?: Request
) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';

    await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        severity,
        ipAddress,
        userAgent,
        details,
        location: null // Could be populated with geolocation service
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Clean up expired tokens and rate limits (should be run periodically)
export const cleanupExpiredData = async () => {
  try {
    const now = new Date();

    // Clean up expired CSRF tokens
    await prisma.csrfToken.deleteMany({
      where: { expiresAt: { lt: now } }
    });

    // Clean up expired rate limits
    await prisma.rateLimit.deleteMany({
      where: { windowEnd: { lt: now } }
    });

    console.log('Cleaned up expired security data');
  } catch (error) {
    console.error('Error cleaning up expired security data:', error);
  }
};
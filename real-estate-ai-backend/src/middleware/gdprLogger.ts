import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

export interface GDPRLogData {
  userId?: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

export const logDataProcessing = async (logData: GDPRLogData) => {
  if (!process.env.GDPR_COMPLIANCE) return;

  try {
    await prisma.dataProcessingLog.create({
      data: {
        userId: logData.userId || null,
        action: logData.action,
        resource: logData.resource || null,
        details: logData.details || {},
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log GDPR data processing:', error);
  }
};

export const gdprLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture response data for logging sensitive operations
  let responseData: any = null;

  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Log after response is sent
  res.on('finish', async () => {
    const isSensitive = isSensitiveOperationCheck(req);

    if (isSensitive) {
      await logDataProcessing({
        userId: req.user?.id,
        action: `${req.method} ${req.path}`,
        resource: req.path,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          responseStatus: res.statusCode,
          responseData: responseData,
        },
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || undefined,
      });
    }
  });

  next();
};

const isSensitiveOperationCheck = (req: Request): boolean => {
  const sensitivePaths = [
    '/api/user',
    '/api/properties',
    '/api/auth',
    '/api/gdpr',
    '/api/ai-content', // AI content generation is sensitive
  ];

  return sensitivePaths.some(path => req.path.startsWith(path));
};
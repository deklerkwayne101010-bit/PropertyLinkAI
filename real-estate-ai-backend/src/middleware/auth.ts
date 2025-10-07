import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

export const requireSubscription = (requiredTier: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tiers = ['free', 'premium', 'enterprise'];
    const userTierIndex = tiers.indexOf(req.user.subscriptionTier);
    const requiredTierIndex = tiers.indexOf(requiredTier);

    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({
        error: `This feature requires ${requiredTier} subscription or higher`
      });
    }

    next();
  };
};
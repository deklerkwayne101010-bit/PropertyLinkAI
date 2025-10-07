import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// Custom error classes for better error handling
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  code = 'UNAUTHORIZED';

  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  code = 'FORBIDDEN';

  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class AIError extends Error implements AppError {
  statusCode = 503;
  isOperational = true;
  code = 'AI_SERVICE_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

export class RateLimitError extends Error implements AppError {
  statusCode = 429;
  isOperational = true;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
    code = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (error.name === 'AIError') {
    statusCode = 503;
    message = 'AI service temporarily unavailable';
    code = 'AI_SERVICE_ERROR';
  } else if (error.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Rate limit exceeded';
    code = 'RATE_LIMIT_EXCEEDED';
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.message.includes('Unique constraint')) {
      statusCode = 409;
      message = 'Resource already exists';
      code = 'DUPLICATE_RESOURCE';
    } else if (error.message.includes('Foreign key constraint')) {
      statusCode = 400;
      message = 'Invalid reference';
      code = 'INVALID_REFERENCE';
    }
  }

  // Handle Redis errors
  if (error.name === 'RedisError' || error.message.includes('Redis')) {
    statusCode = 503;
    message = 'Cache service unavailable';
    code = 'CACHE_ERROR';
  }

  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      code,
    });
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: error.message
    }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
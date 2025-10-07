import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Query validation failed',
        details: errors,
      });
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: 'Parameter validation failed',
        details: errors,
      });
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

// AI Content validation schemas
export const aiContentSchemas = {
  generateContent: Joi.object({
    propertyId: Joi.string().uuid().required(),
    platform: Joi.string().valid('property24', 'facebook', 'whatsapp').required(),
    tone: Joi.string().valid('professional', 'enthusiastic', 'luxury', 'friendly', 'formal').required(),
    length: Joi.string().valid('short', 'full').required(),
  }),

  previewContent: Joi.object({
    propertyId: Joi.string().uuid().required(),
    platform: Joi.string().valid('property24', 'facebook', 'whatsapp').required(),
    tone: Joi.string().valid('professional', 'enthusiastic', 'luxury', 'friendly', 'formal').required(),
    length: Joi.string().valid('short', 'full').required(),
  }),

  getGeneratedContent: Joi.object({
    propertyId: Joi.string().uuid().required(),
    platform: Joi.string().valid('property24', 'facebook', 'whatsapp').optional(),
    tone: Joi.string().valid('professional', 'enthusiastic', 'luxury', 'friendly', 'formal').optional(),
    length: Joi.string().valid('short', 'full').optional(),
  }),

  getAIUsage: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),
};
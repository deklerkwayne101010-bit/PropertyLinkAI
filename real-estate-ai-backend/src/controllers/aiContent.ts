import { Request, Response } from 'express';
import ContentGenerationService, { ContentGenerationRequest } from '../services/contentGeneration.js';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, AIError, ValidationError } from '../middleware/errorHandler.js';

const contentService = new ContentGenerationService();
const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
  };
}

// Generate property description
export const generateContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, platform, tone, length } = req.body;
    const includeMarketData = req.body.includeMarketData || false;

    // Validation is now handled by middleware

    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has permission to access this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found or access denied');
    }

    const request: ContentGenerationRequest = {
      propertyId,
      platform,
      tone,
      length,
      userId: req.user!.id,
      includeMarketData,
    };

    const result = await contentService.generateContent(request);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Content generation error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Property not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw new AIError('AI service temporarily unavailable');
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Preview content without saving
export const previewContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, platform, tone, length } = req.body;
    const includeMarketData = req.body.includeMarketData || false;

    // Validation is now handled by middleware

    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has permission to access this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found or access denied');
    }

    const request: ContentGenerationRequest = {
      propertyId,
      platform,
      tone,
      length,
      userId: req.user!.id,
      includeMarketData: includeMarketData,
    };

    const content = await contentService.previewContent(request);

    res.json({
      success: true,
      data: {
        content,
        platform,
        tone,
        length,
      },
    });

  } catch (error) {
    console.error('Content preview error:', error);

    if (error instanceof Error) {
      if (error.message.includes('Property not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      throw new AIError('AI service temporarily unavailable');
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get generated content history for a property
export const getGeneratedContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { platform, tone, length } = req.query;

    // Check if user has permission to access this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user!.id,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found or access denied');
    }

    // Build filter conditions
    const where: any = { propertyId };
    if (platform) where.platform = platform;
    if (tone) where.tone = tone;
    if (length) where.length = length;

    const content = await prisma.generatedContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results
    });

    res.json({
      success: true,
      data: content,
      count: content.length,
    });

  } catch (error) {
    console.error('Get generated content error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get available templates and options
export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const platforms = ['property24', 'facebook', 'whatsapp'];
    const tones = ['professional', 'enthusiastic', 'luxury', 'friendly', 'formal'];
    const lengths = ['short', 'full'];

    res.json({
      success: true,
      data: {
        platforms,
        tones,
        lengths,
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get cache statistics
export const getCacheStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await contentService.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Clear cache (admin function)
export const clearCache = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin (you might want to implement proper admin check)
    if (req.user?.subscriptionTier !== 'premium') {
      res.status(403).json({
        error: 'Admin access required'
      });
      return;
    }

    await contentService.clearAllCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get AI usage statistics for the user
export const getAIUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const usage = await prisma.aIUsage.findMany({
      where: {
        userId: req.user.id,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    // Calculate totals
    const totalApiCalls = usage.reduce((sum: number, item: any) => sum + item.apiCalls, 0);
    const totalCost = usage.reduce((sum: number, item: any) => sum + item.cost, 0);
    const totalTokens = usage.reduce((sum: number, item: any) => sum + item.tokensUsed, 0);

    res.json({
      success: true,
      data: {
        usage,
        summary: {
          totalApiCalls,
          totalCost,
          totalTokens,
          averageCostPerCall: totalApiCalls > 0 ? totalCost / totalApiCalls : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get AI usage error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Test all platform templates (development/testing endpoint)
export const testAllTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { propertyId } = req.params;

    if (!req.user?.id) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user has permission to access this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: req.user.id,
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found or access denied');
    }

    const results = await contentService.testAllTemplates(propertyId, req.user!.id);

    res.json({
      success: true,
      data: results,
      summary: {
        totalTests: Object.keys(results).length * 3 * 2, // 3 platforms * 3 tones * 2 lengths
        successfulTests: Object.values(results).reduce((acc: number, platformResults: any) => {
          return acc + (Object.values(platformResults).reduce((acc2: number, toneResults: any) => {
            return acc2 + (Object.values(toneResults).filter((result: any) => result.success) as any[]).length;
          }, 0) as number);
        }, 0),
      },
    });
  } catch (error) {
    console.error('Test all templates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
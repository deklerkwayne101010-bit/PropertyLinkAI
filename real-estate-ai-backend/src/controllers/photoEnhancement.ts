import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import AutoenhanceService from '../services/autoenhance';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

const prisma = new PrismaClient();
const autoenhanceService = new AutoenhanceService();

interface ProcessRequest {
  orderId: string;
  originalName: string;
  userId?: string;
  enhancementOptions?: {
    enhanceQuality?: boolean;
    upscaleResolution?: boolean;
    windowPulling?: boolean;
    colorCorrection?: boolean;
  };
}

interface StatusRequest {
  orderId: string;
}

/**
 * Process photo enhancement request
 * POST /api/photo-enhancement/process
 */
export const processEnhancement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, originalName, userId, enhancementOptions }: ProcessRequest = req.body;

    // Validate required fields
    if (!orderId || !originalName) {
      res.status(400).json({
        success: false,
        error: 'orderId and originalName are required',
      });
      return;
    }

    // Check if enhancement already exists
    const existingEnhancement = await prisma.photoEnhancement.findUnique({
      where: { orderId },
    });

    if (existingEnhancement) {
      res.status(409).json({
        success: false,
        error: 'Enhancement for this orderId already exists',
      });
      return;
    }

    // Create initial enhancement record
    const enhancement = await prisma.photoEnhancement.create({
      data: {
        userId: userId || null,
        originalName,
        orderId,
        status: 'pending',
        progress: 0,
        enhancementOptions: enhancementOptions || {},
      },
    });

    // Start processing in background
    processEnhancementInBackground(enhancement.id, orderId);

    res.status(202).json({
      success: true,
      data: {
        id: enhancement.id,
        orderId: enhancement.orderId,
        status: enhancement.status,
        progress: enhancement.progress,
      },
    });
  } catch (error) {
    console.error('Error processing enhancement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get enhancement status
 * GET /api/photo-enhancement/status/:orderId
 */
export const getEnhancementStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
      return;
    }

    const enhancement = await prisma.photoEnhancement.findUnique({
      where: { orderId },
    });

    if (!enhancement) {
      res.status(404).json({
        success: false,
        error: 'Enhancement not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: enhancement.id,
        orderId: enhancement.orderId,
        status: enhancement.status,
        progress: enhancement.progress,
        enhancedUrl: enhancement.enhancedUrl,
        errorMessage: enhancement.errorMessage,
        createdAt: enhancement.createdAt,
        updatedAt: enhancement.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting enhancement status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user's enhancement history
 * GET /api/photo-enhancement/history
 */
export const getEnhancementHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // Assuming auth middleware adds user to request

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const enhancements = await prisma.photoEnhancement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results
    });

    res.status(200).json({
      success: true,
      data: enhancements.map((enhancement: any) => ({
        id: enhancement.id,
        originalName: enhancement.originalName,
        orderId: enhancement.orderId,
        status: enhancement.status,
        progress: enhancement.progress,
        enhancedUrl: enhancement.enhancedUrl,
        errorMessage: enhancement.errorMessage,
        createdAt: enhancement.createdAt,
        updatedAt: enhancement.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error getting enhancement history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Process enhancement in background
 */
async function processEnhancementInBackground(enhancementId: string, orderId: string): Promise<void> {
  try {
    // Update status to processing
    await prisma.photoEnhancement.update({
      where: { id: enhancementId },
      data: {
        status: 'processing',
        progress: 10,
      },
    });

    // Process the order using AutoenhanceService
    const result = await autoenhanceService.processOrder(orderId);

    if (result.status === 'completed' && result.enhancedImages.length > 0) {
      // Get the first enhanced image (assuming single image processing)
      const enhancedImage = result.enhancedImages[0];

      // Update enhancement record with success
      await prisma.photoEnhancement.update({
        where: { id: enhancementId },
        data: {
          status: 'completed',
          progress: 100,
          enhancedUrl: enhancedImage.downloadUrl,
          metadata: {
            originalSize: enhancedImage.size,
            contentType: enhancedImage.contentType,
            filename: enhancedImage.filename,
          },
        },
      });
    } else {
      // Update enhancement record with failure
      await prisma.photoEnhancement.update({
        where: { id: enhancementId },
        data: {
          status: 'failed',
          progress: 0,
          errorMessage: result.error || 'Processing failed',
        },
      });
    }
  } catch (error) {
    console.error('Background processing error:', error);

    // Update enhancement record with error
    await prisma.photoEnhancement.update({
      where: { id: enhancementId },
      data: {
        status: 'failed',
        progress: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    });
  }
}
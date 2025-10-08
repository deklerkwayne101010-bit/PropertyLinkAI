import { Request, Response } from 'express';
import { aiImageEditorService } from '../services/aiImageEditor';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface ProcessImageEditRequest {
  image: string;        // Base64 encoded image
  prompt: string;       // Natural language prompt
  imageName?: string;   // Optional filename
  sessionId?: string;   // For anonymous users
}

interface StatusRequest {
  editId: string;
}

interface HistoryQuery {
  limit?: string;
  offset?: string;
  status?: string;
}

/**
 * Process AI image edit request
 * POST /api/ai-image-edit/process
 */
export const processImageEdit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { image, prompt, imageName, sessionId }: ProcessImageEditRequest = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!image || !prompt) {
      res.status(400).json({
        success: false,
        error: 'image and prompt are required',
      });
      return;
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be base64 encoded image',
      });
      return;
    }

    // Extract image metadata
    const imageParts = image.split(',');
    const imageData = imageParts[1];
    const mimeMatch = imageParts[0].match(/data:image\/(\w+);base64/);
    const imageFormat = mimeMatch ? mimeMatch[1] : 'jpeg';
    const originalSize = Buffer.from(imageData, 'base64').length;

    // Analyze the prompt
    const promptAnalysis = aiImageEditorService.analyzePrompt(prompt);

    // Create initial edit record
    const edit = await aiImageEditorService.createImageEdit({
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      originalImage: image,
      originalName: imageName || `image.${imageFormat}`,
      originalSize,
      imageFormat,
      prompt,
      detectedAction: promptAnalysis.action,
      aiModel: getAIModelForAction(promptAnalysis.action),
    });

    // Start processing in background
    processImageEditInBackground(edit.id, image, promptAnalysis);

    res.status(202).json({
      success: true,
      data: {
        editId: edit.id,
        status: edit.status,
        progress: edit.progress,
        message: 'Image processing started',
      },
    });
  } catch (error) {
    console.error('Error processing image edit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get image edit status
 * GET /api/ai-image-edit/status/:editId
 */
export const getImageEditStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { editId } = req.params;

    if (!editId) {
      res.status(400).json({
        success: false,
        error: 'editId is required',
      });
      return;
    }

    const edit = await aiImageEditorService.getImageEdit(editId);

    if (!edit) {
      res.status(404).json({
        success: false,
        error: 'Image edit not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        editId: edit.id,
        status: edit.status,
        progress: edit.progress,
        result: edit.status === 'completed' ? {
          editedImage: edit.editedImage,
          processingTime: edit.processingTime,
          apiCalls: edit.apiCalls,
        } : null,
        error: edit.errorMessage,
        createdAt: edit.createdAt,
        completedAt: edit.completedAt,
      },
    });
  } catch (error) {
    console.error('Error getting image edit status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user's image edit history
 * GET /api/ai-image-edit/history
 */
export const getImageEditHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { limit = '20', offset = '0' }: HistoryQuery = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 50); // Max 50
    const offsetNum = parseInt(offset, 10) || 0;

    const { edits, total, hasMore } = await aiImageEditorService.getUserImageEdits(
      userId,
      limitNum,
      offsetNum
    );

    res.status(200).json({
      success: true,
      data: {
        edits: edits.map(edit => ({
          id: edit.id,
          originalName: edit.originalName,
          prompt: edit.prompt,
          detectedAction: edit.detectedAction,
          status: edit.status,
          progress: edit.progress,
          editedImage: edit.editedImage,
          errorMessage: edit.errorMessage,
          processingTime: edit.processingTime,
          createdAt: edit.createdAt,
          completedAt: edit.completedAt,
        })),
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error getting image edit history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete image edit
 * DELETE /api/ai-image-edit/:editId
 */
export const deleteImageEdit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { editId } = req.params;
    const userId = req.user?.id;

    if (!editId) {
      res.status(400).json({
        success: false,
        error: 'editId is required',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Verify ownership
    const edit = await aiImageEditorService.getImageEdit(editId);
    if (!edit || edit.userId !== userId) {
      res.status(404).json({
        success: false,
        error: 'Image edit not found or access denied',
      });
      return;
    }

    await aiImageEditorService.deleteImageEdit(editId);

    res.status(200).json({
      success: true,
      message: 'Image edit deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image edit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Process image edit in background
 */
async function processImageEditInBackground(
  editId: string,
  imageBase64: string,
  promptAnalysis: any
): Promise<void> {
  const startTime = Date.now();
  let apiCalls = 0;

  try {
    // Update status to processing
    await aiImageEditorService.updateImageEdit(editId, {
      status: 'processing',
      progress: 10,
    });

    let resultImage = imageBase64;
    const processingSteps: any[] = [];

    switch (promptAnalysis.action) {
      case 'remove':
        // Object removal workflow
        await aiImageEditorService.updateImageEdit(editId, { progress: 25 });

        // Detect object using Grounding DINO
        const detectionResult = await aiImageEditorService.detectObject(
          imageBase64,
          promptAnalysis.target || 'object'
        );
        apiCalls++;
        processingSteps.push({ step: 'detection', model: 'grounding-dino', result: detectionResult });

        await aiImageEditorService.updateImageEdit(editId, { progress: 50 });

        // Create mask and inpaint (simplified - in production would need mask generation)
        const inpaintPrompt = `Remove the ${promptAnalysis.target} and fill with realistic background`;
        resultImage = await aiImageEditorService.inpaintImage(
          imageBase64,
          imageBase64, // Simplified - would need actual mask
          inpaintPrompt
        );
        apiCalls++;
        processingSteps.push({ step: 'inpainting', model: 'stable-diffusion-inpainting' });

        break;

      case 'enhance':
        // Image enhancement workflow
        await aiImageEditorService.updateImageEdit(editId, { progress: 50 });

        resultImage = await aiImageEditorService.upscaleImage(imageBase64);
        apiCalls++;
        processingSteps.push({ step: 'upscaling', model: 'stable-diffusion-upscaler' });

        break;

      case 'lighting':
      case 'color':
        // For now, use upscaler as enhancement
        await aiImageEditorService.updateImageEdit(editId, { progress: 50 });

        resultImage = await aiImageEditorService.upscaleImage(imageBase64);
        apiCalls++;
        processingSteps.push({ step: 'enhancement', model: 'stable-diffusion-upscaler' });

        break;

      default:
        // Default enhancement
        await aiImageEditorService.updateImageEdit(editId, { progress: 50 });

        resultImage = await aiImageEditorService.upscaleImage(imageBase64);
        apiCalls++;
        processingSteps.push({ step: 'default_enhancement', model: 'stable-diffusion-upscaler' });
    }

    await aiImageEditorService.updateImageEdit(editId, { progress: 90 });

    const processingTime = Date.now() - startTime;

    // Update with success
    await aiImageEditorService.updateImageEdit(editId, {
      status: 'completed',
      progress: 100,
      editedImage: resultImage,
      editedName: 'edited_image.jpg',
      processingTime,
      apiCalls,
      completedAt: new Date(),
    });

  } catch (error) {
    console.error('Background processing error:', error);

    const processingTime = Date.now() - startTime;

    // Update with failure
    await aiImageEditorService.updateImageEdit(editId, {
      status: 'failed',
      progress: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime,
      apiCalls,
    });
  }
}

/**
 * Helper function to determine AI model based on action
 */
function getAIModelForAction(action: string): string {
  switch (action) {
    case 'remove':
      return 'grounding-dino,stable-diffusion-inpainting';
    case 'enhance':
    case 'lighting':
    case 'color':
      return 'stable-diffusion-upscaler';
    default:
      return 'stable-diffusion-upscaler';
  }
}
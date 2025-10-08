import axios from 'axios';
import { prisma } from '../config/database';

export interface PromptAnalysis {
  action: 'remove' | 'enhance' | 'lighting' | 'color' | 'other';
  target?: string;
  parameters?: Record<string, any>;
}

export interface HuggingFaceConfig {
  apiToken: string;
  groundingDinoUrl: string;
  inpaintingUrl: string;
  upscalerUrl: string;
}

export class AIImageEditorService {
  private config: HuggingFaceConfig;

  constructor() {
    this.config = {
      apiToken: process.env.HUGGINGFACE_API_TOKEN || '',
      groundingDinoUrl: 'https://api-inference.huggingface.co/models/IDEA-Research/GroundingDINO',
      inpaintingUrl: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting',
      upscalerUrl: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-x4-upscaler'
    };
  }

  /**
   * Analyze natural language prompt to determine action and parameters
   */
  analyzePrompt(prompt: string): PromptAnalysis {
    const lowerPrompt = prompt.toLowerCase();

    // Object removal keywords
    const removeKeywords = ['remove', 'delete', 'get rid of', 'erase', 'take out'];
    if (removeKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      const target = this.extractTargetObject(prompt);
      return {
        action: 'remove',
        target,
        parameters: { method: 'inpainting' }
      };
    }

    // Lighting enhancement keywords
    const lightingKeywords = ['bright', 'dark', 'lighting', 'illuminate', 'lighten', 'darken'];
    if (lightingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return {
        action: 'lighting',
        parameters: { adjustment: this.extractLightingAdjustment(prompt) }
      };
    }

    // Enhancement keywords
    const enhanceKeywords = ['enhance', 'improve', 'quality', 'sharpen', 'clarity'];
    if (enhanceKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return {
        action: 'enhance',
        parameters: { method: 'upscaling' }
      };
    }

    // Color adjustment keywords
    const colorKeywords = ['color', 'tint', 'hue', 'saturation', 'contrast'];
    if (colorKeywords.some(keyword => lowerPrompt.includes(keyword))) {
      return {
        action: 'color',
        parameters: { adjustment: this.extractColorAdjustment(prompt) }
      };
    }

    return { action: 'other' };
  }

  /**
   * Process image using Grounding DINO for object detection
   */
  async detectObject(imageBase64: string, textPrompt: string): Promise<any> {
    try {
      const response = await axios.post(
        this.config.groundingDinoUrl,
        {
          inputs: {
            image: imageBase64,
            text: textPrompt
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Grounding DINO API error:', error);
      throw new Error('Failed to detect object in image');
    }
  }

  /**
   * Process image inpainting to remove objects
   */
  async inpaintImage(imageBase64: string, maskBase64: string, prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.config.inpaintingUrl,
        {
          inputs: {
            image: imageBase64,
            mask: maskBase64,
            prompt: `A realistic background, ${prompt}`,
            negative_prompt: 'blurry, low quality, artifacts'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      // Return the processed image (assuming it's base64)
      return response.data.image || response.data;
    } catch (error) {
      console.error('Inpainting API error:', error);
      throw new Error('Failed to process image inpainting');
    }
  }

  /**
   * Upscale image for quality enhancement
   */
  async upscaleImage(imageBase64: string): Promise<string> {
    try {
      const response = await axios.post(
        this.config.upscalerUrl,
        {
          inputs: {
            image: imageBase64,
            prompt: 'High quality, detailed, sharp focus'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data.image || response.data;
    } catch (error) {
      console.error('Upscaler API error:', error);
      throw new Error('Failed to upscale image');
    }
  }

  /**
   * Create database record for image edit
   */
  async createImageEdit(data: {
    userId?: string;
    sessionId?: string;
    originalImage: string;
    originalName: string;
    originalSize: number;
    imageFormat: string;
    prompt: string;
    detectedAction: string;
    aiModel: string;
  }) {
    return await prisma.aIImageEdit.create({
      data
    });
  }

  /**
   * Update image edit with results
   */
  async updateImageEdit(editId: string, data: {
    editedImage?: string;
    editedName?: string;
    status?: string;
    progress?: number;
    errorMessage?: string;
    processingTime?: number;
    apiCalls?: number;
    cost?: number;
    completedAt?: Date;
  }) {
    return await prisma.aIImageEdit.update({
      where: { id: editId },
      data
    });
  }

  /**
   * Get image edit by ID
   */
  async getImageEdit(editId: string) {
    return await prisma.aIImageEdit.findUnique({
      where: { id: editId }
    });
  }

  /**
   * Get user's image edit history
   */
  async getUserImageEdits(userId: string, limit = 20, offset = 0) {
    const [edits, total] = await Promise.all([
      prisma.aIImageEdit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.aIImageEdit.count({
        where: { userId }
      })
    ]);

    return { edits, total, hasMore: offset + limit < total };
  }

  /**
   * Delete image edit
   */
  async deleteImageEdit(editId: string) {
    return await prisma.aIImageEdit.delete({
      where: { id: editId }
    });
  }

  // Helper methods for prompt analysis
  private extractTargetObject(prompt: string): string {
    // Simple extraction - in production, use NLP for better accuracy
    const commonObjects = ['microwave', 'refrigerator', 'car', 'person', 'furniture', 'wall', 'door', 'window'];
    const lowerPrompt = prompt.toLowerCase();

    for (const obj of commonObjects) {
      if (lowerPrompt.includes(obj)) {
        return obj;
      }
    }

    // Extract words after "remove" or similar
    const removeMatch = prompt.match(/(?:remove|delete|get rid of|erase)\s+(\w+)/i);
    return removeMatch ? removeMatch[1] : 'object';
  }

  private extractLightingAdjustment(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('bright') || lowerPrompt.includes('lighten')) {
      return 'brighten';
    }
    if (lowerPrompt.includes('dark') || lowerPrompt.includes('darken')) {
      return 'darken';
    }
    return 'auto';
  }

  private extractColorAdjustment(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('warm')) return 'warmer';
    if (lowerPrompt.includes('cool')) return 'cooler';
    if (lowerPrompt.includes('vibrant')) return 'more_vibrant';
    if (lowerPrompt.includes('muted')) return 'more_muted';
    return 'auto';
  }
}

export const aiImageEditorService = new AIImageEditorService();
interface AutoenhanceOrderStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  images?: Array<{
    id: string;
    status: string;
    downloadUrl?: string;
  }>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface AutoenhanceImageDownload {
  id: string;
  downloadUrl: string;
  filename: string;
  size: number;
  contentType: string;
}

class AutoenhanceService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AUTOENHANCE_API_KEY || '';
    this.baseUrl = 'https://api.autoenhance.ai/v3';

    if (!this.apiKey) {
      throw new Error('AUTOENHANCE_API_KEY environment variable is required');
    }
  }

  /**
   * Get order status from Autoenhance.ai API
   */
  async getOrderStatus(orderId: string): Promise<AutoenhanceOrderStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Autoenhance API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  }

  /**
   * Download enhanced image from Autoenhance.ai API
   */
  async downloadEnhancedImage(imageId: string): Promise<AutoenhanceImageDownload> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${imageId}/enhanced`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Autoenhance API error: ${response.status} ${response.statusText}`);
      }

      // Get the image blob
      const imageBlob = await response.blob();

      // Convert blob to base64 for storage
      const base64Data = await this.blobToBase64(imageBlob);

      return {
        id: imageId,
        downloadUrl: `data:${imageBlob.type};base64,${base64Data}`,
        filename: `enhanced-${imageId}.jpg`,
        size: imageBlob.size,
        contentType: imageBlob.type,
      };
    } catch (error) {
      console.error('Error downloading enhanced image:', error);
      throw error;
    }
  }

  /**
   * Poll order status until completion or failure
   */
  async pollOrderStatus(
    orderId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<AutoenhanceOrderStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getOrderStatus(orderId);

        // Return immediately if order is completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        // Wait before next attempt (except on last attempt)
        if (attempt < maxAttempts - 1) {
          await this.delay(intervalMs);
        }
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);

        // On last attempt, throw the error
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error(`Order polling timed out after ${maxAttempts} attempts`);
  }

  /**
   * Process an order and download all enhanced images
   */
  async processOrder(orderId: string): Promise<{
    orderId: string;
    status: string;
    enhancedImages: AutoenhanceImageDownload[];
    error?: string;
  }> {
    try {
      // Poll for completion
      const finalStatus = await this.pollOrderStatus(orderId);

      if (finalStatus.status === 'failed') {
        return {
          orderId,
          status: 'failed',
          enhancedImages: [],
          error: finalStatus.error || 'Order processing failed',
        };
      }

      if (finalStatus.status !== 'completed' || !finalStatus.images) {
        return {
          orderId,
          status: 'failed',
          enhancedImages: [],
          error: 'Order completed but no images available',
        };
      }

      // Download all enhanced images
      const enhancedImages: AutoenhanceImageDownload[] = [];

      for (const image of finalStatus.images) {
        if (image.status === 'completed' && image.downloadUrl) {
          try {
            // For this implementation, we'll use the image ID to download
            // In a real scenario, you might use the downloadUrl directly
            const downloadedImage = await this.downloadEnhancedImage(image.id);
            enhancedImages.push(downloadedImage);
          } catch (error) {
            console.error(`Failed to download image ${image.id}:`, error);
          }
        }
      }

      return {
        orderId,
        status: 'completed',
        enhancedImages,
      };
    } catch (error) {
      console.error('Error processing order:', error);
      return {
        orderId,
        status: 'failed',
        enhancedImages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Utility function to convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AutoenhanceService;
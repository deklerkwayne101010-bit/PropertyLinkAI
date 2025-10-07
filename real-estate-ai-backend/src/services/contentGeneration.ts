import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import crypto from 'crypto';
import OpenAIService, { GenerationOptions } from './openai.js';
import MarketDataService, { MarketDataRequest } from './marketData.js';
import { config } from '../config/index.js';
import { logDataProcessing } from '../middleware/gdprLogger.js';

export interface ContentGenerationRequest {
  propertyId: string;
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  length: 'short' | 'full';
  userId: string;
  includeMarketData?: boolean;
}

export interface ContentGenerationResponse {
  id: string;
  content: string;
  platform: string;
  tone: string;
  length: string;
  wordCount: number;
  tokensUsed?: number;
  cost?: number;
  cached: boolean;
  processingTime: number;
}

export class ContentGenerationService {
  private prisma: PrismaClient;
  private openai: OpenAIService;
  private marketData: MarketDataService;
  private redis: Redis;
  private redisConfig;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAIService();
    this.marketData = new MarketDataService();
    this.redisConfig = config.redis;

    this.redis = new Redis(this.redisConfig.url);
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const startTime = Date.now();

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);

      // Check cache first
      const cachedContent = await this.getCachedContent(cacheKey);
      if (cachedContent) {
        await this.updateCacheHit(cacheKey);
        return {
          ...cachedContent,
          cached: true,
          processingTime: Date.now() - startTime,
        };
      }

      // Get property data
      const propertyData = await this.getPropertyData(request.propertyId);

      // Get market data if requested
      let marketData = null;
      if (request.includeMarketData && propertyData.location) {
        try {
          const marketDataRequest: MarketDataRequest = {
            location: propertyData.location,
            propertyType: propertyData.propertyType,
          };
          marketData = await this.marketData.getMarketData(marketDataRequest);
        } catch (error) {
          console.warn('Failed to fetch market data for content generation:', error);
          // Continue without market data if it fails
        }
      }

      // Generate new content
      const generationOptions: GenerationOptions = {
        platform: request.platform,
        tone: request.tone,
        length: request.length,
        propertyData,
        marketData,
      };

      const result = await this.openai.generatePropertyDescription(generationOptions);
      const { content, costTracking } = result;

      // Validate and post-process content
      const validatedContent = this.validateAndPostProcessContent(content, request.platform, request.tone);

      // Quality check
      const qualityCheck = this.checkContentQuality(validatedContent, request.platform, generationOptions.propertyData);

      // Calculate metrics
      const wordCount = this.calculateWordCount(validatedContent);
      const tokensUsed = costTracking.totalTokens;
      const cost = costTracking.cost;

      // Store in database
      const savedContent = await this.saveGeneratedContent({
        ...request,
        content: validatedContent,
        wordCount,
        tokensUsed,
        cost,
        cacheKey,
      });

      // Cache the result
      await this.cacheContent(cacheKey, savedContent);

      // Track AI usage
      await this.trackAIUsage({
        ...request,
        apiCalls: 1,
        cost,
        tokensUsed,
      });

      // GDPR logging for AI content generation
      if (config.gdpr.compliance) {
        await logDataProcessing({
          userId: request.userId,
          action: 'ai_content_generated',
          resource: `property_${request.propertyId}`,
          details: {
            platform: request.platform,
            tone: request.tone,
            length: request.length,
            wordCount,
            tokensUsed,
            cost,
            contentLength: validatedContent.length,
          },
          ipAddress: 'system', // This would need to be passed from the request context
          userAgent: 'AI-Content-Generation-Service',
        });
      }

      return {
        id: savedContent.id,
        content: validatedContent,
        platform: request.platform,
        tone: request.tone,
        length: request.length,
        wordCount,
        tokensUsed,
        cost,
        cached: false,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  async previewContent(request: ContentGenerationRequest): Promise<string> {
    // Preview doesn't save to database or cache
    const generationOptions: GenerationOptions = {
      platform: request.platform,
      tone: request.tone,
      length: request.length,
      propertyData: await this.getPropertyData(request.propertyId),
    };

    const result = await this.openai.generatePropertyDescription(generationOptions);
    return result.content;
  }

  private generateCacheKey(request: ContentGenerationRequest): string {
    const hash = crypto.createHash('md5');
    hash.update(`${request.propertyId}-${request.platform}-${request.tone}-${request.length}`);
    return `content:${hash.digest('hex')}`;
  }

  private async getCachedContent(cacheKey: string): Promise<ContentGenerationResponse | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is still valid
        if (new Date() < new Date(parsed.cacheExpiry)) {
          return parsed;
        } else {
          // Cache expired, remove it
          await this.redis.del(cacheKey);
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  private async cacheContent(cacheKey: string, content: any): Promise<void> {
    try {
      const cacheData = {
        id: content.id,
        content: content.content,
        platform: content.platform,
        tone: content.tone,
        length: content.length,
        wordCount: content.wordCount,
        tokensUsed: content.tokensUsed,
        cost: content.cost,
        cacheExpiry: new Date(Date.now() + this.redisConfig.ttl * 1000),
      };

      await this.redis.setex(cacheKey, this.redisConfig.ttl, JSON.stringify(cacheData));

      // Store cache metadata in database
      await this.prisma.cacheMetadata.upsert({
        where: { cacheKey },
        update: {
          hitCount: { increment: 1 },
          expiresAt: cacheData.cacheExpiry,
        },
        create: {
          cacheKey,
          platform: content.platform,
          tone: content.tone,
          length: content.length,
          propertyId: content.propertyId,
          expiresAt: cacheData.cacheExpiry,
        },
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private async updateCacheHit(cacheKey: string): Promise<void> {
    try {
      await this.prisma.cacheMetadata.update({
        where: { cacheKey },
        data: { hitCount: { increment: 1 } },
      });
    } catch (error) {
      console.error('Cache hit update error:', error);
    }
  }

  private async getPropertyData(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Provide fallback values for empty fields to ensure AI generation works
    return {
      location: property.location || 'prime location',
      size: property.size || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      price: property.price || 0,
      features: property.features as string[] || [],
      propertyType: property.propertyType || 'residential property',
      yearBuilt: property.yearBuilt || new Date().getFullYear(),
    };
  }

  private async saveGeneratedContent(data: any) {
    return await this.prisma.generatedContent.create({
      data: {
        propertyId: data.propertyId,
        platform: data.platform,
        tone: data.tone,
        length: data.length,
        content: data.content,
        wordCount: data.wordCount,
        tokensUsed: data.tokensUsed,
        cost: data.cost,
        cacheKey: data.cacheKey,
        isCached: true,
        cacheExpiry: new Date(Date.now() + this.redisConfig.ttl * 1000),
      },
    });
  }

  private async trackAIUsage(data: any) {
    await this.prisma.aIUsage.create({
      data: {
        userId: data.userId,
        apiCalls: data.apiCalls,
        cost: data.cost,
        tokensUsed: data.tokensUsed,
        model: config.ai.model,
        operation: 'generate',
        platform: data.platform,
        tone: data.tone,
        length: data.length,
      },
    });
  }

  private calculateWordCount(content: string): number {
    return content.trim().split(/\s+/).length;
  }

  private estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(content.length / 4);
  }

  private calculateCost(tokensUsed: number): number {
    // GPT-4 pricing: $0.03 per 1K tokens (input), $0.06 per 1K tokens (output)
    // This is a rough estimate - adjust based on actual pricing
    const inputTokens = Math.floor(tokensUsed * 0.3); // Assume 30% input, 70% output
    const outputTokens = tokensUsed - inputTokens;

    const inputCost = (inputTokens / 1000) * 0.03;
    const outputCost = (outputTokens / 1000) * 0.06;

    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }

  private validateAndPostProcessContent(content: string, platform: string, tone: string): string {
    // Basic content validation
    if (!content || content.trim().length === 0) {
      throw new Error('Generated content is empty');
    }

    if (content.length < 20) {
      throw new Error('Generated content is too short');
    }

    // Platform-specific validation
    switch (platform) {
      case 'property24':
        return this.postProcessProperty24Content(content, tone);
      case 'facebook':
        return this.postProcessFacebookContent(content, tone);
      case 'whatsapp':
        return this.postProcessWhatsAppContent(content, tone);
      default:
        return content;
    }
  }

  private postProcessProperty24Content(content: string, tone: string): string {
    // Ensure professional formatting
    let processed = content.trim();

    // Add proper spacing for sections if missing
    if (!processed.includes('\n\n') && processed.length > 200) {
      // Add section breaks for longer Property24 content
      processed = processed.replace(/(\.)\s+(?=[A-Z])/g, '$1\n\n');
    }

    // Ensure it ends with a call to action
    if (!processed.toLowerCase().includes('contact') &&
        !processed.toLowerCase().includes('viewing') &&
        !processed.toLowerCase().includes('call')) {
      processed += '\n\nContact us today to arrange a private viewing.';
    }

    return processed;
  }

  private postProcessFacebookContent(content: string, tone: string): string {
    let processed = content.trim();

    // Ensure it has emojis for visual appeal
    const emojiCount = (processed.match(/[🏠✨💫🔥😍❤️🌟💰📍🛏️🛁📐]/g) || []).length;
    if (emojiCount < 2) {
      // Add some relevant emojis if missing
      const emojis = ['🏠', '✨', '💫'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      processed = `${randomEmoji} ${processed}`;
    }

    // Ensure it has hashtags
    if (!processed.includes('#')) {
      const relevantHashtags = ['#DreamHome', '#PropertyForSale', '#RealEstate'];
      processed += `\n\n${relevantHashtags.join(' ')}`;
    }

    return processed;
  }

  private postProcessWhatsAppContent(content: string, tone: string): string {
    let processed = content.trim();

    // Ensure it starts with a greeting if missing
    if (!processed.toLowerCase().startsWith('hi') &&
        !processed.toLowerCase().startsWith('hello') &&
        !processed.toLowerCase().startsWith('check out')) {
      processed = `Hi! ${processed}`;
    }

    // Ensure it ends with availability note
    if (!processed.toLowerCase().includes('available') &&
        !processed.toLowerCase().includes('viewing') &&
        !processed.toLowerCase().includes('contact')) {
      processed += '\n\nAvailable for viewing - let me know!';
    }

    return processed;
  }

  private checkContentQuality(content: string, platform: string, propertyData?: any): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Basic checks
    if (content.length < 50) {
      issues.push('Content too short');
      score -= 30;
    }

    if (content.length > 2000) {
      issues.push('Content too long');
      score -= 20;
    }

    // Platform-specific checks
    switch (platform) {
      case 'property24':
        // Only penalize for missing location if we actually have location data
        if (propertyData?.location && propertyData.location !== 'prime location' &&
            !content.toLowerCase().includes('location')) {
          issues.push('Missing location information');
          score -= 15;
        }
        // Only penalize for missing property details if we have actual data
        if (propertyData && (propertyData.bedrooms > 0 || propertyData.bathrooms > 0 || propertyData.size > 0) &&
            !content.match(/\d+\s*(bed|bath|sqm)/i)) {
          issues.push('Missing key property details');
          score -= 20;
        }
        break;

      case 'facebook':
        if ((content.match(/[🏠✨💫🔥😍❤️🌟]/g) || []).length < 1) {
          issues.push('Missing emojis for visual appeal');
          score -= 10;
        }
        if (!content.includes('#')) {
          issues.push('Missing hashtags');
          score -= 15;
        }
        break;

      case 'whatsapp':
        if (!content.toLowerCase().includes('hi') && !content.toLowerCase().includes('check out')) {
          issues.push('Missing friendly greeting');
          score -= 10;
        }
        break;
    }

    // Check for repetitive content
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const uniqueWords = new Set(words).size;
    const repetitionRatio = uniqueWords / wordCount;

    if (repetitionRatio < 0.7) {
      issues.push('Content may be repetitive');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  // Cache management methods
  async clearExpiredCache(): Promise<number> {
    try {
      const expired = await this.prisma.cacheMetadata.findMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      for (const item of expired) {
        await this.redis.del(item.cacheKey);
      }

      await this.prisma.cacheMetadata.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      return expired.length;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }
  }

  async getCacheStats() {
    try {
      const totalKeys = await this.redis.dbsize();
      const metadata = await this.prisma.cacheMetadata.findMany({
        select: {
          hitCount: true,
          platform: true,
        },
      });

      const totalHits = metadata.reduce((sum: number, item: { hitCount: number; platform: string }) => sum + item.hitCount, 0);

      return {
        totalKeys,
        totalHits,
        hitRate: totalKeys > 0 ? (totalHits / totalKeys) * 100 : 0,
        platformStats: metadata.reduce((acc: Record<string, number>, item: { hitCount: number; platform: string }) => {
          acc[item.platform] = (acc[item.platform] || 0) + item.hitCount;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.redis.flushdb();
      await this.prisma.cacheMetadata.deleteMany({});
    } catch (error) {
      console.error('Clear all cache error:', error);
      throw error;
    }
  }

  // Test method for validating all platform templates
  async testAllTemplates(propertyId: string, userId: string): Promise<Record<string, any>> {
    const platforms: Array<'property24' | 'facebook' | 'whatsapp'> = ['property24', 'facebook', 'whatsapp'];
    const tones: Array<'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal'> = ['professional', 'enthusiastic', 'luxury'];
    const lengths: Array<'short' | 'full'> = ['short', 'full'];

    const results: Record<string, any> = {};

    for (const platform of platforms) {
      results[platform] = {};

      for (const tone of tones) {
        results[platform][tone] = {};

        for (const length of lengths) {
          try {
            const request: ContentGenerationRequest = {
              propertyId,
              platform,
              tone,
              length,
              userId,
            };

            const content = await this.previewContent(request);
            const propertyData = await this.getPropertyData(propertyId);
            const qualityCheck = this.checkContentQuality(content, platform, propertyData);

            results[platform][tone][length] = {
              success: true,
              contentLength: content.length,
              wordCount: this.calculateWordCount(content),
              qualityScore: qualityCheck.score,
              qualityIssues: qualityCheck.issues,
              preview: content.substring(0, 100) + '...',
            };
          } catch (error) {
            results[platform][tone][length] = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }
      }
    }

    return results;
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
    await this.marketData.disconnect();
  }
}

export default ContentGenerationService;
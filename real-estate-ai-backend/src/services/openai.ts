import OpenAI from 'openai';
import { config } from '../config/index.js';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface CostTracking {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

export interface GenerationOptions {
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  length: 'short' | 'full';
  propertyData: {
    location?: string;
    size?: number;
    bedrooms?: number;
    bathrooms?: number;
    price?: number;
    features?: string[];
    propertyType?: string;
    yearBuilt?: number;
  };
  marketData?: {
    averagePrice?: number | null;
    medianPrice?: number | null;
    pricePerSqm?: number | null;
    priceTrend?: string | null;
    trendPercentage?: number | null;
    comparableSales?: Array<{
      salePrice: number;
      bedrooms?: number | null;
      bathrooms?: number | null;
      size?: number | null;
    }>;
  } | null;
}

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: config.ai.openaiApiKey,
      model: config.ai.model,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens,
      timeout: config.ai.requestTimeout,
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.AI_RETRY_DELAY || '1000', 10),
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  async generatePropertyDescription(options: GenerationOptions): Promise<{ content: string; costTracking: CostTracking }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const prompt = this.buildPrompt(options);
        const startTime = Date.now();

        const response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(options.platform),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new Error('No content generated from OpenAI');
        }

        const processingTime = Date.now() - startTime;
        const costTracking = this.calculateCostTracking(response, processingTime);

        // Validate content quality
        this.validateContent(content, options);

        return {
          content: content.trim(),
          costTracking,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`OpenAI API attempt ${attempt} failed:`, lastError.message);

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    throw this.enhanceError(lastError || new Error('Failed to generate property description'));
  }

  private getSystemPrompt(platform: string): string {
    const basePrompt = `You are an elite real estate copywriter and marketing specialist with extensive experience in creating high-converting property descriptions for different platforms. You understand buyer psychology, market trends, and platform-specific engagement strategies. You have access to current market data including pricing trends, comparable sales, and market analysis to create more accurate and compelling descriptions.`;

    const platformSpecificInstructions = {
      property24: `You specialize in Property24 listings that rank highly in search results and convert serious buyers. Focus on sophisticated real estate terminology, comprehensive property details, investment potential, and professional presentation. Your writing should demonstrate deep market knowledge and appeal to discerning buyers and investors.`,

      facebook: `You excel at creating viral-worthy social media content that generates engagement, shares, and inquiries. You understand social media algorithms, visual storytelling, and emotional triggers that make people fall in love with properties. Your content should feel like a trusted friend sharing an amazing discovery.`,

      whatsapp: `You craft personal, conversational messages that feel like one trusted professional sharing an exclusive opportunity with valued clients. You understand the psychology of private messaging, building urgency without pressure, and creating personal connections that lead to viewings and offers.`
    };

    const coreInstructions = `
Key Principles:
- Always adapt language, tone, and content structure to the specific platform and target audience
- Use platform-appropriate formatting, emojis, and engagement elements
- Focus on lifestyle benefits and emotional appeal while maintaining credibility
- Include specific, compelling calls-to-action that drive immediate response
- Demonstrate expertise through sophisticated real estate terminology and market insights
- Create content that stands out in crowded marketplaces

Quality Standards:
- Every description must tell a compelling story about the property and lifestyle it offers
- Include specific details that help buyers visualize themselves living in the property
- Balance aspiration with authenticity - be exciting but believable
- Use positive, benefit-focused language that addresses buyer desires and concerns`;

    return `${basePrompt} ${platformSpecificInstructions[platform as keyof typeof platformSpecificInstructions] || ''} ${coreInstructions}`;
  }

  private validateContent(content: string, options: GenerationOptions): void {
    // Basic length validation
    if (content.length < 50) {
      throw new Error('Generated content too short');
    }

    if (content.length > this.config.maxTokens * 4) {
      throw new Error('Generated content too long');
    }

    // Platform-specific validation
    switch (options.platform) {
      case 'property24':
        this.validateProperty24Content(content, options);
        break;
      case 'facebook':
        this.validateFacebookContent(content, options);
        break;
      case 'whatsapp':
        this.validateWhatsAppContent(content, options);
        break;
    }
  }

  private validateProperty24Content(content: string, options: GenerationOptions): void {
    // Check for sophisticated real estate terminology
    const requiredTerms = ['square meter', 'bedrooms', 'bathrooms', 'location', 'amenities'];
    const hasProfessionalTerminology = requiredTerms.some(term =>
      content.toLowerCase().includes(term.toLowerCase())
    );

    if (!hasProfessionalTerminology) {
      throw new Error('Property24 content lacks professional real estate terminology');
    }

    // Check for SEO keywords
    const seoKeywords = ['spacious family home', 'prime location', 'modern amenities', 'move-in ready', 'excellent investment'];
    const hasSeoKeywords = seoKeywords.some(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasSeoKeywords) {
      throw new Error('Property24 content missing essential SEO keywords');
    }

    // Check for structured sections (for full length)
    if (options.length === 'full') {
      const hasStructure = content.includes('**') || content.includes('Overview') || content.includes('Features');
      if (!hasStructure) {
        throw new Error('Property24 full content should have structured sections');
      }
    }

    // Check for call-to-action
    const hasCta = content.toLowerCase().includes('contact') ||
                   content.toLowerCase().includes('viewing') ||
                   content.toLowerCase().includes('appointment');

    if (!hasCta) {
      throw new Error('Property24 content must include call-to-action');
    }
  }

  private validateFacebookContent(content: string, options: GenerationOptions): void {
    // Check for engaging elements
    const engagingElements = ['!', '🏠', '✨', '💫', '🔥', '😍', '❤️', '🌟'];
    const hasEmojis = engagingElements.some(emoji => content.includes(emoji));

    if (!hasEmojis) {
      throw new Error('Facebook content must include engaging emojis');
    }

    // Check for hashtags
    const hasHashtags = /#[\w]+/.test(content);
    if (!hasHashtags) {
      throw new Error('Facebook content must include relevant hashtags');
    }

    // Check for call-to-action
    const hasCta = content.toLowerCase().includes('dm') ||
                   content.toLowerCase().includes('contact') ||
                   content.toLowerCase().includes('viewing') ||
                   content.toLowerCase().includes('message');

    if (!hasCta) {
      throw new Error('Facebook content must include clear call-to-action');
    }

    // Check for compelling hook
    const hasHook = content.includes('!') && content.length > 20;
    if (!hasHook) {
      throw new Error('Facebook content should start with compelling hook');
    }
  }

  private validateWhatsAppContent(content: string, options: GenerationOptions): void {
    // Check for conversational greeting
    const hasGreeting = content.toLowerCase().includes('hi') ||
                       content.toLowerCase().includes('👋') ||
                       content.toLowerCase().includes('check out');

    if (!hasGreeting) {
      throw new Error('WhatsApp content should start with friendly greeting');
    }

    // Check for essential property details
    const hasKeyDetails = (content.includes('bed') && content.includes('bath')) ||
                         content.includes('sqm') ||
                         content.includes('location');

    if (!hasKeyDetails) {
      throw new Error('WhatsApp content must include key property details');
    }

    // Check for personal touch
    const hasPersonalTouch = content.toLowerCase().includes('you') ||
                            content.toLowerCase().includes('weekend') ||
                            content.toLowerCase().includes('love') ||
                            content.includes('👍') ||
                            content.includes('😊');

    if (!hasPersonalTouch) {
      throw new Error('WhatsApp content should have personal, conversational tone');
    }

    // Check for availability/urgency
    const hasAvailability = content.toLowerCase().includes('available') ||
                           content.toLowerCase().includes('weekend') ||
                           content.toLowerCase().includes('soon') ||
                           content.toLowerCase().includes('urgent');

    if (!hasAvailability) {
      throw new Error('WhatsApp content should mention availability');
    }
  }

  private calculateCostTracking(response: any, processingTime: number): CostTracking {
    const usage = response.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // GPT-4 pricing (adjust based on actual model used)
    const inputCostPerToken = this.config.model.includes('gpt-4') ? 0.00003 : 0.0000015;
    const outputCostPerToken = this.config.model.includes('gpt-4') ? 0.00006 : 0.000002;

    const inputCost = (inputTokens / 1000) * inputCostPerToken;
    const outputCost = (outputTokens / 1000) * outputCostPerToken;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      cost: Math.round(totalCost * 1000000) / 1000000, // Round to 6 decimal places
      model: this.config.model,
    };
  }

  private isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'API key',
      'Invalid model',
      'Content policy violation',
      'Billing',
    ];

    return nonRetryableMessages.some(msg =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  private enhanceError(error: Error): Error {
    if (error.message.includes('timeout')) {
      return new Error('OpenAI API request timeout - please try again');
    }
    if (error.message.includes('rate limit')) {
      return new Error('OpenAI API rate limit exceeded - please try again later');
    }
    if (error.message.includes('insufficient_quota')) {
      return new Error('OpenAI API quota exceeded - please check your billing');
    }

    return new Error(`AI service temporarily unavailable: ${error.message}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildPrompt(options: GenerationOptions): string {
    const { platform, tone, length, propertyData, marketData } = options;

    // Build base platform-specific prompts
    const basePrompts = {
      property24: this.buildProperty24Prompt(propertyData, tone, length, marketData),
      facebook: this.buildFacebookPrompt(propertyData, tone, length, marketData),
      whatsapp: this.buildWhatsAppPrompt(propertyData, tone, length, marketData),
    };

    const basePrompt = basePrompts[platform];

    // Enhance with advanced features
    return this.enhancePromptWithAdvancedFeatures(basePrompt, options);
  }

  private buildProperty24Prompt(data: GenerationOptions['propertyData'], tone: string, length: string, marketData?: GenerationOptions['marketData']): string {
    const propertyType = data.propertyType || 'residential property';
    const location = data.location && data.location !== 'prime location' ? data.location : 'a desirable area';

    // Build comprehensive property details with sophisticated terminology
    const propertySpecs = [];
    if (data.size && data.size > 0) propertySpecs.push(`${data.size} square meter ${propertyType}`);
    if (data.bedrooms && data.bedrooms > 0) propertySpecs.push(`${data.bedrooms} bedrooms`);
    if (data.bathrooms && data.bathrooms > 0) propertySpecs.push(`${data.bathrooms} bathrooms`);
    if (data.yearBuilt && data.yearBuilt > 1900) propertySpecs.push(`Built in ${data.yearBuilt}`);
    if (data.price && data.price > 0) propertySpecs.push(`Asking price: R ${data.price.toLocaleString()}`);

    const propertyDetails = propertySpecs.length > 0 ? propertySpecs.join('\n- ') : 'Well-appointed property with desirable features';

    // Dynamic feature categorization for better structure
    const interiorFeatures = [];
    const exteriorFeatures = [];
    const amenities = [];

    if (data.features && data.features.length > 0) {
      data.features.forEach(feature => {
        const lowerFeature = feature.toLowerCase();
        if (['kitchen', 'bedroom', 'bathroom', 'living room', 'dining room', 'study', 'fireplace', 'air conditioning', 'heating', 'flooring'].some(term => lowerFeature.includes(term))) {
          interiorFeatures.push(feature);
        } else if (['garden', 'garage', 'parking', 'pool', 'balcony', 'patio', 'yard', 'driveway'].some(term => lowerFeature.includes(term))) {
          exteriorFeatures.push(feature);
        } else {
          amenities.push(feature);
        }
      });
    }

    // Context-aware tone adjustments
    const toneInstructions = {
      professional: 'Maintain formal, professional language suitable for serious property investors and discerning buyers',
      enthusiastic: 'Show genuine excitement about the property\'s potential while maintaining professionalism',
      luxury: 'Emphasize exclusivity, premium craftsmanship, and sophisticated lifestyle benefits',
      friendly: 'Use warm, approachable language that makes buyers feel confident and welcome',
      formal: 'Use precise, business-like language appropriate for corporate clients and serious investors'
    };

    const lengthInstructions = length === 'short'
      ? 'Keep description concise yet comprehensive, focusing on key selling points'
      : 'Provide rich, detailed description with comprehensive property information and lifestyle benefits';

    // Build market data section if available
    const marketDataSection = marketData ? this.buildMarketDataSection(marketData, data.price) : '';

    return `
Generate a professional property listing for Property24 in ${location}.

Property Details:
- ${propertyDetails}
${data.features && data.features.length > 0 ? `\n- Key Features: ${data.features.join(', ')}` : ''}

${marketDataSection}

Requirements:
- Use sophisticated real estate terminology and professional language
- Include compelling SEO keywords: "spacious family home", "prime location", "modern amenities", "move-in ready", "excellent investment opportunity"
- Structure with clear sections: Overview, Interior Features, Exterior & Amenities, Location & Accessibility
- Highlight unique selling points and investment potential
- End with strong call-to-action for viewing appointments
- Use engaging yet professional tone suitable for serious buyers
- ${lengthInstructions}

Style Guidelines:
- ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
- Emphasize value proposition and lifestyle benefits
- Include neighborhood advantages and convenience factors
- Mention any recent renovations or modern upgrades
- Focus on features that appeal to discerning buyers
- Highlight energy efficiency and modern conveniences where applicable

${length === 'full' ? `
Structure the response with these exact sections:

**Overview**
[Compelling introduction highlighting the property's best features and unique value proposition]

**Interior Features**
${interiorFeatures.length > 0 ? `[Detail the interior features with professional terminology]` : '[Describe interior layout and finishes]'}

**Exterior & Amenities**
${exteriorFeatures.length > 0 || amenities.length > 0 ? `[Highlight exterior features and amenities]` : '[Describe exterior spaces and community amenities]'}

**Location & Accessibility**
[Emphasize prime location benefits, accessibility, and neighborhood advantages]

**Investment Potential**
[Highlight why this property represents an excellent investment opportunity${marketData ? ' based on current market data and trends' : ''}]

Contact our experienced property consultants today to arrange a private viewing and discover why this exceptional property should be your next home.
` : ''}

Additional Dynamic Content:
${data.yearBuilt && data.yearBuilt > 2000 ? '- Recently constructed with modern building standards' : ''}
${data.price && data.price > 2000000 ? '- Premium pricing reflects exceptional quality and location' : ''}
${data.bedrooms && data.bedrooms >= 3 ? '- Ideal for growing families seeking spacious accommodation' : ''}
${data.features && data.features.some(f => f.toLowerCase().includes('pool')) ? '- Resort-style amenities for ultimate relaxation' : ''}
    `.trim();
  }

  private buildFacebookPrompt(data: GenerationOptions['propertyData'], tone: string, length: string, marketData?: GenerationOptions['marketData']): string {
    // Build dynamic content based on available data
    const highlights = [];
    if (data.features && data.features.length > 0) {
      highlights.push(...data.features.slice(0, 3));
    }
    if (data.location && data.location !== 'prime location') {
      highlights.push(`prime ${data.location} location`);
    }

    // Create compelling hook based on best features
    const getCompellingHook = () => {
      if (marketData && marketData.trendPercentage && marketData.trendPercentage > 5) return "TIMING IS EVERYTHING! 📈🏠";
      if (data.price && data.price > 2000000) return "LUXURY LIVING ALERT! 🏆✨";
      if (data.bedrooms && data.bedrooms >= 4) return "SPACIOUS FAMILY DREAM! 👨‍👩‍👧‍👦💕";
      if (data.features && data.features.some(f => f.toLowerCase().includes('pool'))) return "POOL PARADISE FOUND! 🏊‍♀️☀️";
      if (data.features && data.features.some(f => f.toLowerCase().includes('garden'))) return "GARDEN OASIS AWAITS! 🌸🌳";
      if (data.location && data.location !== 'prime location') return `LOCATION, LOCATION, LOCATION! 📍✨`;
      return "AMAZING OPPORTUNITY! 🔥🏠";
    };

    const hook = getCompellingHook();

    // Build market data section for Facebook
    const marketDataSection = marketData ? this.buildFacebookMarketDataSection(marketData, data.price) : '';

    // Dynamic property details with emojis
    const propertyDetails = [];
    if (data.location && data.location !== 'prime location') {
      propertyDetails.push(`📍 ${data.location} - Perfect for discerning homeowners!`);
    }
    if (data.bedrooms && data.bedrooms > 0) {
      propertyDetails.push(`🏡 ${data.bedrooms} bed`);
    }
    if (data.bathrooms && data.bathrooms > 0) {
      propertyDetails.push(`🛁 ${data.bathrooms} bath`);
    }
    if (data.size && data.size > 0) {
      propertyDetails.push(`📐 ${data.size} sqm of pure potential`);
    }
    if (data.price && data.price > 0) {
      propertyDetails.push(`💰 R ${data.price.toLocaleString()} - Incredible value!`);
    }

    const detailsText = propertyDetails.length > 0 ? propertyDetails.join('\n') : '🏠 Amazing property with great potential!';

    // Context-aware tone adjustments
    const toneInstructions = {
      professional: 'Maintain professional yet approachable tone suitable for family-oriented social sharing',
      enthusiastic: 'Show genuine excitement and passion for helping people find their dream home',
      luxury: 'Emphasize exclusivity and premium lifestyle while remaining accessible to aspirational buyers',
      friendly: 'Use warm, welcoming language that makes every viewer feel this could be their perfect home',
      formal: 'Present information clearly and elegantly while encouraging community engagement'
    };

    const lengthInstructions = length === 'short'
      ? 'Keep it punchy and immediately engaging - perfect for quick scrolls and instant shares'
      : 'Build emotional connection with detailed lifestyle benefits and community focus';

    return `
Create an exciting Facebook post about this amazing property that will get likes and shares! 🔥🏠

✨ ${hook}
${detailsText}

${length === 'full' ? `🌟 ${tone === 'enthusiastic' ? 'Get ready to fall in love! This incredible' : tone === 'luxury' ? 'Prepare to be impressed! This stunning' : 'You\'ll adore this beautiful'} ${data.propertyType || 'property'} has everything you need for modern living!` : ''}

${length === 'full' && highlights.length > 0 ? `Why you'll love it:
• ${highlights.slice(0, 3).join('\n• ')}` : ''}

${length === 'full' ? `Perfect for ${data.bedrooms && data.bedrooms >= 3 ? 'growing families' : 'young professionals'} looking for ${data.features && data.features.some(f => f.toLowerCase().includes('modern')) ? 'contemporary style' : 'comfortable living'}!` : ''}

${marketDataSection}

Requirements:
- Use engaging, conversational language that sparks joy and excitement
- Include relevant emojis (🏠, ✨, 💫, 🔥, 😍, ❤️, 🌟, 💰, 📍, 🛏️, 🛁, 📐)
- Add trending hashtags for maximum organic reach
- Strong call-to-action that encourages immediate engagement
- Create emotional connection and lifestyle aspiration
- Encourage shares and comments from the community
- Tone: ${tone}
- ${lengthInstructions}

${length === 'full' ? `Why This Location Rocks:
${data.location && data.location !== 'prime location' ? `✅ Easy access to everything you need\n✅ Safe, family-friendly neighborhood\n✅ Great schools and amenities nearby` : `✅ Prime location with excellent accessibility\n✅ Desirable neighborhood with strong community spirit\n✅ Convenient access to all essential services`}` : ''}

Ready to make this your dream home? DM me for a private viewing! 👀

#DreamHome #PropertyForSale #RealEstate #HomeSweetHome #${data.location && data.location !== 'prime location' ? data.location.replace(/\s+/g, '') : 'Property'}Homes ${data.price && data.price > 1500000 ? '#LuxuryLiving' : ''} ${data.bedrooms && data.bedrooms >= 3 ? '#FamilyHome' : ''}

${length === 'full' ? `Who else is dreaming of living in this amazing location? Drop a ❤️ if you love it!

Tag a friend who needs to see this perfect ${data.propertyType || 'home'}! 👇` : `Perfect for first-time buyers or those seeking their forever home!`}

${tone === 'enthusiastic' ? 'SO EXCITED to share this one with you! 🎉' : ''}
    `.trim();
  }

  private buildWhatsAppPrompt(data: GenerationOptions['propertyData'], tone: string, length: string, marketData?: GenerationOptions['marketData']): string {
    // Create compelling property highlight based on best features
    const getCompellingHighlight = () => {
      if (marketData && marketData.trendPercentage && marketData.trendPercentage > 5) return "SMART INVESTMENT OPPORTUNITY! 📈";
      if (data.price && data.price < 1500000) return "AMAZING VALUE ALERT! 💰✨";
      if (data.bedrooms && data.bedrooms >= 3) return "PERFECT FAMILY HOME! 👨‍👩‍👧‍👦";
      if (data.features && data.features.some(f => f.toLowerCase().includes('modern'))) return "STYLISH MODERN LIVING! 🏠✨";
      if (data.location && data.location !== 'prime location') return `GREAT ${data.location.toUpperCase()} LOCATION! 📍`;
      return "FANTASTIC OPPORTUNITY! 🔥";
    };

    const highlight = getCompellingHighlight();

    // Build market data section for WhatsApp
    const marketDataSection = marketData ? this.buildWhatsAppMarketDataSection(marketData, data.price) : '';

    // Build concise property details with emojis
    const propertyDetails = [];
    if (data.location && data.location !== 'prime location') {
      const locationBenefit = data.location.includes('suburb') ? 'quiet neighborhood' : 'convenient location';
      propertyDetails.push(`📍 ${data.location} - ${locationBenefit}`);
    }
    if (data.propertyType) {
      propertyDetails.push(`🏠 ${data.propertyType}`);
    }
    if (data.bedrooms && data.bedrooms > 0) {
      propertyDetails.push(`🛏️ ${data.bedrooms} bed`);
    }
    if (data.bathrooms && data.bathrooms > 0) {
      propertyDetails.push(`🛁 ${data.bathrooms} bath`);
    }
    if (data.size && data.size > 0) {
      propertyDetails.push(`📐 ${data.size} sqm`);
    }
    if (data.price && data.price > 0) {
      propertyDetails.push(`💰 R ${data.price.toLocaleString()} - Great value!`);
    }

    const detailsText = propertyDetails.length > 0 ? propertyDetails.join(' • ') : 'Great property opportunity';

    // Context-aware tone adjustments for WhatsApp
    const toneInstructions = {
      professional: 'Maintain professional courtesy while being warm and approachable',
      enthusiastic: 'Show genuine excitement about helping them find their perfect home',
      luxury: 'Emphasize premium quality while being accessible and helpful',
      friendly: 'Use warm, conversational language like chatting with a trusted friend',
      formal: 'Be polite and informative while keeping the tone personal and inviting'
    };

    const lengthInstructions = length === 'short'
      ? 'Keep it brief and punchy - perfect for busy people scanning messages'
      : 'Include engaging details that spark interest and conversation';

    return `
Hi! 👋 Check out this fantastic property I think you'd love:

🏠 ${highlight}
${detailsText}

${length === 'full' ? `This ${tone === 'enthusiastic' ? 'incredible' : tone === 'luxury' ? 'exceptional' : 'wonderful'} property offers everything you need for modern living!` : ''}

${data.features && data.features.length > 0 ? `✨ Key features: ${data.features.slice(0, 3).join(', ')}` : ''}

${length === 'full' ? `Perfect for ${data.bedrooms && data.bedrooms >= 3 ? 'growing families' : 'young professionals'} seeking ${data.features && data.features.some(f => f.toLowerCase().includes('modern')) ? 'contemporary comfort' : 'comfortable living'} in a ${data.location && data.location !== 'prime location' ? 'sought-after area' : 'convenient location'}.` : ''}

${marketDataSection}

Requirements:
- Perfect for quick messaging and easy forwarding to friends and family
- Include essential details with clear, scannable format using emojis
- Create personal connection that feels like a friendly recommendation
- Focus on lifestyle benefits that match typical buyer aspirations
- Include gentle urgency without pressure
- Tone: ${tone}
- ${lengthInstructions}

${length === 'full' ? `Why I think you'd love it:
• ${data.location && data.location !== 'prime location' ? 'Prime location with easy access to amenities' : 'Convenient location for modern lifestyle'}
• ${data.features && data.features.length > 0 ? `Premium features: ${data.features.slice(0, 2).join(' and ')}` : 'Quality finishes and modern conveniences'}
• ${data.price && data.price > 0 ? 'Excellent value for money' : 'Competitive pricing for the area'}` : ''}

Available for viewing this weekend! When suits you?

${length === 'full' ? `I've got several interested parties already - don't miss out on this ${data.propertyType || 'gem'}!` : `Spots filling up fast!`}

${tone === 'enthusiastic' ? 'SO excited to show you this one! 😊' : 'Looking forward to hearing from you! 👍'}

P.S. ${data.price && data.price < 1500000 ? 'This price point doesn\'t come around often!' : data.bedrooms && data.bedrooms >= 3 ? 'Perfect for your growing family!' : 'You\'re going to love the neighborhood!'}
    `.trim();
  }

  // Advanced prompt enhancement methods
  private getDynamicContentInsertions(data: GenerationOptions['propertyData'], platform: string): string {
    const insertions = [];

    // Property-type specific enhancements
    if (data.propertyType === 'apartment' && platform === 'facebook') {
      insertions.push('Perfect for urban professionals seeking sophisticated city living');
    }

    if (data.propertyType === 'house' && data.bedrooms && data.bedrooms >= 4) {
      insertions.push('Ideal for growing families who need space to thrive');
    }

    // Price-based enhancements
    if (data.price && data.price > 2000000 && platform === 'property24') {
      insertions.push('Premium pricing reflects exceptional quality and exclusive location');
    }

    if (data.price && data.price < 1500000 && platform === 'whatsapp') {
      insertions.push('Excellent entry-level pricing for first-time buyers');
    }

    // Feature-based enhancements
    if (data.features && data.features.some(f => f.toLowerCase().includes('pool'))) {
      if (platform === 'facebook') {
        insertions.push('Resort-style amenities for ultimate relaxation and entertainment');
      } else if (platform === 'property24') {
        insertions.push('Private pool adds luxury and entertainment value');
      }
    }

    // Location-based enhancements
    if (data.location && data.location !== 'prime location') {
      if (platform === 'property24') {
        insertions.push(`${data.location} offers excellent accessibility and convenience`);
      } else if (platform === 'facebook') {
        insertions.push(`Amazing ${data.location} lifestyle - everything you need is right here!`);
      }
    }

    return insertions.join('\n');
  }

  private getContextAwareToneAdjustment(tone: string, platform: string, data: GenerationOptions['propertyData']): string {
    const adjustments = [];

    // Luxury property adjustments
    if (tone === 'luxury' && data.price && data.price > 2000000) {
      adjustments.push('Emphasize exclusivity, premium craftsmanship, and sophisticated lifestyle benefits');
      adjustments.push('Highlight architectural excellence and superior build quality');
    }

    // Family-oriented adjustments
    if (data.bedrooms && data.bedrooms >= 3 && tone === 'friendly') {
      adjustments.push('Focus on creating a warm, welcoming atmosphere for family life');
      adjustments.push('Emphasize comfort, safety, and community connections');
    }

    // Investment-focused adjustments
    if (platform === 'property24' && tone === 'professional') {
      adjustments.push('Highlight investment potential and long-term value appreciation');
      adjustments.push('Mention market trends and growth potential in the area');
    }

    // Social media engagement adjustments
    if (platform === 'facebook' && tone === 'enthusiastic') {
      adjustments.push('Create excitement and emotional connection with aspirational lifestyle imagery');
      adjustments.push('Encourage community interaction and social sharing');
    }

    return adjustments.join('\n');
  }

  private getPlatformSpecificOptimizations(platform: string, length: string): string {
    const optimizations = [];

    switch (platform) {
      case 'property24':
        optimizations.push('Optimize for search engines with natural keyword integration');
        optimizations.push('Use longer, more detailed descriptions for serious buyers');
        if (length === 'full') {
          optimizations.push('Include comprehensive property specifications and neighborhood analysis');
        }
        break;

      case 'facebook':
        optimizations.push('Front-load key selling points for quick impact');
        optimizations.push('Use emotional triggers and lifestyle benefits');
        optimizations.push('Include clear visual cues and engagement prompts');
        break;

      case 'whatsapp':
        optimizations.push('Prioritize scannable format with bullet points and emojis');
        optimizations.push('Focus on immediate next steps and availability');
        optimizations.push('Keep personal and conversational while being professional');
        break;
    }

    return optimizations.join('\n');
  }

  private buildMarketDataSection(marketData: GenerationOptions['marketData'], propertyPrice?: number): string {
    if (!marketData) return '';

    let section = '\nMarket Analysis:\n';

    if (marketData.averagePrice) {
      section += `- Average property price in this area: R ${marketData.averagePrice.toLocaleString()}\n`;
    }

    if (marketData.medianPrice) {
      section += `- Median property price: R ${marketData.medianPrice.toLocaleString()}\n`;
    }

    if (marketData.pricePerSqm) {
      section += `- Average price per square meter: R ${marketData.pricePerSqm.toLocaleString()}\n`;
    }

    if (marketData.priceTrend && marketData.trendPercentage) {
      const trendDirection = marketData.trendPercentage > 0 ? 'increasing' : 'decreasing';
      section += `- Property prices are ${trendDirection} by ${Math.abs(marketData.trendPercentage)}% ${marketData.priceTrend}\n`;
    }

    if (marketData.comparableSales && marketData.comparableSales.length > 0) {
      section += `- Recent comparable sales in the area:\n`;
      marketData.comparableSales.slice(0, 3).forEach(sale => {
        section += `  • ${sale.bedrooms || 'N/A'} bed, ${sale.bathrooms || 'N/A'} bath`;
        if (sale.size) section += `, ${sale.size} sqm`;
        section += `: R ${sale.salePrice.toLocaleString()}\n`;
      });
    }

    if (propertyPrice && marketData.averagePrice) {
      const priceDiff = ((propertyPrice - marketData.averagePrice) / marketData.averagePrice) * 100;
      if (Math.abs(priceDiff) > 5) {
        const position = priceDiff > 0 ? 'above' : 'below';
        section += `- This property is priced ${Math.abs(priceDiff).toFixed(1)}% ${position} the area average\n`;
      }
    }

    return section;
  }

  private buildFacebookMarketDataSection(marketData: GenerationOptions['marketData'], propertyPrice?: number): string {
    if (!marketData) return '';

    let section = '\n📊 MARKET INSIGHT: This area is HOT right now! 🔥\n';

    if (marketData.priceTrend && marketData.trendPercentage && marketData.trendPercentage > 0) {
      section += `📈 Property values ${marketData.priceTrend} by ${marketData.trendPercentage}% - perfect timing to buy!\n`;
    }

    if (propertyPrice && marketData.averagePrice) {
      const priceDiff = ((propertyPrice - marketData.averagePrice) / marketData.averagePrice) * 100;
      if (priceDiff < -10) {
        section += `💰 STEAL OF A DEAL! Priced ${Math.abs(priceDiff).toFixed(0)}% below market average!\n`;
      } else if (priceDiff > 10) {
        section += `🏆 PREMIUM POSITIONING! This exceptional property justifies its premium pricing!\n`;
      }
    }

    if (marketData.comparableSales && marketData.comparableSales.length > 0) {
      const avgComparable = marketData.comparableSales.reduce((sum, sale) => sum + sale.salePrice, 0) / marketData.comparableSales.length;
      if (propertyPrice && propertyPrice < avgComparable * 0.95) {
        section += `🏠 Similar homes sold for R${avgComparable.toLocaleString()} - this is a rare opportunity!\n`;
      }
    }

    return section;
  }

  private buildWhatsAppMarketDataSection(marketData: GenerationOptions['marketData'], propertyPrice?: number): string {
    if (!marketData) return '';

    let section = '\n💡 Market Insight: ';

    if (marketData.priceTrend && marketData.trendPercentage && marketData.trendPercentage > 0) {
      section += `Properties in this area are appreciating nicely (${marketData.trendPercentage}% ${marketData.priceTrend}) - this could be a smart investment for you!`;
    } else if (propertyPrice && marketData.averagePrice) {
      const priceDiff = ((propertyPrice - marketData.averagePrice) / marketData.averagePrice) * 100;
      if (priceDiff < -5) {
        section += `This is priced very competitively compared to similar properties in the area.`;
      } else {
        section += `This property offers great value for the location and features.`;
      }
    } else {
      section += `The market here is quite active with lots of interest from buyers.`;
    }

    return section;
  }

  private enhancePromptWithAdvancedFeatures(prompt: string, options: GenerationOptions): string {
    const { platform, tone, length, propertyData } = options;

    // Add dynamic content insertions
    const dynamicContent = this.getDynamicContentInsertions(propertyData, platform);
    if (dynamicContent) {
      prompt += `\n\nDynamic Content Enhancements:\n${dynamicContent}`;
    }

    // Add context-aware tone adjustments
    const toneAdjustments = this.getContextAwareToneAdjustment(tone, platform, propertyData);
    if (toneAdjustments) {
      prompt += `\n\nContext-Aware Adjustments:\n${toneAdjustments}`;
    }

    // Add platform-specific optimizations
    const optimizations = this.getPlatformSpecificOptimizations(platform, length);
    if (optimizations) {
      prompt += `\n\nPlatform Optimizations:\n${optimizations}`;
    }

    return prompt;
  }

  // Health check method to verify API connectivity
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }
}

export default OpenAIService;
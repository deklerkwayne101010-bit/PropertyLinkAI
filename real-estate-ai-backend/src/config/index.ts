import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/real_estate_ai',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
    requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000', 10),
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10), // 1 hour default
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },

  gdpr: {
    compliance: process.env.GDPR_COMPLIANCE === 'true',
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '2555', 10), // 7 years
    contactEmail: process.env.GDPR_CONTACT_EMAIL || 'privacy@realestateai.com',
  },

  marketData: {
    property24ApiKey: process.env.PROPERTY24_API_KEY || '',
    property24BaseUrl: process.env.PROPERTY24_BASE_URL || 'https://api.property24.com',
    rateLimitRequests: parseInt(process.env.MARKET_DATA_RATE_LIMIT_REQUESTS || '100', 10),
    rateLimitWindowMs: parseInt(process.env.MARKET_DATA_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
    cacheTtl: parseInt(process.env.MARKET_DATA_CACHE_TTL || '86400', 10), // 24 hours
    requestTimeout: parseInt(process.env.MARKET_DATA_REQUEST_TIMEOUT || '30000', 10),
  },

  email: {
    fromName: process.env.EMAIL_FROM_NAME || 'Real Estate AI',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@realestateai.com',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export default config;
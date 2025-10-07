import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/tasklink_sa_db',

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD || '',

  // Email configuration
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@tasklinksa.co.za',
  fromName: process.env.FROM_NAME || 'TaskLink SA',

  // File upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // AWS S3 configuration
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'af-south-1',
  s3BucketName: process.env.S3_BUCKET_NAME || '',
  s3UploadPath: process.env.S3_UPLOAD_PATH || 'uploads/',

  // Google Maps API
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  // PayFast configuration
  payfastMerchantId: process.env.PAYFAST_MERCHANT_ID || '',
  payfastMerchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
  payfastPassphrase: process.env.PAYFAST_PASSPHRASE || '',
  payfastUrl: process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process',
  payfastReturnUrl: process.env.PAYFAST_RETURN_URL || '',
  payfastCancelUrl: process.env.PAYFAST_CANCEL_URL || '',
  payfastNotifyUrl: process.env.PAYFAST_NOTIFY_URL || '',

  // Stripe configuration
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Security configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',

  // Application configuration
  appName: process.env.APP_NAME || 'TaskLink SA',
  appVersion: process.env.APP_VERSION || '1.0.0',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@tasklinksa.co.za',
  companyName: process.env.COMPANY_NAME || 'TaskLink South Africa',
  companyAddress: process.env.COMPANY_ADDRESS || '123 Main Street, Johannesburg, South Africa',
  companyPhone: process.env.COMPANY_PHONE || '+27 11 123 4567',

  // Feature flags
  enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
  enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
  enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
};
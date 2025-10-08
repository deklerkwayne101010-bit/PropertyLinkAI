import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { gdprLogger } from './middleware/gdprLogger';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import propertyRoutes from './routes/property.js';
import marketDataRoutes from './routes/marketData.js';
import gdprRoutes from './routes/gdpr.js';
import aiContentRoutes from './routes/aiContent.js';
import photoEnhancementRoutes from './routes/photoEnhancement.js';
import aiImageEditorRoutes from './routes/aiImageEditor.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// GDPR logging middleware
app.use(gdprLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize application (no modular architecture for now)
async function initializeApp() {
  console.log('🔧 Initializing Real Estate AI Backend...');
  console.log('🎉 Application initialized successfully');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/ai-content', aiContentRoutes);
app.use('/api/photo-enhancement', photoEnhancementRoutes);
app.use('/api/ai-image-edit', aiImageEditorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize application
    await initializeApp();

    // Start server
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Real Estate AI Backend running on port ${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 API Base URL: ${config.server.apiBaseUrl}`);
      console.log(`🔒 CORS Origin: ${config.security.corsOrigin}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);

      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
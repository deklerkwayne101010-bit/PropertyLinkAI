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

// Import modular architecture components
import { pluginManager } from './modules/core/plugin-manager';
import { serviceRegistry } from './modules/core/service-registry';
import { eventBus } from './modules/core/event-bus';
import { configManager } from './modules/core/config-manager';

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

// Initialize modular architecture
async function initializeModules() {
  try {
    console.log('🔧 Initializing modular architecture...');

    // Load configuration sources
    await configManager.loadAll();

    // Register core services
    serviceRegistry.register('config', configManager);
    serviceRegistry.register('eventBus', eventBus);
    serviceRegistry.register('pluginManager', pluginManager);

    // Load modules from configuration
    const modulesToLoad = configManager.get('modules.enabled', []);
    for (const modulePath of modulesToLoad) {
      try {
        await pluginManager.loadModule(modulePath);
        console.log(`✅ Module loaded: ${modulePath}`);
      } catch (error) {
        console.error(`❌ Failed to load module ${modulePath}:`, error);
      }
    }

    console.log('🎉 Modular architecture initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize modular architecture:', error);
    // Continue with application startup even if modules fail
  }
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize modules and start server
async function startServer() {
  try {
    // Initialize modular architecture
    await initializeModules();

    // Start server
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Real Estate AI Backend running on port ${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 API Base URL: ${config.server.apiBaseUrl}`);
      console.log(`🔒 CORS Origin: ${config.security.corsOrigin}`);
      console.log(`🔌 Modules loaded: ${pluginManager.getModules().length}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully`);

      // Shutdown modules first
      await pluginManager.shutdown();

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
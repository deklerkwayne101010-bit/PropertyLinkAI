import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import configuration and database
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { securityHeaders } from '@/middleware/security';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import jobRoutes from '@/routes/job';
import applicationRoutes from '@/routes/application';
import paymentRoutes from '@/routes/payment';
import messageRoutes from '@/routes/message';
import notificationRoutes from '@/routes/notification';
import reviewRoutes from '@/routes/review';
import adminRoutes from '@/routes/admin';
import locationRoutes from '@/routes/location';

// Import Socket.io handlers
import { setupSocketHandlers } from '@/socket/handlers';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Global middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Custom middleware
app.use(requestLogger); // Custom request logging
app.use(rateLimitMiddleware); // Rate limiting
app.use(securityHeaders); // Additional security headers

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/location', locationRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'TaskLink SA API',
    version: process.env.APP_VERSION || '1.0.0',
    description: 'Local task and odd job marketplace for South Africa',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobs: '/api/jobs',
      applications: '/api/applications',
      payments: '/api/payments',
      messages: '/api/messages',
      notifications: '/api/notifications',
      reviews: '/api/reviews',
      location: '/api/location',
      admin: '/api/admin'
    }
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 TaskLink SA Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`🔌 Socket.io server ready for connections`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { app, server, io };
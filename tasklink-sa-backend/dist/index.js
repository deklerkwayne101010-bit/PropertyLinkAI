"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@/middleware/errorHandler");
const notFoundHandler_1 = require("@/middleware/notFoundHandler");
const requestLogger_1 = require("@/middleware/requestLogger");
const rateLimit_1 = require("@/middleware/rateLimit");
const security_1 = require("@/middleware/security");
const auth_1 = __importDefault(require("@/routes/auth"));
const user_1 = __importDefault(require("@/routes/user"));
const job_1 = __importDefault(require("@/routes/job"));
const application_1 = __importDefault(require("@/routes/application"));
const payment_1 = __importDefault(require("@/routes/payment"));
const message_1 = __importDefault(require("@/routes/message"));
const notification_1 = __importDefault(require("@/routes/notification"));
const review_1 = __importDefault(require("@/routes/review"));
const admin_1 = __importDefault(require("@/routes/admin"));
const location_1 = __importDefault(require("@/routes/location"));
const handlers_1 = require("@/socket/handlers");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
exports.io = io;
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger_1.requestLogger);
app.use(rateLimit_1.rateLimitMiddleware);
app.use(security_1.securityHeaders);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/users', user_1.default);
app.use('/api/jobs', job_1.default);
app.use('/api/applications', application_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/messages', message_1.default);
app.use('/api/notifications', notification_1.default);
app.use('/api/reviews', review_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/location', location_1.default);
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
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
(0, handlers_1.setupSocketHandlers)(io);
if (process.env.VERCEL) {
    module.exports = app;
}
else {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 TaskLink SA Server running on port ${PORT}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
        console.log(`🔌 Socket.io server ready for connections`);
    });
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
}
//# sourceMappingURL=index.js.map
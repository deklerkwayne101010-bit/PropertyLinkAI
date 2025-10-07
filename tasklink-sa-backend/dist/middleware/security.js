"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestSize = exports.corsHandler = exports.sanitizeInput = exports.securityHeaders = void 0;
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    };
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                req.body[key] = sanitizeString(value);
            }
        }
    }
    if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value === 'string') {
                req.query[key] = sanitizeString(value);
            }
        }
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
const corsHandler = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(200).end();
    }
    next();
};
exports.corsHandler = corsHandler;
const validateRequestSize = (req, res, next) => {
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '10485760');
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
            success: false,
            error: 'Request too large'
        });
    }
    next();
};
exports.validateRequestSize = validateRequestSize;
//# sourceMappingURL=security.js.map
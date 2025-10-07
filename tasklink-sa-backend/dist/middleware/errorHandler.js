"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error('Error:', err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { ...error, message, statusCode: 404 };
    }
    if (err.name === 'MongoError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { ...error, message, statusCode: 400 };
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = { ...error, message, statusCode: 400 };
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { ...error, message, statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { ...error, message, statusCode: 401 };
    }
    if (err.code?.startsWith('P')) {
        let message = 'Database error';
        let statusCode = 500;
        switch (err.code) {
            case 'P2002':
                message = 'Duplicate entry';
                statusCode = 400;
                break;
            case 'P2025':
                message = 'Record not found';
                statusCode = 404;
                break;
            case 'P2003':
                message = 'Foreign key constraint failed';
                statusCode = 400;
                break;
            default:
                message = 'Database operation failed';
        }
        error = { ...error, message, statusCode };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        ...(error.errors && { errors: error.errors })
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map
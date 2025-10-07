"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_1 = __importDefault(require("../controllers/payment"));
const webhook_1 = __importDefault(require("../controllers/webhook"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
router.post('/create', auth_1.authenticateToken, payment_1.default.createJobPayment);
router.get('/:id', auth_1.authenticateToken, payment_1.default.getPayment);
router.post('/webhook', webhook_1.default.handlePayFastWebhook);
router.put('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.updatePaymentStatus);
router.post('/:id/refund', auth_1.authenticateToken, payment_1.default.refundPayment);
router.post('/jobs/:id/payment', auth_1.authenticateToken, payment_1.default.createJobPayment);
router.get('/jobs/:id/payments', auth_1.authenticateToken, payment_1.default.getJobPayments);
router.post('/:id/release', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.releaseEscrowFunds);
router.get('/wallet/balance', auth_1.authenticateToken, payment_1.default.getWalletBalance);
router.get('/wallet/transactions', auth_1.authenticateToken, payment_1.default.getWalletTransactions);
router.post('/wallet/withdraw', auth_1.authenticateToken, payment_1.default.requestWithdrawal);
router.get('/wallet/earnings', auth_1.authenticateToken, payment_1.default.getEarnings);
router.get('/admin/payments', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.getAllPayments);
router.get('/admin/payments/pending', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.getPendingPayments);
router.put('/admin/payments/:id', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.updatePaymentStatus);
router.get('/admin/analytics', auth_1.authenticateToken, auth_1.requireAdmin, payment_1.default.getPaymentAnalytics);
router.post('/validate-itn', webhook_1.default.validatePayFastITN);
exports.default = router;
//# sourceMappingURL=payment.js.map
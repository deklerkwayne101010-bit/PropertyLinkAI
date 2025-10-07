import { Router } from 'express';
import paymentController from '../controllers/payment';
import webhookController from '../controllers/webhook';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Payment Processing Routes
router.post('/create', authenticateToken, paymentController.createJobPayment);
router.get('/:id', authenticateToken, paymentController.getPayment);
router.post('/webhook', webhookController.handlePayFastWebhook);
router.put('/:id/status', authenticateToken, requireAdmin, paymentController.updatePaymentStatus);
router.post('/:id/refund', authenticateToken, paymentController.refundPayment);

// Job Payment Management Routes
router.post('/jobs/:id/payment', authenticateToken, paymentController.createJobPayment);
router.get('/jobs/:id/payments', authenticateToken, paymentController.getJobPayments);
router.post('/:id/release', authenticateToken, requireAdmin, paymentController.releaseEscrowFunds);

// Wallet & Earnings Routes
router.get('/wallet/balance', authenticateToken, paymentController.getWalletBalance);
router.get('/wallet/transactions', authenticateToken, paymentController.getWalletTransactions);
router.post('/wallet/withdraw', authenticateToken, paymentController.requestWithdrawal);
router.get('/wallet/earnings', authenticateToken, paymentController.getEarnings);

// Admin Payment Management Routes
router.get('/admin/payments', authenticateToken, requireAdmin, paymentController.getAllPayments);
router.get('/admin/payments/pending', authenticateToken, requireAdmin, paymentController.getPendingPayments);
router.put('/admin/payments/:id', authenticateToken, requireAdmin, paymentController.updatePaymentStatus);
router.get('/admin/analytics', authenticateToken, requireAdmin, paymentController.getPaymentAnalytics);

// Legacy PayFast ITN endpoint (for older integrations)
router.post('/validate-itn', webhookController.validatePayFastITN);

export default router;
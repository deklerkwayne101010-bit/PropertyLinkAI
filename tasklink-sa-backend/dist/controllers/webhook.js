"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const payfast_1 = __importDefault(require("../services/payfast"));
const database_1 = require("../config/database");
class WebhookController {
    async handlePayFastWebhook(req, res) {
        try {
            const webhookData = req.body;
            console.log('PayFast webhook received:', JSON.stringify(webhookData, null, 2));
            const isValidSignature = payfast_1.default.validateWebhookSignature(webhookData);
            if (!isValidSignature) {
                console.error('Invalid PayFast webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
            const { m_payment_id, pf_payment_id, payment_status, amount_gross } = webhookData;
            if (!m_payment_id) {
                console.error('Missing payment ID in webhook');
                return res.status(400).json({ error: 'Missing payment ID' });
            }
            const payment = await database_1.prisma.payment.findUnique({
                where: { id: m_payment_id },
                include: { job: true, client: true, worker: true }
            });
            if (!payment) {
                console.error(`Payment not found: ${m_payment_id}`);
                return res.status(404).json({ error: 'Payment not found' });
            }
            switch (payment_status) {
                case 'COMPLETE':
                    await this.handleSuccessfulPayment(webhookData, payment);
                    break;
                case 'FAILED':
                    await this.handleFailedPayment(webhookData, payment);
                    break;
                case 'PENDING':
                    await this.handlePendingPayment(webhookData, payment);
                    break;
                default:
                    console.log(`Unhandled payment status: ${payment_status}`);
            }
            res.status(200).json({
                status: 'success',
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            console.error('Error processing PayFast webhook:', error);
            res.status(200).json({
                status: 'error',
                message: 'Error processing webhook',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async handleSuccessfulPayment(webhookData, payment) {
        try {
            const { pf_payment_id, amount_gross } = webhookData;
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    payfastId: pf_payment_id,
                    paidAt: new Date(),
                    updatedAt: new Date()
                }
            });
            const serviceFee = parseFloat(amount_gross) * 0.1;
            const netAmount = parseFloat(amount_gross) - serviceFee;
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    fee: serviceFee,
                    netAmount: netAmount
                }
            });
            if (payment.workerId) {
                await database_1.prisma.user.update({
                    where: { id: payment.workerId },
                    data: {
                        totalEarned: {
                            increment: netAmount
                        }
                    }
                });
            }
            await database_1.prisma.auditLog.create({
                data: {
                    userId: payment.clientId,
                    action: 'PAYMENT_COMPLETED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        payfastId: pf_payment_id,
                        amount: amount_gross,
                        status: 'COMPLETED',
                        serviceFee,
                        netAmount
                    }
                }
            });
            await this.createPaymentNotifications(payment, 'completed');
            console.log(`Payment ${payment.id} completed successfully`);
        }
        catch (error) {
            console.error('Error handling successful payment:', error);
            throw error;
        }
    }
    async handleFailedPayment(webhookData, payment) {
        try {
            const { pf_payment_id } = webhookData;
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'FAILED',
                    payfastId: pf_payment_id,
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.auditLog.create({
                data: {
                    userId: payment.clientId,
                    action: 'PAYMENT_FAILED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        payfastId: pf_payment_id,
                        status: 'FAILED'
                    }
                }
            });
            await this.createPaymentNotifications(payment, 'failed');
            console.log(`Payment ${payment.id} failed`);
        }
        catch (error) {
            console.error('Error handling failed payment:', error);
            throw error;
        }
    }
    async handlePendingPayment(webhookData, payment) {
        try {
            const { pf_payment_id } = webhookData;
            await database_1.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'PROCESSING',
                    payfastId: pf_payment_id,
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.auditLog.create({
                data: {
                    userId: payment.clientId,
                    action: 'PAYMENT_PROCESSING',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        payfastId: pf_payment_id,
                        status: 'PROCESSING'
                    }
                }
            });
            console.log(`Payment ${payment.id} is processing`);
        }
        catch (error) {
            console.error('Error handling pending payment:', error);
            throw error;
        }
    }
    async createPaymentNotifications(payment, status) {
        try {
            const notifications = [];
            notifications.push({
                userId: payment.clientId,
                title: `Payment ${status}`,
                message: `Your payment for "${payment.job?.title || 'job'}" has ${status}`,
                type: status === 'completed' ? 'PAYMENT_RECEIVED' : 'PAYMENT_FAILED',
                jobId: payment.jobId,
                actionUrl: `/payments/${payment.id}`
            });
            if (status === 'completed' && payment.workerId) {
                notifications.push({
                    userId: payment.workerId,
                    title: 'Payment received',
                    message: `You have received payment for "${payment.job?.title || 'job'}"`,
                    type: 'PAYMENT_RECEIVED',
                    jobId: payment.jobId,
                    actionUrl: `/payments/${payment.id}`
                });
            }
            if (notifications.length > 0) {
                await database_1.prisma.notification.createMany({
                    data: notifications
                });
            }
        }
        catch (error) {
            console.error('Error creating payment notifications:', error);
        }
    }
    async validatePayFastITN(req, res) {
        try {
            const validationData = {
                ...req.body,
                signature: req.body.signature || req.headers['signature']
            };
            const isValid = payfast_1.default.validateWebhookSignature(validationData);
            if (isValid) {
                res.status(200).send('VALID');
            }
            else {
                res.status(401).send('INVALID');
            }
        }
        catch (error) {
            console.error('Error validating PayFast ITN:', error);
            res.status(500).send('ERROR');
        }
    }
}
exports.WebhookController = WebhookController;
exports.default = new WebhookController();
//# sourceMappingURL=webhook.js.map
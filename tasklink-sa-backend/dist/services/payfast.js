"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const database_1 = require("../config/database");
class PayFastService {
    constructor() {
        this.config = {
            merchantId: process.env.PAYFAST_MERCHANT_ID || '',
            merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
            passphrase: process.env.PAYFAST_PASSPHRASE || '',
            sandbox: process.env.NODE_ENV !== 'production'
        };
        this.baseUrl = this.config.sandbox
            ? 'https://sandbox.payfast.co.za'
            : 'https://www.payfast.co.za';
    }
    generatePaymentData(paymentId, amount, description, customerInfo, customData) {
        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`;
        const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancelled`;
        const notifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`;
        const paymentData = {
            merchant_id: this.config.merchantId,
            merchant_key: this.config.merchantKey,
            return_url: returnUrl,
            cancel_url: cancelUrl,
            notify_url: notifyUrl,
            name_first: customerInfo.firstName,
            name_last: customerInfo.lastName,
            email_address: customerInfo.email,
            m_payment_id: paymentId,
            amount: amount.toFixed(2),
            item_name: description,
            item_description: `TaskLink SA - ${description}`,
        };
        if (customerInfo.phone) {
            paymentData.cell_number = customerInfo.phone;
        }
        if (customData) {
            if (customData.jobId) {
                paymentData.custom_str1 = customData.jobId;
            }
            if (customData.userId) {
                paymentData.custom_str2 = customData.userId;
            }
        }
        return paymentData;
    }
    generateSignature(paymentData) {
        const sortedData = Object.keys(paymentData)
            .filter(key => key !== 'signature')
            .sort()
            .reduce((result, key) => {
            result[key] = paymentData[key];
            return result;
        }, {});
        const queryString = Object.entries(sortedData)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');
        const signatureString = this.config.passphrase
            ? `${queryString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
            : queryString;
        return crypto.createHash('md5').update(signatureString).digest('hex');
    }
    validateWebhookSignature(webhookData) {
        const { signature, ...dataWithoutSignature } = webhookData;
        const sortedData = Object.keys(dataWithoutSignature)
            .sort()
            .reduce((result, key) => {
            result[key] = dataWithoutSignature[key];
            return result;
        }, {});
        const queryString = Object.entries(sortedData)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');
        const signatureString = this.config.passphrase
            ? `${queryString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
            : queryString;
        const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
        return signature.toLowerCase() === expectedSignature.toLowerCase();
    }
    async processSuccessfulPayment(webhookData) {
        const { m_payment_id, pf_payment_id, amount_gross, payment_status } = webhookData;
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: m_payment_id },
            include: { job: true, client: true, worker: true }
        });
        if (!payment) {
            throw new Error(`Payment not found: ${m_payment_id}`);
        }
        await database_1.prisma.payment.update({
            where: { id: m_payment_id },
            data: {
                status: payment_status === 'COMPLETE' ? 'COMPLETED' : 'FAILED',
                payfastId: pf_payment_id,
                paidAt: payment_status === 'COMPLETE' ? new Date() : null,
                updatedAt: new Date()
            }
        });
        if (payment_status === 'COMPLETE') {
            const serviceFee = parseFloat(amount_gross) * 0.1;
            const netAmount = parseFloat(amount_gross) - serviceFee;
            await database_1.prisma.payment.update({
                where: { id: m_payment_id },
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
                        status: payment_status
                    }
                }
            });
        }
    }
    async createJobPayment(jobId, clientId, workerId, amount, description) {
        const serviceFee = amount * 0.1;
        const netAmount = amount - serviceFee;
        const payment = await database_1.prisma.payment.create({
            data: {
                amount,
                jobId,
                clientId,
                workerId,
                fee: serviceFee,
                netAmount,
                description,
                status: 'PENDING'
            },
            include: {
                job: true,
                client: true,
                worker: true
            }
        });
        return payment;
    }
    async queryPaymentStatus(payfastId) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/eng/query/2`, {
                merchant_id: this.config.merchantId,
                merchant_key: this.config.merchantKey,
                pf_payment_id: payfastId
            });
            return response.data;
        }
        catch (error) {
            console.error('Error querying PayFast payment status:', error);
            throw new Error('Failed to query payment status');
        }
    }
    async processRefund(paymentId, amount) {
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { job: true, client: true, worker: true }
        });
        if (!payment || !payment.payfastId) {
            throw new Error('Payment not found or not processed through PayFast');
        }
        if (payment.status !== 'COMPLETED') {
            throw new Error('Can only refund completed payments');
        }
        const refundAmount = amount || payment.amount;
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/eng/refund/2`, {
                merchant_id: this.config.merchantId,
                merchant_key: this.config.merchantKey,
                pf_payment_id: payment.payfastId,
                amount: refundAmount.toFixed(2)
            });
            await database_1.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'REFUNDED',
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.auditLog.create({
                data: {
                    userId: payment.clientId,
                    action: 'PAYMENT_REFUNDED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        refundAmount: refundAmount.toFixed(2),
                        payfastId: payment.payfastId
                    }
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error processing PayFast refund:', error);
            throw new Error('Failed to process refund');
        }
    }
    async getPaymentAnalytics(startDate, endDate) {
        const dateFilter = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        } : {};
        const payments = await database_1.prisma.payment.findMany({
            where: {
                ...dateFilter,
                status: 'COMPLETED'
            },
            include: {
                job: true,
                client: true,
                worker: true
            }
        });
        const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalFees = payments.reduce((sum, payment) => sum + (payment.fee || 0), 0);
        const totalNetAmount = payments.reduce((sum, payment) => sum + (payment.netAmount || 0), 0);
        return {
            totalPayments: payments.length,
            totalAmount,
            totalFees,
            totalNetAmount,
            averagePaymentAmount: payments.length > 0 ? totalAmount / payments.length : 0,
            paymentsByStatus: await this.getPaymentsByStatus(),
            recentPayments: payments.slice(0, 10)
        };
    }
    async getPaymentsByStatus() {
        const statusCounts = await database_1.prisma.payment.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        const result = {
            PENDING: 0,
            PROCESSING: 0,
            COMPLETED: 0,
            FAILED: 0,
            REFUNDED: 0,
            CANCELLED: 0
        };
        statusCounts.forEach((item) => {
            result[item.status] = item._count.status;
        });
        return result;
    }
}
exports.default = new PayFastService();
//# sourceMappingURL=payfast.js.map
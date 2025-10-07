"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const database_1 = require("../config/database");
const payfast_1 = __importDefault(require("../services/payfast"));
const express_validator_1 = require("express-validator");
const validatePaymentCreation = [
    (0, express_validator_1.body)('jobId').isString().notEmpty(),
    (0, express_validator_1.body)('amount').isFloat({ min: 50, max: 50000 }),
    (0, express_validator_1.body)('description').isString().notEmpty(),
];
const validatePaymentUpdate = [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('status').isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']),
];
const validateRefund = [
    (0, express_validator_1.param)('id').isString().notEmpty(),
    (0, express_validator_1.body)('amount').optional().isFloat({ min: 0.01 }),
    (0, express_validator_1.body)('reason').optional().isString(),
];
const validateWalletWithdrawal = [
    (0, express_validator_1.body)('amount').isFloat({ min: 100, max: 10000 }),
    (0, express_validator_1.body)('bankAccount').isString().notEmpty(),
    (0, express_validator_1.body)('bankName').isString().notEmpty(),
];
const handleValidationErrors = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
};
class PaymentController {
    async createJobPayment(req, res) {
        try {
            handleValidationErrors(req, res);
            const { jobId } = req.params;
            const { description } = req.body;
            const clientId = req.user.id;
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId },
                include: { worker: true, poster: true }
            });
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }
            if (job.posterId !== clientId) {
                return res.status(403).json({ error: 'Only job poster can create payments' });
            }
            if (job.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Can only create payments for completed jobs' });
            }
            if (job.workerId === null) {
                return res.status(400).json({ error: 'Job must have an assigned worker' });
            }
            const existingPayment = await database_1.prisma.payment.findFirst({
                where: { jobId, status: { in: ['PENDING', 'COMPLETED'] } }
            });
            if (existingPayment) {
                return res.status(400).json({ error: 'Payment already exists for this job' });
            }
            const serviceFee = job.budget * 0.1;
            const netAmount = job.budget - serviceFee;
            const payment = await database_1.prisma.payment.create({
                data: {
                    amount: job.budget,
                    jobId,
                    clientId,
                    workerId: job.workerId,
                    fee: serviceFee,
                    netAmount,
                    description: description || `Payment for job: ${job.title}`,
                    status: 'PENDING'
                },
                include: {
                    job: true,
                    client: true,
                    worker: true
                }
            });
            const paymentData = payfast_1.default.generatePaymentData(payment.id, job.budget, payment.description, {
                firstName: payment.client.firstName,
                lastName: payment.client.lastName,
                email: payment.client.email,
                phone: payment.client.phone || undefined
            }, {
                jobId: job.id,
                userId: clientId
            });
            ;
            paymentData.signature = payfast_1.default.generateSignature(paymentData);
            res.json({
                payment,
                payfastData: paymentData,
                redirectUrl: `${payfast_1.default['baseUrl']}/eng/process`
            });
        }
        catch (error) {
            console.error('Error creating job payment:', error);
            res.status(500).json({ error: 'Failed to create payment' });
        }
    }
    async getPayment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const payment = await database_1.prisma.payment.findUnique({
                where: { id },
                include: {
                    job: true,
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    worker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            });
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            if (payment.clientId !== userId && payment.workerId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            res.json({ payment });
        }
        catch (error) {
            console.error('Error getting payment:', error);
            res.status(500).json({ error: 'Failed to get payment' });
        }
    }
    async getJobPayments(req, res) {
        try {
            const { id: jobId } = req.params;
            const userId = req.user.id;
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId },
                select: { posterId: true, workerId: true }
            });
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }
            if (job.posterId !== userId && job.workerId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            const payments = await database_1.prisma.payment.findMany({
                where: { jobId },
                include: {
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    worker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ payments });
        }
        catch (error) {
            console.error('Error getting job payments:', error);
            res.status(500).json({ error: 'Failed to get payments' });
        }
    }
    async releaseEscrowFunds(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const payment = await database_1.prisma.payment.findUnique({
                where: { id },
                include: { job: true, worker: true }
            });
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Only admin can release escrow funds' });
            }
            if (payment.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Can only release completed payments' });
            }
            const updatedPayment = await database_1.prisma.payment.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.user.update({
                where: { id: payment.workerId },
                data: {
                    totalEarned: {
                        increment: payment.netAmount || 0
                    }
                }
            });
            await database_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ESCROW_RELEASED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        releasedAmount: payment.netAmount,
                        workerId: payment.workerId
                    }
                }
            });
            res.json({
                message: 'Escrow funds released successfully',
                payment: updatedPayment
            });
        }
        catch (error) {
            console.error('Error releasing escrow funds:', error);
            res.status(500).json({ error: 'Failed to release escrow funds' });
        }
    }
    async refundPayment(req, res) {
        try {
            handleValidationErrors(req, res);
            const { id } = req.params;
            const { amount, reason } = req.body;
            const userId = req.user.id;
            const payment = await database_1.prisma.payment.findUnique({
                where: { id },
                include: { job: true, client: true }
            });
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            if (req.user.role !== 'admin' && payment.clientId !== userId) {
                return res.status(403).json({ error: 'Only admin or payment client can refund' });
            }
            if (payment.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Can only refund completed payments' });
            }
            const refundResult = await payfast_1.default.processRefund(id, amount || undefined);
            await database_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'PAYMENT_REFUNDED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    newValues: {
                        refundAmount: amount || payment.amount,
                        reason: reason || 'No reason provided'
                    }
                }
            });
            res.json({
                message: 'Refund processed successfully',
                refund: refundResult
            });
        }
        catch (error) {
            console.error('Error processing refund:', error);
            res.status(500).json({ error: 'Failed to process refund' });
        }
    }
    async getWalletBalance(req, res) {
        try {
            const userId = req.user.id;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    totalEarned: true,
                    payments: {
                        where: {
                            workerId: userId,
                            status: 'COMPLETED'
                        },
                        select: {
                            amount: true,
                            fee: true,
                            netAmount: true,
                            createdAt: true,
                            job: {
                                select: {
                                    title: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 10
                    }
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const totalEarnings = user.totalEarned;
            const availableBalance = totalEarnings;
            res.json({
                balance: availableBalance,
                totalEarned: totalEarnings,
                recentTransactions: user.payments
            });
        }
        catch (error) {
            console.error('Error getting wallet balance:', error);
            res.status(500).json({ error: 'Failed to get wallet balance' });
        }
    }
    async getWalletTransactions(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const [transactions, total] = await Promise.all([
                database_1.prisma.payment.findMany({
                    where: {
                        OR: [
                            { workerId: userId },
                            { clientId: userId }
                        ]
                    },
                    include: {
                        job: {
                            select: {
                                title: true,
                                status: true
                            }
                        },
                        client: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        worker: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum
                }),
                database_1.prisma.payment.count({
                    where: {
                        OR: [
                            { workerId: userId },
                            { clientId: userId }
                        ]
                    }
                })
            ]);
            res.json({
                transactions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            });
        }
        catch (error) {
            console.error('Error getting wallet transactions:', error);
            res.status(500).json({ error: 'Failed to get transactions' });
        }
    }
    async requestWithdrawal(req, res) {
        try {
            handleValidationErrors(req, res);
            const userId = req.user.id;
            const { amount, bankAccount, bankName, routingNumber } = req.body;
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { totalEarned: true }
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (user.totalEarned < amount) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            const withdrawalRequest = await database_1.prisma.auditLog.create({
                data: {
                    userId,
                    action: 'WITHDRAWAL_REQUESTED',
                    entityType: 'Withdrawal',
                    entityId: `withdrawal_${Date.now()}`,
                    newValues: {
                        amount,
                        bankAccount,
                        bankName,
                        routingNumber,
                        status: 'PENDING'
                    }
                }
            });
            res.json({
                message: 'Withdrawal request submitted successfully',
                requestId: withdrawalRequest.id,
                amount,
                status: 'PENDING'
            });
        }
        catch (error) {
            console.error('Error requesting withdrawal:', error);
            res.status(500).json({ error: 'Failed to request withdrawal' });
        }
    }
    async getEarnings(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;
            const dateFilter = startDate && endDate ? {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {};
            const earnings = await database_1.prisma.payment.findMany({
                where: {
                    workerId: userId,
                    status: 'COMPLETED',
                    ...dateFilter
                },
                select: {
                    amount: true,
                    fee: true,
                    netAmount: true,
                    createdAt: true,
                    job: {
                        select: {
                            title: true,
                            category: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            const totalEarned = earnings.reduce((sum, payment) => sum + (payment.netAmount || 0), 0);
            const totalFees = earnings.reduce((sum, payment) => sum + (payment.fee || 0), 0);
            const totalJobs = earnings.length;
            const earningsByCategory = earnings.reduce((acc, payment) => {
                const category = payment.job?.category || 'Other';
                if (!acc[category]) {
                    acc[category] = { total: 0, count: 0 };
                }
                acc[category].total += payment.netAmount || 0;
                acc[category].count += 1;
                return acc;
            }, {});
            res.json({
                totalEarned,
                totalFees,
                totalJobs,
                netEarnings: totalEarned,
                earningsByCategory,
                transactions: earnings
            });
        }
        catch (error) {
            console.error('Error getting earnings:', error);
            res.status(500).json({ error: 'Failed to get earnings' });
        }
    }
    async getAllPayments(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const { page = 1, limit = 20, status } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const whereClause = {};
            if (status) {
                whereClause.status = status;
            }
            const [payments, total] = await Promise.all([
                database_1.prisma.payment.findMany({
                    where: whereClause,
                    include: {
                        job: {
                            select: {
                                title: true,
                                category: true,
                                status: true
                            }
                        },
                        client: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        worker: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limitNum
                }),
                database_1.prisma.payment.count({ where: whereClause })
            ]);
            res.json({
                payments,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            });
        }
        catch (error) {
            console.error('Error getting all payments:', error);
            res.status(500).json({ error: 'Failed to get payments' });
        }
    }
    async getPendingPayments(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const payments = await database_1.prisma.payment.findMany({
                where: {
                    status: {
                        in: ['PENDING', 'PROCESSING']
                    }
                },
                include: {
                    job: {
                        select: {
                            title: true,
                            category: true,
                            location: true,
                            completedAt: true
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true
                        }
                    },
                    worker: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                orderBy: [
                    { createdAt: 'asc' },
                    { amount: 'desc' }
                ]
            });
            res.json({ payments });
        }
        catch (error) {
            console.error('Error getting pending payments:', error);
            res.status(500).json({ error: 'Failed to get pending payments' });
        }
    }
    async updatePaymentStatus(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            handleValidationErrors(req, res);
            const { id } = req.params;
            const { status, notes } = req.body;
            const payment = await database_1.prisma.payment.findUnique({
                where: { id },
                include: { job: true, client: true, worker: true }
            });
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            const updatedPayment = await database_1.prisma.payment.update({
                where: { id },
                data: {
                    status,
                    updatedAt: new Date()
                }
            });
            await database_1.prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PAYMENT_STATUS_UPDATED',
                    entityType: 'Payment',
                    entityId: payment.id,
                    oldValues: {
                        status: payment.status
                    },
                    newValues: {
                        status,
                        notes: notes || 'No notes provided'
                    }
                }
            });
            res.json({
                message: 'Payment status updated successfully',
                payment: updatedPayment
            });
        }
        catch (error) {
            console.error('Error updating payment status:', error);
            res.status(500).json({ error: 'Failed to update payment status' });
        }
    }
    async getPaymentAnalytics(req, res) {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const { startDate, endDate } = req.query;
            const dateFilter = startDate && endDate ? {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            } : {};
            const analytics = await payfast_1.default.getPaymentAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            const totalUsers = await database_1.prisma.user.count({
                where: {
                    payments: {
                        some: {
                            status: 'COMPLETED',
                            ...dateFilter
                        }
                    }
                }
            });
            const paymentsByMethod = await database_1.prisma.payment.groupBy({
                by: ['paymentMethod'],
                where: {
                    status: 'COMPLETED',
                    ...dateFilter
                },
                _count: {
                    paymentMethod: true
                }
            });
            res.json({
                ...analytics,
                totalUsers,
                paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
                    acc[item.paymentMethod || 'unknown'] = item._count.paymentMethod;
                    return acc;
                }, {})
            });
        }
        catch (error) {
            console.error('Error getting payment analytics:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    }
}
exports.PaymentController = PaymentController;
exports.default = new PaymentController();
//# sourceMappingURL=payment.js.map
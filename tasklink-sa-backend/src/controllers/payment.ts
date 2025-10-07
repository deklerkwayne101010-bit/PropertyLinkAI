import { Request, Response } from 'express';
import { prisma } from '../config/database';
import payfastService from '../services/payfast';
import { body, param, validationResult } from 'express-validator';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Validation middleware
const validatePaymentCreation = [
  body('jobId').isString().notEmpty(),
  body('amount').isFloat({ min: 50, max: 50000 }),
  body('description').isString().notEmpty(),
];

const validatePaymentUpdate = [
  param('id').isString().notEmpty(),
  body('status').isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']),
];

const validateRefund = [
  param('id').isString().notEmpty(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isString(),
];

const validateWalletWithdrawal = [
  body('amount').isFloat({ min: 100, max: 10000 }),
  body('bankAccount').isString().notEmpty(),
  body('bankName').isString().notEmpty(),
];

// Error handling helper
const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
};

export class PaymentController {

  /**
   * Create payment for completed job
   * POST /api/jobs/:id/payment
   */
  async createJobPayment(req: AuthRequest, res: Response) {
    try {
      handleValidationErrors(req, res);

      const { jobId } = req.params;
      const { description } = req.body;
      const clientId = req.user!.id;

      // Get job details
      const job = await prisma.job.findUnique({
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

      // Check if payment already exists
      const existingPayment = await prisma.payment.findFirst({
        where: { jobId, status: { in: ['PENDING', 'COMPLETED'] } }
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'Payment already exists for this job' });
      }

      // Calculate 10% service fee
      const serviceFee = job.budget * 0.1;
      const netAmount = job.budget - serviceFee;

      // Create payment record
      const payment = await prisma.payment.create({
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

      // Generate PayFast payment data
      const paymentData = payfastService.generatePaymentData(
        payment.id,
        job.budget,
        payment.description!,
        {
          firstName: payment.client.firstName,
          lastName: payment.client.lastName,
          email: payment.client.email,
          phone: payment.client.phone || undefined
        },
        {
          jobId: job.id,
          userId: clientId
        }
      );

      // Add signature (modify the object directly)
      ;(paymentData as any).signature = payfastService.generateSignature(paymentData);

      res.json({
        payment,
        payfastData: paymentData,
        redirectUrl: `${payfastService['baseUrl']}/eng/process`
      });

    } catch (error) {
      console.error('Error creating job payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  }

  /**
   * Get payment details
   * GET /api/payments/:id
   */
  async getPayment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const payment = await prisma.payment.findUnique({
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

      // Check if user has access to this payment
      if (payment.clientId !== userId && payment.workerId !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ payment });

    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({ error: 'Failed to get payment' });
    }
  }

  /**
   * Get all payments for a job
   * GET /api/jobs/:id/payments
   */
  async getJobPayments(req: AuthRequest, res: Response) {
    try {
      const { id: jobId } = req.params;
      const userId = req.user!.id;

      // Verify user has access to the job
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { posterId: true, workerId: true }
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.posterId !== userId && job.workerId !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const payments = await prisma.payment.findMany({
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

    } catch (error) {
      console.error('Error getting job payments:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  }

  /**
   * Release escrow funds to worker
   * POST /api/payments/:id/release
   */
  async releaseEscrowFunds(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { job: true, worker: true }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Only admin or system can release escrow funds
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Only admin can release escrow funds' });
      }

      if (payment.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Can only release completed payments' });
      }

      // Update payment status to indicate funds released
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status: 'COMPLETED', // Already completed, but marking as fully processed
          updatedAt: new Date()
        }
      });

      // Update worker's total earned
      await prisma.user.update({
        where: { id: payment.workerId },
        data: {
          totalEarned: {
            increment: payment.netAmount || 0
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
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

    } catch (error) {
      console.error('Error releasing escrow funds:', error);
      res.status(500).json({ error: 'Failed to release escrow funds' });
    }
  }

  /**
   * Process payment refund
   * POST /api/payments/:id/refund
   */
  async refundPayment(req: AuthRequest, res: Response) {
    try {
      handleValidationErrors(req, res);

      const { id } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user!.id;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { job: true, client: true }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Only admin or payment client can request refund
      if (req.user!.role !== 'admin' && payment.clientId !== userId) {
        return res.status(403).json({ error: 'Only admin or payment client can refund' });
      }

      if (payment.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Can only refund completed payments' });
      }

      // Process refund through PayFast
      const refundResult = await payfastService.processRefund(id, amount || undefined);

      // Create audit log
      await prisma.auditLog.create({
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

    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }

  /**
   * Get user wallet balance and transactions
   * GET /api/wallet/balance
   */
  async getWalletBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
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
      const availableBalance = totalEarnings; // In a real app, this would account for pending withdrawals

      res.json({
        balance: availableBalance,
        totalEarned: totalEarnings,
        recentTransactions: user.payments
      });

    } catch (error) {
      console.error('Error getting wallet balance:', error);
      res.status(500).json({ error: 'Failed to get wallet balance' });
    }
  }

  /**
   * Get wallet transaction history
   * GET /api/wallet/transactions
   */
  async getWalletTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [transactions, total] = await Promise.all([
        prisma.payment.findMany({
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
        prisma.payment.count({
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

    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }

  /**
   * Request wallet withdrawal
   * POST /api/wallet/withdraw
   */
  async requestWithdrawal(req: AuthRequest, res: Response) {
    try {
      handleValidationErrors(req, res);

      const userId = req.user!.id;
      const { amount, bankAccount, bankName, routingNumber } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalEarned: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.totalEarned < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // In a real implementation, this would integrate with a bank API
      // For now, we'll create a withdrawal request record
      const withdrawalRequest = await prisma.auditLog.create({
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

    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      res.status(500).json({ error: 'Failed to request withdrawal' });
    }
  }

  /**
   * Get user earnings breakdown
   * GET /api/wallet/earnings
   */
  async getEarnings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      } : {};

      const earnings = await prisma.payment.findMany({
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

      const totalEarned = earnings.reduce((sum: number, payment: any) => sum + (payment.netAmount || 0), 0);
      const totalFees = earnings.reduce((sum: number, payment: any) => sum + (payment.fee || 0), 0);
      const totalJobs = earnings.length;

      // Group by category
      const earningsByCategory = earnings.reduce((acc: Record<string, { total: number; count: number }>, payment: any) => {
        const category = payment.job?.category || 'Other';
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += payment.netAmount || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      res.json({
        totalEarned,
        totalFees,
        totalJobs,
        netEarnings: totalEarned,
        earningsByCategory,
        transactions: earnings
      });

    } catch (error) {
      console.error('Error getting earnings:', error);
      res.status(500).json({ error: 'Failed to get earnings' });
    }
  }

  /**
   * Admin: Get all payments
   * GET /api/admin/payments
   */
  async getAllPayments(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { page = 1, limit = 20, status } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const whereClause: any = {};
      if (status) {
        whereClause.status = status;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
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
        prisma.payment.count({ where: whereClause })
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

    } catch (error) {
      console.error('Error getting all payments:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  }

  /**
   * Admin: Get pending payments
   * GET /api/admin/payments/pending
   */
  async getPendingPayments(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const payments = await prisma.payment.findMany({
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
          { createdAt: 'asc' }, // Oldest first for processing
          { amount: 'desc' } // Higher amounts first
        ]
      });

      res.json({ payments });

    } catch (error) {
      console.error('Error getting pending payments:', error);
      res.status(500).json({ error: 'Failed to get pending payments' });
    }
  }

  /**
   * Admin: Update payment status
   * PUT /api/admin/payments/:id
   */
  async updatePaymentStatus(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      handleValidationErrors(req, res);

      const { id } = req.params;
      const { status, notes } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { job: true, client: true, worker: true }
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
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

    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  }

  /**
   * Get payment analytics
   * GET /api/admin/analytics
   */
  async getPaymentAnalytics(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { startDate, endDate } = req.query;

      const dateFilter = startDate && endDate ? {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      } : {};

      const analytics = await payfastService.getPaymentAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      // Add additional analytics
      const totalUsers = await prisma.user.count({
        where: {
          payments: {
            some: {
              status: 'COMPLETED',
              ...dateFilter
            }
          }
        }
      });

      const paymentsByMethod = await prisma.payment.groupBy({
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
        paymentsByMethod: paymentsByMethod.reduce((acc: Record<string, number>, item: any) => {
          acc[item.paymentMethod || 'unknown'] = item._count.paymentMethod;
          return acc;
        }, {} as Record<string, number>)
      });

    } catch (error) {
      console.error('Error getting payment analytics:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  }
}

export default new PaymentController();
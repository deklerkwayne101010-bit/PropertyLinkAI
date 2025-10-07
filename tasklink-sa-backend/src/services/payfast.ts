import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { prisma } from '../config/database';

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  sandbox: boolean;
}

interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_str1?: string;
  custom_str2?: string;
}

interface PayFastWebhookData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING';
  item_name: string;
  item_description?: string;
  amount_gross: string;
  amount_fee?: string;
  amount_net?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_int1?: string;
  custom_int2?: string;
  signature: string;
}

class PayFastService {
  private config: PayFastConfig;
  private baseUrl: string;

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

  /**
   * Generate PayFast payment data for form submission
   */
  generatePaymentData(
    paymentId: string,
    amount: number,
    description: string,
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    },
    customData?: {
      jobId?: string;
      userId?: string;
    }
  ): PayFastPaymentData {
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancelled`;
    const notifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`;

    const paymentData: PayFastPaymentData = {
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

  /**
   * Generate signature for PayFast payment data
   */
  generateSignature(paymentData: PayFastPaymentData): string {
    // Sort the payment data by key
    const sortedData = Object.keys(paymentData)
      .filter(key => key !== 'signature')
      .sort()
      .reduce((result, key) => {
        result[key] = paymentData[key as keyof PayFastPaymentData];
        return result;
      }, {} as any);

    // Build the query string
    const queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    // Add passphrase if configured
    const signatureString = this.config.passphrase
      ? `${queryString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
      : queryString;

    // Generate MD5 hash
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(webhookData: PayFastWebhookData): boolean {
    const { signature, ...dataWithoutSignature } = webhookData;

    // Sort the data by key
    const sortedData = Object.keys(dataWithoutSignature)
      .sort()
      .reduce((result, key) => {
        result[key] = dataWithoutSignature[key as keyof typeof dataWithoutSignature];
        return result;
      }, {} as any);

    // Build the query string
    const queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    // Add passphrase if configured
    const signatureString = this.config.passphrase
      ? `${queryString}&passphrase=${encodeURIComponent(this.config.passphrase)}`
      : queryString;

    // Generate expected signature
    const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex');

    return signature.toLowerCase() === expectedSignature.toLowerCase();
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(webhookData: PayFastWebhookData): Promise<void> {
    const { m_payment_id, pf_payment_id, amount_gross, payment_status } = webhookData;

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: m_payment_id },
      include: { job: true, client: true, worker: true }
    });

    if (!payment) {
      throw new Error(`Payment not found: ${m_payment_id}`);
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: m_payment_id },
      data: {
        status: payment_status === 'COMPLETE' ? 'COMPLETED' : 'FAILED',
        payfastId: pf_payment_id,
        paidAt: payment_status === 'COMPLETE' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    if (payment_status === 'COMPLETE') {
      // Calculate 10% service fee
      const serviceFee = parseFloat(amount_gross) * 0.1;
      const netAmount = parseFloat(amount_gross) - serviceFee;

      // Update payment with fee calculation
      await prisma.payment.update({
        where: { id: m_payment_id },
        data: {
          fee: serviceFee,
          netAmount: netAmount
        }
      });

      // Update user's total earned if this is a job payment
      if (payment.workerId) {
        await prisma.user.update({
          where: { id: payment.workerId },
          data: {
            totalEarned: {
              increment: netAmount
            }
          }
        });
      }

      // Create audit log
      await prisma.auditLog.create({
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

  /**
   * Create payment record for job
   */
  async createJobPayment(
    jobId: string,
    clientId: string,
    workerId: string,
    amount: number,
    description: string
  ): Promise<any> {
    // Calculate 10% service fee
    const serviceFee = amount * 0.1;
    const netAmount = amount - serviceFee;

    const payment = await prisma.payment.create({
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

  /**
   * Get payment status from PayFast
   */
  async queryPaymentStatus(payfastId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/eng/query/2`,
        {
          merchant_id: this.config.merchantId,
          merchant_key: this.config.merchantKey,
          pf_payment_id: payfastId
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error querying PayFast payment status:', error);
      throw new Error('Failed to query payment status');
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number): Promise<any> {
    const payment = await prisma.payment.findUnique({
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
      const response = await axios.post(
        `${this.baseUrl}/eng/refund/2`,
        {
          merchant_id: this.config.merchantId,
          merchant_key: this.config.merchantKey,
          pf_payment_id: payment.payfastId,
          amount: refundAmount.toFixed(2)
        }
      );

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
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
    } catch (error) {
      console.error('Error processing PayFast refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    const payments = await prisma.payment.findMany({
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

    const totalAmount = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const totalFees = payments.reduce((sum: number, payment: any) => sum + (payment.fee || 0), 0);
    const totalNetAmount = payments.reduce((sum: number, payment: any) => sum + (payment.netAmount || 0), 0);

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

  /**
   * Get payments by status
   */
  private async getPaymentsByStatus(): Promise<Record<string, number>> {
    const statusCounts = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const result: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      REFUNDED: 0,
      CANCELLED: 0
    };

    statusCounts.forEach((item: any) => {
      result[item.status] = item._count.status;
    });

    return result;
  }
}

export default new PayFastService();
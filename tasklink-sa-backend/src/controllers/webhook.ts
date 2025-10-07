import { Request, Response } from 'express';
import payfastService from '../services/payfast';
import { prisma } from '../config/database';

export class WebhookController {

  /**
   * Handle PayFast payment webhooks
   * POST /api/payments/webhook
   */
  async handlePayFastWebhook(req: Request, res: Response) {
    try {
      const webhookData = req.body;

      // Log the incoming webhook for debugging
      console.log('PayFast webhook received:', JSON.stringify(webhookData, null, 2));

      // Validate webhook signature
      const isValidSignature = payfastService.validateWebhookSignature(webhookData);

      if (!isValidSignature) {
        console.error('Invalid PayFast webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { m_payment_id, pf_payment_id, payment_status, amount_gross } = webhookData;

      if (!m_payment_id) {
        console.error('Missing payment ID in webhook');
        return res.status(400).json({ error: 'Missing payment ID' });
      }

      // Find the payment record
      const payment = await prisma.payment.findUnique({
        where: { id: m_payment_id },
        include: { job: true, client: true, worker: true }
      });

      if (!payment) {
        console.error(`Payment not found: ${m_payment_id}`);
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Process the webhook based on payment status
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

      // Always return 200 to PayFast to acknowledge receipt
      res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      console.error('Error processing PayFast webhook:', error);

      // Still return 200 to prevent PayFast from retrying
      res.status(200).json({
        status: 'error',
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(webhookData: any, payment: any) {
    try {
      const { pf_payment_id, amount_gross } = webhookData;

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          payfastId: pf_payment_id,
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Calculate 10% service fee
      const serviceFee = parseFloat(amount_gross) * 0.1;
      const netAmount = parseFloat(amount_gross) - serviceFee;

      // Update payment with fee calculation
      await prisma.payment.update({
        where: { id: payment.id },
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
            status: 'COMPLETED',
            serviceFee,
            netAmount
          }
        }
      });

      // Send notifications to client and worker
      await this.createPaymentNotifications(payment, 'completed');

      console.log(`Payment ${payment.id} completed successfully`);

    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(webhookData: any, payment: any) {
    try {
      const { pf_payment_id } = webhookData;

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          payfastId: pf_payment_id,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
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

      // Send notifications
      await this.createPaymentNotifications(payment, 'failed');

      console.log(`Payment ${payment.id} failed`);

    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Handle pending payment
   */
  private async handlePendingPayment(webhookData: any, payment: any) {
    try {
      const { pf_payment_id } = webhookData;

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PROCESSING',
          payfastId: pf_payment_id,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
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

    } catch (error) {
      console.error('Error handling pending payment:', error);
      throw error;
    }
  }

  /**
   * Create payment notifications for users
   */
  private async createPaymentNotifications(payment: any, status: string) {
    try {
      const notifications = [];

      // Notify client
      notifications.push({
        userId: payment.clientId,
        title: `Payment ${status}`,
        message: `Your payment for "${payment.job?.title || 'job'}" has ${status}`,
        type: status === 'completed' ? 'PAYMENT_RECEIVED' : 'PAYMENT_FAILED',
        jobId: payment.jobId,
        actionUrl: `/payments/${payment.id}`
      });

      // Notify worker if payment completed
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

      // Create notifications in batch
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }

    } catch (error) {
      console.error('Error creating payment notifications:', error);
      // Don't throw here as this is not critical
    }
  }

  /**
   * Handle PayFast ITN (Instant Transaction Notification) validation
   * This is a legacy endpoint for older PayFast integrations
   */
  async validatePayFastITN(req: Request, res: Response) {
    try {
      // PayFast ITN validation logic
      // This is typically used for older integrations
      const validationData = {
        ...req.body,
        signature: req.body.signature || req.headers['signature']
      };

      const isValid = payfastService.validateWebhookSignature(validationData);

      if (isValid) {
        res.status(200).send('VALID');
      } else {
        res.status(401).send('INVALID');
      }

    } catch (error) {
      console.error('Error validating PayFast ITN:', error);
      res.status(500).send('ERROR');
    }
  }
}

export default new WebhookController();
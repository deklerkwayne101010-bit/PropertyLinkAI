import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { logSecurityEvent } from '../middleware/security';
import { config } from '../config';

export class GDPRController {
  // Right to Access - Data Export
  static async requestDataAccess(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { format = 'json', includeAIUsage = true, includeProperties = true } = req.query;

      // Check if user already has a pending export request
      const existingRequest = await prisma.dataExport.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        }
      });

      if (existingRequest) {
        res.status(429).json({
          error: 'Data export request already in progress',
          requestId: existingRequest.requestId,
          status: existingRequest.status
        });
        return;
      }

      // Create data export request
      const requestId = `export_${userId}_${Date.now()}`;
      const dataExport = await prisma.dataExport.create({
        data: {
          userId,
          requestId,
          format: format as string,
          includes: {
            includeAIUsage: includeAIUsage === 'true',
            includeProperties: includeProperties === 'true'
          }
        }
      });

      // Log GDPR access request
      await logSecurityEvent(userId, 'gdpr_data_access_requested', 'low', {
        requestId,
        format,
        includes: { includeAIUsage, includeProperties }
      }, req);

      // In a real implementation, you would queue this for background processing
      // For now, we'll simulate immediate processing
      setTimeout(() => {
        GDPRController.processDataExport(dataExport.id);
      }, 1000);

      res.json({
        message: 'Data export request submitted successfully',
        requestId,
        estimatedCompletion: '5-10 minutes'
      });
    } catch (error) {
      console.error('Data access request error:', error);
      res.status(500).json({ error: 'Failed to process data access request' });
    }
  };

  // Get data export status
  static async getDataExportStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { requestId } = req.params;

      const dataExport = await prisma.dataExport.findFirst({
        where: {
          userId,
          requestId
        }
      });

      if (!dataExport) {
        res.status(404).json({ error: 'Data export request not found' });
        return;
      }

      res.json({
        requestId: dataExport.requestId,
        status: dataExport.status,
        format: dataExport.format,
        requestedAt: dataExport.requestedAt,
        completedAt: dataExport.completedAt,
        fileUrl: dataExport.fileUrl,
        expiresAt: dataExport.expiresAt,
        errorMessage: dataExport.errorMessage
      });
    } catch (error) {
      console.error('Get data export status error:', error);
      res.status(500).json({ error: 'Failed to get export status' });
    }
  }

  // Right to Rectification - Update Personal Data
  static async updatePersonalData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, email } = req.body;

      // Validate input
      if (!name && !email) {
        res.status(400).json({ error: 'At least one field (name or email) must be provided' });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        if (existingUser && existingUser.id !== userId) {
          res.status(409).json({ error: 'Email address is already in use' });
          return;
        }
        updateData.email = email;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          updatedAt: true
        }
      });

      // Log GDPR rectification
      await logSecurityEvent(userId, 'gdpr_data_rectification', 'low', {
        updatedFields: Object.keys(updateData)
      }, req);

      res.json({
        message: 'Personal data updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update personal data error:', error);
      res.status(500).json({ error: 'Failed to update personal data' });
    }
  }

  // Right to Erasure - Account Deletion
  static async requestAccountDeletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { reason, confirmDeletion = false } = req.body;

      if (!confirmDeletion) {
        res.status(400).json({
          error: 'Account deletion must be explicitly confirmed',
          requiredField: 'confirmDeletion: true'
        });
        return;
      }

      // Check if deletion is already requested
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          accountDeletionRequested: true,
          accountDeletionRequestedAt: true
        }
      });

      if (user?.accountDeletionRequested) {
        res.status(409).json({
          error: 'Account deletion already requested',
          requestedAt: user.accountDeletionRequestedAt
        });
        return;
      }

      // Mark account for deletion (GDPR requires 30-day waiting period)
      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await prisma.user.update({
        where: { id: userId },
        data: {
          accountDeletionRequested: true,
          accountDeletionRequestedAt: new Date(),
          // In a real implementation, you might set a deletion date
          // dataRetentionOverride: true
        }
      });

      // Log GDPR erasure request
      await logSecurityEvent(userId, 'gdpr_account_deletion_requested', 'medium', {
        reason,
        scheduledDeletion: deletionDate.toISOString()
      }, req);

      // Send confirmation email
      // emailService.sendAccountDeletionConfirmation(user.email, deletionDate)...

      res.json({
        message: 'Account deletion request submitted successfully',
        deletionScheduledFor: deletionDate.toISOString(),
        note: 'Your account will be permanently deleted in 30 days. You can cancel this request at any time before then.'
      });
    } catch (error) {
      console.error('Account deletion request error:', error);
      res.status(500).json({ error: 'Failed to process account deletion request' });
    }
  };

  // Cancel account deletion
  static async cancelAccountDeletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      await prisma.user.update({
        where: { id: userId },
        data: {
          accountDeletionRequested: false,
          accountDeletionRequestedAt: null
        }
      });

      // Log GDPR erasure cancellation
      await logSecurityEvent(userId, 'gdpr_account_deletion_cancelled', 'low', {}, req);

      res.json({
        message: 'Account deletion request cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel account deletion error:', error);
      res.status(500).json({ error: 'Failed to cancel account deletion' });
    }
  };

  // Right to Data Portability - Export in Machine-Readable Format
  static async exportDataPortability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { format = 'json' } = req.query;

      // Get all user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          properties: true,
          aiUsage: {
            orderBy: { date: 'desc' },
            take: 1000 // Limit for performance
          },
          userConsent: true,
          dataProcessingLogs: {
            orderBy: { timestamp: 'desc' },
            take: 1000
          },
          auditLogs: {
            orderBy: { timestamp: 'desc' },
            take: 1000
          },
          consentLogs: {
            orderBy: { timestamp: 'desc' },
            take: 1000
          }
        }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Structure data for export
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          emailVerified: user.emailVerified,
          privacyPolicyAccepted: user.privacyPolicyAccepted,
          marketingConsent: user.marketingConsent,
          dataProcessingConsent: user.dataProcessingConsent
        },
        properties: user.properties,
        aiUsage: user.aiUsage,
        consentHistory: user.userConsent,
        dataProcessingLogs: user.dataProcessingLogs,
        auditLogs: user.auditLogs,
        consentLogs: user.consentLogs,
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          format: format,
          version: '1.0',
          gdprCompliant: true
        }
      };

      // Log GDPR portability
      await logSecurityEvent(userId, 'gdpr_data_portability_exported', 'low', {
        format,
        recordCount: {
          properties: user.properties.length,
          aiUsage: user.aiUsage.length,
          consents: user.userConsent.length
        }
      }, req);

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
        res.json(exportData);
      } else {
        // For other formats, you would implement conversion logic
        res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Data portability export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  };

  // Consent Management
  static async updateConsent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { consentType, granted, consentVersion = '1.0' } = req.body;

      if (!consentType || typeof granted !== 'boolean') {
        res.status(400).json({
          error: 'consentType and granted (boolean) are required'
        });
        return;
      }

      const validConsentTypes = [
        'privacy_policy',
        'marketing',
        'data_processing',
        'cookies_essential',
        'cookies_analytics',
        'cookies_marketing'
      ];

      if (!validConsentTypes.includes(consentType)) {
        res.status(400).json({
          error: 'Invalid consent type',
          validTypes: validConsentTypes
        });
        return;
      }

      // Update user consent
      const updateData: any = {};
      const consentField = `${consentType.replace('_', '')}Consent`;
      const consentAtField = `${consentField}At`;

      updateData[consentField] = granted;
      if (granted) {
        updateData[consentAtField] = new Date();
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Log consent change
      await prisma.consentLog.create({
        data: {
          userId,
          consentType,
          consented: granted,
          consentVersion,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      });

      // Log security event
      await logSecurityEvent(userId, 'gdpr_consent_updated', 'low', {
        consentType,
        granted,
        consentVersion
      }, req);

      res.json({
        message: `Consent for ${consentType} ${granted ? 'granted' : 'revoked'} successfully`,
        consentType,
        granted,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update consent error:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  };

  // Get user's consent status
  static async getConsentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: true,
          marketingConsent: true,
          marketingConsentAt: true,
          dataProcessingConsent: true,
          dataProcessingConsentAt: true
        }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        consents: {
          privacy_policy: {
            accepted: user.privacyPolicyAccepted,
            acceptedAt: user.privacyPolicyAcceptedAt
          },
          marketing: {
            consented: user.marketingConsent,
            consentedAt: user.marketingConsentAt
          },
          data_processing: {
            consented: user.dataProcessingConsent,
            consentedAt: user.dataProcessingConsentAt
          }
        }
      });
    } catch (error) {
      console.error('Get consent status error:', error);
      res.status(500).json({ error: 'Failed to get consent status' });
    }
  };

  // Process data export (background job simulation)
  private static async processDataExport(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await prisma.dataExport.update({
        where: { id: exportId },
        data: { status: 'processing' }
      });

      const dataExport = await prisma.dataExport.findUnique({
        where: { id: exportId },
        include: { user: true }
      });

      if (!dataExport) return;

      // Generate export data (simplified version)
      const exportData = {
        user: {
          id: dataExport.user.id,
          email: dataExport.user.email,
          name: dataExport.user.name,
          createdAt: dataExport.user.createdAt
        },
        exportMetadata: {
          requestedAt: dataExport.requestedAt,
          format: dataExport.format,
          gdprCompliant: true
        }
      };

      // In a real implementation, you would:
      // 1. Generate the actual file
      // 2. Upload to secure storage (S3, etc.)
      // 3. Set fileUrl and expiresAt
      // 4. Send notification email

      const fileUrl = `https://storage.example.com/exports/${dataExport.requestId}.${dataExport.format}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          fileUrl,
          expiresAt,
          completedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Process data export error:', error);
      await prisma.dataExport.update({
        where: { id: exportId },
        data: {
          status: 'failed',
          errorMessage: 'Failed to process export'
        }
      });
    }
  };
}

// Export individual functions for route binding
export const requestDataAccess = GDPRController.requestDataAccess;
export const getDataExportStatus = GDPRController.getDataExportStatus;
export const updatePersonalData = GDPRController.updatePersonalData;
export const requestAccountDeletion = GDPRController.requestAccountDeletion;
export const cancelAccountDeletion = GDPRController.cancelAccountDeletion;
export const exportDataPortability = GDPRController.exportDataPortability;
export const updateConsent = GDPRController.updateConsent;
export const getConsentStatus = GDPRController.getConsentStatus;
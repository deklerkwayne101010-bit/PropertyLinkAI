import { prisma } from '../config/database';
import { logSecurityEvent } from '../middleware/security';

export interface ConsentType {
  type: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
}

export class ConsentService {
  // Define available consent types
  static readonly CONSENT_TYPES: Record<string, ConsentType> = {
    privacy_policy: {
      type: 'privacy_policy',
      description: 'Acceptance of privacy policy and terms of service',
      required: true,
      defaultValue: false
    },
    marketing: {
      type: 'marketing',
      description: 'Receive marketing communications and promotional offers',
      required: false,
      defaultValue: false
    },
    data_processing: {
      type: 'data_processing',
      description: 'Processing of personal data for service provision',
      required: true,
      defaultValue: false
    },
    cookies_essential: {
      type: 'cookies_essential',
      description: 'Essential cookies required for website functionality',
      required: true,
      defaultValue: true
    },
    cookies_analytics: {
      type: 'cookies_analytics',
      description: 'Analytics cookies to improve website performance',
      required: false,
      defaultValue: false
    },
    cookies_marketing: {
      type: 'cookies_marketing',
      description: 'Marketing cookies for personalized advertising',
      required: false,
      defaultValue: false
    }
  };

  // Get user's current consent status
  static async getUserConsents(userId: string): Promise<Record<string, {
    granted: boolean;
    grantedAt?: Date;
    consentVersion?: string;
  }>> {
    try {
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
        throw new Error('User not found');
      }

      return {
        privacy_policy: {
          granted: user.privacyPolicyAccepted,
          grantedAt: user.privacyPolicyAcceptedAt || undefined
        },
        marketing: {
          granted: user.marketingConsent,
          grantedAt: user.marketingConsentAt || undefined
        },
        data_processing: {
          granted: user.dataProcessingConsent,
          grantedAt: user.dataProcessingConsentAt || undefined
        },
        cookies_essential: {
          granted: true, // Essential cookies are always granted
          grantedAt: user.privacyPolicyAcceptedAt || undefined
        },
        cookies_analytics: {
          granted: false, // Not implemented yet
          grantedAt: undefined
        },
        cookies_marketing: {
          granted: false, // Not implemented yet
          grantedAt: undefined
        }
      };
    } catch (error) {
      console.error('Error getting user consents:', error);
      throw error;
    }
  }

  // Update user consent
  static async updateConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    consentVersion: string = '1.0',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Validate consent type
      if (!this.CONSENT_TYPES[consentType]) {
        throw new Error(`Invalid consent type: ${consentType}`);
      }

      const consentConfig = this.CONSENT_TYPES[consentType];

      // Check if required consent is being revoked
      if (consentConfig.required && !granted) {
        throw new Error(`Consent for ${consentType} is required and cannot be revoked`);
      }

      // Update user record
      const updateData: any = {};
      const consentField = `${consentType.replace('_', '')}Consent`;
      const consentAtField = `${consentField}At`;

      updateData[consentField] = granted;
      if (granted) {
        updateData[consentAtField] = new Date();
      } else {
        updateData[consentAtField] = null;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Log consent change in audit trail
      await prisma.consentLog.create({
        data: {
          userId,
          consentType,
          consented: granted,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          consentVersion
        }
      });

      // Log security event
      await logSecurityEvent(userId, 'consent_updated', 'low', {
        consentType,
        granted,
        consentVersion
      }, { ip: ipAddress, headers: { 'user-agent': userAgent } } as any);

    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }

  // Bulk update consents
  static async updateConsents(
    userId: string,
    consents: Array<{ type: string; granted: boolean; version?: string }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const updates: any[] = [];
      const consentLogs: any[] = [];

      for (const consent of consents) {
        const consentConfig = this.CONSENT_TYPES[consent.type];
        if (!consentConfig) {
          throw new Error(`Invalid consent type: ${consent.type}`);
        }

        // Check required consents
        if (consentConfig.required && !consent.granted) {
          throw new Error(`Consent for ${consent.type} is required and cannot be revoked`);
        }

        const consentField = `${consent.type.replace('_', '')}Consent`;
        const consentAtField = `${consentField}At`;

        updates.push({
          [consentField]: consent.granted,
          [consentAtField]: consent.granted ? new Date() : null
        });

        consentLogs.push({
          userId,
          consentType: consent.type,
          consented: consent.granted,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          consentVersion: consent.version || '1.0'
        });
      }

      // Update user consents
      const updateData = Object.assign({}, ...updates);
      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Create consent logs
      await prisma.consentLog.createMany({
        data: consentLogs
      });

      // Log security event
      await logSecurityEvent(userId, 'bulk_consent_update', 'low', {
        consentCount: consents.length,
        consents: consents.map(c => ({ type: c.type, granted: c.granted }))
      }, { ip: ipAddress, headers: { 'user-agent': userAgent } } as any);

    } catch (error) {
      console.error('Error updating consents:', error);
      throw error;
    }
  }

  // Check if user has given consent for specific purpose
  static async hasConsent(userId: string, consentType: string): Promise<boolean> {
    try {
      const consents = await this.getUserConsents(userId);
      const consent = consents[consentType];

      return consent ? consent.granted : false;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false; // Fail closed for consent checks
    }
  }

  // Get consent history for user
  static async getConsentHistory(
    userId: string,
    consentType?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const where: any = { userId };
      if (consentType) {
        where.consentType = consentType;
      }

      const history = await prisma.consentLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          consentType: true,
          consented: true,
          timestamp: true,
          consentVersion: true,
          ipAddress: true
        }
      });

      return history;
    } catch (error) {
      console.error('Error getting consent history:', error);
      return [];
    }
  }

  // Initialize default consents for new user
  static async initializeUserConsents(userId: string): Promise<void> {
    try {
      // Set default consents (only essential ones)
      await this.updateConsents(userId, [
        { type: 'cookies_essential', granted: true, version: '1.0' }
      ]);
    } catch (error) {
      console.error('Error initializing user consents:', error);
    }
  }

  // Validate consent requirements for operations
  static async validateConsentForOperation(
    userId: string,
    operation: string
  ): Promise<{ allowed: boolean; missingConsents: string[] }> {
    try {
      const requiredConsents: Record<string, string[]> = {
        marketing_email: ['marketing'],
        data_processing: ['data_processing'],
        analytics_tracking: ['cookies_analytics'],
        personalized_ads: ['cookies_marketing', 'marketing']
      };

      const operationConsents = requiredConsents[operation];
      if (!operationConsents) {
        return { allowed: true, missingConsents: [] };
      }

      const userConsents = await this.getUserConsents(userId);
      const missingConsents: string[] = [];

      for (const consentType of operationConsents) {
        if (!userConsents[consentType]?.granted) {
          missingConsents.push(consentType);
        }
      }

      return {
        allowed: missingConsents.length === 0,
        missingConsents
      };
    } catch (error) {
      console.error('Error validating consent for operation:', error);
      return { allowed: false, missingConsents: ['unknown'] };
    }
  }

  // Get consent statistics (for admin purposes)
  static async getConsentStatistics(): Promise<{
    totalUsers: number;
    consentBreakdown: Record<string, { granted: number; revoked: number; percentage: number }>;
  }> {
    try {
      const totalUsers = await prisma.user.count();

      const consentStats: Record<string, { granted: number; revoked: number; percentage: number }> = {};

      for (const [consentType, config] of Object.entries(this.CONSENT_TYPES)) {
        const consentField = `${consentType.replace('_', '')}Consent`;

        const granted = await prisma.user.count({
          where: { [consentField]: true }
        });

        const revoked = totalUsers - granted;
        const percentage = totalUsers > 0 ? (granted / totalUsers) * 100 : 0;

        consentStats[consentType] = {
          granted,
          revoked,
          percentage: Math.round(percentage * 100) / 100
        };
      }

      return {
        totalUsers,
        consentBreakdown: consentStats
      };
    } catch (error) {
      console.error('Error getting consent statistics:', error);
      throw error;
    }
  }
}
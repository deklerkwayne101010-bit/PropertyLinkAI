import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

export interface MFAVerificationResult {
  verified: boolean;
  message: string;
}

export class MFAService {
  /**
   * Generate a new MFA secret and QR code for a user
   */
  static generateMFASecret(email: string): MFASetupData {
    const secret = speakeasy.generateSecret({
      name: `Real Estate AI (${email})`,
      issuer: 'Real Estate AI',
      length: 32,
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `Real Estate AI (${email})`,
      issuer: 'Real Estate AI',
      encoding: 'ascii',
    });

    return {
      secret: secret.ascii,
      qrCodeUrl: '', // Will be set after QR code generation
      otpauthUrl,
    };
  }

  /**
   * Generate QR code data URL from OTP auth URL
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify an MFA token against a secret
   */
  static verifyMFAToken(secret: string, token: string): MFAVerificationResult {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token,
      window: 2, // Allow 2 time windows (30 seconds each) for clock skew
    });

    return {
      verified,
      message: verified ? 'MFA token verified successfully' : 'Invalid MFA token',
    };
  }

  /**
   * Generate a backup recovery code
   */
  static generateRecoveryCode(): string {
    return speakeasy.generateSecret({ length: 16 }).ascii;
  }
}
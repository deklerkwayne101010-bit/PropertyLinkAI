import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';
import {
  requestDataAccess,
  getDataExportStatus,
  updatePersonalData,
  requestAccountDeletion,
  cancelAccountDeletion,
  exportDataPortability,
  updateConsent,
  getConsentStatus
} from '../controllers/gdpr';

const router = express.Router();

// Validation schemas
const updatePersonalDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional()
});

const updateConsentSchema = Joi.object({
  consentType: Joi.string().valid(
    'privacy_policy',
    'marketing',
    'data_processing',
    'cookies_essential',
    'cookies_analytics',
    'cookies_marketing'
  ).required(),
  granted: Joi.boolean().required(),
  consentVersion: Joi.string().optional()
});

const requestAccountDeletionSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
  confirmDeletion: Joi.boolean().valid(true).required()
});

// Data Subject Rights Routes

// Right to Access - Request data export
router.post('/access', authenticateToken, requestDataAccess);
router.get('/access/:requestId', authenticateToken, getDataExportStatus);

// Right to Rectification - Update personal data
router.put('/rectification', authenticateToken, validateBody(updatePersonalDataSchema), updatePersonalData);

// Right to Erasure - Account deletion
router.post('/erasure', authenticateToken, validateBody(requestAccountDeletionSchema), requestAccountDeletion);
router.delete('/erasure', authenticateToken, cancelAccountDeletion);

// Right to Data Portability - Export data in machine-readable format
router.get('/portability', authenticateToken, exportDataPortability);

// Consent Management Routes
router.post('/consent', authenticateToken, validateBody(updateConsentSchema), updateConsent);
router.get('/consent', authenticateToken, getConsentStatus);

// Legacy routes for backward compatibility
router.post('/data-access', authenticateToken, requestDataAccess);
router.delete('/data', authenticateToken, validateBody(requestAccountDeletionSchema), requestAccountDeletion);

export default router;
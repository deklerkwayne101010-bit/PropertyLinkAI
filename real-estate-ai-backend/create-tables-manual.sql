-- Create users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscriptionTier" TEXT DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN DEFAULT false,
    "mfaSecret" TEXT,
    "loginAttempts" INTEGER DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "socialProvider" TEXT,
    "socialId" TEXT,
    "privacyPolicyAccepted" BOOLEAN DEFAULT false,
    "privacyPolicyAcceptedAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "dataProcessingConsent" BOOLEAN DEFAULT false,
    "dataProcessingConsentAt" TIMESTAMP(3),
    "gdprDataRetentionOverride" BOOLEAN DEFAULT false,
    "accountDeletionRequested" BOOLEAN DEFAULT false,
    "accountDeletionRequestedAt" TIMESTAMP(3),
    "dataExportRequested" BOOLEAN DEFAULT false,
    "dataExportRequestedAt" TIMESTAMP(3),
    "dataExportUrl" TEXT
);

-- Create properties table
CREATE TABLE IF NOT EXISTS "Property" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "price" DECIMAL(65,30),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "size" DECIMAL(65,30),
    "propertyType" TEXT,
    "features" TEXT[],
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create property_descriptions table
CREATE TABLE IF NOT EXISTS "PropertyDescription" (
    "id" TEXT PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyDescription_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "User_passwordResetToken_idx" ON "User"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "Property_userId_idx" ON "Property"("userId");
CREATE INDEX IF NOT EXISTS "PropertyDescription_propertyId_idx" ON "PropertyDescription"("propertyId");
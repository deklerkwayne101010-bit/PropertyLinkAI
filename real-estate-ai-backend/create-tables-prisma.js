import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTablesWithPrisma() {
  try {
    console.log('Creating tables using Prisma...');

    // Create users table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "subscriptionTier" TEXT DEFAULT 'FREE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "emailVerified" BOOLEAN DEFAULT false,
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
      )
    `;
    console.log('✅ Users table created');

    // Create properties table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "properties" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "location" TEXT NOT NULL,
        "size" INTEGER,
        "bedrooms" INTEGER,
        "bathrooms" INTEGER,
        "price" DECIMAL(65,30),
        "features" JSONB,
        "propertyType" TEXT,
        "yearBuilt" INTEGER,
        "garage" INTEGER,
        "garden" BOOLEAN,
        "pool" BOOLEAN,
        "description" TEXT,
        "images" JSONB,
        "coordinates" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `;
    console.log('✅ Properties table created');

    // Create generated_content table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "generated_content" (
        "id" TEXT PRIMARY KEY,
        "propertyId" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "tone" TEXT NOT NULL,
        "length" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "wordCount" INTEGER,
        "tokensUsed" INTEGER,
        "cost" DECIMAL(65,30),
        "cacheKey" TEXT,
        "isCached" BOOLEAN DEFAULT false,
        "cacheExpiry" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `;
    console.log('✅ Generated content table created');

    // Create foreign key constraints
    try {
      await prisma.$executeRaw`
        ALTER TABLE "properties"
        ADD CONSTRAINT "properties_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log('✅ Properties foreign key constraint added');
    } catch (error) {
      console.log('⚠️ Properties foreign key constraint may already exist');
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "generated_content"
        ADD CONSTRAINT "generated_content_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log('✅ Generated content foreign key constraint added');
    } catch (error) {
      console.log('⚠️ Generated content foreign key constraint may already exist');
    }

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_emailVerificationToken_idx" ON "users"("emailVerificationToken")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON "users"("passwordResetToken")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_userId_idx" ON "properties"("userId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_location_idx" ON "properties"("location")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_propertyType_idx" ON "properties"("propertyType")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "properties_price_idx" ON "properties"("price")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "generated_content_propertyId_idx" ON "generated_content"("propertyId")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "generated_content_cacheKey_idx" ON "generated_content"("cacheKey")`;
    console.log('✅ Indexes created');

    console.log('🎉 All tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTablesWithPrisma();
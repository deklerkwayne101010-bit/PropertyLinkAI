import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Creating tables using Supabase client...');

    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table', {});
    if (usersError && !usersError.message.includes('already exists')) {
      console.log('Creating users table manually...');
      const { error } = await supabase.from('users').select('*').limit(1);
      if (error && error.message.includes('does not exist')) {
        console.log('Users table does not exist, need to create via SQL');
        console.log('Please run the following SQL in your Supabase dashboard:');
        console.log(`
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
);

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
);

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
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_emailVerificationToken_idx" ON "users"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "users_passwordResetToken_idx" ON "users"("passwordResetToken");
CREATE INDEX IF NOT EXISTS "properties_userId_idx" ON "properties"("userId");
CREATE INDEX IF NOT EXISTS "properties_location_idx" ON "properties"("location");
CREATE INDEX IF NOT EXISTS "properties_propertyType_idx" ON "properties"("propertyType");
CREATE INDEX IF NOT EXISTS "properties_price_idx" ON "properties"("price");
CREATE INDEX IF NOT EXISTS "generated_content_propertyId_idx" ON "generated_content"("propertyId");
CREATE INDEX IF NOT EXISTS "generated_content_cacheKey_idx" ON "generated_content"("cacheKey");

-- Add foreign key constraints
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        return;
      }
    }

    console.log('✅ Tables created successfully via Supabase client');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createTables();
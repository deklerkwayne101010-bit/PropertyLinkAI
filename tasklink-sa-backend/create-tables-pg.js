const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace('?sslmode=require', ''),
  ssl: false
});

async function createTables() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            "firstName" TEXT NOT NULL,
            "lastName" TEXT NOT NULL,
            "profileImage" TEXT,
            bio TEXT,
            location TEXT,
            coordinates JSONB,
            skills TEXT[],
            rating DECIMAL(3,2) DEFAULT 0,
            "reviewCount" INTEGER DEFAULT 0,
            "isVerified" BOOLEAN DEFAULT false,
            "verificationType" TEXT,
            "idNumber" TEXT,
            role TEXT DEFAULT 'CLIENT',
            "isWorker" BOOLEAN DEFAULT false,
            "isClient" BOOLEAN DEFAULT true,
            "isSuspended" BOOLEAN DEFAULT false,
            "suspensionReason" TEXT,
            "suspendedAt" TIMESTAMP,
            "suspendedBy" TEXT,
            "lastLoginAt" TIMESTAMP,
            "loginAttempts" INTEGER DEFAULT 0,
            "lockedAt" TIMESTAMP,
            "completedJobs" INTEGER DEFAULT 0,
            "totalEarned" DECIMAL(10,2) DEFAULT 0,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'jobs',
        sql: `
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT,
            location TEXT NOT NULL,
            coordinates JSONB,
            budget DECIMAL(10,2) NOT NULL,
            "budgetType" TEXT DEFAULT 'fixed',
            "estimatedHours" INTEGER,
            status TEXT DEFAULT 'DRAFT',
            priority TEXT DEFAULT 'MEDIUM',
            "completedAt" TIMESTAMP,
            "expiresAt" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            requirements TEXT[],
            "preferredSkills" TEXT[],
            "equipmentNeeded" TEXT[],
            "ageRequirement" TEXT,
            "genderPref" TEXT,
            images TEXT[],
            "posterId" TEXT NOT NULL,
            "workerId" TEXT
          );
        `
      },
      {
        name: 'applications',
        sql: `
          CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            message TEXT,
            "proposedRate" DECIMAL(10,2),
            status TEXT DEFAULT 'PENDING',
            "appliedAt" TIMESTAMP DEFAULT NOW(),
            "respondedAt" TIMESTAMP,
            "jobId" TEXT NOT NULL,
            "applicantId" TEXT NOT NULL
          );
        `
      },
      {
        name: 'payments',
        sql: `
          CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            amount DECIMAL(10,2) NOT NULL,
            currency TEXT DEFAULT 'ZAR',
            status TEXT DEFAULT 'PENDING',
            "paymentMethod" TEXT,
            "paymentIntentId" TEXT,
            "payfastId" TEXT,
            description TEXT,
            fee DECIMAL(10,2) DEFAULT 0,
            "netAmount" DECIMAL(10,2) NOT NULL,
            "paidAt" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "jobId" TEXT,
            "clientId" TEXT NOT NULL,
            "workerId" TEXT NOT NULL
          );
        `
      },
      {
        name: 'reviews',
        sql: `
          CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            rating INTEGER NOT NULL,
            comment TEXT,
            "isPublic" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "jobId" TEXT NOT NULL,
            "reviewerId" TEXT NOT NULL,
            "revieweeId" TEXT NOT NULL
          );
        `
      },
      {
        name: 'messages',
        sql: `
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            content TEXT NOT NULL,
            "messageType" TEXT DEFAULT 'TEXT',
            "isRead" BOOLEAN DEFAULT false,
            "readAt" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "senderId" TEXT NOT NULL,
            "receiverId" TEXT NOT NULL,
            "jobId" TEXT
          );
        `
      },
      {
        name: 'notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            "isRead" BOOLEAN DEFAULT false,
            "readAt" TIMESTAMP,
            "actionUrl" TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "userId" TEXT NOT NULL,
            "jobId" TEXT
          );
        `
      },
      {
        name: 'audit_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            action TEXT NOT NULL,
            "entityType" TEXT NOT NULL,
            "entityId" TEXT NOT NULL,
            "oldValues" JSONB,
            "newValues" JSONB,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "userId" TEXT
          );
        `
      },
      {
        name: 'email_verification_tokens',
        sql: `
          CREATE TABLE IF NOT EXISTS email_verification_tokens (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "expiresAt" TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'password_reset_tokens',
        sql: `
          CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            token TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "expiresAt" TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT false,
            "createdAt" TIMESTAMP DEFAULT NOW()
          );
        `
      },
      {
        name: 'disputes',
        sql: `
          CREATE TABLE IF NOT EXISTS disputes (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'OPEN',
            priority TEXT DEFAULT 'MEDIUM',
            category TEXT NOT NULL,
            resolution TEXT,
            "resolvedAt" TIMESTAMP,
            "closedAt" TIMESTAMP,
            evidence JSONB,
            "adminNotes" TEXT,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            "updatedAt" TIMESTAMP DEFAULT NOW(),
            "reporterId" TEXT NOT NULL,
            "reportedUserId" TEXT,
            "jobId" TEXT,
            "assignedAdminId" TEXT
          );
        `
      }
    ];

    console.log('Creating tables...');
    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        await client.query(table.sql);
        console.log(`✓ ${table.name} created successfully`);
      } catch (error) {
        console.log(`✗ Failed to create ${table.name}:`, error.message);
      }
    }

    console.log('All tables created successfully!');

  } catch (error) {
    console.error('Database operation failed:', error.message);
  } finally {
    await client.end();
  }
}

createTables();
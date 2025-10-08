-- TaskLink SA Database Schema
-- Create all tables for the TaskLink SA application

-- Users table
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

-- Jobs table
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

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message TEXT,
    "proposedRate" DECIMAL(10,2),
    status TEXT DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP DEFAULT NOW(),
    "respondedAt" TIMESTAMP,
    "jobId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    UNIQUE("jobId", "applicantId")
);

-- Payments table
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

-- Reviews table
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

-- Messages table
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

-- Notifications table
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

-- Audit logs table
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

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Disputes table
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

-- Add foreign key constraints
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_poster FOREIGN KEY ("posterId") REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_worker FOREIGN KEY ("workerId") REFERENCES users(id);

ALTER TABLE applications ADD CONSTRAINT fk_applications_job FOREIGN KEY ("jobId") REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE applications ADD CONSTRAINT fk_applications_applicant FOREIGN KEY ("applicantId") REFERENCES users(id);

ALTER TABLE payments ADD CONSTRAINT fk_payments_job FOREIGN KEY ("jobId") REFERENCES jobs(id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_client FOREIGN KEY ("clientId") REFERENCES users(id);
ALTER TABLE payments ADD CONSTRAINT fk_payments_worker FOREIGN KEY ("workerId") REFERENCES users(id);

ALTER TABLE reviews ADD CONSTRAINT fk_reviews_job FOREIGN KEY ("jobId") REFERENCES jobs(id);
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_reviewer FOREIGN KEY ("reviewerId") REFERENCES users(id);
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_reviewee FOREIGN KEY ("revieweeId") REFERENCES users(id);

ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY ("senderId") REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver FOREIGN KEY ("receiverId") REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT fk_messages_job FOREIGN KEY ("jobId") REFERENCES jobs(id);

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES users(id);
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_job FOREIGN KEY ("jobId") REFERENCES jobs(id);

ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY ("userId") REFERENCES users(id);

ALTER TABLE email_verification_tokens ADD CONSTRAINT fk_email_tokens_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_tokens_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE disputes ADD CONSTRAINT fk_disputes_reporter FOREIGN KEY ("reporterId") REFERENCES users(id);
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_reported_user FOREIGN KEY ("reportedUserId") REFERENCES users(id);
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_job FOREIGN KEY ("jobId") REFERENCES jobs(id);
ALTER TABLE disputes ADD CONSTRAINT fk_disputes_assigned_admin FOREIGN KEY ("assignedAdminId") REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_jobs_poster ON jobs("posterId");
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs("workerId");
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications("jobId");
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications("applicantId");
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments("clientId");
CREATE INDEX IF NOT EXISTS idx_payments_worker ON payments("workerId");
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages("receiverId");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");
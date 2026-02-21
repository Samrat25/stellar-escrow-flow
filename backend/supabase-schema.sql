-- Create tables for Stellar Escrow Platform
-- Generated from Prisma schema

-- User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "walletAddress" TEXT UNIQUE NOT NULL,
  "role" TEXT DEFAULT 'BOTH',
  "displayName" TEXT,
  "email" TEXT,
  "reputation" DOUBLE PRECISION DEFAULT 5.0,
  "totalTransacted" DOUBLE PRECISION DEFAULT 0,
  "completedEscrows" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Escrow table
CREATE TABLE IF NOT EXISTS "Escrow" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contractId" TEXT UNIQUE NOT NULL,
  "escrowIdOnChain" TEXT UNIQUE,
  "clientWallet" TEXT NOT NULL,
  "freelancerWallet" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" TEXT DEFAULT 'CREATED',
  "reviewWindowDays" INTEGER DEFAULT 3,
  "deadline" TIMESTAMP NOT NULL,
  "creationTxHash" TEXT,
  "depositTxHash" TEXT,
  "autoReleaseTxHash" TEXT,
  "fundedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("clientWallet") REFERENCES "User"("walletAddress"),
  FOREIGN KEY ("freelancerWallet") REFERENCES "User"("walletAddress")
);

-- Milestone table
CREATE TABLE IF NOT EXISTS "Milestone" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrowId" UUID NOT NULL,
  "milestoneIndex" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "proofUrl" TEXT,
  "submittedAt" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "rejectedAt" TIMESTAMP,
  "reviewDeadline" TIMESTAMP,
  "autoApproved" BOOLEAN DEFAULT FALSE,
  "submissionTxHash" TEXT,
  "approvalTxHash" TEXT,
  "rejectionTxHash" TEXT,
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE,
  UNIQUE ("escrowId", "milestoneIndex")
);

-- TransactionLog table
CREATE TABLE IF NOT EXISTS "TransactionLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrowId" UUID,
  "milestoneId" UUID,
  "txHash" TEXT UNIQUE NOT NULL,
  "txType" TEXT NOT NULL,
  "walletAddress" TEXT NOT NULL,
  "amount" DOUBLE PRECISION,
  "metadata" TEXT,
  "status" TEXT DEFAULT 'SUCCESS',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE,
  FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE,
  FOREIGN KEY ("walletAddress") REFERENCES "User"("walletAddress")
);

-- Feedback table
CREATE TABLE IF NOT EXISTS "Feedback" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrowId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "category" TEXT DEFAULT 'GENERAL',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- AgentLog table
CREATE TABLE IF NOT EXISTS "AgentLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "escrowId" UUID,
  "agentType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "txHash" TEXT,
  "errorMessage" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("escrowId") REFERENCES "Escrow"("id") ON DELETE CASCADE
);

-- IterationPlan table
CREATE TABLE IF NOT EXISTS "IterationPlan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" TEXT DEFAULT 'MEDIUM',
  "feedbackCount" INTEGER DEFAULT 0,
  "suggestions" TEXT[],
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_escrow_client" ON "Escrow"("clientWallet");
CREATE INDEX IF NOT EXISTS "idx_escrow_freelancer" ON "Escrow"("freelancerWallet");
CREATE INDEX IF NOT EXISTS "idx_escrow_status" ON "Escrow"("status");
CREATE INDEX IF NOT EXISTS "idx_milestone_escrow" ON "Milestone"("escrowId");
CREATE INDEX IF NOT EXISTS "idx_milestone_status" ON "Milestone"("status");
CREATE INDEX IF NOT EXISTS "idx_transaction_escrow" ON "TransactionLog"("escrowId");
CREATE INDEX IF NOT EXISTS "idx_transaction_wallet" ON "TransactionLog"("walletAddress");
CREATE INDEX IF NOT EXISTS "idx_feedback_escrow" ON "Feedback"("escrowId");
CREATE INDEX IF NOT EXISTS "idx_agentlog_escrow" ON "AgentLog"("escrowId");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON "Escrow"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestone_updated_at BEFORE UPDATE ON "Milestone"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON "Feedback"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agentlog_updated_at BEFORE UPDATE ON "AgentLog"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iterationplan_updated_at BEFORE UPDATE ON "IterationPlan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

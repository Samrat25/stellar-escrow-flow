-- Add transaction hash fields to Milestone table for tracking blockchain transactions

ALTER TABLE "Milestone" 
ADD COLUMN IF NOT EXISTS "creationTxHash" TEXT,
ADD COLUMN IF NOT EXISTS "fundingTxHash" TEXT,
ADD COLUMN IF NOT EXISTS "refundTxHash" TEXT;

-- Add index for transaction hash lookups
CREATE INDEX IF NOT EXISTS "idx_milestone_creation_tx" ON "Milestone"("creationTxHash");
CREATE INDEX IF NOT EXISTS "idx_milestone_funding_tx" ON "Milestone"("fundingTxHash");
CREATE INDEX IF NOT EXISTS "idx_milestone_refund_tx" ON "Milestone"("refundTxHash");

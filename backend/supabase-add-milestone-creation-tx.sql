-- Add creationTxHash and fundingTxHash columns to Milestone table
ALTER TABLE "Milestone" 
ADD COLUMN IF NOT EXISTS "creationTxHash" TEXT,
ADD COLUMN IF NOT EXISTS "fundingTxHash" TEXT;

-- Add index for transaction hash lookups
CREATE INDEX IF NOT EXISTS "idx_milestone_creation_tx" ON "Milestone"("creationTxHash");
CREATE INDEX IF NOT EXISTS "idx_milestone_funding_tx" ON "Milestone"("fundingTxHash");

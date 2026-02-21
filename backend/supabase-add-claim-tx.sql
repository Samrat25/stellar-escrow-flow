-- Add claimTxHash column to Milestone table
ALTER TABLE "Milestone" 
ADD COLUMN IF NOT EXISTS "claimTxHash" TEXT;

-- Add index for claim transaction hash lookups
CREATE INDEX IF NOT EXISTS "idx_milestone_claim_tx" ON "Milestone"("claimTxHash");

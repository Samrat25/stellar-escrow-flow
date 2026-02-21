-- Fix: Make contractId non-unique since we're using one contract for all escrows
-- The escrowIdOnChain will be the unique identifier

ALTER TABLE "Escrow" DROP CONSTRAINT IF EXISTS "Escrow_contractId_key";

-- Add index for performance but not unique
CREATE INDEX IF NOT EXISTS "idx_escrow_contractid" ON "Escrow"("contractId");

-- Ensure escrowIdOnChain is unique
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_escrowIdOnChain_unique" UNIQUE ("escrowIdOnChain");

-- Add new fields for crowdfunding-style workflow
-- Run this in Supabase SQL Editor

-- Add deliveredAt and dispute fields to Escrow table
ALTER TABLE "Escrow" 
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "disputedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "disputeReason" TEXT;

-- Update status enum to include new states
-- Note: PostgreSQL doesn't have enum constraints by default in this schema
-- Status values: CREATED, FUNDED, DELIVERED, COMPLETED, DISPUTED

-- Add comment for documentation
COMMENT ON COLUMN "Escrow"."status" IS 'Escrow status: CREATED (initial), FUNDED (buyer deposited), DELIVERED (seller completed), COMPLETED (funds released), DISPUTED (issue raised)';
COMMENT ON COLUMN "Escrow"."deliveredAt" IS 'Timestamp when seller marked work as delivered';
COMMENT ON COLUMN "Escrow"."disputedAt" IS 'Timestamp when buyer raised a dispute';
COMMENT ON COLUMN "Escrow"."disputeReason" IS 'Reason provided by buyer for dispute';

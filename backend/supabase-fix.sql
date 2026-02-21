-- Fix the escrowIdOnChain constraint to make it optional
ALTER TABLE "Escrow" ALTER COLUMN "escrowIdOnChain" DROP NOT NULL;

-- Also make deadline optional initially (will be set when escrow is created)
ALTER TABLE "Escrow" ALTER COLUMN "deadline" DROP NOT NULL;

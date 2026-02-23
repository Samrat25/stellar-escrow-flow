-- Migration: Remove role column and make users role-agnostic
-- Users can act as both client and freelancer based on their activity

-- Step 1: Remove role column from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- Step 2: Ensure we have the necessary columns for role-agnostic architecture
-- User table should only have: walletAddress, username, createdAt
-- Keep bio, avatarUrl for profile customization
-- Keep reputation, totalTransacted, completedEscrows for backward compatibility

-- Step 3: Add indexes for efficient querying of user activity
CREATE INDEX IF NOT EXISTS "idx_escrow_client_address" ON "Escrow"("clientWallet");
CREATE INDEX IF NOT EXISTS "idx_escrow_freelancer_address" ON "Escrow"("freelancerWallet");
CREATE INDEX IF NOT EXISTS "idx_milestone_status_approved" ON "Milestone"("status") WHERE "status" = 'APPROVED';

-- Step 4: Create a view for active users with computed role metrics (optional, for performance)
CREATE OR REPLACE VIEW "ActiveUsersView" AS
SELECT 
  u."walletAddress",
  u."username",
  u."createdAt",
  u."bio",
  u."avatarUrl",
  
  -- Client activity
  COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" THEN e."id" END) as times_as_client,
  
  -- Freelancer activity
  COUNT(DISTINCT CASE WHEN e."freelancerWallet" = u."walletAddress" THEN e."id" END) as times_as_freelancer,
  
  -- Total milestones
  COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress" THEN m."id" END) as total_milestones,
  
  -- Completed milestones (APPROVED status)
  COUNT(DISTINCT CASE WHEN (e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress") AND m."status" = 'APPROVED' THEN m."id" END) as completed_milestones,
  
  -- Total earned (as freelancer)
  COALESCE(SUM(CASE WHEN e."freelancerWallet" = u."walletAddress" AND m."status" = 'APPROVED' THEN m."amount" END), 0) as total_earned,
  
  -- Total spent (as client)
  COALESCE(SUM(CASE WHEN e."clientWallet" = u."walletAddress" AND m."status" = 'APPROVED' THEN m."amount" END), 0) as total_spent,
  
  -- Average rating
  COALESCE(AVG(f."rating"), 0) as average_rating,
  
  -- Feedback count
  COUNT(DISTINCT f."id") as feedback_count

FROM "User" u
LEFT JOIN "Escrow" e ON (e."clientWallet" = u."walletAddress" OR e."freelancerWallet" = u."walletAddress")
LEFT JOIN "Milestone" m ON m."escrowId" = e."id"
LEFT JOIN "Feedback" f ON f."reviewedWallet" = u."walletAddress"

GROUP BY u."walletAddress", u."username", u."createdAt", u."bio", u."avatarUrl"

HAVING 
  COUNT(DISTINCT CASE WHEN e."clientWallet" = u."walletAddress" THEN e."id" END) > 0
  OR COUNT(DISTINCT CASE WHEN e."freelancerWallet" = u."walletAddress" THEN e."id" END) > 0
  OR COUNT(DISTINCT f."id") > 0;

-- Verification query to check active users
-- SELECT * FROM "ActiveUsersView" ORDER BY total_milestones DESC;

-- Clean up any duplicate or test data
-- Run this in Supabase SQL Editor to start fresh

-- Delete all data (keeps table structure)
DELETE FROM "TransactionLog";
DELETE FROM "Feedback";
DELETE FROM "AgentLog";
DELETE FROM "Milestone";
DELETE FROM "Escrow";
DELETE FROM "User";
DELETE FROM "IterationPlan";

-- Reset sequences if needed
-- (PostgreSQL will handle UUID generation automatically)

-- Verify tables are empty
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Escrow', COUNT(*) FROM "Escrow"
UNION ALL
SELECT 'Milestone', COUNT(*) FROM "Milestone"
UNION ALL
SELECT 'TransactionLog', COUNT(*) FROM "TransactionLog"
UNION ALL
SELECT 'Feedback', COUNT(*) FROM "Feedback"
UNION ALL
SELECT 'AgentLog', COUNT(*) FROM "AgentLog"
UNION ALL
SELECT 'IterationPlan', COUNT(*) FROM "IterationPlan";

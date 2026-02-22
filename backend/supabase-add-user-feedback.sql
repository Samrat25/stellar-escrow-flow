-- Add User Profile and Feedback System
-- Run this in Supabase SQL Editor

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  role TEXT DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'FREELANCER')),
  bio TEXT,
  avatar_url TEXT,
  reputation DECIMAL(3,2) DEFAULT 5.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id TEXT NOT NULL,
  reviewer_wallet TEXT NOT NULL,
  reviewed_wallet TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  role_type TEXT NOT NULL CHECK (role_type IN ('CLIENT_REVIEW', 'FREELANCER_REVIEW')),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_feedback_milestone ON feedback(milestone_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewer ON feedback(reviewer_wallet);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed ON feedback(reviewed_wallet);
CREATE INDEX IF NOT EXISTS idx_feedback_role_type ON feedback(role_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- Add unique constraint to prevent duplicate reviews per milestone per role
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_review 
ON feedback(milestone_id, role_type);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (allow all for now, adjust as needed)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Create policies for feedback table
CREATE POLICY "Feedback is viewable by everyone" ON feedback
  FOR SELECT USING (true);

CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Update existing milestones table to ensure compatibility
ALTER TABLE milestones 
  ADD COLUMN IF NOT EXISTS creation_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS funding_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS approval_tx_hash TEXT;

-- Success message
SELECT 'User Profile and Feedback System tables created successfully!' as message;

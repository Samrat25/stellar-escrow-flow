-- TrustPay Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('client', 'freelancer', 'both')),
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escrows table
CREATE TABLE escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id TEXT UNIQUE NOT NULL,
  client_wallet TEXT NOT NULL,
  freelancer_wallet TEXT NOT NULL,
  total_amount NUMERIC(20, 7) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED', 'FUNDED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  review_window_days INTEGER NOT NULL DEFAULT 3,
  creation_tx_hash TEXT,
  deposit_tx_hash TEXT,
  funded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_wallets CHECK (client_wallet != freelancer_wallet)
);

-- Milestones table
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  milestone_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(20, 7) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  proof_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  review_deadline TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN DEFAULT FALSE,
  submission_tx_hash TEXT,
  approval_tx_hash TEXT,
  rejection_tx_hash TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(escrow_id, milestone_index)
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction logs table (for audit trail)
CREATE TABLE transaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('CREATE', 'DEPOSIT', 'SUBMIT', 'APPROVE', 'REJECT', 'AUTO_APPROVE')),
  wallet_address TEXT NOT NULL,
  amount NUMERIC(20, 7),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_escrows_client ON escrows(client_wallet);
CREATE INDEX idx_escrows_freelancer ON escrows(freelancer_wallet);
CREATE INDEX idx_escrows_status ON escrows(status);
CREATE INDEX idx_milestones_escrow ON milestones(escrow_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_review_deadline ON milestones(review_deadline) WHERE status = 'SUBMITTED';
CREATE INDEX idx_feedback_wallet ON feedback(wallet_address);
CREATE INDEX idx_transaction_logs_escrow ON transaction_logs(escrow_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, only service role can write
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Escrows: Viewable by client and freelancer
CREATE POLICY "Escrows viewable by participants" ON escrows
  FOR SELECT USING (
    client_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR freelancer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
  );

CREATE POLICY "Service role can manage escrows" ON escrows
  FOR ALL USING (true);

-- Milestones: Viewable by escrow participants
CREATE POLICY "Milestones viewable by escrow participants" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM escrows
      WHERE escrows.id = milestones.escrow_id
      AND (
        escrows.client_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        OR escrows.freelancer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      )
    )
  );

CREATE POLICY "Service role can manage milestones" ON milestones
  FOR ALL USING (true);

-- Feedback: Anyone can read, authenticated users can write
CREATE POLICY "Feedback viewable by everyone" ON feedback
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

-- Transaction logs: Viewable by escrow participants
CREATE POLICY "Transaction logs viewable by participants" ON transaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM escrows
      WHERE escrows.id = transaction_logs.escrow_id
      AND (
        escrows.client_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        OR escrows.freelancer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address'
      )
    )
  );

CREATE POLICY "Service role can manage transaction logs" ON transaction_logs
  FOR ALL USING (true);

-- Functions

-- Function to get escrow statistics
CREATE OR REPLACE FUNCTION get_escrow_stats()
RETURNS TABLE (
  total_escrows BIGINT,
  total_value NUMERIC,
  completed_escrows BIGINT,
  active_escrows BIGINT,
  total_milestones BIGINT,
  approved_milestones BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT e.id)::BIGINT,
    COALESCE(SUM(e.total_amount), 0),
    COUNT(DISTINCT CASE WHEN e.status = 'COMPLETED' THEN e.id END)::BIGINT,
    COUNT(DISTINCT CASE WHEN e.status IN ('FUNDED', 'ACTIVE') THEN e.id END)::BIGINT,
    COUNT(m.id)::BIGINT,
    COUNT(CASE WHEN m.status = 'APPROVED' THEN m.id END)::BIGINT
  FROM escrows e
  LEFT JOIN milestones m ON e.id = m.escrow_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if milestone can be submitted
CREATE OR REPLACE FUNCTION can_submit_milestone(p_milestone_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_milestone_index INTEGER;
  v_escrow_id UUID;
  v_prev_status TEXT;
BEGIN
  SELECT milestone_index, escrow_id
  INTO v_milestone_index, v_escrow_id
  FROM milestones
  WHERE id = p_milestone_id;

  IF v_milestone_index = 0 THEN
    RETURN TRUE;
  END IF;

  SELECT status INTO v_prev_status
  FROM milestones
  WHERE escrow_id = v_escrow_id
  AND milestone_index = v_milestone_index - 1;

  RETURN v_prev_status = 'APPROVED';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update escrow status when funded
CREATE OR REPLACE FUNCTION update_escrow_status_on_fund()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'FUNDED' AND OLD.status = 'CREATED' THEN
    NEW.status := 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escrow_funded_trigger
  BEFORE UPDATE ON escrows
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_status_on_fund();

-- Insert sample data for testing (optional)
-- Uncomment to populate with test data

/*
INSERT INTO users (wallet_address, role) VALUES
  ('GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9', 'client'),
  ('GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DSTL', 'freelancer'),
  ('GA7YNBW5CBTJZ3ZZOWX3ZNBKD6OE7A7IHUQVWMY62W2ZBG2SGZVOOPV', 'both');
*/

COMMENT ON TABLE users IS 'Registered users with their wallet addresses';
COMMENT ON TABLE escrows IS 'Escrow agreements between clients and freelancers';
COMMENT ON TABLE milestones IS 'Individual milestones within escrows';
COMMENT ON TABLE feedback IS 'User feedback for platform improvement';
COMMENT ON TABLE transaction_logs IS 'Audit trail of all blockchain transactions';

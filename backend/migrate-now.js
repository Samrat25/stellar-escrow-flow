import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Running migration to add creationTxHash and fundingTxHash columns...\n');
  
  try {
    // Try to query the Milestone table to check current schema
    const { data: testData, error: testError } = await supabase
      .from('Milestone')
      .select('id, creationTxHash')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Columns already exist! Migration not needed.');
      process.exit(0);
    }
    
    console.log('⚠️  Columns do not exist. You need to run this SQL in Supabase SQL Editor:\n');
    console.log('━'.repeat(80));
    console.log(`
-- Add creationTxHash and fundingTxHash columns to Milestone table
ALTER TABLE "Milestone" 
ADD COLUMN IF NOT EXISTS "creationTxHash" TEXT,
ADD COLUMN IF NOT EXISTS "fundingTxHash" TEXT;

-- Add index for transaction hash lookups
CREATE INDEX IF NOT EXISTS "idx_milestone_creation_tx" ON "Milestone"("creationTxHash");
CREATE INDEX IF NOT EXISTS "idx_milestone_funding_tx" ON "Milestone"("fundingTxHash");
    `);
    console.log('━'.repeat(80));
    console.log('\n📋 Steps to run migration:');
    console.log('1. Go to: https://app.supabase.com/project/brmedgytvmkonlnsztvv/sql/new');
    console.log('2. Copy and paste the SQL above');
    console.log('3. Click "Run" button');
    console.log('4. Restart your backend server\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

migrate();

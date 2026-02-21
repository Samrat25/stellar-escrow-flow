import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
  console.log(fs.readFileSync('supabase-add-milestone-creation-tx.sql', 'utf8'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running migration...');
  
  const sql = fs.readFileSync('supabase-add-milestone-creation-tx.sql', 'utf8');
  
  console.log('\n📋 SQL to execute:');
  console.log(sql);
  console.log('\n⚠️  Please run this SQL manually in your Supabase SQL Editor:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the SQL above');
  console.log('5. Click "Run"');
}

runMigration();

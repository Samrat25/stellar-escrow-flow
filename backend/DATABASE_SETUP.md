# Database Setup Guide

## Quick Setup

### Option 1: Fresh Installation (Recommended)

If you're setting up the database for the first time:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase-schema.sql`
6. Paste into the SQL Editor
7. Click "Run" (or press Ctrl+Enter)

That's it! All tables, indexes, and triggers will be created.

### Option 2: Verify Existing Database

If you've already run migrations, verify everything is correct:

```sql
-- Check all tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Should return:
-- AgentLog
-- Escrow
-- Feedback
-- IterationPlan
-- Milestone
-- TransactionLog
-- User

-- Verify User table has NO 'role' column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'User';

-- Should NOT include 'role' in the list

-- Verify Milestone table has IPFS fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Milestone' 
AND column_name LIKE 'submission%';

-- Should return:
-- submissionCid
-- submissionFilename
-- submissionSize
-- submissionTxHash
-- submissionUrl
```

## Schema Overview

### Tables

1. **User** - User profiles (role-agnostic)
   - No static role column
   - Roles computed dynamically based on activity

2. **Escrow** - Escrow contracts between clients and freelancers
   - Tracks smart contract IDs
   - Links to blockchain transactions

3. **Milestone** - Individual milestones within escrows
   - Includes IPFS fields for work submissions
   - Tracks all transaction hashes

4. **Feedback** - Dual review system
   - Both client and freelancer can review each other
   - One review per role per milestone

5. **TransactionLog** - Blockchain transaction history
   - Tracks all on-chain transactions
   - Links to escrows and milestones

6. **AgentLog** - Automated agent actions
   - Auto-approval tracking
   - Event synchronization logs

7. **IterationPlan** - User feedback and feature requests
   - Tracks improvement suggestions
   - Priority management

### Key Features

✅ **Role-Agnostic Architecture**
- Users can be both clients and freelancers
- Roles computed dynamically from milestone activity
- No static role column in User table

✅ **IPFS Integration**
- `submissionCid` - IPFS Content Identifier
- `submissionUrl` - Gateway URL to access content
- `submissionFilename` - Original filename
- `submissionSize` - File size in bytes

✅ **Smart Contract Tracking**
- All transaction hashes stored
- Links to Stellar Explorer
- Supports both real and mock transactions

✅ **Dual Review System**
- Clients review freelancers
- Freelancers review clients
- 5-star rating system
- Public feedback display

## Troubleshooting

### Error: "relation already exists"
This is normal if tables already exist. The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Error: "column already exists"
This means your database is already up to date. No action needed.

### Missing IPFS Fields
If IPFS fields are missing from Milestone table, run:

```sql
ALTER TABLE "Milestone"
ADD COLUMN IF NOT EXISTS "submissionCid" TEXT,
ADD COLUMN IF NOT EXISTS "submissionUrl" TEXT,
ADD COLUMN IF NOT EXISTS "submissionFilename" TEXT,
ADD COLUMN IF NOT EXISTS "submissionSize" INTEGER;
```

### User Table Still Has 'role' Column
If the role column still exists, remove it:

```sql
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
```

## Environment Variables

Make sure your backend `.env` file has:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Connection Test

Test your database connection:

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "PostgreSQL"
}
```

## Support

If you encounter issues:
1. Check Supabase dashboard for error messages
2. Verify environment variables are correct
3. Ensure service role key (not anon key) is used
4. Check backend logs for connection errors

## Schema File

- **Location**: `backend/supabase-schema.sql`
- **Status**: Complete and up-to-date
- **Last Updated**: February 24, 2026
- **Migrations**: All consolidated into single file

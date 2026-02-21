# Supabase Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Access Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project: `brmedgytvmkonlnsztvv`
3. Click on **SQL Editor** in the left sidebar (icon looks like `</>`)

### Step 2: Run the Schema
1. Click **"+ New query"** button
2. Copy the entire contents of `backend/supabase-schema.sql`
3. Paste it into the SQL editor
4. Click **"Run"** button (or press Ctrl+Enter)

### Step 3: Verify Tables Created
1. Click on **"Table Editor"** in the left sidebar
2. You should see these tables:
   - User
   - Escrow
   - Milestone
   - TransactionLog
   - Feedback
   - AgentLog
   - IterationPlan

### Step 4: Restart Backend
```bash
# The backend will automatically detect the tables
# Just refresh the page or restart the backend server
```

---

## What the Schema Creates

### Tables:
- **User**: Stores wallet addresses and user profiles
- **Escrow**: Main escrow agreements
- **Milestone**: Individual milestones within escrows
- **TransactionLog**: All blockchain transactions
- **Feedback**: User ratings and reviews
- **AgentLog**: Automated agent actions
- **IterationPlan**: Feature planning and feedback

### Features:
- ✅ UUID primary keys
- ✅ Foreign key relationships
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Indexes for performance
- ✅ Cascade deletes for data integrity

---

## Troubleshooting

### Error: "permission denied"
**Solution**: Make sure you're logged into the correct Supabase project

### Error: "relation already exists"
**Solution**: Tables already created! You're good to go.

### Error: "syntax error"
**Solution**: Make sure you copied the entire SQL file without modifications

---

## Alternative: Use In-Memory Database (No Setup Required)

If you want to skip Supabase setup for now:

1. Edit `backend/.env`
2. Remove or comment out these lines:
   ```
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   ```
3. Restart backend - it will use in-memory storage

**Note**: In-memory data is lost when server restarts!

---

## Need Help?

The backend will automatically fall back to in-memory database if Supabase tables aren't found, so your app will work either way!

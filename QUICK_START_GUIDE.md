# 🚀 Quick Start Guide - User Profile & Feedback System

## Prerequisites
- Backend running on port 3001
- Frontend running on port 5173
- Supabase database configured

## Step 1: Database Migration (REQUIRED)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy entire content from: `backend/supabase-add-user-feedback.sql`
6. Paste into SQL Editor
7. Click "Run" button
8. You should see: "User Profile and Feedback System tables created successfully!"

## Step 2: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
npm run dev
```

You should see:
```
🚀 Backend running on port 3001
Using Supabase PostgreSQL (Service Role Key)
```

## Step 3: Restart Frontend (if needed)

```bash
cd frontend
# Stop current server (Ctrl+C)
npm run dev
```

## Step 4: Test the Complete Flow

### A. Profile Creation & Editing
1. Open http://localhost:5173
2. Click "Connect Wallet" → Select Freighter
3. Profile auto-created in background
4. Click your wallet address in navbar → "View Profile"
5. Click "Edit Profile"
6. Fill in:
   - Username: "John Doe"
   - Bio: "Experienced web developer"
   - Avatar URL: (optional, use any image URL)
   - Role: Select "CLIENT" or "FREELANCER"
7. Click "Save Changes"
8. Profile updated!

### B. Create & Complete Milestone
1. Go to Dashboard
2. Click "Create Milestone"
3. Fill in:
   - Freelancer Wallet: (another test wallet address)
   - Amount: 100 XLM
   - Title: "Build landing page"
4. Click "Create Milestone"
5. Sign transaction in Freighter
6. Wait for confirmation
7. Click "Fund Milestone"
8. Sign funding transaction
9. Wait for XLM to be deducted from wallet

### C. Submit Work (as Freelancer)
1. Switch to freelancer wallet (or use another browser/incognito)
2. Connect freelancer wallet
3. Go to Dashboard
4. Click on the milestone
5. In "Submit Work" section:
   - Enter work description and links
   - Optionally attach files
6. Click "Submit Work"
7. Sign transaction

### D. Approve & Leave Review (as Client)
1. Switch back to client wallet
2. Go to Dashboard → Click milestone
3. Review submission
4. Click "Approve & Release"
5. Sign transaction
6. Wait for funds to transfer to freelancer
7. Scroll down to "Leave a Review" section
8. Select star rating (1-5)
9. Write review comment
10. Click "Submit Review"
11. Review saved!

### E. Freelancer Leaves Review
1. Switch to freelancer wallet
2. Go to milestone detail page
3. Scroll to "Leave a Review" section
4. Rate the client (1-5 stars)
5. Write comment
6. Click "Submit Review"

### F. View Reviews
1. **Landing Page**: Go to http://localhost:5173
   - Scroll to "Trusted by Real Users" section
   - See animated circular orbit with real reviews
   - Hover over cards to pause animation
   
2. **Profile Page**: Click wallet address → "View Profile"
   - See average rating
   - See recent reviews
   - See stats (milestones created/completed)

3. **Feedback Pages**:
   - Visit http://localhost:5173/feedback/client (reviews TO clients)
   - Visit http://localhost:5173/feedback/freelancer (reviews TO freelancers)

## Verification Checklist

✅ User profile auto-created on wallet connect
✅ Profile can be edited (username, bio, avatar, role)
✅ Milestone can be created and funded
✅ Freelancer can submit work
✅ Client can approve and release funds
✅ Both parties can leave reviews after approval
✅ Reviews appear on profile page
✅ Reviews appear on landing page (animated orbit)
✅ Reviews appear on feedback pages
✅ Average rating calculated correctly
✅ Cannot submit duplicate reviews
✅ Cannot review yourself

## Troubleshooting

### "Could not find the 'users' table"
→ Run the SQL migration in Supabase (Step 1)

### "Route not found" for /feedback or /profile
→ Restart backend server (Step 2)

### Reviews not showing on landing page
→ Check browser console for errors
→ Verify backend is running
→ Check Supabase connection

### "Cannot review yourself" error
→ This is correct! You need two different wallets

### Feedback form not appearing
→ Milestone must be in "APPROVED" status
→ Check milestone status in database

## Database Tables to Check

In Supabase, verify these tables exist:
- `User` (or `users`)
- `Feedback` (or `feedback`)
- `Milestone` (should already exist)
- `Escrow` (should already exist)

## API Endpoints to Test

```bash
# Get profile
curl http://localhost:3001/profile/YOUR_WALLET_ADDRESS

# Get latest reviews
curl http://localhost:3001/feedback/latest

# Get client reviews
curl http://localhost:3001/feedback/client

# Get freelancer reviews
curl http://localhost:3001/feedback/freelancer
```

## Success Indicators

1. ✅ Backend logs show: "Using Supabase PostgreSQL (Service Role Key)"
2. ✅ Profile page loads without errors
3. ✅ Landing page shows animated orbit (if reviews exist)
4. ✅ Feedback form appears after milestone approval
5. ✅ Reviews save successfully
6. ✅ Average rating updates on profile

## Next Steps

Once everything works:
1. Test with multiple wallets (5+ users for Blue Belt)
2. Collect real feedback
3. Deploy to production
4. Submit for Blue Belt review

---

**Need Help?**
- Check browser console for errors
- Check backend logs for API errors
- Verify Supabase tables exist
- Ensure service role key is set in backend/.env

**Ready to deploy!** 🎉

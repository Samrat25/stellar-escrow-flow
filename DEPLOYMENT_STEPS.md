# 🚀 Deployment Guide - Stellar Escrow Flow

## Prerequisites
- GitHub repository: https://github.com/Samrat25/stellar-escrow-flow
- Vercel account (logged in)
- Render account (for backend)
- Supabase project (already configured)

---

## Step 1: Deploy Frontend to Vercel

### Via Vercel Dashboard (Recommended)

1. **Go to Vercel:**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select: `Samrat25/stellar-escrow-flow`
   - Click "Import"

3. **Configure Build Settings:**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   Node Version: 20.x
   ```

4. **Environment Variables:**
   Add these in the "Environment Variables" section:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   VITE_STELLAR_NETWORK=testnet
   VITE_FREIGHTER_ENABLED=true
   VITE_ENABLE_FEEDBACK=true
   VITE_ENABLE_REPUTATION=true
   VITE_ENABLE_AGENT_MONITORING=true
   ```
   
   **Note:** You'll update `VITE_API_URL` after deploying the backend in Step 2.

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your frontend will be live at: `https://stellar-escrow-flow.vercel.app`

---

## Step 2: Deploy Backend to Render

### Create Web Service

1. **Go to Render:**
   - Visit: https://dashboard.render.com
   - Click "New" → "Web Service"

2. **Connect Repository:**
   - Click "Connect account" (if not connected)
   - Select: `Samrat25/stellar-escrow-flow`
   - Click "Connect"

3. **Configure Service:**
   ```
   Name: stellar-escrow-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free (or Starter $7/month for better performance)
   ```

4. **Environment Variables:**
   Add these in the "Environment" section:
   ```
   NODE_ENV=production
   PORT=3001
   
   # Stellar Configuration
   STELLAR_NETWORK=testnet
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; February 2021
   STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org
   
   # Contract
   CONTRACT_ID=CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL
   TOKEN_ADDRESS=native
   USE_REAL_CONTRACT=true
   
   # Supabase
   SUPABASE_URL=https://brmedgytvmkonlnsztvv.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybWVkZ3l0dm1rb25sbnN6dHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODQ4NTAsImV4cCI6MjA4NzE2MDg1MH0.S5L9sSKm4D5QGKho_BNJmgDGSnwNpzLFu7cQtJO9hBU
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybWVkZ3l0dm1rb25sbnN6dHZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTU4NDg1MCwiZXhwIjoyMDg3MTYwODUwfQ.pwfCgtf3iZxyvoO8ebz_4O1Pi_W7YndbQFBoGk2bYgg
   
   # IPFS (Pinata)
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlZDczZWU2OS02NmY5LTQ3ZjMtOWNiMS1jZWEwOWM3NGRiM2QiLCJlbWFpbCI6InNhbXJhdG5hdHRhOTkzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIyOTdmZGNhNDJjMjFlYzdiZjhlYyIsInNjb3BlZEtleVNlY3JldCI6ImZlYmEwYzcxMTEyYzJiMmMxMWNmMmNmODBmMzA0OTQ3MjI1NGVlNWNjZTIzM2RhOTE2NDI2ZjU0NzAzZDczNDYiLCJleHAiOjE4MDMzOTkwNDN9.9d3UbdGRkE3v2GHuWAuI8zKN2odo9dbwbLbi072VgWI
   
   # Agents (disable for free tier to save resources)
   ENABLE_AUTO_APPROVAL_AGENT=false
   ENABLE_EVENT_SYNC_AGENT=false
   ENABLE_FEEDBACK_AGENT=false
   ```

5. **Create Web Service:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your backend will be live at: `https://stellar-escrow-backend.onrender.com`

---

## Step 3: Update Frontend Environment Variables

1. **Go back to Vercel Dashboard:**
   - Select your `stellar-escrow-flow` project
   - Go to "Settings" → "Environment Variables"

2. **Update VITE_API_URL:**
   - Find `VITE_API_URL`
   - Change value to: `https://stellar-escrow-backend.onrender.com`
   - Click "Save"

3. **Redeploy Frontend:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

---

## Step 4: Verify Deployment

### Test Frontend
1. Visit: `https://stellar-escrow-flow.vercel.app`
2. Check that page loads correctly
3. Try connecting wallet (Freighter)
4. Navigate through pages

### Test Backend
1. Visit: `https://stellar-escrow-backend.onrender.com/health`
2. Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-23T...",
     "service": "stellar-milestone-escrow",
     "network": "testnet"
   }
   ```

### Test Integration
1. Connect wallet on frontend
2. Try creating a milestone
3. Check if API calls work
4. Verify transactions on Stellar Explorer

---

## Step 5: Update README

Add these links to your README.md:

```markdown
## 🚀 Live Demo

**Frontend:** https://stellar-escrow-flow.vercel.app  
**Backend API:** https://stellar-escrow-backend.onrender.com  
**Network:** Stellar Testnet

**Health Check:** https://stellar-escrow-backend.onrender.com/health
```

---

## Troubleshooting

### Frontend Build Fails
- Check Node version is 20.x
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Backend Fails to Start
- Check all environment variables are set correctly
- Verify Supabase connection
- Check logs in Render dashboard
- Ensure `package.json` has correct start script

### API Connection Issues
- Verify VITE_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running (Render free tier sleeps after 15 min inactivity)

### Database Issues
- Run migration SQL in Supabase SQL Editor
- Check Supabase connection string
- Verify service role key is correct

---

## Cost Breakdown

### Free Tier (Recommended for Testing)
- **Vercel:** Free (Hobby plan)
- **Render:** Free (with limitations: sleeps after 15 min, 750 hours/month)
- **Supabase:** Free (500MB database, 2GB bandwidth)
- **Total:** $0/month

### Production Tier
- **Vercel:** $20/month (Pro plan)
- **Render:** $7/month (Starter plan - always on)
- **Supabase:** $25/month (Pro plan - better performance)
- **Total:** $52/month

---

## Next Steps

1. ✅ Deploy frontend to Vercel
2. ✅ Deploy backend to Render
3. ✅ Update frontend environment variables
4. ✅ Test full application
5. ✅ Update README with live links
6. ✅ Create demo video
7. ✅ Submit to Blue Belt program

---

## Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Stellar Testnet status
5. Review Supabase logs

**Good luck with your deployment! 🚀**

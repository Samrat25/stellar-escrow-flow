# 🚀 Live Deployment Information

## Production URLs

### Frontend (Live Demo)
**URL:** `[TO BE DEPLOYED - Use Vercel/Netlify]`
**Status:** 🔴 Not deployed yet

**Deployment Steps:**
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Backend API
**URL:** `[TO BE DEPLOYED - Use Render/Railway]`
**Status:** 🔴 Not deployed yet

**Deployment Steps:**
1. Create Render/Railway account
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Database
**Provider:** Supabase
**URL:** `https://brmedgytvmkonlnsztvv.supabase.co`
**Status:** ✅ Active

### Smart Contract
**Network:** Stellar Testnet
**Contract ID:** `CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL`
**Status:** ✅ Deployed
**Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL)

---

## Quick Deploy Guide

### Option 1: Vercel (Frontend) + Render (Backend)

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Environment Variables:**
```
VITE_API_URL=https://your-backend.onrender.com
VITE_STELLAR_NETWORK=testnet
```

#### Backend on Render
1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && npm start`
6. Add environment variables from `backend/.env`

### Option 2: All-in-One with Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

## Environment Variables Checklist

### Frontend (.env)
- [ ] `VITE_API_URL` - Backend API URL
- [ ] `VITE_STELLAR_NETWORK` - testnet

### Backend (.env)
- [ ] `STELLAR_NETWORK` - testnet
- [ ] `STELLAR_HORIZON_URL` - https://horizon-testnet.stellar.org
- [ ] `CONTRACT_ID` - Your deployed contract ID
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your service role key
- [ ] `PORT` - 3001
- [ ] `USE_REAL_CONTRACT` - true

---

## Post-Deployment Checklist

- [ ] Frontend accessible via HTTPS
- [ ] Backend API responding
- [ ] Database connected
- [ ] Smart contract calls working
- [ ] Wallet connection functional
- [ ] Transactions going through
- [ ] File uploads working
- [ ] All pages loading correctly

---

## Monitoring

### Health Checks
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-api.onrender.com/health`

### Logs
- Vercel: Dashboard → Deployments → Logs
- Render: Dashboard → Logs tab
- Supabase: Dashboard → Logs

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Add frontend URL to backend CORS whitelist
- Check `app.use(cors())` in `backend/src/server.js`

**2. Database Connection Failed**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project is active
- Run SQL migrations in Supabase SQL Editor

**3. Contract Calls Failing**
- Verify `CONTRACT_ID` is correct
- Check `USE_REAL_CONTRACT=true`
- Ensure contract is deployed on testnet

**4. Wallet Not Connecting**
- Check Freighter is installed
- Verify network is set to testnet
- Clear browser cache

---

## Cost Estimate

### Free Tier (Recommended for MVP)
- **Vercel:** Free (Hobby plan)
- **Render:** Free (with limitations)
- **Supabase:** Free (up to 500MB database)
- **Total:** $0/month

### Paid Tier (Production Ready)
- **Vercel:** $20/month (Pro plan)
- **Render:** $7-15/month (Starter)
- **Supabase:** $25/month (Pro)
- **Total:** $52-60/month

---

## Deployment Timeline

1. **Day 1:** Deploy smart contract ✅
2. **Day 2:** Set up Supabase database ✅
3. **Day 3:** Deploy backend to Render ⏳
4. **Day 4:** Deploy frontend to Vercel ⏳
5. **Day 5:** Test and fix issues ⏳
6. **Day 6:** Get user feedback ⏳
7. **Day 7:** Submit for Blue Belt ⏳

---

**Last Updated:** February 21, 2026
**Status:** Local development complete, production deployment pending
**Next Step:** Deploy to Vercel and Render

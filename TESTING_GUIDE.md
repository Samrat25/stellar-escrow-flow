# Complete Testing Guide for Stellar Escrow Platform

## Prerequisites Checklist

Before testing, ensure you have:

- ✅ Freighter wallet extension installed ([Download](https://www.freighter.app/))
- ✅ Freighter configured for Stellar Testnet
- ✅ Test XLM in your wallet ([Get testnet XLM](https://laboratory.stellar.org/#account-creator))
- ✅ Supabase SQL fix applied (see below)
- ✅ Backend and frontend servers running

## Step 1: Apply Database Fix (CRITICAL)

**You MUST run this SQL in Supabase SQL Editor before testing:**

1. Go to your Supabase project: https://brmedgytvmkonlnsztvv.supabase.co
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Remove unique constraint on contractId
ALTER TABLE "Escrow" DROP CONSTRAINT IF EXISTS "Escrow_contractId_key";

-- Add index for performance
CREATE INDEX IF NOT EXISTS "idx_escrow_contractid" ON "Escrow"("contractId");

-- Ensure escrowIdOnChain is unique
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_escrowIdOnChain_unique" UNIQUE ("escrowIdOnChain");
```

4. Verify success message appears

**Why?** The app uses ONE contract for ALL escrows. Without this fix, you'll get "duplicate key" errors.

## Step 2: Start Servers

### Terminal 1 - Backend
```bash
cd backend
npm start
```

Expected output:
```
Server running on port 3001
Connected to Supabase
Contract ID: CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE ready in XXX ms
Local: http://localhost:8080/
```

## Step 3: Test Wallet Connection

1. Open http://localhost:8080 in your browser
2. Click "Connect Wallet" button in navbar
3. **Expected:** Modal appears with wallet options
4. Click "Freighter"
5. **Expected:** Freighter popup appears
6. Approve the connection
7. **Expected:** 
   - Modal closes
   - Your wallet address appears in navbar (truncated)
   - Success toast: "Wallet connected!"

### Troubleshooting Wallet Connection

| Issue | Solution |
|-------|----------|
| Modal doesn't appear | Check browser console for errors |
| "Freighter not detected" | Install Freighter extension and refresh page |
| Connection approved but no address | Check Freighter is unlocked and on testnet |
| Address doesn't persist on refresh | Check localStorage in DevTools |

## Step 4: Test Escrow Creation

### 4.1 Navigate to Create Escrow
1. Click "Create Escrow" in navbar
2. **Expected:** Form appears with fields

### 4.2 Fill Form
```
Freelancer Wallet: [Any valid Stellar testnet address starting with G]
Review Window: 3 days
Milestone 1: "Design mockups" - 100 XLM
Milestone 2: "Frontend development" - 200 XLM
Milestone 3: "Testing & deployment" - 150 XLM
Total: 450 XLM
```

**Note:** Use a different address than your own. You can generate one at https://laboratory.stellar.org/#account-creator

### 4.3 Submit Transaction
1. Click "Create Escrow & Deposit Funds"
2. **Expected:** Toast: "Please sign the transaction in your wallet"
3. **Expected:** Freighter popup appears with transaction details
4. Review transaction details:
   - Network: Testnet
   - Operation: Contract invocation
   - Amount: Total XLM + fees
5. Click "Sign" in Freighter
6. **Expected:** 
   - Transaction submits to blockchain
   - Loading state while confirming (up to 30 seconds)
   - Success toast with transaction hash
   - Redirect to Client Dashboard

### 4.4 Verify Escrow Created

**In Frontend:**
1. Check Client Dashboard
2. **Expected:** New escrow card appears with:
   - Freelancer address
   - Total amount
   - Milestones list
   - Status: "Active"

**In Supabase:**
1. Go to Table Editor → Escrow table
2. **Expected:** New row with:
   - `contractId`: CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL
   - `escrowIdOnChain`: [transaction hash]
   - `clientWallet`: Your address
   - `freelancerWallet`: Address you entered
   - `status`: ACTIVE

**On Blockchain:**
1. Copy transaction hash from success toast
2. Visit: https://stellar.expert/explorer/testnet/tx/[HASH]
3. **Expected:** Transaction details showing contract invocation

## Step 5: Test Multiple Escrows

**This tests the database fix!**

1. Create another escrow with different details
2. **Expected:** Should succeed without "duplicate key" error
3. Check Supabase → Both escrows should exist with:
   - Same `contractId`
   - Different `escrowIdOnChain`

## Step 6: Test Wallet Disconnection

1. Click "Disconnect" in navbar
2. **Expected:**
   - Address disappears from navbar
   - "Connect Wallet" button appears
   - Toast: "Wallet disconnected"
   - Redirect to home page

## Step 7: Test Persistence

1. Refresh the page
2. **Expected:** Wallet remains disconnected
3. Connect wallet again
4. Refresh the page
5. **Expected:** Wallet remains connected (address in navbar)

## Common Issues & Solutions

### Issue: "duplicate key value violates unique constraint Escrow_contractId_key"
**Solution:** Run the SQL fix from Step 1

### Issue: "null value in column escrowIdOnChain violates not-null constraint"
**Solution:** Backend issue. Check backend logs. Ensure transaction hash is being captured.

### Issue: Transaction fails with "insufficient balance"
**Solution:** Get more testnet XLM from friendbot:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"
```

### Issue: "Failed to sign transaction"
**Solution:** 
- Ensure Freighter is unlocked
- Check you're on testnet in Freighter settings
- Try disconnecting and reconnecting wallet

### Issue: Transaction stuck on "PENDING"
**Solution:** 
- Wait up to 30 seconds
- Check Stellar testnet status
- Verify transaction on stellar.expert

## Backend API Testing (Optional)

### Test Contract Service
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

### Test Database Connection
Check backend logs for:
```
Connected to Supabase
Database adapter initialized
```

## Architecture Verification

After successful testing, verify:

1. **Single Contract Architecture**
   - All escrows use contract: `CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL`
   - Each escrow has unique `escrowIdOnChain` (tx hash)

2. **Wallet Provider Pattern**
   - Wallet state managed by React Context
   - No direct wallet API calls in components
   - All components use `useStellarWallet()` hook

3. **Real Blockchain Transactions**
   - No mocks or fake data
   - All transactions on Stellar testnet
   - Verifiable on stellar.expert

## Success Criteria

✅ Wallet connects and shows address
✅ Can create escrow with valid data
✅ Transaction signs in Freighter
✅ Transaction confirms on blockchain
✅ Escrow appears in dashboard
✅ Escrow saved in Supabase
✅ Can create multiple escrows (no duplicate key error)
✅ Wallet persists on refresh
✅ Can disconnect wallet

## Next Steps After Testing

Once all tests pass:

1. Test freelancer dashboard functionality
2. Test milestone submission flow
3. Test approval/rejection flow
4. Test dispute resolution
5. Test feedback system
6. Deploy to production (Vercel + Render)

---

**Need Help?**
- Check browser console for errors
- Check backend logs for API errors
- Verify Supabase tables are created correctly
- Ensure contract ID matches in backend/.env

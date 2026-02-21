# Quick Start Guide 🚀

## Current Status ✅

Both servers are running and ready:

- **Frontend**: http://localhost:8081/
- **Backend**: http://localhost:3001/
- **Contract**: CBJNQEIZ2CGPI4TRGVGMGKA7UYWNMUB2WJ3JVXW4IFHVHOW3Y4KV6JWL

## Before Testing - CRITICAL ⚠️

You MUST run this SQL in your Supabase SQL Editor first:

```sql
ALTER TABLE "Escrow" DROP CONSTRAINT IF EXISTS "Escrow_contractId_key";
CREATE INDEX IF NOT EXISTS "idx_escrow_contractid" ON "Escrow"("contractId");
ALTER TABLE "Escrow" ADD CONSTRAINT "Escrow_escrowIdOnChain_unique" UNIQUE ("escrowIdOnChain");
```

**Where to run it:**
1. Go to: https://brmedgytvmkonlnsztvv.supabase.co
2. Click "SQL Editor" in left sidebar
3. Paste the SQL above
4. Click "Run"

**Why?** Without this, you'll get "duplicate key" errors when creating escrows.

## Test Wallet Connection

1. Open http://localhost:8081/ in your browser
2. Click "Connect Wallet" button
3. Modal should appear with wallet options
4. Click "Freighter"
5. Approve in Freighter extension
6. Your address should appear in navbar

## Test Escrow Creation

1. Click "Create Escrow" in navbar
2. Fill in the form:
   - Freelancer address: Any valid Stellar address (starts with G)
   - Review window: 3 days
   - Add milestones with descriptions and amounts
3. Click "Create Escrow & Deposit Funds"
4. Sign transaction in Freighter
5. Wait for confirmation (up to 30 seconds)
6. Should redirect to dashboard with new escrow

## Troubleshooting

### Wallet not connecting?
- Ensure Freighter extension is installed
- Check Freighter is unlocked
- Verify you're on Stellar Testnet in Freighter settings

### "duplicate key" error?
- Run the SQL fix in Supabase (see above)

### Transaction fails?
- Get testnet XLM: https://laboratory.stellar.org/#account-creator
- Or use friendbot: `curl "https://friendbot.stellar.org?addr=YOUR_ADDRESS"`

### Port already in use?
- Frontend auto-switches to 8081 if 8080 is busy
- Backend uses 3001 (check nothing else is using it)

## What Changed

### Wallet Integration
- ✅ Installed `@creit.tech/stellar-wallets-kit`
- ✅ Created React Context for wallet management
- ✅ Updated all components to use wallet context
- ✅ Fixed `global is not defined` error with Vite config

### Architecture
- Single contract for all escrows
- Each escrow identified by unique transaction hash
- Real blockchain transactions (no mocks)
- Supabase PostgreSQL database

## Files to Review

- `frontend/src/contexts/WalletContext.tsx` - Wallet provider
- `frontend/src/App.tsx` - App with wallet provider
- `frontend/src/pages/CreateEscrow.tsx` - Escrow creation with signing
- `frontend/vite.config.ts` - Global polyfill fix
- `backend/supabase-fix-contractid.sql` - Database fix

## Need Help?

Check these files for detailed info:
- `WALLET_INTEGRATION_COMPLETE.md` - Integration details
- `TESTING_GUIDE.md` - Comprehensive testing steps
- `FIXED_MODULE_ISSUE.md` - Module error fix explanation

---

**Ready to test! Just run the SQL fix first.** 🎉

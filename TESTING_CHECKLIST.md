# TrustPay MVP - Testing Checklist

## Pre-Testing Setup

### Environment Setup
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Auto-approval agent running
- [ ] Database schema applied
- [ ] All environment variables configured

### Test Accounts Created
- [ ] Client Account 1: `G...` (funded with testnet XLM)
- [ ] Client Account 2: `G...` (funded with testnet XLM)
- [ ] Freelancer Account 1: `G...` (funded with testnet XLM)
- [ ] Freelancer Account 2: `G...` (funded with testnet XLM)
- [ ] Freelancer Account 3: `G...` (funded with testnet XLM)

### Tools Ready
- [ ] Freighter wallet installed
- [ ] Stellar Explorer bookmarked
- [ ] Supabase dashboard access
- [ ] Backend logs accessible

## Functional Testing

### 1. Wallet Connection
- [ ] Connect wallet on landing page
- [ ] Wallet address displays in navbar
- [ ] Can disconnect and reconnect
- [ ] Works with multiple accounts
- [ ] Error handling for no wallet

### 2. Create Escrow (Client)
- [ ] Navigate to /create
- [ ] Enter valid freelancer address
- [ ] Set review window (3 days)
- [ ] Add multiple milestones
- [ ] See total amount calculated
- [ ] Submit form
- [ ] Receive transaction hash
- [ ] See escrow in client dashboard
- [ ] Verify on Stellar Explorer

**Test Data**:
```
Freelancer: G...
Review Window: 3 days
Milestones:
  1. Design mockups - 1000 XLM
  2. Frontend development - 2000 XLM
  3. Testing & deployment - 1000 XLM
Total: 4000 XLM
```

### 3. Deposit Funds (Client)
- [ ] Funds automatically deposited after creation
- [ ] Transaction hash received
- [ ] Escrow status changes to FUNDED
- [ ] Verify on Stellar Explorer
- [ ] See in database

### 4. Submit Milestone (Freelancer)
- [ ] Switch to freelancer account
- [ ] See assigned escrow in dashboard
- [ ] First milestone shows "Submit" button
- [ ] Click submit
- [ ] Enter proof URL (e.g., GitHub link)
- [ ] Submit successfully
- [ ] Receive transaction hash
- [ ] Milestone status changes to SUBMITTED
- [ ] Review deadline countdown appears
- [ ] Verify on Stellar Explorer

**Test Proof URLs**:
- GitHub: `https://github.com/user/repo`
- Google Drive: `https://drive.google.com/file/d/...`
- IPFS: `https://ipfs.io/ipfs/...`

### 5. Approve Milestone (Client)
- [ ] Switch to client account
- [ ] See submitted milestone
- [ ] Review countdown visible
- [ ] Click proof URL link (opens in new tab)
- [ ] Click "Approve" button
- [ ] Confirm transaction
- [ ] Receive transaction hash
- [ ] Milestone status changes to APPROVED
- [ ] Freelancer sees payment received
- [ ] Verify on Stellar Explorer
- [ ] Next milestone becomes available

### 6. Reject Milestone (Client)
- [ ] Submit milestone as freelancer
- [ ] Switch to client account
- [ ] Click "Reject" button
- [ ] Enter rejection reason
- [ ] Confirm rejection
- [ ] Receive transaction hash
- [ ] Milestone status changes to REJECTED
- [ ] Freelancer sees rejection reason
- [ ] Freelancer can resubmit
- [ ] Verify on Stellar Explorer

### 7. Auto-Approval
- [ ] Create new escrow with 1-day review window
- [ ] Submit milestone as freelancer
- [ ] Modify deadline in database for testing:
  ```sql
  UPDATE milestones 
  SET review_deadline = NOW() - INTERVAL '1 hour'
  WHERE id = 'MILESTONE_ID';
  ```
- [ ] Wait for agent run (or restart agent)
- [ ] Check agent logs for auto-approval
- [ ] Milestone status changes to APPROVED
- [ ] `auto_approved` flag set to true
- [ ] Freelancer receives payment
- [ ] Transaction hash logged
- [ ] Verify on Stellar Explorer

### 8. Sequential Milestones
- [ ] Create escrow with 3 milestones
- [ ] Try to submit milestone 2 before milestone 1
- [ ] Should show "Complete previous milestone first"
- [ ] Submit milestone 1
- [ ] Approve milestone 1
- [ ] Now milestone 2 shows "Submit" button
- [ ] Submit milestone 2
- [ ] Approve milestone 2
- [ ] Submit and approve milestone 3
- [ ] Escrow status changes to COMPLETED

### 9. Complete Escrow Lifecycle
- [ ] Create escrow (Client)
- [ ] Deposit funds (Client)
- [ ] Submit milestone 1 (Freelancer)
- [ ] Approve milestone 1 (Client)
- [ ] Submit milestone 2 (Freelancer)
- [ ] Approve milestone 2 (Client)
- [ ] Submit milestone 3 (Freelancer)
- [ ] Approve milestone 3 (Client)
- [ ] Escrow status = COMPLETED
- [ ] All milestones = APPROVED
- [ ] All transactions on Explorer
- [ ] Database reflects completion

### 10. Feedback System
- [ ] Navigate to /feedback
- [ ] Enter feedback text
- [ ] Select rating (1-5)
- [ ] Submit feedback
- [ ] Confirmation message
- [ ] Feedback appears in list
- [ ] Verify in database

## Edge Cases & Error Handling

### Validation
- [ ] Invalid wallet address format
- [ ] Client = Freelancer (same address)
- [ ] Empty milestone description
- [ ] Zero or negative amount
- [ ] Review window < 1 day
- [ ] Empty proof URL
- [ ] Empty rejection reason

### Authorization
- [ ] Freelancer cannot approve milestone
- [ ] Client cannot submit milestone
- [ ] Cannot approve own milestone
- [ ] Cannot modify other user's escrow

### State Management
- [ ] Cannot deposit twice
- [ ] Cannot approve twice
- [ ] Cannot submit approved milestone
- [ ] Cannot skip milestones
- [ ] Cannot modify funded escrow

### Network Errors
- [ ] Backend offline
- [ ] Database connection lost
- [ ] Wallet disconnected
- [ ] Transaction failed
- [ ] Timeout handling

## UI/UX Testing

### Responsiveness
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Navigation
- [ ] All links work
- [ ] Back button works
- [ ] Breadcrumbs accurate
- [ ] 404 page for invalid routes

### Visual Feedback
- [ ] Loading states
- [ ] Success toasts
- [ ] Error messages
- [ ] Countdown timers
- [ ] Status badges
- [ ] Transaction links

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader friendly
- [ ] Color contrast
- [ ] Focus indicators
- [ ] Alt text for images

## Performance Testing

### Load Times
- [ ] Landing page < 2s
- [ ] Dashboard < 3s
- [ ] API responses < 100ms
- [ ] Transaction confirmation < 10s

### Concurrent Users
- [ ] 5 users simultaneously
- [ ] Multiple escrows active
- [ ] No race conditions
- [ ] Database handles load

## Security Testing

### Authentication
- [ ] Wallet signature required
- [ ] Cannot impersonate users
- [ ] Session management

### Authorization
- [ ] Role-based access enforced
- [ ] RLS policies work
- [ ] Cannot access other's data

### Input Validation
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection
- [ ] Rate limiting (if implemented)

## Database Testing

### Data Integrity
- [ ] Foreign keys enforced
- [ ] Check constraints work
- [ ] Unique constraints work
- [ ] Timestamps accurate

### Queries
```sql
-- All escrows
SELECT * FROM escrows ORDER BY created_at DESC;

-- Escrow with milestones
SELECT e.*, m.* 
FROM escrows e 
LEFT JOIN milestones m ON e.id = m.escrow_id 
WHERE e.id = 'ESCROW_ID';

-- Pending auto-approvals
SELECT * FROM milestones 
WHERE status = 'SUBMITTED' 
AND review_deadline < NOW();

-- Statistics
SELECT * FROM get_escrow_stats();

-- Recent transactions
SELECT * FROM transaction_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Integration Testing

### Stellar Integration
- [ ] Transaction submission works
- [ ] Transaction confirmation works
- [ ] Explorer links valid
- [ ] Account balances update

### Supabase Integration
- [ ] CRUD operations work
- [ ] RLS policies enforced
- [ ] Real-time updates (if used)
- [ ] Backup/restore works

### Auto-Approval Agent
- [ ] Runs on schedule
- [ ] Queries correct milestones
- [ ] Updates database
- [ ] Logs transactions
- [ ] Error handling

## Documentation Testing

### README
- [ ] Instructions clear
- [ ] Links work
- [ ] Examples accurate

### SETUP.md
- [ ] Steps work
- [ ] Commands correct
- [ ] Screenshots helpful

### DEPLOYMENT.md
- [ ] Deployment succeeds
- [ ] Environment variables correct
- [ ] Troubleshooting helpful

### API Documentation
- [ ] Endpoints documented
- [ ] Examples work
- [ ] Error codes listed

## Blue Belt Validation

### Requirements
- [ ] 5+ real testnet users tested
- [ ] At least 1 full escrow lifecycle completed
- [ ] At least 1 auto-approval event verified
- [ ] All wallet addresses documented
- [ ] All Explorer links verifiable
- [ ] Feedback collected from users
- [ ] 1 UI improvement iteration based on feedback

### Documentation
- [ ] Test results documented
- [ ] Screenshots captured
- [ ] Transaction hashes recorded
- [ ] Wallet addresses listed
- [ ] Feedback summarized
- [ ] Improvements documented

## Test Results Template

```markdown
# Test Results - [Date]

## Test Accounts
- Client 1: GCEZ... (funded: 10,000 XLM)
- Client 2: GBDE... (funded: 10,000 XLM)
- Freelancer 1: GA7Y... (funded: 100 XLM)
- Freelancer 2: GDQP... (funded: 100 XLM)
- Freelancer 3: GCZK... (funded: 100 XLM)

## Escrow 1: Full Lifecycle
- Created: [timestamp]
- Contract ID: C...
- Creation Tx: [hash] - [explorer link]
- Deposit Tx: [hash] - [explorer link]
- Milestone 1 Submit Tx: [hash] - [explorer link]
- Milestone 1 Approve Tx: [hash] - [explorer link]
- Milestone 2 Submit Tx: [hash] - [explorer link]
- Milestone 2 Approve Tx: [hash] - [explorer link]
- Milestone 3 Submit Tx: [hash] - [explorer link]
- Milestone 3 Approve Tx: [hash] - [explorer link]
- Completed: [timestamp]
- Status: ✅ SUCCESS

## Escrow 2: Auto-Approval
- Created: [timestamp]
- Contract ID: C...
- Milestone Submit Tx: [hash] - [explorer link]
- Review Deadline: [timestamp]
- Auto-Approval Tx: [hash] - [explorer link]
- Auto-Approved: [timestamp]
- Status: ✅ SUCCESS

## Feedback Collected
1. User 1: "Great UX, very intuitive"
2. User 2: "Would like to see milestone progress bar"
3. User 3: "Auto-approval is a game changer"
4. User 4: "Need better mobile support"
5. User 5: "Love the transparency"

## Issues Found
1. [Issue description] - Priority: High/Medium/Low
2. [Issue description] - Priority: High/Medium/Low

## Improvements Implemented
1. [Improvement description]
2. [Improvement description]

## Conclusion
[Summary of testing results and readiness for production]
```

## Sign-Off

- [ ] All critical tests passed
- [ ] All blockers resolved
- [ ] Documentation complete
- [ ] Ready for production deployment

**Tested By**: _______________  
**Date**: _______________  
**Status**: ✅ PASS / ❌ FAIL

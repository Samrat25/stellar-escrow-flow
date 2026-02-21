# API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
All requests require valid Stellar wallet addresses. Client-side wallet signing via Freighter or Ledger.

## Response Format
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Escrow Endpoints

### Create Escrow
Create a new escrow agreement with milestones.

```http
POST /escrow/create
Content-Type: application/json

{
  "clientWallet": "GXXXXXX...",
  "freelancerWallet": "GXXXXXX...",
  "milestones": [
    {
      "description": "Design mockups",
      "amount": "100"
    },
    {
      "description": "Development",
      "amount": "200"
    }
  ],
  "reviewWindowDays": 3,
  "deadline": "2024-03-15T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "escrowId": "uuid",
  "contractId": "C...",
  "txHash": "...",
  "explorerUrl": "..."
}
```

**Status Codes:**
- 200: Success
- 400: Invalid input
- 500: Server error

---

### Deposit Funds
Lock funds into the escrow contract.

```http
POST /escrow/deposit
Content-Type: application/json

{
  "escrowId": "uuid",
  "clientWallet": "GXXXXXX..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "...",
  "explorerUrl": "..."
}
```

**Requirements:**
- Escrow must be in CREATED state
- Caller must be the client
- Funds are transferred from client's Stellar account

---

### Get Escrow
Retrieve escrow details and milestones.

```http
GET /escrow/{escrowId}
```

**Response:**
```json
{
  "id": "uuid",
  "contractId": "C...",
  "clientWallet": "GXXXXXX...",
  "freelancerWallet": "GXXXXXX...",
  "totalAmount": 300,
  "status": "ACTIVE",
  "deadline": "2024-03-15T00:00:00Z",
  "milestones": [
    {
      "id": "uuid",
      "milestoneIndex": 0,
      "description": "Design",
      "amount": 100,
      "status": "SUBMITTED",
      "proofUrl": "...",
      "submittedAt": "2024-02-20T10:00:00Z",
      "reviewDeadline": "2024-02-23T10:00:00Z"
    }
  ]
}
```

---

### List User Escrows
Get all escrows for a wallet (client or freelancer role).

```http
GET /escrow/wallet/{walletAddress}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "contractId": "C...",
    "clientWallet": "GXXXXXX...",
    "status": "ACTIVE",
    "totalAmount": 300,
    "createdAt": "2024-02-20T00:00:00Z"
  }
]
```

---

## Milestone Endpoints

### Submit Milestone
Freelancer submits completed work.

```http
POST /milestone/submit
Content-Type: application/json

{
  "milestoneId": "uuid",
  "freelancerWallet": "GXXXXXX...",
  "proofUrl": "https://example.com/proof.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "...",
  "reviewDeadline": "2024-02-23T10:00:00Z",
  "explorerUrl": "..."
}
```

**Requirements:**
- Milestone must be PENDING or REJECTED
- Caller must be assigned freelancer
- Previous milestone (if exists) must be APPROVED

---

### Approve Milestone
Client approves milestone and releases funds.

```http
POST /milestone/approve
Content-Type: application/json

{
  "milestoneId": "uuid",
  "clientWallet": "GXXXXXX..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "...",
  "escrowCompleted": false,
  "explorerUrl": "..."
}
```

**Effects:**
- Milestone marked APPROVED
- Funds released to freelancer
- If all milestones approved, escrow marked COMPLETED

---

### Reject Milestone
Client rejects milestone for revision.

```http
POST /milestone/reject
Content-Type: application/json

{
  "milestoneId": "uuid",
  "clientWallet": "GXXXXXX...",
  "reason": "Doesn't match specifications"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "...",
  "explorerUrl": "..."
}
```

**Effects:**
- Milestone marked REJECTED
- Can be resubmitted by freelancer

---

## Feedback Endpoints

### Submit Feedback
Leave feedback and rating on completed escrow.

```http
POST /feedback/submit
Content-Type: application/json

{
  "escrowId": "uuid",
  "userId": "uuid",
  "rating": 5,
  "comment": "Great work!",
  "category": "QUALITY"
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "uuid",
  "feedbackCount": 42
}
```

**Rating:** 1-5 (required)
**Category:** GENERAL, QUALITY, SPEED, PROFESSIONALISM

---

### Get Escrow Feedback
Retrieve all feedback for an escrow.

```http
GET /feedback/escrow/{escrowId}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "rating": 5,
    "comment": "Great work!",
    "category": "QUALITY",
    "user": {
      "displayName": "John Doe",
      "reputation": 4.8
    },
    "createdAt": "2024-02-20T10:00:00Z"
  }
]
```

---

### Get User Feedback
Retrieve feedback for a specific user.

```http
GET /feedback/user/{userId}
```

**Response:**
```json
{
  "feedbacks": [...],
  "stats": {
    "totalFeedback": 15,
    "averageRating": 4.7,
    "byCategory": {
      "QUALITY": 8,
      "SPEED": 5,
      "PROFESSIONALISM": 2
    }
  }
}
```

---

### Get Feedback Statistics
Global feedback statistics for the platform.

```http
GET /feedback/stats
```

**Response:**
```json
{
  "total": 150,
  "averageRating": 4.6,
  "byRating": {
    "5": 100,
    "4": 35,
    "3": 10,
    "2": 3,
    "1": 2
  },
  "byCategory": {
    "QUALITY": 80,
    "SPEED": 45,
    "PROFESSIONALISM": 25
  },
  "recentComments": [...]
}
```

---

## User Endpoints

### Get User Profile
Retrieve user profile information.

```http
GET /user/{walletAddress}
```

**Response:**
```json
{
  "id": "uuid",
  "walletAddress": "GXXXXXX...",
  "displayName": "John Doe",
  "email": "john@example.com",
  "role": "BOTH",
  "reputation": 4.8,
  "completedEscrows": 10,
  "totalTransacted": 5000
}
```

---

### Get User Dashboard
Complete dashboard data for a user.

```http
GET /user/{walletAddress}/dashboard
```

**Response:**
```json
{
  "user": {...},
  "clientEscrows": [...],
  "freelancerEscrows": [...],
  "stats": {
    "totalEscrows": 15,
    "completedEscrows": 12,
    "totalTransacted": 5000,
    "avgRating": 4.8,
    "feedbackCount": 10
  }
}
```

---

### Update User Profile
Update user profile information.

```http
PUT /user/{walletAddress}
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...}
}
```

---

### Get User Reputation
Get detailed reputation and rating breakdown.

```http
GET /user/{walletAddress}/reputation
```

**Response:**
```json
{
  "walletAddress": "GXXXXXX...",
  "reputation": 4.8,
  "completedEscrows": 12,
  "totalTransacted": 5000,
  "feedbackCount": 10,
  "averageRating": 4.8,
  "ratingDistribution": {
    "5": 8,
    "4": 2,
    "3": 0,
    "2": 0,
    "1": 0
  }
}
```

---

## Agent Endpoints

### Get Agent Status
Get current status of automation agents.

```http
GET /agent/status
```

**Response:**
```json
{
  "status": "operational",
  "timestamp": "2024-02-20T10:00:00Z",
  "stats": {
    "total": 150,
    "byStatus": {
      "SUCCESS": 140,
      "FAILED": 5,
      "PENDING": 5
    },
    "byType": {
      "AUTO_APPROVAL": 120,
      "EVENT_SYNC": 20,
      "FEEDBACK_ANALYSIS": 10
    }
  },
  "recentActivity": [...]
}
```

---

### Get Agent Logs
Retrieve agent activity logs.

```http
GET /agent/logs?agentType=AUTO_APPROVAL&status=SUCCESS&limit=50
```

**Query Parameters:**
- `agentType`: AUTO_APPROVAL | EVENT_SYNC | FEEDBACK_ANALYSIS
- `status`: PENDING | PROCESSING | SUCCESS | FAILED
- `escrowId`: Filter by escrow
- `limit`: Max 100 (default 50)

**Response:**
```json
[
  {
    "id": "uuid",
    "agentType": "AUTO_APPROVAL",
    "action": "AUTO_APPROVE_MILESTONE_0",
    "status": "SUCCESS",
    "txHash": "...",
    "createdAt": "2024-02-20T10:00:00Z"
  }
]
```

---

### Get Pending Actions
Get items awaiting agent processing.

```http
GET /agent/pending-actions
```

**Response:**
```json
{
  "pendingAutoApprovals": 2,
  "pendingAutoReleases": 1,
  "milestones": [
    {
      "milestoneId": "uuid",
      "escrowId": "uuid",
      "milestoneIndex": 0,
      "reviewDeadline": "2024-02-23T10:00:00Z"
    }
  ],
  "escrows": [
    {
      "escrowId": "uuid",
      "contractId": "C...",
      "deadline": "2024-02-24T00:00:00Z"
    }
  ]
}
```

---

### Test Agent
Health check for agent system.

```http
POST /agent/test
```

**Response:**
```json
{
  "success": true,
  "testId": "uuid",
  "message": "Agent system is operational"
}
```

---

## Health Check

### System Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-20T10:00:00Z",
  "service": "stellar-escrow-backend",
  "network": "testnet",
  "environment": "production"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Descriptive error message",
  "details": {
    "field": "error details"
  }
}
```

### Common Error Codes
- 400: Bad Request (invalid input)
- 403: Forbidden (unauthorized action)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

---

## Rate Limiting
(Recommended but not yet implemented)
- 100 requests per minute per IP
- 1000 requests per hour per wallet address

---

## Webhooks
(Future feature)
- https://yourdomain.com/webhook/escrow
- https://yourdomain.com/webhook/milestone
- https://yourdomain.com/webhook/funds-released

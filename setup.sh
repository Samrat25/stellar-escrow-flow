#!/bin/bash
# TrustPay MVP Setup Script
set -e

echo "🚀 TrustPay MVP Setup"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Backend
echo "📦 Backend setup..."
cd backend
[ ! -f ".env" ] && cp .env.example .env
npm install
npm run prisma:generate
echo "✅ Backend ready"

# Frontend
cd ..
echo "📦 Frontend setup..."
[ ! -f ".env" ] && cp .env.example .env
npm install
echo "✅ Frontend ready"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with DATABASE_URL"
echo "2. Run: cd backend && npm run prisma:migrate"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: npm run dev"
echo "5. Start agent: cd backend && npm run agent"

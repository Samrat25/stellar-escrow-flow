@echo off
echo ========================================
echo 🚀 TrustPay Quick Start
echo ========================================
echo.
echo Smart Contract: ✅ DEPLOYED
echo Contract ID: CCWK634Z6GFUU4LKXHH226LT3L35O7JAYC6OSXOH2D4LJJMTGIGW4KY7
echo.
echo ========================================
echo Step 1: Database Setup
echo ========================================
echo.
echo Opening Neon.tech in your browser...
start https://neon.tech
echo.
echo Please:
echo   1. Sign up for free account
echo   2. Create new project (name: trustpay)
echo   3. Copy the connection string
echo   4. Come back here
echo.
pause
echo.
set /p db_url="Paste your DATABASE_URL: "
echo.
echo Updating configuration...
powershell -Command "(Get-Content backend\.env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=%db_url%' | Set-Content backend\.env"
echo ✅ Configuration updated!
echo.
echo ========================================
echo Step 2: Database Migration
echo ========================================
echo.
cd backend
echo Running Prisma migrations...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ❌ Migration failed. Check your DATABASE_URL
    pause
    exit /b 1
)
echo.
echo Generating Prisma client...
call npx prisma generate
echo ✅ Database ready!
cd ..
echo.
echo ========================================
echo Step 3: Starting Services
echo ========================================
echo.
echo Opening 3 terminals for you...
echo.
echo Terminal 1: Backend API
start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Terminal 2: Frontend
start cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Terminal 3: Auto-Approval Agent
start cmd /k "cd backend && npm run agent"
echo.
echo ========================================
echo ✅ All services starting!
echo ========================================
echo.
echo Your app will be available at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo.
echo Contract Explorer:
echo   https://stellar.expert/explorer/testnet/contract/CCWK634Z6GFUU4LKXHH226LT3L35O7JAYC6OSXOH2D4LJJMTGIGW4KY7
echo.
echo ========================================
echo 🎉 TrustPay is running!
echo ========================================
echo.
pause

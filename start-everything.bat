@echo off
echo ========================================
echo 🚀 TrustPay - Starting Everything
echo ========================================
echo.
echo Smart Contract: ✅ DEPLOYED
echo Contract ID: CCWK634Z6GFUU4LKXHH226LT3L35O7JAYC6OSXOH2D4LJJMTGIGW4KY7
echo Network: Stellar Testnet
echo.
echo ========================================
echo Step 1: Database Setup (SQLite)
echo ========================================
echo.
echo Using SQLite for quick testing...
cd backend

REM Backup original schema
if not exist prisma\schema.prisma.backup (
    copy prisma\schema.prisma prisma\schema.prisma.backup
)

REM Use SQLite schema
copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma

REM Update .env for SQLite
echo # Stellar Configuration > .env.temp
echo STELLAR_NETWORK=testnet >> .env.temp
echo STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org >> .env.temp
echo STELLAR_PASSPHRASE=Test SDF Network ; September 2015 >> .env.temp
echo. >> .env.temp
echo # Contract Configuration >> .env.temp
echo USE_REAL_CONTRACT=true >> .env.temp
echo CONTRACT_ID=CCWK634Z6GFUU4LKXHH226LT3L35O7JAYC6OSXOH2D4LJJMTGIGW4KY7 >> .env.temp
echo TOKEN_ADDRESS=NATIVE >> .env.temp
echo. >> .env.temp
echo # Contract Admin >> .env.temp
echo ADMIN_SECRET_KEY=admin >> .env.temp
echo. >> .env.temp
echo # Database (SQLite for testing) >> .env.temp
echo DATABASE_URL=file:./dev.db >> .env.temp
echo. >> .env.temp
echo # Server >> .env.temp
echo PORT=3001 >> .env.temp
echo NODE_ENV=development >> .env.temp

move /Y .env.temp .env

echo ✅ Database configured (SQLite)
echo.
echo Running Prisma migrations...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo.
    echo ❌ Migration failed
    echo Trying to push schema directly...
    call npx prisma db push
)
echo.
echo Generating Prisma client...
call npx prisma generate
echo ✅ Database ready!
echo.
cd ..

echo ========================================
echo Step 2: Starting Services
echo ========================================
echo.
echo Opening 3 terminals...
echo.

REM Terminal 1: Backend
echo Starting Backend API...
start "TrustPay Backend" cmd /k "cd backend && echo Backend API starting... && npm run dev"
timeout /t 2 /nobreak >nul

REM Terminal 2: Frontend
echo Starting Frontend...
start "TrustPay Frontend" cmd /k "echo Frontend starting... && npm run dev"
timeout /t 2 /nobreak >nul

REM Terminal 3: Auto-Approval Agent
echo Starting Auto-Approval Agent...
start "TrustPay Agent" cmd /k "cd backend && echo Auto-Approval Agent starting... && npm run agent"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo ✅ All services started!
echo ========================================
echo.
echo Wait 10-15 seconds for services to start, then visit:
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001/health
echo.
echo Contract Explorer:
echo   https://stellar.expert/explorer/testnet/contract/CCWK634Z6GFUU4LKXHH226LT3L35O7JAYC6OSXOH2D4LJJMTGIGW4KY7
echo.
echo ========================================
echo 📝 Next Steps:
echo ========================================
echo.
echo 1. Install a Stellar wallet:
echo    - Freighter: https://www.freighter.app/
echo    - Albedo: https://albedo.link/
echo    - xBull: https://xbull.app/
echo.
echo 2. Switch wallet to Testnet
echo.
echo 3. Get test XLM:
echo    https://laboratory.stellar.org/#account-creator?network=test
echo.
echo 4. Connect wallet and create escrow!
echo.
echo ========================================
echo 🎉 TrustPay is running!
echo ========================================
echo.
echo Press any key to open frontend in browser...
pause >nul
start http://localhost:5173

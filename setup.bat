@echo off
echo ========================================
echo Stellar Escrow MVP Setup
echo ========================================

echo.
echo [1/4] Starting PostgreSQL...
docker-compose up -d
timeout /t 5 /nobreak >nul

echo.
echo [2/4] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Failed to install backend dependencies
    exit /b 1
)

echo.
echo [3/4] Running database migrations...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo Failed to run migrations
    exit /b 1
)

call npx prisma generate
cd ..

echo.
echo [4/4] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Build contract: cd contract ^&^& cargo build --target wasm32-unknown-unknown --release
echo 2. Deploy contract: cd contract ^&^& soroban contract deploy --wasm target/wasm32-unknown-unknown/release/stellar_escrow.wasm --source YOUR_ADDRESS --network testnet
echo 3. Update backend/.env with CONTRACT_ID
echo 4. Start backend: cd backend ^&^& npm run dev
echo 5. Start agent: cd backend ^&^& npm run agent
echo 6. Start frontend: cd frontend ^&^& npm run dev
echo.

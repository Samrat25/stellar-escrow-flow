@echo off
echo ========================================
echo Starting Stellar Escrow MVP
echo ========================================

echo.
echo Starting PostgreSQL...
docker-compose up -d
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo Starting Auto-Approval Agent...
start "Auto-Approval Agent" cmd /k "cd backend && npm run agent"
timeout /t 2 /nobreak >nul

echo.
echo Starting Frontend...
start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
docker-compose down
taskkill /FI "WINDOWTITLE eq Backend Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Auto-Approval Agent*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /F >nul 2>&1

echo Services stopped.

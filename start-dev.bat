@echo off
echo Starting TrustPay MVP Development Environment
echo ============================================
echo.

echo Starting PostgreSQL...
start "PostgreSQL" cmd /k "docker-compose up"
timeout /t 5

echo Starting Backend...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"
timeout /t 3

echo Starting Auto-Approval Agent...
start "Agent" cmd /k "cd backend && npm run agent"

echo.
echo ============================================
echo All services started!
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001
echo Prisma Studio: npm run backend:studio
echo.
echo Press any key to stop all services...
pause > nul

echo Stopping services...
taskkill /FI "WINDOWTITLE eq PostgreSQL*" /T /F
taskkill /FI "WINDOWTITLE eq Backend*" /T /F
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F
taskkill /FI "WINDOWTITLE eq Agent*" /T /F
docker-compose down

echo All services stopped.
pause

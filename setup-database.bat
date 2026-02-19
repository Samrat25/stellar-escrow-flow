@echo off
echo ========================================
echo TrustPay Database Setup
echo ========================================
echo.
echo Since Docker is not available, we'll use a cloud database.
echo.
echo Option 1: Neon (Recommended - Fast setup)
echo   1. Visit: https://neon.tech
echo   2. Sign up (free)
echo   3. Create new project
echo   4. Copy connection string
echo.
echo Option 2: Supabase (Also great)
echo   1. Visit: https://supabase.com
echo   2. Sign up (free)
echo   3. Create new project
echo   4. Go to Settings ^> Database
echo   5. Copy connection string (URI format)
echo.
echo ========================================
echo.
set /p db_url="Paste your DATABASE_URL here: "
echo.
echo Updating backend/.env...
powershell -Command "(Get-Content backend\.env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=%db_url%' | Set-Content backend\.env"
echo.
echo ✅ Database URL updated!
echo.
echo Now running Prisma migrations...
cd backend
call npx prisma migrate dev --name init
call npx prisma generate
echo.
echo ========================================
echo ✅ Database setup complete!
echo ========================================
echo.
echo Next steps:
echo   1. Open 3 terminals
echo   2. Terminal 1: cd backend ^&^& npm run dev
echo   3. Terminal 2: npm run dev
echo   4. Terminal 3: cd backend ^&^& npm run agent
echo.
pause

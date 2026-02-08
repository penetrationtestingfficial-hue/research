@echo off
REM scripts/start_all.bat
REM Start all CSEC08 platform services on Windows

echo.
echo ========================================
echo  CSEC08 Research Platform Startup
echo ========================================
echo.

REM Check PostgreSQL
pg_isready >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL is not running!
    echo Please start PostgreSQL service first.
    pause
    exit /b 1
)

echo [OK] PostgreSQL is running
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

cd /d "%PROJECT_ROOT%"

echo Starting services in separate windows...
echo.

REM Start Hardhat
echo [1/3] Starting Hardhat node...
start "CSEC08 - Hardhat" cmd /k "cd blockchain && npx hardhat node"
timeout /t 3 /nobreak >nul

REM Start Backend
echo [2/3] Starting Flask backend...
start "CSEC08 - Backend" cmd /k "cd server && venv\Scripts\activate && python run.py"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [3/3] Starting React frontend...
start "CSEC08 - Frontend" cmd /k "cd client && npm run dev"

echo.
echo ========================================
echo  All services started!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:5000
echo Hardhat:  http://127.0.0.1:8545
echo.
echo Close all windows to stop services
echo.
pause
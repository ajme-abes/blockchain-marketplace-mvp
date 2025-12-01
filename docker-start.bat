@echo off
echo ========================================
echo EthioTrust Marketplace - Docker Startup
echo ========================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running!
echo.

echo Choose mode:
echo 1. Production (Recommended)
echo 2. Development
echo.
set /p mode="Enter choice (1 or 2): "

if "%mode%"=="1" (
    echo.
    echo Starting in PRODUCTION mode...
    echo.
    docker-compose down
    docker-compose up -d --build
    echo.
    echo ========================================
    echo Services started successfully!
    echo ========================================
    echo Frontend: http://localhost:3000
    echo Backend:  http://localhost:5000
    echo Database: localhost:5433
    echo.
    echo View logs: docker-compose logs -f
    echo Stop services: docker-compose down
    echo ========================================
) else if "%mode%"=="2" (
    echo.
    echo Starting in DEVELOPMENT mode...
    echo.
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build
    echo.
    echo ========================================
    echo Services started successfully!
    echo ========================================
    echo Frontend: http://localhost:8080
    echo Backend:  http://localhost:5000
    echo Database: localhost:5432
    echo.
    echo View logs: docker-compose -f docker-compose.dev.yml logs -f
    echo Stop services: docker-compose -f docker-compose.dev.yml down
    echo ========================================
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
pause

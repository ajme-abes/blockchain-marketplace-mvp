@echo off
echo ========================================
echo Restarting Docker Services
echo ========================================
echo.

echo Stopping services...
docker-compose down

echo.
echo Rebuilding and starting services...
docker-compose up -d --build

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Checking status...
docker-compose ps

echo.
echo Checking backend logs...
docker-compose logs --tail=50 backend

echo.
pause

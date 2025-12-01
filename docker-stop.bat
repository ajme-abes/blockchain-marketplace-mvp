@echo off
echo ========================================
echo EthioTrust Marketplace - Docker Stop
echo ========================================
echo.

echo Stopping all Docker services...
echo.

docker-compose down
docker-compose -f docker-compose.dev.yml down

echo.
echo ========================================
echo All services stopped!
echo ========================================
echo.

echo Do you want to remove volumes (database data)?
echo WARNING: This will delete all data!
echo.
set /p remove="Remove volumes? (y/N): "

if /i "%remove%"=="y" (
    echo.
    echo Removing volumes...
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    echo Volumes removed!
) else (
    echo Volumes preserved.
)

echo.
pause

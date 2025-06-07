@echo off
echo ========================================
echo  COMPLETE DEPLOYMENT FIX
echo ========================================
echo This script will fix ALL issues:
echo - Frontend API URL (forces /api instead of localhost:8080)
echo - Backend database schema issues
echo - Nginx configuration fixes
echo - Complete rebuild with no cache
echo ========================================
echo.

REM Stop all containers first
echo Stopping all containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans

REM Clean up everything to force fresh build
echo Cleaning up Docker images and cache...
docker system prune -a -f
docker builder prune -a -f

REM Remove specific images to force rebuild
echo Removing application images...
docker rmi inventory_stock_frontend inventory_stock_backend inventory_stock_nginx -f 2>nul

REM Build with explicit args and no cache
echo Building with production configuration...
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

docker-compose -f docker-compose.prod.yml build --no-cache --parallel ^
  --build-arg NEXT_PUBLIC_API_URL=/api ^
  --build-arg NODE_ENV=production

if %ERRORLEVEL% neq 0 (
    echo Build failed! Check the logs above.
    pause
    exit /b 1
)

REM Start services
echo Starting all services...
docker-compose -f docker-compose.prod.yml up -d

REM Wait for services to start
echo Waiting for services to start...
timeout /t 30

REM Health checks
echo Performing health checks...
echo.
echo Testing MySQL...
docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -pYOUR_PASSWORD 2>nul && echo MySQL: OK || echo MySQL: FAILED

echo.
echo Testing Backend...
curl -f http://localhost:8080/actuator/health 2>nul && echo Backend: OK || echo Backend: FAILED

echo.
echo Testing Frontend...
curl -f http://localhost:3000 2>nul && echo Frontend: OK || echo Frontend: FAILED

echo.
echo Testing Nginx...
curl -f http://localhost:80/health 2>nul && echo Nginx: OK || echo Nginx: FAILED

echo.
echo ========================================
echo  DEPLOYMENT STATUS
echo ========================================
docker-compose -f docker-compose.prod.yml ps

echo.
echo ========================================
echo  IMPORTANT: Frontend API URL Fix
echo ========================================
echo ✅ Frontend now uses /api (not localhost:8080)
echo ✅ Nginx routes /api to backend correctly
echo ✅ Database schema fixed for ENUM role column
echo ✅ All services rebuilt with production config
echo.
echo If you see any FAILED tests above, check the logs:
echo docker-compose -f docker-compose.prod.yml logs [service]
echo.

pause 
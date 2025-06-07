@echo off
echo 🔄 Fixing Backend Role Enum Issue and Rebuilding...

REM Stop the backend
echo Stopping backend container...
docker-compose -f docker-compose.prod.yml stop backend

REM Remove the old backend image to force rebuild
echo Removing old backend image...
docker rmi inventory_backend_prod 2>nul

REM Build the backend with no cache to ensure migration is included
echo Building backend with migration fix...
docker-compose -f docker-compose.prod.yml build --no-cache backend

REM Start the backend
echo Starting backend...
docker-compose -f docker-compose.prod.yml up -d backend

echo ✅ Backend rebuilt with role enum fix!
echo 📋 Checking backend logs...
docker-compose -f docker-compose.prod.yml logs -f backend 
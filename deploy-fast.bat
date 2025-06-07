@echo off
echo 🚀 Starting fast deployment...

REM Set environment variables for faster builds
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

REM Stop existing containers
echo ⏹️ Stopping existing containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans

REM Build images in parallel
echo 🔨 Building images in parallel...
docker-compose -f docker-compose.prod.yml build --parallel

REM Start services
echo 🚀 Starting services...
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10

REM Check service health
echo 📊 Checking service health...
docker-compose -f docker-compose.prod.yml ps

echo.
echo 🔍 Health checks:
echo Checking MySQL...
docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -p%MYSQL_ROOT_PASSWORD% 2>nul && echo ✅ MySQL is healthy || echo ❌ MySQL is not responding

echo Checking Backend...
curl -s http://localhost:8080/actuator/health >nul 2>&1 && echo ✅ Backend is healthy || echo ❌ Backend is not responding

echo Checking Frontend...
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Frontend is healthy || echo ❌ Frontend is not responding

echo Checking Nginx...
curl -I http://localhost:80 >nul 2>&1 && echo ✅ Nginx is healthy || echo ❌ Nginx is not responding

echo.
echo 📋 Service Logs (last 10 lines):
echo --- MySQL ---
docker-compose -f docker-compose.prod.yml logs --tail=10 mysql

echo --- Backend ---
docker-compose -f docker-compose.prod.yml logs --tail=10 backend

echo --- Frontend ---
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend

echo --- Nginx ---
docker-compose -f docker-compose.prod.yml logs --tail=10 nginx

echo.
echo ✅ Fast deployment completed!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8080
echo 💾 MySQL: localhost:3306
echo 🌍 Main Site: http://localhost:80

echo.
echo 💡 Troubleshooting commands:
echo - docker-compose -f docker-compose.prod.yml logs [service]
echo - docker-compose -f docker-compose.prod.yml restart [service]
echo - docker-compose -f docker-compose.prod.yml ps

pause 
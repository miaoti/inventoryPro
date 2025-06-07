@echo off
echo 🚀 Starting development deployment (faster)...

REM Set environment variables for faster builds
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

REM Only rebuild changed services
echo 🔨 Building only changed services...
docker-compose -f docker-compose.yml build --parallel

REM Start services
echo 🚀 Starting services...
docker-compose -f docker-compose.yml up -d

REM Show status
echo 📊 Development deployment status:
docker-compose -f docker-compose.yml ps

echo ✅ Development deployment completed!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8080  
echo 💾 MySQL: localhost:3307

echo.
echo 💡 Tips for faster development:
echo - Use 'docker-compose logs -f frontend' to watch frontend logs
echo - Use 'docker-compose logs -f backend' to watch backend logs
echo - Use 'docker-compose restart frontend' to restart only frontend
echo - Use 'docker-compose restart backend' to restart only backend

pause 
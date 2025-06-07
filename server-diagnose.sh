#!/bin/bash

echo "🩺 Server Deployment Diagnostics"
echo "================================"

echo
echo "📋 1. Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

echo
echo "📋 2. Checking Docker Compose services..."
cd ~/inventory_app
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml ps
elif [ -f "docker-compose.ci.yml" ]; then
    docker-compose -f docker-compose.ci.yml ps
elif [ -f "docker-compose.yml" ]; then
    docker-compose ps
else
    echo "❌ No docker-compose file found"
fi

echo
echo "🌐 3. Checking port usage..."
netstat -tlnp | grep -E ":(80|3000|8080|3306)"

echo
echo "🔍 4. Checking if nginx container exists..."
docker ps -a | grep nginx

echo
echo "📝 5. Nginx container logs (if exists)..."
NGINX_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep nginx | head -1)
if [ ! -z "$NGINX_CONTAINER" ]; then
    echo "Nginx container: $NGINX_CONTAINER"
    docker logs --tail=20 $NGINX_CONTAINER
else
    echo "❌ No nginx container found"
fi

echo
echo "📝 6. Backend container logs (if exists)..."
BACKEND_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep -E "(backend|inventory.*backend)" | head -1)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    echo "Backend container: $BACKEND_CONTAINER"
    docker logs --tail=10 $BACKEND_CONTAINER
else
    echo "❌ No backend container found"
fi

echo
echo "📝 7. Frontend container logs (if exists)..."
FRONTEND_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep -E "(frontend|inventory.*frontend)" | head -1)
if [ ! -z "$FRONTEND_CONTAINER" ]; then
    echo "Frontend container: $FRONTEND_CONTAINER"
    docker logs --tail=10 $FRONTEND_CONTAINER
else
    echo "❌ No frontend container found"
fi

echo
echo "🔧 8. Docker system info..."
docker system df
echo
echo "Docker version:"
docker --version
docker-compose --version

echo
echo "💾 9. Disk space..."
df -h

echo
echo "🔍 10. Process check..."
ps aux | grep -E "(docker|nginx)" | grep -v grep

echo
echo "📁 11. Current directory files..."
ls -la

echo
echo "🔧 12. Quick fixes to try:"
echo "If nginx container exists but not running:"
echo "  docker start <nginx_container_name>"
echo
echo "If no containers are running:"
echo "  docker-compose up -d"
echo
echo "If containers are in wrong state:"
echo "  docker-compose down && docker-compose up -d"
echo
echo "To restart everything:"
echo "  docker-compose down --remove-orphans && docker-compose up -d"

echo
echo "📊 Diagnosis complete!" 
@echo off
echo 🩺 Running deployment diagnostics...

echo.
echo 📋 Docker status:
docker --version
docker-compose --version

echo.
echo 🐳 Running containers:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 📊 Container resource usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo.
echo 🔍 Service health checks:
echo Testing MySQL connection...
docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -p%MYSQL_ROOT_PASSWORD% 2>nul && echo ✅ MySQL OK || echo ❌ MySQL FAIL

echo Testing Backend health...
curl -s http://localhost:8080/actuator/health >nul 2>&1 && echo ✅ Backend OK || echo ❌ Backend FAIL

echo Testing Frontend...
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Frontend OK || echo ❌ Frontend FAIL

echo Testing Nginx...
curl -I http://localhost:80 >nul 2>&1 && echo ✅ Nginx OK || echo ❌ Nginx FAIL

echo.
echo 📝 Recent error logs:
echo --- MySQL errors ---
docker-compose -f docker-compose.prod.yml logs --tail=5 mysql | findstr -i "error\|fail\|warn"

echo --- Backend errors ---
docker-compose -f docker-compose.prod.yml logs --tail=5 backend | findstr -i "error\|fail\|warn"

echo --- Frontend errors ---
docker-compose -f docker-compose.prod.yml logs --tail=5 frontend | findstr -i "error\|fail\|warn"

echo --- Nginx errors ---
docker-compose -f docker-compose.prod.yml logs --tail=5 nginx | findstr -i "error\|fail\|warn"

echo.
echo 🌐 Network connectivity:
echo Testing port connectivity...
netstat -an | findstr :80 | findstr LISTENING && echo ✅ Port 80 listening || echo ❌ Port 80 not listening
netstat -an | findstr :3000 | findstr LISTENING && echo ✅ Port 3000 listening || echo ❌ Port 3000 not listening
netstat -an | findstr :8080 | findstr LISTENING && echo ✅ Port 8080 listening || echo ❌ Port 8080 not listening
netstat -an | findstr :3306 | findstr LISTENING && echo ✅ Port 3306 listening || echo ❌ Port 3306 not listening

echo.
echo 🔧 Quick fixes:
echo If nginx is failing:
echo   docker-compose -f docker-compose.prod.yml restart nginx
echo.
echo If backend is failing:
echo   docker-compose -f docker-compose.prod.yml restart backend
echo.
echo If frontend is failing:
echo   docker-compose -f docker-compose.prod.yml restart frontend
echo.
echo To view detailed logs:
echo   docker-compose -f docker-compose.prod.yml logs [service_name]

pause 
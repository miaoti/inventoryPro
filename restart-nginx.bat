@echo off
echo 🔄 Restarting Nginx service...

echo Stopping nginx...
docker-compose -f docker-compose.prod.yml stop nginx

echo Starting nginx...
docker-compose -f docker-compose.prod.yml start nginx

echo Waiting for nginx to start...
timeout /t 5

echo Testing nginx...
curl -I http://localhost:80 >nul 2>&1 && echo ✅ Nginx is working! || echo ❌ Nginx still not responding

echo.
echo Nginx status:
docker-compose -f docker-compose.prod.yml ps nginx

echo.
echo Recent nginx logs:
docker-compose -f docker-compose.prod.yml logs --tail=10 nginx

pause 
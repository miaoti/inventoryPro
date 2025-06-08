#!/bin/bash
set -e

echo "🔧 Fixing Nginx 404 Issue..."

echo "1. Checking current service status..."
docker-compose -f docker-compose.prod.yml ps

echo "2. Testing direct frontend access..."
curl -I http://localhost:3000 || echo "Frontend direct access failed"

echo "3. Testing direct backend access..."
curl -I http://localhost:8080/api/actuator/health || echo "Backend direct access failed"

echo "4. Rebuilding and restarting nginx with updated config..."
docker-compose -f docker-compose.prod.yml stop nginx
docker-compose -f docker-compose.prod.yml build nginx
docker-compose -f docker-compose.prod.yml up -d nginx

echo "5. Waiting for nginx to start..."
sleep 10

echo "6. Testing nginx health endpoint..."
curl -I http://localhost/health || echo "Nginx health check failed"

echo "7. Testing main site..."
curl -I http://localhost/ || echo "Main site still failing"

echo "8. Checking nginx logs..."
docker-compose -f docker-compose.prod.yml logs nginx --tail=10

echo "9. Checking nginx configuration..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

echo "10. Final verification..."
echo "Services status:"
docker-compose -f docker-compose.prod.yml ps

if curl -s http://localhost/ >/dev/null; then
  echo "✅ SUCCESS: Main site is now working!"
else
  echo "❌ Main site still returning 404"
  echo "Nginx error logs:"
  docker-compose -f docker-compose.prod.yml logs nginx --tail=20
  echo "Frontend logs:"
  docker-compose -f docker-compose.prod.yml logs frontend --tail=10
fi 
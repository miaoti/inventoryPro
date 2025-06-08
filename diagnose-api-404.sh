#!/bin/bash
echo "🔍 Diagnosing API 404 Issues..."

echo "1. Checking container status:"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n2. Testing direct backend access (bypassing nginx):"
echo "Testing backend health:"
curl -v http://localhost:8080/api/actuator/health 2>&1 || echo "❌ Backend health failed"

echo -e "\nTesting backend auth endpoint directly:"
curl -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' 2>&1 || echo "❌ Direct backend auth failed"

echo -e "\n3. Testing nginx routing:"
echo "Testing nginx to backend routing:"
curl -v -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' 2>&1 || echo "❌ Nginx routing failed"

echo -e "\n4. Checking backend logs for context path:"
echo "Backend logs (last 20 lines):"
docker-compose -f docker-compose.prod.yml logs backend --tail=20

echo -e "\n5. Checking what port the backend is actually listening on:"
echo "Backend process info:"
docker-compose -f docker-compose.prod.yml exec backend netstat -tlnp 2>/dev/null || echo "netstat not available, trying ss:"
docker-compose -f docker-compose.prod.yml exec backend ss -tlnp 2>/dev/null || echo "ss not available"

echo -e "\n6. Testing if backend is responding on expected paths:"
echo "Testing /api/actuator/health:"
docker-compose -f docker-compose.prod.yml exec backend curl -s http://localhost:8080/api/actuator/health || echo "❌ Internal health check failed"

echo -e "\nTesting /actuator/health (without /api):"
docker-compose -f docker-compose.prod.yml exec backend curl -s http://localhost:8080/actuator/health || echo "❌ Internal health check without /api failed"

echo -e "\n7. Checking nginx access logs:"
echo "Recent nginx access logs:"
docker-compose -f docker-compose.prod.yml logs nginx --tail=10

echo -e "\n8. Testing exact endpoint paths:"
echo "Testing various auth endpoint combinations:"
echo "1. /api/auth/login (expected):"
curl -I http://localhost:8080/api/auth/login 2>/dev/null | head -1 || echo "Failed"

echo "2. /auth/login (user suggested):"
curl -I http://localhost:8080/auth/login 2>/dev/null | head -1 || echo "Failed"

echo "3. Through nginx /api/auth/login:"
curl -I http://localhost/api/auth/login 2>/dev/null | head -1 || echo "Failed"

echo -e "\n9. Backend environment check:"
echo "Checking backend environment variables:"
docker-compose -f docker-compose.prod.yml exec backend env | grep -E "(SPRING|SERVER|CONTEXT)" || echo "No Spring/Server env vars found"

echo -e "\n✅ Diagnostic complete!" 
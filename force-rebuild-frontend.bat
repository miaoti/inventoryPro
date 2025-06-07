@echo off
echo 🔧 FORCE REBUILD Frontend with Correct API URL
echo ===============================================

echo 🛑 This will completely rebuild the frontend container with /api instead of localhost:8080

REM Set build variables
set DOCKER_BUILDKIT=1

echo 📋 Step 1: Stop and remove existing frontend container...
docker stop inventory_frontend_prod 2>nul
docker rm inventory_frontend_prod 2>nul

echo 📋 Step 2: Remove existing frontend image to force rebuild...
docker rmi ghcr.io/miaoti/inventorypro/inventory-frontend:latest 2>nul
docker rmi inventory_stock_frontend 2>nul
docker rmi inventory_stock-frontend 2>nul

echo 📋 Step 3: Build frontend with CORRECT API URL...
cd inventory_frontend
docker build --no-cache ^
  --build-arg NEXT_PUBLIC_API_URL=/api ^
  --build-arg NODE_ENV=production ^
  -t inventory_frontend_fixed .
cd ..

echo 📋 Step 4: Start frontend container with fixed image...
docker run -d ^
  --name inventory_frontend_prod ^
  --network inventory_stock_inventory_network ^
  -p 3000:3000 ^
  -e NEXT_PUBLIC_API_URL=/api ^
  -e NODE_ENV=production ^
  --restart unless-stopped ^
  inventory_frontend_fixed

echo 📋 Step 5: Wait for frontend to start...
timeout /t 10

echo 📋 Step 6: Test the fix...
echo Testing if frontend is accessible...
curl -I http://localhost:3000 2>nul && echo ✅ Frontend is running || echo ❌ Frontend failed to start

echo.
echo 🔍 Check the browser now - it should call /api instead of localhost:8080
echo.
echo 📝 To verify the fix worked:
echo 1. Open browser developer tools
echo 2. Go to Network tab
echo 3. Try to login
echo 4. Check that API calls go to /api/auth/login NOT localhost:8080/api/auth/login

pause 
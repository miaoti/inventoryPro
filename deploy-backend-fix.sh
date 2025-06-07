#!/bin/bash
set -e

echo "🔄 Fixing Backend Role Enum Issue and Rebuilding..."

# Stop the backend
echo "Stopping backend container..."
docker-compose -f docker-compose.prod.yml stop backend

# Remove the old backend image to force rebuild
echo "Removing old backend image..."
docker rmi inventory_backend_prod 2>/dev/null || true

# Build the backend with no cache to ensure migration is included
echo "Building backend with migration fix..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Start the backend
echo "Starting backend..."
docker-compose -f docker-compose.prod.yml up -d backend

echo "✅ Backend rebuilt with role enum fix!"
echo "📋 Checking backend status..."

# Wait a moment for startup
sleep 5

# Check backend health
echo "Checking backend health..."
timeout 60 bash -c 'until curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; do echo "⏳ Waiting for backend..."; sleep 3; done' && echo "✅ Backend is healthy!" || echo "❌ Backend health check failed"

echo "📋 Recent backend logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20 backend 
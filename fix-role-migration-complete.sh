#!/bin/bash
set -e

echo "🔧 Fixing Failed Role Migration and Redeploying..."

# Stop all services
echo "1. Stopping all services..."
docker-compose -f docker-compose.prod.yml down

echo "2. Cleaning up failed migration in database..."
# Connect to MySQL and repair the failed migration
docker-compose -f docker-compose.prod.yml up -d mysql

# Wait for MySQL to be ready
echo "Waiting for MySQL to start..."
sleep 15

# Repair the failed migration by removing the failed entry from flyway_schema_history
echo "Repairing Flyway schema history..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
USE inventory_db;
-- Remove the failed migration record
DELETE FROM flyway_schema_history WHERE version = '17';
-- Show current migration status
SELECT version, description, type, script, success FROM flyway_schema_history ORDER BY installed_rank;
" 2>/dev/null || echo "Migration repair attempted"

echo "3. Rebuilding backend with corrected migration..."
# Remove old backend image to force rebuild
docker rmi inventory_backend_prod 2>/dev/null || true

# Build backend with no cache to include V18 migration
docker-compose -f docker-compose.prod.yml build --no-cache backend

echo "4. Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "5. Waiting for services to start..."
sleep 30

echo "6. Checking service health..."

# Check MySQL
for i in {1..10}; do
  if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
    echo "✅ MySQL is healthy"
    break
  fi
  echo "⏳ Waiting for MySQL... ($i/10)"
  sleep 5
done

# Check Backend with extended timeout for migration
echo "Checking Backend (may take time for migration)..."
for i in {1..25}; do
  if curl -f http://localhost:8080/actuator/health 2>/dev/null; then
    echo "✅ Backend is healthy!"
    break
  fi
  echo "⏳ Waiting for Backend (migration in progress)... ($i/25)"
  sleep 10
done

# Check Frontend
for i in {1..8}; do
  if curl -f http://localhost:3000 2>/dev/null; then
    echo "✅ Frontend is healthy!"
    break
  fi
  echo "⏳ Waiting for Frontend... ($i/8)"
  sleep 5
done

# Check Nginx
for i in {1..6}; do
  if curl -f http://localhost:80 2>/dev/null; then
    echo "✅ Nginx is healthy!"
    break
  fi
  echo "⏳ Waiting for Nginx... ($i/6)"
  sleep 5
done

echo "7. Final verification..."
echo "Container status:"
docker-compose -f docker-compose.prod.yml ps

echo "Testing key endpoints:"
echo "✅ Application health check:"
if curl -s http://localhost:80 >/dev/null; then
  echo "✅ SUCCESS: Application is running!"
  echo "🌐 Your inventory app is live at: http://129.146.49.129"
else
  echo "❌ Application still not responding"
  echo "Backend logs:"
  docker-compose -f docker-compose.prod.yml logs backend --tail=10
fi

echo "✅ Role migration fix deployment completed!" 
#!/bin/bash
echo "🔧 FIXING SERVER DIRECTORY STRUCTURE"
echo "===================================="
echo

echo "Step 1: Checking current directory structure..."
ls -la ~/inventory/
echo

echo "Step 2: Stopping all containers..."
cd ~/inventory
docker-compose -f docker-compose.prod.yml down --remove-orphans || true
docker stop $(docker ps -aq) 2>/dev/null || true

echo "Step 3: Backing up current directory..."
mv ~/inventory ~/inventory_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

echo "Step 4: Cloning fresh repository..."
cd ~
git clone https://github.com/miaoti/inventoryPro.git inventory
cd ~/inventory

echo "Step 5: Checking directory structure..."
echo "Current directories:"
ls -la
echo
echo "Looking for backend directory:"
find . -name "*.jar" -o -name "pom.xml" -o -name "build.gradle" | head -5
echo
echo "Looking for frontend directory:"
find . -name "package.json" -o -name "next.config.js" | head -5

echo "Step 6: Creating environment file..."
cat > .env << 'EOF'
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your_strong_password_here
MYSQL_DATABASE=inventory_db
MYSQL_USER=inventory_user
MYSQL_PASSWORD=your_strong_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure

# Email Configuration
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password_here

# Environment
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production

# Frontend API URL (for production)
NEXT_PUBLIC_API_URL=/api
EOF

echo "Step 7: Checking if docker-compose file exists..."
if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ docker-compose.prod.yml found"
    
    # Remove the version line that's causing warnings
    sed -i '/^version:/d' docker-compose.prod.yml
    
    echo "Step 8: Building services locally (this will take a few minutes)..."
    export DOCKER_BUILDKIT=1
    docker-compose -f docker-compose.prod.yml build --no-cache --pull
    
    echo "Step 9: Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "Step 10: Waiting for services to start..."
    sleep 30
    
    echo "Step 11: Checking service status..."
    docker-compose -f docker-compose.prod.yml ps
    
    echo "Step 12: Testing connections..."
    curl -I http://localhost:80/health && echo "✅ Port 80 OK" || echo "❌ Port 80 FAILED"
    curl -I http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"
    curl -I http://localhost:8080/actuator/health && echo "✅ Backend OK" || echo "❌ Backend FAILED"
    
else
    echo "❌ docker-compose.prod.yml not found in repository"
    echo "Available files:"
    ls -la
    echo
    echo "Please check the repository structure"
fi

echo
echo "🔍 FINAL DIAGNOSIS:"
echo "=================="
if curl -s http://localhost:80/health >/dev/null; then
    echo "✅ SUCCESS: Port 80 is now working!"
    echo "🌐 Your site should be accessible at: http://129.146.49.129"
else
    echo "❌ Still having issues. Let's check the logs:"
    echo "Frontend logs:"
    docker-compose -f docker-compose.prod.yml logs frontend --tail=10
    echo
    echo "Backend logs:"
    docker-compose -f docker-compose.prod.yml logs backend --tail=10
    echo
    echo "Nginx logs:"
    docker-compose -f docker-compose.prod.yml logs nginx --tail=10
fi 
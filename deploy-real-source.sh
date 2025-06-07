#!/bin/bash
echo "🚀 DEPLOYING YOUR REAL INVENTORY APPLICATION"
echo "============================================"
echo "Getting your actual Next.js frontend and Spring Boot backend..."
echo

cd ~/inventory

echo "Step 1: Stopping placeholder containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "Step 2: Checking for your real source code..."
echo "Current inventory_app contents:"
if [ -d ~/inventory_app ]; then
    find ~/inventory_app -type f -name "*.java" -o -name "package.json" -o -name "pom.xml" -o -name "Dockerfile" | head -20
else
    echo "No inventory_app directory found"
fi

echo
echo "Let's get your real source code. Choose option:"
echo "1. GitHub with SSH key"
echo "2. GitHub with personal access token" 
echo "3. Manual source copy from local machine"
echo

echo "Step 3: Attempting to clone your real repository..."

# Try SSH first
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH key works, cloning with SSH..."
    git clone git@github.com:miaoti/inventoryPro.git real_source
elif [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ Using GitHub token..."
    git clone https://$GITHUB_TOKEN@github.com/miaoti/inventoryPro.git real_source
else
    echo "❌ No SSH key or token available"
    echo
    echo "SOLUTION: Copy your real source code manually"
    echo "==========================================="
    echo "On your local Windows machine, run:"
    echo "scp -r ./inventory ubuntu@129.146.49.129:~/real_source/inventory"
    echo "scp -r ./inventory_frontend ubuntu@129.146.49.129:~/real_source/inventory_frontend"
    echo "scp -r ./nginx ubuntu@129.146.49.129:~/real_source/nginx"
    echo "scp -r ./mysql ubuntu@129.146.49.129:~/real_source/mysql"
    echo "scp ./docker-compose.prod.yml ubuntu@129.146.49.129:~/real_source/"
    echo "scp ./.env ubuntu@129.146.49.129:~/real_source/"
    echo
    echo "Alternative: Create archive and transfer"
    echo "tar -czf inventory-source.tar.gz inventory inventory_frontend nginx mysql docker-compose.prod.yml .env"
    echo "scp inventory-source.tar.gz ubuntu@129.146.49.129:~/"
    echo "Then on server: tar -xzf inventory-source.tar.gz"
    echo
    read -p "Press Enter after you've copied your source code, or type 'skip' to use current setup: " response
    
    if [ "$response" != "skip" ]; then
        if [ -f ~/inventory-source.tar.gz ]; then
            echo "Found archive, extracting..."
            tar -xzf ~/inventory-source.tar.gz -C ~/
            mv ~/inventory ~/real_source 2>/dev/null || true
        elif [ -d ~/real_source ]; then
            echo "Found real_source directory"
        else
            echo "Creating placeholder structure - please copy your real code"
            mkdir -p ~/real_source
        fi
    fi
fi

echo "Step 4: Setting up real source structure..."
if [ -d ~/real_source ]; then
    echo "✅ Found real source, checking structure..."
    ls -la ~/real_source/
    
    # Look for backend
    if [ -d ~/real_source/inventory ]; then
        echo "✅ Found Spring Boot backend in /inventory"
        BACKEND_PATH="~/real_source/inventory"
    elif find ~/real_source -name "pom.xml" | head -1; then
        BACKEND_PATH=$(find ~/real_source -name "pom.xml" | head -1 | xargs dirname)
        echo "✅ Found Spring Boot backend in $BACKEND_PATH"
    fi
    
    # Look for frontend
    if [ -d ~/real_source/inventory_frontend ]; then
        echo "✅ Found Next.js frontend in /inventory_frontend"
        FRONTEND_PATH="~/real_source/inventory_frontend"
    elif find ~/real_source -name "package.json" | head -1; then
        FRONTEND_PATH=$(find ~/real_source -name "package.json" | head -1 | xargs dirname)
        echo "✅ Found Next.js frontend in $FRONTEND_PATH"
    fi
    
    # Copy real source to working directory
    echo "Copying real source to working directory..."
    if [ -n "$BACKEND_PATH" ]; then
        cp -r $BACKEND_PATH ~/inventory/backend/
    fi
    if [ -n "$FRONTEND_PATH" ]; then
        cp -r $FRONTEND_PATH ~/inventory/frontend/
    fi
    
    # Copy other files
    cp ~/real_source/docker-compose.prod.yml ~/inventory/ 2>/dev/null || true
    cp ~/real_source/.env ~/inventory/ 2>/dev/null || true
    cp -r ~/real_source/nginx ~/inventory/ 2>/dev/null || true
    cp -r ~/real_source/mysql ~/inventory/ 2>/dev/null || true
fi

echo "Step 5: Verifying real application structure..."
echo "Backend structure:"
if [ -f ~/inventory/backend/pom.xml ]; then
    echo "✅ Found pom.xml"
    grep -A 3 -B 3 "artifactId" ~/inventory/backend/pom.xml | head -10
elif [ -f ~/inventory/backend/build.gradle ]; then
    echo "✅ Found build.gradle"
else
    echo "❌ No backend build file found"
fi

echo
echo "Frontend structure:"
if [ -f ~/inventory/frontend/package.json ]; then
    echo "✅ Found package.json"
    grep -A 5 "name\|scripts" ~/inventory/frontend/package.json | head -10
elif [ -f ~/inventory/frontend/next.config.js ]; then
    echo "✅ Found next.config.js"
else
    echo "❌ No frontend config found"
fi

echo
echo "Step 6: Using your real docker-compose.prod.yml..."
if [ -f ~/inventory/docker-compose.prod.yml ]; then
    echo "✅ Using your real docker-compose configuration"
else
    echo "Creating docker-compose from our fixed version..."
    # Use the corrected version from our previous work
    cat > ~/inventory/docker-compose.prod.yml << 'EOF'
services:
  mysql:
    image: mysql:8.0
    container_name: inventory_mysql_prod
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=512M
    networks:
      - inventory_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: inventory_backend_prod
    environment:
      SPRING_PROFILES_ACTIVE: production
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/${MYSQL_DATABASE}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: ${MYSQL_USER}
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - inventory_network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
        NEXT_PUBLIC_API_URL: /api
    container_name: inventory_frontend_prod
    environment:
      NEXT_PUBLIC_API_URL: /api
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - inventory_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: inventory_nginx_prod
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
    networks:
      - inventory_network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  inventory_network:
    driver: bridge
EOF
fi

echo "Step 7: Building and deploying your REAL application..."
cd ~/inventory

# Ensure environment file exists
if [ ! -f .env ]; then
    echo "Creating production environment file..."
    cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=StrongRootPass123!
MYSQL_DATABASE=inventory_db
MYSQL_USER=inventory_user
MYSQL_PASSWORD=StrongUserPass123!
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_at_least_64_characters
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password_here
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production
NEXT_PUBLIC_API_URL=/api
EOF
fi

echo "Building your real application..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "Starting your real application..."
docker-compose -f docker-compose.prod.yml up -d

echo "Step 8: Waiting for your real application to start..."
sleep 60

echo "Step 9: Testing your real application..."
echo "Testing Backend Health:"
curl -f http://localhost:8080/actuator/health && echo "✅ Real Backend OK" || echo "❌ Backend Failed"

echo "Testing Frontend:"
curl -f http://localhost:3000 && echo "✅ Real Frontend OK" || echo "❌ Frontend Failed"

echo "Testing Full Application:"
curl -f http://localhost:80 && echo "✅ Full App OK" || echo "❌ App Failed"

echo
echo "📋 Real Application Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "🎉 REAL APPLICATION DEPLOYMENT:"
echo "==============================="
if curl -s http://localhost:80 >/dev/null; then
    echo "✅ SUCCESS! Your REAL inventory application is running!"
    echo "🌐 Access your app: http://129.146.49.129"
    echo "📱 This is your actual Next.js frontend"
    echo "🔧 This is your actual Spring Boot backend"
    echo "💾 This is your actual MySQL database"
else
    echo "❌ Your real application needs debugging:"
    echo "Backend logs:"
    docker-compose -f docker-compose.prod.yml logs backend --tail=10
    echo "Frontend logs:"
    docker-compose -f docker-compose.prod.yml logs frontend --tail=10
fi 
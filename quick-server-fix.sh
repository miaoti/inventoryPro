#!/bin/bash
echo "🚨 QUICK SERVER FIX - No GitHub Auth Required"
echo "============================================="
echo

echo "Step 1: Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker system prune -f

echo "Step 2: Creating inventory directory..."
mkdir -p ~/inventory
cd ~/inventory

echo "Step 3: Checking existing files..."
if [ -d ~/inventory_app ]; then
    echo "Found existing inventory_app directory, copying files..."
    cp -r ~/inventory_app/* . 2>/dev/null || true
fi

echo "Step 4: Creating docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'EOF'
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
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s

  backend:
    image: ghcr.io/miaoti/inventorypro/inventory-backend:latest
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
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/actuator/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 45s

  frontend:
    image: ghcr.io/miaoti/inventorypro/frontend:latest
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
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s

  nginx:
    image: nginx:alpine
    container_name: inventory_nginx_prod
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend
    networks:
      - inventory_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M
        reservations:
          memory: 64M
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 15s
      timeout: 3s
      retries: 3
      start_period: 10s

volumes:
  mysql_data:

networks:
  inventory_network:
    driver: bridge
EOF

echo "Step 5: Creating nginx.conf..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    # Basic health check endpoint
    server {
        listen 80;
        server_name localhost;
        
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    server {
        listen 80;
        server_name _;
        client_max_body_size 20M;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Backend API routes
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeout settings
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # CORS headers for API
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        }

        # Handle preflight requests
        location ~ ^/api/.*$ {
            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin *;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
                add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
                add_header Content-Type text/plain;
                add_header Content-Length 0;
                return 204;
            }
        }
    }
}
EOF

echo "Step 6: Creating MySQL init directory and scripts..."
mkdir -p mysql/init
cat > mysql/init/01-init.sql << 'EOF'
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (username, email, password, role) 
VALUES ('admin', 'admin@inventory.com', '$2a$10$NYFZ/8WaQ3Qb6FCs.00jce4nxX9w7Q2YO1yxasLN1/XMJnSfOhTKu', 'admin');
EOF

cat > mysql/init/02-fix-role-enum.sql << 'EOF'
-- Fix role column type to be ENUM instead of VARCHAR
USE inventory_db;

-- Check if the role column exists and fix it
ALTER TABLE users MODIFY COLUMN role ENUM('owner', 'admin', 'user') NOT NULL DEFAULT 'user';

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EOF

echo "Step 7: Creating environment file..."
cat > .env << 'EOF'
# MySQL Configuration
MYSQL_ROOT_PASSWORD=StrongRootPass123!
MYSQL_DATABASE=inventory_db
MYSQL_USER=inventory_user
MYSQL_PASSWORD=StrongUserPass123!

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure_at_least_64_characters

# Email Configuration
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password_here

# Environment
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production

# Frontend API URL (for production)
NEXT_PUBLIC_API_URL=/api
EOF

echo "Step 8: Starting services..."
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

echo "Step 9: Waiting for services to start..."
sleep 45

echo "Step 10: Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "Step 11: Testing connections..."
echo "Testing MySQL..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -pStrongRootPass123! && echo "✅ MySQL OK" || echo "❌ MySQL FAILED"

echo "Testing Backend..."
curl -f http://localhost:8080/actuator/health && echo "✅ Backend OK" || echo "❌ Backend FAILED"

echo "Testing Frontend..."
curl -f http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"

echo "Testing Nginx..."
curl -f http://localhost:80/health && echo "✅ Nginx OK" || echo "❌ Nginx FAILED"

echo
echo "🔍 FINAL TEST:"
echo "=============="
if curl -s http://localhost:80/health >/dev/null; then
    echo "✅ SUCCESS: Port 80 is working!"
    echo "🌐 Your site should be accessible at: http://129.146.49.129"
    echo
    echo "🔑 Default login credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
else
    echo "❌ Still having issues. Checking logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=10
fi

echo
echo "📋 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 
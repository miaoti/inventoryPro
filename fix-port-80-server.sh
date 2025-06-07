#!/bin/bash

echo "🔧 FIXING PORT 80 ISSUES ON SERVER"
echo "=================================="

echo "📋 Step 1: Fix nginx configuration..."
cd ~/inventory_app

# Create correct nginx config
cat > nginx/nginx.conf << 'EOF'
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

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Backend API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "📋 Step 2: Fix server firewall..."
# Add iptables rules
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

# Save iptables rules
sudo iptables-save > /tmp/iptables.rules
sudo cp /tmp/iptables.rules /etc/iptables/rules.v4 2>/dev/null || true

echo "📋 Step 3: Restart nginx container..."
docker stop inventory_nginx_prod 2>/dev/null || true
docker rm inventory_nginx_prod 2>/dev/null || true

# Start nginx with correct config
docker run -d \
  --name inventory_nginx_prod \
  --network inventory_app_inventory_network \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf \
  --restart unless-stopped \
  nginx:alpine

echo "📋 Step 4: Wait for nginx to start..."
sleep 5

echo "📋 Step 5: Test everything..."
echo "Testing nginx health endpoint..."
curl -I http://localhost:80/health && echo "✅ Nginx health OK" || echo "❌ Nginx health FAILED"

echo "Testing nginx to backend proxy..."
curl -I http://localhost:80/api/actuator/health && echo "✅ Backend proxy OK" || echo "❌ Backend proxy FAILED"

echo "Testing direct backend..."
curl -I http://localhost:8080/actuator/health && echo "✅ Backend direct OK" || echo "❌ Backend direct FAILED"

echo "Testing frontend..."
curl -I http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"

echo
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "🌐 Port Status:"
sudo netstat -tlnp | grep -E ":(80|3000|8080)" || netstat -tlnp | grep -E ":(80|3000|8080)"

echo
echo "✅ Server fixes completed!"
echo "🔍 Now test external access: curl -I http://129.146.49.129:80" 
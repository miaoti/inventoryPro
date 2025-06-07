#!/bin/bash
echo "🔧 FIXING 502 BAD GATEWAY ERROR"
echo "==============================="
echo "Frontend container is crashing - fixing nginx configuration..."
echo

cd ~/inventory

echo "Step 1: Checking container logs..."
echo "Frontend logs:"
docker logs inventory_frontend_prod --tail=20
echo
echo "Nginx logs:"
docker logs inventory_nginx_prod --tail=10

echo
echo "Step 2: Stopping services to fix frontend..."
docker-compose -f docker-compose.prod.yml stop frontend nginx

echo "Step 3: Fixing frontend nginx configuration..."
# The issue is the nginx config inside the frontend container
cat > frontend/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 3000;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Health check
        location /health {
            return 200 "frontend healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "Step 4: Alternative - Create simpler frontend without custom nginx config..."
cat > frontend/Dockerfile << 'EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 3000
# Use default nginx config but change port
RUN sed -i 's/listen       80;/listen       3000;/' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
EOF

echo "Step 5: Rebuilding frontend container..."
docker-compose -f docker-compose.prod.yml build frontend

echo "Step 6: Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Step 7: Waiting for containers to start..."
sleep 20

echo "Step 8: Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "Step 9: Testing connections..."
echo "Testing Frontend directly (port 3000):"
curl -f http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"

echo "Testing Backend directly (port 8080):"
curl -f http://localhost:8080 && echo "✅ Backend OK" || echo "❌ Backend FAILED"

echo "Testing Nginx (port 80):"
curl -f http://localhost:80 && echo "✅ Nginx OK" || echo "❌ Nginx FAILED"

echo
echo "Step 10: If still failing, try minimal approach..."
if ! curl -s http://localhost:80 >/dev/null; then
    echo "Still failing. Creating ultra-simple frontend..."
    
    # Stop everything
    docker-compose -f docker-compose.prod.yml down
    
    # Create minimal frontend without custom nginx config
    cat > frontend/Dockerfile << 'EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # Update docker-compose to use port 80 for frontend
    sed -i 's/- "3000:3000"/- "3000:80"/' docker-compose.prod.yml
    
    # Update nginx config to point to correct frontend port
    sed -i 's/server frontend:3000;/server frontend:80;/' nginx.conf
    
    echo "Rebuilding with minimal config..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    sleep 30
    
    echo "Testing minimal setup..."
    curl -f http://localhost:80 && echo "✅ SUCCESS!" || echo "❌ Still failed"
fi

echo
echo "🔍 DIAGNOSIS:"
echo "============="
if curl -s http://localhost:80 >/dev/null; then
    echo "🎉 SUCCESS! 502 error fixed!"
    echo "🌐 Your site: http://129.146.49.129"
else
    echo "❌ Still having issues. Debug info:"
    echo "Container status:"
    docker ps
    echo
    echo "Frontend logs:"
    docker logs inventory_frontend_prod --tail=10
    echo
    echo "Nginx logs:"
    docker logs inventory_nginx_prod --tail=10
fi 
#!/bin/bash
echo "🔍 Checking actual nginx configuration in container..."

# Check what nginx config is actually running
echo "Current nginx.conf in container:"
docker exec inventory_nginx_prod cat /etc/nginx/nginx.conf | grep -A 10 -B 2 "location /api/"

echo ""
echo "🔧 Force rebuilding nginx container with latest config..."
docker-compose -f docker-compose.prod.yml build --no-cache nginx
docker-compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "✅ Nginx container rebuilt and restarted!" 
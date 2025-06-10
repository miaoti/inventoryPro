#!/bin/bash

# Deploy script with HTTPS support for camera functionality

echo "🔧 Setting up HTTPS deployment for inventory system..."

# Generate SSL certificates if they don't exist
if [ ! -f "nginx/ssl/server.crt" ] || [ ! -f "nginx/ssl/server.key" ]; then
    echo "📜 Generating SSL certificates..."
    bash generate-ssl-cert.sh
else
    echo "✅ SSL certificates already exist"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start with HTTPS support
echo "🚀 Starting deployment with HTTPS support..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check health
echo "🏥 Checking service health..."
echo "HTTP Health check:"
curl -f http://localhost:80/health || echo "❌ HTTP health check failed"

echo "HTTPS Health check:"
curl -k -f https://localhost:443/health || echo "❌ HTTPS health check failed"

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Camera Scanner Access:"
echo "   HTTP:  http://your-server-ip/scanner (will redirect to HTTPS)"
echo "   HTTPS: https://your-server-ip/scanner (camera will work here)"
echo ""
echo "🌐 Other Pages (work on both HTTP and HTTPS):"
echo "   HTTP:  http://your-server-ip/"
echo "   HTTPS: https://your-server-ip/"
echo ""
echo "⚠️  Note: You'll see a security warning for self-signed certificates."
echo "   Click 'Advanced' and 'Proceed to site' to continue."
echo ""
echo "🔧 SSH Access Fix:"
echo "   If you need SSH access, extract the public key:"
echo "   ssh-keygen -y -f ssh-key-2025-06-06.key > ssh-key-2025-06-06.key.pub"
echo "   Then add it to your Oracle instance authorized_keys." 
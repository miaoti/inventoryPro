#!/bin/bash

echo "🚀 Starting fast deployment..."

# Set environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Stop existing containers without waiting
echo "⏹️ Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans &

# Build images in parallel
echo "🔨 Building images in parallel..."
docker-compose -f docker-compose.prod.yml build --parallel --no-cache &
BUILD_PID=$!

# Wait for containers to stop
wait

# Wait for build to complete
wait $BUILD_PID

# Start services with dependency order
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Show status
echo "📊 Deployment status:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Fast deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8080"
echo "💾 MySQL: localhost:3306" 
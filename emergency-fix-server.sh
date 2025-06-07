#!/bin/bash
echo "🚨 EMERGENCY SERVER FIX - PORT 80 CONNECTION REFUSED"
echo "======================================================"
echo

echo "Step 1: Stopping all Docker services..."
cd ~/inventory
docker-compose -f docker-compose.prod.yml down --remove-orphans || true
docker stop $(docker ps -aq) 2>/dev/null || true

echo "Step 2: Killing any processes on port 80..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 443/tcp 2>/dev/null || true

echo "Step 3: Checking UFW firewall..."
sudo ufw status
echo "Opening ports in UFW..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable

echo "Step 4: Configuring iptables..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

echo "Step 5: Restarting Docker service..."
sudo systemctl restart docker
sleep 5

echo "Step 6: Checking Docker status..."
sudo systemctl status docker --no-pager

echo "Step 7: Cleaning Docker system..."
docker system prune -f
docker network prune -f

echo "Step 8: Rebuilding with fresh start..."
cd ~/inventory
export DOCKER_BUILDKIT=1

# Force rebuild all services
docker-compose -f docker-compose.prod.yml build --no-cache --pull

echo "Step 9: Starting services in order..."
# Start MySQL first
docker-compose -f docker-compose.prod.yml up -d mysql
echo "Waiting for MySQL to be ready..."
sleep 30

# Start backend
docker-compose -f docker-compose.prod.yml up -d backend  
echo "Waiting for Backend to be ready..."
sleep 20

# Start frontend
docker-compose -f docker-compose.prod.yml up -d frontend
echo "Waiting for Frontend to be ready..."
sleep 15

# Start nginx last
docker-compose -f docker-compose.prod.yml up -d nginx
echo "Waiting for Nginx to be ready..."
sleep 10

echo "Step 10: Checking container status..."
docker-compose -f docker-compose.prod.yml ps

echo "Step 11: Checking port bindings..."
netstat -tlnp | grep ':80\|:3000\|:8080\|:3306'

echo "Step 12: Testing connections..."
echo "Testing Frontend (port 3000)..."
curl -I http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend FAILED"

echo "Testing Backend (port 8080)..."
curl -I http://localhost:8080/actuator/health && echo "✅ Backend OK" || echo "❌ Backend FAILED"

echo "Testing Nginx (port 80)..."
curl -I http://localhost:80/health && echo "✅ Nginx OK" || echo "❌ Nginx FAILED"

echo "Step 13: Checking Nginx logs for errors..."
docker logs inventory_nginx_prod --tail=20

echo "Step 14: Final network test..."
echo "Internal network test:"
docker exec inventory_nginx_prod wget -qO- http://frontend:3000 >/dev/null && echo "✅ Nginx -> Frontend OK" || echo "❌ Nginx -> Frontend FAILED"
docker exec inventory_nginx_prod wget -qO- http://backend:8080/actuator/health >/dev/null && echo "✅ Nginx -> Backend OK" || echo "❌ Nginx -> Backend FAILED"

echo
echo "======================================================"
echo "🔍 DIAGNOSIS RESULTS:"
echo "======================================================"
if curl -s http://localhost:80/health >/dev/null; then
    echo "✅ SUCCESS: Port 80 is now accessible!"
    echo "🌐 Try accessing: http://129.146.49.129"
    echo
    echo "⚠️  If external access still fails, check Oracle Cloud:"
    echo "   1. Security Groups (allow ports 80, 443, 3000, 8080)"
    echo "   2. Network Security Lists"
    echo "   3. Route Tables"
else
    echo "❌ Port 80 still not accessible. Check logs above."
    echo "📋 Container status:"
    docker-compose -f docker-compose.prod.yml ps
    echo
    echo "📝 Next steps:"
    echo "1. Check container logs: docker-compose -f docker-compose.prod.yml logs nginx"
    echo "2. Verify nginx config: docker exec inventory_nginx_prod nginx -t"
    echo "3. Check if containers can communicate internally"
fi

echo
echo "🏁 Emergency fix completed!" 
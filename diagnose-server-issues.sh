#!/bin/bash
echo "========================================="
echo "  SERVER DIAGNOSIS SCRIPT"
echo "========================================="
echo

echo "1. CHECKING DOCKER CONTAINERS STATUS:"
echo "------------------------------------"
docker ps -a
echo

echo "2. CHECKING DOCKER COMPOSE SERVICES:"
echo "------------------------------------"
cd ~/inventory 2>/dev/null && docker-compose -f docker-compose.prod.yml ps
echo

echo "3. CHECKING NGINX CONTAINER SPECIFICALLY:"
echo "----------------------------------------"
docker logs inventory_nginx_prod --tail=20 2>/dev/null || echo "Nginx container not found or not running"
echo

echo "4. CHECKING PORT BINDING:"
echo "------------------------"
netstat -tlnp | grep :80 || echo "Nothing listening on port 80"
echo

echo "5. CHECKING UDEV FIREWALL STATUS:"
echo "--------------------------------"
sudo ufw status
echo

echo "6. CHECKING IPTABLES RULES:"
echo "---------------------------"
sudo iptables -L -n | grep 80 || echo "No iptables rules for port 80"
echo

echo "7. CHECKING IF ANY PROCESS IS USING PORT 80:"
echo "--------------------------------------------"
sudo lsof -i :80 || echo "No process using port 80"
echo

echo "8. CHECKING DOCKER NETWORKS:"
echo "----------------------------"
docker network ls
echo

echo "9. CHECKING SYSTEM SERVICES:"
echo "----------------------------"
systemctl status docker
echo

echo "10. CHECKING RECENT DOCKER LOGS:"
echo "-------------------------------"
cd ~/inventory 2>/dev/null && docker-compose -f docker-compose.prod.yml logs --tail=10 nginx 2>/dev/null || echo "Cannot get nginx logs"
echo

echo "11. TESTING INTERNAL CONNECTIONS:"
echo "--------------------------------"
curl -s http://localhost:3000 >/dev/null && echo "✅ Frontend (3000) reachable" || echo "❌ Frontend (3000) failed"
curl -s http://localhost:8080/actuator/health >/dev/null && echo "✅ Backend (8080) reachable" || echo "❌ Backend (8080) failed"
curl -s http://localhost:80/health >/dev/null && echo "✅ Nginx (80) reachable" || echo "❌ Nginx (80) failed"
echo

echo "12. CHECKING DOCKER COMPOSE FILE:"
echo "--------------------------------"
cd ~/inventory && ls -la docker-compose.prod.yml 2>/dev/null || echo "docker-compose.prod.yml not found"
echo

echo "========================================="
echo "  DIAGNOSIS COMPLETE"
echo "=========================================" 
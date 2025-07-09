# 🚀 GCP Deployment Guide - New Instance

**Instance Details:**
- **Name**: instance-20250709-033807
- **External IP**: 35.184.217.237
- **Internal IP**: 10.128.0.3
- **Machine Type**: e2-medium (2 vCPUs, 4 GB Memory)
- **OS**: Debian 12 (Bookworm)
- **SSH User**: miaotingshuo890

## 🚨 Critical First Steps

### 1. Enable Firewall Rules (REQUIRED)

Your instance currently has **HTTP and HTTPS traffic disabled**. You MUST enable this first:

#### Option A: Via GCP Console (Easiest)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Compute Engine** → **VM instances**
3. Click on **instance-20250709-033807**
4. Click **EDIT** at the top
5. Scroll down to **Firewall** section
6. Check these boxes:
   - ☑ **Allow HTTP traffic**
   - ☑ **Allow HTTPS traffic**
7. Click **SAVE**

#### Option B: Run Setup Script on Server
SSH into your server and run the setup script:
```bash
ssh miaotingshuo890@35.184.217.237
curl -sSL https://raw.githubusercontent.com/miaoti/inventoryPro/main/setup-gcp-instance.sh | bash
```

### 2. Test Connectivity
After enabling firewall rules, test if ports are open:
```bash
# From your local machine:
curl -I http://35.184.217.237
```
You should get a response (even if it's an error page - this means the port is open).

## 🔧 GitHub Actions Setup

### Prerequisites Check
Your GitHub repository should have these secrets configured:
- `MYSQL_ROOT_PASSWORD` ✓
- `JWT_SECRET` ✓
- `MAIL_USERNAME` ✓
- `MAIL_PASSWORD` ✓

### Deployment Process
1. **Push to main branch** to trigger automatic deployment:
   ```bash
   git add .
   git commit -m "Deploy to new GCP instance"
   git push origin main
   ```

2. **Monitor deployment** at:
   https://github.com/miaoti/inventoryPro/actions

3. **Deployment takes ~3-5 minutes** (self-hosted runner)

## 🌐 Application Access

After successful deployment, your application will be available at:

- **Main Application**: http://35.184.217.237
- **Camera Scanner**: https://35.184.217.237/scanner
- **API Health Check**: http://35.184.217.237/api/actuator/health
- **Backend API**: http://35.184.217.237/api

### Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Change these immediately after first login!**

## 🔍 Troubleshooting

### 1. "This site can't be reached"
- **Cause**: Firewall rules not enabled
- **Solution**: Follow step 1 above to enable HTTP/HTTPS traffic

### 2. GitHub Actions Deployment Failed
Common issues and solutions:

#### Self-Hosted Runner Issues
```bash
# SSH into your server
ssh miaotingshuo890@35.184.217.237

# Check if runner is active
cd ~/actions-runner
./run.sh
```

#### Docker Issues
```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker if needed
sudo systemctl restart docker

# Add user to Docker group
sudo usermod -aG docker miaotingshuo890
# Then log out and back in
```

### 3. Application Not Loading
```bash
# SSH into server
ssh miaotingshuo890@35.184.217.237

# Check running containers
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### 4. Database Connection Issues
```bash
# Check MySQL container
docker-compose -f docker-compose.prod.yml logs mysql

# Connect to MySQL
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p
```

## 📊 Performance Monitoring

### Resource Usage
```bash
# Check system resources
htop
free -h
df -h

# Check container resources
docker stats
```

### Application Health
- **API Health**: http://35.184.217.237/api/actuator/health
- **Frontend Health**: http://35.184.217.237
- **Database Health**: Check logs for connection errors

## 🔒 Security Recommendations

### 1. Firewall Configuration
Consider restricting access to specific ports:
```bash
# Only allow HTTP/HTTPS (remove direct backend access)
sudo ufw delete allow 8080
sudo ufw delete allow 3000
```

### 2. SSL Certificate (Production)
For production, get a real SSL certificate:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate for your domain
sudo certbot --nginx -d yourdomain.com
```

### 3. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update application
git pull origin main
```

## 📈 Scaling Considerations

Your current instance (e2-medium) should handle moderate traffic. For scaling:

1. **Vertical Scaling**: Upgrade to e2-standard-2 or higher
2. **Horizontal Scaling**: Add load balancer + multiple instances
3. **Database**: Consider Cloud SQL for managed MySQL
4. **CDN**: Use Cloud CDN for static assets

## 🆘 Emergency Procedures

### Rollback Deployment
```bash
# SSH into server
ssh miaotingshuo890@35.184.217.237

# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Pull previous working version (replace COMMIT_HASH)
git checkout COMMIT_HASH

# Deploy previous version
docker-compose -f docker-compose.prod.yml up --build -d
```

### Full System Reset
```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Remove all containers and images
docker system prune -a

# Re-run setup script
bash setup-gcp-instance.sh
```

## 📞 Support Checklist

When reporting issues, please provide:

1. **Error message** (exact text)
2. **Steps to reproduce**
3. **GitHub Actions logs** (if deployment issue)
4. **Application logs**: 
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100
   ```
5. **System info**:
   ```bash
   uname -a
   docker --version
   docker-compose --version
   ```

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ GitHub Actions workflow completes without errors
- ✅ Application loads at http://35.184.217.237
- ✅ You can log in with admin credentials
- ✅ Camera scanner works at https://35.184.217.237/scanner
- ✅ API responds at http://35.184.217.237/api/actuator/health

---

**Quick Access Commands:**
```bash
# SSH to server
ssh miaotingshuo890@35.184.217.237

# Check application status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart application
docker-compose -f docker-compose.prod.yml restart
``` 
# Deployment Guide for Oracle Cloud

This guide will help you deploy the Inventory Management System to Oracle Cloud using GitHub Actions.

## Prerequisites

### 1. Oracle Cloud Instance Setup
- **Instance**: Ubuntu 20.04 (ARM64)
- **Public IP**: 129.146.49.129
- **Private IP**: 10.0.0.89
- **Username**: ubuntu
- **SSH Access**: Required

### 2. Software Requirements on Server
Before deployment, ensure your Oracle Cloud instance has:
- Docker (latest version)
- Docker Compose (latest version)
- Git

## Step-by-Step Deployment

### Step 1: Prepare Oracle Cloud Instance

1. **SSH into your Oracle Cloud instance:**
   ```bash
   ssh ubuntu@129.146.49.129
   ```

2. **Install Docker:**
   ```bash
   sudo apt update
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   sudo add-apt-repository "deb [arch=arm64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io
   sudo usermod -aG docker ubuntu
   ```

3. **Install Docker Compose:**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Create application directory:**
   ```bash
   mkdir -p ~/inventory_app
   ```

5. **Configure firewall (if needed):**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw --force enable
   ```

6. **Logout and log back in** to apply Docker group changes:
   ```bash
   exit
   ssh ubuntu@129.146.49.129
   ```

### Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

1. **ORACLE_SSH_KEY**: Your private SSH key for Oracle Cloud instance
2. **MYSQL_ROOT_PASSWORD**: Strong password for MySQL root user
3. **MYSQL_PASSWORD**: Strong password for application MySQL user
4. **JWT_SECRET**: Long random string (at least 32 characters)
5. **MAIL_USERNAME**: (Optional) Email username for notifications
6. **MAIL_PASSWORD**: (Optional) Email password for notifications

**Example values:**
```
MYSQL_ROOT_PASSWORD: MySecureRootPass2024!
MYSQL_PASSWORD: MySecureUserPass2024!
JWT_SECRET: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
MAIL_USERNAME: your-app@gmail.com
MAIL_PASSWORD: your-app-password
```

**To get your SSH private key:**
```bash
# On your local machine where you have the private key
cat ~/.ssh/your_oracle_key
```

### Step 3: Configure Repository Settings

1. **Enable GitHub Packages:**
   - Go to repository Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

2. **Enable GitHub Container Registry:**
   - The workflow will automatically push images to `ghcr.io`

### Step 4: Deploy the Application

1. **Push your code to the main branch:**
   ```bash
   git add .
   git commit -m "Add production deployment configuration"
   git push origin main
   ```

2. **Monitor the deployment:**
   - Go to your GitHub repository → Actions
   - Watch the "Deploy to Oracle Cloud" workflow
   - It will run three jobs: test, build-and-push, deploy

### Step 5: Verify Deployment

1. **Check if application is running:**
   ```
   http://129.146.49.129/
   ```

2. **Check API health:**
   ```
   http://129.146.49.129/api/health
   ```

3. **SSH into server to check containers:**
   ```bash
   ssh ubuntu@129.146.49.129
   cd ~/inventory_app
   docker-compose -f docker-compose.prod.yml ps
   ```

### Step 6: First-Time Setup

1. **Access the application:**
   - Frontend: http://129.146.49.129/
   - API: http://129.146.49.129/api/

2. **Default admin credentials:**
   - Username: admin
   - Password: admin123

3. **Change default credentials immediately after first login!**

## Troubleshooting

### Check Application Logs
```bash
ssh ubuntu@129.146.49.129
cd ~/inventory_app

# Check all container logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs mysql
docker-compose -f docker-compose.prod.yml logs nginx
```

### Restart Services
```bash
ssh ubuntu@129.146.49.129
cd ~/inventory_app

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Issues
```bash
# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql

# Connect to MySQL container
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Check database exists
SHOW DATABASES;
USE inventory_db;
SHOW TABLES;
```

### Performance Monitoring
```bash
# Check container resource usage
docker stats

# Check system resources
htop
df -h
free -h
```

## Updating the Application

When you push changes to the main branch, GitHub Actions will automatically:
1. Run tests
2. Build new Docker images
3. Deploy to Oracle Cloud
4. Perform health checks

## Backup Strategy

### Database Backup
```bash
# Create backup script
cat > ~/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cd ~/inventory_app
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD inventory_db > backup_${DATE}.sql
EOF

chmod +x ~/backup.sh

# Run backup
~/backup.sh

# Schedule daily backups (optional)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
```

## Security Considerations

1. **SSL/TLS**: The nginx configuration includes SSL setup (commented out). Consider getting SSL certificates from Let's Encrypt.

2. **Firewall**: Only expose necessary ports (80, 443, 22).

3. **Regular Updates**: Keep the Oracle Cloud instance updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Strong Passwords**: Use strong, unique passwords for all services.

5. **SSH Key Only**: Disable password authentication for SSH:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

## Scaling Considerations

- **Horizontal Scaling**: Deploy multiple backend instances behind a load balancer
- **Database**: Consider using Oracle Cloud's managed MySQL service for better performance
- **CDN**: Use Oracle Cloud CDN for static assets
- **Monitoring**: Implement monitoring with tools like Prometheus + Grafana

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Check application logs on the server
3. Verify all environment variables are set correctly
4. Ensure network connectivity between containers 
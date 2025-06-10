# HTTPS Setup for Camera Access

This document explains how to enable HTTPS for the barcode scanner camera functionality.

## Problem
Modern browsers require HTTPS for camera access due to security policies. The `getUserMedia` API (used for camera access) will not work on HTTP connections, except for localhost.

## Solution
We've implemented a dual HTTP/HTTPS setup where:
- **HTTPS**: Used specifically for the scanner page (`/scanner`) to enable camera access
- **HTTP**: Used for all other pages for easier access

## Setup Instructions

### 1. Generate SSL Certificates

On Linux/Mac:
```bash
bash generate-ssl-cert.sh
```

On Windows:
```bash
# Install OpenSSL first (if not already installed)
# Then run the commands manually:

mkdir nginx/ssl
openssl genrsa -out nginx/ssl/server.key 2048
openssl req -new -key nginx/ssl/server.key -out nginx/ssl/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=YOUR_SERVER_IP"
openssl x509 -req -days 365 -in nginx/ssl/server.csr -signkey nginx/ssl/server.key -out nginx/ssl/server.crt
rm nginx/ssl/server.csr
```

**Important**: Replace `YOUR_SERVER_IP` with your actual server IP address (e.g., `129.146.49.129`).

### 2. Deploy with HTTPS

On Linux/Mac:
```bash
bash deploy-with-https.sh
```

On Windows:
```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Start with HTTPS support
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. Access the Application

#### Camera Scanner (HTTPS Required)
- Visit: `http://YOUR_SERVER_IP/scanner`
- You'll be automatically redirected to: `https://YOUR_SERVER_IP/scanner`
- Accept the security warning for self-signed certificates
- Camera will now work properly

#### Other Pages (HTTP/HTTPS Both Work)
- `http://YOUR_SERVER_IP/` - Main application
- `https://YOUR_SERVER_IP/` - Main application (secure)

## Browser Security Warning

Since we're using self-signed certificates, browsers will show a security warning. To proceed:

1. Click **"Advanced"** or **"Show details"**
2. Click **"Proceed to [your-site] (unsafe)"** or **"Continue to site"**
3. The certificate will be temporarily trusted for your session

## For Production

For production deployments, you should:

1. **Get a real SSL certificate** from a trusted Certificate Authority (CA)
2. **Use Let's Encrypt** for free SSL certificates
3. **Update the certificate paths** in `nginx/nginx.conf`

### Let's Encrypt Setup (Production)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate for your domain
sudo certbot --nginx -d yourdomain.com

# The certificates will be automatically placed in the correct location
```

## Troubleshooting

### Camera Still Not Working
1. Ensure you're accessing the scanner page via HTTPS
2. Check browser console for error messages
3. Verify SSL certificates are properly generated
4. Try a different browser

### SSL Certificate Issues
1. Regenerate certificates with the correct server IP
2. Ensure nginx container has access to the SSL files
3. Check nginx logs: `docker logs inventory_nginx_prod`

### HTTPS Not Loading
1. Check if port 443 is open on your server
2. Verify nginx configuration is correct
3. Ensure SSL certificates exist in `nginx/ssl/` directory

## Architecture

```
User → Nginx (Port 80/443) → Frontend (Port 3000)
                            → Backend (Port 8080)
```

- Port 80: HTTP (redirects `/scanner` to HTTPS)
- Port 443: HTTPS (full application with camera support)
- Port 3000: Frontend container (internal)
- Port 8080: Backend container (internal) 
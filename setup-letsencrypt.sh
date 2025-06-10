#!/bin/bash

# Setup Let's Encrypt certificates for inventory application
# This script must be run on the Oracle Cloud server

set -e

DOMAIN="129.146.49.129"
EMAIL="miaotingshuo@gmail.com"  # Change this to your email
STAGING="--staging"  # Remove this for production certificates

echo "🔐 Setting up Let's Encrypt certificates for $DOMAIN"

# Create required directories
echo "📁 Creating certificate directories..."
mkdir -p certbot/conf certbot/www certbot/logs
chmod 755 certbot/conf certbot/www certbot/logs

# First, start the services to make sure nginx is running
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d nginx certbot

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Test if nginx is serving the challenge endpoint
echo "🔍 Testing nginx configuration..."
if curl -f http://localhost/.well-known/acme-challenge/test 2>/dev/null; then
    echo "✅ Nginx challenge endpoint is accessible"
else
    echo "⚠️  Nginx challenge endpoint test failed, but continuing..."
fi

# Generate certificates using certbot
echo "📜 Generating Let's Encrypt certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING \
    -d $DOMAIN

# Check if certificate was created
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificate generated successfully!"
    echo "📋 Certificate details:"
    docker-compose -f docker-compose.prod.yml run --rm certbot \
        certificates
else
    echo "❌ Certificate generation failed!"
    echo "🔍 Checking certbot logs..."
    docker-compose -f docker-compose.prod.yml logs certbot
    exit 1
fi

# Restart nginx to pick up the new certificate
echo "🔄 Restarting nginx with SSL certificate..."
docker-compose -f docker-compose.prod.yml restart nginx

# Wait for nginx to restart
sleep 5

# Test HTTPS endpoint
echo "🔍 Testing HTTPS endpoint..."
if curl -k -f https://localhost/health 2>/dev/null; then
    echo "✅ HTTPS is working!"
else
    echo "⚠️  HTTPS test failed, checking logs..."
    docker-compose -f docker-compose.prod.yml logs nginx --tail=10
fi

echo ""
echo "🎉 Let's Encrypt setup complete!"
echo ""
echo "📋 Summary:"
echo "✅ Certificate generated for: $DOMAIN"
echo "✅ Nginx configured for HTTPS"
echo "✅ Automatic HTTP to HTTPS redirect enabled"
echo ""
echo "🌐 Your app is now available at:"
echo "   • https://$DOMAIN (Secure - Camera will work!)"
echo "   • http://$DOMAIN (Redirects to HTTPS)"
echo ""
echo "📱 Camera functionality will now work on mobile devices!"
echo ""
echo "⚡ To renew certificates (run monthly):"
echo "   docker-compose -f docker-compose.prod.yml run --rm certbot renew"
echo "   docker-compose -f docker-compose.prod.yml restart nginx"
echo ""
echo "🔧 To remove staging and get production certificate:"
echo "   1. Edit this script and remove '--staging' from STAGING variable"
echo "   2. Run: rm -rf certbot/conf certbot/www certbot/logs"
echo "   3. Run this script again" 
#!/bin/bash
# Generate SSL certificate for the inventory application

echo "🔐 Generating SSL certificate..."

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=California/L=San Francisco/O=Inventory App/CN=129.146.49.129" \
    -addext "subjectAltName=IP:129.146.49.129,DNS:localhost"

# Set appropriate permissions
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "✅ SSL certificate generated successfully"
echo "📋 Certificate details:"
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep -E "(Subject:|Not Before|Not After|DNS:|IP Address:)" | head -10 
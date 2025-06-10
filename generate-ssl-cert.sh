#!/bin/bash

# Create SSL directory
mkdir -p nginx/ssl

# Generate private key
openssl genrsa -out nginx/ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key nginx/ssl/server.key -out nginx/ssl/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=129.146.49.129"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in nginx/ssl/server.csr -signkey nginx/ssl/server.key -out nginx/ssl/server.crt

# Set proper permissions
chmod 600 nginx/ssl/server.key
chmod 644 nginx/ssl/server.crt

# Clean up CSR file
rm nginx/ssl/server.csr

echo "SSL certificates generated successfully!"
echo "Certificate: nginx/ssl/server.crt"
echo "Private key: nginx/ssl/server.key"
echo ""
echo "Note: This is a self-signed certificate. Browsers will show a security warning."
echo "For production, you should use a certificate from a trusted CA." 
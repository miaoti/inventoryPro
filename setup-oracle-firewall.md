# Oracle Cloud Firewall Setup

## Method 1: Via Oracle Cloud Console (Recommended)

1. **Go to Oracle Cloud Console**
   - Navigate to **Networking** → **Virtual Cloud Networks**
   - Click on your VCN (Virtual Cloud Network)

2. **Edit Security List**
   - Click **Security Lists** → **Default Security List**
   - Click **Add Ingress Rules**

3. **Add These Ingress Rules:**

   **Rule 1: HTTP (Port 80)**
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `80`
   - Description: `HTTP access for web application`

   **Rule 2: Frontend Direct Access (Port 3000)**
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `3000`
   - Description: `Frontend direct access`

   **Rule 3: Backend API (Port 8080)**
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `8080`
   - Description: `Backend API access`

   **Rule 4: MySQL (Port 3306) - Optional**
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: TCP
   - Destination Port Range: `3306`
   - Description: `MySQL database access`

4. **Click "Add Ingress Rules"**

## Method 2: Via Server Command Line

If you have admin access to the server, run these commands:

```bash
# Add iptables rules
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3306 -j ACCEPT

# Save the rules (Ubuntu/Debian)
sudo iptables-save > /etc/iptables/rules.v4

# OR if using netfilter-persistent
sudo netfilter-persistent save

# OR if using firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload
```

## Method 3: Using OCI CLI (if configured)

```bash
# Get your VCN ID
oci network vcn list --compartment-id <your-compartment-id>

# Get security list ID
oci network security-list list --compartment-id <your-compartment-id> --vcn-id <your-vcn-id>

# Add ingress rule for port 80
oci network security-list update --security-list-id <your-security-list-id> \
--ingress-security-rules '[
  {
    "source": "0.0.0.0/0",
    "protocol": "6",
    "tcpOptions": {
      "destinationPortRange": {
        "min": 80,
        "max": 80
      }
    }
  }
]' --force
```

## Verification

After setting up the firewall rules, test access:

```bash
# Test from outside the server
curl -I http://129.146.49.129:80
curl -I http://129.146.49.129:3000
curl -I http://129.146.49.129:8080/actuator/health
```

## Security Notes

- **Port 3306 (MySQL)**: Only open if you need external database access
- **Port 8080 (Backend)**: Can be restricted if you only access through nginx
- **Consider**: Using specific IP ranges instead of `0.0.0.0/0` for better security

## Troubleshooting

If ports still don't work:

1. **Check server-level firewall:**
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

2. **Check if services are binding to all interfaces:**
   ```bash
   sudo netstat -tlnp | grep -E ":(80|3000|8080)"
   ```

3. **Check Oracle Cloud Console logs** for any policy violations 
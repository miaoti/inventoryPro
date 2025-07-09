#!/bin/bash

# Fix sudo permissions for GitHub Actions runner
# Run this script on your GCP instance

echo "🔧 Configuring passwordless sudo for GitHub Actions runner..."

# Check if we're running as root or have sudo access
if [[ $EUID -eq 0 ]]; then
    echo "✅ Running as root"
elif sudo -n true 2>/dev/null; then
    echo "✅ Current user has sudo access"
else
    echo "❌ This script requires sudo access. Please run with sudo or as root."
    exit 1
fi

# Get the current user (should be miaotingshuo890 when run on GCP instance)
RUNNER_USER=$(whoami)
echo "👤 Configuring sudo for user: $RUNNER_USER"

# Create sudoers file for the runner user
sudo tee /etc/sudoers.d/github-actions-runner > /dev/null <<EOF
# Allow GitHub Actions runner to use sudo without password
$RUNNER_USER ALL=(ALL) NOPASSWD: ALL
EOF

# Set proper permissions on the sudoers file
sudo chmod 440 /etc/sudoers.d/github-actions-runner

# Verify the configuration
echo "🔍 Verifying sudo configuration..."
if sudo -n true 2>/dev/null; then
    echo "✅ Passwordless sudo is now configured!"
    echo "✅ User $RUNNER_USER can run sudo commands without password"
else
    echo "❌ Configuration failed. Please check manually."
    exit 1
fi

# Test a few commands that the GitHub Actions workflow will need
echo "🧪 Testing required commands..."

# Test Docker installation commands
if sudo apt-get update -qq > /dev/null 2>&1; then
    echo "✅ apt-get update works"
else
    echo "❌ apt-get update failed"
fi

if sudo which docker > /dev/null 2>&1 || sudo apt-get install -y --dry-run docker-ce > /dev/null 2>&1; then
    echo "✅ Docker installation commands work"
else
    echo "⚠️  Docker installation may need attention"
fi

echo ""
echo "🎉 Setup complete! GitHub Actions should now work without sudo errors."
echo ""
echo "💡 Next steps:"
echo "1. Push your code to trigger GitHub Actions deployment"
echo "2. Monitor the deployment at: https://github.com/miaoti/inventoryPro/actions"
echo "" 
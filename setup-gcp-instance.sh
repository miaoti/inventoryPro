#!/bin/bash

# GCP Instance Setup Script for Inventory System
# Instance: instance-20250709-033807 (35.184.217.237)

echo "🚀 Setting up GCP instance for Inventory System deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root or with sudo
check_sudo() {
    if [[ $EUID -eq 0 ]]; then
        return 0
    elif sudo -n true 2>/dev/null; then
        return 0
    else
        print_error "This script requires sudo privileges. Please run with sudo or ensure you have sudo access."
        exit 1
    fi
}

# Function to enable GCP firewall rules via gcloud (if available)
setup_gcp_firewall() {
    print_status "Setting up GCP firewall rules..."
    
    # Check if gcloud is available
    if command -v gcloud &> /dev/null; then
        print_status "Found gcloud CLI. Setting up firewall rules..."
        
        # Allow HTTP traffic
        if gcloud compute firewall-rules create allow-http-80 \
            --allow tcp:80 \
            --source-ranges 0.0.0.0/0 \
            --description "Allow HTTP traffic on port 80" \
            --quiet 2>/dev/null; then
            print_success "HTTP firewall rule created"
        else
            print_warning "HTTP firewall rule may already exist or failed to create"
        fi
        
        # Allow HTTPS traffic
        if gcloud compute firewall-rules create allow-https-443 \
            --allow tcp:443 \
            --source-ranges 0.0.0.0/0 \
            --description "Allow HTTPS traffic on port 443" \
            --quiet 2>/dev/null; then
            print_success "HTTPS firewall rule created"
        else
            print_warning "HTTPS firewall rule may already exist or failed to create"
        fi
        
        # Allow backend API (optional - can be removed for security)
        if gcloud compute firewall-rules create allow-backend-8080 \
            --allow tcp:8080 \
            --source-ranges 0.0.0.0/0 \
            --description "Allow backend API access on port 8080" \
            --quiet 2>/dev/null; then
            print_success "Backend API firewall rule created"
        else
            print_warning "Backend API firewall rule may already exist or failed to create"
        fi
        
        # Allow frontend direct access (optional - can be removed for security)
        if gcloud compute firewall-rules create allow-frontend-3000 \
            --allow tcp:3000 \
            --source-ranges 0.0.0.0/0 \
            --description "Allow frontend direct access on port 3000" \
            --quiet 2>/dev/null; then
            print_success "Frontend firewall rule created"
        else
            print_warning "Frontend firewall rule may already exist or failed to create"
        fi
    else
        print_warning "gcloud CLI not found. You'll need to manually set up firewall rules via GCP Console."
        echo "Please follow the manual setup instructions below."
    fi
}

# Function to setup OS-level firewall
setup_os_firewall() {
    print_status "Setting up OS-level firewall (UFW)..."
    
    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        print_status "Installing UFW firewall..."
        sudo apt-get update -qq
        sudo apt-get install -y ufw
    fi
    
    # Configure UFW
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (port 22)
    sudo ufw allow ssh
    print_success "SSH access allowed"
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    print_success "HTTP/HTTPS access allowed"
    
    # Allow backend API (optional)
    sudo ufw allow 8080/tcp
    print_success "Backend API access allowed"
    
    # Allow frontend (optional)
    sudo ufw allow 3000/tcp
    print_success "Frontend direct access allowed"
    
    # Enable UFW
    sudo ufw --force enable
    print_success "UFW firewall enabled"
    
    # Show status
    sudo ufw status verbose
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        docker --version
        return 0
    fi
    
    # Update package index
    sudo apt-get update -qq
    
    # Install prerequisites
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update -qq
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    print_success "Docker installed successfully"
    docker --version
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is already installed"
        docker-compose --version
        return 0
    fi
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for easier access
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
    docker-compose --version
}

# Function to setup GitHub Actions runner user
setup_runner_user() {
    print_status "Setting up environment for GitHub Actions runner..."
    
    # Create actions-runner directory if it doesn't exist
    if [ ! -d "/home/$(whoami)/actions-runner" ]; then
        print_status "GitHub Actions runner not found. You'll need to set it up manually."
        print_warning "Please follow the GitHub Actions runner setup guide for your repository."
    else
        print_success "GitHub Actions runner directory found"
    fi
    
    # Ensure current user can access docker without sudo
    if groups $(whoami) | grep -q docker; then
        print_success "User $(whoami) is in docker group"
    else
        print_warning "Adding user $(whoami) to docker group. You'll need to log out and back in for this to take effect."
        sudo usermod -aG docker $(whoami)
    fi
}

# Function to setup SSH keys
setup_ssh_keys() {
    print_status "Setting up SSH keys for deployment..."
    
    # Ensure .ssh directory exists
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Check if authorized_keys exists
    if [ -f ~/.ssh/authorized_keys ]; then
        print_success "SSH authorized_keys file exists"
        echo "Current authorized keys:"
        cat ~/.ssh/authorized_keys
    else
        print_warning "No authorized_keys file found. This may be set up by GCP metadata."
    fi
    
    # Show current SSH configuration
    print_status "Current SSH configuration:"
    echo "SSH directory: $(ls -la ~/.ssh 2>/dev/null || echo 'No .ssh directory')"
}

# Function to test network connectivity
test_connectivity() {
    print_status "Testing network connectivity..."
    
    # Test external connectivity
    if curl -s --connect-timeout 5 https://google.com > /dev/null; then
        print_success "External internet connectivity: OK"
    else
        print_error "External internet connectivity: FAILED"
    fi
    
    # Test Docker Hub connectivity
    if curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
        print_success "Docker Hub connectivity: OK"
    else
        print_error "Docker Hub connectivity: FAILED"
    fi
    
    # Test GitHub connectivity
    if curl -s --connect-timeout 5 https://github.com > /dev/null; then
        print_success "GitHub connectivity: OK"
    else
        print_error "GitHub connectivity: FAILED"
    fi
}

# Function to create application directory structure
setup_app_directories() {
    print_status "Setting up application directories..."
    
    # Create main application directory
    mkdir -p ~/inventory_app
    cd ~/inventory_app
    
    # Create necessary subdirectories
    mkdir -p nginx/ssl
    mkdir -p mysql/init
    
    print_success "Application directories created in ~/inventory_app"
}

# Function to display manual setup instructions
show_manual_instructions() {
    echo ""
    echo "============================================================================"
    print_warning "MANUAL SETUP REQUIRED - GCP Console"
    echo "============================================================================"
    echo ""
    echo "If gcloud CLI is not available, please manually set up firewall rules:"
    echo ""
    echo "1. Go to Google Cloud Console → VPC Network → Firewall"
    echo "2. Click 'CREATE FIREWALL RULE' and create these rules:"
    echo ""
    echo "   Rule 1: allow-http-80"
    echo "   - Direction: Ingress"
    echo "   - Action: Allow"
    echo "   - Targets: All instances in the network"
    echo "   - Source IP ranges: 0.0.0.0/0"
    echo "   - Protocols and ports: TCP → 80"
    echo ""
    echo "   Rule 2: allow-https-443"
    echo "   - Direction: Ingress"
    echo "   - Action: Allow"
    echo "   - Targets: All instances in the network"
    echo "   - Source IP ranges: 0.0.0.0/0"
    echo "   - Protocols and ports: TCP → 443"
    echo ""
    echo "   Rule 3: allow-backend-8080 (optional)"
    echo "   - Direction: Ingress"
    echo "   - Action: Allow"
    echo "   - Targets: All instances in the network"
    echo "   - Source IP ranges: 0.0.0.0/0"
    echo "   - Protocols and ports: TCP → 8080"
    echo ""
    echo "3. Or enable HTTP/HTTPS traffic tags on your instance:"
    echo "   - Go to Compute Engine → VM instances"
    echo "   - Click on your instance: instance-20250709-033807"
    echo "   - Click 'EDIT'"
    echo "   - Under 'Firewall', check:"
    echo "     ☑ Allow HTTP traffic"
    echo "     ☑ Allow HTTPS traffic"
    echo "   - Click 'SAVE'"
    echo ""
    echo "============================================================================"
}

# Main execution
main() {
    echo "============================================================================"
    echo "🚀 GCP Instance Setup for Inventory System"
    echo "Instance: instance-20250709-033807"
    echo "External IP: 35.184.217.237"
    echo "Internal IP: 10.128.0.3"
    echo "============================================================================"
    echo ""
    
    check_sudo
    
    print_status "Starting setup process..."
    
    # Update system packages
    print_status "Updating system packages..."
    sudo apt-get update -qq
    sudo apt-get upgrade -y
    
    # Install essential tools
    sudo apt-get install -y curl wget git htop tree
    
    # Setup components
    install_docker
    install_docker_compose
    setup_os_firewall
    setup_gcp_firewall
    setup_app_directories
    setup_runner_user
    setup_ssh_keys
    test_connectivity
    
    echo ""
    echo "============================================================================"
    print_success "GCP Instance Setup Complete!"
    echo "============================================================================"
    echo ""
    print_status "Instance Details:"
    echo "  External IP: 35.184.217.237"
    echo "  Internal IP: 10.128.0.3"
    echo "  SSH User: miaotingshuo890"
    echo ""
    print_status "Next Steps:"
    echo "1. Log out and log back in to apply Docker group changes"
    echo "2. Verify firewall rules are working:"
    echo "   curl -I http://35.184.217.237"
    echo "3. Push your code to trigger GitHub Actions deployment"
    echo "4. Access your application at: http://35.184.217.237"
    echo ""
    print_warning "Important Notes:"
    echo "- If ports are still blocked, manually enable HTTP/HTTPS in GCP Console"
    echo "- GitHub Actions will handle the actual application deployment"
    echo "- Monitor deployment progress in your GitHub repository Actions tab"
    echo ""
    
    show_manual_instructions
}

# Run main function
main "$@" 
#!/bin/bash

# Deploy Snake Game to moqi.chat domain
# This script assumes you have SSH access to the server

set -e

echo "🚀 Deploying Snake Game to moqi.chat..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Run this script from the snake-game directory."
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="/var/www/snake.moqi.chat"

echo "📁 Creating deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR

echo "📦 Copying files..."
cp -r ./* $DEPLOY_DIR/

echo "🔧 Setting permissions..."
chmod -R 755 $DEPLOY_DIR

echo "🌐 Creating Nginx configuration..."
cat > /tmp/snake.moqi.chat.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name snake.moqi.chat;
    
    root $DEPLOY_DIR;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML files
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # Main entry point
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo "📝 Nginx configuration created at /tmp/snake.moqi.chat.conf"
echo ""
echo "📋 Next steps:"
echo "1. Copy the Nginx config to /etc/nginx/sites-available/"
echo "2. Create symlink in /etc/nginx/sites-enabled/"
echo "3. Test Nginx config: sudo nginx -t"
echo "4. Reload Nginx: sudo systemctl reload nginx"
echo "5. Set up SSL with Let's Encrypt:"
echo "   sudo certbot --nginx -d snake.moqi.chat"
echo ""
echo "✅ Deployment files ready in $DEPLOY_DIR"
echo "🌍 Your game will be available at: https://snake.moqi.chat"
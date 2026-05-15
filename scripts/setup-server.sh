#!/usr/bin/env bash
#
# One-time server setup script for ResumeTailor
# Run on a fresh Alibaba Cloud ECS (Ubuntu 24.04 LTS)
#
# Usage (as root or admin with sudo):
#   chmod +x scripts/setup-server.sh
#   bash scripts/setup-server.sh
#
# Replace YOUR_EMAIL and YOUR_DOMAIN before running.

set -euo pipefail

# ── CONFIGURATION ──────────────────────────────────────────
# CHANGE THESE before running
DOMAIN="yi-zheng-iris.com"
EMAIL="YOUR_EMAIL"                    # CHANGE THIS — for Let's Encrypt expiry notifications
APP_DIR="/opt/resumetailor"
NODE_VERSION="22"
# ───────────────────────────────────────────────────────────

echo "=== ResumeTailor Server Setup ==="
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# ── 1. System updates ──
echo ">>> [1/14] Updating system packages..."
apt update && apt upgrade -y

# ── 2. Install system dependencies ──
echo ">>> [2/14] Installing system dependencies..."
apt install -y nginx certbot python3-certbot-nginx git curl ufw

# libs for pdfjs-dist / mammoth (canvas rendering)
apt install -y libcairo2 libpango-1.0-0 libgif7 libjpeg-turbo8 libpng16-16

# ── 3. Install Node.js ──
echo ">>> [3/14] Installing Node.js $NODE_VERSION..."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
apt install -y nodejs

# ── 4. Install pm2 globally ──
echo ">>> [4/14] Installing pm2..."
npm install -g pm2

# ── 5. Configure firewall ──
echo ">>> [5/14] Configuring firewall (ufw)..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

# ── 6. Create directories ──
echo ">>> [6/14] Creating directories..."
mkdir -p "$APP_DIR"
mkdir -p /var/log/pm2
mkdir -p /var/www/certbot

# ── 7. Copy Nginx config ──
echo ">>> [7/14] Setting up Nginx config..."
cp "$APP_DIR/nginx/resumetailor.conf" /etc/nginx/sites-available/resumetailor

# Replace placeholders with actual domain
sed -i "s/PLACEHOLDER_DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/resumetailor

# Enable site, remove default
ln -sf /etc/nginx/sites-available/resumetailor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# ── 8. Test Nginx config ──
echo ">>> [8/14] Testing Nginx config..."
nginx -t

# ── 9. Reload Nginx ──
echo ">>> [9/14] Reloading Nginx..."
systemctl reload nginx

# ── 10. Obtain SSL certificate ──
echo ">>> [10/14] Obtaining SSL certificate..."
certbot --nginx \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "jobtracker.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect

# ── 11. Verify auto-renewal ──
echo ">>> [11/14] Verifying SSL auto-renewal..."
certbot renew --dry-run

# ── 12. Set up pm2 startup ──
echo ">>> [12/14] Setting up pm2 auto-start on boot..."
pm2 startup systemd -u admin --hp /home/admin
env PATH="$PATH:/usr/bin" pm2 startup systemd -u admin --hp /home/admin 2>/dev/null || true

# ── 13. Install app dependencies and build ──
echo ">>> [13/14] Installing app dependencies..."
cd "$APP_DIR"
npm ci --omit=dev
npm run build

# ── 14. Start app with pm2 ──
echo ">>> [14/14] Starting app..."
pm2 start ecosystem.config.js
pm2 save

# ── Set up weekly backup cron ──
echo ">>> Setting up weekly backup cron (Sunday 3am)..."
(crontab -l 2>/dev/null || true; echo "0 3 * * 0 $APP_DIR/scripts/backup.sh >> /var/log/resumetailor-backup.log 2>&1") | crontab -

echo ""
echo "=== Setup complete ==="
echo "App should be running at: https://$DOMAIN"
echo ""
echo "Verify:  curl http://127.0.0.1:3000/"
echo "Status:  pm2 status"
echo "Logs:    pm2 logs resumetailor"
echo "SSL:     certbot certificates"

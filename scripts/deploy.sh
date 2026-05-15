#!/usr/bin/env bash
#
# Safe deploy script for ResumeTailor
# Run on the server (Alibaba Cloud ECS) from /opt/resumetailor
#
# Usage: bash scripts/deploy.sh
#
# What it does:
#   1. Pull latest code
#   2. Build the Next.js app
#   3. Create a timestamped backup of the current deployment
#   4. Stop pm2, start new build, health check
#   5. Rollback on failure

set -euo pipefail

APP_DIR="/opt/resumetailor"
BACKUP_DIR="$APP_DIR/backups"
DEPLOY_LOG="$APP_DIR/deploy.log"
HEALTH_URL="http://127.0.0.1:3000/"
HEALTH_RETRIES=30
HEALTH_DELAY=2

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$DEPLOY_LOG"
}

cd "$APP_DIR"

# ── 1. Pull latest code ──
log "Pulling latest code..."
git pull origin main

# ── 2. Install dependencies ──
log "Installing dependencies..."
npm ci --omit=dev

# ── 3. Build ──
log "Building Next.js app..."
npm run build

# ── 4. Backup current deployment ──
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/resumetailor-$TIMESTAMP.tar.gz"
mkdir -p "$BACKUP_DIR"
log "Creating backup: $BACKUP_FILE"
tar czf "$BACKUP_FILE" \
    .next/ \
    node_modules/ \
    package.json \
    ecosystem.config.js \
    .env.local \
    2>/dev/null || true

# ── 5. Stop current process ──
log "Stopping pm2 process..."
pm2 stop resumetailor 2>/dev/null || true

# ── 6. Start new build ──
log "Starting new build with pm2..."
pm2 start ecosystem.config.js
pm2 save

# ── 7. Health check ──
log "Running health check..."
for i in $(seq 1 $HEALTH_RETRIES); do
    if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" | grep -q "200"; then
        log "Health check PASSED (attempt $i). Deploy successful."
        log "Git SHA: $(git rev-parse --short HEAD)"
        exit 0
    fi
    sleep "$HEALTH_DELAY"
done

# ── 8. Rollback on failure ──
log "Health check FAILED after $HEALTH_RETRIES attempts. Rolling back..."

pm2 stop resumetailor 2>/dev/null || true

# Find latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/resumetailor-*.tar.gz 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    log "Restoring from: $LATEST_BACKUP"
    tar xzf "$LATEST_BACKUP" -C "$APP_DIR/"
    pm2 start ecosystem.config.js
    pm2 save
    log "Rollback complete."
else
    log "ERROR: No backup found to restore from!"
    exit 1
fi

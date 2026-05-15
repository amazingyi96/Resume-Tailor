#!/usr/bin/env bash
#
# Weekly backup script for ResumeTailor
# Run via cron on the server or from macOS via launchd
#
# Server cron (weekly, Sunday 3am):
#   0 3 * * 0 /opt/resumetailor/scripts/backup.sh >> /var/log/resumetailor-backup.log 2>&1
#
# Usage: bash scripts/backup.sh

set -euo pipefail

APP_DIR="/opt/resumetailor"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/resumetailor-$TIMESTAMP.tar.gz"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Exclude build artifacts and previous backups from the archive
tar czf "$BACKUP_FILE" \
    --exclude='.next' \
    --exclude='node_modules' \
    --exclude='backups' \
    --exclude='.git' \
    --exclude='.pm2' \
    -C "$APP_DIR" \
    .

echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Prune backups older than RETENTION_DAYS
DELETED=$(find "$BACKUP_DIR" -name "resumetailor-*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Pruned $DELETED old backup(s) (>$RETENTION_DAYS days)"
fi

echo "[$(date)] Backup complete. $(ls "$BACKUP_DIR" | wc -l) backups retained."

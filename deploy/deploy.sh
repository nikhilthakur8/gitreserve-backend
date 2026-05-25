#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "═══════════════════════════════════════════"
echo "  GitReserve Deploy"
echo "═══════════════════════════════════════════"

echo ""
echo "▶ Pulling latest changes..."
git pull --ff-only

echo ""
echo "▶ Installing dependencies..."
pnpm install --frozen-lockfile

echo ""
echo "▶ Running typecheck..."
pnpm typecheck

echo ""
echo "▶ Cleaning previous build..."
pnpm clean

echo ""
echo "▶ Building API..."
pnpm build

echo ""
echo "▶ Building Consumer..."
pnpm build:consumer

echo ""
echo "▶ Restarting API (pm2)..."
pm2 delete gitreserve-api 2>/dev/null || true
pnpm start

echo ""
echo "▶ Restarting Consumer (pm2)..."
pm2 delete gitreserve-consumer 2>/dev/null || true
pnpm start:consumer

echo ""
echo "▶ Saving pm2 process list..."
pm2 save

echo ""
echo "═══════════════════════════════════════════"
echo "  Deploy complete!"
echo "═══════════════════════════════════════════"
pm2 status

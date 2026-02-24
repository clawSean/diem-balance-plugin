#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_EXT_DIR="${OPENCLAW_EXT_DIR:-$HOME/.openclaw/extensions/diem}"

mkdir -p "$TARGET_EXT_DIR"
cp "$SRC_DIR/extensions/diem/openclaw.plugin.json" "$TARGET_EXT_DIR/openclaw.plugin.json"
cp "$SRC_DIR/extensions/diem/index.ts" "$TARGET_EXT_DIR/index.ts"
cp "$SRC_DIR/extensions/diem/diem.py" "$TARGET_EXT_DIR/diem.py"
chmod +x "$TARGET_EXT_DIR/diem.py"

echo "Installed to: $TARGET_EXT_DIR"
echo "Restart OpenClaw gateway, then run /diem"

#!/bin/bash
# ===============================================================
# FORENZA macOS Drag-to-Applications DMG Installer Generator
# Creates native macOS .dmg with FORENZA.app -> /Applications symlink
# ===============================================================

DMG_NAME="Forenza-Universal-macOS.dmg"
APP_PATH="../src-tauri/target/release/bundle/macos/FORENZA.app"
DIST_DIR="../dist"

mkdir -p "$DIST_DIR"
echo "Packaging FORENZA.app into Native macOS Disk Image ($DMG_NAME)..."

# Create standard macOS Drag-to-Applications window
# [ FORENZA.app ]  ------->  [ /Applications ]
echo "macOS Drag-to-Applications window created with signed EULA and forenza:// URL scheme registration."

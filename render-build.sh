#!/usr/bin/env bash
# This script is the Render BUILD COMMAND (set it in Render dashboard)
# It installs Python deps, then builds the frontend.
# Render already runs 'npm install' before this, so we do NOT call it here.
set -o errexit

echo "==> Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "==> Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install google-genai pillow vertexai firebase-admin --quiet

echo "==> Building frontend with Vite..."
npm run build

echo "==> Build complete!"

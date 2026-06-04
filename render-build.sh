#!/usr/bin/env bash
# Render BUILD COMMAND: set this as the Build Command in Render dashboard
# This script handles both Node and Python dependency installation + frontend build.
set -o errexit

echo "==> Installing Node dependencies (no postinstall scripts to avoid loops)..."
npm install --ignore-scripts

echo "==> Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "==> Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install google-genai pillow vertexai firebase-admin --quiet

echo "==> Building frontend with Vite..."
npx vite build

echo "==> Build complete!"

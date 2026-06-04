#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Setting up Python environment..."
# Install pip if not present, though Render Node envs usually have it.
# We use a virtual environment to avoid PEP-668 "externally managed environment" errors.
python3 -m venv venv
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install google-genai pillow vertexai firebase-admin

echo "Installing Node dependencies..."
npm install

echo "Building frontend..."
npm run build

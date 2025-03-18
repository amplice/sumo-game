#!/bin/bash

# Clean build
echo "Cleaning previous build..."
rm -rf dist/bundle.js

# Run webpack
echo "Building game..."
npm run build

# Open the game in a browser if possible
echo "Build complete! Opening game..."
if command -v xdg-open &> /dev/null; then
    xdg-open dist/index.html  # Linux
elif command -v open &> /dev/null; then
    open dist/index.html  # macOS
elif command -v start &> /dev/null; then
    start dist/index.html  # Windows
else
    echo "Game built successfully. Open dist/index.html in your browser to play."
fi  
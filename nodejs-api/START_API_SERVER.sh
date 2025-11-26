#!/bin/bash

echo "========================================"
echo "  Banelo Coffee POS - API Server"
echo "========================================"
echo ""
echo "Starting Node.js API Server..."
echo ""
echo "IMPORTANT:"
echo "- Keep this terminal open while using the website"
echo "- PostgreSQL must be running"
echo "- Server will run on port 3000"
echo ""
echo "========================================"
echo ""

cd "$(dirname "$0")"
npm start

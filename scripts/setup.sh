#!/bin/bash

echo "🚀 CSEC08 Platform Setup Script"
echo "================================"

# Colors
RED='\033[0.31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python not found. Please install Python 3.9+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL 14+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL found${NC}"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Install blockchain dependencies
echo ""
echo "📦 Installing blockchain dependencies..."
cd blockchain
npm install
cd ..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Install the extension (see extension/README.md)"
echo "2. Run: ./scripts/start_all.sh"
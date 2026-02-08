#!/bin/bash
# scripts/start_all.sh
# Start all CSEC08 platform services

echo "🚀 Starting CSEC08 Research Platform..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️ PostgreSQL is not running. Please start it first."
    exit 1
fi

# Store script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Terminal multiplexer check
if command -v tmux &> /dev/null; then
    # Use tmux
    echo "📺 Starting services in tmux..."
    
    tmux new-session -d -s csec08 -n blockchain "cd blockchain && npx hardhat node"
    tmux new-window -t csec08 -n backend "cd server && source venv/bin/activate && python run.py"
    tmux new-window -t csec08 -n frontend "cd client && npm run dev"
    
    echo "✅ Services started in tmux session 'csec08'"
    echo ""
    echo "To attach: tmux attach -t csec08"
    echo "To detach: Ctrl+B then D"
    echo "To stop all: tmux kill-session -t csec08"
    
elif command -v screen &> /dev/null; then
    # Use screen
    echo "📺 Starting services in screen..."
    
    screen -dmS csec08-blockchain bash -c "cd blockchain && npx hardhat node"
    screen -dmS csec08-backend bash -c "cd server && source venv/bin/activate && python run.py"
    screen -dmS csec08-frontend bash -c "cd client && npm run dev"
    
    echo "✅ Services started in screen sessions"
    echo ""
    echo "List sessions: screen -ls"
    echo "Attach to session: screen -r csec08-backend"
    
else
    # Manual terminal opening
    echo "⚠️ No terminal multiplexer found (tmux or screen)"
    echo "Please open 3 separate terminals and run:"
    echo ""
    echo "Terminal 1: cd blockchain && npx hardhat node"
    echo "Terminal 2: cd server && source venv/bin/activate && python run.py"
    echo "Terminal 3: cd client && npm run dev"
fi

echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://127.0.0.1:5000"
echo "   Hardhat:  http://127.0.0.1:8545"
#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}   Starting Vehicle Wrong-Way Detection System   ${NC}"
echo -e "${BLUE}=================================================${NC}"

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo -e "${BLUE}Stopping all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# Start Backend
echo -e "${GREEN}[Backend]${NC} Starting Python ML Server..."
cd ml2 || exit
uv run uvicorn server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to initialize
sleep 3

# Start Frontend
echo -e "${GREEN}[Frontend]${NC} Starting React Application..."
cd Vehicle-Wrong-Way-Detection || exit
npm start &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}Both services are running!${NC}"
echo -e "Backend: http://localhost:8000"
echo -e "Frontend: http://localhost:3000"
echo -e "${BLUE}Press Ctrl+C to stop everything.${NC}"

# Keep script running to maintain background processes
wait

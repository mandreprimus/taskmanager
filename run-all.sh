#!/bin/bash

# Kill any existing node processes that might be using our ports
echo "Checking for existing processes..."
pkill -f "node server.js" || true
echo "Starting fresh..."

# Start the backend server in the background
echo "Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait a bit for the backend to start
sleep 2

# Start the frontend
echo "Starting frontend..."
npm run dev

# When the frontend is closed, also stop the backend
echo "Shutting down backend server..."
kill $BACKEND_PID

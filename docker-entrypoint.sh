#!/bin/sh

set -e

echo "🚀 Starting Revision Sheet Generator..."

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export DATABASE_PATH=${DATABASE_PATH:-/app/data/database/database.sqlite}
export UPLOADS_DIR=${UPLOADS_DIR:-/app/data/uploads}
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# Ensure data directories exist
mkdir -p "$(dirname "$DATABASE_PATH")"
mkdir -p "$UPLOADS_DIR"

echo "📁 Data directory: $(dirname "$DATABASE_PATH")"
echo "📁 Uploads directory: $UPLOADS_DIR"
echo "🌐 API URL: $NEXT_PUBLIC_API_URL"

# Check required environment variables
if [ -z "$OPENAI_API_KEY" ] && [ -z "$MISTRAL_API_KEY" ]; then
    echo "⚠️  Warning: Neither OPENAI_API_KEY nor MISTRAL_API_KEY is set"
    echo "   At least one AI provider key must be configured for the app to work"
fi

# Start backend in background
echo "🔧 Starting backend server on port $PORT..."
cd /app/backend
node dist/server.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -f http://localhost:$PORT/api/health >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "🎨 Starting frontend server on port $FRONTEND_PORT..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in $(seq 1 60); do
    if curl -f http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Frontend failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

echo "🎉 Revision Sheet Generator is running!"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend API: http://localhost:$PORT"
echo ""
echo "📱 The application is mobile-first and optimized for touch devices"
echo "🤖 Supported AI providers: OpenAI, Mistral AI"
echo "📄 PDF generation: Puppeteer with Chromium"

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap shutdown TERM INT

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
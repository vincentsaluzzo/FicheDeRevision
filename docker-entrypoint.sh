#!/bin/sh

set -e

echo "🚀 Starting Revision Sheet Generator..."

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export DATABASE_PATH=${DATABASE_PATH:-/app/data/database/database.sqlite}
export UPLOADS_DIR=${UPLOADS_DIR:-/app/data/uploads}
export MAX_FILE_SIZE=${MAX_FILE_SIZE:-10485760}

mkdir -p "$(dirname "$DATABASE_PATH")"
mkdir -p "$UPLOADS_DIR"

echo "📁 Database path: $DATABASE_PATH"
echo "📁 Uploads directory: $UPLOADS_DIR"
if [ -n "$OPENAI_MODEL" ]; then
  echo "🤖 OpenAI model: $OPENAI_MODEL"
fi

echo "🌐 Listening on port $PORT"

echo ""
if [ -z "$OPENAI_API_KEY" ] && [ -z "$MISTRAL_API_KEY" ]; then
  echo "⚠️  Warning: Neither OPENAI_API_KEY nor MISTRAL_API_KEY is set"
  echo "   At least one AI provider key must be configured for the app to work"
fi

cd /app

exec npm run start

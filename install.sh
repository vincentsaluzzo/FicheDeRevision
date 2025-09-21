#!/bin/bash

# FicheDeRevision - One-click installer
# This script downloads and sets up the revision generator using pre-built Docker images

set -e

echo "🚀 Installing FicheDeRevision - Revision Sheet Generator"
echo "========================================================="

# Configuration
GITHUB_USER="yourusername"  # Replace with your GitHub username
GITHUB_REPO="FicheDeRevision"
INSTALL_DIR="revision-generator"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Create installation directory
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download docker-compose.yml
echo "📥 Downloading docker-compose.yml..."
curl -sSL "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/docker-compose.prod.yml" -o docker-compose.yml

# Download .env.example
echo "📥 Downloading .env.example..."
curl -sSL "https://raw.githubusercontent.com/$GITHUB_USER/$GITHUB_REPO/main/.env.example" -o .env.example

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: You need to configure your API keys!"
    echo "   Edit the .env file and add your OpenAI and/or Mistral API keys:"
    echo "   nano .env"
    echo ""
    echo "   At minimum, you need ONE of these keys:"
    echo "   - OPENAI_API_KEY=sk-your-openai-key-here"
    echo "   - MISTRAL_API_KEY=your-mistral-key-here"
    echo ""
fi

# Update image name in docker-compose.yml
echo "🔧 Configuring Docker image..."
sed -i.bak "s/yourusername/$GITHUB_USER/g" docker-compose.yml && rm docker-compose.yml.bak

echo "✅ Installation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your API keys:"
echo "   nano .env"
echo ""
echo "2. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "3. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "🔧 Useful commands:"
echo "   docker-compose logs -f     # View logs"
echo "   docker-compose down        # Stop application"
echo "   docker-compose pull        # Update to latest version"
echo ""
echo "📖 For more information, visit:"
echo "   https://github.com/$GITHUB_USER/$GITHUB_REPO"
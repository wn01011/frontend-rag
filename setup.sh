#!/bin/bash

echo "🚀 MCP Frontend RAG Server Setup"
echo "================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for .env file
if [ ! -f .env ]; then
    echo ""
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
fi

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

# Check for Docker
if command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker found. Starting ChromaDB..."
    docker-compose up -d
    
    # Wait for ChromaDB to be ready
    echo "⏳ Waiting for ChromaDB to start..."
    sleep 5
    
    # Test ChromaDB connection
    if curl -f http://localhost:8000/api/v1/heartbeat &> /dev/null; then
        echo "✅ ChromaDB is running!"
    else
        echo "⚠️  ChromaDB might not be ready yet. Please check docker-compose logs."
    fi
else
    echo ""
    echo "⚠️  Docker not found. Please start ChromaDB manually:"
    echo "   docker run -p 8000:8000 chromadb/chroma"
    echo "   or"
    echo "   pip install chromadb && chroma run"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OPENAI_API_KEY"
echo "2. Ensure ChromaDB is running on http://localhost:8000"
echo "3. Run 'npm run index' to index default guidelines"
echo "4. Add the server to your Claude Desktop configuration"
echo ""
echo "To start the server in development mode: npm run dev"
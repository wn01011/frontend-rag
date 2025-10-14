#!/bin/bash
# ChromaDB Auto-start Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start ChromaDB
echo "🚀 Starting ChromaDB..."
docker-compose up -d

# Wait for ChromaDB to be ready
echo "⏳ Waiting for ChromaDB to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
        echo "✅ ChromaDB is ready!"
        exit 0
    fi
    sleep 1
done

echo "⚠️  ChromaDB took too long to start. Please check logs:"
echo "   docker logs frontend-rag-chromadb-1"

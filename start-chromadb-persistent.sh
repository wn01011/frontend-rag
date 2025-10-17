#!/bin/bash

# Get the data directory
DATA_DIR="${FRONTEND_RAG_DATA_DIR:-$HOME/.frontend-rag}"
CHROMA_DATA_DIR="${CHROMA_DB_DATA:-$DATA_DIR/chroma_data}"

# Create directory if it doesn't exist
mkdir -p "$CHROMA_DATA_DIR"

echo "Starting ChromaDB with data directory: $CHROMA_DATA_DIR"

# Start ChromaDB with dynamic volume mount
docker run -d \
  --name frontend-rag-chromadb \
  -p 8000:8000 \
  -e IS_PERSISTENT=TRUE \
  -e PERSIST_DIRECTORY=/data \
  -e ANONYMIZED_TELEMETRY=FALSE \
  -v "$CHROMA_DATA_DIR:/data" \
  --health-cmd='curl -f http://localhost:8000/api/v1/heartbeat || exit 1' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=40s \
  chromadb/chroma:latest

echo "ChromaDB container started"
echo "Data will be persisted in: $CHROMA_DATA_DIR"

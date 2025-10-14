# Frontend RAG - MCP Server Setup Guide

Frontend development guidelines and templates powered by RAG (Retrieval-Augmented Generation).

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- Docker (for ChromaDB)
- Claude Desktop app

## Installation

### 1. Clone and Install

```bash
git clone <your-repo-url> frontend-rag
cd frontend-rag
npm install
npm run build
```

### 2. Start ChromaDB

```bash
docker-compose up -d
```

### 3. Index Default Guidelines

```bash
node dist/scripts/indexDefault.js
```

### 4. Configure Claude Desktop

Edit your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration (adjust paths to your installation):

```json
{
  "mcpServers": {
    "frontend-rag": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/frontend-rag/dist/index.js"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000",
        "PROJECT_ROOT": "/ABSOLUTE/PATH/TO/frontend-rag"
      }
    }
  }
}
```

**Important**: Replace `/ABSOLUTE/PATH/TO/frontend-rag` with your actual installation path.

### 5. Restart Claude Desktop

Restart the Claude Desktop app to load the MCP server.

## Usage

### Available Tools

1. **get_styling_guide** - Get styling guidelines
   ```
   "CSS Modules 가이드를 알려줘"
   ```

2. **get_component_template** - Get component templates
   ```
   "모달 컴포넌트 템플릿을 보여줘"
   ```

3. **validate_code_style** - Validate code style
4. **switch_project** - Switch project context
5. **index_guidelines** - Re-index guidelines

### Example Queries

- "CSS Modules styling guidelines를 알려줘"
- "React form component template을 보여줘"
- "Atomic Design pattern에 대해 설명해줘"
- "Performance optimization best practices는?"

## Directory Structure

```
frontend-rag/
├── guidelines/
│   └── default/
│       ├── styling/          # Style guidelines
│       ├── components/       # Component patterns
│       ├── best-practices/   # Best practices
│       └── templates/        # Component templates
├── chroma_data/             # ChromaDB data (persisted)
├── dist/                    # Built files
└── src/                     # Source code
```

## Adding Custom Guidelines

### 1. Create a Markdown File

Create a new `.md` file in `guidelines/default/` subdirectories:

```markdown
---
title: Your Guideline Title
type: style
category: your-category
tags: tag1,tag2,tag3
---

# Your Content Here

Your guideline content...
```

### 2. Re-index

```bash
node dist/scripts/indexDefault.js
```

### 3. Restart Claude Desktop

## Troubleshooting

### ChromaDB Not Running

```bash
# Check status
docker ps | grep chroma

# Restart ChromaDB
docker-compose restart

# View logs
docker logs frontend-rag-chromadb-1
```

### No Results Found

1. Check if ChromaDB is running
2. Verify data is indexed:
   ```bash
   node dist/scripts/checkCollection.js
   ```
3. Re-index if needed:
   ```bash
   node dist/scripts/indexDefault.js
   ```

### MCP Server Not Loading

1. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp-server-frontend-rag.log`
2. Verify paths in config are absolute paths
3. Ensure Node.js is in PATH

## Configuration

### Environment Variables

Edit `.env` file:

```env
# ChromaDB
CHROMA_DB_HOST=localhost
CHROMA_DB_PORT=8000

# Settings
AUTO_DETECT=true
MAX_SEARCH_RESULTS=5
SIMILARITY_THRESHOLD=0.0
```

### Project Settings

Edit `.mcp-project.json`:

```json
{
  "id": "your-project-id",
  "name": "your-project-name",
  "guidelines": {
    "path": "./guidelines/default"
  }
}
```

## Docker-Free Alternative

If you want to avoid Docker dependency, you can:
1. Use file-based search (coming soon)
2. Install ChromaDB locally (more complex)
3. Use a different vector database

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## License

MIT

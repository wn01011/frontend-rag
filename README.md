# MCP Frontend RAG Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities for frontend development guidelines and best practices.

## Features

- **Project-aware Guidelines**: Automatically detects and loads project-specific configurations
- **Semantic Search**: Uses vector embeddings to find relevant guidelines
- **Multi-collection Support**: Manages both default and project-specific guideline collections
- **Auto-indexing**: Automatically creates and indexes collections when switching projects
- **Smart Collection Management**: Checks for existing collections and data before creating new ones
- **MCP Tools**: Provides tools for styling guides, component templates, and code validation
- **Real-time Updates**: Automatically indexes new guidelines as they're added

## Installation

### Prerequisites

- Node.js 18+ 
- ChromaDB running locally (default: http://localhost:8000)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-frontend-rag
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and configure ChromaDB connection
```

4. Start ChromaDB:
```bash
# Using the provided script (recommended)
./start-chromadb-persistent.sh

# Or using Docker manually
docker run -d \
  --name frontend-rag-chromadb \
  -p 8000:8000 \
  -v ~/.frontend-rag/chroma_data:/data \
  chromadb/chroma
```

5. Build the project:
```bash
npm run build
```

6. Index default guidelines:
```bash
npm run index
```

## Configuration

### Claude Desktop Configuration

Add to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "frontend-rag": {
      "command": "node",
      "args": ["/path/to/mcp-frontend-rag/dist/index.js"],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000",
        "FRONTEND_RAG_DATA_DIR": "~/.frontend-rag",
        "AUTO_DETECT": "true"
      }
    }
  }
}
```

### Project Configuration

Create a `.mcp-project.json` file in your project root:

```json
{
  "id": "my-project",
  "name": "My Project",
  "version": "1.0.0",
  "vectorDbCollection": "my_project_collection",
  "priority": 1.5,
  "overrides": {
    "styling": "css-modules",
    "componentStructure": "atomic",
    "namingConvention": "PascalCase"
  },
  "guidelines": {
    "path": "./.mcp-guidelines",
    "autoIndex": true,
    "updateFrequency": "on-save"
  }
}
```

## Available MCP Tools

### 1. get_styling_guide
Retrieves styling guidelines based on your query.

```typescript
get_styling_guide({
  query: "button styling",
  context: "component",
  projectPath: "/path/to/project"
})
```

### 2. get_component_template
Returns component templates for specific types.

```typescript
get_component_template({
  componentType: "modal",
  projectPath: "/path/to/project"
})
```

### 3. validate_code_style
Validates code against project style guidelines.

```typescript
validate_code_style({
  code: "const MyComponent = () => {...}",
  fileType: "tsx",
  projectPath: "/path/to/project"
})
```

### 4. switch_project
Switches the active project context.

```typescript
switch_project({
  projectPath: "/path/to/new/project"
})
```

**Note**: When switching projects, the server will:
1. Check if a collection exists for the project
2. Create a new collection if none exists
3. Automatically index project guidelines if the collection is empty
4. Use existing data if the collection already has indexed documents

### 5. index_guidelines
Indexes or re-indexes project guidelines.

```typescript
index_guidelines({
  projectPath: "/path/to/project",
  force: true  // Set to true to force re-indexing
})
```

**Behavior**:
- Without `force`: Checks if collection exists and has data, skips if already indexed
- With `force: true`: Deletes existing collection and re-indexes from scratch

### 6. open_dashboard
Opens a web-based dashboard in your browser to visualize and interact with the RAG system.

```typescript
open_dashboard({
  port: 3001  // Optional: default is 3001
})
```

**Features**:
- 🔍 Search through indexed guidelines
- 📚 Browse all collections
- 📊 View collection statistics  
- 📄 Inspect document contents
- ⚙️ View configuration

**Note**: The dashboard runs on a local web server and automatically opens in your browser. The server keeps running until you close Claude or restart the MCP server.

## How Collection Management Works

The MCP server uses intelligent collection management:

1. **First Time Project Load**:
   - Creates a new collection for the project
   - Automatically indexes all guideline documents
   - Logs the number of documents indexed

2. **Subsequent Project Loads**:
   - Checks if collection exists
   - Verifies if collection has data
   - Uses existing data without re-indexing
   - Logs collection status

3. **Empty Collection Detection**:
   - If collection exists but is empty
   - Automatically triggers indexing
   - Ensures guidelines are always available

4. **Manual Re-indexing**:
   - Use `index_guidelines` with `force: true`
   - Useful after updating guidelines
   - Ensures latest content is indexed

## Guidelines Structure

```
guidelines/
├── default/                 # Default guidelines
│   ├── styling/
│   │   ├── css-modules.md
│   │   └── naming.md
│   └── components/
│       └── atomic.md
└── <project>/.mcp-guidelines/  # Project-specific
    ├── overrides.md
    └── custom-patterns.md
```

## Writing Guidelines

Guidelines should be in Markdown format with frontmatter:

```markdown
---
title: Component Naming Convention
type: style
category: naming
tags: [components, naming, conventions]
---

# Component Naming Convention

Your guideline content here...
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Troubleshooting

### ChromaDB Connection Issues
- Ensure ChromaDB is running on the correct port
- Check firewall settings
- Verify the CHROMA_DB_HOST and CHROMA_DB_PORT in .env

### Indexing Issues
- Verify guidelines directory exists
- Check file permissions
- Ensure markdown files have proper frontmatter
- Check ChromaDB connection

## Embedding Model

This MCP server uses **ChromaDB's default embedding model** (all-MiniLM-L6-v2), which:
- Runs locally without requiring API keys
- Provides good quality embeddings for English text
- Works offline once downloaded
- Is optimized for semantic search

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions, please open an issue on GitHub.
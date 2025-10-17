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
- **Web Dashboard**: Visual interface for browsing collections and testing searches

## Installation

### Quick Start (Recommended)

The easiest way to use this MCP server is via npm:

```bash
npm install -g mcp-frontend-rag
```

### Prerequisites

- Node.js 18+
- ChromaDB running locally (default: http://localhost:8000)

### Starting ChromaDB

```bash
# Using Docker (recommended)
docker run -d \
  --name frontend-rag-chromadb \
  -p 8000:8000 \
  -v ~/.frontend-rag/chroma_data:/chroma/chroma \
  chromadb/chroma

# Or using docker-compose
docker-compose up -d
```

## Claude Desktop Configuration

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

### Option 1: Using Global NPM Install (Recommended)

```json
{
  "mcpServers": {
    "frontend-rag": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-frontend-rag"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000"
      }
    }
  }
}
```

### Option 2: Using Local Installation

If you've cloned the repository:

```json
{
  "mcpServers": {
    "frontend-rag": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-frontend-rag/dist/index.js"
      ],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000"
      }
    }
  }
}
```

### Environment Variables

- `CHROMA_DB_HOST`: ChromaDB host (default: `localhost`)
- `CHROMA_DB_PORT`: ChromaDB port (default: `8000`)
- `FRONTEND_RAG_DATA_DIR`: Data directory (default: `~/.frontend-rag`)
- `AUTO_DETECT`: Auto-detect project config (default: `true`)

## First Time Setup

1. **Install the package**:
```bash
npm install -g mcp-frontend-rag
```

2. **Start ChromaDB**:
```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

3. **Add to Claude Desktop config** (see configuration above)

4. **Restart Claude Desktop**

5. **Test in Claude**:
```
Can you help me with CSS module naming conventions?
```

The MCP server will automatically index the default guidelines on first use!

## Available MCP Tools

### 1. get_styling_guide
Retrieves styling guidelines based on your query.

```typescript
get_styling_guide({
  query: "button styling",
  context: "component",
  projectPath: "/path/to/project"  // optional
})
```

### 2. get_component_template
Returns component templates for specific types.

```typescript
get_component_template({
  componentType: "modal",
  projectPath: "/path/to/project"  // optional
})
```

### 3. validate_code_style
Validates code against project style guidelines.

```typescript
validate_code_style({
  code: "const MyComponent = () => {...}",
  fileType: "tsx",
  projectPath: "/path/to/project"  // optional
})
```

### 4. switch_project
Switches the active project context.

```typescript
switch_project({
  projectPath: "/path/to/new/project"
})
```

### 5. index_guidelines
Indexes or re-indexes project guidelines.

```typescript
index_guidelines({
  projectPath: "/path/to/project",  // optional
  force: true  // Set to true to force re-indexing
})
```

### 6. create_project_collection
Creates a new collection for a project.

```typescript
create_project_collection({
  projectPath: "/path/to/project",
  collectionName: "my-project",  // optional
  force: false  // Set to true to recreate if exists
})
```

### 7. update_project_guidelines
Updates project guidelines by re-indexing.

```typescript
update_project_guidelines({
  projectPath: "/path/to/project",  // optional
  files: ["styling.md", "components.md"]  // optional, specific files
})
```

### 8. list_project_collections
Lists all available project collections.

```typescript
list_project_collections()
```

### 9. get_project_info
Gets information about the current project.

```typescript
get_project_info()
```

## Web Dashboard

Start the web dashboard to visualize your collections:

```bash
# If installed globally
npx mcp-frontend-rag dashboard

# Or if in the project directory
npm start
# Then visit: http://localhost:3000
```

Dashboard features:
- 🔍 **Search Test**: Test searches across collections
- 📚 **Collections**: Browse all indexed collections
- 📊 **Statistics**: View collection and document counts
- ⚙️ **Configuration**: Check server settings

## Project Configuration

Create a `.mcp-project.json` file in your project root for custom settings:

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

## Guidelines Structure

```
guidelines/
├── default/                 # Default guidelines (included)
│   ├── styling/
│   │   ├── css-modules.md
│   │   └── naming.md
│   ├── components/
│   │   └── atomic.md
│   └── templates/
│       ├── modal.md
│       └── form.md
└── <project>/.mcp-guidelines/  # Your project guidelines
    ├── custom-styles.md
    └── team-conventions.md
```

## Writing Custom Guidelines

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

## How Collection Management Works

The MCP server intelligently manages collections:

1. **First Time Project Load**:
   - Creates a new collection
   - Automatically indexes all guidelines
   - Logs indexing progress

2. **Subsequent Loads**:
   - Checks if collection exists
   - Uses existing data (no re-indexing)
   - Fast loading

3. **Manual Re-indexing**:
   - Use `index_guidelines` with `force: true`
   - Updates after guideline changes
   - Ensures latest content

## Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/wn01011/frontend-rag.git
cd frontend-rag

# Install dependencies
npm install

# Build
npm run build

# Start development mode
npm run dev
```

### Running Tests

```bash
npm test
```

## Troubleshooting

### MCP Server Not Showing in Claude

1. Check Claude Desktop config file location:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Verify JSON syntax is correct (no trailing commas)

3. Restart Claude Desktop completely

4. Check logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`

### ChromaDB Connection Issues

```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Restart ChromaDB
docker restart chromadb

# Check Docker logs
docker logs chromadb
```

### Collection/Indexing Issues

```bash
# Re-index with force
# In Claude, say: "Please re-index the guidelines with force: true"

# Or manually check collections
# In Claude, say: "List all project collections"
```

### Package Issues

```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install -g mcp-frontend-rag --force
```

## Embedding Model

This MCP server uses **ChromaDB's default embedding model** (all-MiniLM-L6-v2):
- ✅ Runs locally (no API keys needed)
- ✅ Works offline
- ✅ Good quality for English text
- ✅ Optimized for semantic search
- ✅ 384-dimensional embeddings

## Example Usage in Claude

```
You: "What are the best practices for CSS modules?"
Claude: [Uses get_styling_guide to search guidelines]

You: "Show me a modal component template"
Claude: [Uses get_component_template]

You: "Check if this code follows our style guide: const myButton = () => {...}"
Claude: [Uses validate_code_style]
```

## License

MIT

## Links

- **NPM**: https://www.npmjs.com/package/mcp-frontend-rag
- **GitHub**: https://github.com/wn01011/frontend-rag
- **Issues**: https://github.com/wn01011/frontend-rag/issues

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions, please open an issue on GitHub.

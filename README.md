# MCP Frontend RAG Server

A Model Context Protocol (MCP) server that provides RAG (Retrieval-Augmented Generation) capabilities for frontend development guidelines and best practices.

## Features

- **Project-aware Guidelines**: Automatically detects and loads project-specific configurations
- **Semantic Search**: Uses vector embeddings to find relevant guidelines
- **Multi-collection Support**: Manages both default and project-specific guideline collections
- **MCP Tools**: Provides tools for styling guides, component templates, and code validation
- **Real-time Updates**: Automatically indexes new guidelines as they're added

## Installation

### Prerequisites

- Node.js 18+ 
- ChromaDB running locally (default: http://localhost:8000)
- OpenAI API key for embeddings

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
# Edit .env and add your OPENAI_API_KEY
```

4. Start ChromaDB:
```bash
# Using Docker
docker run -p 8000:8000 chromadb/chroma

# Or install locally
pip install chromadb
chroma run --host localhost --port 8000
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
        "OPENAI_API_KEY": "your-api-key",
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000",
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

### 5. index_guidelines
Indexes or re-indexes project guidelines.

```typescript
index_guidelines({
  projectPath: "/path/to/project",
  force: true
})
```

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

### OpenAI API Issues
- Verify API key is valid
- Check API rate limits
- Ensure network connectivity

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions, please open an issue on GitHub.
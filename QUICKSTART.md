# Quick Start Guide - MCP Frontend RAG

## 🚀 3-Step Installation

### 1️⃣ Install ChromaDB

```bash
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v ~/.frontend-rag/chroma_data:/chroma/chroma \
  chromadb/chroma
```

### 2️⃣ Add to Claude Desktop Config

Open your Claude Desktop config:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this:

```json
{
  "mcpServers": {
    "frontend-rag": {
      "command": "npx",
      "args": ["-y", "mcp-frontend-rag"],
      "env": {
        "CHROMA_DB_HOST": "localhost",
        "CHROMA_DB_PORT": "8000"
      }
    }
  }
}
```

### 3️⃣ Restart Claude Desktop

That's it! 🎉

## ✅ Test It

Open Claude and ask:
```
Can you help me with CSS module naming conventions?
```

Claude will automatically use the MCP server to search guidelines!

## 🎯 What You Can Do

- **Get styling guides**: "What are the button styling best practices?"
- **Get templates**: "Show me a modal component template"
- **Validate code**: "Does this follow our style guide?"
- **Browse collections**: "List all project collections"

## 🌐 Web Dashboard

Want to see your collections visually?

```bash
# In your terminal
npx mcp-frontend-rag dashboard
```

Then visit: http://localhost:3000

## 🔧 Troubleshooting

### Claude doesn't see the MCP server

1. Check config file syntax (no trailing commas!)
2. Completely quit and restart Claude Desktop
3. Check logs: `~/Library/Logs/Claude/mcp*.log` (macOS)

### ChromaDB not connecting

```bash
# Check if running
curl http://localhost:8000/api/v1/heartbeat

# Restart if needed
docker restart chromadb
```

### Need help?

Open an issue: https://github.com/wn01011/frontend-rag/issues

---

📚 **Full Documentation**: [README.md](./README.md)

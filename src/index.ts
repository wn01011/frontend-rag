#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { RAGEngine } from './rag/engine.js';
import { ProjectDetector } from './project/detector.js';
import { getStylingGuideTool } from './tools/styling.js';
import { getComponentTemplateTool } from './tools/template.js';
import { validateCodeStyleTool } from './tools/validator.js';
import { openDashboardTool } from './tools/dashboard.js';
import {
  createProjectCollectionTool,
  updateProjectGuidelinesTool,
  listProjectCollectionsTool,
  getProjectInfoTool,
} from './tools/collection.js';
import {
  registerProjectTool,
  addGuidelineTool,
  listRegisteredProjectsTool,
  importGuidelinesTool,
  exportGuidelinesTool,
  migrateProjectTool,
} from './tools/registry.js';
import { logger } from './utils/logger.js';
import { getDataDir, getAllPaths } from './config/paths.js';
import { displayVersion, getVersion } from './version.js';

// Check for CLI flags
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  displayVersion();
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
mcp-frontend-rag v${getVersion()}

A Model Context Protocol server for frontend development guidelines with ChromaDB.

Usage:
  mcp-frontend-rag [options]

Options:
  -v, --version    Show version information
  -h, --help       Show this help message

For more information, visit:
https://github.com/wn01011/frontend-rag
  `);
  process.exit(0);
}

// Load environment variables
dotenv.config();

// Log data directory paths on startup
const paths = getAllPaths();
logger.info('Frontend RAG Data Paths:', paths);
logger.info(`Version: ${getVersion()}`);

// Initialize components
const ragEngine = new RAGEngine();
const projectDetector = new ProjectDetector();

// Define available tools with proper typing
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

const TOOLS: Tool[] = [
  {
    name: 'get_version',
    description: 'Get the current version of mcp-frontend-rag',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_styling_guide',
    description: 'Get styling guidelines for the current project',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for styling guidelines',
        },
        context: {
          type: 'string',
          description: 'Component type or context (optional)',
        },
        projectPath: {
          type: 'string',
          description: 'Project path (optional, auto-detected if not provided)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_component_template',
    description: 'Get component template for specific type',
    inputSchema: {
      type: 'object',
      properties: {
        componentType: {
          type: 'string',
          description: 'Type of component (page, modal, form, etc.)',
        },
        projectPath: {
          type: 'string',
          description: 'Project path (optional)',
        },
      },
      required: ['componentType'],
    },
  },
  {
    name: 'validate_code_style',
    description: 'Validate code against project style guidelines',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code to validate',
        },
        fileType: {
          type: 'string',
          description: 'File type (tsx, ts, css, etc.)',
        },
        projectPath: {
          type: 'string',
          description: 'Project path (optional)',
        },
      },
      required: ['code', 'fileType'],
    },
  },
  {
    name: 'switch_project',
    description: 'Switch to a different project context',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'index_guidelines',
    description: 'Index or re-index project guidelines',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project (optional)',
        },
        force: {
          type: 'boolean',
          description: 'Force re-indexing even if already indexed',
        },
      },
    },
  },
  {
    name: 'create_project_collection',
    description: 'Create a new collection for a project with custom configuration',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project',
        },
        collectionName: {
          type: 'string',
          description: 'Custom collection name (optional, auto-generated if not provided)',
        },
        force: {
          type: 'boolean',
          description: 'Force recreate collection if it exists',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'update_project_guidelines',
    description: 'Update project guidelines by re-indexing',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project (optional, uses current if not provided)',
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific files to update (optional, updates all if not provided)',
        },
      },
    },
  },
  {
    name: 'list_project_collections',
    description: 'List all available project collections in ChromaDB',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project_info',
    description: 'Get detailed information about the current project and its collection',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'open_dashboard',
    description: 'Open the web dashboard in browser to view collections, search, and manage guidelines',
    inputSchema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          description: 'Port to run dashboard server (default: 3001)',
        },
      },
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'mcp-frontend-rag',
    version: getVersion(),
  },
  {
    capabilities: {
      tools: {
        ...TOOLS,
      },
    },
  }
);

// Initialize server
async function initializeServer() {
  try {
    logger.info('Initializing MCP Frontend RAG Server...');
    
    // Initialize RAG engine
    await ragEngine.initialize();
    logger.info('RAG engine initialized');
    
    // No default project loading - let users switch to their projects as needed
    logger.info('Server ready. Use switch_project to load a project.');
    
    logger.info('Server initialization complete');
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    throw error;
  }
}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  
  try {
    logger.debug(`Tool called: ${name}`, args);
    
    switch (name) {
      case 'get_version':
        return {
          content: [
            {
              type: 'text',
              text: `mcp-frontend-rag v${getVersion()}\n\nA Model Context Protocol server for frontend development guidelines with ChromaDB.\n\nRepository: https://github.com/wn01011/frontend-rag`,
            },
          ],
        };
        
      case 'get_styling_guide':
        return await getStylingGuideTool(ragEngine, projectDetector, args);
        
      case 'get_component_template':
        return await getComponentTemplateTool(ragEngine, projectDetector, args);
        
      case 'validate_code_style':
        return await validateCodeStyleTool(ragEngine, projectDetector, args);
        
      case 'switch_project': {
        const projectPath = args.projectPath as string;
        if (!projectPath) {
          throw new Error('projectPath is required');
        }
        const project = await projectDetector.loadProject(projectPath);
        await ragEngine.loadProject(project);
        return {
          content: [
            {
              type: 'text',
              text: `Switched to project: ${project.name}`,
            },
          ],
        };
      }
      
      case 'index_guidelines': {
        const projectPath = (args.projectPath as string) || process.cwd();
        const force = (args.force as boolean) || false;
        
        const project = await projectDetector.loadProject(projectPath);
        const result = await ragEngine.indexGuidelines(project, force);
        
        return {
          content: [
            {
              type: 'text',
              text: `Indexed ${result.documentsIndexed} documents for project: ${project.name}`,
            },
          ],
        };
      }
      
      case 'create_project_collection':
        return await createProjectCollectionTool(ragEngine, projectDetector, args);
      
      case 'update_project_guidelines':
        return await updateProjectGuidelinesTool(ragEngine, projectDetector, args);
      
      case 'list_project_collections':
        return await listProjectCollectionsTool(ragEngine);
      
      case 'get_project_info':
        return await getProjectInfoTool(ragEngine);
      
      case 'open_dashboard':
        return await openDashboardTool(args);
      
      case 'register_project':
        return await registerProjectTool(args);
      
      case 'add_guideline':
        return await addGuidelineTool(args);
      
      case 'list_registered_projects':
        return await listRegisteredProjectsTool();
      
      case 'import_guidelines':
        return await importGuidelinesTool(args);
      
      case 'export_guidelines':
        return await exportGuidelinesTool(args);
      
      case 'migrate_project':
        return await migrateProjectTool(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Main function
async function main() {
  try {
    // Initialize server
    await initializeServer();
    
    // Create transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    logger.info('MCP Frontend RAG Server is running');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
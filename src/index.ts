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
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

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
];

// Create MCP server
const server = new Server(
  {
    name: 'mcp-frontend-rag',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
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
    
    // Auto-detect current project if enabled
    if (process.env.AUTO_DETECT === 'true') {
      const project = await projectDetector.detectCurrentProject();
      if (project) {
        logger.info(`Auto-detected project: ${project.name}`);
        await ragEngine.loadProject(project);
      }
    }
    
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
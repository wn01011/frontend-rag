import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new collection for a project
 */
export async function createProjectCollectionTool(
  ragEngine: RAGEngine,
  projectDetector: ProjectDetector,
  args: Record<string, unknown>
) {
  try {
    const projectPath = args.projectPath as string;
    const collectionName = args.collectionName as string;
    const force = (args.force as boolean) || false;

    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    // Load project config
    const project = await projectDetector.loadProject(projectPath);
    
    // Override collection name if provided
    if (collectionName) {
      project.vectorDbCollection = collectionName;
    }

    // Index guidelines with force option
    const result = await ragEngine.indexGuidelines(project, force);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Collection created successfully!

**Collection Name**: ${result.collectionName}
**Project**: ${project.name}
**Documents Indexed**: ${result.documentsIndexed}
**Force Reindex**: ${force}

The collection is now ready to use. Switch to this project to start querying.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in createProjectCollectionTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error creating collection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Update project guidelines by re-indexing specific files or all
 */
export async function updateProjectGuidelinesTool(
  ragEngine: RAGEngine,
  projectDetector: ProjectDetector,
  args: Record<string, unknown>
) {
  try {
    const projectPath = (args.projectPath as string) || process.cwd();
    const specificFiles = (args.files as string[]) || [];
    const force = true; // Always force when updating

    // Load project config
    const project = await projectDetector.loadProject(projectPath);

    // If specific files provided, we need to implement selective update
    // For now, we'll do a full re-index
    const result = await ragEngine.indexGuidelines(project, force);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Guidelines updated successfully!

**Project**: ${project.name}
**Collection**: ${result.collectionName}
**Documents Re-indexed**: ${result.documentsIndexed}

All guidelines have been refreshed and are ready to use.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in updateProjectGuidelinesTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error updating guidelines: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * List all available project collections
 */
export async function listProjectCollectionsTool(
  ragEngine: RAGEngine
) {
  try {
    // Get ChromaDB client from ragEngine (we need to expose it)
    const collections = await ragEngine.listAllCollections();

    if (collections.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📋 No collections found. Create a collection using `create_project_collection` tool.',
          },
        ],
      };
    }

    const collectionsList = collections
      .map((col, idx) => {
        return `${idx + 1}. **${col.name}** (${col.count} documents)`;
      })
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `📋 Available Collections:\n\n${collectionsList}\n\nUse \`switch_project\` to activate a specific collection.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in listProjectCollectionsTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error listing collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Get detailed info about current project and collection
 */
export async function getProjectInfoTool(
  ragEngine: RAGEngine
) {
  try {
    const currentProject = ragEngine.getCurrentProject();

    if (!currentProject) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ No project currently loaded. Use `switch_project` to load a project.',
          },
        ],
      };
    }

    const collectionInfo = await ragEngine.getCollectionInfo();

    return {
      content: [
        {
          type: 'text',
          text: `📊 Current Project Information

**Project Name**: ${currentProject.name}
**Project ID**: ${currentProject.id}
**Version**: ${currentProject.version || 'N/A'}
**Collection**: ${collectionInfo.name}
**Documents**: ${collectionInfo.count}
**Priority**: ${currentProject.priority || 1.0}

**Overrides**:
${Object.entries(currentProject.overrides || {})
  .map(([key, value]) => `  - ${key}: ${value}`)
  .join('\n') || '  None'}

**Guidelines Path**: ${currentProject.guidelines?.path || 'Not specified'}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in getProjectInfoTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error getting project info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

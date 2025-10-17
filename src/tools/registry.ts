import { ProjectRegistry } from '../project/registry.js';
import { RAGEngine } from '../rag/engine.js';
import { logger } from '../utils/logger.js';
import { readFile, writeFile, readdir, copyFile } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import { ProjectConfig } from '../project/config.js';

const registry = new ProjectRegistry();

/**
 * Register a new project in the MCP server
 */
export async function registerProjectTool(args: Record<string, unknown>) {
  try {
    const projectPath = args.projectPath as string;
    const projectId = args.projectId as string | undefined;
    const name = args.name as string | undefined;
    const importGuidelines = (args.importGuidelines as boolean) || false;

    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    // Register project
    const entry = await registry.registerProject(projectPath, {
      projectId,
      name,
    });

    // Import guidelines from .mcp-guidelines if exists and requested
    if (importGuidelines) {
      const localGuidelinesPath = join(projectPath, '.mcp-guidelines');
      if (existsSync(localGuidelinesPath)) {
        const files = await readdir(localGuidelinesPath);
        let importedCount = 0;

        for (const file of files) {
          if (file.endsWith('.md')) {
            const sourcePath = join(localGuidelinesPath, file);
            const destPath = join(entry.guidelinesPath, file);
            await copyFile(sourcePath, destPath);
            importedCount++;
          }
        }

        logger.info(`Imported ${importedCount} guidelines from ${localGuidelinesPath}`);
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Project registered successfully!

**Project ID**: ${entry.id}
**Name**: ${entry.name}
**Path**: ${entry.projectPath}
**Collection**: ${entry.collectionName}
**Guidelines Path**: ${entry.guidelinesPath}

${importGuidelines ? `Imported guidelines from .mcp-guidelines folder.` : ''}

Use \`add_guideline\` to add guidelines, or \`import_guidelines\` to import from a folder.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in registerProjectTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error registering project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Add a new guideline to a project
 */
export async function addGuidelineTool(args: Record<string, unknown>) {
  try {
    const projectId = args.projectId as string;
    const filename = args.filename as string;
    const content = args.content as string;

    if (!projectId || !filename || !content) {
      throw new Error('projectId, filename, and content are required');
    }

    const project = await registry.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const filePath = join(project.guidelinesPath, filename);
    await writeFile(filePath, content, 'utf-8');

    logger.info(`Added guideline: ${filename} to project ${projectId}`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Guideline added successfully!

**Project**: ${project.name}
**File**: ${filename}
**Path**: ${filePath}

Use \`update_project_guidelines\` to re-index if needed.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in addGuidelineTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error adding guideline: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * List all registered projects
 */
export async function listRegisteredProjectsTool() {
  try {
    const projects = await registry.listProjects();

    if (projects.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📋 No projects registered yet. Use `register_project` to add a project.',
          },
        ],
      };
    }

    const projectList = projects
      .map((p, idx) => {
        return `${idx + 1}. **${p.name}** (${p.id})
   Path: ${p.projectPath}
   Collection: ${p.collectionName}
   Last accessed: ${new Date(p.lastAccessed).toLocaleString()}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `📋 Registered Projects:\n\n${projectList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in listRegisteredProjectsTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error listing projects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Import guidelines from a local folder
 */
export async function importGuidelinesTool(args: Record<string, unknown>) {
  try {
    const projectId = args.projectId as string;
    const sourcePath = args.sourcePath as string;

    if (!projectId || !sourcePath) {
      throw new Error('projectId and sourcePath are required');
    }

    const project = await registry.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (!existsSync(sourcePath)) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    const files = await readdir(sourcePath);
    let importedCount = 0;

    for (const file of files) {
      if (file.endsWith('.md')) {
        const source = join(sourcePath, file);
        const dest = join(project.guidelinesPath, file);
        await copyFile(source, dest);
        importedCount++;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Guidelines imported successfully!

**Project**: ${project.name}
**Imported**: ${importedCount} files
**From**: ${sourcePath}
**To**: ${project.guidelinesPath}

Use \`update_project_guidelines\` to re-index.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in importGuidelinesTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error importing guidelines: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Export guidelines from a project
 */
export async function exportGuidelinesTool(args: Record<string, unknown>) {
  try {
    const projectId = args.projectId as string;
    const outputPath = args.outputPath as string;

    if (!projectId || !outputPath) {
      throw new Error('projectId and outputPath are required');
    }

    const project = await registry.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const files = await readdir(project.guidelinesPath);
    let exportedCount = 0;

    for (const file of files) {
      if (file.endsWith('.md')) {
        const source = join(project.guidelinesPath, file);
        const dest = join(outputPath, file);
        await copyFile(source, dest);
        exportedCount++;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Guidelines exported successfully!

**Project**: ${project.name}
**Exported**: ${exportedCount} files
**To**: ${outputPath}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in exportGuidelinesTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error exporting guidelines: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Migrate existing project (move .mcp-guidelines to MCP server)
 */
export async function migrateProjectTool(args: Record<string, unknown>) {
  try {
    const projectPath = args.projectPath as string;
    const projectId = args.projectId as string | undefined;
    const name = args.name as string | undefined;
    const cleanup = (args.cleanup as boolean) || false;

    if (!projectPath) {
      throw new Error('projectPath is required');
    }

    // Register project
    const entry = await registry.registerProject(projectPath, {
      projectId,
      name,
    });

    // Import guidelines from .mcp-guidelines
    const localGuidelinesPath = join(projectPath, '.mcp-guidelines');
    let importedCount = 0;

    if (existsSync(localGuidelinesPath)) {
      const files = await readdir(localGuidelinesPath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const sourcePath = join(localGuidelinesPath, file);
          const destPath = join(entry.guidelinesPath, file);
          await copyFile(sourcePath, destPath);
          importedCount++;
        }
      }
    }

    let cleanupMessage = '';
    if (cleanup && importedCount > 0) {
      // Note: Cleanup would delete files, but we'll just inform user for safety
      cleanupMessage = `\n\n⚠️ To cleanup the project folder, manually delete:\n- ${localGuidelinesPath}\n- ${join(projectPath, '.mcp-project.json')}`;
    }

    return {
      content: [
        {
          type: 'text',
          text: `✅ Project migrated successfully!

**Project ID**: ${entry.id}
**Name**: ${entry.name}
**Guidelines Imported**: ${importedCount} files
**New Guidelines Path**: ${entry.guidelinesPath}${cleanupMessage}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in migrateProjectTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error migrating project: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export { registry };

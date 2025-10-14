import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

export async function getStylingGuideTool(
  ragEngine: RAGEngine,
  projectDetector: ProjectDetector,
  args: any
): Promise<any> {
  const { query, context, projectPath } = args;
  
  try {
    // Load project if specified
    if (projectPath) {
      const project = await projectDetector.loadProject(projectPath);
      await ragEngine.loadProject(project);
    }
    
    // Search for styling guidelines
    const results = await ragEngine.search(query, {
      context: context || 'style',
      maxResults: 5,
    });
    
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No styling guidelines found for your query. Try being more specific or check if guidelines are indexed.',
          },
        ],
      };
    }
    
    // Format results
    const currentProject = ragEngine.getCurrentProject();
    const guidelines = results.map((r, i) => {
      const source = r.source === 'project' ? `[Project: ${currentProject?.name}]` : '[Default]';
      return `${i + 1}. ${source} ${r.metadata.title || 'Guideline'}\n\n${r.content}\n\n---`;
    }).join('\n\n');
    
    // Check for overrides
    const overrides = currentProject?.overrides || {};
    let overrideText = '';
    
    if (Object.keys(overrides).length > 0) {
      overrideText = '\n\n**Project Overrides:**\n' + 
        Object.entries(overrides)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n');
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `## Styling Guidelines\n\n${guidelines}${overrideText}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in getStylingGuideTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving styling guidelines: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
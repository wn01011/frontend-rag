import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

// Fallback templates (minimal, used only if RAG fails)
const fallbackTemplates: Record<string, string> = {
  page: 'Page template not found. Please index project guidelines.',
  modal: 'Modal template not found. Please index project guidelines.',
  form: 'Form template not found. Please index project guidelines.',
  component: 'Component template not found. Please index project guidelines.',
};

export async function getComponentTemplateTool(
  ragEngine: RAGEngine,
  projectDetector: ProjectDetector,
  args: any
): Promise<any> {
  const { componentType, projectPath } = args;
  
  try {
    // Load project if specified
    if (projectPath) {
      const project = await projectDetector.loadProject(projectPath);
      await ragEngine.loadProject(project);
    }
    
    // Try to get template from RAG
    const template = await ragEngine.getTemplate(componentType);
    
    if (template) {
      // Format the template nicely
      const formattedTemplate = formatTemplate(componentType, template);
      
      return {
        content: [
          {
            type: 'text',
            text: formattedTemplate,
          },
        ],
      };
    }
    
    // Fallback if no template found
    const fallbackMessage = fallbackTemplates[componentType] || 
                           fallbackTemplates.component;
    
    return {
      content: [
        {
          type: 'text',
          text: `## ${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Template

${fallbackMessage}

To add templates:
1. Create a template file in \`guidelines/default/templates/${componentType}.md\`
2. Run the indexing tool to add it to the database
3. Query again to get your custom template`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in getComponentTemplateTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error retrieving component template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

function formatTemplate(componentType: string, content: string): string {
  const title = componentType.charAt(0).toUpperCase() + componentType.slice(1);
  
  // If the content already has proper markdown formatting, return as is
  if (content.includes('```')) {
    return `## ${title} Template\n\n${content}`;
  }
  
  // Otherwise, wrap in code block
  return `## ${title} Template

\`\`\`tsx
${content}
\`\`\``;
}

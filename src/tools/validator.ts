import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

interface ValidationRule {
  pattern: RegExp;
  message: string;
  fileTypes: string[];
}

const defaultValidationRules: ValidationRule[] = [
  {
    pattern: /^[A-Z]/,
    message: 'Component names should start with uppercase letter',
    fileTypes: ['tsx', 'jsx'],
  },
  {
    pattern: /console\.(log|error|warn|info)/,
    message: 'Remove console statements from production code',
    fileTypes: ['ts', 'tsx', 'js', 'jsx'],
  },
  {
    pattern: /\/\/\s*TODO/,
    message: 'TODO comments should be resolved before committing',
    fileTypes: ['ts', 'tsx', 'js', 'jsx', 'css', 'scss'],
  },
  {
    pattern: /any/,
    message: 'Avoid using "any" type in TypeScript',
    fileTypes: ['ts', 'tsx'],
  },
];

export async function validateCodeStyleTool(
  ragEngine: RAGEngine,
  projectDetector: ProjectDetector,
  args: any
): Promise<any> {
  const { code, fileType, projectPath } = args;
  
  try {
    // Load project if specified
    if (projectPath) {
      const project = await projectDetector.loadProject(projectPath);
      await ragEngine.loadProject(project);
    }
    
    // Get validation result from RAG engine
    const validationResult = await ragEngine.validateStyle(code, fileType);
    
    // Apply default validation rules
    const violations: string[] = [...validationResult.violations];
    const suggestions: string[] = [...validationResult.suggestions];
    
    // Check against default rules
    for (const rule of defaultValidationRules) {
      if (rule.fileTypes.includes(fileType)) {
        if (rule.pattern.test(code)) {
          // Special handling for component name check
          if (rule.message.includes('Component names')) {
            const componentMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
            if (componentMatch && !rule.pattern.test(componentMatch[1])) {
              violations.push(rule.message);
            }
          } else if (rule.message.includes('console')) {
            violations.push(rule.message);
          } else if (rule.message.includes('TODO')) {
            suggestions.push(rule.message);
          } else if (rule.message.includes('any')) {
            const anyMatches = code.match(/:\s*any/g);
            if (anyMatches) {
              violations.push(`${rule.message} (found ${anyMatches.length} occurrences)`);
            }
          }
        }
      }
    }
    
    // Check project-specific custom rules
    const currentProject = ragEngine.getCurrentProject();
    if (currentProject?.rules?.customRules) {
      for (const customRule of currentProject.rules.customRules) {
        const pattern = new RegExp(customRule.pattern);
        if (pattern.test(code)) {
          violations.push(customRule.message);
        }
      }
    }
    
    // Add project-specific suggestions
    if (currentProject?.overrides) {
      const { styling, namingConvention } = currentProject.overrides;
      
      if (styling === 'css-modules' && fileType === 'tsx') {
        if (!code.includes('styles.') && !code.includes('className')) {
          suggestions.push('Consider using CSS modules for styling (import styles from "./Component.module.css")');
        }
      }
      
      if (styling === 'styled-components' && fileType === 'tsx') {
        if (!code.includes('styled')) {
          suggestions.push('Consider using styled-components for styling');
        }
      }
      
      if (namingConvention === 'PascalCase' && fileType === 'tsx') {
        const componentMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
        if (componentMatch && !/^[A-Z][a-zA-Z]*$/.test(componentMatch[1])) {
          violations.push(`Component name should follow PascalCase convention`);
        }
      }
    }
    
    const isValid = violations.length === 0;
    
    // Format response
    let response = `## Code Style Validation Result\n\n`;
    response += `**Status:** ${isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;
    
    if (violations.length > 0) {
      response += `### Violations Found:\n`;
      violations.forEach((v, i) => {
        response += `${i + 1}. ${v}\n`;
      });
      response += '\n';
    }
    
    if (suggestions.length > 0) {
      response += `### Suggestions:\n`;
      suggestions.forEach((s, i) => {
        response += `${i + 1}. ${s}\n`;
      });
      response += '\n';
    }
    
    if (isValid && suggestions.length === 0) {
      response += `Your code follows all the style guidelines! 🎉`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in validateCodeStyleTool:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error validating code style: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

const componentTemplates: Record<string, string> = {
  page: `import React from 'react';
import styles from './PageName.module.css';

interface PageNameProps {
  // Add props here
}

export const PageName: React.FC<PageNameProps> = (props) => {
  return (
    <div className={styles.container}>
      <h1>Page Title</h1>
      {/* Page content goes here */}
    </div>
  );
};

export default PageName;`,

  modal: `import React from 'react';
import styles from './ModalName.module.css';

interface ModalNameProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ModalName: React.FC<ModalNameProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <h2>{title}</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};`,

  form: `import React, { useState } from 'react';
import styles from './FormName.module.css';

interface FormNameProps {
  onSubmit: (data: FormData) => void;
}

interface FormData {
  // Define your form fields here
  field1: string;
  field2: string;
}

export const FormName: React.FC<FormNameProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    field1: '',
    field2: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="field1">Field 1</label>
        <input
          type="text"
          id="field1"
          name="field1"
          value={formData.field1}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className={styles.submitButton}>
        Submit
      </button>
    </form>
  );
};`,

  component: `import React from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Add props here
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  return (
    <div className={styles.container}>
      {/* Component content goes here */}
    </div>
  );
};`,
};

const styleTemplates: Record<string, string> = {
  default: `.container {
  padding: 1rem;
}

/* Add more styles here */`,

  modal: `.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.content {
  padding: 1rem;
}`,

  form: `.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formGroup label {
  font-weight: 500;
  color: #333;
}

.formGroup input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.submitButton {
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.submitButton:hover {
  background-color: #0056b3;
}`,
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
    
    // First, try to get custom template from RAG
    const customTemplate = await ragEngine.getTemplate(componentType);
    
    if (customTemplate) {
      return {
        content: [
          {
            type: 'text',
            text: `## Custom ${componentType} Template\n\n\`\`\`tsx\n${customTemplate}\n\`\`\``,
          },
        ],
      };
    }
    
    // Fall back to built-in templates
    const template = componentTemplates[componentType] || componentTemplates.component;
    const styleTemplate = styleTemplates[componentType] || styleTemplates.default;
    
    // Get current project settings
    const currentProject = ragEngine.getCurrentProject();
    let adjustedTemplate = template;
    let adjustedStyleTemplate = styleTemplate;
    
    // Apply project overrides
    if (currentProject?.overrides?.styling === 'styled-components') {
      adjustedTemplate = template.replace(
        "import styles from './",
        "import styled from 'styled-components';\n\n// import styles from './"
      );
      adjustedStyleTemplate = `import styled from 'styled-components';

export const Container = styled.div\`
  padding: 1rem;
\`;

// Add more styled components here`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `## ${componentType.charAt(0).toUpperCase() + componentType.slice(1)} Template

### Component Template:
\`\`\`tsx
${adjustedTemplate}
\`\`\`

### Style Template:
\`\`\`css
${adjustedStyleTemplate}
\`\`\`

### Test Template:
\`\`\`tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}Name } from './${componentType.charAt(0).toUpperCase() + componentType.slice(1)}Name';

describe('${componentType.charAt(0).toUpperCase() + componentType.slice(1)}Name', () => {
  it('renders correctly', () => {
    render(<${componentType.charAt(0).toUpperCase() + componentType.slice(1)}Name />);
    // Add assertions here
  });
});
\`\`\``,
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
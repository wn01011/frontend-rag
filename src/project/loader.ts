import { readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { ProjectConfig } from './config.js';
import { logger } from '../utils/logger.js';

export interface Document {
  id: string;
  content: string;
  metadata: {
    title?: string;
    type?: string;
    category?: string;
    tags?: string[];
    source: string;
    project?: string;
    [key: string]: any;
  };
}

export class DocumentLoader {
  private supportedExtensions = ['.md', '.mdx', '.txt', '.json'];

  async loadProjectGuidelines(project: ProjectConfig): Promise<Document[]> {
    const documents: Document[] = [];
    const guidelinePath = project.guidelines?.path || './.mcp-guidelines';
    const projectPath = project.rootPath || process.cwd();
    const fullPath = join(projectPath, guidelinePath);
    
    try {
      // Check if guidelines directory exists
      if (!existsSync(fullPath)) {
        logger.warn(`Guidelines directory not found: ${fullPath}`);
        return [];
      }
      
      // Load all markdown and text files
      const files = await this.findGuidelineFiles(fullPath);
      
      for (const file of files) {
        const doc = await this.loadDocument(file, project);
        if (doc) {
          documents.push(doc);
        }
      }
      
      logger.info(`Loaded ${documents.length} documents from ${fullPath}`);
      return documents;
    } catch (error) {
      logger.error('Failed to load project guidelines:', error);
      return [];
    }
  }

  async loadDefaultGuidelines(): Promise<Document[]> {
    const documents: Document[] = [];
    const defaultPath = join(process.cwd(), 'guidelines', 'default');
    
    try {
      if (!existsSync(defaultPath)) {
        logger.warn(`Default guidelines directory not found: ${defaultPath}`);
        return [];
      }
      
      const files = await this.findGuidelineFiles(defaultPath);
      
      for (const file of files) {
        const doc = await this.loadDocument(file, null);
        if (doc) {
          documents.push(doc);
        }
      }
      
      logger.info(`Loaded ${documents.length} default documents`);
      return documents;
    } catch (error) {
      logger.error('Failed to load default guidelines:', error);
      return [];
    }
  }

  private async findGuidelineFiles(directory: string): Promise<string[]> {
    const pattern = `**/*{${this.supportedExtensions.join(',')}}`;
    const files = await glob(pattern, {
      cwd: directory,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    });
    
    return files;
  }

  private async loadDocument(filePath: string, project: ProjectConfig | null): Promise<Document | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const ext = extname(filePath);
      
      let doc: Document;
      
      if (ext === '.md' || ext === '.mdx') {
        // Parse markdown with front matter
        const { data, content: markdownContent } = matter(content);
        
        doc = {
          id: uuidv4(),
          content: markdownContent,
          metadata: {
            ...data,
            source: filePath,
            type: data.type || this.inferType(filePath),
            category: data.category || this.inferCategory(filePath),
            title: data.title || basename(filePath, ext),
            project: project?.name,
            // Convert arrays to strings for ChromaDB
            tags: Array.isArray(data.tags) ? data.tags.join(',') : data.tags,
          },
        };
      } else if (ext === '.json') {
        // Handle JSON configuration files
        const jsonData = JSON.parse(content);
        
        doc = {
          id: uuidv4(),
          content: JSON.stringify(jsonData, null, 2),
          metadata: {
            source: filePath,
            type: 'config',
            title: basename(filePath, ext),
            project: project?.name,
            ...jsonData.metadata,
          },
        };
      } else {
        // Plain text files
        doc = {
          id: uuidv4(),
          content,
          metadata: {
            source: filePath,
            type: this.inferType(filePath),
            category: this.inferCategory(filePath),
            title: basename(filePath, ext),
            project: project?.name,
          },
        };
      }
      
      return doc;
    } catch (error) {
      logger.error(`Failed to load document ${filePath}:`, error);
      return null;
    }
  }

  private inferType(filePath: string): string {
    const path = filePath.toLowerCase();
    
    if (path.includes('style') || path.includes('css')) return 'style';
    if (path.includes('component')) return 'component';
    if (path.includes('template')) return 'template';
    if (path.includes('pattern')) return 'pattern';
    if (path.includes('performance')) return 'performance';
    if (path.includes('test')) return 'testing';
    
    return 'general';
  }

  private inferCategory(filePath: string): string {
    const parts = filePath.split('/');
    
    // Try to get category from folder structure
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      if (part !== 'guidelines' && part !== 'default' && part !== '.mcp-guidelines') {
        return part;
      }
    }
    
    return 'general';
  }
}
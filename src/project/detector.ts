import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { ProjectConfig, ProjectConfigSchema, defaultProjectConfig } from './config.js';
import { logger } from '../utils/logger.js';

export class ProjectDetector {
  private currentProject: ProjectConfig | null = null;
  private projectCache: Map<string, ProjectConfig> = new Map();

  async detectCurrentProject(startPath?: string): Promise<ProjectConfig | null> {
    const searchPath = startPath || process.cwd();
    
    // Simply return null - let the caller handle project loading
    // No need to search for .mcp-project.json files
    logger.info('Project detection: use switch_project to load a specific project');
    return null;
  }

  async loadProject(projectPath: string): Promise<ProjectConfig> {
    // Check cache first
    if (this.projectCache.has(projectPath)) {
      return this.projectCache.get(projectPath)!;
    }
    
    // Always create config from project path, no file needed
    const projectName = projectPath.split('/').pop() || 'unnamed-project';
    const projectId = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    const config: ProjectConfig = {
      ...defaultProjectConfig,
      id: projectId,
      name: projectName,
      version: '1.0.0',
      rootPath: projectPath,
    } as ProjectConfig;
    
    // Store in cache
    this.projectCache.set(projectPath, config);
    this.currentProject = config;
    
    logger.info(`Loaded project: ${config.name} (${config.id})`);
    return config;
  }

  async createProjectConfig(projectPath: string, config: Partial<ProjectConfig>): Promise<ProjectConfig> {
    const projectName = config.name || projectPath.split('/').pop() || 'unnamed-project';
    
    const fullConfig: ProjectConfig = {
      ...defaultProjectConfig,
      id: config.id || `project-${Date.now()}`,
      name: projectName,
      version: config.version || '1.0.0',
      ...config,
    } as ProjectConfig;
    
    // Validate config
    const validatedConfig = ProjectConfigSchema.parse(fullConfig);
    
    // Write to file
    const configPath = join(projectPath, '.mcp-project.json');
    const { writeFile } = await import('fs/promises');
    await writeFile(configPath, JSON.stringify(validatedConfig, null, 2));
    
    // Update cache
    this.projectCache.set(projectPath, validatedConfig);
    this.currentProject = validatedConfig;
    
    logger.info(`Created project config for: ${projectName}`);
    return validatedConfig;
  }

  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }

  clearCache(): void {
    this.projectCache.clear();
    this.currentProject = null;
  }
}
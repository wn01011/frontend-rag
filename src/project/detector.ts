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
    
    try {
      // Look for .mcp-project.json in current and parent directories
      let currentPath = searchPath;
      const root = '/';
      
      while (currentPath !== root) {
        const configPath = join(currentPath, '.mcp-project.json');
        
        if (existsSync(configPath)) {
          logger.info(`Found project config at: ${configPath}`);
          return await this.loadProject(currentPath);
        }
        
        const parent = dirname(currentPath);
        if (parent === currentPath) break;
        currentPath = parent;
      }
      
      logger.info('No project configuration found, using default settings');
      return null;
    } catch (error) {
      logger.error('Error detecting project:', error);
      return null;
    }
  }

  async loadProject(projectPath: string): Promise<ProjectConfig> {
    // Check cache first
    if (this.projectCache.has(projectPath)) {
      return this.projectCache.get(projectPath)!;
    }
    
    const configPath = join(projectPath, '.mcp-project.json');
    
    try {
      // Check if config file exists
      if (!existsSync(configPath)) {
        // Create default config for the project
        const projectName = projectPath.split('/').pop() || 'unnamed-project';
        const defaultConfig: ProjectConfig = {
          ...defaultProjectConfig,
          id: `project-${Date.now()}`,
          name: projectName,
          version: '1.0.0',
        } as ProjectConfig;
        
        this.currentProject = defaultConfig;
        this.projectCache.set(projectPath, defaultConfig);
        return defaultConfig;
      }
      
      // Read and parse config file
      const configContent = await readFile(configPath, 'utf-8');
      const rawConfig = JSON.parse(configContent);
      
      // Validate and merge with defaults
      const config = ProjectConfigSchema.parse({
        ...defaultProjectConfig,
        ...rawConfig,
      });
      
      // Store in cache
      this.projectCache.set(projectPath, config);
      this.currentProject = config;
      
      logger.info(`Loaded project: ${config.name} (${config.id})`);
      return config;
    } catch (error) {
      logger.error(`Failed to load project config from ${configPath}:`, error);
      
      // Return default config on error
      const projectName = projectPath.split('/').pop() || 'unnamed-project';
      const fallbackConfig: ProjectConfig = {
        ...defaultProjectConfig,
        id: `project-${Date.now()}`,
        name: projectName,
        version: '1.0.0',
      } as ProjectConfig;
      
      this.projectCache.set(projectPath, fallbackConfig);
      return fallbackConfig;
    }
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
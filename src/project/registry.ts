import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../utils/logger.js';
import { getProjectsDir, getRegistryPath } from '../config/paths.js';

export interface ProjectRegistryEntry {
  id: string;
  name: string;
  projectPath: string;
  registered: string;
  lastAccessed: string;
  collectionName: string;
  guidelinesPath: string;
}

export interface RegistryData {
  version: string;
  projects: Record<string, ProjectRegistryEntry>;
  lastUpdated: string;
}

export class ProjectRegistry {
  private registryPath: string;
  private projectsDir: string;

  constructor() {
    this.projectsDir = getProjectsDir();
    this.registryPath = getRegistryPath();

    // Ensure projects directory exists
    if (!existsSync(this.projectsDir)) {
      mkdirSync(this.projectsDir, { recursive: true });
    }
  }

  async loadRegistry(): Promise<RegistryData> {
    try {
      if (!existsSync(this.registryPath)) {
        const defaultRegistry: RegistryData = {
          version: '1.0.0',
          projects: {},
          lastUpdated: new Date().toISOString(),
        };
        await this.saveRegistry(defaultRegistry);
        return defaultRegistry;
      }

      const content = await readFile(this.registryPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to load registry:', error);
      throw error;
    }
  }

  async saveRegistry(data: RegistryData): Promise<void> {
    try {
      data.lastUpdated = new Date().toISOString();
      await writeFile(this.registryPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save registry:', error);
      throw error;
    }
  }

  async registerProject(
    projectPath: string,
    options: {
      projectId?: string;
      name?: string;
      collectionName?: string;
    } = {}
  ): Promise<ProjectRegistryEntry> {
    const registry = await this.loadRegistry();

    // Check if already registered
    const existing = Object.values(registry.projects).find(
      (p) => p.projectPath === projectPath
    );
    if (existing) {
      logger.info(`Project already registered: ${existing.id}`);
      return existing;
    }

    // Generate project ID if not provided
    const projectId =
      options.projectId ||
      `project-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const collectionName =
      options.collectionName || `mcp_frontend_${projectId.replace(/[^a-z0-9_]/gi, '_')}`;

    const guidelinesPath = join(this.projectsDir, projectId, 'guidelines');

    // Create project directory
    if (!existsSync(guidelinesPath)) {
      mkdirSync(guidelinesPath, { recursive: true });
    }

    const entry: ProjectRegistryEntry = {
      id: projectId,
      name: options.name || `Project ${projectId}`,
      projectPath,
      registered: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      collectionName,
      guidelinesPath,
    };

    registry.projects[projectPath] = entry;
    await this.saveRegistry(registry);

    logger.info(`Registered project: ${projectId} at ${projectPath}`);
    return entry;
  }

  async getProjectByPath(projectPath: string): Promise<ProjectRegistryEntry | null> {
    const registry = await this.loadRegistry();
    const entry = registry.projects[projectPath];

    if (entry) {
      // Update last accessed
      entry.lastAccessed = new Date().toISOString();
      await this.saveRegistry(registry);
      return entry;
    }

    return null;
  }

  async getProjectById(projectId: string): Promise<ProjectRegistryEntry | null> {
    const registry = await this.loadRegistry();
    return Object.values(registry.projects).find((p) => p.id === projectId) || null;
  }

  async listProjects(): Promise<ProjectRegistryEntry[]> {
    const registry = await this.loadRegistry();
    return Object.values(registry.projects);
  }

  async unregisterProject(projectPath: string): Promise<boolean> {
    const registry = await this.loadRegistry();

    if (registry.projects[projectPath]) {
      delete registry.projects[projectPath];
      await this.saveRegistry(registry);
      logger.info(`Unregistered project: ${projectPath}`);
      return true;
    }

    return false;
  }

  getProjectsDirectory(): string {
    return this.projectsDir;
  }

  getGuidelinesPath(projectId: string): string {
    return join(this.projectsDir, projectId, 'guidelines');
  }
}

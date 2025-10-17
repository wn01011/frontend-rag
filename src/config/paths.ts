import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Get the base data directory for frontend-rag
 * Priority:
 * 1. FRONTEND_RAG_DATA_DIR env variable
 * 2. ~/.frontend-rag (default)
 */
export function getDataDir(): string {
  const dataDir = process.env.FRONTEND_RAG_DATA_DIR || 
                  join(homedir(), '.frontend-rag');
  
  // Ensure directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  return dataDir;
}

/**
 * Get the projects directory
 */
export function getProjectsDir(): string {
  const projectsDir = join(getDataDir(), 'projects');
  
  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir, { recursive: true });
  }
  
  return projectsDir;
}

/**
 * Get the ChromaDB data directory
 */
export function getChromaDataDir(): string {
  const chromaDir = process.env.CHROMA_DB_DATA || 
                    join(getDataDir(), 'chroma_data');
  
  if (!existsSync(chromaDir)) {
    mkdirSync(chromaDir, { recursive: true });
  }
  
  return chromaDir;
}

/**
 * Get the registry file path
 */
export function getRegistryPath(): string {
  return join(getProjectsDir(), 'registry.json');
}

/**
 * Get all data paths
 */
export function getAllPaths() {
  return {
    dataDir: getDataDir(),
    projectsDir: getProjectsDir(),
    chromaDataDir: getChromaDataDir(),
    registryPath: getRegistryPath(),
  };
}

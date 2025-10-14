import { ChromaClient, Collection } from 'chromadb';
import { EmbeddingService } from './embeddings.js';
import { SearchService } from './search.js';
import { ProjectConfig } from '../project/config.js';
import { DocumentLoader } from '../project/loader.js';
import { logger } from '../utils/logger.js';

interface IndexResult {
  documentsIndexed: number;
  collectionName: string;
}

interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
  source: 'project' | 'default';
}

export class RAGEngine {
  private chromaClient: ChromaClient;
  private embeddingService: EmbeddingService;
  private searchService: SearchService;
  private documentLoader: DocumentLoader;
  private collections: Map<string, Collection>;
  private currentProject: ProjectConfig | null = null;
  private defaultCollectionName: string;

  constructor() {
    const host = process.env.CHROMA_DB_HOST || 'localhost';
    const port = process.env.CHROMA_DB_PORT || '8000';
    
    this.chromaClient = new ChromaClient({
      path: `http://${host}:${port}`,
    });
    
    this.embeddingService = new EmbeddingService();
    this.searchService = new SearchService(this.embeddingService);
    this.documentLoader = new DocumentLoader();
    this.collections = new Map();
    this.defaultCollectionName = process.env.DEFAULT_COLLECTION || 'mcp_frontend_default';
  }

  async initialize(): Promise<void> {
    try {
      // Test connection to ChromaDB
      await this.chromaClient.heartbeat();
      logger.info('Connected to ChromaDB');

      // Create or get default collection
      const defaultCollection = await this.getOrCreateCollection(this.defaultCollectionName);
      this.collections.set('default', defaultCollection);
      
      logger.info('RAG Engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RAG Engine:', error);
      throw new Error('RAG Engine initialization failed. Is ChromaDB running?');
    }
  }

  async loadProject(project: ProjectConfig): Promise<void> {
    this.currentProject = project;
    
    // Get or create project-specific collection
    const collectionName = project.vectorDbCollection || `mcp_frontend_${project.id}`;
    const collection = await this.getOrCreateCollection(collectionName);
    this.collections.set('project', collection);
    
    logger.info(`Loaded project: ${project.name} with collection: ${collectionName}`);
  }

  async indexGuidelines(project: ProjectConfig, force: boolean = false): Promise<IndexResult> {
    const collectionName = project.vectorDbCollection || `mcp_frontend_${project.id}`;
    
    // If force, delete and recreate collection
    if (force) {
      try {
        await this.chromaClient.deleteCollection({ name: collectionName });
        logger.info(`Deleted existing collection: ${collectionName}`);
      } catch (error) {
        // Collection doesn't exist, that's fine
      }
    } else {
      // Check if already indexed
      const collection = this.collections.get('project');
      if (collection) {
        const count = await collection.count();
        if (count > 0) {
          logger.info(`Collection ${collectionName} already has ${count} documents`);
          return { documentsIndexed: count, collectionName };
        }
      }
    }
    
    // Load documents from project guidelines
    const documents = await this.documentLoader.loadProjectGuidelines(project);
    
    if (documents.length === 0) {
      logger.warn(`No documents found for project: ${project.name}`);
      return { documentsIndexed: 0, collectionName };
    }
    
    // Get or create collection
    const collection = await this.getOrCreateCollection(collectionName);
    
    // Prepare documents for indexing
    const ids: string[] = [];
    const metadatas: Record<string, any>[] = [];
    const contents: string[] = [];
    
    for (const doc of documents) {
      ids.push(doc.id);
      contents.push(doc.content);
      metadatas.push(doc.metadata);
    }
    
    // Add to collection (ChromaDB will auto-generate embeddings)
    await collection.add({
      ids,
      metadatas,
      documents: contents,
    });
    
    logger.info(`Indexed ${documents.length} documents for project: ${project.name}`);
    return { documentsIndexed: documents.length, collectionName };
  }

  async search(
    query: string,
    options: {
      projectPath?: string;
      context?: string;
      maxResults?: number;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const maxResults = options.maxResults || parseInt(process.env.MAX_SEARCH_RESULTS || '5');
    const threshold = options.threshold || parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
    
    const results: SearchResult[] = [];
    
    // Search in project collection if available
    if (this.currentProject) {
      const projectCollection = this.collections.get('project');
      if (projectCollection) {
        const projectResults = await this.searchService.search(
          projectCollection,
          query,
          {
            maxResults,
            threshold,
            filter: options.context ? { type: options.context } : undefined,
          }
        );
        
          results.push(
            ...projectResults.map((r) => ({
              ...r,
              source: 'project' as const,
              score: r.score * (this.currentProject?.priority || 1.0),
            }))
          );
      }
    }
    
    // Search in default collection
    const defaultCollection = this.collections.get('default');
    if (defaultCollection) {
      const defaultResults = await this.searchService.search(
        defaultCollection,
        query,
        {
          maxResults,
          threshold,
          filter: options.context ? { type: options.context } : undefined,
        }
      );
      
      results.push(
        ...defaultResults.map((r) => ({
          ...r,
          source: 'default' as const,
        }))
      );
    }
    
    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  async getTemplate(templateType: string): Promise<string | null> {
    // Search for template in RAG with specific metadata filter
    const results = await this.search(`${templateType} template`, {
      context: 'template',
      maxResults: 1,
    });
    
    // Check if we found a matching template
    if (results.length > 0) {
      const result = results[0];
      // Verify it's the correct template type
      if (result.metadata.componentType === templateType || 
          result.metadata.type === 'template') {
        return result.content;
      }
    }
    
    return null;
  }

  async validateStyle(code: string, fileType: string): Promise<{
    isValid: boolean;
    violations: string[];
    suggestions: string[];
  }> {
    // Search for relevant style rules
    const rules = await this.search(`${fileType} style rules validation`, {
      context: 'style',
      maxResults: 10,
    });
    
    // Basic validation logic (to be enhanced)
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    // Extract rules and check against code
    for (const rule of rules) {
      // This is a simplified validation - in production, you'd parse and apply rules
      if (rule.metadata.ruleType === 'naming' && fileType === 'tsx') {
        if (!/^[A-Z]/.test(code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/)?.[1] || '')) {
          violations.push('Component names should start with uppercase letter');
        }
      }
      
      // Add suggestions from guidelines
      if (rule.metadata.suggestion) {
        suggestions.push(rule.metadata.suggestion);
      }
    }
    
    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
    };
  }

  private async getOrCreateCollection(name: string): Promise<Collection> {
    try {
      // Try to get existing collection
      return await this.chromaClient.getCollection({
        name,
        embeddingFunction: this.embeddingService.getEmbeddingFunction(),
      });
    } catch (error) {
      // Create new collection if it doesn't exist
      logger.info(`Creating new collection: ${name}`);
      return await this.chromaClient.createCollection({
        name,
        embeddingFunction: this.embeddingService.getEmbeddingFunction(),
      });
    }
  }

  getCurrentProject(): ProjectConfig | null {
    return this.currentProject;
  }
}
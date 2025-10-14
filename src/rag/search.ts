import { Collection } from 'chromadb';
import { EmbeddingService } from './embeddings.js';
import { logger } from '../utils/logger.js';

interface SearchOptions {
  maxResults?: number;
  threshold?: number;
  filter?: Record<string, any>;
}

interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export class SearchService {
  constructor(private embeddingService: EmbeddingService) {}

  async search(
    collection: Collection,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const maxResults = options.maxResults || 5;
    const threshold = options.threshold || 0.7;
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Search in collection
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: maxResults,
        where: options.filter,
      });
      
      // Process and filter results
      const searchResults: SearchResult[] = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 0;
          const score = 1 - distance; // Convert distance to similarity score
          
          if (score >= threshold) {
            searchResults.push({
              content: results.documents[0][i] || '',
              metadata: results.metadatas?.[0]?.[i] || {},
              score,
            });
          }
        }
      }
      
      return searchResults;
    } catch (error) {
      logger.error('Search failed:', error);
      return [];
    }
  }

  async semanticSearch(
    collection: Collection,
    query: string,
    context?: string
  ): Promise<SearchResult[]> {
    // Enhance query with context
    const enhancedQuery = context ? `${context} ${query}` : query;
    
    return this.search(collection, enhancedQuery, {
      maxResults: 10,
      threshold: 0.6,
    });
  }
}
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
    const threshold = options.threshold || 0.0; // ChromaDB distances, accept all results
    
    try {
      // Search in collection using queryTexts (ChromaDB will auto-generate embeddings)
      const results = await collection.query({
        queryTexts: [query],
        nResults: maxResults,
        where: options.filter,
      });
      
      // Process and filter results
      const searchResults: SearchResult[] = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances?.[0]?.[i] || 0;
          // ChromaDB uses L2 distance, convert to similarity score (lower distance = higher similarity)
          // Since distances can be > 1, we normalize differently
          const score = Math.max(0, 2 - distance) / 2; // Maps distance to 0-1 range
          
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
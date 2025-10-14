import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

export class EmbeddingService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for embeddings');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });
      
      return response.data.map(d => d.embedding);
    } catch (error) {
      logger.error('Failed to generate batch embeddings:', error);
      throw new Error('Batch embedding generation failed');
    }
  }

  getEmbeddingFunction() {
    return {
      generate: async (texts: string[]): Promise<number[][]> => {
        return this.generateBatchEmbeddings(texts);
      },
    };
  }
}
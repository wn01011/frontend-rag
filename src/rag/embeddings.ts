import { DefaultEmbeddingFunction } from 'chromadb';
import { logger } from '../utils/logger.js';

export class EmbeddingService {
  private embedder: DefaultEmbeddingFunction;

  constructor() {
    // ChromaDB의 기본 임베딩 함수 사용 (all-MiniLM-L6-v2 모델)
    this.embedder = new DefaultEmbeddingFunction();
    logger.info('Using ChromaDB default embeddings (all-MiniLM-L6-v2)');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddings = await this.embedder.generate([text]);
      return embeddings[0];
    } catch (error) {
      logger.error('Failed to generate embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await this.embedder.generate(texts);
    } catch (error) {
      logger.error('Failed to generate batch embeddings:', error);
      throw new Error('Batch embedding generation failed');
    }
  }

  getEmbeddingFunction() {
    // ChromaDB에서 직접 사용할 수 있는 임베딩 함수 반환
    return this.embedder;
  }
}

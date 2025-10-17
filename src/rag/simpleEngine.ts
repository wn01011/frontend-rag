import { logger } from '../utils/logger.js';

// Simple RAG engine using keyword-based search
export class SimpleRAGEngine {
  private documents: Map<string, any> = new Map();
  private projectDocuments: Map<string, any> = new Map();
  
  async initialize() {
    logger.info('SimpleRAG Engine initialized');
  }
  
  async addDocument(id: string, content: string, metadata: any, isProject: boolean = false) {
    const doc = {
      id,
      content: content.toLowerCase(),
      originalContent: content,
      metadata,
      keywords: this.extractKeywords(content)
    };
    
    if (isProject) {
      this.projectDocuments.set(id, doc);
    } else {
      this.documents.set(id, doc);
    }
  }
  
  private extractKeywords(text: string): Set<string> {
    // 중요한 키워드 추출
    const important = new Set<string>();
    
    // 기술 키워드 감지
    const techKeywords = [
      'button', 'component', 'style', 'css', 'react', 
      'atomic', 'design', 'folder', 'structure', 'naming',
      'convention', 'typescript', 'javascript', 'color',
      'spacing', 'typography', 'responsive', 'mobile'
    ];
    
    const lowerText = text.toLowerCase();
    
    techKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        important.add(keyword);
      }
    });
    
    // 일반 단어들도 추가
    const words = lowerText
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    words.forEach(word => important.add(word));
    
    return important;
  }
  
  search(query: string, options: any = {}) {
    const queryKeywords = this.extractKeywords(query);
    const results: any[] = [];
    
    // 프로젝트 문서 우선 검색
    const searchInDocs = (docs: Map<string, any>, priority: number) => {
      for (const [id, doc] of docs.entries()) {
        let score = 0;
        
        // 쿼리의 각 키워드가 문서에 있는지 확인
        queryKeywords.forEach(keyword => {
          if (doc.keywords.has(keyword)) {
            score += 1 * priority;
          }
          
          // 부분 매칭도 점수 부여
          doc.keywords.forEach((docKeyword: string) => {
            if (docKeyword.includes(keyword) || keyword.includes(docKeyword)) {
              score += 0.3 * priority;
            }
          });
        });
        
        // 제목에 키워드가 있으면 보너스
        const title = (doc.metadata.title || '').toLowerCase();
        queryKeywords.forEach(keyword => {
          if (title.includes(keyword)) {
            score += 2 * priority;
          }
        });
        
        if (score > 0) {
          results.push({
            content: doc.originalContent,
            metadata: doc.metadata,
            score
          });
        }
      }
    };
    
    // 프로젝트 문서 검색 (우선순위 높음)
    searchInDocs(this.projectDocuments, 1.5);
    
    // 기본 문서 검색
    searchInDocs(this.documents, 1.0);
    
    // 점수순 정렬 후 반환
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxResults || 5)
      .map(r => ({
        ...r,
        score: r.score / Math.max(...results.map(x => x.score)) // 정규화
      }));
  }
  
  async loadProject(project: any) {
    logger.info(`Loaded project: ${project.name} (using SimpleRAG)`);
  }
  
  async indexGuidelines(project: any, force: boolean = false) {
    // 실제 구현은 파일을 읽어서 addDocument 호출
    return { documentsIndexed: 0, collectionName: 'local' };
  }
  
  async validateStyle(code: string, fileType: string) {
    // 간단한 규칙 기반 검증
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    if (fileType === 'tsx' && !code.includes('React.FC')) {
      suggestions.push('Consider using React.FC for type safety');
    }
    
    if (code.includes('any')) {
      violations.push('Avoid using "any" type');
    }
    
    return { isValid: violations.length === 0, violations, suggestions };
  }
}

export default SimpleRAGEngine;
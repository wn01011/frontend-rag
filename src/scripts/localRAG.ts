#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

dotenv.config();

// 간단한 키워드 기반 매칭 시스템
class SimpleKeywordMatcher {
  private documents: Map<string, any> = new Map();
  
  async addDocuments(docs: Array<{id: string, content: string, metadata: any}>) {
    for (const doc of docs) {
      // 키워드 추출 (소문자 변환, 특수문자 제거)
      const keywords = this.extractKeywords(doc.content);
      this.documents.set(doc.id, {
        ...doc,
        keywords
      });
    }
  }
  
  private extractKeywords(text: string): Set<string> {
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
    );
  }
  
  search(query: string, maxResults: number = 5) {
    const queryKeywords = this.extractKeywords(query);
    const results: any[] = [];
    
    // 각 문서와 쿼리 비교
    for (const [id, doc] of this.documents.entries()) {
      let score = 0;
      
      // 공통 키워드 개수로 점수 계산
      for (const keyword of queryKeywords) {
        if (doc.keywords.has(keyword)) {
          score += 1;
        }
        // 부분 매칭 보너스
        for (const docKeyword of doc.keywords) {
          if (docKeyword.includes(keyword) || keyword.includes(docKeyword)) {
            score += 0.5;
          }
        }
      }
      
      if (score > 0) {
        results.push({
          id,
          content: doc.content,
          metadata: doc.metadata,
          score: score / queryKeywords.size // 정규화
        });
      }
    }
    
    // 점수 순으로 정렬
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }
}

// 가이드라인을 직접 메모리에 저장하고 검색
class LocalRAGServer {
  private matcher = new SimpleKeywordMatcher();
  private guidelines: Map<string, any> = new Map();
  
  async loadGuidelines() {
    console.log('📚 Loading guidelines into local RAG server...\n');
    
    // 가이드라인 파일들 찾기
    const guidelineFiles = [
      ...await glob('guidelines/default/**/*.md'),
      ...await glob('example-project/.mcp-guidelines/**/*.md')
    ];
    
    const documents = [];
    
    for (const filePath of guidelineFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        const doc = {
          id: filePath,
          content: markdownContent,
          metadata: {
            ...frontmatter,
            source: filePath,
            project: filePath.includes('example-project') ? 'example-project' : 'default'
          }
        };
        
        documents.push(doc);
        this.guidelines.set(filePath, doc);
        
        console.log(`  ✅ Loaded: ${frontmatter.title || path.basename(filePath)}`);
      } catch (error) {
        console.error(`  ❌ Error loading ${filePath}:`, error);
      }
    }
    
    // 매처에 문서 추가
    await this.matcher.addDocuments(documents);
    
    console.log(`\n✨ Loaded ${documents.length} guidelines!\n`);
    return documents.length;
  }
  
  search(query: string, options: any = {}) {
    console.log(`🔍 Searching for: "${query}"`);
    const results = this.matcher.search(query, options.maxResults || 5);
    
    console.log(`  Found ${results.length} results\n`);
    
    return results.map(r => ({
      ...r,
      score: (r.score * 100).toFixed(1) + '%'
    }));
  }
  
  getGuideline(id: string) {
    return this.guidelines.get(id);
  }
  
  getAllGuidelines() {
    return Array.from(this.guidelines.values());
  }
}

// 테스트 실행
async function testLocalRAG() {
  const rag = new LocalRAGServer();
  
  // 가이드라인 로드
  await rag.loadGuidelines();
  
  // 테스트 검색
  console.log('📊 Test Searches:\n');
  
  const testQueries = [
    'button style component',
    'color primary blue',
    'folder structure atomic',
    'naming convention pascal',
    'responsive mobile first',
    'spacing 8px grid'
  ];
  
  for (const query of testQueries) {
    const results = rag.search(query, { maxResults: 3 });
    
    console.log(`Query: "${query}"`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.score}] ${r.metadata.title || 'No title'} (${r.metadata.project})`);
    });
    console.log();
  }
  
  console.log('✅ Local RAG server works without any external API!');
}

// 실행
testLocalRAG().catch(console.error);
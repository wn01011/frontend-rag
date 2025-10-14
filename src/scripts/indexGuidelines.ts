#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddingFunction } from 'chromadb';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

dotenv.config();

async function indexAllGuidelines() {
  console.log('📚 Starting to index all guidelines...\n');
  
  const client = new ChromaClient({
    path: 'http://localhost:8000'
  });

  // 기본 임베딩 사용 (OpenAI API 키 문제로)
  console.log('⚠️  Using default embeddings (OpenAI quota exceeded)\n');

  // 메인 가이드라인 컬렉션 생성
  let mainCollection;
  try {
    // 기존 컬렉션 삭제
    try {
      await client.deleteCollection({ name: 'frontend_guidelines' });
    } catch (e) {}
    
    // 새 컬렉션 생성 (기본 임베딩 사용)
    mainCollection = await client.createCollection({
      name: 'frontend_guidelines'
    });
    console.log('✅ Created collection: frontend_guidelines\n');
  } catch (error) {
    console.error('Error creating collection:', error);
    return;
  }

  // 가이드라인 파일들 찾기
  const guidelineFiles = [
    // 기본 가이드라인
    ...await glob('guidelines/default/**/*.md'),
    // 예제 프로젝트 가이드라인
    ...await glob('example-project/.mcp-guidelines/**/*.md')
  ];

  console.log(`📄 Found ${guidelineFiles.length} guideline files\n`);

  const ids = [];
  const documents = [];
  const metadatas = [];

  // 각 파일 처리
  for (const filePath of guidelineFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      // 문서를 섹션으로 나누기
      const sections = markdownContent.split(/^##\s+/m);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        const lines = section.split('\n');
        const title = i === 0 ? frontmatter.title || 'Introduction' : lines[0];
        const content = i === 0 ? section : lines.slice(1).join('\n');
        
        ids.push(`${filePath}_section_${i}`);
        documents.push(`${title}\n\n${content}`);
        metadatas.push({
          source: filePath,
          title: title,
          type: frontmatter.type || 'general',
          category: frontmatter.category || 'general',
          section_index: i,
          project: filePath.includes('example-project') ? 'example-project' : 'default'
        });
        
        console.log(`  📝 Indexed: ${title} (${filePath})`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  // ChromaDB에 추가
  if (documents.length > 0) {
    await mainCollection.add({
      ids,
      documents,
      metadatas
    });
    
    console.log(`\n✨ Successfully indexed ${documents.length} document sections!\n`);
  }

  // 컬렉션 정보 출력
  const count = await mainCollection.count();
  console.log(`📊 Total documents in collection: ${count}\n`);

  // 테스트 검색
  console.log('🔍 Test searches:\n');
  
  const testQueries = [
    'button styling',
    'color palette design system',
    'folder structure',
    'atomic design',
    'component naming convention',
    'responsive breakpoints'
  ];

  for (const query of testQueries) {
    const results = await mainCollection.query({
      queryTexts: [query],
      nResults: 2
    });
    
    console.log(`Query: "${query}"`);
    if (results.documents && results.documents[0]) {
      results.documents[0].forEach((doc, i) => {
        const metadata = results.metadatas?.[0]?.[i];
        const distance = results.distances?.[0]?.[i] || 0;
        const similarity = ((1 - distance) * 100).toFixed(1);
        console.log(`  → [${similarity}%] ${metadata?.title} (${metadata?.project})`);
      });
    }
    console.log();
  }

  console.log('✅ Indexing complete! You can now search in the dashboard.');
}

indexAllGuidelines().catch(console.error);
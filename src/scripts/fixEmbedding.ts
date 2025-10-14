#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

dotenv.config();

async function fixAndIndex() {
  console.log('🔧 Fixing ChromaDB embedding issue and re-indexing...\n');
  
  const client = new ChromaClient({
    path: 'http://localhost:8000'
  });

  // DefaultEmbeddingFunction 사용 (chromadb-default-embed 패키지 필요)
  const embedder = new DefaultEmbeddingFunction();
  
  console.log('✅ Using DefaultEmbeddingFunction (local transformer model)\n');

  let mainCollection;
  try {
    // 기존 컬렉션 삭제
    try {
      await client.deleteCollection({ name: 'frontend_guidelines_v2' });
      console.log('Deleted old collection');
    } catch (e) {
      // 없으면 무시
    }
    
    // 새 컬렉션 생성 - 반드시 임베딩 함수 포함
    mainCollection = await client.createCollection({
      name: 'frontend_guidelines_v2',
      embeddingFunction: embedder  // 중요: 임베딩 함수 필수!
    });
    console.log('✅ Created new collection with embedding function\n');
  } catch (error) {
    console.error('Error creating collection:', error);
    return;
  }

  // 가이드라인 파일들 찾기
  const guidelineFiles = [
    ...await glob('guidelines/default/**/*.md'),
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
        
        console.log(`  📝 Processing: ${title}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  // ChromaDB에 추가
  if (documents.length > 0) {
    console.log('\n⏳ Adding documents to ChromaDB (this may take a moment)...');
    
    // 배치로 나누어 추가 (한 번에 너무 많으면 에러 발생)
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchDocs = documents.slice(i, i + batchSize);
      const batchMeta = metadatas.slice(i, i + batchSize);
      
      await mainCollection.add({
        ids: batchIds,
        documents: batchDocs,
        metadatas: batchMeta
      });
      
      console.log(`  Added batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`);
    }
    
    console.log(`\n✨ Successfully indexed ${documents.length} document sections!\n`);
  }

  // 컬렉션 정보 출력
  const count = await mainCollection.count();
  console.log(`📊 Total documents in collection: ${count}\n`);

  // 테스트 검색
  console.log('🔍 Test searches:\n');
  
  const testQueries = [
    'button styling',
    'color palette',
    'folder structure',
    'atomic design',
    'naming convention'
  ];

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    try {
      const results = await mainCollection.query({
        queryTexts: [query],
        nResults: 2
      });
      
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas?.[0]?.[i];
          const distance = results.distances?.[0]?.[i] || 0;
          const similarity = ((1 - distance) * 100).toFixed(1);
          console.log(`  → [${similarity}%] ${metadata?.title} (${metadata?.project})`);
        });
      }
    } catch (e) {
      console.log(`  ❌ Query error: ${e instanceof Error ? e.message : String(e)}`);
    }
    console.log();
  }

  console.log('✅ Fixed! Now update your server.js to use "frontend_guidelines_v2" collection.');
}

fixAndIndex().catch(console.error);
#!/usr/bin/env node
import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';
import fs from 'fs/promises';
import path from 'path';

/**
 * ChromaDB에 커스텀 데이터를 인덱싱하는 예제
 * 
 * 사용법:
 * 1. 이 스크립트를 수정하여 원하는 데이터를 추가
 * 2. npx tsx src/scripts/indexCustomData.ts 실행
 */

async function indexCustomData() {
  console.log('🚀 Starting custom data indexing...\n');

  // ChromaDB 클라이언트 연결
  const client = new ChromaClient({
    path: 'http://localhost:8000'
  });

  // 임베딩 함수 (기본 사용 - all-MiniLM-L6-v2 모델)
  const embedder = new DefaultEmbeddingFunction();

  // ====================================
  // 1. 새 컬렉션 만들기 (또는 기존 것 사용)
  // ====================================
  const collectionName = 'my_custom_collection';
  
  let collection;
  try {
    // 기존 컬렉션 삭제 (옵션)
    try {
      await client.deleteCollection({ name: collectionName });
      console.log(`Deleted existing collection: ${collectionName}`);
    } catch (e) {
      // 없으면 무시
    }

    // 새 컬렉션 생성
    collection = await client.createCollection({
      name: collectionName,
      embeddingFunction: embedder
    });
    console.log(`✅ Created collection: ${collectionName}\n`);
  } catch (error) {
    console.error('Error creating collection:', error);
    return;
  }

  // ====================================
  // 2. 인덱싱할 데이터 준비
  // ====================================
  
  // 예제 1: 직접 데이터 입력
  const manualData = [
    {
      id: 'doc1',
      content: `React Best Practices
      
      1. Component Structure
      - Keep components small and focused
      - Use functional components with hooks
      - Implement proper error boundaries
      
      2. State Management
      - Use local state when possible
      - Consider Redux for complex apps
      - Implement proper data flow`,
      metadata: {
        title: 'React Best Practices',
        type: 'guide',
        category: 'react',
        source: 'manual'
      }
    },
    {
      id: 'doc2',
      content: `TypeScript Configuration
      
      Essential tsconfig.json settings:
      - strict: true for type safety
      - esModuleInterop: true for better imports
      - skipLibCheck: true for faster builds
      
      Type definitions best practices:
      - Use interface for objects
      - Use type for unions and primitives
      - Avoid any type`,
      metadata: {
        title: 'TypeScript Configuration',
        type: 'config',
        category: 'typescript',
        source: 'manual'
      }
    }
  ];

  // 예제 2: 파일에서 읽기
  const fileData = [];
  try {
    // JSON 파일에서 읽기
    const jsonPath = '/Users/naron/Desktop/Personal/frontend-rag/data.json';
    // const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    // const jsonData = JSON.parse(jsonContent);
    // ... JSON 데이터 처리
  } catch (e) {
    // 파일이 없으면 스킵
  }

  // 예제 3: 여러 텍스트 파일 읽기
  const textFiles = [
    // '/path/to/file1.txt',
    // '/path/to/file2.txt'
  ];

  for (const filePath of textFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      fileData.push({
        id: `file_${path.basename(filePath)}`,
        content: content,
        metadata: {
          source: filePath,
          type: 'text',
          category: 'imported'
        }
      });
    } catch (e) {
      console.log(`Skipping ${filePath}: ${e.message}`);
    }
  }

  // ====================================
  // 3. ChromaDB에 추가
  // ====================================
  const allData = [...manualData, ...fileData];
  
  if (allData.length > 0) {
    const ids = allData.map(d => d.id);
    const documents = allData.map(d => d.content);
    const metadatas = allData.map(d => d.metadata);

    // 배치로 나누어 추가 (대량 데이터의 경우)
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchDocs = documents.slice(i, i + batchSize);
      const batchMeta = metadatas.slice(i, i + batchSize);
      
      await collection.add({
        ids: batchIds,
        documents: batchDocs,
        metadatas: batchMeta
      });
      
      console.log(`📝 Added batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`);
    }

    console.log(`\n✨ Successfully indexed ${documents.length} documents!\n`);
  }

  // ====================================
  // 4. 테스트 검색
  // ====================================
  console.log('🔍 Testing search...\n');
  
  const testQuery = 'React hooks state management';
  const results = await collection.query({
    queryTexts: [testQuery],
    nResults: 3
  });

  console.log(`Query: "${testQuery}"`);
  if (results.documents && results.documents[0]) {
    results.documents[0].forEach((doc, i) => {
      const metadata = results.metadatas?.[0]?.[i];
      const distance = results.distances?.[0]?.[i] || 0;
      const similarity = ((2 - distance) / 2 * 100).toFixed(1);
      
      console.log(`\n[${similarity}% match]`);
      console.log(`Title: ${metadata?.title}`);
      console.log(`Content: ${doc?.substring(0, 100)}...`);
    });
  }

  // ====================================
  // 5. 컬렉션 정보
  // ====================================
  const count = await collection.count();
  console.log(`\n📊 Total documents in collection: ${count}`);
  console.log('✅ Indexing complete!');
}

// 실행
indexCustomData().catch(console.error);

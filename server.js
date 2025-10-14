#!/usr/bin/env node
const express = require('express');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// API endpoint to check status
app.get('/api/status', async (req, res) => {
  const status = {
    chromadb: 'offline',
    openai: 'not-configured',
    collections: 0,
    env: {
      hasOpenAIKey: false,
      chromaHost: process.env.CHROMA_DB_HOST || 'localhost',
      chromaPort: process.env.CHROMA_DB_PORT || '8000'
    }
  };
  
  try {
    const { ChromaClient } = require('chromadb');
    const client = new ChromaClient({
      path: `http://${status.env.chromaHost}:${status.env.chromaPort}`
    });
    
    try {
      const collections = await client.listCollections();
      status.chromadb = 'online';
      status.collections = collections.length;
    } catch (error) {
      console.log('ChromaDB connection error:', error.message);
    }
  } catch (error) {
    console.log('ChromaDB module error:', error.message);
  }
  
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    status.openai = 'configured';
    status.env.hasOpenAIKey = true;
  }
  
  res.json(status);
});

// API endpoint for search - ChromaDB 기본 임베딩 사용
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.json({ error: 'Query parameter required' });
  }
  
  console.log(`🔍 Search query: "${query}"`);
  
  try {
    const { ChromaClient, DefaultEmbeddingFunction } = require('chromadb');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    // DefaultEmbeddingFunction 사용 (all-MiniLM-L6-v2 모델)
    const embedder = new DefaultEmbeddingFunction();
    
    try {
      const collection = await client.getCollection({
        name: 'frontend_guidelines_v2',
        embeddingFunction: embedder
      });
      
      // ChromaDB에서 검색
      const results = await collection.query({
        queryTexts: [query],
        nResults: 5
      });
      
      // 결과 포맷팅
      const formattedResults = [];
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas?.[0]?.[i] || {};
          const distance = results.distances?.[0]?.[i] || 0;
          
          // 거리를 유사도 점수로 변환 (0~100)
          // 거리가 0에 가까울수록 유사도 높음
          let similarity;
          if (distance <= 0) {
            similarity = 100;
          } else if (distance >= 2) {
            similarity = 0;
          } else {
            // 거리 0~2를 100~0으로 변환
            similarity = ((2 - distance) / 2 * 100).toFixed(1);
          }
          
          // 문서 내용 정리
          const cleanDoc = doc?.replace(/\n\n+/g, ' ').replace(/\s+/g, ' ').trim();
          
          formattedResults.push({
            content: cleanDoc?.substring(0, 200) + '...',
            metadata: metadata,
            score: similarity,
            distance: distance.toFixed(3)
          });
        });
      }
      
      console.log(`   Found ${formattedResults.length} results`);
      if (formattedResults.length > 0) {
        console.log(`   Top result: ${formattedResults[0].metadata.title} (${formattedResults[0].score}%)`);
      }
      
      res.json({ 
        success: true, 
        results: formattedResults,
        method: 'chromadb-embedding',
        model: 'all-MiniLM-L6-v2'
      });
    } catch (collectionError) {
      console.error('Collection error:', collectionError.message);
      
      // 컬렉션이 없거나 에러가 있을 경우
      res.json({ 
        success: false, 
        error: 'Collection error: ' + collectionError.message,
        hint: 'Run: npx tsx src/scripts/fixEmbedding.ts',
        results: [] 
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.json({ 
      success: false, 
      error: error.message, 
      results: [] 
    });
  }
});

// API endpoint for collections
app.get('/api/collections', async (req, res) => {
  try {
    const { ChromaClient } = require('chromadb');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    // 알려진 컬렉션들의 정보
    const knownCollections = [
      { name: 'frontend_guidelines_v2', totalDocuments: 47 },
      { name: 'test_rag_collection', totalDocuments: 4 },
      { name: 'mcp_frontend_test', totalDocuments: 3 }
    ];
    
    let totalDocs = 0;
    const collectionsInfo = [];
    
    for (const col of knownCollections) {
      try {
        const { DefaultEmbeddingFunction } = require('chromadb');
        const embedder = new DefaultEmbeddingFunction();
        
        const collection = await client.getCollection({
          name: col.name,
          embeddingFunction: embedder
        });
        
        const count = await collection.count();
        collectionsInfo.push({
          name: col.name,
          totalDocuments: count
        });
        totalDocs += count;
      } catch (e) {
        // 컬렉션이 없으면 스킵
        console.log(`Collection ${col.name} not found`);
      }
    }
    
    res.json({
      success: true,
      collections: collectionsInfo,
      totalDocuments: totalDocs
    });
  } catch (error) {
    console.error('Collections error:', error);
    res.json({
      success: false,
      error: error.message,
      collections: []
    });
  }
});

// API endpoint for collection details
app.get('/api/collections/:name', async (req, res) => {
  const collectionName = req.params.name;
  
  try {
    const { ChromaClient, DefaultEmbeddingFunction } = require('chromadb');
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    const embedder = new DefaultEmbeddingFunction();
    
    try {
      const collection = await client.getCollection({
        name: collectionName,
        embeddingFunction: embedder
      });
      
      // 컬렉션 정보 가져오기
      const count = await collection.count();
      
      // 샘플 문서 가져오기 (최대 10개로 늘림)
      const peek = await collection.peek({ limit: 10 });
      
      // 결과 포맷팅 - 전체 내용 포함
      const documents = [];
      if (peek.documents) {
        peek.documents.forEach((doc, i) => {
          documents.push({
            id: peek.ids?.[i],
            content: doc, // 전체 내용 반환 (잘리지 않음)
            metadata: peek.metadatas?.[i] || {}
          });
        });
      }
      
      res.json({
        success: true,
        collection: {
          name: collectionName,
          totalDocuments: count,
          sampleDocuments: documents
        }
      });
    } catch (collectionError) {
      console.error(`Collection ${collectionName} error:`, collectionError);
      res.json({
        success: false,
        error: `Collection '${collectionName}' not found or error accessing it`,
        collection: null
      });
    }
  } catch (error) {
    console.error('Collection details error:', error);
    res.json({
      success: false,
      error: error.message,
      collection: null
    });
  }
});

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🚀 MCP Frontend RAG Dashboard               ║
║                                                ║
║   Dashboard: http://localhost:${PORT}           ║
║   ChromaDB:  http://localhost:8000            ║
║                                                ║
║   Search Method: ChromaDB Embeddings          ║
║   Model: all-MiniLM-L6-v2 (384 dimensions)    ║
║                                                ║
║   Environment:                                ║`);
  console.log(`║   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Not needed'}       ║`);
  console.log(`║   CHROMA_DB_HOST: ${process.env.CHROMA_DB_HOST || 'localhost'}              ║`);
  console.log(`║   CHROMA_DB_PORT: ${process.env.CHROMA_DB_PORT || '8000'}                  ║`);
  console.log(`║                                                ║
║   Press Ctrl+C to stop                        ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
  
  // Auto-open browser
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} http://localhost:${PORT}`);
});
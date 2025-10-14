#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';

dotenv.config();

async function testPersistence() {
  console.log('🧪 Testing ChromaDB Persistence...\n');
  
  try {
    const client = new ChromaClient({
      path: 'http://localhost:8000',
    });
    
    await client.heartbeat();
    console.log('✅ ChromaDB is running\n');
    
    // Check if data persists
    const collection = await client.getOrCreateCollection({
      name: 'mcp_frontend_default',
    });
    
    const count = await collection.count();
    console.log(`📊 Collection has ${count} documents\n`);
    
    if (count > 0) {
      console.log('✅ Data is persisted in ChromaDB!\n');
      
      // Test query
      const results = await collection.query({
        queryTexts: ['modal template'],
        nResults: 2,
      });
      
      if (results.documents && results.documents[0]) {
        console.log('🔍 Sample search results:');
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas?.[0]?.[i];
          console.log(`\n${i + 1}. ${metadata?.title || 'Untitled'}`);
          console.log(`   Type: ${metadata?.type}`);
        });
      }
    } else {
      console.log('⚠️  No documents found. You need to re-index.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 Persistence Info:');
    console.log('='.repeat(60));
    console.log('- Data Location: /Users/naron/Desktop/Personal/frontend-rag/chroma_data');
    console.log('- Docker Volume: Mounted to container');
    console.log('- Restart Docker: Data WILL persist ✅');
    console.log('- Restart Claude: Data WILL persist ✅');
    console.log('- Delete chroma_data folder: Data WILL BE LOST ❌');
    
  } catch (error) {
    console.error('❌ ChromaDB is not running!');
    console.error('Start it with: docker-compose up -d\n');
    console.error('Error:', (error as Error).message);
  }
}

testPersistence();

#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';

dotenv.config();

async function checkCollection() {
  console.log('🔍 Checking collection contents...\n');
  
  try {
    const client = new ChromaClient({
      path: 'http://localhost:8000',
    });
    
    await client.heartbeat();
    console.log('✅ Connected to ChromaDB\n');
    
    // Get collection
    const collection = await client.getOrCreateCollection({
      name: 'mcp_frontend_default',
    });
    
    const count = await collection.count();
    console.log(`📊 Collection has ${count} documents\n`);
    
    if (count > 0) {
      // Try to query
      console.log('🔍 Testing query...\n');
      const results = await collection.query({
        queryTexts: ['CSS Modules'],
        nResults: 3,
      });
      
      console.log('Results:');
      if (results.documents && results.documents[0]) {
        results.documents[0].forEach((doc, i) => {
          const metadata = results.metadatas?.[0]?.[i];
          const distance = results.distances?.[0]?.[i];
          console.log(`\n${i + 1}. ${metadata?.title || 'Untitled'}`);
          console.log(`   Distance: ${distance}`);
          console.log(`   Type: ${metadata?.type}`);
          console.log(`   Preview: ${doc?.substring(0, 100)}...`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCollection();

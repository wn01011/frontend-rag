#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';

dotenv.config();

async function testSimpleAdd() {
  console.log('🧪 Testing ChromaDB simple add...\n');
  
  try {
    const client = new ChromaClient({
      path: 'http://localhost:8000',
    });
    
    await client.heartbeat();
    console.log('✅ Connected to ChromaDB\n');
    
    // Delete test collection if exists
    try {
      await client.deleteCollection({ name: 'test_simple' });
      console.log('🗑️  Deleted existing collection\n');
    } catch (e) {
      // Collection doesn't exist, that's fine
    }
    
    // Create collection
    const collection = await client.createCollection({
      name: 'test_simple',
    });
    console.log('✅ Created collection\n');
    
    // Test 1: Add simple document
    console.log('Test 1: Simple document');
    try {
      await collection.add({
        ids: ['doc1'],
        documents: ['This is a test document'],
        metadatas: [{ type: 'test' }],
      });
      console.log('✅ Success!\n');
    } catch (e) {
      console.error('❌ Failed:', (e as Error).message, '\n');
    }
    
    // Test 2: Add with complex metadata
    console.log('Test 2: Complex metadata');
    try {
      await collection.add({
        ids: ['doc2'],
        documents: ['Another test document'],
        metadatas: [{
          type: 'test',
          category: 'example',
          tags: 'tag1,tag2', // Changed to string
          title: 'Test Document',
        }],
      });
      console.log('✅ Success!\n');
    } catch (e) {
      console.error('❌ Failed:', (e as Error).message, '\n');
    }
    
    // Test 3: Query
    console.log('Test 3: Query');
    try {
      const results = await collection.query({
        queryTexts: ['test'],
        nResults: 2,
      });
      console.log('✅ Found', results.documents?.[0]?.length || 0, 'documents\n');
    } catch (e) {
      console.error('❌ Failed:', (e as Error).message, '\n');
    }
    
    console.log('✅ All tests complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSimpleAdd();

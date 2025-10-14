#!/usr/bin/env node
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';

// Load environment variables
dotenv.config();

async function testChromaDB() {
  console.log('🔍 Testing ChromaDB Connection...\n');
  
  const host = process.env.CHROMA_DB_HOST || 'localhost';
  const port = process.env.CHROMA_DB_PORT || '8000';
  
  try {
    const client = new ChromaClient({
      path: `http://${host}:${port}`,
    });
    
    // Test connection
    console.log(`📡 Connecting to ChromaDB at http://localhost:8000`);
    await client.heartbeat();
    console.log('✅ ChromaDB is connected and running!\n');
    
    // List collections
    console.log('📚 Current Collections:');
    const collections = await client.listCollections();
    
    if (collections.length === 0) {
      console.log('   No collections found.');
    } else {
      collections.forEach((col: any) => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Create test collection with default embeddings
    console.log('\n🔨 Creating test collection with default embeddings...');
    let testCollection;
    const collectionName = 'test_rag_collection';
    
    try {
      // Delete if exists
      try {
        await client.deleteCollection({ name: collectionName });
        console.log('   Deleted existing test collection');
      } catch (e) {
        // Collection doesn't exist, that's fine
      }
      
      // Create new collection
      testCollection = await client.createCollection({
        name: collectionName,
      });
      console.log(`   ✅ Created collection: ${collectionName}`);
    } catch (error) {
      console.error('   Error creating collection:', error);
      return;
    }
    
    // Add test documents
    console.log('\n📝 Adding test documents...');
    await testCollection.add({
      ids: ['doc1', 'doc2', 'doc3', 'doc4'],
      documents: [
        'CSS Modules provide local scope for CSS by default. Each class name is locally scoped to the component.',
        'React components should use PascalCase naming convention. This helps distinguish them from HTML elements.',
        'The Atomic Design methodology organizes components into atoms, molecules, organisms, templates, and pages.',
        'Performance optimization in React includes memoization with useMemo and useCallback hooks.'
      ],
      metadatas: [
        { type: 'styling', category: 'css-modules', source: 'guidelines' },
        { type: 'naming', category: 'conventions', source: 'guidelines' },
        { type: 'architecture', category: 'patterns', source: 'guidelines' },
        { type: 'performance', category: 'optimization', source: 'guidelines' }
      ],
    });
    console.log('   ✅ Added 4 test documents');
    
    // Query test
    console.log('\n🔎 Testing search functionality...');
    console.log('   Query: "How to style React components?"');
    
    const results = await testCollection.query({
      queryTexts: ['How to style React components?'],
      nResults: 3,
    });
    
    console.log('\n📊 Search Results:');
    if (results.documents && results.documents[0]) {
      results.documents[0].forEach((doc, i) => {
        const distance = results.distances?.[0]?.[i] || 0;
        const similarity = ((1 - distance) * 100).toFixed(1);
        const metadata = results.metadatas?.[0]?.[i] || {};
        
        console.log(`\n   ${i + 1}. [Relevance: ${similarity}%]`);
        console.log(`      Type: ${metadata.type} | Category: ${metadata.category}`);
        console.log(`      Content: "${doc?.substring(0, 100)}..."`);
      });
    }
    
    // Collection statistics
    console.log('\n📈 Collection Statistics:');
    const count = await testCollection.count();
    console.log(`   Total documents: ${count}`);
    
    // List all collections again
    console.log('\n📚 All Collections After Test:');
    const finalCollections = await client.listCollections();
    finalCollections.forEach((col: any) => {
      console.log(`   - ${col.name}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ ChromaDB is working perfectly!');
    console.log('='.repeat(60));
    
    console.log('\n💡 Next Steps:');
    console.log('1. ✅ ChromaDB is running at http://localhost:8000');
    console.log('2. ⚠️  You need an OpenAI API key for production embeddings');
    console.log('3. 📝 Add your API key to the .env file:');
    console.log('      OPENAI_API_KEY=your-api-key-here');
    console.log('4. 🚀 Your RAG server can now store and search documents!');
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error);
    console.log('\n' + '='.repeat(60));
    console.log('🔧 How to fix ChromaDB connection issues:');
    console.log('='.repeat(60));
    console.log('\n1. Start ChromaDB with Docker:');
    console.log('   cd /Users/naron/Desktop/Personal/frontend-rag');
    console.log('   docker-compose up -d');
    console.log('\n2. Check if ChromaDB is running:');
    console.log('   docker ps | grep chroma');
    console.log('\n3. Check ChromaDB logs:');
    console.log('   docker logs frontend-rag-chromadb-1');
    console.log('\n4. Restart ChromaDB if needed:');
    console.log('   docker-compose down');
    console.log('   docker-compose up -d');
    console.log('\n5. Make sure port 8000 is not in use:');
    console.log('   lsof -i :8000');
  }
}

// Run the test
console.log('=' .repeat(60));
console.log('🚀 MCP Frontend RAG - ChromaDB Connection Test');
console.log('='.repeat(60) + '\n');

testChromaDB().catch(console.error);
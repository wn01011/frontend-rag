import { ChromaClient } from 'chromadb';

async function checkChromaDB() {
  const client = new ChromaClient({
    path: 'http://localhost:8000',
  });

  try {
    // 1. Heartbeat
    await client.heartbeat();
    console.log('✅ ChromaDB is running');

    // 2. List collections
    const collections = await client.listCollections();
    console.log('\n📚 Collections:');
    
    for (const col of collections) {
      const colName = typeof col === 'string' ? col : col.name;
      console.log(`  - ${colName}`);
      
      try {
        const collection = await client.getCollection({ name: colName });
        const count = await collection.count();
        console.log(`    Documents: ${count}`);
        
        // Get first document
        if (count > 0) {
          const peek = await collection.peek({ limit: 1 });
          if (peek.documents && peek.documents[0]) {
            const preview = peek.documents[0].substring(0, 100);
            console.log(`    Preview: "${preview}..."`);
          }
        }
      } catch (e) {
        console.log(`    Error reading collection: ${e}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkChromaDB();

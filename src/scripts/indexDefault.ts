#!/usr/bin/env node
import dotenv from 'dotenv';
import { RAGEngine } from '../rag/engine.js';
import { ProjectDetector } from '../project/detector.js';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

async function indexDefaultGuidelines() {
  console.log('🚀 Indexing Default Guidelines...\n');
  
  try {
    // Initialize RAG engine
    const ragEngine = new RAGEngine();
    await ragEngine.initialize();
    console.log('✅ RAG Engine initialized\n');
    
    // Load project
    const projectDetector = new ProjectDetector();
    const projectPath = '/Users/naron/Desktop/Personal/frontend-rag';
    const project = await projectDetector.loadProject(projectPath);
    
    console.log(`📁 Project: ${project.name}`);
    console.log(`📂 Guidelines path: ${project.guidelines?.path}\n`);
    
    // Index guidelines
    const result = await ragEngine.indexGuidelines(project, true);
    
    console.log(`\n✨ Successfully indexed ${result.documentsIndexed} documents!`);
    console.log(`📦 Collection: ${result.collectionName}\n`);
    
    // Test search
    console.log('🔍 Testing search...\n');
    await ragEngine.loadProject(project);
    
    const searchResults = await ragEngine.search('CSS Modules styling', {
      maxResults: 3,
    });
    
    if (searchResults.length > 0) {
      console.log('Found documents:');
      searchResults.forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.metadata.title || 'Untitled'}`);
        console.log(`   Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`   Type: ${result.metadata.type}`);
        console.log(`   Preview: ${result.content.substring(0, 100)}...`);
      });
    } else {
      console.log('❌ No documents found. Something went wrong.');
    }
    
    console.log('\n✅ Indexing complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

indexDefaultGuidelines();

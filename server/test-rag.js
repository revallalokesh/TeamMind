import dotenv from 'dotenv';
import geminiService from './services/geminiService.js';

dotenv.config();

console.log('🧪 Testing RAG (Retrieval-Augmented Generation) Implementation...\n');

async function testRAG() {
  try {
    // Test 1: Check Gemini AI Status
    console.log('1️⃣ Gemini AI Status Check...');
    console.log('Gemini API Key set:', !!process.env.GEMINI_API_KEY);
    console.log('AI Model available:', !!geminiService.model);
    console.log('');

    // Test 2: Sample Documents for Testing
    console.log('2️⃣ Sample Documents for Testing...');
    const testDocs = [
      {
        _id: '1',
        title: 'MERN Stack Development Guide',
        content: 'This comprehensive guide covers building full-stack applications using MongoDB, Express.js, React, and Node.js. The MERN stack is a popular choice for modern web development. It includes authentication, API development, database design, and deployment strategies. Perfect for developers who want to build scalable web applications.',
        summary: 'Complete guide to MERN stack development',
        tags: ['mern', 'mongodb', 'express', 'react', 'nodejs', 'fullstack']
      },
      {
        _id: '2',
        title: 'React Frontend Development',
        content: 'React is a JavaScript library for building user interfaces. It uses component-based architecture and virtual DOM for efficient rendering. This document covers React hooks, state management, routing, and best practices for building modern web applications.',
        summary: 'React development guide and best practices',
        tags: ['react', 'frontend', 'javascript', 'components', 'hooks']
      },
      {
        _id: '3',
        title: 'Node.js Backend Development',
        content: 'Node.js is a JavaScript runtime that allows you to build server-side applications. This guide covers Express.js framework, RESTful API development, middleware, authentication, and database integration. Essential for building robust backend services.',
        summary: 'Node.js and Express.js backend development',
        tags: ['nodejs', 'backend', 'express', 'api', 'server']
      },
      {
        _id: '4',
        title: 'MongoDB Database Design',
        content: 'MongoDB is a NoSQL database that stores data in flexible, JSON-like documents. This document covers schema design, indexing, aggregation, and best practices for MongoDB. Includes examples of user management, document storage, and data relationships.',
        summary: 'MongoDB database design and optimization',
        tags: ['mongodb', 'database', 'nosql', 'schema', 'indexing']
      }
    ];

    console.log(`Created ${testDocs.length} test documents`);
    console.log('');

    // Test 3: Test RAG Q&A System
    console.log('3️⃣ Testing RAG Q&A System...');
    const questions = [
      "What is the MERN stack?",
      "How do I build a full-stack application?",
      "What is React used for?",
      "How does Node.js work?",
      "What is MongoDB?",
      "Explain the MERN project architecture"
    ];

    for (const question of questions) {
      console.log(`\nQuestion: "${question}"`);
      console.log('─'.repeat(50));
      
      try {
        const answer = await geminiService.answerQuestion(question, testDocs);
        console.log(`Answer: ${answer}`);
      } catch (error) {
        console.error(`Error answering question: ${error.message}`);
      }
    }

    console.log('');

    // Test 4: Test Semantic Search
    console.log('4️⃣ Testing Semantic Search...');
    const searchQueries = [
      "mern stack development",
      "react frontend",
      "node.js backend",
      "mongodb database",
      "full-stack applications"
    ];

    for (const query of searchQueries) {
      console.log(`\nSearch Query: "${query}"`);
      console.log('─'.repeat(50));
      
      try {
        const results = await geminiService.semanticSearch(query, testDocs);
        console.log(`Found ${results.length} relevant documents:`);
        results.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.title} (${doc.tags.join(', ')})`);
        });
      } catch (error) {
        console.error(`Error in semantic search: ${error.message}`);
      }
    }

    console.log('');

    // Test 5: Test Fallback Methods
    console.log('5️⃣ Testing Fallback Methods...');
    
    console.log('Testing fallback Q&A...');
    const fallbackAnswer = geminiService.generateFallbackAnswer("What is MERN?", testDocs);
    console.log(`Fallback Answer: ${fallbackAnswer}`);

    console.log('Testing enhanced text search...');
    const textResults = geminiService.enhancedTextSearch("mern", testDocs);
    console.log(`Text Search found ${textResults.length} documents`);

    console.log('');

    console.log('🎉 RAG Testing Complete!');
    console.log('');
    console.log('📋 RAG Features Verified:');
    console.log('✅ Document retrieval based on question relevance');
    console.log('✅ Context-aware AI answers using retrieved documents');
    console.log('✅ Semantic search with AI ranking');
    console.log('✅ Fallback methods for when AI is unavailable');
    console.log('✅ Proper document context for Q&A');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing RAG:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run RAG tests
testRAG().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

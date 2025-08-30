import dotenv from 'dotenv';
import geminiService from './services/geminiService.js';

dotenv.config();

console.log('🧪 Testing Gemini AI Service...\n');

async function testAIFeatures() {
  try {
    // Test 1: Summary Generation
    console.log('1️⃣ Testing Summary Generation...');
    const testContent = "This is a test document about web development. It covers topics like React, Node.js, and MongoDB. The document explains how to build full-stack applications using modern technologies.";
    const summary = await geminiService.generateSummary(testContent);
    console.log('✅ Summary:', summary);
    console.log('');

    // Test 2: Tag Generation
    console.log('2️⃣ Testing Tag Generation...');
    const testTitle = "Web Development Guide";
    const tags = await geminiService.generateTags(testTitle, testContent);
    console.log('✅ Tags:', tags);
    console.log('');

    // Test 3: Q&A
    console.log('3️⃣ Testing Q&A...');
    const testDocs = [
      {
        _id: '1',
        title: 'Web Development Guide',
        content: 'This guide covers React, Node.js, and MongoDB for building full-stack applications.',
        summary: 'Comprehensive guide to modern web development',
        tags: ['web', 'react', 'nodejs', 'mongodb']
      }
    ];
    const answer = await geminiService.answerQuestion("What technologies are covered in the web development guide?", testDocs);
    console.log('✅ Answer:', answer);
    console.log('');

    // Test 4: Semantic Search
    console.log('4️⃣ Testing Semantic Search...');
    const searchResults = await geminiService.semanticSearch("web development technologies", testDocs);
    console.log('✅ Search Results:', searchResults.length, 'documents found');
    console.log('');

    console.log('🎉 All AI features are working!');
    
  } catch (error) {
    console.error('❌ Error testing AI features:', error);
  }
}

testAIFeatures();

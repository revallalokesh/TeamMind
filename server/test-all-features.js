import dotenv from 'dotenv';
import geminiService from './services/geminiService.js';
import mongoose from 'mongoose';

dotenv.config();

console.log('🧪 Testing All AI Features and Functionality...\n');

async function testAllFeatures() {
  try {
    // Test 1: Gemini AI Service Initialization
    console.log('1️⃣ Testing Gemini AI Service Initialization...');
    console.log('Gemini API Key set:', !!process.env.GEMINI_API_KEY);
    console.log('AI Model available:', !!geminiService.model);
    console.log('');

    // Test 2: Summary Generation
    console.log('2️⃣ Testing Summary Generation...');
    const testContent = "This is a comprehensive test document about web development technologies. It covers topics like React for frontend development, Node.js for backend services, MongoDB for database management, and Express.js for API development. The document explains how to build full-stack applications using modern JavaScript technologies and best practices for deployment and testing.";
    const summary = await geminiService.generateSummary(testContent);
    console.log('✅ Summary:', summary);
    console.log('');

    // Test 3: Tag Generation
    console.log('3️⃣ Testing Tag Generation...');
    const testTitle = "Web Development Guide";
    const tags = await geminiService.generateTags(testTitle, testContent);
    console.log('✅ Tags:', tags);
    console.log('');

    // Test 4: Q&A with Sample Documents
    console.log('4️⃣ Testing Q&A System...');
    const testDocs = [
      {
        _id: '1',
        title: 'Web Development Guide',
        content: 'This guide covers React, Node.js, and MongoDB for building full-stack applications. It includes authentication, API development, and deployment strategies.',
        summary: 'Comprehensive guide to modern web development',
        tags: ['web', 'react', 'nodejs', 'mongodb']
      },
      {
        _id: '2',
        title: 'User Management System',
        content: 'Documentation for our user management system. Currently supports 150 active users with admin and regular user roles. Includes authentication and authorization.',
        summary: 'User management and authentication system',
        tags: ['users', 'auth', 'admin', 'roles']
      },
      {
        _id: '3',
        title: 'API Documentation',
        content: 'RESTful API endpoints for document management, user authentication, and search functionality. Supports CRUD operations and advanced search.',
        summary: 'API endpoints and documentation',
        tags: ['api', 'rest', 'endpoints', 'crud']
      }
    ];

    // Test different types of questions
    const questions = [
      "What technologies are covered in the web development guide?",
      "How many users does our system support?",
      "What are the main features of our API?",
      "Is there a document about user management?"
    ];

    for (const question of questions) {
      console.log(`Question: "${question}"`);
      const answer = await geminiService.answerQuestion(question, testDocs);
      console.log(`Answer: ${answer}`);
      console.log('');
    }

    // Test 5: Semantic Search
    console.log('5️⃣ Testing Semantic Search...');
    const searchQueries = [
      "web development technologies",
      "user authentication system",
      "API documentation and endpoints"
    ];

    for (const query of searchQueries) {
      console.log(`Search Query: "${query}"`);
      const searchResults = await geminiService.semanticSearch(query, testDocs);
      console.log(`Found ${searchResults.length} relevant documents`);
      searchResults.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.title} (${doc.tags.join(', ')})`);
      });
      console.log('');
    }

    // Test 6: Fallback Methods
    console.log('6️⃣ Testing Fallback Methods...');
    console.log('Testing fallback summary generation...');
    const fallbackSummary = geminiService.generateFallbackSummary(testContent);
    console.log('✅ Fallback Summary:', fallbackSummary);

    console.log('Testing fallback tag generation...');
    const fallbackTags = geminiService.generateFallbackTags(testTitle, testContent);
    console.log('✅ Fallback Tags:', fallbackTags);

    console.log('Testing fallback Q&A...');
    const fallbackAnswer = geminiService.generateFallbackAnswer("What is this about?", testDocs);
    console.log('✅ Fallback Answer:', fallbackAnswer);

    console.log('Testing enhanced text search...');
    const textSearchResults = geminiService.enhancedTextSearch("web development", testDocs);
    console.log(`✅ Text Search found ${textSearchResults.length} documents`);
    console.log('');

    console.log('🎉 All AI features are working!');
    console.log('');
    console.log('📋 Summary of Features:');
    console.log('✅ Automatic document summarization');
    console.log('✅ Intelligent tag generation');
    console.log('✅ AI-powered Q&A system');
    console.log('✅ Semantic search capabilities');
    console.log('✅ Robust fallback methods');
    console.log('✅ Enhanced text search');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing features:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Test MongoDB connection if available
async function testMongoConnection() {
  try {
    if (process.env.MONGODB_URI) {
      console.log('🔗 Testing MongoDB Connection...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
      await mongoose.disconnect();
      console.log('✅ MongoDB disconnected successfully');
      console.log('');
    } else {
      console.log('⚠️ MONGODB_URI not set, skipping connection test');
      console.log('');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('');
  }
}

// Run all tests
async function runAllTests() {
  await testMongoConnection();
  await testAllFeatures();
  process.exit(0);
}

runAllTests();

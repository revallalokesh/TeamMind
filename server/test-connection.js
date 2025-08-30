import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

console.log('Testing server connection...');
console.log('Environment variables:');
console.log('- PORT:', process.env.PORT || 'Not set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');

// Test MongoDB connection
const testMongoConnection = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not set');
      return false;
    }

    console.log('🔌 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connection successful');
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Test Gemini service
const testGeminiService = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️ GEMINI_API_KEY not set - AI features will use fallbacks');
      return true;
    }

    console.log('🤖 Testing Gemini AI service...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Test a simple prompt
    const result = await model.generateContent('Hello, test message');
    const response = await result.response;
    console.log('✅ Gemini AI service working');
    return true;
  } catch (error) {
    console.error('❌ Gemini AI service failed:', error.message);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('\n🧪 Running connection tests...\n');
  
  const mongoTest = await testMongoConnection();
  const geminiTest = await testGeminiService();
  
  console.log('\n📊 Test Results:');
  console.log(`- MongoDB: ${mongoTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Gemini AI: ${geminiTest ? '✅ PASS' : '⚠️ FALLBACK'}`);
  
  if (mongoTest) {
    console.log('\n🎉 Server is ready to start!');
    console.log('Run: npm run dev');
  } else {
    console.log('\n❌ Please fix MongoDB connection before starting server');
  }
};

runTests().catch(console.error);

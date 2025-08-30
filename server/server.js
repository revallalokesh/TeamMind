import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import activityRoutes from './routes/activity.js';

// Load environment variables first
dotenv.config();

const app = express();
// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Global CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
const PORT = 5000; // Use port 5000 as requested

console.log('Environment loaded. PORT:', PORT);
console.log('MongoDB URI set:', !!process.env.MONGODB_URI);
console.log('JWT Secret set:', !!process.env.JWT_SECRET);
console.log('Gemini API Key set:', !!process.env.GEMINI_API_KEY);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// CORS configuration - Fix for preflight requests
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: connection and index management happen in connectToMongo
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  console.error('Error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectToMongo = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in environment variables');
      console.error('Please create a .env file with your MongoDB connection string');
      process.exit(1);
    }

    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('Connected to MongoDB');

    // Ensure a single consistent text index exists for documents collection
    try {
      const collection = mongoose.connection.db.collection('documents');
      const desiredIndex = { title: 'text', content: 'text', summary: 'text', tags: 'text' };
      const desiredWeights = { title: 10, summary: 5, content: 3, tags: 2 };

      const existingIndexes = await collection.indexes();
      const textIndex = existingIndexes.find(ix => ix.key && ix.key._fts === 'text');

      if (textIndex) {
        const existingWeights = textIndex.weights || {};
        const keys = ['title', 'summary', 'content', 'tags'];
        const weightsMatch = keys.every(k => (existingWeights[k] || 0) === (desiredWeights[k] || 0));
        if (!weightsMatch) {
          console.info('Conflicting text index found. Dropping and recreating with desired weights...');
          await collection.dropIndex(textIndex.name);
          await collection.createIndex(desiredIndex, { weights: desiredWeights, name: 'document_text_search', default_language: 'english', background: true });
          console.log('Recreated text index with desired weights');
        } else {
          console.log('Text index already exists and matches desired configuration');
        }
      } else {
        await collection.createIndex(desiredIndex, { weights: desiredWeights, name: 'document_text_search', default_language: 'english', background: true });
        console.log('Created text index for documents collection');
      }
    } catch (indexErr) {
      // If index creation fails due to an options conflict, log and continue.
      if (indexErr && indexErr.code === 85) {
        console.warn('IndexOptionsConflict detected while creating text index. Existing index will be used.');
      } else {
        console.error('Error ensuring text index:', indexErr);
      }
    }

    // Start server only after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Please check your MongoDB connection string and network access');
    process.exit(1);
  }
};

connectToMongo();

// Global error handling for unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
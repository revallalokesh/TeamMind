import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import activityRoutes from './routes/activity.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET_SET = !!process.env.JWT_SECRET;
const GEMINI_KEY_SET = !!process.env.GEMINI_API_KEY;

console.log('Environment loaded. PORT:', PORT);
console.log('MongoDB URI set:', !!MONGODB_URI);
console.log('JWT Secret set:', JWT_SECRET_SET);
console.log('Gemini API Key set:', GEMINI_KEY_SET);
const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000','https://team-mind-ticw.vercel.app'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/activity', activityRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  const payload = {
    success: false,
    message: err && err.message ? err.message : 'Internal Server Error'
  };
  if (process.env.NODE_ENV === 'development') payload.error = err;
  res.status(status).json(payload);
});


const connectToMongo = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Please add it to .env');
    process.exit(1);
  }

  try {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
    };

    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB');

    try {
      const collection = mongoose.connection.db.collection('documents');
      const desiredIndex = { title: 'text', content: 'text', summary: 'text', tags: 'text' };
      const desiredWeights = { title: 10, summary: 5, content: 3, tags: 2 };
      const existingIndexes = await collection.indexes();
      const textIndex = existingIndexes.find(ix => ix.key && ix.key._fts === 'text');

      if (textIndex) {
        const existingWeights = textIndex.weights || {};
        const keys = ['title', 'summary', 'content', 'tags'];
        const matches = keys.every(k => (existingWeights[k] || 0) === (desiredWeights[k] || 0));
        if (!matches) {
          console.info('Conflicting text index found. Dropping and recreating with desired weights...');
          await collection.dropIndex(textIndex.name);
          await collection.createIndex(desiredIndex, { weights: desiredWeights, name: 'document_text_search', default_language: 'english', background: true });
          console.log('Recreated text index with desired weights');
        } else {
          console.log('Text index already exists and matches configuration');
        }
      } else {
        await collection.createIndex(desiredIndex, { weights: desiredWeights, name: 'document_text_search', default_language: 'english', background: true });
        console.log('Created text index for documents collection');
      }
    } catch (indexErr) {
      if (indexErr && indexErr.code === 85) {
        console.warn('IndexOptionsConflict detected while creating text index. Existing index will be used.');
      } else {
        console.error('Error ensuring text index:', indexErr);
      }
    }

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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

import mongoose from 'mongoose';

const documentVersionSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  summary: String,
  versionNumber: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const documentSchema = new mongoose.Schema({
  // Schema definition
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    index: true
  }],
  summary: {
    type: String,
    index: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versions: [documentVersionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  embeddings: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true
});

// Drop existing text indexes before creating new one
documentSchema.pre('save', async function(next) {
  try {
    const indexes = await this.collection.getIndexes();
    for (let indexName in indexes) {
      if (indexes[indexName].textIndexVersion) {
        await this.collection.dropIndex(indexName);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Create text search index with proper weights
documentSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    summary: 5,
    content: 3,
    tags: 2
  },
  name: "document_text_search",
  default_language: "english"
});

// Ensure indexes are created
documentSchema.on('index', function(err) {
  if (err) {
    console.error('Document index error: %s', err);
  } else {
    console.info('Document indexing complete');
  }
});

export default mongoose.model('Document', documentSchema);
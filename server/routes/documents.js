import express from 'express';
import Document from '../models/Document.js';
import Activity from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// Get all documents with search and filtering
// Error handler middleware
const handleErrors = (err, req, res, next) => {
  console.error('Document route error:', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  next(err);
};

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, tags, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    console.log('Search request:', { search, tags, page, limit });

    let query = {};

    // Text search - use MongoDB text search
    if (search && search.trim()) {
      const searchTerm = search.trim();
      try {
        // Try text search first
        await Document.findOne({ $text: { $search: searchTerm } });
        query.$text = { $search: searchTerm };
      } catch (textSearchError) {
        console.log('Text search failed, falling back to regex search');
        // Fallback to regex search if text search fails
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { summary: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ];
      }
    }

    // Tag filtering
    if (tags && tags.trim()) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tagArray.length > 0) {
        if (query.$or) {
          // If we already have a text search, add tags to each condition
          query.$or = query.$or.map(condition => ({
            $and: [condition, { tags: { $in: tagArray } }]
          }));
        } else {
          query.tags = { $in: tagArray };
        }
      }
    }

    const documents = await Document.find(query)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Convert to plain JS objects for better performance

    const total = await Document.countDocuments(query);

    // Ensure each document has the required fields
    const processedDocuments = documents.map(doc => ({
      ...doc,
      tags: doc.tags || [],
      summary: doc.summary || '',
      createdBy: doc.createdBy || { name: 'Unknown', email: '' }
    }));

    res.json({
      documents: processedDocuments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + documents.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create document
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    console.log('Creating document with AI features...');
    
    // Generate AI summary and tags first
    const summary = await geminiService.generateSummary(content);
    const aiTags = await geminiService.generateTags(content);

    // Generate and cache embedding after summary is available
    let embedding = [];
    try {
      const text = `${title || ''} ${summary || ''} ${content || ''}`.trim();
      embedding = await geminiService.getEmbedding(text);
    } catch (embedError) {
      console.error('Error generating embedding:', embedError);
    }
    const allTags = [...new Set([...tags, ...aiTags])];

    console.log('Generated summary:', summary);
    console.log('Generated tags:', allTags);

    const document = new Document({
      title,
      content,
      tags: allTags,
      summary,
        embeddings: embedding || [],
      createdBy: req.user._id
    });

    // Save initial version
    document.versions.push({
      title,
      content,
      tags: allTags,
      summary,
      versionNumber: 1
    });

    await document.save();

    // Log activity
    await new Activity({
      user: req.user._id,
      document: document._id,
      action: 'created',
      documentTitle: title
    }).save();

    await document.populate('createdBy', 'name email');
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update document
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Updating document with AI features...');
      // Generate and cache embedding
      let embedding = [];
      try {
        const text = `${title || ''} ${summary || ''} ${content || ''}`.trim();
        embedding = await geminiService.getEmbedding(text);
      } catch (embedError) {
        console.error('Error generating embedding:', embedError);
      }

    // Generate new summary and tags
    const summary = await geminiService.generateSummary(content);
    const aiTags = await geminiService.generateTags(title, content);
    const allTags = [...new Set([...tags, ...aiTags])];

    console.log('Updated summary:', summary);
    console.log('Updated tags:', allTags);

    // Save new version
    const newVersion = document.currentVersion + 1;
    document.versions.push({
      title,
      content,
      tags: allTags,
      summary,
      versionNumber: newVersion
    });

    // Update document
    document.title = title;
    document.content = content;
    document.tags = allTags;
    document.summary = summary;
    document.currentVersion = newVersion;
      document.embeddings = embedding || [];

    await document.save();

    // Log activity
    await new Activity({
      user: req.user._id,
      document: document._id,
      action: 'updated',
      documentTitle: title
    }).save();

    await document.populate('createdBy', 'name email');
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log activity before deletion
    await new Activity({
      user: req.user._id,
      document: document._id,
      action: 'deleted',
      documentTitle: document.title
    }).save();

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Semantic search
router.post('/semantic-search', authenticate, async (req, res) => {
  try {
    const { query = '', tags = [] } = req.body;

    if (!query.trim() && (!tags || tags.length === 0)) {
      return res.status(400).json({ message: 'Search query or tags required' });
    }

    console.log('Performing semantic search for:', query, 'with tags:', tags);

    // Get all documents for semantic search
    let allDocuments = await Document.find()
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    if (tags && tags.length > 0) {
      allDocuments = allDocuments.filter(doc =>
        doc.tags && doc.tags.some(tag => tags.includes(tag))
      );
    }

    if (allDocuments.length === 0) {
      return res.json({ documents: [], query, message: 'No documents available for search' });
    }

    let results;
    if (!query.trim() && tags && tags.length > 0) {
      // If no query, just return all documents matching tags
      results = allDocuments;
    } else {
      // Perform semantic search
      results = await geminiService.semanticSearch(query, allDocuments);
    }

    console.log(`Semantic search found ${results.length} relevant documents`);

    // Log activity (don't let this break the search response)
    try {
      await new Activity({
        user: req.user._id,
        action: 'searched',
        searchQuery: query,
        tags: tags
      }).save();
      console.log('Search activity logged successfully');
    } catch (activityError) {
      console.error('Failed to log search activity:', activityError);
      // Don't fail the search response if activity logging fails
    }

    res.json({ documents: results, query });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ask question (Q&A)
router.post('/ask', authenticate, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required' });
    }

    console.log('Processing Q&A question:', question);

    // Get all documents for context
    const allDocuments = await Document.find()
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    if (allDocuments.length === 0) {
      return res.json({ 
        answer: 'No documents available to answer your question. Please create some documents first.',
        documents: [],
        question
      });
    }

    console.log(`Found ${allDocuments.length} documents for Q&A context`);

    // Get AI answer
    const answer = await geminiService.answerQuestion(question, allDocuments);

    console.log('Q&A answer generated successfully');

    // Log activity (don't let this break the Q&A response)
    try {
      await new Activity({
        user: req.user._id,
        action: 'asked_question',
        question: question
      }).save();
      console.log('Q&A activity logged successfully');
    } catch (activityError) {
      console.error('Failed to log Q&A activity:', activityError);
      // Don't fail the Q&A response if activity logging fails
    }

    res.json({ 
      answer, 
      question,
      documents: allDocuments.slice(0, 5) // Return top 5 relevant docs
    });
  } catch (error) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    console.error('Error in Q&A:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Q&A service encountered an error. Please try again.'
    });
  }
});

// Regenerate summary with Gemini AI
router.post('/:id/summarize', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Regenerating summary with Gemini AI...');
    const summary = await geminiService.generateSummary(document.content);
    
    // Update document with new summary
    document.summary = summary;
    await document.save();

    console.log('Summary regenerated successfully');
    res.json({ summary });
  } catch (error) {
    console.error('Error regenerating summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Regenerate tags with Gemini AI
router.post('/:id/generate-tags', authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && document.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Regenerating tags with Gemini AI...');
    const tags = await geminiService.generateTags(document.title, document.content);
    
    // Update document with new tags
    document.tags = tags;
    await document.save();

    console.log('Tags regenerated successfully:', tags);
    res.json({ tags });
  } catch (error) {
    console.error('Error regenerating tags:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
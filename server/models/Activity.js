import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: false // Optional for non-document activities like Q&A
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'asked_question', 'searched'],
    required: true
  },
  documentTitle: {
    type: String,
    required: false // Optional for non-document activities
  },
  question: {
    type: String,
    required: false // For Q&A activities
  },
  searchQuery: {
    type: String,
    required: false // For search activities
  }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);
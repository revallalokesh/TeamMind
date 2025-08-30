import express from 'express';
import Activity from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get recent activities
router.get('/recent', authenticate, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'name email')
      .populate('document', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Transform activities to include all necessary information
    const transformedActivities = activities.map(activity => {
      const activityObj = activity.toObject();
      
      // Make sure document title is available
      if (activityObj.document && activityObj.document.title) {
        activityObj.documentTitle = activityObj.document.title;
      }

      // Handle search activities
      if (activityObj.action === 'searched' && !activityObj.documentTitle) {
        activityObj.documentTitle = `Search: ${activityObj.searchQuery}`;
      }

      // Handle Q&A activities
      if (activityObj.action === 'asked_question' && !activityObj.documentTitle) {
        activityObj.documentTitle = `Question: ${activityObj.question}`;
      }

      return activityObj;
    });

    res.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activities', 
      error: error.message 
    });
  }
});

export default router;
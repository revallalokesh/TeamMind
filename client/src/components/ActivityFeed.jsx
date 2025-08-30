import { useState, useEffect } from 'react';
import { Activity, User, FileText, Edit, Trash2, Plus, Search } from 'lucide-react';
import axios from 'axios';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActivities();
    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get('/api/activity/recent', {
        timeout: 5000, // 5 second timeout
        retry: 3, // Retry 3 times
        retryDelay: 1000 // Wait 1 second between retries
      });
      if (response.data) {
        // Transform the activity data to ensure all required fields are present
        const transformedActivities = response.data.map(activity => ({
          ...activity,
          documentTitle: activity.documentTitle || activity.document?.title || 'Unknown document',
          user: activity.user || { name: 'Unknown user' }
        }));
        setActivities(transformedActivities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      if (error.code === 'ECONNREFUSED') {
        setError('Server is not responding. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Please log in to view activities');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Could not load activities. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <Plus className="w-5 h-5 text-green-600" />;
      case 'updated':
        return <Edit className="w-5 h-5 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case 'searched':
        return <Search className="w-5 h-5 text-purple-600" />;
      case 'asked_question':
        return <User className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'text-green-600';
      case 'updated':
        return 'text-blue-600';
      case 'deleted':
        return 'text-red-600';
      case 'searched':
        return 'text-purple-600';
      case 'asked_question':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderActivityContent = (activity) => {
    switch (activity.action) {
      case 'searched':
        return (
          <>
            <span className="font-medium">{activity.user.name}</span>
            <span className={getActionColor(activity.action)}> searched for </span>
            <span className="font-medium">"{activity.searchQuery}"</span>
          </>
        );
      case 'asked_question':
        return (
          <>
            <span className="font-medium">{activity.user.name}</span>
            <span className={getActionColor(activity.action)}> asked </span>
            <span className="font-medium">"{activity.question}"</span>
          </>
        );
      default:
        return (
          <>
            <span className="font-medium">{activity.user.name}</span>
            <span className={`ml-1 ${getActionColor(activity.action)}`}> {activity.action} </span>
            <span className="font-medium">"{activity.documentTitle}"</span>
          </>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Team Activity</h3>
        </div>
      </div>
      
      <div className="p-6">
        {error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {renderActivityContent(activity)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;


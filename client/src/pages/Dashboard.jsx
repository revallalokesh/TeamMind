import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, X, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import DocumentCard from '../components/DocumentCard';
import ActivityFeed from '../components/ActivityFeed';
import axios from 'axios';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, selectedTags]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

      const response = await axios.get(`/api/documents?${params}`, {
        timeout: 5000, // 5 second timeout
        retry: 3, // Retry 3 times
        retryDelay: 1000 // Wait 1 second between retries
      });
      
      // Handle both old and new response formats
      if (response.data.documents) {
        setDocuments(response.data.documents);
      } else {
        setDocuments(response.data);
      }
      
      // Extract all unique tags
      const tags = [...new Set(response.data.documents ? response.data.documents.flatMap(doc => doc.tags) : response.data.flatMap(doc => doc.tags))];
      setAllTags(tags);
    } catch (error) {
      setDocuments([]);
      if (error.code === 'ECONNREFUSED') {
        setError('Server is not responding. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        console.error('Error fetching documents:', error);
        setError('Could not load documents. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/api/documents');
      const docs = response.data.documents || response.data;
      const tags = [...new Set(docs.flatMap(doc => doc.tags))];
      setAllTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleDeleteDocument = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this document'}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
      // Refresh documents and tags
      fetchDocuments();
      fetchAvailableTags();
    } catch (error) {
      console.error('Error deleting document:', error);
      if (error.response?.status === 404) {
        setDocuments(documents.filter(doc => doc._id !== id));
        setError('Document not found. It may have already been deleted.');
      } else if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to delete this document.');
      } else {
        setError('Error deleting document. Please try again.');
      }
    }
  };

  const handleUpdateDocument = () => {
    fetchDocuments(); // Re-fetch documents to update UI
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Knowledge Hub</h1>
            <p className="mt-2 text-gray-600">Manage and explore your team's knowledge base</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {allTags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter by tags
                      </h3>
                      {(searchTerm || selectedTags.length > 0) && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear filters
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first document.
                </p>
                <div className="mt-6">
                  <Link
                    to="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((document) => (
                  <DocumentCard
                    key={document._id}
                    document={document}
                    onUpdate={handleUpdateDocument}
                    onDelete={handleDeleteDocument}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;


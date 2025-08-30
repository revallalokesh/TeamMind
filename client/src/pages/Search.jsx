import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search as SearchIcon, FileText, Sparkles, Filter, X } from 'lucide-react';
import Layout from '../components/Layout';
import DocumentCard from '../components/DocumentCard';
import axios from 'axios';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text'); // 'text' or 'semantic'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/api/documents');
      const allTags = response.data.documents?.flatMap(doc => doc.tags || []) || [];
      const uniqueTags = [...new Set(allTags)];
      setAvailableTags(uniqueTags);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Error fetching tags.');
      }
    }
  };

  const handleSearch = async () => {
    // Allow search with just tags even if no query
    if (!searchQuery.trim() && selectedTags.length === 0) return;
    
    if (!user) {
      setError('You must be logged in to search documents.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let response;
      if (searchType === 'semantic') {
        // Semantic search using AI
        response = await axios.post('/api/documents/semantic-search', {
          query: searchQuery.trim(),
          tags: selectedTags
        });
      } else {
        // Regular text search
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }
        if (selectedTags.length > 0) {
          params.append('tags', selectedTags.join(','));
        }
        response = await axios.get(`/api/documents?${params}`);
      }
      
      if (response.data && (response.data.documents || Array.isArray(response.data))) {
        const docs = response.data.documents || response.data;
        setResults(docs);
      } else {
        setResults([]);
        setError('No results found');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Search error: ${err.response?.data?.message || 'Please try again.'}`);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];
      // Trigger search if tags change and there's a query or other tags
      if (searchQuery.trim() || newTags.length > 0) {
        setTimeout(() => handleSearch(), 100); // Small delay to ensure state is updated
      }
      return newTags;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setResults([]);
    setError('');
  };

  const hasFilters = searchQuery || selectedTags.length > 0;

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Documents</h1>
          <p className="mt-2 text-gray-600">
            Find documents using text search or AI-powered semantic search
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search Interface */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            {/* Search Type Selection */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Search Type:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSearchType('text')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    searchType === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <SearchIcon className="w-4 h-4 inline mr-1" />
                  Text Search
                </button>
                <button
                  onClick={() => setSearchType('semantic')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    searchType === 'semantic'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  AI Semantic Search
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={searchType === 'semantic' 
                      ? "Ask a question or describe what you're looking for..."
                      : "Search by keywords, title, or content..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || (!searchQuery.trim() && selectedTags.length === 0) || !user}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div>
                <div className="flex items-center mb-3">
                  <Filter className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Filter by tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
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

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {searchType === 'semantic' 
                  ? 'AI is analyzing your query and finding relevant documents...'
                  : 'Searching documents...'
                }
              </p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Found {results.length} document{results.length !== 1 ? 's' : ''}
                  {searchType === 'semantic' && ' (AI-ranked by relevance)'}
                </h2>
              </div>
              <div className="space-y-4">
                {results.map((document) => (
                  <DocumentCard
                    key={document._id}
                    document={document}
                    onUpdate={() => {}} // No update needed in search view
                    onDelete={() => {}} // No delete needed in search view
                  />
                ))}
              </div>
            </div>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Search
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <SearchIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to search</h3>
              <p className="text-gray-600">
                Enter your search query above to find documents
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Search;


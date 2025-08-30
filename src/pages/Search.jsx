import { useState } from 'react';
import { Search as SearchIcon, Sparkles, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import DocumentCard from '../components/DocumentCard';
import axios from 'axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('text');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      let response;
      if (searchType === 'semantic') {
        response = await axios.post('http://localhost:5000/api/documents/semantic-search', {
          query
        });
      } else {
        response = await axios.get(`http://localhost:5000/api/documents?search=${encodeURIComponent(query)}`);
      }
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const handleUpdateDocument = (updatedDoc) => {
    setResults(results.map(doc => 
      doc._id === updatedDoc._id ? updatedDoc : doc
    ));
  };

  const handleDeleteDocument = (id) => {
    setResults(results.filter(doc => doc._id !== id));
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Documents</h1>
          <p className="mt-2 text-gray-600">
            Find documents using text search or AI-powered semantic search
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for documents..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="text"
                  checked={searchType === 'text'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Text Search</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="semantic"
                  checked={searchType === 'semantic'}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Semantic Search
                </span>
              </label>
            </div>
          </form>
        </div>

        {results.length > 0 && (
          <div>
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({results.length})
              </h2>
              {searchType === 'semantic' && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Ranked
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((document) => (
                <DocumentCard
                  key={document._id}
                  document={document}
                  onUpdate={handleUpdateDocument}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or using semantic search.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
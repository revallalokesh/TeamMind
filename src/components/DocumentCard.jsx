import { useState } from 'react';
import { Edit, Trash2, User, Calendar, Tag, Sparkles, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DocumentCard = ({ document, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const canEdit = user?.role === 'admin' || document.createdBy._id === user?.id;

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/documents/${document._id}/summarize`);
      onUpdate({ ...document, summary: response.data.summary });
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    setLoading(false);
  };

  const handleGenerateTags = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/documents/${document._id}/generate-tags`);
      onUpdate({ ...document, tags: response.data.tags });
    } catch (error) {
      console.error('Error generating tags:', error);
    }
    setLoading(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
          {document.title}
        </h3>
        {canEdit && (
          <div className="flex space-x-2">
            <Link
              to={`/edit/${document._id}`}
              className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(document._id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">
        {document.summary || 'No summary available'}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {document.tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {document.createdBy.name}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(document.createdAt)}
          </div>
        </div>
        <button
          onClick={() => setShowVersions(!showVersions)}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <History className="w-4 h-4 mr-1" />
          v{document.currentVersion}
        </button>
      </div>

      {showVersions && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Version History</h4>
          <div className="space-y-1">
            {document.versions.slice(-3).reverse().map((version) => (
              <div key={version.versionNumber} className="text-xs text-gray-600">
                v{version.versionNumber} - {formatDate(version.createdAt)}
              </div>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex space-x-2">
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {loading ? 'Summarizing...' : 'Summarize'}
          </button>
          <button
            onClick={handleGenerateTags}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <Tag className="w-4 h-4 mr-1" />
            {loading ? 'Generating...' : 'Generate Tags'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
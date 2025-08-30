import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, History, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const DocumentCard = ({ document, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [showVersions, setShowVersions] = useState(false);

  const canEdit = user.role === 'admin' || document.createdBy._id === user.id;

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/documents/${document._id}`);
      onDelete(document._id);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        onDelete(document._id); // Remove from UI if not found
      }
      console.error('Error deleting document:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {document.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {document.summary || 'No summary available'}
            </p>
          </div>
          <div className="flex space-x-2 ml-4">
            {canEdit && (
              <>
                <Link
                  to={`/edit/${document._id}`}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit document"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {document.tags && document.tags.length > 0 ? (
              document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No tags</span>
            )}
          </div>
        </div>

        {/* Document Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{document.createdBy?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
            </div>
            {document.versions && document.versions.length > 1 && (
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <History className="w-4 h-4 mr-1" />
                <span>v{document.currentVersion || document.versions.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Version History */}
        {showVersions && document.versions && document.versions.length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Version History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {document.versions.slice().reverse().map((version, index) => (
                <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <div className="font-medium">Version {version.versionNumber}</div>
                  <div className="text-gray-500">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;


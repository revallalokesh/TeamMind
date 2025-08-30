import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2, FileText, User } from 'lucide-react';
import Layout from '../components/Layout';
import axios from 'axios';

const QA = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [documents, setDocuments] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');

    try {
      const response = await axios.post('/api/documents/ask', { question });
      setAnswer(response.data.answer);
      setDocuments(response.data.documents || []);
      
      // Add to recent questions
      setRecentQuestions(prev => [
        { question, answer: response.data.answer, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5
      ]);
      
      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Sorry, I encountered an error while processing your question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Q&A</h1>
          <p className="mt-2 text-gray-600">
            Ask questions about your team's knowledge base and get AI-powered answers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Q&A Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                    Ask a question
                  </label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What are our deployment procedures? How do we handle user authentication?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    disabled={loading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </button>
              </form>

              {/* Answer Display */}
              {answer && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                  <h3 className="text-sm font-medium text-indigo-900 mb-2">Answer:</h3>
                  <p className="text-indigo-800 whitespace-pre-wrap">{answer}</p>
                </div>
              )}

              {/* Related Documents */}
              {documents.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Related Documents:</h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc._id} className="p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {doc.summary || doc.content.substring(0, 100)}...
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <User className="w-3 h-3 mr-1" />
                              {doc.createdBy?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Questions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Recent Questions
              </h3>
              
              {recentQuestions.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No questions asked yet. Start by asking a question above!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentQuestions.map((item, index) => (
                    <div key={index} className="border-l-2 border-indigo-200 pl-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {item.question}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.answer}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QA;


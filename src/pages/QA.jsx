import { useState } from 'react';
import { MessageCircle, Send, Sparkles, Brain } from 'lucide-react';
import Layout from '../components/Layout';
import axios from 'axios';

const QA = () => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { type: 'user', content: question, timestamp: new Date() };
    setConversations(prev => [...prev, userMessage]);
    
    setLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await axios.post('http://localhost:5000/api/documents/ask', {
        question: currentQuestion
      });

      const aiMessage = { 
        type: 'ai', 
        content: response.data.answer, 
        timestamp: new Date() 
      };
      setConversations(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { 
        type: 'ai', 
        content: 'Sorry, I encountered an error while processing your question.', 
        timestamp: new Date() 
      };
      setConversations(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
  };

  const clearConversation = () => {
    setConversations([]);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Q&A Assistant</h1>
              <p className="mt-2 text-gray-600">
                Ask questions about your team's knowledge base and get AI-powered answers
              </p>
            </div>
            {conversations.length > 0 && (
              <button
                onClick={clearConversation}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="mx-auto h-12 w-12 text-indigo-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Ask me anything about your documents
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  I can help you find information, summarize content, and answer questions based on your team's knowledge base.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-gray-400">Try asking:</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">"What are the main topics covered in our documents?"</p>
                    <p className="text-xs text-gray-500">"Summarize our project guidelines"</p>
                    <p className="text-xs text-gray-500">"What do we know about user authentication?"</p>
                  </div>
                </div>
              </div>
            ) : (
              conversations.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex items-center mb-2">
                        <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
                        <span className="text-xs font-medium text-indigo-600">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 mr-2 text-indigo-600 animate-spin" />
                    <span className="text-xs font-medium text-indigo-600">AI Assistant</span>
                  </div>
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QA;
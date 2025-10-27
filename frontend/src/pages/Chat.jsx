import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { chatAPI } from '../services/api';
import { Send, Bot, User as UserIcon, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showCitations, setShowCitations] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      // Try to get existing chat history first
      const historyResponse = await chatAPI.history();
      
      if (historyResponse.data.messages && historyResponse.data.messages.length > 0) {
        setMessages(historyResponse.data.messages);
      } else {
        // No history, start a new chat
        const startResponse = await chatAPI.start();
        setMessages(startResponse.data.chat.messages);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      const message = error.response?.data?.message;
      
      if (message?.includes('upload')) {
        toast.error('Please upload documents first');
        navigate('/upload');
      } else {
        toast.error('Failed to start chat');
      }
    } finally {
      setInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);

    try {
      const { data } = await chatAPI.query(userMessage);
      
      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response.content,
        score: data.response.score,
        citations: data.response.citations,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response');
      
      // Remove the user message if request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the chat history?')) return;

    try {
      await chatAPI.clear();
      toast.success('Chat cleared');
      // Restart chat
      const { data } = await chatAPI.start();
      setMessages(data.chat.messages);
    } catch (error) {
      toast.error('Failed to clear chat');
    }
  };

  const toggleCitations = (index) => {
    setShowCitations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing interview session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Practice</h1>
            <p className="text-sm text-gray-600">Answer questions and get instant feedback</p>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'user' ? 'bg-primary-600' : 'bg-gray-700'
                }`}>
                  {message.role === 'user' ? (
                    <UserIcon className="w-6 h-6 text-white" />
                  ) : (
                    <Bot className="w-6 h-6 text-white" />
                  )}
                </div>

                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white shadow-md'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* Show citations if available */}
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => toggleCitations(index)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{showCitations[index] ? 'Hide' : 'Show'} References ({message.citations.length})</span>
                        </button>
                        
                        {showCitations[index] && (
                          <div className="mt-2 space-y-2">
                            {message.citations.map((citation, idx) => (
                              <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                                <span className="font-semibold text-primary-600">[{citation.source}]</span>
                                <p className="mt-1 text-gray-600">{citation.text.substring(0, 150)}...</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-3xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-white shadow-md p-4 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your answer here..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary flex items-center space-x-2 px-6"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

// Chatbot API configuration
const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:5001';

// Function to parse markdown-style formatting (bold, italic, etc.)
const formatMessage = (text) => {
  if (!text) return text;
  
  // Split by **bold** pattern while keeping the delimiters
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    // Check if this part is bold (wrapped in **)
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-semibold">{boldText}</strong>;
    }
    return part;
  });
};

const Chatbot = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setIsLoggedIn(true);
        setMessages([{
          id: 1,
          text: `Hello ${parsed.name?.split(' ')[0] || 'there'}! 👋\n\nI'm your AI Career Assistant powered by Gemini. I have secure access to your profile and can help you with:\n\n✨ Personalized career guidance\n📝 Resume optimization tips\n🎯 Interview preparation\n📊 Skills analysis & recommendations\n🚀 Placement predictions\n\nWhat would you like to explore today?`,
          sender: 'bot',
          time: new Date()
        }]);
      } catch (e) {
        setIsLoggedIn(false);
        setMessages([{
          id: 1,
          text: "Welcome to PlacementAI! 👋\n\nI'm your AI Career Assistant. To provide personalized guidance and access your profile data, please sign in first.",
          sender: 'bot',
          time: new Date(),
          showLoginButton: true
        }]);
      }
    } else {
      setIsLoggedIn(false);
      setMessages([{
        id: 1,
        text: "Welcome to PlacementAI! 👋\n\nI'm your AI Career Assistant. To provide personalized guidance and access your profile data, please sign in first.",
        sender: 'bot',
        time: new Date(),
        showLoginButton: true
      }]);
    }
  }, []);
  
  // Check API connection on mount and periodically (every 5 minutes)
  useEffect(() => {
    checkConnection();
    
    // Set up periodic health checks to keep connection alive
    const healthCheckInterval = setInterval(() => {
      checkConnection();
    }, 300000); // Check every 5 minutes (300000ms)
    
    return () => clearInterval(healthCheckInterval);
  }, []);
  
  const checkConnection = async () => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Check if database is actually connected
        if (data.database === 'connected' || data.database === 'reconnected') {
          setIsConnected(true);
          setConnectionError(null);
        } else {
          setIsConnected(false);
          setConnectionError('Database connection issue');
        }
      } else {
        setIsConnected(false);
        setConnectionError('Chatbot service is unavailable');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionError('Cannot connect to chatbot service');
    }
  };
  
  // Quick action cards for logged-in users
  const quickActions = [
    { label: 'My Skills', query: 'What are my current skills and how can I improve them?' },
    { label: 'Resume Tips', query: 'Give me personalized tips to improve my resume' },
    { label: 'Interview Prep', query: 'Help me prepare for technical interviews' },
    { label: 'Career Path', query: 'What career paths are best suited for my profile?' },
    { label: 'Job Match', query: 'What types of companies would be a good fit for me?' },
    { label: 'Placement Score', query: 'What is my placement prediction score and how can I improve it?' },
  ];

  // Suggestions for quick responses
  const suggestions = isLoggedIn ? [
    'Analyze my profile',
    'Resume tips',
    'Interview preparation',
    'Career guidance',
    'Skill recommendations'
  ] : [
    'What can you help with?',
    'Sign in to get started'
  ];
  
  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };
  
  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;
    
    // If not logged in, prompt to log in
    if (!isLoggedIn) {
      const userMessage = {
        id: messages.length + 1,
        text: message,
        sender: 'user',
        time: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      setTimeout(() => {
        const botMessage = {
          id: messages.length + 2,
          text: "I'd love to help you! To provide personalized career assistance and access your profile data, please sign in first. 🔐",
          sender: 'bot',
          time: new Date(),
          showLoginButton: true
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
      return;
    }
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      time: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Call the chatbot API - user context is passed in the body for the AI to use
      const response = await fetch(`${CHATBOT_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId,
          user_email: user?.email,
          user_name: user?.name,
          user_phone: user?.mobile || user?.phone
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }
      
      const data = await response.json();
      
      // Save session ID for conversation continuity
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }
      
      const botMessage = {
        id: messages.length + 2,
        text: data.response,
        sender: 'bot',
        time: new Date(data.timestamp) || new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsConnected(true);
      
    } catch (error) {
      console.error('Chatbot error:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm having trouble connecting to my AI backend. Please ensure the chatbot service is running, or try again in a moment. 🔄",
        sender: 'bot',
        time: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    if (suggestion === 'Sign in to get started') {
      navigate('/signin');
    } else {
      handleSendMessage(suggestion);
    }
  };

  const handleQuickAction = (query) => {
    handleSendMessage(query);
    setIsSidebarOpen(false);
  };
  
  // Clear conversation
  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`${CHATBOT_API_URL}/chat/clear?session_id=${sessionId}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Failed to clear session:', error);
      }
    }
    
    if (isLoggedIn && user) {
      setMessages([{
        id: 1,
        text: `Hello ${user.name?.split(' ')[0] || 'there'}! 👋\n\nI'm your AI Career Assistant powered by Gemini. I have secure access to your profile and can help you with:\n\n✨ Personalized career guidance\n📝 Resume optimization tips\n🎯 Interview preparation\n📊 Skills analysis & recommendations\n🚀 Placement predictions\n\nWhat would you like to explore today?`,
        sender: 'bot',
        time: new Date()
      }]);
    } else {
      setMessages([{
        id: 1,
        text: "Welcome to PlacementAI! 👋\n\nI'm your AI Career Assistant. To provide personalized guidance and access your profile data, please sign in first.",
        sender: 'bot',
        time: new Date(),
        showLoginButton: true
      }]);
    }
    setSessionId(null);
  };
  
  const handleLoginClick = () => {
    navigate('/signin');
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
  };
  
  return (
    <div className={`h-[calc(100vh-64px)] ${themeClasses.pageBackground} transition-colors duration-300 flex flex-col relative`}>
      {/* Dark Grey Textured Background Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-[0.08] dark:opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <filter id="chatbotNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#chatbotNoise)"/>
        </svg>
      </div>

      {/* Main Content - Full Height */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar - Quick Actions */}
        {isLoggedIn && (
          <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 transition-all duration-300 overflow-hidden border-r-2 ${themeClasses.cardBorder} ${themeClasses.cardBackground} backdrop-blur-sm hidden lg:block`}>
            <div className="p-4 h-full overflow-y-auto">
              <h3 className={`text-sm font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.query)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 ${themeClasses.cardHover} ${themeClasses.hover} rounded-lg text-left transition-all group border border-transparent`}
                  >
                    <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className={`mt-6 pt-4 border-t-2 ${themeClasses.cardBorder}`}>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Your data is secure</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isLoggedIn && isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`relative w-64 ${themeClasses.cardBackground} p-4 overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-semibold ${themeClasses.textPrimary} flex items-center gap-2`}>
                  <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.query)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 ${themeClasses.cardHover} ${themeClasses.hover} rounded-lg text-left transition-all group border border-transparent`}
                  >
                    <span className={`text-sm font-medium ${themeClasses.textSecondary} group-hover:${themeClasses.accent}`}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Area - Takes Full Remaining Space */}
        <div className={`flex-1 flex flex-col min-w-0 ${themeClasses.cardBackground} backdrop-blur-sm`}>
          {/* Combined Chat Header */}
          <div className={`flex-shrink-0 ${themeClasses.gradient} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              {isLoggedIn && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors -ml-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div className="relative">
                <div className="h-10 w-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              <div>
                <h1 className="text-base font-bold text-white">AI Career Assistant</h1>
                <p className="text-xs text-white/80">
                  Powered by Google Gemini • {isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full">
                  <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {getUserInitials()}
                  </div>
                  <span className="text-xs font-medium text-white hidden sm:block">
                    {user?.name?.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all backdrop-blur"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={handleClearChat}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="New conversation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Chat Messages - Scrollable */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${themeClasses.sectionBackground}`}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] lg:max-w-[60%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    message.sender === 'user' 
                      ? `${themeClasses.gradient} text-white` 
                      : `${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} ${themeClasses.textSecondary}`
                  }`}>
                    {message.sender === 'user' ? getUserInitials() : '✨'}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user' 
                      ? `${themeClasses.gradient} text-white rounded-br-md` 
                      : `${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} ${themeClasses.textPrimary} rounded-bl-md shadow-sm`
                  }`}>
                    <p className="whitespace-pre-line text-sm leading-relaxed">{formatMessage(message.text)}</p>
                    {message.showLoginButton && (
                      <button
                        onClick={handleLoginClick}
                        className={`mt-3 w-full px-4 py-2.5 ${themeClasses.gradient} hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg text-sm`}
                      >
                        Sign In to Continue →
                      </button>
                    )}
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-white/70' : themeClasses.textSecondary
                    }`}>
                      {formatTime(message.time)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className={`w-8 h-8 rounded-lg ${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} flex items-center justify-center text-xs`}>
                    ✨
                  </div>
                  <div className={`${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} rounded-2xl rounded-bl-md px-4 py-3 shadow-sm`}>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{animationDelay: '0ms'}}></div>
                      <div className={`w-2 h-2 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{animationDelay: '150ms'}}></div>
                      <div className={`w-2 h-2 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Quick Suggestions */}
          <div className={`flex-shrink-0 px-4 py-2 border-t-2 ${themeClasses.cardBorder} ${themeClasses.cardBackground}`}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`flex-shrink-0 px-3 py-1.5 ${themeClasses.cardBackground} ${themeClasses.hover} rounded-lg text-xs font-medium ${themeClasses.textSecondary} hover:${themeClasses.accent} whitespace-nowrap transition-all border ${themeClasses.cardBorder}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          
          {/* Input Area */}
          <div className={`flex-shrink-0 border-t-2 ${themeClasses.cardBorder} p-4 ${themeClasses.cardBackground}`}>
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isLoggedIn ? "Ask me anything about your career..." : "Sign in to start chatting..."}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!isLoggedIn}
                  className={`w-full px-4 py-3 pr-12 ${themeClasses.inputBackground} border-2 ${themeClasses.inputBorder} rounded-xl ${themeClasses.inputText} ${themeClasses.inputFocus} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{focusRingColor: themeClasses.accent}}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || !isLoggedIn}
                className={`p-3 rounded-xl transition-all ${
                  inputMessage.trim() && isLoggedIn
                    ? `${themeClasses.gradient} hover:opacity-90 text-white shadow-lg hover:shadow-xl` 
                    : `${themeClasses.cardBackground} ${themeClasses.textSecondary} cursor-not-allowed opacity-50`
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {connectionError && (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {connectionError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot; 

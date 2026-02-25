import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

/**
 * LoadingWithFacts - A loading screen component with interactive questions and facts
 * 
 * Props:
 * - title: Main loading title (e.g., "Generating Your Test")
 * - subtitle: Subtitle text
 * - context: Context for filtering questions (e.g., "quiz_submission")
 * - minDisplayTime: Minimum time (ms) to show each item (default: 5000)
 * - onQuestionAnswered: Callback when user answers a question
 * - userPhone: User's phone number for saving responses
 * - showAfterDelay: Only show questions/facts after this delay in ms (default: 3000)
 */
const LoadingWithFacts = ({ 
  title = "Loading...",
  subtitle = "Please wait...",
  context = "all",
  minDisplayTime = 6000,
  onQuestionAnswered,
  userPhone,
  showAfterDelay = 3000
}) => {
  const [content, setContent] = useState(null);
  const [contentHistory, setContentHistory] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(() => {
    // Load previously answered questions from localStorage
    try {
      const saved = localStorage.getItem('answeredLoadingQuestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const contentTimeoutRef = useRef(null);
  const delayTimeoutRef = useRef(null);
  const fetchContentRef = useRef(null);

  // Get user phone from localStorage if not provided
  const getUserPhone = useCallback(() => {
    if (userPhone) return userPhone;
    
    const sources = ['linkedResumeData', 'userData', 'predictionFormData'];
    for (const key of sources) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.mobile || parsed.phone || parsed.phoneNumber) {
            return parsed.mobile || parsed.phone || parsed.phoneNumber;
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }, [userPhone]);

  // Fetch random content
  const fetchContent = useCallback(async (excludeIds = []) => {
    try {
      // Combine excludeIds with answered questions to avoid repetition
      const allExcluded = [...new Set([...excludeIds, ...answeredQuestions])];
      const excludeParam = allExcluded.join(',');
      const url = `${API_BASE}/api/loading/random?exclude=${excludeParam}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data) {
        setFadeIn(false);
        setTimeout(() => {
          setContent(data.data);
          setSelectedOption(null);
          setContentHistory(prev => [...prev, data.data.id]);
          setFadeIn(true);
        }, 300);
      }
    } catch (err) {
      console.error('Failed to fetch loading content:', err);
      // Set fallback content
      setContent({
        type: 'fact',
        id: 'fallback',
        text: '🚀 Building something amazing for you...',
        icon: '🚀'
      });
      setFadeIn(true);
    }
  }, [answeredQuestions]);

  // Store latest fetchContent in ref
  useEffect(() => {
    fetchContentRef.current = fetchContent;
  }, [fetchContent]);

  // Initial delay before showing content
  useEffect(() => {
    delayTimeoutRef.current = setTimeout(() => {
      setShowContent(true);
      fetchContent();
    }, showAfterDelay);

    return () => {
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    };
  }, [showAfterDelay]);

  // Auto-rotate facts (not questions - let user interact)
  useEffect(() => {
    if (!showContent || !content) return;
    
    // Clear any existing timeout
    if (contentTimeoutRef.current) {
      clearTimeout(contentTimeoutRef.current);
    }
    
    // Only auto-rotate facts, not questions
    if (content.type === 'fact') {
      const historyRef = contentHistory.slice(-5);
      contentTimeoutRef.current = setTimeout(() => {
        if (fetchContentRef.current) {
          fetchContentRef.current(historyRef);
        }
      }, minDisplayTime);
    }

    return () => {
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    };
  }, [content?.id, content?.type, showContent, minDisplayTime]);

  // Handle option selection
  const handleOptionSelect = async (option) => {
    if (isSubmitting || selectedOption) return;
    
    setSelectedOption(option);
    setIsSubmitting(true);

    const phone = getUserPhone();
    
    // Save response to backend
    if (phone && content?.id) {
      try {
        await fetch(`${API_BASE}/api/loading/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: content.id,
            phone: phone,
            selectedOption: option,
            context: context
          })
        });
        
        // Track answered question to avoid showing it again
        const newAnsweredQuestions = [...answeredQuestions, content.id];
        setAnsweredQuestions(newAnsweredQuestions);
        localStorage.setItem('answeredLoadingQuestions', JSON.stringify(newAnsweredQuestions));
      } catch (err) {
        console.error('Failed to save response:', err);
      }
    }

    // Callback
    if (onQuestionAnswered) {
      onQuestionAnswered(content, option);
    }

    setIsSubmitting(false);

    // Fetch next content after a brief pause
    setTimeout(() => {
      fetchContent(contentHistory.slice(-5));
    }, 1500);
  };

  // Skip to next content
  const handleSkip = () => {
    if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    fetchContent(contentHistory.slice(-5));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4 relative overflow-hidden">
      {/* Fun Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating shapes */}
        <div className="absolute top-20 right-1/4 w-6 h-6 border-4 border-purple-400/30 dark:border-purple-500/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-8 h-8 border-4 border-pink-400/30 dark:border-pink-500/30 rotate-45 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-cyan-400/30 dark:bg-cyan-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
      </div>
      
      <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-2xl dark:shadow-soft p-8 max-w-lg w-full border-4 border-transparent dark:border-pink-500/20 relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
        {/* Fun Top Border Pattern */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 via-yellow-500 via-green-500 to-blue-500"></div>
        
        {/* Main Loading Section */}
        <div className="text-center mb-6 relative">
          <div className="relative mx-auto w-24 h-24 mb-4">
            {/* Outer glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-20 animate-pulse blur-md"></div>
            
            {/* Spinning rings */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-spin" style={{ 
              backgroundClip: 'padding-box',
              clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)'
            }}></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent bg-gradient-to-l from-yellow-400 via-orange-400 to-red-400 animate-spin" style={{ 
              animationDirection: 'reverse',
              animationDuration: '1.5s',
              backgroundClip: 'padding-box',
              clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)'
            }}></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#1e1a2e] rounded-full m-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-pulse">🚀</span>
            </div>
          </div>
          <h3 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{subtitle}</p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-blue-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Interactive Content Section */}
        {showContent && content && (
          <div className={`mt-6 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {content.type === 'fact' ? (
              /* Fact Display */
              <div className="text-center bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-500/30 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4 animate-bounce shadow-xl" style={{ animationDuration: '2s' }}>
                  <span className="text-3xl">{content.icon}</span>
                </div>
                <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3 shadow-md">
                  💡 DID YOU KNOW?
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-base font-medium leading-relaxed">
                  {content.text}
                </p>
                <button 
                  onClick={handleSkip}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105"
                >
                  Next Fun Fact ✨
                </button>
              </div>
            ) : (
              /* Question Display */
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-3 sm:p-5 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex items-center justify-center mb-3 sm:mb-4 bg-white dark:bg-[#1e1a2e] rounded-xl p-2 sm:p-3 shadow-md border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <p className="text-gray-800 dark:text-gray-100 font-bold text-sm sm:text-base text-center break-words">
                    {content.text}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {content.options?.map((option, idx) => (
                    <button
                      key={option.option_id || idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={!!selectedOption || isSubmitting}
                      className={`
                        p-2 sm:p-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300
                        flex flex-col items-center gap-1 sm:gap-2 shadow-md min-h-[80px] sm:min-h-[100px]
                        transform hover:scale-110 hover:-rotate-2
                        ${selectedOption?.option_id === option.option_id
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110 shadow-2xl animate-pulse'
                          : selectedOption
                            ? 'bg-gray-200 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed scale-95'
                            : 'bg-gradient-to-br from-white to-gray-50 dark:from-[#2d1f3d] dark:to-[#3d2f4d] hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-900/30 dark:hover:to-slate-900/30 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200'
                        }
                      `}
                    >
                      <span className="text-2xl sm:text-3xl flex-shrink-0">{option.icon}</span>
                      <span className="text-center leading-tight break-words w-full px-1">{option.text}</span>
                    </button>
                  ))}
                </div>
                {selectedOption && (
                  <div className="mt-4 text-center">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-full animate-bounce shadow-lg">
                      🎉 Awesome! Loading next...
                    </div>
                  </div>
                )}
                {!selectedOption && (
                  <button 
                    onClick={handleSkip}
                    className="mt-4 w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-[#1e1a2e] hover:bg-gray-100 dark:hover:bg-[#2d1f3d] rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-600"
                  >
                    Skip Question →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fun footer */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-lg animate-spin">⏳</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Hang tight! Magic is happening...
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * LoadingFactsInline - A compact inline version for embedding in existing loading screens
 */
export const LoadingFactsInline = ({ 
  context = "all",
  minDisplayTime = 6000
}) => {
  const [content, setContent] = useState(null);
  const [contentHistory, setContentHistory] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('answeredLoadingQuestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const contentTimeoutRef = useRef(null);
  const fetchContentRef = useRef(null);

  const getUserPhone = useCallback(() => {
    const sources = ['linkedResumeData', 'userData', 'predictionFormData'];
    for (const key of sources) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.mobile || parsed.phone || parsed.phoneNumber) {
            return parsed.mobile || parsed.phone || parsed.phoneNumber;
          }
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }, []);
  
  const fetchContent = useCallback(async (excludeIds = []) => {
    try {
      const allExcluded = [...new Set([...excludeIds, ...answeredQuestions])];
      const excludeParam = allExcluded.join(',');
      const url = `${API_BASE}/api/loading/random?exclude=${excludeParam}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.data) {
        setFadeIn(false);
        setTimeout(() => {
          setContent(data.data);
          setSelectedOption(null);
          setContentHistory(prev => [...prev, data.data.id]);
          setFadeIn(true);
        }, 200);
      }
    } catch (err) {
      console.error('Failed to fetch loading content:', err);
    }
  }, [answeredQuestions]);

  // Store latest fetchContent in ref
  useEffect(() => {
    fetchContentRef.current = fetchContent;
  }, [fetchContent]);

  useEffect(() => {
    console.log('[LoadingFactsInline] Initial mount - fetching content');
    fetchContent();
    setIsInitialLoad(false);
    return () => {
      console.log('[LoadingFactsInline] Component unmounting - clearing timeout');
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!content || isInitialLoad) return;
    
    console.log('[LoadingFactsInline] Content changed:', {
      id: content.id,
      type: content.type,
      minDisplayTime,
      willAutoRotate: content.type === 'fact'
    });
    
    // Clear any existing timeout
    if (contentTimeoutRef.current) {
      clearTimeout(contentTimeoutRef.current);
    }
    
    // Only auto-rotate facts, not questions
    if (content.type === 'fact') {
      const historyRef = contentHistory.slice(-5);
      console.log(`[LoadingFactsInline] Setting timeout for ${minDisplayTime}ms`);
      contentTimeoutRef.current = setTimeout(() => {
        console.log('[LoadingFactsInline] Timeout fired - fetching next content');
        if (fetchContentRef.current) {
          fetchContentRef.current(historyRef);
        }
      }, minDisplayTime);
    }

    return () => {
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    };
  }, [content?.id, content?.type, minDisplayTime]);

  const handleOptionSelect = async (option) => {
    if (isSubmitting || selectedOption) return;
    
    setSelectedOption(option);
    setIsSubmitting(true);

    const phone = getUserPhone();
    
    if (phone && content?.id) {
      try {
        await fetch(`${API_BASE}/api/loading/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: content.id,
            phone: phone,
            selectedOption: option,
            context: context
          })
        });
        
        const newAnsweredQuestions = [...answeredQuestions, content.id];
        setAnsweredQuestions(newAnsweredQuestions);
        localStorage.setItem('answeredLoadingQuestions', JSON.stringify(newAnsweredQuestions));
      } catch (err) {
        console.error('Failed to save response:', err);
      }
    }

    setIsSubmitting(false);

    setTimeout(() => {
      fetchContent(contentHistory.slice(-5));
    }, 1000);
  };

  const handleSkip = () => {
    if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current);
    fetchContent(contentHistory.slice(-5));
  };

  if (!content) return null;

  return (
    <div 
      className={`relative bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-500/30 shadow-xl transition-all duration-500 overflow-hidden ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      {/* Professional decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-slate-400/20 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-slate-400/20 to-gray-400/20 rounded-full blur-2xl"></div>
      
      {/* Professional top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-slate-600"></div>
      
      <div className="relative z-10">
        {content.type === 'fact' ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
                <span className="text-2xl">{content.icon}</span>
              </div>
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                💡 FUN FACT
              </span>
            </div>
            <p className="text-gray-800 dark:text-gray-100 text-sm font-medium leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-3 backdrop-blur-sm">
              {content.text}
            </p>
            <button 
              onClick={handleSkip}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Next Fun Fact ✨
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-3 bg-white/80 dark:bg-black/30 rounded-xl p-2 sm:p-3 shadow-md border-2 border-dashed border-slate-300 dark:border-slate-600 backdrop-blur-sm">
              <p className="text-gray-800 dark:text-gray-100 font-bold text-xs sm:text-sm text-center break-words">
                {content.text}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {content.options?.map((option) => (
                <button
                  key={option.option_id}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isSubmitting || selectedOption}
                  className={`
                    flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-300
                    shadow-md transform hover:scale-110 hover:-rotate-2 min-h-[70px] sm:min-h-[80px]
                    ${selectedOption?.option_id === option.option_id
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110 shadow-2xl animate-pulse'
                      : selectedOption
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 scale-95'
                        : 'bg-gradient-to-br from-white to-gray-50 dark:from-[#2d1f3d] dark:to-[#3d2f4d] hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-900/30 dark:hover:to-slate-900/30 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-200'
                    }
                  `}
                >
                  <span className="text-xl sm:text-2xl">{option.icon}</span>
                  <span className="text-center leading-tight break-words w-full px-1">{option.text}</span>
                </button>
              ))}
            </div>
            {selectedOption && (
              <div className="mt-3 text-center">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full animate-bounce shadow-lg">
                  🎉 Awesome!
                </div>
              </div>
            )}
            {!selectedOption && (
              <button 
                onClick={handleSkip}
                className="mt-3 w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white bg-white/60 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-600 backdrop-blur-sm"
              >
                Skip Question →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingWithFacts;

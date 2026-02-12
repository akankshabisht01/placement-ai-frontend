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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
      <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl dark:shadow-soft p-8 max-w-lg w-full border border-transparent dark:border-pink-500/20">
        {/* Main Loading Section */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 dark:border-blue-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xl font-bold animate-pulse">AI</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Interactive Content Section */}
        {showContent && content && (
          <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
            {content.type === 'fact' ? (
              /* Fact Display */
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                  <span className="text-2xl">{content.icon}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {content.text}
                </p>
                <button 
                  onClick={handleSkip}
                  className="mt-4 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Next →
                </button>
              </div>
            ) : (
              /* Question Display */
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{content.icon}</span>
                  <p className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                    {content.text}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {content.options?.map((option, idx) => (
                    <button
                      key={option.option_id || idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={!!selectedOption || isSubmitting}
                      className={`
                        p-3 rounded-lg text-left text-sm transition-all duration-200
                        flex items-center gap-2
                        ${selectedOption?.option_id === option.option_id
                          ? 'bg-green-100 dark:bg-green-900/40 border-2 border-green-500 text-green-800 dark:text-green-300'
                          : selectedOption
                            ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-gray-50 dark:bg-[#2d1f3d]/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                        }
                      `}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span className="truncate">{option.text}</span>
                    </button>
                  ))}
                </div>
                {selectedOption && (
                  <p className="mt-3 text-center text-xs text-green-600 dark:text-green-400 animate-pulse">
                    ✓ Thanks! Loading next...
                  </p>
                )}
                {!selectedOption && (
                  <button 
                    onClick={handleSkip}
                    className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Skip →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subtle footer */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          This may take a few moments...
        </p>
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
      className={`bg-amber-50 dark:bg-pink-900/20 rounded-xl p-4 border border-amber-200 dark:border-pink-500/30 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
    >
      {content.type === 'fact' ? (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">{content.icon}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-pink-400 uppercase tracking-wide">
              Did you know?
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {content.text}
          </p>
          <button 
            onClick={handleSkip}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Next →
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl">{content.icon}</span>
            <p className="text-gray-800 dark:text-gray-200 font-medium text-sm">
              {content.text}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {content.options?.map((option) => (
              <button
                key={option.option_id}
                onClick={() => handleOptionSelect(option)}
                disabled={isSubmitting || selectedOption}
                className={`
                  flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${selectedOption?.option_id === option.option_id
                    ? 'bg-amber-500 dark:bg-pink-500 text-white scale-105'
                    : selectedOption
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-pink-800/30 border border-gray-200 dark:border-gray-600'
                  }
                `}
              >
                <span>{option.icon}</span>
                <span className="truncate">{option.text}</span>
              </button>
            ))}
          </div>
          {selectedOption && (
            <p className="mt-2 text-center text-xs text-green-600 dark:text-green-400">
              ✓ Thanks!
            </p>
          )}
          {!selectedOption && (
            <button 
              onClick={handleSkip}
              className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingWithFacts;

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDomainById } from '../data/jobDomainData';
import { useAuth } from '../contexts/AuthContext';
import { LoadingFactsInline } from '../components/LoadingWithFacts';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

// Monthly Retake Button Component - Shows retake button if score < 50%
const MonthlyRetakeButton = ({ getUserMobile, month, onAnalysisClick }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [retakeStatus, setRetakeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [generationTimerRemaining, setGenerationTimerRemaining] = useState(0); // 5-min timer after clicking retake
  const [testReady, setTestReady] = useState(false); // Show "Start Monthly Test" button

  useEffect(() => {
    checkRetakeStatus();
    const interval = setInterval(checkRetakeStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [month]);

  // Timer countdown effect
  useEffect(() => {
    if (timerRemaining > 0) {
      const timer = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            // Timer ended, refresh status
            checkRetakeStatus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerRemaining]);

  // Generation timer countdown effect (5-minute timer after clicking retake)
  useEffect(() => {
    if (generationTimerRemaining > 0) {
      const timer = setInterval(() => {
        setGenerationTimerRemaining(prev => {
          if (prev <= 1) {
            // Timer ended, show "Start Monthly Test" button
            setTestReady(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [generationTimerRemaining]);

  // Listen for test completion events (when user submits the retake test)
  useEffect(() => {
    const handleTestSubmission = (event) => {
      // Re-check status after user submits test to see if they passed
      console.log('🔄 Test submitted - checking if user passed or needs another retake...');
      console.log('📢 Received monthlyTestSubmitted event:', event.detail);
      
      setTimeout(() => {
        checkRetakeStatus();
        
        // If monthly test was submitted, refetch that specific month's status
        if (event.detail && event.detail.month) {
          console.log(`🔄 Refetching monthly test status for month ${event.detail.month}`);
          // eslint-disable-next-line no-undef
          fetchMonthlyTestStatus(event.detail.month);
        }
      }, 2000); // Wait 2 seconds for backend to process
    };

    const handleWeeklyTestCompletion = (event) => {
      console.log('🔄 Weekly test completed - refetching status...');
      console.log('📢 Received weeklyTestCompleted event:', event.detail);
      
      // Show analysis button immediately since we know test was just completed
      console.log('✅ Test completed - showing Analysis button');
      // eslint-disable-next-line no-undef
      setWeeklyTestHasAnalysis(true);
      // Don't change weeklyTestGenerated or showTimerModal - keep buttons visible
      
      // Also refetch current week info after a delay
      setTimeout(() => {
        // eslint-disable-next-line no-undef
        fetchCurrentWeekInfo();
      }, 2000);
    };

    // Listen for custom events when tests are submitted
    window.addEventListener('monthlyTestSubmitted', handleTestSubmission);
    window.addEventListener('weeklyTestCompleted', handleWeeklyTestCompletion);
    
    return () => {
      window.removeEventListener('monthlyTestSubmitted', handleTestSubmission);
      window.removeEventListener('weeklyTestCompleted', handleWeeklyTestCompletion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchMonthlyTestStatus is defined later but will exist when event fires

  const checkRetakeStatus = async () => {
    const mobile = getUserMobile();
    if (!mobile) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/monthly-test-retake-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, month })
      });
      const data = await response.json();
      if (data.success) {
        setRetakeStatus(data);
        // Set timer if there's time remaining
        if (data.analysisTimerRemaining > 0) {
          setTimerRemaining(data.analysisTimerRemaining);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking retake status:', error);
      setLoading(false);
    }
  };

  const handleRetake = async () => {
    const mobile = getUserMobile();
    if (!mobile) {
      alert('❌ Mobile number not found. Please ensure you are logged in.');
      return;
    }

    setTriggering(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/trigger-monthly-retake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, month })
      });
      const data = await response.json();
      if (data.success) {
        // Start 5-minute generation timer instead of immediately showing test button
        setGenerationTimerRemaining(300); // 5 minutes = 300 seconds
        setTestReady(false);
        
        // Notify parent that generation has started
        notifyRetakeStatusChange();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Network error. Please try again.');
    }
    setTriggering(false);
  };

  // Handle starting the monthly test
  const handleStartTest = () => {
    // Reset states and notify parent to show the test
    setRetakeStatus(null);
    setGenerationTimerRemaining(0);
    setTestReady(false);
    
    // Dispatch event to trigger the monthly test start
    window.dispatchEvent(new CustomEvent('startMonthlyRetakeTest', { 
      detail: { month } 
    }));
  };

  // Notify parent that retake status changed (for hiding/showing buttons)
  const notifyRetakeStatusChange = () => {
    window.dispatchEvent(new CustomEvent('monthlyRetakeStatusChanged', { 
      detail: { month, hasTimer: false } 
    }));
  };

  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className={`text-center py-2 text-sm ${themeClasses.textSecondary}`}>Checking test status...</div>;
  
  if (!retakeStatus || !retakeStatus.needsRetake) return null; // Don't show if passed

  return (
    <div className="space-y-2">
      {/* Failed Status Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">❌ Test Not Passed (Attempt {retakeStatus.testAttempt}/3)</p>
            <p className="text-xs text-red-600 dark:text-red-500">Score: {retakeStatus.percentage}% (Need 50%+)</p>
          </div>
          <div className="text-2xl">😟</div>
        </div>
      </div>

      {/* Max Attempts Reached */}
      {retakeStatus.maxAttemptsReached && (
        <div className="bg-gray-100 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-600 rounded-lg p-4 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-semibold">⚠️ Maximum 3 attempts reached</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please contact support for assistance.</p>
        </div>
      )}

      {/* Show Analysis Button - Only if analysis not generated yet for current attempt */}
      {retakeStatus.showAnalysisButton && !retakeStatus.maxAttemptsReached && onAnalysisClick && (
        <button
          onClick={() => onAnalysisClick(month)}
          className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Monthly Test Analysis</span>
        </button>
      )}

      {/* Timer - Show after analysis generated, waiting for retake */}
      {timerRemaining > 0 && !retakeStatus.maxAttemptsReached && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              ⏱️ {formatTime(timerRemaining)}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Review your analysis. Retake button will appear when timer ends.
            </p>
          </div>
        </div>
      )}

      {/* Retake Button - Only show after analysis + timer, and not during generation */}
      {retakeStatus.showRetakeButton && timerRemaining === 0 && generationTimerRemaining === 0 && !testReady && (
        <button
          onClick={handleRetake}
          disabled={triggering}
          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{triggering ? 'Generating...' : '🔄 Generate Monthly Retest'}</span>
        </button>
      )}

      {/* Generation Timer - 5 minute countdown after clicking retake */}
      {generationTimerRemaining > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              ⏳ {formatTime(generationTimerRemaining)}
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Generating your retest... Please wait.
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              The "Start Monthly Test" button will appear when ready.
            </p>
          </div>
        </div>
      )}

      {/* Start Monthly Test Button - Show after generation timer ends */}
      {testReady && (
        <button
          onClick={handleStartTest}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>🚀 Start Monthly Test</span>
        </button>
      )}

      {/* Blocking Warning */}
      {!retakeStatus.maxAttemptsReached && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-2 rounded">
          <p className="text-xs text-yellow-800 dark:text-yellow-400">
            ⚠️ <strong>Action Required:</strong> You must pass this test before continuing with weekly tests or next month.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to parse certifications (can be string or array)
const parseCertifications = (certifications) => {
  if (!certifications) return [];
  
  if (Array.isArray(certifications)) {
    return certifications;
  }
  
  if (typeof certifications === 'string') {
    // Handle comma-separated string with possible quotes
    const cleaned = certifications.replace(/['"]/g, '').trim();
    if (cleaned.endsWith(',')) {
      return cleaned.slice(0, -1).split(',').map(cert => cert.trim()).filter(cert => cert);
    }
    return cleaned.split(',').map(cert => cert.trim()).filter(cert => cert);
  }
  
  return [];
};

// Helper function to format job role names (e.g., nlp_engineer -> NLP Engineer)
const formatJobRole = (role) => {
  if (!role) return 'Your Role';
  
  // Common abbreviations that should stay uppercase
  const abbreviations = ['nlp', 'ml', 'ai', 'ui', 'ux', 'api', 'sql', 'aws', 'gcp', 'devops', 'qa', 'hr', 'ios', 'seo', 'crm', 'erp'];
  
  return role
    .split(/[_\-\s]+/) // Split by underscore, hyphen, or space
    .map(word => {
      const lowerWord = word.toLowerCase();
      // Check if it's an abbreviation
      if (abbreviations.includes(lowerWord)) {
        return word.toUpperCase();
      }
      // Otherwise capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Weekly Test Generating Modal Component - Outside Dashboard to prevent recreation
const WeeklyTestGeneratingModal = ({ isGenerating, theme }) => {
  if (!isGenerating) return null;
  
  const themeClasses = getThemeClasses(theme);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with blur - theme aware */}
      <div className={`absolute inset-0 ${themeClasses.pageBackground}/40 backdrop-blur-md`}></div>
      
      {/* Modal Card - theme aware */}
      <div className={`relative ${themeClasses.cardBackground} backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-2xl w-full border ${themeClasses.cardBorder} transform transition-all`}>
        {/* Gradient border effect - theme aware */}
        <div className={`absolute inset-0 rounded-3xl ${themeClasses.gradient} opacity-20 blur-xl -z-10`}></div>
        
        <div className="text-center">
          {/* Animated Icon with gradient - theme aware */}
          <div className="relative mx-auto w-28 h-28 mb-8">
            {/* Outer glow rings */}
            <div className={`absolute inset-0 rounded-full ${themeClasses.gradient} opacity-30 blur-2xl animate-pulse`}></div>
            
            {/* Base ring */}
            <div className={`absolute inset-0 rounded-full border-4 ${themeClasses.cardBorder}`}></div>
            
            {/* Spinning gradient ring - theme aware */}
            <div 
              className={`absolute inset-0 rounded-full border-4 border-transparent ${themeClasses.gradient} animate-spin`}
              style={{ 
                animationDuration: '2s',
                WebkitMaskImage: 'linear-gradient(transparent 50%, black 50%)',
                maskImage: 'linear-gradient(transparent 50%, black 50%)'
              }}
            ></div>
            
            {/* Center icon - theme aware */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-14 h-14 ${themeClasses.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Title with gradient - theme aware */}
          <h3 className={`text-3xl font-bold mb-3 ${themeClasses.gradient} bg-clip-text text-transparent`}>
            Generating Your Weekly Test
          </h3>
          
          <p className={`${themeClasses.textSecondary} mb-8 text-lg`}>
            Our AI is creating personalized questions for this week...
          </p>
          
          {/* Modern progress bar - theme aware */}
          <div className={`relative w-full h-3 ${themeClasses.sectionBackground} rounded-full mb-8 overflow-hidden backdrop-blur-sm`}>
            <div className={`absolute inset-0 ${themeClasses.gradient} rounded-full animate-shimmer`}
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 2s infinite'
                 }}>
            </div>
          </div>
          
          <p className={`text-sm ${themeClasses.textSecondary} mb-8 font-medium`}>
            ⏱️ This may take 1-2 minutes • Please don't close this page
          </p>
          
          {/* Interactive Facts/Questions Section with enhanced styling - theme aware */}
          <div className={`${themeClasses.cardHover} rounded-2xl p-6 backdrop-blur-sm border ${themeClasses.border}`}>
            <LoadingFactsInline minDisplayTime={6000} />
          </div>
          
          {/* Animated dots with gradient - theme aware */}
          <div className="flex items-center justify-center space-x-2 mt-8">
            <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  // Initialize activeSection from URL query parameter
  const getInitialSection = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam) {
        const s = sectionParam.toLowerCase();
        const mapping = {
          'skills': 'skilltest',
          'skilltest': 'skilltest',
          'skills-test': 'skilltest',
          'skillstest': 'skilltest',
          'weeklytest': 'weeklytest',
          'weekly-test': 'weeklytest',
          'overview': 'overview',
          'resume': 'resume',
          'roadmap': 'roadmap',
          'progress': 'progress'
        };
        return mapping[s] || s;
      }
    } catch (err) {
      // ignore
    }
    return 'overview';
  };
  
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [smartAnalysisData, setSmartAnalysisData] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // State to trigger re-render when localStorage changes (skills updated from WeeklyTest)
  const [localStorageUpdateTrigger, setLocalStorageUpdateTrigger] = useState(0);
  
  // Skills Test states
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testError, setTestError] = useState(null);
  const [testAvailable, setTestAvailable] = useState(false);
  const [weeklyTestLoading, setWeeklyTestLoading] = useState(false);
  const [weeklyTestMessage, setWeeklyTestMessage] = useState(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [showWeeklyTestOverlay, setShowWeeklyTestOverlay] = useState(false);
  // Analysis availability state - whether a quiz result exists for this user
  const [analysisReady, setAnalysisReady] = useState(false);
  const [checkingAnalysis, setCheckingAnalysis] = useState(false);
  const analysisCheckRef = useRef(null);
  const [analysisGenerating, setAnalysisGenerating] = useState(false);
  const analysisGenRef = useRef(null);
  const [shouldStartPolling, setShouldStartPolling] = useState(false);

  // Anuvaad AI states
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translatedVideoUrl, setTranslatedVideoUrl] = useState(null);
  
  // YouTube link translation states
  const [youtubeLink, setYoutubeLink] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'youtube'
  
  // Skill ratings state (stars for Skills & Expertise section)
  const [skillRatings, setSkillRatings] = useState({});
  const [loadingSkillRatings, setLoadingSkillRatings] = useState(true);
  const [regeneratingMappings, setRegeneratingMappings] = useState(false);
  
  // Sidebar scroll states - Enhanced for better responsiveness
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const [sidebarAbsolute, setSidebarAbsolute] = useState(false);
  const [sidebarTopOffset, setSidebarTopOffset] = useState(20);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const navbarRef = useRef(null);

  // Test Analysis collapsible states
  const [showTestAnalysis, setShowTestAnalysis] = useState(false);
  const [testAnalysisData, setTestAnalysisData] = useState(null);
  const [loadingTestAnalysis, setLoadingTestAnalysis] = useState(false);
  const [testAnalysisError, setTestAnalysisError] = useState(null);

  // Weekly Test Analysis collapsible states
  const [showWeeklyTestAnalysis, setShowWeeklyTestAnalysis] = useState(false);
  const [weeklyTestAnalysisData, setWeeklyTestAnalysisData] = useState(null);

  // Education & Certifications collapsible states
  const [showEducation, setShowEducation] = useState(false);
  const [showCertifications, setShowCertifications] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [loadingWeeklyTestAnalysis, setLoadingWeeklyTestAnalysis] = useState(false);
  const [weeklyTestAnalysisError, setWeeklyTestAnalysisError] = useState(null);
  
  // Monthly Test Analysis collapsible states
  const [showMonthlyTestAnalysis, setShowMonthlyTestAnalysis] = useState(false);
  const [monthlyTestAnalysisData, setMonthlyTestAnalysisData] = useState(null);
  const [loadingMonthlyTestAnalysis, setLoadingMonthlyTestAnalysis] = useState(false);
  const [monthlyTestAnalysisError, setMonthlyTestAnalysisError] = useState(null);
  const [expandedMonthlyAnalysis, setExpandedMonthlyAnalysis] = useState({}); // Which months are expanded in analysis view
  
  // Weekly Test Analysis redirect loading overlay
  const [redirectingToProgressTracking, setRedirectingToProgressTracking] = useState(false);
  const [progressTrackingMessage, setProgressTrackingMessage] = useState('');
  
  // Weekly Progress Tracker collapsible state
  const [showWeeklyProgress, setShowWeeklyProgress] = useState(false);
  
  // Nested expansion states for months and weeks
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedWeeks, setExpandedWeeks] = useState({});
  
  // Current week info for Weekly Test section
  const [currentWeekInfo, setCurrentWeekInfo] = useState({ week: 1, month: 1 });
  const [loadingWeekInfo, setLoadingWeekInfo] = useState(false);
  
  // Generate Weekly Test states
  const [generatingWeeklyTest, setGeneratingWeeklyTest] = useState(false);
  const weeklyTestPollRef = useRef(null);
  const [weeklyTestGenerated, setWeeklyTestGenerated] = useState(false);
  const [weeklyTestHasAnalysis, setWeeklyTestHasAnalysis] = useState(false);
  const [checkingTestGeneration, setCheckingTestGeneration] = useState(false);
  const previousWeekRef = useRef(null);
  const previousMonthRef = useRef(null);

  // Post-analysis timer states for generating next test
  const [postAnalysisTimerActive, setPostAnalysisTimerActive] = useState(false);
  const [postAnalysisTimerRemaining, setPostAnalysisTimerRemaining] = useState(0);
  const [postAnalysisTimerDuration, setPostAnalysisTimerDuration] = useState(300); // 5 min default
  const [postAnalysisNextAction, setPostAnalysisNextAction] = useState('generate_weekly_test');
  const [postAnalysisIsMonthEnd, setPostAnalysisIsMonthEnd] = useState(false);
  const [postAnalysisIsRoadmapTimer, setPostAnalysisIsRoadmapTimer] = useState(false); // For first week after roadmap
  const postAnalysisTimerRef = useRef(null);

  // Monthly post-analysis timer states
  const [monthlyPostAnalysisTimerActive, setMonthlyPostAnalysisTimerActive] = useState(false);
  const [monthlyPostAnalysisTimerRemaining, setMonthlyPostAnalysisTimerRemaining] = useState(0);
  const monthlyPostAnalysisTimerRef = useRef(null);

  // Monthly test retake states (for users who score <50%)
  const [monthlyTestFailed, setMonthlyTestFailed] = useState(false);
  const [monthlyTestFailedMonth, setMonthlyTestFailedMonth] = useState(null);
  const [monthlyTestFailedScore, setMonthlyTestFailedScore] = useState(0);
  const [monthlyTestRetakeAttempt, setMonthlyTestRetakeAttempt] = useState(1);

  // Primary timer controller: This useEffect is the SOLE owner of the postAnalysis timer interval
  useEffect(() => {
    // Clear any existing interval first to avoid duplicates
    if (postAnalysisTimerRef.current) {
      clearInterval(postAnalysisTimerRef.current);
      postAnalysisTimerRef.current = null;
    }
    
    // Only start if timer should be active
    if (postAnalysisTimerActive) {
      console.log('🔄 Starting post-analysis timer interval (useEffect)');
      postAnalysisTimerRef.current = setInterval(() => {
        setPostAnalysisTimerRemaining(prev => {
          console.log(`⏱️ Timer tick: ${prev}s remaining`);
          if (prev <= 1) {
            clearInterval(postAnalysisTimerRef.current);
            postAnalysisTimerRef.current = null;
            setPostAnalysisTimerActive(false);
            setPostAnalysisIsRoadmapTimer(false);
            console.log('✅ Timer completed!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup on unmount or when effect re-runs
    return () => {
      if (postAnalysisTimerRef.current) {
        console.log('🧹 Cleaning up post-analysis timer interval');
        clearInterval(postAnalysisTimerRef.current);
        postAnalysisTimerRef.current = null;
      }
    };
  }, [postAnalysisTimerActive]); // Only depend on active state

  // Primary timer controller for monthly post-analysis timer
  useEffect(() => {
    if (monthlyPostAnalysisTimerRef.current) {
      clearInterval(monthlyPostAnalysisTimerRef.current);
      monthlyPostAnalysisTimerRef.current = null;
    }
    
    if (monthlyPostAnalysisTimerActive) {
      console.log('🔄 Starting monthly post-analysis timer interval');
      monthlyPostAnalysisTimerRef.current = setInterval(() => {
        setMonthlyPostAnalysisTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(monthlyPostAnalysisTimerRef.current);
            monthlyPostAnalysisTimerRef.current = null;
            setMonthlyPostAnalysisTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (monthlyPostAnalysisTimerRef.current) {
        clearInterval(monthlyPostAnalysisTimerRef.current);
        monthlyPostAnalysisTimerRef.current = null;
      }
    };
  }, [monthlyPostAnalysisTimerActive]);

  // Month Test eligibility states
  const [monthTestEligibility, setMonthTestEligibility] = useState(null);
  const [loadingMonthEligibility, setLoadingMonthEligibility] = useState(false);
  const [generatingMonthlyTest, setGeneratingMonthlyTest] = useState(false);
  const [retakeButtonUpdate, setRetakeButtonUpdate] = useState(0); // Force re-render when retake status changes
  
  // Monthly test timer states (similar to weekly test timer)
  const [showMonthlyTimerModal, setShowMonthlyTimerModal] = useState(false);
  const [monthlyTimerCompleted, setMonthlyTimerCompleted] = useState(false);
  const [monthlyTimerMonth, setMonthlyTimerMonth] = useState(null); // Track which month the timer is for
  const monthlyTestPollRef = useRef(null); // Ref for polling interval
  
  // Monthly test status tracking
  const [monthlyTestStatus, setMonthlyTestStatus] = useState({}); // {month: {test_generated, test_completed, can_start_test, timer_remaining}}
  const [monthlyTestTimers, setMonthlyTestTimers] = useState({}); // {month: intervalId}
  const [monthlyStatusFetched, setMonthlyStatusFetched] = useState(new Set()); // Track which months have been fetched
  const monthlyTimersRef = useRef({}); // Track active timers to prevent duplicates
  const timerCompletedRef = useRef({}); // Track which timers have completed to prevent restart

  // Certifications states
  const [certificationsData, setCertificationsData] = useState(null);
  const [loadingCertifications, setLoadingCertifications] = useState(false);

  // Project Submission states
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectFile, setProjectFile] = useState([]);
  const [hoveredFileIndex, setHoveredFileIndex] = useState(null);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectHistory, setProjectHistory] = useState([]);
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);
  const [certificationsError, setCertificationsError] = useState(null);
  const [projectSubmitError, setProjectSubmitError] = useState(null);
  const [projectEvaluation, setProjectEvaluation] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  
  // Current Month Project states
  const [currentMonthProject, setCurrentMonthProject] = useState(null);
  const [loadingCurrentProject, setLoadingCurrentProject] = useState(false);
  const [projectSteps, setProjectSteps] = useState([]);
  const [loadingProjectSteps, setLoadingProjectSteps] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  // Toggle month expansion
  const toggleMonth = (monthIndex) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthIndex]: !prev[monthIndex]
    }));
  };

  // Toggle week expansion
  const toggleWeek = (monthIndex, weekIndex) => {
    const key = `${monthIndex}-${weekIndex}`;
    setExpandedWeeks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Scroll to top when switching sections and update URL
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update URL with current section to persist across refresh
    const params = new URLSearchParams(window.location.search);
    params.set('section', activeSection);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeSection]);

  // Listen for localStorage changes (when skills are updated from WeeklyTest)
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Listen for changes to linkedResumeData
      if (e.key === 'linkedResumeData' || e.key === null) {
        setLocalStorageUpdateTrigger(prev => prev + 1);
      }
    };

    const handleCustomSkillUpdate = () => {
      // Custom event dispatched by WeeklyTest when skills are updated
      setLocalStorageUpdateTrigger(prev => prev + 1);
    };

    const handleRetakeStatusChange = () => {
      // Force re-render when retake button status changes
      setRetakeButtonUpdate(prev => prev + 1);
    };

    // Listen for storage events (works across tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event (works in same tab)
    window.addEventListener('skillsUpdated', handleCustomSkillUpdate);
    window.addEventListener('monthlyRetakeStatusChanged', handleRetakeStatusChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('skillsUpdated', handleCustomSkillUpdate);
      window.removeEventListener('monthlyRetakeStatusChanged', handleRetakeStatusChange);
    };
  }, []);

  // Sync skills from database on mount (fixes localStorage cache issues)
  useEffect(() => {
    const syncSkillsFromDatabase = async () => {
      const mobile = getUserMobile();
      if (!mobile) return;
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const response = await fetch(`${backendUrl}/api/get-resume-skills?mobile=${encodeURIComponent(mobile)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.skills) {
            // Update localStorage with fresh skills from database
            const linkedData = JSON.parse(localStorage.getItem('linkedResumeData') || '{}');
            linkedData.skills = data.skills;
            localStorage.setItem('linkedResumeData', JSON.stringify(linkedData));
            
            // Trigger re-render
            setLocalStorageUpdateTrigger(prev => prev + 1);
            
            console.log('✅ Synced skills from database:', data.skills);
          }
        }
      } catch (error) {
        console.warn('Failed to sync skills from database:', error);
      }
    };
    
    syncSkillsFromDatabase();
  }, []); // Run once on mount

  // Fetch skill ratings when mobile is available
  useEffect(() => {
    const fetchSkillRatings = async () => {
      const mobile = getUserMobile();
      if (!mobile) {
        setLoadingSkillRatings(false);
        return;
      }
      
      setLoadingSkillRatings(true);
      
      // Get job role from localStorage directly (can't use linkedResume here as it's defined later)
      let jobRole = null;
      try {
        const linkedResumeData = JSON.parse(localStorage.getItem('linkedResumeData') || '{}');
        jobRole = linkedResumeData?.jobSelection?.jobRole;
      } catch (e) {
        console.warn('Failed to parse linkedResumeData:', e);
      }
      
      if (!jobRole) {
        console.log('⚠️ No job role in localStorage, fetching from backend Resume collection');
        // Fallback: Let backend fetch from Resume collection
      }
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      try {
        // Send job role as query parameter if available, otherwise backend will look it up
        const url = jobRole 
          ? `${backendUrl}/api/skill-ratings/${encodeURIComponent(mobile)}?jobRole=${encodeURIComponent(jobRole)}`
          : `${backendUrl}/api/skill-ratings/${encodeURIComponent(mobile)}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Store the entire response which includes skillRatings and jobRoleSkills
            setSkillRatings(data);
            console.log('📊 Skill ratings loaded:', data);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch skill ratings:', error);
      } finally {
        setLoadingSkillRatings(false);
      }
    };
    
    fetchSkillRatings();
  }, [localStorageUpdateTrigger]); // Refetch when skills are updated

  // Fetch current month's project when on projects section
  useEffect(() => {
    const fetchCurrentMonthProject = async () => {
      if (activeSection !== 'projects') return;
      
      const mobile = getUserMobile();
      if (!mobile) return;
      
      setLoadingCurrentProject(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      try {
        const response = await fetch(`${backendUrl}/api/get-current-month-project`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentMonthProject(data.data);
            console.log('Current month project loaded:', data.data);
            
            // Fetch AI-generated steps for this project
            if (data.data.projectTitle && data.data.projectTitle !== 'No project assigned') {
              fetchProjectSteps(data.data.projectTitle, data.data.projectDescription);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch current month project:', error);
      } finally {
        setLoadingCurrentProject(false);
      }
    };
    
    fetchCurrentMonthProject();
  }, [activeSection]);

  // Fetch AI-generated project implementation steps
  const fetchProjectSteps = async (projectTitle, projectDescription) => {
    if (!projectTitle) return;
    
    setLoadingProjectSteps(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${backendUrl}/api/get-project-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectTitle, 
          projectDescription 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.steps) {
          setProjectSteps(data.data.steps);
          console.log('AI-generated project steps loaded:', data.data.steps.length);
        } else {
          console.error('Failed to load steps:', data);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch project steps:', error);
    } finally {
      setLoadingProjectSteps(false);
    }
  };
  
  // Handle project file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const totalFiles = projectFile.length + files.length;
      if (totalFiles > 10) {
        setProjectSubmitError('Maximum 10 files allowed! Please select fewer files.');
        return;
      }
      setProjectFile([...projectFile, ...files]); // Add to existing files
      setProjectSubmitError(null);
    }
  };
  
  const removeFile = (indexToRemove) => {
    setProjectFile(projectFile.filter((_, index) => index !== indexToRemove));
  };
  
  // Submit project for evaluation
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!projectTitle.trim() || !projectDescription.trim()) {
      setProjectSubmitError('Please provide both project title and description');
      return;
    }
    
    setSubmittingProject(true);
    setProjectSubmitError(null);
    setShowEvaluation(false);
    
    try {
      const formData = new FormData();
      formData.append('mobile', getUserMobile());
      formData.append('title', projectTitle.trim());
      formData.append('description', projectDescription.trim());
      
      if (projectFile && projectFile.length > 0) {
        // Append multiple files
        for (let i = 0; i < projectFile.length; i++) {
          formData.append('files[]', projectFile[i]);
        }
      }
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/submit-project`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      console.log('📊 Project evaluation result:', result);
      console.log('📝 Feedback:', result.data?.feedback ? 'Present (' + result.data.feedback.length + ' chars)' : 'Missing');
      
      if (result.success) {
        // Add evaluation metadata
        const evaluationData = {
          ...result.data,
          evaluatedBy: result.evaluatedBy || 'Unknown'
        };
        
        console.log('💾 Setting evaluation data:', evaluationData);
        
        setProjectEvaluation(evaluationData);
        setShowEvaluation(true);
        
        // Show notification about AI evaluation status
        if (result.evaluatedBy === 'AI') {
          console.log('✅ Project evaluated by AI');
        } else {
          console.warn('⚠️ AI evaluation failed - using fallback system');
        }
        
        // Clear form
        setProjectTitle('');
        setProjectDescription('');
        setProjectFile([]);
        if (document.getElementById('project-file-input')) {
          document.getElementById('project-file-input').value = '';
        }
        
        // Scroll to evaluation
        setTimeout(() => {
          const evalElement = document.getElementById('project-evaluation');
          if (evalElement) {
            evalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        setProjectSubmitError(result.message || 'Failed to submit project');
      }
    } catch (error) {
      console.error('Error submitting project:', error);
      setProjectSubmitError('Network error. Please try again.');
    } finally {
      setSubmittingProject(false);
    }
  };

  // Function to manually regenerate skill mappings
  const regenerateSkillMappings = async () => {
    const mobile = getUserMobile();
    if (!mobile) {
      alert('Mobile number not found. Please ensure your profile is linked.');
      return;
    }
    
    if (!window.confirm('Regenerate skill-week mappings from your roadmap? This will analyze all months and update skill completion tracking.')) {
      return;
    }
    
    setRegeneratingMappings(true);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${backendUrl}/api/generate-skill-mappings-from-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Success!\n\nGenerated skill mappings for ${data.months_processed?.length || 0} month(s)\nTotal skills: ${data.totalSkills || 0}\n\nStars will now appear based on your weekly test performance!`);
        
        // Refresh skill ratings
        setLocalStorageUpdateTrigger(prev => prev + 1);
      } else {
        // More detailed error message
        let errorMsg = '❌ Could not generate skill mappings\n\n';
        
        if (data.details) {
          if (!data.details.roadmap_found) {
            errorMsg += '⚠️ No roadmap found for your account.\n\n';
            errorMsg += 'Please generate a roadmap first:\n';
            errorMsg += '1. Go to "Plans" section\n';
            errorMsg += '2. Select your job domain and role\n';
            errorMsg += '3. Generate your monthly roadmap';
          } else if (!data.details.roadmap_has_data) {
            errorMsg += '⚠️ Your roadmap is empty.\n\n';
            errorMsg += 'Please regenerate your roadmap.';
          } else if (data.details.months_in_roadmap?.length === 0) {
            errorMsg += '⚠️ No month data in roadmap.\n\n';
            errorMsg += 'Please regenerate your roadmap.';
          } else {
            errorMsg += data.message || 'Unknown error occurred.';
          }
        } else {
          errorMsg += data.message || data.error || 'Failed to generate mappings.\n\nPlease ensure you have created a roadmap first.';
        }
        
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error regenerating mappings:', error);
      alert('❌ Failed to regenerate skill mappings. Please try again.');
    } finally {
      setRegeneratingMappings(false);
    }
  };

  // Read incoming query param 'section' to allow linking directly to a dashboard subsection
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam) {
        const s = sectionParam.toLowerCase();
        // Map common synonyms to internal activeSection ids
        const mapping = {
          'skills': 'skilltest',
          'skilltest': 'skilltest',
          'skills-test': 'skilltest',
          'skillstest': 'skilltest',
          'overview': 'overview',
          'resume': 'resume',
          'roadmap': 'roadmap',
          'progress': 'progress'
        };
        const target = mapping[s] || s;
        setActiveSection(target);
      }
    } catch (err) {
      // ignore
    }
  }, [location.search]);

  // Fetch certifications data when certifications section is active
  useEffect(() => {
    if (activeSection === 'certifications' && !certificationsData && !loadingCertifications) {
      fetchCertificationsData();
    }
  }, [activeSection]);

  // Handle sidebar scroll behavior: Enhanced for better responsiveness and accessibility
  useEffect(() => {
    // Only apply scroll behavior on desktop (lg breakpoint)
    const checkScreenSize = () => {
      return window.innerWidth >= 1024; // lg breakpoint
    };

    if (!checkScreenSize()) {
      // On mobile/tablet, reset states
      setSidebarFixed(false);
      setSidebarAbsolute(false);
      return;
    }

    let initialTopOffset = null;
    let rafId = null;
    let ticking = false;
    let lastScrollTop = 0;
    let lastState = { fixed: false, absolute: false };
    let scrollEndTimer = null;
    
    const handleScroll = () => {
      // Set scrolling state
      setIsScrolling(true);
      
      // Clear previous timer
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      
      // Set timer to detect scroll end
      scrollEndTimer = setTimeout(() => {
        setIsScrolling(false);
      }, 100);
      
      // Use requestAnimationFrame for smoother performance
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          if (!sidebarRef.current || !contentRef.current) {
            ticking = false;
            return;
          }
          
          const scrollTop = window.scrollY;
          
          // Remove threshold check for instantaneous updates
          lastScrollTop = scrollTop;
          
          const sidebarElement = sidebarRef.current;
          const contentElement = contentRef.current;
          
          // Cache navbar height (only measure when needed)
          const navbar = document.querySelector('[data-navbar]');
          const currentNavbarHeight = navbar ? navbar.offsetHeight : 96;
          
          // Store the initial top offset (only once)
          if (initialTopOffset === null) {
            const rect = sidebarElement.getBoundingClientRect();
            initialTopOffset = rect.top + scrollTop;
          }
          
          const sidebarHeight = sidebarElement.offsetHeight;
          const sidebarOriginalTop = initialTopOffset || sidebarElement.offsetTop;
          
          // Calculate content bottom position consistently with how sidebar top is calculated
          const contentRect = contentElement.getBoundingClientRect();
          const contentBottom = contentRect.bottom + scrollTop;
          
          // Calculate dynamic top offset - sidebar should always be below navbar with spacing
          const spacingBelowNavbar = 20; // 20 px gap below navbar
          const calculatedTopOffset = currentNavbarHeight + spacingBelowNavbar;
          
          const fixedTop = calculatedTopOffset;
          const fixedActivationPoint = sidebarOriginalTop - fixedTop;
          
          // Calculate bottom boundary with extended reach into footer
          const sidebarBottomWhenFixed = scrollTop + fixedTop + sidebarHeight;
          const contentBottomWithPadding = contentBottom; // Extends 20px past content bottom
          
          // Determine sidebar state based on scroll position
          let newFixed = false;
          let newAbsolute = false;
          
          if (scrollTop < fixedActivationPoint) {
            // Haven't scrolled enough - keep in default flow
            newFixed = false;
            newAbsolute = false;
          } else if (sidebarBottomWhenFixed <= contentBottomWithPadding) {
            // Scrolled past activation - make it fixed
            newFixed = true;
            newAbsolute = false;
          } else {
            // Near footer - make it absolute to stop before footer
            newFixed = false;
            newAbsolute = true;
          }
          
          // Only update state if it changed (prevents unnecessary re-renders)
          if (newFixed !== lastState.fixed || newAbsolute !== lastState.absolute) {
            setSidebarFixed(newFixed);
            setSidebarAbsolute(newAbsolute);
            setSidebarTopOffset(calculatedTopOffset);
            lastState = { fixed: newFixed, absolute: newAbsolute };
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    // Debounced resize handler with proper cleanup
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!checkScreenSize()) {
          setSidebarFixed(false);
          setSidebarAbsolute(false);
        } else {
          initialTopOffset = null; // Reset on resize
          handleScroll();
        }
      }, 200);
    };
    
    // Initial check after layout settles
    const timer = setTimeout(handleScroll, 150);
    
    // Add event listeners with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Get personalized data including ATS breakdown and career progress
  const { name, placementScore, atsScore, atsBreakdown, missingSkills, linkedResume, careerProgress } = useMemo(() => {
    let n = 'Student';
    let ps = 35; // placement score
    let ats = 'N/A'; // actual ATS score - will be fetched separately
    let atsDetails = null; // ATS score breakdown
    let m = 3;
    let linkedResumeData = null;
    let careerProgressPercentage = 0;
    
    try {
      // Check for linked resume data first
      const linkedRaw = localStorage.getItem('linkedResumeData');
      if (linkedRaw) {
        linkedResumeData = JSON.parse(linkedRaw);
        if (linkedResumeData.name) n = linkedResumeData.name;
      }
      
      // Check user data
      const userRaw = localStorage.getItem('userData');
      if (userRaw && !linkedResumeData) {
        const userData = JSON.parse(userRaw);
        if (userData.name) n = userData.name;
      }
      
      const raw = localStorage.getItem('predictionFormData');
      if (raw) {
        const fd = JSON.parse(raw);
        if (fd.name && !linkedResumeData) n = fd.name;
      }
      
      const apiRaw = localStorage.getItem('predictionApiResult');
      if (apiRaw) {
        const api = JSON.parse(apiRaw);
        const score = api?.placementScore ?? api?.placement_score ?? api?.data?.placementScore ?? null;
        if (typeof score === 'number') ps = Math.max(0, Math.min(100, Math.round(score)));
        const ms = api?.missingSkills || api?.data?.missingSkills;
        if (Array.isArray(ms)) m = ms.length;
      }
      
      // Calculate career progress based on completed milestones
      if (linkedResumeData) {
        let completedMilestones = 0;
        const totalMilestones = 5;
        
        // Profile complete
        if (linkedResumeData.name && linkedResumeData.email) completedMilestones++;
        // Skills selected
        if (linkedResumeData.jobSelection?.selectedSkills?.length > 0) completedMilestones++;
        // Resume uploaded
        if (linkedResumeData.parsedResume) completedMilestones++;
        // ATS analyzed (check personal score first, then fallback)
        const personalAtsCheck = localStorage.getItem('personalATSScore');
        const atsCheck = personalAtsCheck || localStorage.getItem('atsAnalysisResult');
        if (atsCheck) completedMilestones++;
        // Placement predicted
        if (apiRaw) completedMilestones++;
        
        careerProgressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
      }
      
      // Check for personal ATS score (only user's own resume, not other analyzed resumes)
      // Priority: personalATSScore > atsAnalysisResult (for backward compatibility)
      const personalAtsRaw = localStorage.getItem('personalATSScore');
      const atsRaw = personalAtsRaw || localStorage.getItem('atsAnalysisResult');
      if (atsRaw) {
        const atsData = JSON.parse(atsRaw);
        const atsValue = atsData?.total_score ?? atsData?.score ?? null;
        if (typeof atsValue === 'number') {
          ats = Math.max(0, Math.min(100, Math.round(atsValue)));
          
          // Extract breakdown with new category names and max values
          atsDetails = {
            contact_info: { score: atsData?.score_breakdown?.contact_info ?? 0, max: 5 },
            education: { score: atsData?.score_breakdown?.education ?? 0, max: 15 },
            experience: { score: atsData?.score_breakdown?.experience ?? 0, max: 20 },
            skills: { score: atsData?.score_breakdown?.skills ?? 0, max: 25 },
            keywords: { score: atsData?.score_breakdown?.keywords ?? 0, max: 5 },
            format: { score: atsData?.score_breakdown?.format ?? 0, max: 5 },
            projects: { score: atsData?.score_breakdown?.projects ?? 0, max: 15 },
            achievements: { score: atsData?.score_breakdown?.achievements ?? 0, max: 5 },
            spelling_grammar: { score: atsData?.score_breakdown?.spelling_grammar ?? 0, max: 5 },
            rating: atsData?.rating ?? 'N/A',
            tips: atsData?.tips ?? [],
            issues: atsData?.issues ?? []
          };
        }
      }
    } catch {}
    return { name: n, placementScore: ps, atsScore: ats, atsBreakdown: atsDetails, missingSkills: m, linkedResume: linkedResumeData, careerProgress: careerProgressPercentage };
  }, [localStorageUpdateTrigger]);

  // Calculate job-role-relevant skills that user possesses (for "Skills & Expertise" section)
  // These are skills that have been added to resume after completing their curriculum weeks
  const jobRoleRelevantSkills = useMemo(() => {
    if (!linkedResume?.jobSelection?.jobRole) {
      return [];
    }

    // Get job-role-specific skills from backend
    const jobRoleSkills = skillRatings?.jobRoleSkills || [];
    const jobRoleSkillsLower = jobRoleSkills.map(s => s.toLowerCase().trim());
    
    // Get skills that have been added to resume (completed all curriculum weeks)
    // These are added by /api/check-skill-completion-with-ai after completing the last week of a skill
    const resumeSkills = linkedResume?.skills || [];
    
    // Filter to show only job-role-relevant skills that are in the resume
    const relevantSkills = resumeSkills.filter(skill => {
      const skillLower = skill.toLowerCase().trim();
      return jobRoleSkillsLower.includes(skillLower);
    });
    
    return relevantSkills;
  }, [linkedResume, skillRatings]);

  // Calculate skills that haven't completed their curriculum weeks yet
  const unselectedSkills = useMemo(() => {
    if (!linkedResume?.jobSelection?.jobRole) {
      return [];
    }

    // Get job-role-specific skills from backend
    const jobRoleSkills = skillRatings?.jobRoleSkills || [];
    
    // Get skills that have been tested (appear in Skills & Expertise)
    const testedSkillsLower = jobRoleRelevantSkills.map(s => s.toLowerCase().trim());
    
    // Filter to show ALL job role skills that haven't been tested yet
    // These are skills the user needs to develop through weekly tests
    const untestedSkills = jobRoleSkills.filter(skill => {
      const skillLower = skill.toLowerCase().trim();
      const isTested = testedSkillsLower.includes(skillLower);
      
      // Show all untested job role skills
      return !isTested;
    });
    
    return untestedSkills;
  }, [linkedResume, skillRatings, jobRoleRelevantSkills]);

  const handleLogout = () => {
    // Use auth context logout function
    logout();
    // Clear other app-specific data
    localStorage.removeItem('predictionFormData');
    localStorage.removeItem('predictionApiResult');
    localStorage.removeItem('linkedResumeData');
    localStorage.removeItem('resumeId');
    localStorage.removeItem('resumeCollection');
    localStorage.removeItem('resumeChoice');
    // Navigate to home
    navigate('/');
  };

  // Helper function to get user's mobile number from localStorage
  const getUserMobile = () => {
    const linkedData = localStorage.getItem('linkedResumeData');
    const userData = localStorage.getItem('userData');
    const predictionData = localStorage.getItem('predictionFormData');

    if (linkedData) {
      const parsed = JSON.parse(linkedData);
      return parsed.mobile || parsed.phoneNumber;
    }
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.mobile || parsed.phoneNumber;
    }
    if (predictionData) {
      const parsed = JSON.parse(predictionData);
      return parsed.mobile || parsed.phoneNumber;
    }
    return null;
  };

  // Resume Analysis Handler
  const handleResumeAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const linkedResumeData = JSON.parse(localStorage.getItem('linkedResumeData') || '{}');
      
      // Get mobile number
      const mobile = getUserMobile();
      
      if (!mobile) {
        throw new Error('Mobile number not found. Please complete your profile first.');
      }
      
      const response = await fetch(process.env.REACT_APP_N8N_RESUME_ANALYSIS_WEBHOOK || 'https://n8n23-80hw.onrender.com/webhook/e52661f1-2a51-40ec-90c6-35edb5eb00e2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          user: userData,
          linkedResumeData: linkedResumeData,
          timestamp: new Date().toISOString(),
          requestType: 'resume-analysis'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAnalysisResult({
          success: true,
          message: 'Resume analysis request sent successfully! Check your email for detailed feedback.'
        });
      } else {
        throw new Error(result.message || `Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Resume analysis webhook error:', error);
      setAnalysisResult({
        success: false,
        message: 'Failed to send resume analysis request. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check whether quiz_result exists for this user (only when button clicked)
  useEffect(() => {
    if (!shouldStartPolling) return;

    const mobile = getUserMobile();
    if (!mobile) {
      setShouldStartPolling(false);
      return;
    }

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    // Use specific phone format (clean 10 digits with +91 prefix)
    const clean = (mobile || '').split('').filter(c => /\d/.test(c)).join('');
    const phoneFormat = clean.length === 10 ? `+91 ${clean}` : mobile;
    
    console.log('[analysisCheck] Using specific format:', phoneFormat);

    const checkAnalysis = async () => {
      setCheckingAnalysis(true);
      try {
        const url = `${backendUrl}/api/quiz-result/${encodeURIComponent(phoneFormat)}`;
        console.debug('[analysisCheck] checking', url);
        const res = await fetch(url);
        console.debug('[analysisCheck] response status', res.status);
        
        if (res.ok) {
          setAnalysisReady(true);
          setCheckingAnalysis(false);
          setShouldStartPolling(false);
          if (analysisCheckRef.current) {
            clearInterval(analysisCheckRef.current);
            analysisCheckRef.current = null;
          }
          return true;
        }
      } catch (err) {
        console.warn('[analysisCheck] request failed', err);
      }
      setCheckingAnalysis(false);
      return false;
    };

    // Wait 10 seconds before starting polling
    const delayTimeout = setTimeout(() => {
      console.log('[analysisCheck] Starting polling after 10 second delay');
      
      let attemptCount = 0;
      const maxAttempts = 12;
      
      if (analysisCheckRef.current) clearInterval(analysisCheckRef.current);
      
      // Exponential backoff polling - starts at 3s, increases to 8s
      const pollWithBackoff = async () => {
        attemptCount++;
        console.log(`[analysisCheck] Polling attempt ${attemptCount}/${maxAttempts}`);
        
        if (attemptCount >= maxAttempts) {
          console.log('[analysisCheck] Max attempts reached, stopping');
          setShouldStartPolling(false);
          return;
        }
        
        await checkAnalysis();
        
        // Exponential backoff: 3s, 4s, 5s, 6s, 7s, 8s...
        const delay = Math.min(3000 + (attemptCount * 1000), 8000);
        analysisCheckRef.current = setTimeout(pollWithBackoff, delay);
      };
      
      // Start polling
      analysisCheckRef.current = setTimeout(pollWithBackoff, 3000);
    }, 10000);

    return () => {
      clearTimeout(delayTimeout);
      if (analysisCheckRef.current) {
        clearTimeout(analysisCheckRef.current);
        analysisCheckRef.current = null;
      }
    };
  }, [shouldStartPolling]);

  // Fetch current week info on mount
  useEffect(() => {
    fetchCurrentWeekInfo();
    fetchMonthTestEligibility();
  }, []);

  // Fetch monthly test status for all unlocked months
  useEffect(() => {
    console.log('[useEffect] monthTestEligibility changed:', monthTestEligibility);
    if (monthTestEligibility && monthTestEligibility.unlocked_months) {
      console.log('[useEffect] Fetching status for unlocked months:', monthTestEligibility.unlocked_months.length);
      monthTestEligibility.unlocked_months.forEach(monthData => {
        // Only fetch if we haven't fetched this month yet
        if (!monthlyStatusFetched.has(monthData.month)) {
          console.log(`[useEffect] Fetching status for Month ${monthData.month}`);
          fetchMonthlyTestStatus(monthData.month);
          setMonthlyStatusFetched(prev => new Set([...prev, monthData.month]));
        } else {
          console.log(`[useEffect] Already fetched status for Month ${monthData.month}, skipping`);
        }
      });
    }
    
    // Cleanup timers on unmount
    return () => {
      console.log('[useEffect] Cleaning up monthly test timers on unmount');
      Object.values(monthlyTimersRef.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
      monthlyTimersRef.current = {};
      timerCompletedRef.current = {};
      // NOTE: Don't clear postAnalysisTimerRef here - it's managed by its own useEffect
    };
  }, [monthTestEligibility]);

  // Re-fetch current week info when user navigates to Weekly Test section
  useEffect(() => {
    if (activeSection === 'weeklytest') {
      fetchCurrentWeekInfo();
    }
  }, [activeSection]);

  // Modal UI for generation
  const AnalysisGeneratingModal = () => {
    if (!analysisGenerating) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className={`${themeClasses.cardBackground} rounded-xl p-10 w-11/12 max-w-2xl text-center shadow-xl border ${themeClasses.cardBorder}`}>
          <div className="mb-4">
            <div className={`w-20 h-20 rounded-full ${themeClasses.gradient} mx-auto flex items-center justify-center`}>
              <span className="text-2xl font-bold text-white">AI</span>
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.textPrimary}`}>Generating Your Test</h2>
          <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>Our AI is creating personalized questions based on your skills...</p>
          <div className="flex items-center justify-center mb-4">
            <svg className={`animate-pulse w-6 h-6 ${themeClasses.accent} mr-2`} viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="12" r="2" /></svg>
          </div>
          <p className={`text-xs ${themeClasses.textSecondary}`}>This may take a few moments...</p>
        </div>
      </div>
    );
  };

  // Weekly Test Generation Modal with Loading Facts
  // Smart Analysis AI Handler - Fetches existing data OR generates new analysis
  const handleSmartAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setSmartAnalysisData(null);
    setAnalysisResult(null);

    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const linkedResumeData = JSON.parse(localStorage.getItem('linkedResumeData') || '{}');
      
      // Try to get mobile or email
      const mobile = userData.mobile || linkedResumeData.mobile || '';
      const email = userData.email || linkedResumeData.email || '';
      
      if (!mobile && !email) {
        throw new Error('No mobile number or email found. Please ensure your profile is complete.');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (mobile) params.append('mobile', mobile);
      else if (email) params.append('email', email);

      // Call the backend API to check for existing analysis
      const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/student-analysis?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        // Existing analysis found! Display it
        console.log('Smart Analysis Data Received:', result.data);
        console.log('Missing Skills:', result.data.missing_skills);
        console.log('ATS Tips:', result.data.ats_tips);
        console.log('Project Suggestions:', result.data.project_suggestions);
        console.log('Company Suggestions:', result.data.company_suggestions);
        console.log('Company 1:', result.data.company_1_name, result.data.company_1_eligible);
        
        setSmartAnalysisData(result.data);
        setIsLoadingAnalysis(false);
      } else {
        // No existing analysis, generate new one
        console.log('No existing analysis found:', result.message || 'Unknown reason');
        console.log('Attempting to generate new analysis...');
        
        // Show a message that we're generating analysis
        setAnalysisError('No existing analysis found. Generating new analysis...');
        setIsLoadingAnalysis(false);
        
        // Try to generate new analysis
        await handleResumeAnalysis();
      }
    } catch (error) {
      console.error('Smart Analysis error:', error);
      setIsLoadingAnalysis(false);
      
      // Show user-friendly error
      setAnalysisError(error.message || 'Failed to fetch analysis. Please try uploading your resume first.');
    }
  };

  // Fetch Test Analysis Data
  const fetchTestAnalysisData = async () => {
    const mobile = (() => {
      const linkedData = localStorage.getItem('linkedResumeData');
      const userData = localStorage.getItem('userData');
      if (linkedData) {
        const parsed = JSON.parse(linkedData);
        return parsed.mobile || parsed.phoneNumber;
      }
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.mobile || parsed.phoneNumber;
      }
      return null;
    })();

    if (!mobile) {
      setTestAnalysisError('Mobile number not found. Please ensure your profile is complete.');
      return;
    }

    setLoadingTestAnalysis(true);
    setTestAnalysisError(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // Build variants for mobile number
      const clean = mobile.split('').filter(c => /\d/.test(c)).join('');
      const variants = [
        mobile,
        mobile.replace(/\s+/g, ''),
        mobile.replace(/\+/g, ''),
        clean
      ];
      if (clean.length === 10) {
        variants.push(`+91 ${clean}`);
        variants.push(`+91${clean}`);
      }

      // Remove duplicates
      const uniqueVariants = [...new Set(variants)];

      // Try each variant
      let data = null;
      for (const variant of uniqueVariants) {
        try {
          const url = `${backendUrl}/api/quiz-analysis/${encodeURIComponent(variant)}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              data = result.data;
              break;
            }
          }
        } catch (err) {
          console.error('Error fetching variant:', variant, err);
        }
      }

      if (data) {
        setTestAnalysisData(data);
        setShowTestAnalysis(true);
      } else {
        setTestAnalysisError('No test analysis found. Please take a skills test first.');
      }
    } catch (error) {
      console.error('Error fetching test analysis:', error);
      setTestAnalysisError(error.message || 'Failed to fetch test analysis data.');
    } finally {
      setLoadingTestAnalysis(false);
    }
  };

  // Fetch weekly test analysis data from database
  const fetchWeeklyTestAnalysisData = async () => {
    console.log('🔄 [Weekly Test Analysis] Function called');
    
    const mobile = (() => {
      const linkedData = localStorage.getItem('linkedResumeData');
      const userData = localStorage.getItem('userData');
      if (linkedData) {
        try {
          const parsed = JSON.parse(linkedData);
          return parsed.mobile || parsed.phoneNumber;
        } catch (e) {
          console.error('Error parsing linkedResumeData:', e);
        }
      }
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          return parsed.mobile || parsed.phoneNumber;
        } catch (e) {
          console.error('Error parsing userData:', e);
        }
      }
      return null;
    })();

    console.log('📱 [Weekly Test Analysis] Mobile number:', mobile);

    if (!mobile) {
      console.error('❌ [Weekly Test Analysis] No mobile number found');
      setWeeklyTestAnalysisError('Mobile number not found. Please ensure your profile is complete.');
      setShowWeeklyTestAnalysis(true);
      return;
    }

    setLoadingWeeklyTestAnalysis(true);
    setWeeklyTestAnalysisError(null);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const apiUrl = `${backendUrl}/api/weekly-test-analysis/${encodeURIComponent(mobile)}`;
      
      console.log('🌐 [Weekly Test Analysis] Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📥 [Weekly Test Analysis] Response status:', response.status);
      
      const result = await response.json();
      console.log('📊 [Weekly Test Analysis] Response data:', result);

      if (result.success) {
        console.log('✅ [Weekly Test Analysis] Success!');
        setWeeklyTestAnalysisData(result.data);
        setShowWeeklyTestAnalysis(true);
        
        // Also refresh month test eligibility when weekly test analysis is fetched
        fetchMonthTestEligibility();
      } else {
        console.error('❌ [Weekly Test Analysis] Failed:', result.message);
        setWeeklyTestAnalysisError(result.message || 'Failed to fetch weekly test analysis.');
        setShowWeeklyTestAnalysis(true);
      }
    } catch (error) {
      console.error('❌ [Weekly Test Analysis] Error:', error);
      setWeeklyTestAnalysisError(error.message || 'Failed to fetch weekly test analysis.');
      setShowWeeklyTestAnalysis(true);
    } finally {
      setLoadingWeeklyTestAnalysis(false);
    }
  };

  // Fetch certifications data
  const fetchCertificationsData = async () => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      console.log('No mobile number found for fetching certifications');
      setCertificationsError('Mobile number not found. Please log in again.');
      return;
    }

    setLoadingCertifications(true);
    setCertificationsError(null);
    
    try {
      console.log(`🎓 [Certifications] Fetching data for mobile: ${mobile}`);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/certifications/${mobile}`);
      const result = await response.json();

      if (result.success) {
        console.log('✅ [Certifications] Success!');
        setCertificationsData(result.data);
      } else {
        console.error('❌ [Certifications] Failed:', result.message);
        setCertificationsError(result.message || 'Failed to fetch certifications.');
      }
    } catch (error) {
      console.error('❌ [Certifications] Error:', error);
      setCertificationsError(error.message || 'Failed to fetch certifications.');
    } finally {
      setLoadingCertifications(false);
    }
  };

  // Fetch current week info for the Weekly Test section
  const fetchCurrentWeekInfo = async () => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      console.log('No mobile number found for fetching week info');
      return;
    }

    setLoadingWeekInfo(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/current-week-info/${encodeURIComponent(mobile)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentWeekInfo({
            week: result.data.week || 1,
            month: result.data.month || 1,
            testTitle: result.data.test_title || ''
          });
          console.log('✅ Current week info fetched:', result.data);
          
          // After fetching week info, check if test exists for this specific week
          await checkWeeklyTestGenerationForWeek(mobile, result.data.week, result.data.month);
        }
      }
    } catch (error) {
      console.error('Error fetching current week info:', error);
    } finally {
      setLoadingWeekInfo(false);
    }
  };

  // Check if weekly test has been generated for current user and specific week
  const checkWeeklyTestGenerationForWeek = async (mobile, week, month) => {
    if (!mobile || !week) {
      console.log('Mobile or week info missing for checking test generation');
      return;
    }

    console.log(`🔄 Checking test for Week ${week}, Month ${month}...`);
    
    setCheckingTestGeneration(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // STEP 1: Check if analysis exists for this week
      // If analysis exists, it means this week's cycle is complete
      console.log(`🔍 Checking if analysis exists for Week ${week}, Month ${month}...`);
      const analysisResponse = await fetch(`${backendUrl}/api/weekly-test-analysis/${mobile}`);
      const analysisData = await analysisResponse.json();
      
      let hasAnalysisForThisWeek = false;
      if (analysisData.success && analysisData.data && analysisData.data.months && Array.isArray(analysisData.data.months)) {
        for (const monthData of analysisData.data.months) {
          if (monthData.month === month && monthData.weeks && Array.isArray(monthData.weeks)) {
            for (const weekData of monthData.weeks) {
              if (weekData.week === week) {
                hasAnalysisForThisWeek = true;
                console.log(`✅ Analysis exists for Week ${week}, Month ${month}`);
                break;
              }
            }
          }
          if (hasAnalysisForThisWeek) break;
        }
      }
      
      // STEP 2: If analysis exists for this week, the cycle is complete
      // Check timer status before showing Generate button
      if (hasAnalysisForThisWeek) {
        console.log(`📝 Week ${week} analysis complete - checking post-analysis timer status`);
        setWeeklyTestGenerated(false); // Hide Start Test button
        setWeeklyTestHasAnalysis(false); // Hide Analysis button (analysis already done)
        setShowTimerModal(false);
        setTimerCompleted(false);
        
        // Record analysis completion for timer tracking (will only record once)
        try {
          await fetch(`${backendUrl}/api/record-analysis-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mobile: mobile,
              type: 'weekly',
              week: week,
              month: month
            })
          });
        } catch (recordErr) {
          console.error('Failed to record weekly analysis completion:', recordErr);
        }
        
        // Check timer status from backend
        try {
          const timerResponse = await fetch(`${backendUrl}/api/weekly-analysis-timer-status/${mobile}/${week}/${month}`);
          const timerData = await timerResponse.json();
          
          if (timerData.success && timerData.data) {
            const { timer_remaining, can_generate_next, next_action, is_month_end_week, timer_duration } = timerData.data;
            
            console.log(`⏱️ Timer status: remaining=${timer_remaining}s, can_generate=${can_generate_next}, next_action=${next_action}`);
            
            if (!can_generate_next && timer_remaining > 0) {
              // Timer is still active - show timer countdown
              // IMPORTANT: Only set remaining time if timer interval is NOT already running
              // This prevents refetch from resetting the countdown
              if (!postAnalysisTimerRef.current) {
                console.log(`⏳ Starting post-analysis timer: ${timer_remaining}s remaining`);
                setPostAnalysisTimerRemaining(timer_remaining);
                setPostAnalysisTimerDuration(timer_duration);
                setPostAnalysisNextAction(next_action);
                setPostAnalysisIsMonthEnd(is_month_end_week);
                setPostAnalysisIsRoadmapTimer(false); // Not a roadmap timer
                setPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
              } else {
                console.log(`⏳ Timer already running, skipping reset (ref exists)`);
              }
            } else {
              // Timer completed - can show Generate button
              console.log(`✅ Timer completed - showing ${next_action} button`);
              setPostAnalysisTimerActive(false);
              setPostAnalysisTimerRemaining(0);
              setPostAnalysisNextAction(next_action);
              setPostAnalysisIsMonthEnd(is_month_end_week);
            }
          }
        } catch (timerErr) {
          console.error('Error checking timer status:', timerErr);
          // If timer check fails, allow generation
          setPostAnalysisTimerActive(false);
        }
        
        setCheckingTestGeneration(false);
        
        // Update previous week tracking
        previousWeekRef.current = week;
        previousMonthRef.current = month;
        return;
      }
      
      // STEP 2.5-PREV: If analysis does NOT exist for current week,
      // check if PREVIOUS week's analysis exists and timer is still running
      // This handles the case where user just completed Week N analysis and moved to Week N+1
      if (!hasAnalysisForThisWeek && week > 1) {
        const prevWeek = week - 1;
        const prevMonth = month; // Assuming same month for simplicity (can be enhanced later)
        
        console.log(`🔍 Checking previous Week ${prevWeek} analysis timer status...`);
        
        // Check if previous week's analysis exists
        let hasPrevWeekAnalysis = false;
        if (analysisData.success && analysisData.data && analysisData.data.months && Array.isArray(analysisData.data.months)) {
          for (const monthData of analysisData.data.months) {
            if (monthData.month === prevMonth && monthData.weeks && Array.isArray(monthData.weeks)) {
              for (const weekData of monthData.weeks) {
                if (weekData.week === prevWeek) {
                  hasPrevWeekAnalysis = true;
                  console.log(`✅ Previous Week ${prevWeek} analysis exists`);
                  break;
                }
              }
            }
            if (hasPrevWeekAnalysis) break;
          }
        }
        
        if (hasPrevWeekAnalysis) {
          // Check timer status for previous week's analysis
          try {
            const timerResponse = await fetch(`${backendUrl}/api/weekly-analysis-timer-status/${mobile}/${prevWeek}/${prevMonth}`);
            const timerData = await timerResponse.json();
            
            if (timerData.success && timerData.data) {
              const { timer_remaining, can_generate_next, next_action, is_month_end_week, timer_duration } = timerData.data;
              
              console.log(`⏱️ Previous week timer status: remaining=${timer_remaining}s, can_generate=${can_generate_next}`);
              
              if (!can_generate_next && timer_remaining > 0) {
                // Timer is still active - show timer countdown and block Generation
                if (!postAnalysisTimerRef.current) {
                  console.log(`⏳ Starting previous week post-analysis timer: ${timer_remaining}s remaining`);
                  setPostAnalysisTimerRemaining(timer_remaining);
                  setPostAnalysisTimerDuration(timer_duration);
                  setPostAnalysisNextAction(next_action);
                  setPostAnalysisIsMonthEnd(is_month_end_week);
                  setPostAnalysisIsRoadmapTimer(false);
                  setPostAnalysisTimerActive(true);
                  
                  // Reset other states
                  setWeeklyTestGenerated(false);
                  setWeeklyTestHasAnalysis(false);
                  setShowTimerModal(false);
                  setTimerCompleted(false);
                  setCheckingTestGeneration(false);
                  return;
                }
              }
              // If timer completed, continue to check if test exists
            }
          } catch (timerErr) {
            console.error('Error checking previous week timer status:', timerErr);
          }
        }
      }
      
      // STEP 2.5A-ROADMAP: For Week 1, Month 1 - check if roadmap timer is still active
      // This is the very first week, so there's no previous week analysis - timer starts after roadmap generation
      if (week === 1 && month === 1) {
        console.log(`📅 Week 1, Month 1 - Checking roadmap timer status...`);
        
        try {
          // First record roadmap completion (will only record once)
          await fetch(`${backendUrl}/api/record-roadmap-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: mobile })
          });
          
          const roadmapTimerResponse = await fetch(`${backendUrl}/api/roadmap-timer-status/${mobile}`);
          const roadmapTimerData = await roadmapTimerResponse.json();
          
          console.log(`⏱️ Roadmap timer status:`, roadmapTimerData);
          
          if (roadmapTimerData.success && roadmapTimerData.data) {
            const { timer_remaining, can_generate_test, roadmap_exists, timer_duration } = roadmapTimerData.data;
            
            if (roadmap_exists && !can_generate_test && timer_remaining > 0) {
              // IMPORTANT: Only start timer if not already running
              if (!postAnalysisTimerRef.current) {
                console.log(`⏳ Starting roadmap post-generation timer: ${timer_remaining}s remaining`);
                setPostAnalysisTimerRemaining(timer_remaining);
                setPostAnalysisTimerDuration(timer_duration);
                setPostAnalysisNextAction('generate_weekly_test');
                setPostAnalysisIsMonthEnd(false);
                setPostAnalysisIsRoadmapTimer(true); // This is a roadmap timer
                setPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
              } else {
                console.log(`⏳ Roadmap timer already running, skipping reset`);
              }
              
              setCheckingTestGeneration(false);
              previousWeekRef.current = week;
              previousMonthRef.current = month;
              return;
            }
          }
        } catch (roadmapTimerErr) {
          console.error('Error checking roadmap timer status:', roadmapTimerErr);
        }
      }
      
      // STEP 2.5A: No analysis for current week - check if PREVIOUS week's timer is still active
      // This handles the case where user refreshes after completing previous week's analysis
      const prevWeek = week - 1;
      const prevMonth = prevWeek < 1 ? month - 1 : month;
      const actualPrevWeek = prevWeek < 1 ? 4 : prevWeek; // Week 0 means week 4 of previous month
      
      if (prevWeek >= 1 || prevMonth >= 1) {
        console.log(`📅 No analysis for Week ${week}. Checking previous week ${actualPrevWeek} (Month ${prevMonth}) timer...`);
        
        try {
          const prevTimerResponse = await fetch(`${backendUrl}/api/weekly-analysis-timer-status/${mobile}/${actualPrevWeek}/${prevMonth}`);
          const prevTimerData = await prevTimerResponse.json();
          
          console.log(`⏱️ Previous week timer status:`, prevTimerData);
          
          if (prevTimerData.success && prevTimerData.data) {
            const { timer_remaining, can_generate_next, analysis_exists, next_action, is_month_end_week, timer_duration } = prevTimerData.data;
            
            if (analysis_exists && !can_generate_next && timer_remaining > 0) {
              // IMPORTANT: Only start timer if not already running
              if (!postAnalysisTimerRef.current) {
                console.log(`⏳ Starting previous week's post-analysis timer: ${timer_remaining}s remaining`);
                setPostAnalysisTimerRemaining(timer_remaining);
                setPostAnalysisTimerDuration(timer_duration);
                setPostAnalysisNextAction(next_action);
                setPostAnalysisIsMonthEnd(is_month_end_week);
                setPostAnalysisIsRoadmapTimer(false); // Not a roadmap timer
                setPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
              } else {
                console.log(`⏳ Previous week timer already running, skipping reset`);
              }
              
              setCheckingTestGeneration(false);
              previousWeekRef.current = week;
              previousMonthRef.current = month;
              return;
            }
          }
        } catch (prevTimerErr) {
          console.error('Error checking previous week timer status:', prevTimerErr);
        }
      }
      
      // STEP 2.5B: If this is the first week of a new month (week 5, 9, 13, etc.),
      // check if monthly analysis timer from previous month is still active
      const weekInMonth = ((week - 1) % 4) + 1; // 1, 2, 3, or 4
      const previousMonth = month - 1;
      
      if (weekInMonth === 1 && previousMonth >= 1) {
        console.log(`📅 Week ${week} is first week of Month ${month}. Checking previous month's monthly analysis timer...`);
        
        try {
          const monthlyTimerResponse = await fetch(`${backendUrl}/api/monthly-analysis-timer-status/${mobile}/${previousMonth}`);
          const monthlyTimerData = await monthlyTimerResponse.json();
          
          console.log(`⏱️ Monthly analysis timer status for Month ${previousMonth}:`, monthlyTimerData);
          
          if (monthlyTimerData.success && monthlyTimerData.data) {
            const { timer_remaining, can_generate_next, analysis_exists } = monthlyTimerData.data;
            
            if (analysis_exists && !can_generate_next && timer_remaining > 0) {
              // IMPORTANT: Only start timer if not already running
              if (!monthlyPostAnalysisTimerRef.current) {
                console.log(`⏳ Starting monthly post-analysis timer: ${timer_remaining}s remaining`);
                
                // Set timer state - useEffect will start the interval
                setMonthlyPostAnalysisTimerRemaining(timer_remaining);
                setMonthlyPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
              } else {
                console.log(`⏳ Monthly timer already running, skipping reset`);
              }
              
              // Still need to continue checking if test exists, so don't return here
              // but block the Generate button via monthlyPostAnalysisTimerActive
            }
          }
        } catch (monthlyTimerErr) {
          console.error('Error checking monthly analysis timer status:', monthlyTimerErr);
        }
      }
      
      // STEP 3: Check if test result exists (test was submitted/completed)
      console.log(`🔍 Checking if test result exists for Week ${week}, Month ${month}...`);
      try {
        const resultResponse = await fetch(`${backendUrl}/api/weekly-test-result/${mobile}`);
        const resultData = await resultResponse.json();
        
        console.log('📥 Test result API response:', resultData);
        
        // API returns 'data' field, not 'result'
        const result = resultData.data || resultData.result;
        
        if (resultData.success && result) {
          // Check if this specific week/month has results
          console.log(`📊 Found test result: Week ${result.week}, Month ${result.month}`);
          console.log(`📊 Looking for: Week ${week}, Month ${month}`);
          console.log(`📊 Match: ${result.week === week && result.month === month}`);
          
          if (result.week === week && result.month === month) {
            console.log(`✅✅✅ TEST RESULT MATCH! Setting weeklyTestHasAnalysis = true`);
            setWeeklyTestGenerated(false); // Hide test button - test is completed
            setWeeklyTestHasAnalysis(true); // Show analysis button only
            setShowTimerModal(false);
            setTimerCompleted(true);
            setCheckingTestGeneration(false);
            
            previousWeekRef.current = week;
            previousMonthRef.current = month;
            return;
          } else {
            console.log(`⚠️ Week/month mismatch - result is for Week ${result.week}, Month ${result.month} but we need Week ${week}, Month ${month}`);
          }
        } else {
          console.log(`❌ No test result found or API returned failure:`, resultData);
        }
      } catch (resultErr) {
        console.error('❌ Error checking test result:', resultErr);
      }
      
      // STEP 4: No analysis or result exists - check if test exists for this specific week
      console.log(`📝 No analysis/result found - checking if test exists for Week ${week}...`);
      
      // Reset states first since we're checking fresh
      // BUT don't reset showTimerModal if it's already showing (timer is running)
      setWeeklyTestGenerated(false);
      setWeeklyTestHasAnalysis(false);
      // Don't reset timer modal - let the timer continue if it's already running
      // setShowTimerModal(false);
      // setTimerCompleted(false);
      
      const response = await fetch(`${backendUrl}/api/check-weekly-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile,
          week,
          month
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.exists) {
          // Test exists for this specific week - show Start Test button
          console.log(`✅ Test exists for Week ${week}, Month ${month}`);
          
          setWeeklyTestGenerated(true);
          
          // Only skip timer if it's not currently running
          // If timer is already showing, let it continue
          if (!showTimerModal) {
            setTimerCompleted(true); // Assume timer has passed if test already exists
            // Don't show timer since we're loading an existing test
          }
          // If showTimerModal is true, the timer is running - don't interrupt it
          
          // Now check if test was COMPLETED by looking for test result
          console.log(`🔍 Checking if test was completed (has result)...`);
          try {
            const resultCheckResponse = await fetch(`${backendUrl}/api/weekly-test-result/${mobile}`);
            const resultCheckData = await resultCheckResponse.json();
            
            console.log(`📥 Weekly test result API response:`, resultCheckData);
            
            // API returns { success: true, data: {...} } - check for 'data' field
            if (resultCheckData.success && (resultCheckData.data || resultCheckData.result)) {
              const resultData = resultCheckData.data || resultCheckData.result;
              console.log(`📊 Found test result: Week ${resultData.week}, Month ${resultData.month}`);
              
              // Check if result matches current week/month
              if (resultData.week === week && resultData.month === month) {
                console.log(`✅ Test COMPLETED for Week ${week}, Month ${month} - showing Analysis button ONLY`);
                setWeeklyTestGenerated(false); // Hide Start Test button (no retake)
                setWeeklyTestHasAnalysis(true); // Show Analysis button
              } else {
                console.log(`📝 Result exists but for different week (${resultData.week}/${resultData.month}) - showing Start Test`);
                setWeeklyTestHasAnalysis(false);
              }
            } else {
              console.log(`📝 No test result found - test not completed yet, showing Start Test button`);
              setWeeklyTestHasAnalysis(false);
            }
          } catch (resultErr) {
            console.log(`📝 Error checking result, assuming not completed:`, resultErr);
            setWeeklyTestHasAnalysis(false);
          }
          
        } else {
          console.log(`📝 No test exists yet for Week ${week}, Month ${month}`);
          setWeeklyTestGenerated(false);
          setWeeklyTestHasAnalysis(false);
        }
      } else {
        console.log(`📝 Error checking test, assuming no test exists`);
        setWeeklyTestGenerated(false);
        setWeeklyTestHasAnalysis(false);
      }
      
      // Update previous week tracking
      previousWeekRef.current = week;
      previousMonthRef.current = month;
      
    } catch (error) {
      console.error('Error checking weekly test generation:', error);
      setWeeklyTestGenerated(false);
      setShowTimerModal(false);
      setTimerCompleted(false);
    } finally {
      setCheckingTestGeneration(false);
    }
  };

  // Check if weekly test has been generated for current user (legacy function)
  const checkWeeklyTestGeneration = async () => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      console.log('No mobile number found for checking test generation');
      return;
    }

    // Use current week info if available
    if (currentWeekInfo.week) {
      await checkWeeklyTestGenerationForWeek(mobile, currentWeekInfo.week, currentWeekInfo.month);
    }
  };

  // Helper function to check if weekly test section should be shown
  // Returns false if user has completed 4 weeks but monthly test analysis is not done
  // Also returns false when it's time to generate monthly test (after week 4/8/12 timer completes)
  const shouldShowWeeklyTestSection = () => {
    // Hide weekly test section when monthly test should be generated
    // This happens after week 4/8/12/etc. analysis timer completes
    if (postAnalysisIsMonthEnd && postAnalysisNextAction === 'generate_monthly_test') {
      console.log('🚫 Hiding weekly test section - Monthly test should be generated');
      return false;
    }
    
    // Also hide when post-analysis timer is active for month-end week
    if (postAnalysisTimerActive && postAnalysisIsMonthEnd) {
      console.log('🚫 Hiding weekly test section - Month-end timer active');
      return false;
    }
    
    if (!currentWeekInfo || !monthTestEligibility) {
      return true; // Show by default if data not loaded
    }

    const currentWeek = currentWeekInfo.week;
    const currentMonth = currentWeekInfo.month;
    
    // Check if user is at a multiple of 4 weeks (end of month cycle)
    // Week 4, 8, 12, etc. means 4 weeks completed
    if (currentWeek > 1 && (currentWeek - 1) % 4 === 0) {
      // User has completed a 4-week cycle
      // Check if they have completed the monthly analysis
      const completedMonthNumber = Math.floor((currentWeek - 1) / 4);
      
      // Check if this month's analysis is completed (not just test passed)
      const hasMonthlyAnalysis = monthTestEligibility.unlocked_months?.some(
        m => m.month === completedMonthNumber && m.test_passed && m.analysis_completed
      );
      
      if (!hasMonthlyAnalysis) {
        // Monthly test analysis not completed, hide weekly test section
        console.log(`🚫 Hiding weekly test section - Month ${completedMonthNumber} analysis pending`);
        return false;
      }
    }
    
    return true; // Show weekly test section
  };

  // Fetch month test eligibility (check which months are unlocked)
  const fetchMonthTestEligibility = async () => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      console.log('No mobile number found for fetching month eligibility');
      return;
    }

    setLoadingMonthEligibility(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/check-month-test-eligibility/${encodeURIComponent(mobile)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMonthTestEligibility(result.data);
          console.log('✅ Month test eligibility fetched:', result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching month test eligibility:', error);
    } finally {
      setLoadingMonthEligibility(false);
    }
  };

  // Handle Monthly Test - Trigger Monthly Test Webhook
  const handleMonthlyTest = async (monthNumber) => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      alert('Mobile number not found. Please complete your profile first.');
      return;
    }

    setGeneratingMonthlyTest(true);
    setMonthlyTimerMonth(monthNumber);

    try {
      console.log(`📅 Triggering monthly test webhook for Month ${monthNumber}, mobile:`, mobile);

      // Get backend URL
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // Call the N8N webhook (production URL)
      const monthlyTestWebhook = 'https://n8n23-80hw.onrender.com/webhook/Monthly_test';
      
      const response = await fetch(monthlyTestWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          month: monthNumber,
          test_number: 1,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Monthly test webhook triggered successfully:', result);
        
        // Reset post-analysis states since monthly test is now being generated
        setPostAnalysisIsMonthEnd(false);
        setPostAnalysisNextAction('generate_weekly_test');
        
        // Wait 15 seconds before starting to check (like weekly test)
        console.log('⏳ Waiting 15 seconds before checking for test...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Start polling to check if test is generated in MongoDB
        let pollCount = 0;
        const maxPolls = 60; // Poll for up to 2 minutes (60 * 2 seconds)
        
        monthlyTestPollRef.current = setInterval(async () => {
          pollCount++;
          
          try {
            // Check if test exists in monthly_test collection
            const checkResponse = await fetch(`${backendUrl}/api/monthly-test-status/${encodeURIComponent(mobile)}/${monthNumber}`);
            const checkData = await checkResponse.json();
            
            console.log(`[Monthly Test Poll ${pollCount}] Status:`, checkData);
            
            if (checkData.success && checkData.data?.test_generated) {
              // Test found in database
              clearInterval(monthlyTestPollRef.current);
              monthlyTestPollRef.current = null;
              setGeneratingMonthlyTest(false);
              
              // Update the monthly test status
              setMonthlyTestStatus(prev => ({
                ...prev,
                [monthNumber]: {
                  ...checkData.data,
                  // Override to show our local timer instead of backend timer
                  can_start_test: false,
                  timer_remaining: 300 // 5 minutes
                }
              }));
              
              console.log('✅ Monthly test generated! Opening 5-minute timer...');
              // Start the 5-minute timer automatically
              setShowMonthlyTimerModal(true);
              setMonthlyTimerCompleted(false);
            } else if (pollCount >= maxPolls) {
              // Timeout
              clearInterval(monthlyTestPollRef.current);
              monthlyTestPollRef.current = null;
              setGeneratingMonthlyTest(false);
              alert('Monthly test generation is taking longer than expected. Please check back later.');
            }
          } catch (pollErr) {
            console.error('Error checking monthly test status:', pollErr);
          }
        }, 2000); // Check every 2 seconds
        
      } else {
        console.error('❌ Monthly test webhook failed:', response.status);
        setGeneratingMonthlyTest(false);
        alert('Failed to trigger monthly test. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error triggering monthly test webhook:', error);
      setGeneratingMonthlyTest(false);
      alert('Error triggering monthly test. Please check your connection and try again.');
    }
  };

  // Fetch monthly test status for a specific month
  const fetchMonthlyTestStatus = async (monthNumber) => {
    const mobile = getUserMobile();
    
    if (!mobile) return;

    try {
      console.log(`[fetchMonthlyTestStatus] Fetching status for month ${monthNumber}, mobile: ${mobile}`);
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/monthly-test-status/${mobile}/${monthNumber}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[fetchMonthlyTestStatus] Response:`, result);
        
        if (result.success) {
          console.log(`[fetchMonthlyTestStatus] Test generated: ${result.data.test_generated}, Timer: ${result.data.timer_remaining}s`);
          
          // If timer has already completed locally, don't override with backend data
          if (timerCompletedRef.current[monthNumber]) {
            console.log(`[fetchMonthlyTestStatus] Timer already completed locally, keeping can_start_test=true`);
            setMonthlyTestStatus(prev => ({
              ...prev,
              [monthNumber]: {
                ...result.data,
                timer_remaining: 0,
                can_start_test: true
              }
            }));
          } else {
            setMonthlyTestStatus(prev => ({
              ...prev,
              [monthNumber]: result.data
            }));
          }
          
          // Start timer only if: timer active, no timer running, AND timer hasn't completed
          if (result.data.timer_remaining > 0 && !result.data.can_start_test && !monthlyTimersRef.current[monthNumber] && !timerCompletedRef.current[monthNumber]) {
            console.log(`[fetchMonthlyTestStatus] Starting timer for ${result.data.timer_remaining} seconds`);
            startMonthlyTestTimer(monthNumber);
          } else if (monthlyTimersRef.current[monthNumber] && result.data.timer_remaining <= 0) {
            // Clear timer if it exists but backend says timer is done
            console.log(`[fetchMonthlyTestStatus] Timer should be stopped, clearing interval`);
            const intervalId = monthlyTimersRef.current[monthNumber];
            clearInterval(intervalId);
            delete monthlyTimersRef.current[monthNumber];
            timerCompletedRef.current[monthNumber] = true;
            setMonthlyTestTimers(prev => {
              const newTimers = {...prev};
              delete newTimers[monthNumber];
              return newTimers;
            });
          }
        }
      } else {
        console.error(`[fetchMonthlyTestStatus] HTTP error: ${response.status}`);
      }
    } catch (error) {
      console.error(`[fetchMonthlyTestStatus] Error:`, error);
    }
  };

  // Start countdown timer for monthly test
  const startMonthlyTestTimer = (monthNumber) => {
    // Prevent creating duplicate timers using ref
    if (monthlyTimersRef.current[monthNumber]) {
      console.log(`[startMonthlyTestTimer] Timer already running for Month ${monthNumber}, skipping`);
      return;
    }

    // Prevent restarting timer that has already completed
    if (timerCompletedRef.current[monthNumber]) {
      console.log(`[startMonthlyTestTimer] Timer already completed for Month ${monthNumber}, not restarting`);
      return;
    }

    console.log(`[startMonthlyTestTimer] Starting timer for Month ${monthNumber}`);

    const intervalId = setInterval(() => {
      setMonthlyTestStatus(prev => {
        const currentStatus = prev[monthNumber];
        
        // Stop if no status or timer finished
        if (!currentStatus || currentStatus.timer_remaining <= 1) {
          console.log(`[startMonthlyTestTimer] Timer ended for Month ${monthNumber}`);
          clearInterval(intervalId);
          
          // Mark timer as completed to prevent restart
          timerCompletedRef.current[monthNumber] = true;
          
          // Remove from ref tracking
          delete monthlyTimersRef.current[monthNumber];
          
          // Remove from state tracking
          setMonthlyTestTimers(timers => {
            const newTimers = {...timers};
            delete newTimers[monthNumber];
            return newTimers;
          });
          
          // DON'T refresh status - we already know timer is done
          // Frontend state is the source of truth after timer completes
          console.log(`[startMonthlyTestTimer] Timer complete, user can now start test`);
          
          // Return final state with timer at 0
          return {
            ...prev,
            [monthNumber]: {
              ...currentStatus,
              timer_remaining: 0,
              can_start_test: true
            }
          };
        }

        // Decrement timer
        return {
          ...prev,
          [monthNumber]: {
            ...currentStatus,
            timer_remaining: currentStatus.timer_remaining - 1,
            can_start_test: false
          }
        };
      });
    }, 1000);

    // Store interval ID in ref immediately (synchronous)
    monthlyTimersRef.current[monthNumber] = intervalId;
    
    // Also store in state
    setMonthlyTestTimers(prev => ({
      ...prev,
      [monthNumber]: intervalId
    }));
  };

  // Format timer display (MM:SS)
  const formatTimerDisplay = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Start Monthly Test - Navigate to monthly test page
  const handleStartMonthlyTest = async (monthNumber) => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      alert('Mobile number not found. Please complete your profile first.');
      return;
    }

    try {
      console.log(`📱 Starting monthly test for Month ${monthNumber}, mobile:`, mobile);
      
      // Navigate to monthly test page with month info
      navigate('/monthly-test', { state: { month: monthNumber } });
      
    } catch (error) {
      console.error('❌ Error starting monthly test:', error);
      alert('Error starting monthly test. Please try again.');
    }
  };

  // Listen for startMonthlyRetakeTest event from MonthlyRetakeButton
  useEffect(() => {
    const handleStartRetakeTest = (event) => {
      if (event.detail && event.detail.month) {
        console.log(`🔄 Starting monthly retake test for Month ${event.detail.month}`);
        handleStartMonthlyTest(event.detail.month);
      }
    };

    window.addEventListener('startMonthlyRetakeTest', handleStartRetakeTest);
    return () => {
      window.removeEventListener('startMonthlyRetakeTest', handleStartRetakeTest);
    };
  }, [navigate]);

  // Handle Monthly Test Analysis - Check DB first, then trigger webhook if needed
  const handleMonthlyAnalysis = async (monthNumber) => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      alert('Mobile number not found. Please complete your profile first.');
      return;
    }

    try {
      console.log(`📊 Starting Monthly Test Analysis flow for Month ${monthNumber}, mobile:`, mobile);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // STEP 1: Check if analysis already exists
      console.log(`🔍 Step 1: Checking for existing Month ${monthNumber} analysis...`);
      setProgressTrackingMessage(`Checking for Month ${monthNumber} analysis...`);
      setRedirectingToProgressTracking(true);
      
      const checkResponse = await fetch(`${backendUrl}/api/monthly-analysis/${mobile}/${monthNumber}`);
      
      if (checkResponse.ok) {
        const existingAnalysis = await checkResponse.json();
        if (existingAnalysis && existingAnalysis._id) {
          console.log(`✅ Analysis found! ID: ${existingAnalysis._id}`);
          setProgressTrackingMessage(`Month ${monthNumber} Analysis Found! Redirecting...`);
          
          // Record analysis completion for timer tracking (will only record once)
          try {
            await fetch(`${backendUrl}/api/record-analysis-completion`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mobile: mobile,
                type: 'monthly',
                month: monthNumber
              })
            });
          } catch (recordErr) {
            console.error('Failed to record analysis completion:', recordErr);
          }
          
          // Check timer status from backend for existing analysis
          try {
            const timerResponse = await fetch(`${backendUrl}/api/monthly-analysis-timer-status/${mobile}/${monthNumber}`);
            const timerData = await timerResponse.json();
            console.log('⏱️ Monthly analysis timer status:', timerData);
            
            if (timerData.success && timerData.data) {
              const { timer_remaining, can_generate_next } = timerData.data;
              
              if (!can_generate_next && timer_remaining > 0) {
                // IMPORTANT: Only start timer if not already running
                if (!monthlyPostAnalysisTimerRef.current) {
                  console.log(`⏳ Starting monthly post-analysis timer: ${timer_remaining}s remaining`);
                  
                  // Set timer state - useEffect will start the interval
                  setMonthlyPostAnalysisTimerRemaining(timer_remaining);
                  setMonthlyPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
                } else {
                  console.log(`⏳ Monthly timer already running, skipping reset`);
                }
              }
            }
          } catch (timerError) {
            console.error('Error checking monthly timer status:', timerError);
          }
          
          // Wait a moment for user to see the message
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Redirect to progress section
          setActiveSection('progress');
          
          // Wait for section to render, then expand and scroll to monthly analysis
          setTimeout(() => {
            setShowMonthlyTestAnalysis(true);
            
            // Fetch the data
            fetchMonthlyAnalysisData();
            
            // Refetch month eligibility to update analysis_completed flag
            fetchMonthTestEligibility();
            
            // Refetch current week info to advance to next month's first week
            fetchCurrentWeekInfo();
            
            setTimeout(() => {
              const element = document.getElementById('monthly-test-analysis-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              // Close overlay after scroll
              setTimeout(() => {
                setRedirectingToProgressTracking(false);
                setProgressTrackingMessage('');
              }, 500);
            }, 400);
          }, 500);
          
          return;
        }
      }
      
      // STEP 2: No existing analysis - trigger webhook
      console.log(`⚙️ Step 2: No analysis found. Generating new analysis for Month ${monthNumber}...`);
      
      // Extract test_number from the 404 response if available
      let testAttempt = 1;
      if (checkResponse.status === 404) {
        const errorData = await checkResponse.json().catch(() => ({}));
        if (errorData.testAttempt) {
          testAttempt = errorData.testAttempt;
          console.log(`📝 Using test attempt number: ${testAttempt}`);
        }
      }
      
      setProgressTrackingMessage(`Generating Month ${monthNumber} Analysis (Attempt ${testAttempt})... This may take 30-60 seconds.`);

      const monthlyAnalysisWebhook = 'https://n8n23-80hw.onrender.com/webhook/monthly_analysis';
      
      const payload = {
        mobile: mobile,
        month: monthNumber,
        test_number: testAttempt,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending payload to webhook:', payload);
      
      const response = await fetch(monthlyAnalysisWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      console.log('📥 Webhook response status:', response.status);
      
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        console.log('✅ Monthly analysis webhook triggered successfully', result);
        
        // Record analysis completion for timer tracking
        try {
          await fetch(`${backendUrl}/api/record-analysis-completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mobile: mobile,
              type: 'monthly',
              month: monthNumber
            })
          });
          console.log('✅ Recorded monthly analysis completion for timer');
        } catch (recordErr) {
          console.error('Failed to record analysis completion:', recordErr);
        }
        
        // STEP 3: Check if user PASSED the monthly test (≥50%)
        setProgressTrackingMessage(`Checking Month ${monthNumber} test results...`);
        let testPassed = true; // Default to true for safety
        let scorePercentage = 0;
        let testAttempt = 1;
        
        try {
          const resultResponse = await fetch(`${backendUrl}/api/monthly-test-result/${encodeURIComponent(mobile)}/${monthNumber}`);
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            if (resultData.success && resultData.data) {
              testPassed = resultData.data.passed;
              scorePercentage = resultData.data.scorePercentage;
              testAttempt = resultData.data.testAttempt;
              console.log(`📊 Monthly test result: passed=${testPassed}, score=${scorePercentage}%, attempt=${testAttempt}`);
            }
          }
        } catch (resultErr) {
          console.error('Error checking monthly test result:', resultErr);
          // Continue with default (passed = true) to not block on error
        }
        
        // STEP 4: Handle based on pass/fail
        if (!testPassed) {
          // User FAILED (<50%) - Show retake UI
          console.log(`❌ Monthly test FAILED with ${scorePercentage}% - showing retake option`);
          setProgressTrackingMessage(`You scored ${scorePercentage.toFixed(1)}%. Need 50% to proceed.`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Set retake states
          setMonthlyTestFailed(true);
          setMonthlyTestFailedMonth(monthNumber);
          setMonthlyTestFailedScore(scorePercentage);
          setMonthlyTestRetakeAttempt(testAttempt);
          
          // Still redirect to progress to show analysis (so user can learn from mistakes)
          setActiveSection('progress');
          
          setTimeout(() => {
            setShowMonthlyTestAnalysis(true);
            fetchMonthlyAnalysisData();
            fetchMonthTestEligibility();
            // DON'T fetch current week info - keep user on same month
            // DON'T start post-analysis timer - user needs to retake
            
            setTimeout(() => {
              const element = document.getElementById('monthly-test-analysis-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              setTimeout(() => {
                setRedirectingToProgressTracking(false);
                setProgressTrackingMessage('');
              }, 500);
            }, 400);
          }, 500);
          
        } else {
          // User PASSED (≥50%) - Continue with normal flow
          console.log(`✅ Monthly test PASSED with ${scorePercentage}% - proceeding to next month`);
          
          // Clear any previous failed state
          setMonthlyTestFailed(false);
          setMonthlyTestFailedMonth(null);
          setMonthlyTestFailedScore(0);
          
          setProgressTrackingMessage(`Month ${monthNumber} Analysis Generated! Redirecting...`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          
          // Redirect to progress section
          setActiveSection('progress');
          
          // Wait for section to render, then expand and scroll
          setTimeout(() => {
            setShowMonthlyTestAnalysis(true);
            
            // Fetch the data
            fetchMonthlyAnalysisData();
            
            // Refetch month eligibility to update analysis_completed flag
            fetchMonthTestEligibility();
            
            // Refetch current week info to advance to next month's first week
            fetchCurrentWeekInfo();
            
            // Start the 5-minute post-monthly-analysis timer before generating next week test
            // IMPORTANT: Only start if not already running
            if (!monthlyPostAnalysisTimerRef.current) {
              console.log(`⏱️ Starting 5-minute post-monthly-analysis timer for next week test generation`);
              setMonthlyPostAnalysisTimerRemaining(300); // 5 minutes
              setMonthlyPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
            } else {
              console.log(`⏱️ Monthly timer already running, skipping new timer start`);
            }
            
            setTimeout(() => {
            const element = document.getElementById('monthly-test-analysis-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Close overlay after scroll
            setTimeout(() => {
              setRedirectingToProgressTracking(false);
              setProgressTrackingMessage('');
            }, 500);
          }, 400);
        }, 500);
        }
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Failed to trigger monthly analysis webhook:', response.status, errorText);
        setRedirectingToProgressTracking(false);
        setProgressTrackingMessage('');
        alert(`Failed to generate analysis. Status: ${response.status}. Please try again.`);
      }
    } catch (error) {
      console.error('❌ Error in monthly analysis flow:', error);
      console.error('Error details:', error.message, error.stack);
      setRedirectingToProgressTracking(false);
      setProgressTrackingMessage('');
      alert(`Error: ${error.message}. Please try again.`);
    }
  };

  // Fetch Monthly Analysis Data
  const fetchMonthlyAnalysisData = async () => {
    try {
      const mobile = getUserMobile();
      if (!mobile) {
        setMonthlyTestAnalysisError('Mobile number not found');
        return;
      }

      setLoadingMonthlyTestAnalysis(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/monthly-analysis/${mobile}`);
      
      if (response.ok) {
        const data = await response.json();
        setMonthlyTestAnalysisData(data);
        setMonthlyTestAnalysisError(null);
      } else {
        setMonthlyTestAnalysisError('No monthly analysis data found');
        setMonthlyTestAnalysisData(null);
      }
    } catch (error) {
      console.error('Error fetching monthly analysis:', error);
      setMonthlyTestAnalysisError('Failed to load analysis data');
      setMonthlyTestAnalysisData(null);
    } finally {
      setLoadingMonthlyTestAnalysis(false);
    }
  };

  // Handle Take Test - Trigger Weekly Test Webhook
  const handleTakeTest = async () => {
    const mobile = getUserMobile();
    
    if (!mobile) {
      alert('Mobile number not found. Please complete your profile first.');
      return;
    }

    try {
      // Show full-screen overlay
      setShowWeeklyTestOverlay(true);
      setWeeklyTestMessage('Triggering test generation...');

      console.log('?? Triggering weekly test webhook for mobile:', mobile);

      // Call backend API to trigger N8N webhook
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/trigger-weekly-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('? Webhook triggered successfully:', result);
        setWeeklyTestMessage('Our AI is creating personalized questions...');
        
        // Start polling for test in week_test collection
        let attempts = 0;
        const maxAttempts = 45; // 45 attempts * 2 seconds = 90 seconds
        
        const pollForTest = async () => {
          try {
            const checkResponse = await fetch(`${backendUrl}/api/get-test-questions/${encodeURIComponent(mobile)}`);
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              if (checkData.success && checkData.data && checkData.data.questions && checkData.data.questions.length > 0) {
                console.log('? Test found! Redirecting to test page...');
                setWeeklyTestMessage('Test ready! Loading...');
                
                // Wait a moment then navigate
                setTimeout(() => {
                  setShowWeeklyTestOverlay(false);
                  setWeeklyTestMessage(null);
                  navigate('/skills-test');
                }, 1000);
                return true;
              }
            }
          } catch (err) {
            console.log('Poll attempt failed:', err);
          }
          return false;
        };
        
        // Try immediately first
        const foundImmediately = await pollForTest();
        
        if (!foundImmediately) {
          // Poll every 3 seconds (increased from 2s for better performance)
          const pollInterval = setInterval(async () => {
            attempts++;
            
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setWeeklyTestMessage('Test generation is taking too long. Please try again.');
              setTimeout(() => {
                setShowWeeklyTestOverlay(false);
                setWeeklyTestMessage(null);
              }, 3000);
              return;
            }
            
            const found = await pollForTest();
            if (found) {
              clearInterval(pollInterval);
            }
          }, 2000);
        }
      } else {
        // Show specific error messages
        let errorMsg = result.error || 'Failed to trigger test webhook';
        if (result.n8n_status >= 400) {
          errorMsg = 'N8N workflow error. Please check the workflow configuration.';
        } else if (errorMsg.includes('timeout')) {
          errorMsg = 'N8N service timeout. Service may be down. Please check N8N.';
        } else if (errorMsg.includes('connect') || errorMsg.includes('Cannot connect')) {
          errorMsg = 'Cannot connect to N8N. Please check if N8N service is running.';
        }
        
        console.error('? N8N Error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('? Error triggering test webhook:', error);
      let displayError = error.message || 'Failed to start test. Please try again.';
      
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        displayError = 'Network error. Cannot reach backend server.';
      }
      
      setWeeklyTestMessage(`? ${displayError}`);
      
      // Keep error message visible longer
      setTimeout(() => {
        setShowWeeklyTestOverlay(false);
        setWeeklyTestMessage(null);
      }, 5000);
    }
  };

  // Generate Skills Test by calling n8n webhook
  const generateSkillsTest = async (testType = 'quick') => {
    setIsGeneratingTest(true);
    setTestError(null);

    try {
      // Get user's selected skills
      const getSelectedSkills = () => {
        const linkedData = localStorage.getItem('linkedResumeData');
        const predictionData = localStorage.getItem('predictionFormData');
        
        if (linkedData) {
          const parsed = JSON.parse(linkedData);
          return parsed.jobSelection?.selectedSkills || [];
        }
        if (predictionData) {
          const parsed = JSON.parse(predictionData);
          return parsed.selectedSkills || [];
        }
        return [];
      };

      const mobile = getUserMobile();
      const selectedSkills = getSelectedSkills();

      if (!mobile) {
        throw new Error('Mobile number not found. Please complete your profile first.');
      }

      if (selectedSkills.length === 0) {
        throw new Error('No skills selected. Please select skills in the prediction form first.');
      }

      console.log('🎯 Generating test for:', mobile);
      console.log('📝 Skills:', selectedSkills);
      console.log('📊 Test Type:', testType);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

      // STEP 1: Check if test already exists in database (quiz_test collection)
      console.log('🔍 Checking if test exists in database...');
      const checkResponse = await fetch(`${backendUrl}/api/check-quiz-test/${encodeURIComponent(mobile)}`);
      
      if (!checkResponse.ok) {
        console.warn('⚠️ Could not check database, proceeding with generation');
      } else {
        const checkData = await checkResponse.json();
        if (checkData.exists) {
          console.log('✅ Test already exists in database, navigating to test page');
          setTestAvailable(true);
          setIsGeneratingTest(false);
          navigate('/skills-test');
          return;
        }
        console.log('❌ No test found in database, triggering webhook to generate new test');
      }

      // STEP 2: If test doesn't exist, trigger webhook to generate new test
      console.log('📤 Calling backend to trigger test generation');
      
      const response = await fetch(`${backendUrl}/api/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          skills: selectedSkills,
          testType: testType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('? Backend response:', result);

      if (result.success) {
        console.log('? Test generated successfully:', result.data);
        setTestAvailable(true);
        setIsGeneratingTest(false);
        
        // Navigate to test page immediately (will show loading while n8n generates questions)
        navigate('/skills-test');
      } else {
        throw new Error(result.error || 'Failed to generate test');
      }

    } catch (error) {
      console.error('? Test generation error:', error);
      setTestError(error.message || 'Failed to generate test. Please try again.');
      setIsGeneratingTest(false);
    }
  };

  // Handle Weekly Test - Check week_test collection
  const handleWeeklyTest = async () => {
    // First show the timer modal
    setShowTimerModal(true);
  };

  // New function to actually start the test after timer completes
  const startWeeklyTestAfterTimer = async () => {
    setWeeklyTestLoading(true);
    setWeeklyTestMessage(null);

    try {
      const mobile = getUserMobile();

      if (!mobile) {
        throw new Error('Mobile number not found. Please complete your profile first.');
      }

      console.log('📱 Loading weekly test for:', mobile);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/weekly-test-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Weekly test response:', result);

      if (result.success) {
        console.log('✅ Weekly test loaded successfully');
        setWeeklyTestLoading(false);
        
        // Navigate to weekly-test page to display the weekly test
        navigate('/weekly-test');
      } else {
        throw new Error(result.message || result.error || 'Failed to load weekly test');
      }

    } catch (error) {
      console.error('❌ Weekly test error:', error);
      setWeeklyTestMessage(error.message || 'Failed to load weekly test. Please try again.');
      setWeeklyTestLoading(false);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setWeeklyTestMessage(null);
      }, 5000);
    }
  };


  // Navigation items
  const navItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" /></svg>
    },
    { 
      id: 'resume', 
      label: 'Resume Analysis', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
    },
    { 
      id: 'skilltest', 
      label: 'Skills Test', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    { 
      id: 'roadmap', 
      label: 'Career Roadmap', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    },
    { 
      id: 'weeklytest', 
      label: 'Weekly Test', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    { 
      id: 'projects', 
      label: 'Project Submission', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-4l-2-2H5a2 2 0 00-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10v6m-3-3h6" /></svg>
    },
    { 
      id: 'progress', 
      label: 'Progress Tracking', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    },
    { 
      id: 'certifications', 
      label: 'Certifications', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
    }
  ];

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} flex items-center justify-center px-4`}>
        <div className="max-w-md w-full">
          <div className={`${themeClasses.cardBackground} rounded-3xl shadow-xl p-8 text-center border ${themeClasses.cardBorder}`}>
            <div className={`mx-auto w-20 h-20 ${themeClasses.gradient} rounded-full flex items-center justify-center mb-6`}>
              <svg className={`w-10 h-10 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>Access Your Dashboard</h2>
            <p className={`${themeClasses.textSecondary} mb-8 leading-relaxed`}>
              Please sign in to access your personalized dashboard with resume analysis, career roadmap, and placement insights.
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/auth-selection" 
                className={`w-full ${themeClasses.buttonPrimary} font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In / Register
              </Link>
              
              <Link 
                to="/" 
                className={`w-full ${themeClasses.buttonSecondary} font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} transition-colors duration-300 relative overflow-hidden`}>
      {/* Decorative Background Elements - Tech Circuit Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Decorative gradient orbs - theme aware */}
        <div className={`hidden dark:block absolute top-0 left-1/4 w-[600px] h-[600px] ${themeClasses.gradient} opacity-20 rounded-full blur-3xl`}></div>
        <div className={`hidden dark:block absolute bottom-0 right-1/4 w-[500px] h-[500px] ${themeClasses.gradient} opacity-15 rounded-full blur-3xl`}></div>
        <div className={`hidden dark:block absolute top-1/2 right-0 w-[400px] h-[400px] ${themeClasses.gradient} opacity-10 rounded-full blur-3xl`}></div>
        
        {/* Circuit lines - Light mode uses amber, Dark mode uses neon gradients */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.15] dark:opacity-[0.4]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Light mode gradient */}
            <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            {/* Dark mode neon gradient */}
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6b9d" />
              <stop offset="40%" stopColor="#f7931a" />
              <stop offset="70%" stopColor="#ff6b9d" />
              <stop offset="100%" stopColor="#9d4edd" />
            </linearGradient>
            {/* Neon glow filter */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Horizontal lines with nodes */}
          <path className="dark:hidden" d="M0 100 H300 Q320 100 320 120 V200 Q320 220 340 220 H500" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" />
          <path className="hidden dark:block" d="M0 100 H300 Q320 100 320 120 V200 Q320 220 340 220 H500" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="300" cy="100" r="4" fill="#f59e0b" />
          <circle className="hidden dark:block" cx="300" cy="100" r="5" fill="#ff6b9d" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="500" cy="220" r="4" fill="#d97706" />
          <circle className="hidden dark:block" cx="500" cy="220" r="5" fill="#f7931a" filter="url(#neonGlow)" />
          
          <path className="dark:hidden" d="M0 300 H150 Q170 300 170 280 V180 Q170 160 190 160 H400 Q420 160 420 180 V300" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" />
          <path className="hidden dark:block" d="M0 300 H150 Q170 300 170 280 V180 Q170 160 190 160 H400 Q420 160 420 180 V300" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="150" cy="300" r="4" fill="#f59e0b" />
          <circle className="hidden dark:block" cx="150" cy="300" r="5" fill="#9d4edd" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="400" cy="160" r="4" fill="#d97706" />
          <circle className="hidden dark:block" cx="400" cy="160" r="5" fill="#ff6b9d" filter="url(#neonGlow)" />
          
          {/* Right side circuits */}
          <path className="dark:hidden" d="M1200 150 H900 Q880 150 880 170 V250 Q880 270 860 270 H700" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" />
          <path className="hidden dark:block" d="M1200 150 H900 Q880 150 880 170 V250 Q880 270 860 270 H700" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="900" cy="150" r="4" fill="#f59e0b" />
          <circle className="hidden dark:block" cx="900" cy="150" r="5" fill="#f7931a" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="700" cy="270" r="4" fill="#d97706" />
          <circle className="hidden dark:block" cx="700" cy="270" r="5" fill="#ff6b9d" filter="url(#neonGlow)" />
          
          <path className="dark:hidden" d="M1200 400 H1000 Q980 400 980 420 V500" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" />
          <path className="hidden dark:block" d="M1200 400 H1000 Q980 400 980 420 V500" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="1000" cy="400" r="4" fill="#f59e0b" />
          <circle className="hidden dark:block" cx="1000" cy="400" r="5" fill="#9d4edd" filter="url(#neonGlow)" />
          
          {/* Diagonal arrows */}
          <path className="dark:hidden" d="M600 50 L750 200" stroke="url(#circuitGradient)" strokeWidth="3" fill="none" opacity="0.3" />
          <path className="hidden dark:block" d="M600 50 L750 200" stroke="url(#neonGradient)" strokeWidth="3" fill="none" opacity="0.6" filter="url(#neonGlow)" />
          <polygon className="dark:hidden" points="750,200 740,185 755,190" fill="#d97706" opacity="0.5" />
          <polygon className="hidden dark:block" points="750,200 740,185 755,190" fill="#ff6b9d" opacity="0.8" />
          
          <path className="dark:hidden" d="M800 100 L950 250" stroke="url(#circuitGradient)" strokeWidth="3" fill="none" opacity="0.3" />
          <path className="hidden dark:block" d="M800 100 L950 250" stroke="url(#neonGradient)" strokeWidth="3" fill="none" opacity="0.6" filter="url(#neonGlow)" />
          <polygon className="dark:hidden" points="950,250 940,235 955,240" fill="#f59e0b" opacity="0.5" />
          <polygon className="hidden dark:block" points="950,250 940,235 955,240" fill="#f7931a" opacity="0.8" />
          
          {/* Bottom circuits */}
          <path className="dark:hidden" d="M100 700 H350 Q370 700 370 680 V600" stroke="url(#circuitGradient)" strokeWidth="2" fill="none" />
          <path className="hidden dark:block" d="M100 700 H350 Q370 700 370 680 V600" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="dark:hidden" cx="350" cy="700" r="4" fill="#f59e0b" />
          <circle className="hidden dark:block" cx="350" cy="700" r="5" fill="#ff6b9d" filter="url(#neonGlow)" />
          
          {/* Additional neon lines for dark mode */}
          <path className="hidden dark:block" d="M0 500 H200 Q220 500 220 480 V400" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="hidden dark:block" cx="220" cy="400" r="5" fill="#9d4edd" filter="url(#neonGlow)" />
          
          <path className="hidden dark:block" d="M1200 600 H1050 Q1030 600 1030 580 V500 Q1030 480 1010 480 H900" stroke="url(#neonGradient)" strokeWidth="2" fill="none" filter="url(#neonGlow)" />
          <circle className="hidden dark:block" cx="900" cy="480" r="5" fill="#f7931a" filter="url(#neonGlow)" />
        </svg>
        
        {/* Floating geometric shapes - Light mode */}
        <div className={`dark:hidden absolute top-20 left-10 w-32 h-32 ${themeClasses.gradient} opacity-20 rounded-3xl transform rotate-12 blur-sm`}></div>
        <div className={`dark:hidden absolute top-40 right-20 w-24 h-24 ${themeClasses.gradient} opacity-20 rounded-2xl transform -rotate-12 blur-sm`}></div>
        <div className={`dark:hidden absolute bottom-40 left-1/4 w-40 h-40 ${themeClasses.gradient} opacity-10 rounded-full blur-md`}></div>
        
        {/* Floating geometric shapes - Dark mode neon */}
        <div className={`hidden dark:block absolute top-20 left-10 w-32 h-32 ${themeClasses.gradient} opacity-10 rounded-3xl transform rotate-12 blur-sm`}></div>
        <div className={`hidden dark:block absolute top-40 right-20 w-24 h-24 ${themeClasses.gradient} opacity-10 rounded-2xl transform -rotate-12 blur-sm`}></div>
        <div className={`hidden dark:block absolute bottom-40 left-1/4 w-40 h-40 ${themeClasses.gradient} opacity-10 rounded-full blur-md`}></div>
      </div>

      {/* Header */}
      <div 
        ref={navbarRef}
        data-navbar
        className={`relative ${themeClasses.cardBackground} backdrop-blur-md shadow-lg border-b ${themeClasses.border} sticky top-0 z-30 transition-all duration-300 ease-in-out`}
      >
        {/* Neon border glow for dark mode */}
        <div className={`hidden dark:block absolute bottom-0 left-0 right-0 h-[2px] ${themeClasses.gradient}`}></div>
        <div className={`hidden dark:block absolute bottom-0 left-0 right-0 h-[2px] ${themeClasses.gradient} blur-sm`}></div>
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
        {/* Diamond pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%2030%20L30%200%20L60%2030%20L30%2060%20Z%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22/%3E%3C/svg%3E')] opacity-50 dark:opacity-20"></div>
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 ${themeClasses.accent} rounded-2xl flex items-center justify-center shadow-lg border ${themeClasses.border}`}>
                <span className={`${themeClasses.textPrimary} font-bold text-xl`}>{name.charAt(0)}</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.textPrimary} drop-shadow-sm`}>Welcome back, {name.split(' ')[0]}!</h1>
                <p className={themeClasses.textSecondary}>Let's continue your placement journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogout}
                className={`flex items-center space-x-2 px-4 py-2 ${themeClasses.textSecondary} ${themeClasses.hover} rounded-lg transition-all duration-200 backdrop-blur-sm`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className={`lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 ${themeClasses.gradient} rounded-full shadow-2xl flex items-center justify-center backdrop-blur-sm`}
            style={{
              transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.3s ease',
              transform: isMobileSidebarOpen ? 'rotate(180deg) scale(1.05)' : 'rotate(0deg) scale(1)'
            }}
            aria-label="Toggle sidebar"
          >
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                transition: 'transform 0.3s ease'
              }}
            >
              {isMobileSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Vertical Navigation Sidebar - Wrapper maintains layout space */}
          <aside className="w-full lg:w-72 flex-shrink-0" aria-label="Dashboard navigation">
            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
              <div 
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
                style={{
                  animation: 'fadeIn 0.3s ease-out forwards'
                }}
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}
            
            <div 
              ref={sidebarRef}
              className={`${themeClasses.cardBackground} backdrop-blur-2xl p-4 rounded-3xl shadow-2xl border ${themeClasses.border} 
                ${
                  sidebarFixed 
                    ? 'lg:fixed lg:w-72 overflow-y-auto sidebar-scrollbar' 
                    : sidebarAbsolute 
                    ? 'lg:absolute lg:bottom-8 lg:w-72' 
                    : 'lg:relative'
                }
                ${isMobileSidebarOpen ? 'fixed inset-y-4 left-4 right-4 z-50 overflow-y-auto sidebar-scrollbar' : 'hidden lg:block'}
              `}
              style={{
                transition: isScrolling ? 'none' : 'top 0.15s ease-out, transform 0.15s ease-out',
                ...(sidebarFixed ? { 
                  top: `${sidebarTopOffset}px`,
                  maxHeight: `calc(100vh - ${sidebarTopOffset}px - 20px)`,
                  willChange: 'top, transform',
                  transform: 'translateZ(0)' // Enable GPU acceleration
                } : {})
              }}
            >
              {/* Navigation Header */}
              <div className={`mb-3 pb-2.5 border-b ${themeClasses.cardBorder} flex items-center justify-between`}>
                <h3 className={`text-xs font-bold ${themeClasses.accent} uppercase tracking-wider`}>Navigation</h3>
                {/* Mobile close button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                  aria-label="Close sidebar"
                >
                  <svg className={`w-5 h-5 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col space-y-1.5" role="navigation" aria-label="Main navigation">
                {navItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileSidebarOpen(false); // Close mobile sidebar on selection
                    }}
                    style={{ transitionDelay: `${index * 25}ms` }}
                    className={`relative flex items-center space-x-3 px-3.5 py-3 rounded-2xl font-medium text-sm w-full text-left overflow-hidden group transition-all duration-300 ease-out ${
                      activeSection === item.id
                        ? `${themeClasses.textPrimary} shadow-lg scale-[1.02]`
                        : `${themeClasses.textSecondary} ${themeClasses.hover} hover:scale-[1.01]`
                    }`}
                    aria-current={activeSection === item.id ? 'page' : undefined}
                  >
                    {/* Animated background */}
                    <span 
                      className={`absolute inset-0 rounded-2xl transition-all duration-500 ease-out ${
                        activeSection === item.id 
                          ? `${themeClasses.gradient} opacity-100` 
                          : `${themeClasses.gradient} opacity-0`
                      }`}
                    />
                    {/* Icon container */}
                    <span className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-500 ${
                      activeSection === item.id 
                        ? 'bg-white/20' 
                        : `${themeClasses.sectionBackground}`
                    }`}>
                      {item.icon}
                    </span>
                    <div className="relative z-10 flex flex-col flex-1">
                      <span className="font-semibold">{item.label}</span>
                      <span className={`text-xs transition-all duration-300 ${
                        activeSection === item.id 
                          ? `${themeClasses.textSecondary} opacity-90`
                          : themeClasses.textSecondary
                      }`}>
                        {item.id === 'overview' && 'Dashboard home'}
                        {item.id === 'resume' && 'Analyze resume'}
                        {item.id === 'skilltest' && 'Initial assessment'}
                        {item.id === 'roadmap' && 'Career path'}
                        {item.id === 'weeklytest' && 'Weekly tests'}
                        {item.id === 'progress' && 'Track growth'}
                      </span>
                    </div>
                    {/* Right arrow indicator */}
                    <span 
                      className={`relative z-10 transition-all duration-500 ${
                        activeSection === item.id 
                          ? 'opacity-100' 
                          : 'opacity-0'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ))}
              </nav>
              
              {/* User Profile Section - Dark Mode Style */}
              <div className={`mt-3 pt-3 border-t ${themeClasses.cardBorder}`}>
                <div className="flex items-center space-x-2.5 px-2.5 py-1.5">
                  <div className={`w-9 h-9 rounded-full ${themeClasses.gradient} flex items-center justify-center ${themeClasses.textPrimary} font-bold text-xs shadow-md`}>
                    {name.charAt(0)}{name.split(' ')[1]?.charAt(0) || ''}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{name}</span>
                    <span className={`text-xs ${themeClasses.accent}`}>Pro Member</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main ref={contentRef} className="flex-1 min-w-0 w-full lg:w-auto">
            <div key={activeSection} className="space-y-6 animate-fadeIn">
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className={`relative ${themeClasses.gradient} rounded-3xl p-8 overflow-hidden shadow-xl border ${themeClasses.border}`}>
                    {/* Neon border glow for dark mode */}
                    <div className={`absolute inset-0 rounded-3xl border-2 border-transparent ${themeClasses.gradient} opacity-20`}></div>
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 rounded-3xl opacity-[0.12] dark:opacity-[0.05]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
                    {/* Dot pattern overlay */}
                    <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,107,157,0.1)_1px,transparent_0)] bg-[size:16px_16px]"></div>
                    {/* Decorative elements */}
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2`}></div>
                    <div className={`absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2`}></div>
                    <div className={`absolute top-1/2 right-1/4 w-20 h-20 border-2 ${themeClasses.cardBorder} rounded-lg transform rotate-45`}></div>
                    {/* Subtle diagonal lines */}
                    <div className="absolute inset-0 rounded-3xl bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_11px)]"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h2 className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>{name}, your dashboard is ready</h2>
                    <p className={`text-lg ${themeClasses.textSecondary}`}>Keep going, your placement journey is on track</p>
                  </div>
                  <div className="hidden md:block">
                    <div className={`w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-lg border ${themeClasses.cardBorder}`}>
                      <svg className={`w-14 h-14 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 relative z-10">
                  <Link 
                    to="/feedback" 
                    className={`inline-flex items-center px-6 py-3 ${themeClasses.buttonSecondary} backdrop-blur-sm ${themeClasses.textPrimary} font-semibold rounded-xl transition-all duration-200 border ${themeClasses.cardBorder} shadow-md hover:shadow-lg`}
                  >
                    Give Feedback
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ATS Score */}
                <div className={`group ${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${themeClasses.cardBorder}`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>ATS Score</h3>
                  </div>
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-bold ${typeof atsScore === 'number' ? themeClasses.accent : themeClasses.textSecondary}`}>
                      {typeof atsScore === 'number' ? `${atsScore}%` : atsScore}
                    </span>
                  </div>
                  <p className={`${themeClasses.textSecondary} text-sm mt-2`}>Resume compatibility score</p>
                  {atsScore === 'N/A' && (
                    <Link to="/ats-score" className={`text-xs ${themeClasses.accent} underline mt-2 inline-block font-medium ${themeClasses.hover}`}>
                      Calculate ATS Score ?
                    </Link>
                  )}
                </div>

                {/* Career Path Progress */}
                <div className={`group ${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${themeClasses.cardBorder}`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Career Path Progress</h3>
                  </div>
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-bold ${themeClasses.accent}`}>{careerProgress}%</span>
                  </div>
                  <p className={`${themeClasses.textSecondary} text-sm mt-2`}>Profile completion milestones</p>
                  <Link to="/profile" className={`text-xs ${themeClasses.accent} underline mt-2 inline-block font-medium ${themeClasses.hover}`}>
                    Complete Profile ?
                  </Link>
                </div>

                {/* Placement Readiness */}
                <div className={`group ${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border ${themeClasses.cardBorder}`}>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Placement Readiness</h3>
                  </div>
                  <div className="flex items-baseline">
                    <span className={`text-4xl font-bold ${themeClasses.accent}`}>{placementScore}%</span>
                  </div>
                  <p className={`${themeClasses.textSecondary} text-sm mt-2`}>Overall placement probability</p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recommended Actions */}
                <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder}`}>
                  <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6`}>Recommended Next Steps</h3>
                  <p className={`${themeClasses.textSecondary} mb-6`}>Small actions to boost your profile this week</p>
                  
                  <div className="space-y-4">
                    <div className={`flex items-start space-x-3 p-3 rounded-xl ${themeClasses.cardHover} border ${themeClasses.border}`}>
                      <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full mt-1.5 shadow-sm`}></div>
                      <div>
                        <p className={`${themeClasses.textPrimary} font-medium`}>Complete 1 coding challenge on arrays and strings</p>
                        <p className={`${themeClasses.textSecondary} text-sm`}>Strengthen your DSA fundamentals</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start space-x-3 p-3 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                      <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full mt-1.5 shadow-sm`}></div>
                      <div>
                        <p className={`${themeClasses.textPrimary} font-medium`}>Refactor your top project README with clear bullet points</p>
                        <p className={`${themeClasses.textSecondary} text-sm`}>Make your projects more presentable</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start space-x-3 p-3 rounded-xl ${themeClasses.cardHover} border ${themeClasses.border}`}>
                      <div className={`w-3 h-3 ${themeClasses.gradient} rounded-full mt-1.5 shadow-sm`}></div>
                      <div>
                        <p className={`${themeClasses.textPrimary} font-medium`}>Add 2 quantifiable achievements to your resume</p>
                        <p className={`${themeClasses.textSecondary} text-sm`}>Show impact with numbers and metrics</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder}`}>
                  <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6`}>Weekly Progress</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`${themeClasses.textPrimary} font-medium`}>Skills mastered</span>
                        <span className={`${themeClasses.accent} font-semibold`}>28%</span>
                      </div>
                      <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3 overflow-hidden`}>
                        <div className={`${themeClasses.gradient} h-3 rounded-full shadow-sm`} style={{width: '28%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`${themeClasses.textPrimary} font-medium`}>Courses completed</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">30%</span>
                      </div>
                      <div className="w-full bg-green-100 dark:bg-[#352d45] rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-sm" style={{width: '30%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`${themeClasses.textPrimary} font-medium`}>Projects completed</span>
                        <span className={`${themeClasses.accent} font-semibold`}>45%</span>
                      </div>
                      <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3 overflow-hidden`}>
                        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full shadow-sm" style={{width: '45%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Test Analysis Report Button */}
                  <div className={`mt-6 pt-6 border-t ${themeClasses.cardBorder}`}>
                    <button
                      onClick={() => {
                        const mobile = (() => {
                          const linkedData = localStorage.getItem('linkedResumeData');
                          const userData = localStorage.getItem('userData');
                          if (linkedData) {
                            const parsed = JSON.parse(linkedData);
                            return parsed.mobile || parsed.phoneNumber;
                          }
                          if (userData) {
                            const parsed = JSON.parse(userData);
                            return parsed.mobile || parsed.phoneNumber;
                          }
                          return null;
                        })();

                        if (!mobile) {
                          alert('Mobile number not found. Please ensure your profile is complete.');
                          return;
                        }

                        navigate('/test-analysis');
                      }}
                      className={`w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl ${themeClasses.buttonPrimary} shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-amber-300`}
                      title="View your Test Analysis Report from quiz_analysis"
                    >
                      <svg className={`w-5 h-5 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3a2 2 0 002 2h12zM7 16v1a2 2 0 002 2h6a2 2 0 002-2v-1" />
                      </svg>
                      <span>Test Analysis Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume Analysis Section */}
          {activeSection === 'resume' && (
            <div className="space-y-8">
              {/* Header */}
              <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 ${themeClasses.cardBorder}`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>Resume Analysis & Feedback</h2>
                    <p className={`${themeClasses.textSecondary} mt-2`}>Comprehensive analysis of your resume's compatibility with Applicant Tracking Systems</p>
                  </div>
                  <div className={`w-20 h-20 ${themeClasses.gradient} rounded-3xl flex items-center justify-center shadow-lg`}>
                    <svg className={`w-10 h-10 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Job Role Skills Section - Separate */}
              {console.log('Job Selection Check:', linkedResume?.jobSelection?.selectedSkills) && linkedResume?.jobSelection?.selectedSkills && (
                <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                      <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Job Role Skills</h3>
                      <p className={themeClasses.textSecondary}>Skills you possess for the selected job role</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className={`${themeClasses.cardHover} rounded-xl p-4 border ${themeClasses.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className={`font-semibold ${themeClasses.textPrimary}`}>Skills Selected for Job Application</h4>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            {linkedResume.jobSelection.jobDomain && linkedResume.jobSelection.jobRole 
                              ? `${linkedResume.jobSelection.jobDomain} - ${linkedResume.jobSelection.jobRole}`
                              : 'Job Role Skills'
                            }
                          </p>
                        </div>
                        <div className={`${themeClasses.badgeBackground} ${themeClasses.badgeText} text-sm font-semibold px-3 py-1 rounded-full`}>
                          {linkedResume.jobSelection.selectedSkills.length} Skills
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {linkedResume.jobSelection.selectedSkills.map((skill, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${themeClasses.badgeBackground} ${themeClasses.badgeText} border ${themeClasses.cardBorder}`}
                          >
                            <svg className={`w-3 h-3 mr-1.5 ${themeClasses.accent}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      {linkedResume.jobSelection.updatedAt && (
                        <div className={`mt-3 text-xs ${themeClasses.accent}`}>
                          Last updated: {new Date(linkedResume.jobSelection.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comprehensive Resume Details */}
              {linkedResume && (
                <>
                  {/* Row 1: Personal Information | Education & Certifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Personal Information Card */}
                    <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                        <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Personal Information</h3>
                        <p className={themeClasses.textSecondary}>Contact & Identity</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {linkedResume.name && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${themeClasses.sectionBackground}`}>
                          <svg className={`w-5 h-5 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Full Name</p>
                            <p className={`${themeClasses.textPrimary} font-semibold`}>{linkedResume.name}</p>
                          </div>
                        </div>
                      )}
                      
                      {linkedResume.email && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${themeClasses.sectionBackground}`}>
                          <svg className={`w-5 h-5 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <div>
                            <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Email Address</p>
                            <p className={`${themeClasses.textPrimary} font-semibold`}>{linkedResume.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {linkedResume.mobile && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${themeClasses.sectionBackground}`}>
                          <svg className={`w-5 h-5 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div>
                            <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Mobile Number</p>
                            <p className={`${themeClasses.textPrimary} font-semibold`}>{linkedResume.mobile}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                    {/* Education & Certifications */}
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 shadow-sm border ${themeClasses.cardBorder} hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                          <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Education & Certifications</h3>
                          <p className={themeClasses.textSecondary}>Academic Background</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(linkedResume.tenthPercentage || linkedResume.twelfthPercentage || linkedResume.collegeCGPA || linkedResume.degree) ? (
                          <div className="space-y-3">
                            <button
                              onClick={() => setShowEducation(!showEducation)}
                              className={`w-full font-semibold ${themeClasses.textPrimary} flex items-center justify-between gap-2 hover:opacity-80 transition-opacity`}
                            >
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                                <span>Education</span>
                              </div>
                              <svg
                                className={`w-5 h-5 transition-transform duration-200 ${showEducation ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            <div className={`transition-all duration-300 ${!showEducation ? 'max-h-24 overflow-hidden' : ''}`}>
                              <div className={`space-y-3 ${!showEducation ? 'blur-[1.5px] opacity-75 pointer-events-none' : ''}`}>
                            {/* College/University */}
                            {(linkedResume.degree || linkedResume.collegeCGPA > 0 || linkedResume.cgpa > 0) && (
                              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-yellow-900 dark:text-yellow-300">
                                      {linkedResume.degree || 'Bachelor\'s Degree'}
                                    </p>
                                    {linkedResume.college && (
                                      <p className="text-sm text-yellow-700 dark:text-yellow-400">{linkedResume.college}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1">
                                      {(linkedResume.collegeCGPA > 0 || linkedResume.cgpa > 0) && (
                                        <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          CGPA: {linkedResume.collegeCGPA || linkedResume.cgpa}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* 12th Standard */}
                            {linkedResume.twelfthPercentage > 0 && (
                              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-yellow-900 dark:text-yellow-300">12th Standard</p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Higher Secondary Education</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        Percentage: {linkedResume.twelfthPercentage}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* 10th Standard */}
                            {linkedResume.tenthPercentage > 0 && (
                              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-yellow-900 dark:text-yellow-300">10th Standard</p>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Secondary Education</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        Percentage: {linkedResume.tenthPercentage}%
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className={`${themeClasses.textSecondary} text-sm`}>No education details detected</p>
                          </div>
                        )}

                        {(() => {
                          const certs = parseCertifications(linkedResume.certifications);
                          return certs.length > 0 && (
                            <div>
                              <button
                                onClick={() => setShowCertifications(!showCertifications)}
                                className={`w-full font-semibold ${themeClasses.textPrimary} mb-3 flex items-center justify-between gap-2 hover:opacity-80 transition-opacity`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>Certifications ({certs.length})</span>
                                </div>
                                <svg
                                  className={`w-5 h-5 transition-transform duration-200 ${showCertifications ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <div className={`transition-all duration-300 ${!showCertifications ? 'max-h-24 overflow-hidden' : ''}`}>
                                <div className={`space-y-2 ${!showCertifications ? 'blur-[1.5px] opacity-75 pointer-events-none' : ''}`}>
                                  {certs.map((cert, index) => (
                                    <div key={index} className={`p-2 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                                      <p className={`text-sm font-medium ${themeClasses.textPrimary}`}>{typeof cert === 'object' ? (cert.name || cert.title) : cert}</p>
                                      {typeof cert === 'object' && cert.issuer && <p className={`text-xs ${themeClasses.textSecondary}`}>by {cert.issuer}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Skills & Expertise | Skills You Can Develop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Skills & Expertise Card */}
                    <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Skills & Expertise</h3>
                          <p className="text-gray-600 dark:text-gray-400">Technical Competencies</p>
                        </div>
                      </div>
                      
                      {loadingSkillRatings ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-pink-500 mb-4"></div>
                          <p className="text-gray-500 dark:text-gray-400">Loading skills...</p>
                        </div>
                      ) : jobRoleRelevantSkills && jobRoleRelevantSkills.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Skills Relevant to Job Role</span>
                            <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-sm font-semibold px-3 py-1 rounded-full">
                              {jobRoleRelevantSkills.length}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                            {jobRoleRelevantSkills.map((skill, index) => {
                              // Get star count for this skill from skillRatings
                              const skillData = skillRatings?.skillRatings?.[skill];
                              const stars = skillData?.stars || 0;
                              const avgPercentage = skillData?.averagePercentage || 0;
                              const weeksTested = skillData?.weeksTested || 0;
                              
                              return (
                              <div
                                key={index}
                                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-50 to-orange-50 dark:from-pink-500/10 dark:to-purple-500/10 text-amber-800 dark:text-pink-300 border border-amber-200 dark:border-pink-500/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-pink-500/20 dark:hover:to-purple-500/20 transition-colors duration-200"
                                title={stars > 0 ? `${avgPercentage}% average across ${weeksTested} test${weeksTested > 1 ? 's' : ''}` : 'Complete weekly tests to earn stars'}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-3 h-3 flex-shrink-0 text-amber-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span>{skill}</span>
                                </div>
                                {/* Display stars with percentage - show empty stars if tested but <50% */}
                                {weeksTested > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-0.5">
                                      {[...Array(3)].map((_, i) => (
                                        <svg key={i} className={`w-3 h-3 ${i < stars ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </span>
                                    <span className="text-xs font-semibold">{avgPercentage}%</span>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="mx-auto w-12 h-12 text-gray-400 dark:text-tech-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400">No skills detected in resume</p>
                        </div>
                      )}
                    </div>

                  {/* Skills You Can Develop Card */}
                  <div className={`${themeClasses.cardBackground} rounded-2xl p-6 shadow-sm border ${themeClasses.cardBorder} hover:shadow-md transition-all duration-200`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                        <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Skills You Can Develop</h3>
                        <p className="text-gray-600 dark:text-gray-400">Recommended Skills</p>
                      </div>
                    </div>
                    
                    {loadingSkillRatings ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 dark:border-yellow-500 mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading skills...</p>
                      </div>
                    ) : unselectedSkills.length > 0 ? (
                      <div className="space-y-4">
                        {/* Info Banner */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 mb-4">
                          <div className="flex gap-2">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="text-sm">
                              <p className="font-medium text-amber-800 dark:text-amber-300">
                                Complete Weekly Tests to Master These Skills
                              </p>
                              <p className="text-amber-600 dark:text-amber-400 mt-1">
                                These skills will move to "Skills & Expertise" once you complete their curriculum weeks. Keep testing to unlock them!
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Skills Gap</span>
                          <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-pink-300 text-sm font-semibold px-3 py-1 rounded-full">
                            {unselectedSkills.length}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                          {unselectedSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-pink-500/10 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/40 dark:hover:to-amber-900/40 transition-colors duration-200"
                            >
                              <svg className="w-3 h-3 mr-1.5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto w-12 h-12 text-green-400 dark:text-green-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400">All skills covered or no job role selected!</p>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Row 3: Experience & Projects | Resume Statistics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Experience & Projects Card */}
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 shadow-sm border ${themeClasses.cardBorder} hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                          <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Experience & Projects</h3>
                          <p className={themeClasses.textSecondary}>Professional Background</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {linkedResume.experience && linkedResume.experience.length > 0 ? (
                          <div>
                            <h4 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                              <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              Work Experience ({linkedResume.experience.length})
                            </h4>
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                              {linkedResume.experience.map((exp, index) => (
                                <div key={index} className={`p-3 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                                  <p className={`font-medium ${themeClasses.textPrimary}`}>{exp.title || exp.position || 'Position'}</p>
                                  <p className={`text-sm ${themeClasses.textSecondary}`}>{exp.company || 'Company'}</p>
                                  {exp.duration && <p className={`text-xs ${themeClasses.accent}`}>{exp.duration}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className={`${themeClasses.textSecondary} text-sm`}>No work experience detected</p>
                          </div>
                        )}

                        {linkedResume.projects && linkedResume.projects.length > 0 ? (
                          <div>
                            <button
                              onClick={() => setShowProjects(!showProjects)}
                              className={`w-full font-semibold ${themeClasses.textPrimary} mb-3 flex items-center justify-between gap-2 hover:opacity-80 transition-opacity`}
                            >
                              <div className="flex items-center gap-2">
                                <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                <span>Projects ({linkedResume.projects.length})</span>
                              </div>
                              <svg
                                className={`w-5 h-5 transition-transform duration-200 ${showProjects ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div className={`transition-all duration-300 ${!showProjects ? 'max-h-24 overflow-hidden' : ''}`}>
                              <div className={`space-y-3 ${!showProjects ? 'max-h-40 overflow-y-auto blur-[1.5px] opacity-75 pointer-events-none' : ''}`}>
                              {linkedResume.projects.map((project, index) => (
                                <div key={index} className={`p-3 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                                  <p className={`font-medium ${themeClasses.textPrimary}`}>{project.name || project.title || `Project ${index + 1}`}</p>
                                  {project.description && (
                                    <p className={`text-sm ${themeClasses.textSecondary} mt-1 line-clamp-2`}>{project.description}</p>
                                  )}
                                  {project.technologies && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {project.technologies.slice(0, 3).map((tech, i) => (
                                        <span key={i} className={`text-xs ${themeClasses.badgeBackground} ${themeClasses.badgeText} px-2 py-1 rounded`}>
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className={`${themeClasses.textSecondary} text-sm`}>No projects detected</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resume Statistics Card */}
                    <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center`}>
                          <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Resume Statistics</h3>
                          <p className={themeClasses.textSecondary}>Profile Completeness</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`text-center p-4 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                            <div className={`text-2xl font-bold ${themeClasses.accent}`}>
                              {linkedResume.skills ? linkedResume.skills.length : 0}
                            </div>
                            <div className={`text-sm font-medium ${themeClasses.textSecondary}`}>Skills</div>
                          </div>
                          
                          <div className={`text-center p-4 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                            <div className={`text-2xl font-bold ${themeClasses.accent}`}>
                              {linkedResume.projects ? linkedResume.projects.length : 0}
                            </div>
                            <div className={`text-sm font-medium ${themeClasses.textSecondary}`}>Projects</div>
                          </div>
                          
                          <div className={`text-center p-4 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                            <div className={`text-2xl font-bold ${themeClasses.accent}`}>
                              {linkedResume.experience ? linkedResume.experience.length : 0}
                            </div>
                            <div className={`text-sm font-medium ${themeClasses.textSecondary}`}>Experience</div>
                          </div>
                          
                          <div className={`text-center p-4 rounded-lg ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                            <div className={`text-2xl font-bold ${themeClasses.accent}`}>
                              {parseCertifications(linkedResume.certifications).length}
                            </div>
                            <div className={`text-sm font-medium ${themeClasses.textSecondary}`}>Certifications</div>
                          </div>
                        </div>

                        {/* Profile Completeness Bar */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>Profile Completeness</span>
                            <span className={`text-sm font-bold ${themeClasses.accent}`}>
                              {(() => {
                                let completeness = 0;
                                if (linkedResume.name) completeness += 12;
                                if (linkedResume.email) completeness += 12;
                                if (linkedResume.mobile) completeness += 12;
                                if (linkedResume.skills && linkedResume.skills.length > 0) completeness += 25;
                                if (linkedResume.projects && linkedResume.projects.length > 0) completeness += 15;
                                if (linkedResume.experience && linkedResume.experience.length > 0) completeness += 12;
                                if (parseCertifications(linkedResume.certifications).length > 0) completeness += 12;
                                return Math.min(100, completeness);
                              })()}%
                            </span>
                          </div>
                          <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3`}>
                            <div 
                              className={`${themeClasses.gradient} h-3 rounded-full transition-all duration-500`}
                              style={{ 
                                width: `${(() => {
                                  let completeness = 0;
                                  if (linkedResume.name) completeness += 12;
                                  if (linkedResume.email) completeness += 12;
                                  if (linkedResume.mobile) completeness += 12;
                                  if (linkedResume.skills && linkedResume.skills.length > 0) completeness += 25;
                                  if (linkedResume.projects && linkedResume.projects.length > 0) completeness += 15;
                                  if (linkedResume.experience && linkedResume.experience.length > 0) completeness += 12;
                                  if (parseCertifications(linkedResume.certifications).length > 0) completeness += 12;
                                  return Math.min(100, completeness);
                                })()}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* Smart AI Resume Analysis Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleSmartAnalysis}
                  disabled={isAnalyzing || isLoadingAnalysis}
                  className={`inline-flex items-center gap-3 px-12 py-5 ${themeClasses.buttonPrimary} font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(isAnalyzing || isLoadingAnalysis) && (
                    <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/>
                      <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/>
                    </svg>
                  )}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-lg">
                    {isAnalyzing 
                      ? 'Generating New Analysis...' 
                      : isLoadingAnalysis 
                        ? 'Loading Your Analysis...' 
                        : 'Smart AI Resume Analysis'}
                  </span>
                </button>
                
                <p className={`mt-4 ${themeClasses.textSecondary} text-sm max-w-2xl mx-auto`}>
                  Get instant access to your comprehensive resume analysis or generate a new one with AI-powered insights, 
                  strengths, weaknesses, and personalized suggestions
                </p>
              </div>

              {/* Analysis Result Message */}
              {analysisResult && (
                <div className={`mt-8 p-8 rounded-2xl border-2 ${analysisResult.success ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'} ${themeClasses.cardBackground} shadow-lg`}>
                  <div className="flex items-start gap-4">
                    {analysisResult.success ? (
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${analysisResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                        {analysisResult.success ? 'Analysis Started Successfully!' : 'Analysis Failed'}
                      </h4>
                      <p className={`text-lg ${analysisResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {analysisResult.message}
                      </p>
                      {analysisResult.success && (
                        <p className="mt-3 text-green-600 dark:text-green-500 text-sm">
                          Check your email for detailed analysis results and improvement suggestions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Analysis Error */}
              {analysisError && (
                <div className={`mt-6 p-6 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700 ${themeClasses.cardBackground} shadow-lg`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-lg font-bold ${themeClasses.textPrimary} mb-1`}>
                        No Analysis Data Available
                      </h4>
                      <p className={`${themeClasses.textSecondary} text-sm`}>
                        {analysisError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Analysis Data Display */}
              {smartAnalysisData && (
                <div className="mt-8 space-y-6 animate-fadeIn">
                  {/* Analysis Header */}
                  <div className={`${themeClasses.sectionBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>
                          AI-Powered Resume Analysis Results
                        </h3>
                      </div>
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${themeClasses.accent}`}>
                          {smartAnalysisData.resume_score}
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary} font-medium`}>Resume Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  {smartAnalysisData.summary && (
                    <div className={`${themeClasses.sectionBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-xl flex items-center justify-center`}>
                          <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                          Executive Summary
                        </h4>
                      </div>
                      <div className={`p-4 ${themeClasses.cardBackground} rounded-lg`}>
                        <p className={`${themeClasses.textPrimary} text-base leading-relaxed`}>{smartAnalysisData.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Strengths Section */}
                  {smartAnalysisData.strengths && smartAnalysisData.strengths.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-green-800">
                          Strengths ({smartAnalysisData.strengths.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.strengths.map((strength, index) => {
                          // Handle both string and object formats
                          const strengthText = typeof strength === 'string' 
                            ? strength 
                            : (strength.description || strength.title || strength.strength || JSON.stringify(strength));
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textPrimary} flex-1`}>{strengthText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Weaknesses Section */}
                  {smartAnalysisData.weaknesses && smartAnalysisData.weaknesses.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-red-800">
                          Areas for Improvement ({smartAnalysisData.weaknesses.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.weaknesses.map((weakness, index) => {
                          // Handle both string and object formats
                          const weaknessText = typeof weakness === 'string' 
                            ? weakness 
                            : (weakness.description || weakness.title || weakness.weakness || JSON.stringify(weakness));
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                              <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textPrimary} flex-1`}>{weaknessText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggestions Section */}
                  {smartAnalysisData.suggestions && smartAnalysisData.suggestions.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-xl flex items-center justify-center`}>
                          <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                          Actionable Suggestions ({smartAnalysisData.suggestions.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.suggestions.map((suggestion, index) => {
                          // Handle both string and object formats
                          const suggestionText = typeof suggestion === 'string' 
                            ? suggestion 
                            : (suggestion.description || suggestion.title || JSON.stringify(suggestion));
                          
                          return (
                            <div key={index} className={`flex items-start gap-3 p-3 ${themeClasses.sectionBackground} rounded-lg`}>
                              <span className={`flex-shrink-0 w-6 h-6 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textSecondary} flex-1`}>{suggestionText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills Section */}
                  {smartAnalysisData.missing_skills && smartAnalysisData.missing_skills.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-orange-800">
                          Missing Skills ({smartAnalysisData.missing_skills.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.missing_skills.map((skill, index) => {
                          // Handle both string and object formats
                          const skillText = typeof skill === 'string' 
                            ? skill 
                            : (skill.description || skill.title || skill.skill || skill.name || JSON.stringify(skill));
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textPrimary} flex-1`}>{skillText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ATS Tips Section */}
                  {smartAnalysisData.ats_tips && smartAnalysisData.ats_tips.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-yellow-800">
                          ATS Optimization Tips ({smartAnalysisData.ats_tips.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.ats_tips.map((tip, index) => {
                          // Handle both string and object formats
                          const tipText = typeof tip === 'string' 
                            ? tip 
                            : (tip.description || tip.title || tip.tip || JSON.stringify(tip));
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textPrimary} flex-1`}>{tipText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Project Suggestions Section */}
                  {smartAnalysisData.project_suggestions && smartAnalysisData.project_suggestions.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-orange-800">
                          Project Suggestions ({smartAnalysisData.project_suggestions.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.project_suggestions.map((suggestion, index) => {
                          // Handle both string and object formats
                          const suggestionText = typeof suggestion === 'string' 
                            ? suggestion 
                            : (suggestion.description || suggestion.title || suggestion.suggestion || JSON.stringify(suggestion));
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                              <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textPrimary} flex-1`}>{suggestionText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Company Suggestions Section */}
                  {smartAnalysisData.company_suggestions && smartAnalysisData.company_suggestions.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-amber-800">
                          Company Suggestions ({smartAnalysisData.company_suggestions.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {smartAnalysisData.company_suggestions.map((suggestion, index) => {
                          // Handle both string and object formats
                          const suggestionText = typeof suggestion === 'string' 
                            ? suggestion 
                            : (suggestion.description || suggestion.title || suggestion.company || suggestion.suggestion || JSON.stringify(suggestion));
                          
                          return (
                            <div key={index} className={`flex items-start gap-3 p-3 ${themeClasses.sectionBackground} rounded-lg`}>
                              <span className={`flex-shrink-0 w-6 h-6 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                                {index + 1}
                              </span>
                              <p className={`${themeClasses.textSecondary} flex-1`}>{suggestionText}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Skills Summary */}
                  {smartAnalysisData.skills && smartAnalysisData.skills.length > 0 && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-yellow-800">
                          Skills Identified
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {smartAnalysisData.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company Eligibility Section */}
                  {(smartAnalysisData.company_1_name || smartAnalysisData.company_2_name || smartAnalysisData.company_3_name || smartAnalysisData.company_4_name) && (
                    <div className={`${themeClasses.cardBackground} rounded-2xl p-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-amber-800">
                          Company Eligibility Analysis
                        </h4>
                      </div>
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((num) => {
                          const companyName = smartAnalysisData[`company_${num}_name`];
                          const eligible = smartAnalysisData[`company_${num}_eligible`];
                          const reason = smartAnalysisData[`company_${num}_reason`];
                          
                          if (!companyName) return null;
                          
                          const isEligible = eligible?.toLowerCase() === 'yes' || eligible?.toLowerCase() === 'eligible';
                          
                          return (
                            <div key={num} className={`p-4 rounded-lg border-2 ${isEligible ? '${themeClasses.cardBorder} bg-green-50' : '${themeClasses.cardBorder} bg-red-50'}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-lg font-bold ${themeClasses.textPrimary}`}>{companyName}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isEligible ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                      {isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                                    </span>
                                  </div>
                                  {reason && (
                                    <p className={`${themeClasses.textPrimary} text-sm`}>{reason}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Analysis Metadata */}
                  <div className={`bg-amber-50 dark:bg-[#2d1f3d] rounded-xl p-4 border ${themeClasses.cardBorder} dark:border-pink-500/20`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {smartAnalysisData.created_at && (
                        <div>
                          <span className={`${themeClasses.textSecondary}`}>Created:</span>
                          <p className={`font-semibold ${themeClasses.textPrimary}`}>{new Date(smartAnalysisData.created_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {smartAnalysisData.updated_at && (
                        <div>
                          <span className={`${themeClasses.textSecondary}`}>Updated:</span>
                          <p className={`font-semibold ${themeClasses.textPrimary}`}>{new Date(smartAnalysisData.updated_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {smartAnalysisData.source && (
                        <div>
                          <span className={`${themeClasses.textSecondary}`}>Source:</span>
                          <p className={`font-semibold ${themeClasses.textPrimary}`}>{smartAnalysisData.source}</p>
                        </div>
                      )}
                      {smartAnalysisData.analysis_version && (
                        <div>
                          <span className={`${themeClasses.textSecondary}`}>Version:</span>
                          <p className={`font-semibold ${themeClasses.textPrimary}`}>{smartAnalysisData.analysis_version}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Other sections can be added here */}
          
          {/* Skills Test Section */}
          {activeSection === 'skilltest' && (
            <div className="space-y-6">
              <div className={`${themeClasses.gradient} rounded-2xl p-8 shadow-lg dark:shadow-soft`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className={`text-3xl font-bold mb-2 ${themeClasses.textPrimary}`}>Initial Skills Assessment</h2>
                    <p className={`${themeClasses.textSecondary} mb-4`}>
                      One-time comprehensive evaluation to establish your skill baseline
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className={`w-8 h-8 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Selected Skills Display */}
              <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 ${themeClasses.cardBorder}`}>
                {(() => {
                  try {
                    const linkedData = localStorage.getItem('linkedResumeData');
                    const predictionData = localStorage.getItem('predictionFormData');
                    
                    let selectedSkills = [];
                    let jobRole = 'Your Role';
                    
                    if (linkedData) {
                      const parsed = JSON.parse(linkedData);
                      selectedSkills = parsed.jobSelection?.selectedSkills || [];
                      jobRole = parsed.jobSelection?.jobRole || jobRole;
                    } else if (predictionData) {
                      const parsed = JSON.parse(predictionData);
                      selectedSkills = parsed.selectedSkills || [];
                      jobRole = parsed.jobRole || jobRole;
                    }
                    
                    if (selectedSkills.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <svg className={`w-16 h-16 ${themeClasses.textSecondary} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className={`${themeClasses.textSecondary} mb-4`}>No skills selected yet</p>
                          <Link
                            to="/predict"
                            className={`inline-flex items-center px-6 py-3 ${themeClasses.buttonPrimary} text-white rounded-lg transition-colors`}
                          >
                            Select Skills
                          </Link>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-6">
                        {/* Job Role Section */}
                        <div className={`${themeClasses.sectionBackground} rounded-xl p-5 border ${themeClasses.cardBorder}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center`}>
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${themeClasses.accent} uppercase tracking-wider`}>Target Job Role</p>
                              <h4 className={`text-xl font-bold ${themeClasses.textPrimary}`}>{formatJobRole(jobRole)}</h4>
                            </div>
                          </div>
                        </div>

                        {/* Skills Section */}
                        <div className={`${themeClasses.sectionBackground} rounded-xl p-5 border ${themeClasses.cardBorder}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center`}>
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${themeClasses.accent} uppercase tracking-wider`}>Skills to be Assessed</p>
                              <p className={`text-sm ${themeClasses.textSecondary}`}>{selectedSkills.length} skills selected</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-4 py-2 ${themeClasses.badgeBackground} ${themeClasses.badgeText} rounded-lg text-sm font-medium border ${themeClasses.cardBorder} shadow-sm`}
                              >
                                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Assessment Info */}
                        <div className={`${themeClasses.sectionBackground} rounded-xl p-4 border ${themeClasses.cardBorder}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 ${themeClasses.sectionBackground} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <svg className={`w-4 h-4 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${themeClasses.textPrimary}`}>One-Time Assessment</p>
                              <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>This assessment establishes your skill baseline. Questions are AI-generated based on your selected skills and job role.</p>
                            </div>
                          </div>
                        </div>

                        {/* Start Test Button */}
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => generateSkillsTest('quick')}
                            disabled={isGeneratingTest}
                            className={`px-10 py-4 ${themeClasses.buttonPrimary} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                              isGeneratingTest ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <span className="flex items-center">
                              {isGeneratingTest ? (
                                <>
                                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Generating Assessment...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Begin Assessment
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                        
                        {/* Test Error Message */}
                        {testError && (
                          <div className={`mt-4 p-4 bg-red-50 dark:bg-red-900/20 border ${themeClasses.cardBorder} dark:border-red-800 rounded-lg`}>
                            <div className="flex items-start">
                              <svg className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error generating test</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{testError}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Test Available Message */}
                        {testAvailable && (
                          <div className={`mt-4 p-4 bg-green-50 dark:bg-green-900/20 border ${themeClasses.cardBorder} dark:border-green-800 rounded-lg`}>
                            <div className="flex items-start">
                              <svg className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Test ready!</p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Your skills test has been generated and is ready to take.</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Test Analysis Report Button - always visible */}
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => {
                              const mobile = getUserMobile();
                              if (!mobile) {
                                alert('Mobile number not found. Please sign in first.');
                                return;
                              }

                              // Navigate immediately for fast response
                              navigate('/test-analysis');
                            }}
                            className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl ${themeClasses.buttonPrimary} text-white font-medium shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 ease-out focus:outline-none focus:ring-4 ${themeClasses.accent}/30`}
                            title={analysisReady ? 'View Assessment Report' : 'Generate and view Assessment Report'}
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3a2 2 0 002 2h12zM7 16v1a2 2 0 002 2h6a2 2 0 002-2v-1" />
                            </svg>
                            <span>View Assessment Report</span>
                          </button>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error loading skills:', error);
                    return (
                      <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
                        <p>Unable to load skills data</p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Benefits Section */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`${themeClasses.cardBackground} backdrop-blur-sm p-6 rounded-xl shadow-lg border ${themeClasses.cardBorder}`}>
                  <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-lg flex items-center justify-center mb-4`}>
                    <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>Identify Strengths</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Discover which skills you excel in and areas where you're proficient</p>
                </div>

                <div className={`${themeClasses.cardBackground} backdrop-blur-sm p-6 rounded-xl shadow-lg border ${themeClasses.cardBorder}`}>
                  <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-lg flex items-center justify-center mb-4`}>
                    <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>Track Progress</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Monitor your skill development journey and measure improvement over time</p>
                </div>

                <div className={`${themeClasses.cardBackground} backdrop-blur-sm p-6 rounded-xl shadow-lg border ${themeClasses.cardBorder}`}>
                  <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-lg flex items-center justify-center mb-4`}>
                    <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className={`font-semibold ${themeClasses.textPrimary} mb-2`}>Get Recommendations</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Receive personalized learning paths based on your test results</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'roadmap' && (
            <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}`}>
              <div className="text-center">
                <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>Career Roadmaps</h2>
                <p className={`${themeClasses.textSecondary} mb-6`}>
                  View your personalized learning roadmaps based on your job role skills and career goals.
                </p>
                <Link
                  to="/roadmap"
                  className={`inline-flex items-center px-6 py-3 ${themeClasses.buttonPrimary} text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Career Roadmaps
                </Link>
              </div>
            </div>
          )}

          {activeSection === 'weeklytest' && (
            <div className="space-y-6">
              {/* Check if weekly test should be shown or hidden due to pending monthly test */}
              {!shouldShowWeeklyTestSection() ? (
                /* Show message that monthly test must be completed first */
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-2xl p-8 border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>
                        🎯 Monthly Test Required!
                      </h3>
                      <p className={`text-lg ${themeClasses.textSecondary} mb-4`}>
                        Great job completing 4 weeks of learning! 🎉
                      </p>
                      <div className={`${themeClasses.cardBackground} border ${themeClasses.cardBorder} rounded-xl p-4 mb-4`}>
                        <p className={`${themeClasses.textPrimary} text-sm`}>
                          Before starting the next set of weekly tests, you must:
                        </p>
                        <ol className="mt-3 space-y-2 text-left">
                          <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold">1.</span>
                            <span className={themeClasses.textPrimary}>Complete your <strong>Monthly Test</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold">2.</span>
                            <span className={themeClasses.textPrimary}>Get your <strong>Monthly Test Analysis</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold">3.</span>
                            <span className={themeClasses.textPrimary}>Achieve at least <strong>50% score</strong> to proceed</span>
                          </li>
                        </ol>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          💡 <strong>Tip:</strong> <strong>Monthly Test section is shown below</strong> - complete your monthly assessment to continue
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
              /* Show normal weekly test section */
              <>
              {/* Weekly Assessment Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Weekly Assessment</h2>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Test your knowledge and track your weekly progress</p>
                  </div>
                </div>

                {/* How to Use - Steps Guide */}
                <div className={`${themeClasses.sectionBackground} rounded-xl p-5 mb-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 ${themeClasses.accent} rounded-lg flex items-center justify-center animate-pulse`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className={`font-bold text-lg ${themeClasses.textPrimary}`}>📋 Quick Start Guide</h4>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>1</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Click on Generate Test</strong> - Generate your personalized weekly test based on your learning roadmap</span>
                    </li>
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>2</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Click on Start Test</strong> - Begin your weekly assessment and answer all questions</span>
                    </li>
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>3</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Click on Weekly Test Analysis</strong> - To check your weekly performance and get detailed insights</span>
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className={`${themeClasses.cardBackground} rounded-xl p-4 border ${themeClasses.cardBorder}`}>
                    {/* Generate Weekly Test Button - Show only when:
                        - test not generated 
                        - no timer modal showing
                        - no analysis pending
                        - post-analysis timer not active 
                        - monthly post-analysis timer not active
                        - AND NOT when next action should be monthly test (month-end week completed)
                    */}
                    {!weeklyTestGenerated && !showTimerModal && !weeklyTestHasAnalysis && !postAnalysisTimerActive && !monthlyPostAnalysisTimerActive && !(postAnalysisIsMonthEnd && postAnalysisNextAction === 'generate_monthly_test') && (
                      <div className={`mb-3 pb-3 border-b ${themeClasses.cardBorder}`}>
                        <button
                        onClick={async () => {
                          const mobile = getUserMobile();
                          if (!mobile) {
                            alert('Mobile number not found. Please sign in first.');
                            return;
                          }

                          setGeneratingWeeklyTest(true);
                          
                          try {
                            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                            console.log('🔄 Triggering Generate Weekly Test webhook for mobile:', mobile);
                            
                            await fetch(`${backendUrl}/api/notify-answer-response`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                mobile, 
                                action: 'generate_weekly_test'
                              })
                            });
                            
                            // Wait 15 seconds before starting to check
                            console.log('⏳ Waiting 15 seconds before checking for test...');
                            await new Promise(resolve => setTimeout(resolve, 15000));
                            
                            // Start polling to check if test is generated in MongoDB
                            let pollCount = 0;
                            const maxPolls = 60; // Poll for up to 2 minutes (60 * 2 seconds)
                            
                            // Get current week info for checking
                            const weekToCheck = currentWeekInfo.week;
                            const monthToCheck = currentWeekInfo.month;
                            
                            weeklyTestPollRef.current = setInterval(async () => {
                              pollCount++;
                              
                              try {
                                // Check if test exists in week_test collection for this specific week/month
                                const checkResponse = await fetch(`${backendUrl}/api/check-weekly-test`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ mobile, week: weekToCheck, month: monthToCheck })
                                });
                                
                                const checkData = await checkResponse.json();
                                
                                if (checkData.exists) {
                                  // Test found in database
                                  clearInterval(weeklyTestPollRef.current);
                                  setGeneratingWeeklyTest(false);
                                  setWeeklyTestGenerated(true);
                                  console.log('✅ Test generated! Opening 5-minute timer...');
                                  // Start the 5-minute timer automatically
                                  setShowTimerModal(true);
                                  setTimerCompleted(false);
                                } else if (pollCount >= maxPolls) {
                                  // Timeout
                                  clearInterval(weeklyTestPollRef.current);
                                  setGeneratingWeeklyTest(false);
                                  alert('Test generation is taking longer than expected. Please check back later.');
                                }
                              } catch (pollErr) {
                                console.error('Error checking test status:', pollErr);
                              }
                            }, 2000); // Check every 2 seconds
                            
                          } catch (err) {
                            console.error('Error triggering weekly test generation:', err);
                            setGeneratingWeeklyTest(false);
                            alert('Failed to generate test. Please try again.');
                          }
                        }}
                        disabled={generatingWeeklyTest}
                        className={`group relative w-full px-6 py-3.5 ${themeClasses.buttonSecondary} font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden ${
                          generatingWeeklyTest ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {generatingWeeklyTest ? (
                          <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="relative z-10">Generating Test...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative z-10">Generate Weekly Test</span>
                          </>
                        )}
                      </button>
                    </div>
                    )}

                    {/* Post-Analysis Timer - Show after weekly analysis is complete, before generating next test */}
                    {postAnalysisTimerActive && postAnalysisTimerRemaining > 0 && (
                      <div className="mb-4">
                        <PostAnalysisTimerInline 
                          timeRemaining={postAnalysisTimerRemaining}
                          timerDuration={postAnalysisTimerDuration}
                          nextAction={postAnalysisNextAction}
                          isMonthEnd={postAnalysisIsMonthEnd}
                          isRoadmapTimer={postAnalysisIsRoadmapTimer}
                          theme={theme}
                        />
                      </div>
                    )}

                    {/* Post-Monthly-Analysis Timer - Show after monthly test analysis is complete, before generating next week test */}
                    {monthlyPostAnalysisTimerActive && monthlyPostAnalysisTimerRemaining > 0 && (
                      <div className="mb-4">
                        <PostAnalysisTimerInline 
                          timeRemaining={monthlyPostAnalysisTimerRemaining}
                          timerDuration={300}
                          nextAction="generate_weekly_test"
                          isMonthEnd={false}
                          isRoadmapTimer={false}
                          theme={theme}
                        />
                      </div>
                    )}

                    {/* Show Timer Below Generate Button */}
                    {showTimerModal && (
                      <div className="mb-4">
                        <WeeklyTestTimerInline 
                          onTimerComplete={() => {
                            setTimerCompleted(true);
                            setShowTimerModal(false);
                          }}
                          theme={theme}
                        />
                      </div>
                    )}

                    {/* Show Start Test button only when test is generated, timer is completed, and no post-analysis timer is running */}
                    {weeklyTestGenerated && timerCompleted && !showTimerModal && !postAnalysisTimerActive && !monthlyPostAnalysisTimerActive && (
                    <div className={`mb-3 ${weeklyTestHasAnalysis ? '' : `pb-3 border-b ${themeClasses.cardBorder}`}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${themeClasses.sectionBackground} rounded-lg flex items-center justify-center`}>
                          <svg className={`w-5 h-5 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold ${themeClasses.textPrimary}`}>
                            {loadingWeekInfo ? 'Loading...' : `Week ${currentWeekInfo.week} Test`}
                          </p>
                          <p className={`text-xs ${themeClasses.textSecondary}`}>Month {currentWeekInfo.month} • Test your skills and earn certifications</p>
                        </div>
                      </div>
                      <button
                        onClick={startWeeklyTestAfterTimer}
                        disabled={weeklyTestLoading || loadingWeekInfo}
                        className={`group relative px-6 py-3 ${themeClasses.buttonPrimary} text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 overflow-hidden ${weeklyTestLoading || loadingWeekInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span className="relative z-10 flex items-center gap-2">
                          {weeklyTestLoading ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start Week {currentWeekInfo.week} Test
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                    </div>
                    )}

                    {/* Weekly Test Analysis Button - Show only when test is completed (has result) */}
                    {weeklyTestHasAnalysis && !showTimerModal && (
                    <div className={`mt-3 pt-3 pb-3 border-t border-b ${themeClasses.cardBorder}`}>
                      <button
                        onClick={async () => {
                          const mobile = getUserMobile();
                          if (!mobile) {
                            alert('Mobile number not found. Please sign in first.');
                            return;
                          }

                          try {
                            // Get current week info first
                            const currentWeek = currentWeekInfo.week;
                            const currentMonth = currentWeekInfo.month;
                            
                            if (!currentWeek || currentWeek < 1) {
                              alert('Unable to determine current week. Please refresh the page.');
                              return;
                            }
                            
                            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                            console.log(`📊 Starting Weekly Test Analysis Flow for Week ${currentWeek}, Month ${currentMonth}`);
                            
                            // STEP 1: Check if data already exists in database
                            console.log(`🔍 Step 1: Checking database for existing Week ${currentWeek} analysis...`);
                            setProgressTrackingMessage(`Checking for Week ${currentWeek} analysis...`);
                            setRedirectingToProgressTracking(true);
                            
                            const checkResponse = await fetch(`${backendUrl}/api/weekly-test-analysis/${mobile}`);
                            const checkData = await checkResponse.json();
                            
                            console.log('📥 Database check result:', checkData);
                            
                            // Check if data exists for the CURRENT week
                            let hasCurrentWeekAnalysis = false;
                            
                            if (checkData.success && checkData.data) {
                              console.log(`📋 Database response structure:`, checkData.data);
                              
                              // Check in the months array structure
                              if (checkData.data.months && Array.isArray(checkData.data.months)) {
                                console.log(`📋 Found ${checkData.data.months.length} months of data`);
                                
                                // Look for the current month and week
                                for (const monthData of checkData.data.months) {
                                  if (monthData.month === currentMonth) {
                                    console.log(`📋 Found Month ${currentMonth} data. Checking weeks...`);
                                    if (monthData.weeks && Array.isArray(monthData.weeks)) {
                                      for (const weekData of monthData.weeks) {
                                        if (weekData.week === currentWeek) {
                                          hasCurrentWeekAnalysis = true;
                                          console.log(`✅ FOUND: Week ${currentWeek} analysis exists in Month ${currentMonth}!`);
                                          console.log(`📊 Analysis data:`, weekData.analysis);
                                          break;
                                        }
                                      }
                                    }
                                  }
                                  if (hasCurrentWeekAnalysis) break;
                                }
                                
                                if (!hasCurrentWeekAnalysis) {
                                  console.log(`❌ NOT FOUND: Week ${currentWeek} of Month ${currentMonth} not in database`);
                                }
                              } else {
                                console.log(`❌ NO DATA: No months array in response`);
                              }
                            } else {
                              console.log(`❌ NO DATA: API returned failure or no data`);
                            }
                            
                            // STEP 2: If data exists, check timer status and redirect
                            if (hasCurrentWeekAnalysis) {
                              console.log(`✅ Step 2: Data exists! Checking timer status...`);
                              setProgressTrackingMessage(`Week ${currentWeek} Analysis Found! Redirecting...`);
                              
                              // Reset weekly test state so new timer starts for next week
                              console.log('🔄 Resetting weekly test state for next week generation...');
                              setWeeklyTestGenerated(false);
                              setTimerCompleted(false);
                              setShowTimerModal(false);
                              
                              // Check if timer is still active from backend
                              try {
                                const timerResponse = await fetch(`${backendUrl}/api/weekly-analysis-timer-status/${mobile}/${currentWeek}/${currentMonth}`);
                                const timerData = await timerResponse.json();
                                console.log('⏱️ Timer status for existing analysis:', timerData);
                                
                                if (timerData.success && timerData.data && !timerData.data.can_generate_next && timerData.data.timer_remaining > 0) {
                                  // IMPORTANT: Only start timer if not already running
                                  if (!postAnalysisTimerRef.current) {
                                    console.log(`⏳ Starting timer: ${timerData.data.timer_remaining}s remaining`);
                                    const isMonthEndWeek = currentWeek % 4 === 0;
                                    
                                    // Set timer state - useEffect will start the interval
                                    setPostAnalysisTimerRemaining(timerData.data.timer_remaining);
                                    setPostAnalysisTimerDuration(timerData.data.timer_duration);
                                    setPostAnalysisIsMonthEnd(isMonthEndWeek);
                                    setPostAnalysisNextAction(isMonthEndWeek ? 'monthly' : 'weekly');
                                    setPostAnalysisIsRoadmapTimer(false); // Not a roadmap timer
                                    setPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
                                  } else {
                                    console.log(`⏳ Timer already running, skipping reset`);
                                  }
                                }
                              } catch (timerError) {
                                console.error('Error checking timer status:', timerError);
                              }
                              
                              // Switch to progress section
                              setActiveSection('progress');
                              
                              // Wait for section to render, then expand and scroll
                              setTimeout(() => {
                                setShowWeeklyTestAnalysis(true);
                                fetchWeeklyTestAnalysisData();
                                
                                setTimeout(() => {
                                  const element = document.getElementById('weekly-test-analysis-section');
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                  // Close overlay after scroll
                                  setTimeout(() => {
                                    setRedirectingToProgressTracking(false);
                                    setProgressTrackingMessage('');
                                  }, 500);
                                }, 400);
                              }, 500);
                              
                              return; // Exit function - don't trigger webhook
                            }
                            
                            // STEP 3: Data doesn't exist - trigger webhook and poll
                            console.log(`⚠️ Step 3: No data found. Triggering webhook for Week ${currentWeek}...`);
                            setProgressTrackingMessage(`Generating Week ${currentWeek} Test Analysis...`);
                            
                            const webhookResponse = await fetch(`${backendUrl}/api/notify-answer-response`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                mobile, 
                                action: 'progress_tracking_weekly',
                                week: currentWeek,
                                month: currentMonth
                              })
                            });
                            
                            console.log('🔄 Webhook triggered successfully. Status:', webhookResponse.status);
                            
                            // STEP 4: Poll for data generation
                            console.log(`🔄 Step 4: Polling for Week ${currentWeek} analysis generation...`);
                            let attempts = 0;
                            const maxAttempts = 24; // 24 attempts x 5 seconds = 120 seconds max
                            let dataFound = false;
                            
                            while (attempts < maxAttempts && !dataFound) {
                              await new Promise(resolve => setTimeout(resolve, 5000));
                              attempts++;
                              const elapsedTime = attempts * 5;
                              console.log(`🔄 Poll attempt ${attempts}/${maxAttempts} (${elapsedTime}s elapsed)...`);
                              setProgressTrackingMessage(`Generating Week ${currentWeek} Test Analysis... (${elapsedTime}s)`);
                              
                              const pollResponse = await fetch(`${backendUrl}/api/weekly-test-analysis/${mobile}`);
                              const pollData = await pollResponse.json();
                              
                              // Check if the specific week analysis exists now in months array
                              let weekFound = false;
                              if (pollData.success && pollData.data && pollData.data.months && Array.isArray(pollData.data.months)) {
                                for (const monthData of pollData.data.months) {
                                  if (monthData.month === currentMonth && monthData.weeks && Array.isArray(monthData.weeks)) {
                                    for (const weekData of monthData.weeks) {
                                      if (weekData.week === currentWeek) {
                                        weekFound = true;
                                        console.log(`✅ SUCCESS: Week ${currentWeek} analysis found in database!`);
                                        break;
                                      }
                                    }
                                  }
                                  if (weekFound) break;
                                }
                              }
                              
                              if (weekFound) {
                                dataFound = true;
                                setProgressTrackingMessage(`Week ${currentWeek} Analysis Generated! Redirecting...`);
                                
                                // Record analysis completion for timer tracking
                                try {
                                  await fetch(`${backendUrl}/api/record-analysis-completion`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      mobile: mobile,
                                      type: 'weekly',
                                      week: currentWeek,
                                      month: currentMonth
                                    })
                                  });
                                  console.log('✅ Recorded weekly analysis completion for timer');
                                } catch (recordErr) {
                                  console.error('Failed to record weekly analysis completion:', recordErr);
                                }
                                
                                // Reset weekly test state so new timer starts for next week
                                console.log('🔄 Resetting weekly test state for next week generation...');
                                setWeeklyTestGenerated(false);
                                setTimerCompleted(false);
                                setShowTimerModal(false);
                                setWeeklyTestHasAnalysis(false);
                                
                                // Start post-analysis timer (5 min for regular weeks, 3 min for month-end weeks)
                                // IMPORTANT: Only start if not already running
                                if (!postAnalysisTimerRef.current) {
                                  const isMonthEndWeek = (currentWeek % 4 === 0);
                                  const timerDuration = isMonthEndWeek ? 180 : 300; // 3 min or 5 min
                                  const nextAction = isMonthEndWeek ? 'generate_monthly_test' : 'generate_weekly_test';
                                  
                                  console.log(`⏱️ Starting ${timerDuration/60}-minute post-analysis timer. Next action: ${nextAction}`);
                                  setPostAnalysisTimerRemaining(timerDuration);
                                  setPostAnalysisTimerDuration(timerDuration);
                                  setPostAnalysisNextAction(nextAction);
                                  setPostAnalysisIsMonthEnd(isMonthEndWeek);
                                  setPostAnalysisIsRoadmapTimer(false); // Not a roadmap timer
                                  setPostAnalysisTimerActive(true); // Set active LAST to trigger useEffect
                                } else {
                                  console.log(`⏱️ Timer already running, skipping new timer start`);
                                }
                                
                                // Switch to progress section
                                setActiveSection('progress');
                                
                                // Wait for section to render, then expand and scroll
                                setTimeout(() => {
                                  setShowWeeklyTestAnalysis(true);
                                  fetchWeeklyTestAnalysisData();
                                  
                                  setTimeout(() => {
                                    const element = document.getElementById('weekly-test-analysis-section');
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                    // Close overlay after scroll
                                    setTimeout(() => {
                                      setRedirectingToProgressTracking(false);
                                      setProgressTrackingMessage('');
                                    }, 500);
                                  }, 400);
                                }, 500);
                                
                                break;
                              } else {
                                console.log(`⏳ Week ${currentWeek} analysis not ready yet. Checking again in 5s...`);
                              }
                            }
                            
                            // STEP 5: Handle timeout
                            if (!dataFound) {
                              console.error(`❌ TIMEOUT: Week ${currentWeek} analysis not generated after ${maxAttempts * 5}s`);
                              setRedirectingToProgressTracking(false);
                              setProgressTrackingMessage('');
                              alert(`Week ${currentWeek} analysis generation is taking longer than expected. Please try again in a few moments.`);
                            }
                          } catch (err) {
                            console.error('Error in weekly test analysis flow:', err);
                            setRedirectingToProgressTracking(false);
                            setProgressTrackingMessage('');
                            alert('Failed to process request. Please try again.');
                          }
                        }}
                        className="group relative w-full px-6 py-3.5 bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                        <svg className="w-5 h-5 group-hover:animate-bounce relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="relative z-10">Weekly Test Analysis</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                    )}
                  </div>
                </div>

                {/* Error message display */}
                {weeklyTestMessage && (
                  <div className={`mt-4 p-4 bg-red-50 dark:bg-red-900/20 border ${themeClasses.cardBorder} dark:border-red-800 rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700 dark:text-red-300">{weeklyTestMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className={`text-center p-3 ${themeClasses.cardBackground} rounded-lg border-2 ${themeClasses.cardBorder}`}>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">12</p>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>Weeks Total</p>
                  </div>
                  <div className={`text-center p-3 ${themeClasses.cardBackground} rounded-lg border-2 ${themeClasses.cardBorder}`}>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{currentWeekInfo.week}</p>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>Current Week</p>
                  </div>
                  <div className={`text-center p-3 ${themeClasses.cardBackground} rounded-lg border-2 ${themeClasses.cardBorder}`}>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round((currentWeekInfo.week / 12) * 100)}%</p>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>Completed</p>
                  </div>
                </div>
              </div>
              </>
              )}
              {/* End of conditional weekly test section rendering */}

                {/* Month Test Section - Always visible */}
                <div className="mt-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 dark:text-purple-100">Monthly Tests</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          Complete all 4 weeks to unlock each month
                        </p>
                      </div>
                    </div>

                    {loadingMonthEligibility ? (
                      <div className="text-center py-2">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      </div>
                    ) : monthTestEligibility && monthTestEligibility.unlocked_months && monthTestEligibility.unlocked_months.length > 0 ? (
                      // Show unlocked months
                      <div className="space-y-2">
                        {monthTestEligibility.unlocked_months.map((monthData) => {
                          // Check if user has ACTUALLY passed this month's test (score >= 50%)
                          // analysis_completed does NOT mean passed - user can view analysis even if they failed
                          const hasPassed = monthData.test_passed === true && monthData.test_percentage >= 50;
                          
                          return (
                          <div key={monthData.month} className="space-y-2">
                            {/* If passed, show completion status */}
                            {hasPassed ? (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-bold text-green-800 dark:text-green-300">Month {monthData.month} - Completed! ✅</h4>
                                      <p className="text-sm text-green-700 dark:text-green-400">{monthData.test_percentage ? `Score: ${monthData.test_percentage}%` : 'Passed'}</p>
                                    </div>
                                  </div>
                                  <div className="text-4xl">🎉</div>
                                </div>
                                
                                {/* Show different message based on analysis status */}
                                {monthData.analysis_completed ? (
                                  <div className="mt-3 text-xs text-green-700 dark:text-green-400 italic">
                                    Great job! Your analysis is complete. Continue to the next month's weekly tests.
                                  </div>
                                ) : (
                                  <>
                                    <div className="mt-3 text-xs text-green-700 dark:text-green-400 italic">
                                      Great job! Click below to generate your analysis.
                                    </div>
                                    
                                    {/* Monthly Test Analysis Button - Only show if analysis not completed */}
                                    <button
                                      onClick={() => handleMonthlyAnalysis(monthData.month)}
                                      className="mt-3 w-full px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                      <span>Monthly Test Analysis</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* MONTHLY RETAKE BUTTON - Shows only if score < 50% */}
                                <MonthlyRetakeButton getUserMobile={getUserMobile} month={monthData.month} onAnalysisClick={handleMonthlyAnalysis} />
                                
                                {/* Get status for this month */}
                                {(() => {
                                  const status = monthlyTestStatus[monthData.month];
                                  const testGenerated = status?.test_generated || false;
                                  const testCompleted = status?.test_completed || false;
                                  const canStartTest = status?.can_start_test || false;
                                  const timerRemaining = status?.timer_remaining || 0;

                                  // Debug logging
                                  console.log(`[Button Render] Month ${monthData.month}:`, {
                                    status,
                                    testGenerated,
                                    testCompleted,
                                    canStartTest,
                                    timerRemaining
                                  });

                                  // Case 0: Post-analysis timer for monthly test - Show timer before Generate button
                                  if (!testGenerated && postAnalysisTimerActive && postAnalysisNextAction === 'generate_monthly_test' && postAnalysisIsMonthEnd) {
                                    return (
                                      <PostAnalysisTimerInline 
                                        timeRemaining={postAnalysisTimerRemaining}
                                        timerDuration={postAnalysisTimerDuration}
                                        nextAction={postAnalysisNextAction}
                                        isMonthEnd={postAnalysisIsMonthEnd}
                                        isRoadmapTimer={false}
                                        theme={theme}
                                      />
                                    );
                                  }

                                  // Case 1: Test not generated yet - Show "Generate Month Test" button
                                  if (!testGenerated && !showMonthlyTimerModal) {
                                    return (
                                      <button
                                        onClick={() => handleMonthlyTest(monthData.month)}
                                        disabled={generatingMonthlyTest}
                                        className={`w-full px-4 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${generatingMonthlyTest ? 'opacity-70 cursor-not-allowed' : ''}`}
                                      >
                                        {generatingMonthlyTest ? (
                                          <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Generating...</span>
                                          </>
                                        ) : (
                                          <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Generate Month {monthData.month} Test</span>
                                          </>
                                        )}
                                      </button>
                                    );
                                  }

                                  // Case 1.5: Our local 5-minute timer is running (after test detected in DB)
                                  if (showMonthlyTimerModal && monthlyTimerMonth === monthData.month && !monthlyTimerCompleted) {
                                    return (
                                      <MonthlyTestTimerInlineActive 
                                        onTimerComplete={() => {
                                          setMonthlyTimerCompleted(true);
                                          setShowMonthlyTimerModal(false);
                                          // Update status to allow starting the test
                                          setMonthlyTestStatus(prev => ({
                                            ...prev,
                                            [monthData.month]: {
                                              ...prev[monthData.month],
                                              can_start_test: true,
                                              timer_remaining: 0
                                            }
                                          }));
                                        }}
                                        month={monthData.month}
                                        theme={theme}
                                      />
                                    );
                                  }

                                  // Case 2: Test generated but timer still running - Show countdown timer (backend timer)
                                  if (testGenerated && !canStartTest && timerRemaining > 0 && !showMonthlyTimerModal) {
                                    return (
                                      <MonthlyTestTimerInline 
                                        timeRemaining={timerRemaining}
                                        theme={theme}
                                      />
                                    );
                                  }

                                  // Case 3: Timer ended (either local or backend), test not completed - Show "Start Monthly Test" button
                                  if ((testGenerated && canStartTest && !testCompleted) || 
                                      (monthlyTimerCompleted && monthlyTimerMonth === monthData.month && !testCompleted)) {
                                    return (
                                      <button
                                        onClick={() => handleStartMonthlyTest(monthData.month)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 hover:from-green-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Start Monthly Test</span>
                                      </button>
                                    );
                                  }

                                  // Case 4: Test completed AND PASSED - Show "Monthly Test Analysis" button
                                  // If user failed (<50%), MonthlyRetakeButton handles the analysis button
                                  if (testCompleted && monthData.test_passed) {
                                    return (
                                      <button
                                        onClick={() => handleMonthlyAnalysis(monthData.month)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span>Monthly Test Analysis</span>
                                      </button>
                                    );
                                  }
                                  
                                  // If test completed but failed, MonthlyRetakeButton handles everything
                                  if (testCompleted && !monthData.test_passed) {
                                    return null;
                                  }

                                  // Default: Show generate button (only if timer not active)
                                  if (showMonthlyTimerModal && monthlyTimerMonth === monthData.month) {
                                    return null; // Timer is showing, don't show generate button
                                  }
                                  
                                  return (
                                    <button
                                      onClick={() => handleMonthlyTest(monthData.month)}
                                      disabled={generatingMonthlyTest}
                                      className={`w-full px-4 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${generatingMonthlyTest ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>Generate Month {monthData.month} Test</span>
                                    </button>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                          );
                        })}
                        
                        {/* Show locked months below unlocked ones */}
                        {monthTestEligibility.locked_months && monthTestEligibility.locked_months.length > 0 && (
                          <div className="space-y-3 mt-4">
                            {monthTestEligibility.locked_months.map((monthData) => (
                              <div key={monthData.month}>
                                <button
                                  disabled
                                  className={`w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 ${themeClasses.textSecondary} font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 opacity-60`}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  <span>Month {monthData.month} Test - Locked</span>
                                </button>
                                
                                {/* Progress bar */}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300 mb-1">
                                    <span>Progress: {monthData.completed_weeks.length}/4 weeks</span>
                                    <span>{Math.round(monthData.progress_percentage)}%</span>
                                  </div>
                                  <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${monthData.progress_percentage}%` }}
                                    ></div>
                                  </div>
                                  
                                  {/* Show blocking reason */}
                                  {monthData.blocked_by_previous_month ? (
                                    <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                                      <p className="text-xs text-red-700 dark:text-red-400 text-center">
                                        🔒 <strong>Blocked:</strong> You must pass Month {monthData.month - 1} test (50%+) before unlocking Month {monthData.month}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
                                      {monthData.completed_weeks.length === 0 
                                        ? monthData.month === 2 
                                          ? 'Complete weeks 5, 6, 7, 8 to unlock this month test' 
                                          : monthData.month === 3
                                          ? 'Complete weeks 9, 10, 11, 12 to unlock this month test'
                                          : 'Complete weekly tests to unlock this month test'
                                        : `Complete ${monthData.expected_weeks.filter(w => !monthData.completed_weeks.includes(w)).join(', ')} to unlock`
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Show locked month with progress
                      monthTestEligibility && monthTestEligibility.locked_months && monthTestEligibility.locked_months.length > 0 ? (
                        <div className="space-y-3">
                          {monthTestEligibility.locked_months.map((monthData) => (
                            <div key={monthData.month}>
                              <button
                                disabled
                                className={`w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 ${themeClasses.textSecondary} font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 opacity-60`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Month {monthData.month} Test - Locked</span>
                              </button>
                              
                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300 mb-1">
                                  <span>Progress: {monthData.completed_weeks.length}/4 weeks</span>
                                  <span>{Math.round(monthData.progress_percentage)}%</span>
                                </div>
                                <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${monthData.progress_percentage}%` }}
                                  ></div>
                                </div>
                                
                                {/* Show blocking reason */}
                                {monthData.blocked_by_previous_month ? (
                                  <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                                    <p className="text-xs text-red-700 dark:text-red-400 text-center">
                                      🔒 <strong>Blocked:</strong> You must pass Month {monthData.month - 1} test (50%+) before unlocking Month {monthData.month}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
                                    {monthData.completed_weeks.length === 0 
                                      ? monthData.month === 2 
                                        ? 'Complete weeks 5, 6, 7, 8 to unlock this month test' 
                                        : monthData.month === 3
                                        ? 'Complete weeks 9, 10, 11, 12 to unlock this month test'
                                        : 'Complete weekly tests to unlock this month test'
                                      : monthData.expected_weeks 
                                      ? `Complete weeks ${monthData.expected_weeks.filter(w => !monthData.completed_weeks.includes(w)).join(', ')} to unlock`
                                      : `${4 - monthData.completed_weeks.length} more week(s) to unlock`}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          disabled
                          className={`w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 ${themeClasses.textSecondary} font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2 opacity-60`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Month Test - Locked</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="space-y-6">
              {/* Project Submission Section */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Project Submission</h2>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Upload your projects for AI-powered analysis and feedback</p>
                  </div>
                </div>

                {/* Current Month's Project with AI Steps */}
                {loadingCurrentProject ? (
                  <div className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.cardBorder} mb-6`}>
                    <div className="flex items-center justify-center py-8">
                      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={`ml-3 ${themeClasses.textSecondary}`}>Loading current month project...</span>
                    </div>
                  </div>
                ) : currentMonthProject ? (
                  <div className={`${themeClasses.cardBackground} rounded-xl p-6 border-2 border-blue-500 dark:border-blue-600 mb-6 shadow-lg`}>
                    {/* Project Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm`}>
                            Month {currentMonthProject.month} Project
                          </span>
                        </div>
                        <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
                          {currentMonthProject.projectTitle}
                        </h3>
                        {currentMonthProject.projectDescription && (
                          <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                            {currentMonthProject.projectDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AI-Generated Implementation Steps */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div 
                        className="flex items-center gap-2 mb-4 cursor-pointer group"
                        onClick={() => setStepsExpanded(!stepsExpanded)}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h4 className={`font-bold text-lg ${themeClasses.textPrimary} flex-1`}>
                          Professional Implementation Steps
                        </h4>
                        <svg 
                          className={`w-5 h-5 ${themeClasses.textSecondary} transition-transform duration-200 ${stepsExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {stepsExpanded && (
                        <div className="transition-all duration-200">
                          {loadingProjectSteps ? (
                            <div className="flex items-center gap-3 py-4">
                              <svg className="animate-spin h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className={`text-sm ${themeClasses.textSecondary}`}>
                                Generating best practices from industry experts...
                              </span>
                            </div>
                          ) : projectSteps.length > 0 ? (
                            <div className="space-y-3">
                              <p className={`text-xs ${themeClasses.textSecondary} italic mb-3`}>
                                These are the industry-standard steps companies use. Follow them to build a professional project!
                              </p>
                              <ol className="space-y-3">
                                {projectSteps.map((step, index) => (
                                  <li key={index} className={`flex items-start gap-3 ${themeClasses.sectionBackground} p-4 rounded-lg border ${themeClasses.cardBorder} hover:shadow-md transition-shadow`}>
                                    <span className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>
                                      {index + 1}
                                    </span>
                                    <span className={`flex-1 ${themeClasses.textPrimary} text-sm leading-relaxed pt-1`}>
                                      {step}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : (
                            <div className={`text-center py-4 ${themeClasses.textSecondary} text-sm`}>
                              No implementation steps available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* How to Use - Steps Guide */}
                <div className={`${themeClasses.sectionBackground} rounded-xl p-5 mb-6 border-2 ${themeClasses.cardBorder} shadow-lg`}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 ${themeClasses.accent} rounded-lg flex items-center justify-center animate-pulse`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className={`font-bold text-lg ${themeClasses.textPrimary}`}>📋 Submission Guide</h4>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>1</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Add Project Title & Description</strong> - Give your project a meaningful name and brief description</span>
                    </li>
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>2</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Upload Your Files</strong> - Upload code files (.py, .js, .java), datasets (.csv, .xlsx), or dashboards (.pbix, .html)</span>
                    </li>
                    <li className={`flex items-start gap-3 ${themeClasses.cardBackground} p-3 rounded-lg border ${themeClasses.cardBorder}`}>
                      <span className={`flex-shrink-0 w-7 h-7 ${themeClasses.gradient} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md`}>3</span>
                      <span className={themeClasses.textPrimary}><strong className={themeClasses.accent}>Submit for Analysis</strong> - AI will analyze your project and provide detailed feedback with scoring</span>
                    </li>
                  </ol>
                </div>

                {/* Project Submission Form */}
                <div className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.cardBorder} mb-6`}>
                  <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-4`}>Submit New Project</h3>
                  
                  <div className="space-y-4">
                    {/* Project Title */}
                    <div>
                      <label className={`block text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>
                        Project Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="e.g., Sales Dashboard Analytics"
                        className={`w-full px-4 py-3 rounded-lg border ${themeClasses.cardBorder} ${themeClasses.cardBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    {/* Project Description */}
                    <div>
                      <label className={`block text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>
                        Project Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Describe your project, technologies used, and key features..."
                        rows={4}
                        className={`w-full px-4 py-3 rounded-lg border ${themeClasses.cardBorder} ${themeClasses.cardBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className={`block text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>
                        Upload Project Files (Max 10 files)
                      </label>
                      
                      {/* Selected Files Display */}
                      {projectFile.length > 0 && (
                        <div className="mb-4 grid grid-cols-3 gap-4">
                          {projectFile.map((file, idx) => {
                            const isImage = file.type.startsWith('image/');
                            const imageUrl = isImage ? URL.createObjectURL(file) : null;
                            const isHovered = hoveredFileIndex === idx;
                            
                            return (
                              <div
                                key={idx}
                                className={`relative rounded-lg border ${themeClasses.cardBorder} ${themeClasses.cardBackground} overflow-hidden group`}
                                onMouseEnter={() => setHoveredFileIndex(idx)}
                                onMouseLeave={() => setHoveredFileIndex(null)}
                              >
                                {/* Thumbnail */}
                                <div className="w-full h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                                  {isImage ? (
                                    <img 
                                      src={imageUrl} 
                                      alt={file.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  )}
                                </div>
                                
                                {/* File Info */}
                                <div className="p-2">
                                  <p className={`text-xs ${themeClasses.textPrimary} truncate`} title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                
                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                
                                {/* Hover Preview for Images */}
                                {isImage && isHovered && (
                                  <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                                    <img 
                                      src={imageUrl} 
                                      alt={file.name} 
                                      className="max-w-md max-h-96 rounded-lg shadow-2xl border-4 border-white"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <div className={`border-2 border-dashed ${themeClasses.cardBorder} rounded-lg p-6 text-center`}>
                        <input
                          type="file"
                          id="project-file-input"
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                          accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.c,.html,.css,.csv,.xlsx,.pbix,.zip,.rar,.png,.jpg,.jpeg,.gif,.pdf,.docx,.pptx,.md,.txt,.json,.xml,.yaml,.yml,.env,.gitignore"
                        />
                        <label htmlFor="project-file-input" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className={`font-semibold ${themeClasses.textPrimary}`}>
                              {projectFile.length > 0 ? 'Add More Files' : 'Click to upload or drag and drop'}
                            </p>
                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                              {projectFile.length}/10 files selected
                            </p>
                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                              Code, Screenshots, Excel, Power BI, PDFs, etc.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Error Message */}
                    {projectSubmitError && (
                      <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                        <p className="text-red-500 text-sm">{projectSubmitError}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleProjectSubmit}
                      disabled={submittingProject || !projectTitle.trim() || !projectDescription.trim()}
                      className={`w-full py-4 rounded-lg font-semibold transition-all ${
                        submittingProject || !projectTitle.trim() || !projectDescription.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      } text-white shadow-lg`}
                    >
                      {submittingProject ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          AI is analyzing your project...
                        </span>
                      ) : (
                        'Submit Project for AI Evaluation'
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Evaluation Results */}
                {showEvaluation && projectEvaluation && (
                  <div id="project-evaluation" className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.cardBorder} mb-6 shadow-xl`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>AI Evaluation Results</h3>
                        {projectEvaluation.evaluatedBy && (
                          <div className="flex items-center gap-2 mt-1">
                            {projectEvaluation.evaluatedBy === 'AI' ? (
                              <>
                                <span className="text-green-500 text-xs font-semibold">✓ Evaluated by AI</span>
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                </svg>
                              </>
                            ) : (
                              <>
                                <span className="text-yellow-500 text-xs font-semibold">⚠ Fallback Evaluation (AI unavailable)</span>
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowEvaluation(false)}
                        className={`${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition-colors`}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Score Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white mb-6">
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-2">{projectEvaluation.score}</div>
                        <div className="text-2xl font-semibold mb-1">Grade: {projectEvaluation.grade}</div>
                        <div className="text-sm opacity-90">out of 100</div>
                      </div>
                    </div>

                    {/* Feedback Summary - Improved Formatting */}
                    <div className={`${themeClasses.sectionBackground} rounded-lg p-6 mb-4 border ${themeClasses.cardBorder}`}>
                      <h4 className={`font-semibold ${themeClasses.textPrimary} mb-4 text-lg flex items-center gap-2`}>
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        Detailed Feedback
                      </h4>
                      <div className={`${themeClasses.textSecondary} text-sm leading-relaxed space-y-4`}>
                        {(() => {
                          const feedback = projectEvaluation.feedback || '';
                          
                          console.log('🔍 Feedback Parsing:');
                          console.log('  - Feedback length:', feedback.length);
                          console.log('  - Feedback preview:', feedback.substring(0, 200));
                          
                          if (!feedback || feedback.trim().length === 0) {
                            return <p className="text-gray-500 italic">No detailed feedback available.</p>;
                          }
                          
                          // Split feedback into sections
                          const sections = [];
                          
                          // Extract main review (first paragraph before first **)
                          const mainReviewEnd = feedback.indexOf('**');
                          console.log('  - Main review end index:', mainReviewEnd);
                          if (mainReviewEnd > 0) {
                            sections.push({
                              type: 'intro',
                              content: feedback.substring(0, mainReviewEnd).trim()
                            });
                          }
                          
                          // Extract sections with ** markers - updated regex to capture multiline content
                          const sectionRegex = /\*\*([^*]+)\*\*\s*\n?([\s\S]+?)(?=\*\*[^*]+\*\*|$)/g;
                          let match;
                          while ((match = sectionRegex.exec(feedback)) !== null) {
                            const title = match[1].trim();
                            let content = match[2].trim();
                            
                            // Remove leading/trailing whitespace and empty lines
                            content = content.split('\n').filter(line => line.trim()).join('\n').trim();
                            
                            sections.push({
                              type: 'section',
                              title: title,
                              content: content
                            });
                          }
                          
                          console.log('  - Sections found:', sections.length);
                          console.log('  - Sections:', sections);
                          
                          // If no sections were found, display raw feedback
                          if (sections.length === 0) {
                            return (
                              <div className="whitespace-pre-wrap leading-relaxed">
                                {feedback}
                              </div>
                            );
                          }
                          
                          return sections.map((section, idx) => {
                            if (section.type === 'intro') {
                              return (
                                <div key={idx} className="pb-4 mb-4 border-b-2 border-gray-300 dark:border-gray-600">
                                  <p className="leading-relaxed text-base">{section.content}</p>
                                </div>
                              );
                            } else {
                              // Determine section styling based on title
                              const isNegative = section.title.toLowerCase().includes('critical') || 
                                               section.title.toLowerCase().includes('issues') ||
                                               section.title.toLowerCase().includes('problems');
                              const isPositive = section.title.toLowerCase().includes('strengths') ||
                                               section.title.toLowerCase().includes('good');
                              const isAction = section.title.toLowerCase().includes('action') ||
                                             section.title.toLowerCase().includes('next steps') ||
                                             section.title.toLowerCase().includes('fix') ||
                                             section.title.toLowerCase().includes('recommendation');
                              const isScore = section.title.toLowerCase().includes('score') ||
                                            section.title.toLowerCase().includes('breakdown') ||
                                            section.title.toLowerCase().includes('evaluation');
                              
                              let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                              let badgeIcon = '📋';
                              
                              if (isNegative) {
                                badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                                badgeIcon = '⚠️';
                              } else if (isPositive) {
                                badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                                badgeIcon = '✅';
                              } else if (isAction) {
                                badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                                badgeIcon = '🎯';
                              } else if (isScore) {
                                badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                                badgeIcon = '📊';
                              }
                              
                              // Parse content - check for different formatting types
                              const contentLines = section.content.split('\n').filter(l => l.trim());
                              const hasNumberedList = /^\d+\.\s/.test(section.content);
                              const hasBulletPoints = section.content.includes('•');
                              
                              return (
                                <div key={idx} className="mb-6 last:mb-0">
                                  {/* Section Header with Badge */}
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${badgeColor} mb-3`}>
                                    <span>{badgeIcon}</span>
                                    <span>{section.title}</span>
                                  </div>
                                  
                                  {/* Section Content */}
                                  <div className="ml-1">
                                    {hasNumberedList ? (
                                      // Numbered list
                                      <ol className="list-decimal list-inside space-y-2">
                                        {section.content.split(/\n(?=\d+\.)/).map((line, i) => {
                                          const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                                          return cleanLine ? (
                                            <li key={i} className="leading-relaxed text-base pl-2">
                                              <span className="ml-2">{cleanLine}</span>
                                            </li>
                                          ) : null;
                                        })}
                                      </ol>
                                    ) : hasBulletPoints ? (
                                      // Bullet points
                                      <ul className="space-y-2">
                                        {contentLines.map((line, i) => (
                                          <li key={i} className="leading-relaxed text-base flex items-start gap-2">
                                            {line.trim().startsWith('•') ? (
                                              <>
                                                <span className="text-blue-500 mt-1">•</span>
                                                <span className="flex-1">{line.replace(/^•\s*/, '').trim()}</span>
                                              </>
                                            ) : (
                                              <span>{line}</span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      // Plain text paragraph(s)
                                      <div className="space-y-2">
                                        {contentLines.map((line, i) => (
                                          <p key={i} className="leading-relaxed text-base">{line}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    </div>

                    {/* Strengths */}
                    {projectEvaluation.strengths && projectEvaluation.strengths.length > 0 && (
                      <div className={`${themeClasses.sectionBackground} rounded-lg p-4 mb-4 border ${themeClasses.cardBorder}`}>
                        <h4 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {projectEvaluation.strengths.map((strength, idx) => (
                            <li key={idx} className={`flex items-start gap-2 ${themeClasses.textSecondary} text-sm`}>
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {projectEvaluation.weaknesses && projectEvaluation.weaknesses.length > 0 && (
                      <div className={`${themeClasses.sectionBackground} rounded-lg p-4 mb-4 border ${themeClasses.cardBorder}`}>
                        <h4 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {projectEvaluation.weaknesses.map((weakness, idx) => (
                            <li key={idx} className={`flex items-start gap-2 ${themeClasses.textSecondary} text-sm`}>
                              <span className="text-yellow-500 mt-1">!</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvement Suggestions */}
                    {projectEvaluation.improvements && projectEvaluation.improvements.length > 0 && (
                      <div className={`${themeClasses.sectionBackground} rounded-lg p-4 border ${themeClasses.cardBorder}`}>
                        <h4 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                          </svg>
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {projectEvaluation.improvements.map((improvement, idx) => (
                            <li key={idx} className={`flex items-start gap-2 ${themeClasses.textSecondary} text-sm`}>
                              <span className="text-blue-500 mt-1">→</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'progress' && (
            <div className="space-y-8">
              {/* Header */}
              <div className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>Progress Tracking</h2>
                    <p className={`${themeClasses.textSecondary} mt-2`}>Monitor your learning journey and skill development</p>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Test Analysis Report of Skills - Collapsible */}
              <div className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20 overflow-hidden`}>
                {/* Header - Clickable */}
                <button
                  onClick={() => {
                    if (!showTestAnalysis && !testAnalysisData) {
                      fetchTestAnalysisData();
                    } else {
                      setShowTestAnalysis(!showTestAnalysis);
                    }
                  }}
                  className="w-full p-6 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-tech-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3a2 2 0 002 2h12zM7 16v1a2 2 0 002 2h6a2 2 0 002-2v-1" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Test Analysis Report of Skills</h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>Click to view your detailed skill assessment</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {loadingTestAnalysis && (
                      <svg className="animate-spin h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <svg 
                      className={`w-6 h-6 text-amber-500 dark:text-pink-400 transition-transform duration-200 ${showTestAnalysis ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Content */}
                {showTestAnalysis && (
                  <div className={`border-t ${themeClasses.cardBorder} dark:border-pink-500/20 p-6 bg-amber-50/50 dark:bg-[#2a2438]/50`}>
                    {testAnalysisError && (
                      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border ${themeClasses.cardBorder} dark:border-yellow-800 rounded-xl p-4 mb-4`}>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-yellow-800 dark:text-yellow-300">{testAnalysisError}</p>
                        </div>
                      </div>
                    )}

                    {testAnalysisData && (
                      <div className="space-y-6 animate-fadeIn">
                        {/* Overall Performance */}
                        <div className={`${themeClasses.cardBackground} rounded-xl p-6 border-2 ${themeClasses.cardBorder}`}>
                          <div className="text-center mb-6">
                            <div className={`text-5xl font-bold ${themeClasses.gradient} bg-clip-text text-transparent mb-2`}>
                              {testAnalysisData.overallPerformance?.scorePercentage || 
                               testAnalysisData.overall_performance?.score_percentage || 
                               testAnalysisData.overallPerformance?.score || 0}%
                            </div>
                            <div className={`text-sm ${themeClasses.textSecondary}`}>Overall Score</div>
                            {testAnalysisData.summary && (
                              <p className={`${themeClasses.textSecondary} mt-3`}>{testAnalysisData.summary}</p>
                            )}
                          </div>
                        </div>

                        {/* Skill-wise Analysis */}
                        <div className={`${themeClasses.cardBackground} rounded-xl p-6 border-2 ${themeClasses.cardBorder}`}>
                          <h4 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-4`}>Skill-wise Analysis</h4>
                          <div className="space-y-4">
                            {(testAnalysisData.skillAnalysis || testAnalysisData.skill_analysis || testAnalysisData.skill_performance || []).map((skill, index) => (
                              <div key={index} className={`p-4 bg-amber-50 dark:bg-[#2a2438] rounded-lg border ${themeClasses.cardBorder} dark:border-pink-500/20`}>
                                <div className="flex justify-between items-center mb-3">
                                  <span className={`font-semibold ${themeClasses.textPrimary}`}>
                                    {skill.skill || skill.name || skill.topic || 'General'}
                                  </span>
                                  <span className="text-sm font-medium text-amber-600 dark:text-pink-400">
                                    {skill.score || skill.percentage || skill.percentageScore || 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-amber-100 dark:bg-pink-500/20 rounded-full h-3 mb-3">
                                  <div 
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500" 
                                    style={{ width: `${skill.score || skill.percentage || skill.percentageScore || 0}%` }}
                                  ></div>
                                </div>
                                
                                {skill.missingTopics && skill.missingTopics.length > 0 && (
                                  <div className="mt-3">
                                    <div className={`text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>Missing Topics:</div>
                                    <ul className={`list-disc list-inside text-sm ${themeClasses.textSecondary} space-y-1`}>
                                      {skill.missingTopics.map((topic, idx) => (
                                        <li key={idx}>{topic}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {skill.feedback && (
                                  <div className="mt-3 p-3 bg-amber-100 dark:bg-pink-500/10 rounded-lg">
                                    <div className="text-sm font-semibold text-amber-900 dark:text-pink-300 mb-1">Feedback:</div>
                                    <div className="text-sm text-amber-800 dark:text-amber-200">{skill.feedback}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {!testAnalysisData && !testAnalysisError && !loadingTestAnalysis && (
                      <div className="text-center py-8 text-amber-600 dark:text-gray-400">
                        <p>Click the header to load your test analysis</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Weekly Test Analysis - Collapsible */}
              <div id="weekly-test-analysis-section" className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20 overflow-hidden`}>
                {/* Header - Clickable */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🖱️ [Weekly Test Analysis] Button clicked');
                    console.log('🔍 [Weekly Test Analysis] Current state:', {
                      showWeeklyTestAnalysis,
                      weeklyTestAnalysisData,
                      loadingWeeklyTestAnalysis
                    });
                    
                    if (!showWeeklyTestAnalysis) {
                      // Opening the section - always fetch fresh data from database
                      console.log('▶️ [Weekly Test Analysis] Opening section - fetching fresh data...');
                      fetchWeeklyTestAnalysisData();
                    } else {
                      // Closing the section
                      console.log('🔽 [Weekly Test Analysis] Closing section');
                      setShowWeeklyTestAnalysis(false);
                    }
                  }}
                  className="w-full p-6 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-tech-gray-800 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Weekly Test Analysis</h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>Click to view your weekly test performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {loadingWeeklyTestAnalysis && (
                      <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <svg 
                      className={`w-6 h-6 text-purple-500 dark:text-pink-400 transition-transform duration-200 ${showWeeklyTestAnalysis ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Content */}
                {showWeeklyTestAnalysis && (
                  <div className={`border-t ${themeClasses.cardBorder} dark:border-pink-500/20 p-6 bg-purple-50/50 dark:bg-[#2a2438]/50`}>
                    {weeklyTestAnalysisError && (
                      <div className={`bg-red-50 dark:bg-red-900/20 border ${themeClasses.cardBorder} dark:border-red-800 rounded-xl p-4 mb-4`}>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-red-800 dark:text-red-300">{weeklyTestAnalysisError}</p>
                        </div>
                      </div>
                    )}

                    {/* Hierarchical Month/Week Structure */}
                    {weeklyTestAnalysisData && weeklyTestAnalysisData.months && weeklyTestAnalysisData.months.length > 0 && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Summary Header */}
                        <div className={`${themeClasses.cardBackground} rounded-xl p-4 border-2 ${themeClasses.cardBorder}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className={`font-semibold ${themeClasses.textPrimary}`}>Weekly Test Analysis Summary</h4>
                                <p className={`text-sm ${themeClasses.textSecondary}`}>
                                  {weeklyTestAnalysisData.total_analyses} analysis report{weeklyTestAnalysisData.total_analyses !== 1 ? 's' : ''} across {weeklyTestAnalysisData.months.length} month{weeklyTestAnalysisData.months.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Months List */}
                        {weeklyTestAnalysisData.months.map((month, monthIndex) => (
                          <div key={monthIndex} className={`${themeClasses.cardBackground} rounded-xl border-2 ${themeClasses.cardBorder} overflow-hidden`}>
                            {/* Month Header - Clickable */}
                            <button
                              onClick={() => toggleMonth(monthIndex)}
                              className="w-full p-4 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-[#2a2438] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold">{month.month}</span>
                                </div>
                                <div className="text-left">
                                  <h5 className={`font-semibold ${themeClasses.textPrimary}`}>{month.month_label}</h5>
                                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                                    {month.weeks.length} week{month.weeks.length !== 1 ? 's' : ''} of analysis
                                  </p>
                                </div>
                              </div>
                              <svg 
                                className={`w-5 h-5 text-purple-500 dark:text-pink-400 transition-transform duration-200 ${expandedMonths[monthIndex] ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Weeks inside Month */}
                            {expandedMonths[monthIndex] && (
                              <div className="border-t border-purple-200 dark:border-pink-500/20 bg-purple-50/50 dark:bg-[#2a2438]/50 p-4 space-y-3">
                                {month.weeks.map((week, weekIndex) => (
                                  <div key={weekIndex} className={`${themeClasses.cardBackground} rounded-lg border-2 ${themeClasses.cardBorder} overflow-hidden`}>
                                    {/* Week Header - Clickable */}
                                    <button
                                      onClick={() => toggleWeek(monthIndex, weekIndex)}
                                      className="w-full p-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-[#2a2438] transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                                          <span className="text-white text-sm font-bold">{week.week}</span>
                                        </div>
                                        <div className="text-left">
                                          <h6 className={`font-medium ${themeClasses.textPrimary}`}>{week.week_label}</h6>
                                          {week.analysis?.score_summary && (
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                week.analysis.score_summary.passed 
                                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                              }`}>
                                                {week.analysis.score_summary.passed ? 'Passed' : 'Needs Work'}
                                              </span>
                                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                {week.analysis.score_summary.percentage}%
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <svg 
                                        className={`w-4 h-4 text-purple-500 dark:text-pink-400 transition-transform duration-200 ${expandedWeeks[`${monthIndex}-${weekIndex}`] ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>

                                    {/* Week Analysis Content */}
                                    {expandedWeeks[`${monthIndex}-${weekIndex}`] && week.analysis && (
                                      <div className="border-t border-purple-200 dark:border-pink-500/20 p-4 space-y-4 bg-purple-50/30 dark:bg-[#1e1a2e]/50">
                                        {/* Score Summary */}
                                        {week.analysis.score_summary && (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {week.analysis.score_summary.percentage || 0}%
                                              </div>
                                              <div className={`text-xs ${themeClasses.textSecondary}`}>Score</div>
                                            </div>
                                            <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {week.analysis.score_summary.correct || 0}
                                              </div>
                                              <div className={`text-xs ${themeClasses.textSecondary}`}>Correct</div>
                                            </div>
                                            <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {week.analysis.score_summary.incorrect || 0}
                                              </div>
                                              <div className={`text-xs ${themeClasses.textSecondary}`}>Incorrect</div>
                                            </div>
                                            <div className="bg-amber-100 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                                              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                {week.analysis.score_summary.total_questions || 0}
                                              </div>
                                              <div className={`text-xs ${themeClasses.textSecondary}`}>Total</div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Topic Analysis */}
                                        {week.analysis.topic_analysis && week.analysis.topic_analysis.length > 0 && (
                                          <div className={`${themeClasses.cardBackground} rounded-lg p-4 border-2 ${themeClasses.cardBorder}`}>
                                            <h6 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                              </svg>
                                              Topic Analysis
                                            </h6>
                                            <div className="space-y-2">
                                              {week.analysis.topic_analysis.map((topic, topicIndex) => (
                                                <div key={topicIndex} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-[#2a2438] rounded-lg">
                                                  <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>{topic.topic}</span>
                                                  <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                      topic.strength_level === 'Strong' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                      topic.strength_level === 'Moderate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    }`}>
                                                      {topic.strength_level}
                                                    </span>
                                                    <span className="text-sm font-medium text-purple-600 dark:text-pink-400">
                                                      {topic.accuracy_percentage}%
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Mistake Patterns */}
                                        {week.analysis.mistake_patterns && week.analysis.mistake_patterns.length > 0 && (
                                          <div className={`bg-white dark:bg-[#1e1a2e]/80 rounded-lg p-4 border ${themeClasses.cardBorder} dark:border-red-500/20`}>
                                            <h6 className={`font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                              </svg>
                                              Areas for Improvement ({week.analysis.mistake_patterns.length})
                                            </h6>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                              {week.analysis.mistake_patterns.map((mistake, mistakeIndex) => (
                                                <div key={mistakeIndex} className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm">
                                                  <p className={`font-medium ${themeClasses.textPrimary} mb-1`}>{mistakeIndex + 1}. {mistake.question_text}</p>
                                                  <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="text-red-600 dark:text-red-400">Your: {mistake.user_answer}</span>
                                                    <span className="text-green-600 dark:text-green-400">Correct: {mistake.correct_answer}</span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Overall Feedback */}
                                        {week.analysis.overall_feedback && (
                                          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-500/20">
                                            <h6 className={`font-semibold ${themeClasses.textPrimary} mb-2 flex items-center gap-2`}>
                                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                              </svg>
                                              Feedback
                                            </h6>
                                            <p className={`text-sm ${themeClasses.textSecondary}`}>{week.analysis.overall_feedback}</p>
                                          </div>
                                        )}

                                        {/* Recommendations */}
                                        {week.analysis.recommendations && week.analysis.recommendations.length > 0 && (
                                          <div className={`bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border ${themeClasses.cardBorder} dark:border-green-500/20`}>
                                            <h6 className={`font-semibold ${themeClasses.textPrimary} mb-2 flex items-center gap-2`}>
                                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                              </svg>
                                              Recommendations
                                            </h6>
                                            <ul className="space-y-1">
                                              {week.analysis.recommendations.map((rec, recIndex) => (
                                                <li key={recIndex} className={`text-sm ${themeClasses.textSecondary} flex items-start gap-2`}>
                                                  <span className="text-green-500 mt-1">•</span>
                                                  {rec}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback for old data format with single analysis */}
                    {weeklyTestAnalysisData && weeklyTestAnalysisData.analysis && !weeklyTestAnalysisData.months && (
                      <div className="space-y-6 animate-fadeIn">
                        {/* Header with Title and Score */}
                        <div className="bg-white dark:bg-[#1e1a2e]/80 rounded-xl p-6 border border-purple-200 dark:border-pink-500/20">
                          <div className="text-center mb-6">
                            <h4 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
                              {weeklyTestAnalysisData.analysis.analysis_title || 'Weekly Test Analysis'}
                            </h4>
                            <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                              Week {weeklyTestAnalysisData.analysis.week || 1} • Month {weeklyTestAnalysisData.analysis.month || 1}
                            </p>
                            
                            {/* Score Summary */}
                            {weeklyTestAnalysisData.analysis.score_summary && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {weeklyTestAnalysisData.analysis.score_summary.percentage || 0}%
                                  </div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Overall Score</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {weeklyTestAnalysisData.analysis.score_summary.correct || 0}
                                  </div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Correct</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {weeklyTestAnalysisData.analysis.score_summary.incorrect || 0}
                                  </div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Incorrect</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                    {weeklyTestAnalysisData.analysis.score_summary.total_questions || 0}
                                  </div>
                                  <div className={`text-sm ${themeClasses.textSecondary}`}>Total Questions</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No data message */}
                    {weeklyTestAnalysisData && !weeklyTestAnalysisData.months && !weeklyTestAnalysisData.analysis && (
                      <div className="bg-white dark:bg-[#1e1a2e]/80 rounded-xl p-6 border border-purple-200 dark:border-pink-500/20">
                        <div className="text-center py-4">
                          <svg className="w-12 h-12 mx-auto text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-amber-700 dark:text-gray-300">
                            No analysis data available yet.
                          </p>
                        </div>
                      </div>
                    )}

                    {!weeklyTestAnalysisData && !weeklyTestAnalysisError && !loadingWeeklyTestAnalysis && (
                      <div className="text-center py-8 text-purple-600 dark:text-gray-400">
                        <p>Click the header to view your weekly test analysis</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Weekly Progress - Month/Week Breakdown */}
              <div className="bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-200/50 dark:border-pink-500/20 overflow-hidden mt-6">
                {/* Header - Clickable to Toggle */}
                <button
                  onClick={() => {
                    if (!showWeeklyProgress && !weeklyTestAnalysisData) {
                      // Fetch data if not already loaded
                      fetchWeeklyTestAnalysisData();
                    }
                    setShowWeeklyProgress(!showWeeklyProgress);
                  }}
                  className="w-full p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-indigo-900 dark:text-white">📊 Weekly Progress Tracker</h3>
                        <p className="text-sm text-indigo-700 dark:text-gray-400">Click to view your performance across all weeks and months</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {loadingWeeklyTestAnalysis && (
                        <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <svg 
                        className={`w-6 h-6 text-indigo-500 dark:text-purple-400 transition-transform duration-200 ${showWeeklyProgress ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Progress Content - Collapsible */}
                {showWeeklyProgress && (
                  <div className="p-6 space-y-4 border-t border-indigo-200 dark:border-indigo-800/50">
                    {weeklyTestAnalysisError && (
                      <div className={`bg-red-50 dark:bg-red-900/20 border ${themeClasses.cardBorder} dark:border-red-800 rounded-xl p-4 mb-4`}>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-red-800 dark:text-red-300">{weeklyTestAnalysisError}</p>
                        </div>
                      </div>
                    )}

                    {loadingWeeklyTestAnalysis && !weeklyTestAnalysisData && (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-pink-500 mb-4"></div>
                        <p className="text-indigo-700 dark:text-gray-400">Loading your progress data...</p>
                      </div>
                    )}

                    {!loadingWeeklyTestAnalysis && weeklyTestAnalysisData && weeklyTestAnalysisData.months && weeklyTestAnalysisData.months.length > 0 ? (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800/50">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {weeklyTestAnalysisData.total_analyses || weeklyTestAnalysisData.months.reduce((sum, m) => sum + (m.weeks?.length || 0), 0)}
                          </div>
                          <div className="text-xs text-indigo-700 dark:text-gray-400">Total Tests</div>
                        </div>
                        <div className={`bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-4 border ${themeClasses.cardBorder} dark:border-green-800/50`}>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {weeklyTestAnalysisData.months.length}
                          </div>
                          <div className="text-xs text-green-700 dark:text-gray-400">Months</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800/50 col-span-2 md:col-span-1">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Math.round(
                              weeklyTestAnalysisData.months.reduce((sum, m) => {
                                const monthAvg = m.weeks && m.weeks.length > 0 
                                  ? m.weeks.reduce((acc, w) => acc + (w.analysis?.score_summary?.percentage || 0), 0) / m.weeks.length 
                                  : 0;
                                return sum + monthAvg;
                              }, 0) / weeklyTestAnalysisData.months.length
                            )}%
                          </div>
                          <div className="text-xs text-purple-700 dark:text-gray-400">Overall Average</div>
                        </div>
                      </div>

                      {/* Month/Week Breakdown */}
                      {weeklyTestAnalysisData.months.map((month, monthIndex) => {
                        const monthAverage = month.weeks && month.weeks.length > 0 
                          ? Math.round(month.weeks.reduce((acc, w) => acc + (w.analysis?.score_summary?.percentage || 0), 0) / month.weeks.length)
                          : 0;
                        
                        return (
                          <div key={monthIndex} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/50 overflow-hidden">
                            {/* Month Header - Collapsible */}
                            <button
                              onClick={() => toggleMonth(monthIndex)}
                              className="w-full p-4 flex items-center justify-between hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                                  <span className="text-white font-bold text-lg">{month.month}</span>
                                </div>
                                <div className="text-left">
                                  <h4 className="font-bold text-indigo-900 dark:text-white">
                                    {month.month_label || `Month ${month.month}`}
                                  </h4>
                                  <p className="text-xs text-indigo-700 dark:text-gray-400">
                                    {month.weeks?.length || 0} week{month.weeks?.length !== 1 ? 's' : ''} completed
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Overall Month Progress */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <div className="w-32 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                      className={`h-full transition-all duration-500 ${
                                        monthAverage >= 75 
                                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                          : monthAverage >= 50
                                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                                      }`}
                                      style={{ width: `${monthAverage}%` }}
                                    />
                                  </div>
                                  <span className={`text-sm font-bold min-w-[45px] ${
                                    monthAverage >= 75 
                                      ? 'text-green-600 dark:text-green-400'
                                      : monthAverage >= 50
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : 'text-orange-600 dark:text-orange-400'
                                  }`}>
                                    {monthAverage}%
                                  </span>
                                </div>
                                <svg 
                                  className={`w-6 h-6 text-indigo-500 dark:text-purple-400 transition-transform duration-200 ${expandedMonths[monthIndex] ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                        {/* Weeks List - Collapsible */}
                        {expandedMonths[monthIndex] && month.weeks && month.weeks.length > 0 && (
                          <div className="p-4 space-y-3 bg-white/50 dark:bg-[#1e1a2e]/50 border-t border-indigo-200 dark:border-indigo-800/50">
                            {month.weeks.map((week, weekIndex) => {
                              const weekPercentage = week.analysis?.score_summary?.percentage || 0;
                              const weekCorrect = week.analysis?.score_summary?.correct || 0;
                              const weekIncorrect = week.analysis?.score_summary?.incorrect || 0;
                              const weekTotal = week.analysis?.score_summary?.total_questions || 0;
                              
                              return (
                                <div key={weekIndex} className={`${themeClasses.cardBackground} rounded-lg border-2 ${themeClasses.cardBorder} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                                  {/* Week Header */}
                                  <button
                                    onClick={() => toggleWeek(monthIndex, weekIndex)}
                                    className="w-full p-3 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <span className="text-white font-bold text-sm">{week.week}</span>
                                      </div>
                                      <span className={`font-semibold ${themeClasses.textPrimary}`}>
                                        {week.week_label || `Week ${week.week}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {/* Week Progress Bar */}
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 sm:w-32 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                            className={`h-full transition-all duration-500 ${
                                              weekPercentage >= 75 
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                : weekPercentage >= 50
                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                : 'bg-gradient-to-r from-red-500 to-pink-600'
                                            }`}
                                            style={{ width: `${weekPercentage}%` }}
                                          />
                                        </div>
                                        <span className={`text-sm font-bold min-w-[50px] ${
                                          weekPercentage >= 75 
                                            ? 'text-green-600 dark:text-green-400'
                                            : weekPercentage >= 50
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                          {weekPercentage}%
                                        </span>
                                      </div>
                                      <svg 
                                        className={`w-5 h-5 text-indigo-500 dark:text-purple-400 transition-transform duration-200 ${expandedWeeks[`${monthIndex}-${weekIndex}`] ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>

                                  {/* Week Details - Collapsible */}
                                  {expandedWeeks[`${monthIndex}-${weekIndex}`] && week.analysis && (
                                    <div className="p-4 bg-indigo-50/50 dark:bg-[#2a2438]/50 border-t border-indigo-100 dark:border-indigo-900/50 space-y-3">
                                      {/* Score Summary Cards */}
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className={`${themeClasses.cardBackground} rounded-lg p-3 text-center border-2 border-green-300 dark:border-green-700/50 shadow-sm`}>
                                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                            {weekCorrect}
                                          </div>
                                          <div className={`text-xs ${themeClasses.textSecondary} font-medium`}>✓ Correct</div>
                                        </div>
                                        <div className={`${themeClasses.cardBackground} rounded-lg p-3 text-center border-2 border-red-300 dark:border-red-700/50 shadow-sm`}>
                                          <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                            {weekIncorrect}
                                          </div>
                                          <div className={`text-xs ${themeClasses.textSecondary} font-medium`}>✗ Incorrect</div>
                                        </div>
                                        <div className={`${themeClasses.cardBackground} rounded-lg p-3 text-center border-2 border-indigo-300 dark:border-indigo-700/50 shadow-sm`}>
                                          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {weekTotal}
                                          </div>
                                          <div className={`text-xs ${themeClasses.textSecondary} font-medium`}>Total</div>
                                        </div>
                                      </div>

                                      {/* Performance Badge */}
                                      <div className={`text-center py-2 px-3 rounded-lg font-semibold text-sm ${
                                        weekPercentage >= 75 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                          : weekPercentage >= 50
                                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                                      }`}>
                                        {weekPercentage >= 75 ? '🌟 Excellent Performance!' : weekPercentage >= 50 ? '👍 Good Job!' : '💪 Keep Practicing!'}
                                      </div>

                                      {/* Topic Analysis */}
                                      {week.analysis.topic_analysis && week.analysis.topic_analysis.length > 0 && (
                                        <div className={`${themeClasses.cardBackground} rounded-lg p-3 border-2 ${themeClasses.cardBorder} shadow-sm`}>
                                          <h6 className={`text-xs font-bold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Topics Performance
                                          </h6>
                                          <div className="space-y-2.5">
                                            {week.analysis.topic_analysis.map((topic, topicIndex) => (
                                              <div key={topicIndex} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                  <span className={`text-xs font-medium ${themeClasses.textPrimary} dark:text-gray-300`}>
                                                    {topic.topic}
                                                  </span>
                                                  <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                      topic.strength_level === 'Strong' 
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : topic.strength_level === 'Moderate'
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    }`}>
                                                      {topic.strength_level}
                                                    </span>
                                                    <span className="text-xs font-bold text-purple-600 dark:text-pink-400">
                                                      {topic.accuracy_percentage}%
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                                  <div 
                                                    className={`h-full transition-all duration-500 ${
                                                      topic.strength_level === 'Strong' 
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                        : topic.strength_level === 'Moderate'
                                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                        : 'bg-gradient-to-r from-red-500 to-pink-600'
                                                    }`}
                                                    style={{ width: `${topic.accuracy_percentage}%` }}
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </>
                  ) : (
                    <div className={`${themeClasses.cardBackground} rounded-xl p-8 border-2 ${themeClasses.cardBorder}`}>
                      <div className="text-center">
                        <svg className={`w-16 h-16 mx-auto ${themeClasses.textSecondary} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className={`${themeClasses.textPrimary} mb-2`}>No progress data available yet</p>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>Complete weekly tests to see your progress here</p>
                      </div>
                    </div>
                  )}
                  </div>
                )}

                {!loadingWeeklyTestAnalysis && !weeklyTestAnalysisData && !weeklyTestAnalysisError && showWeeklyProgress && (
                  <div className="p-6 border-t border-indigo-200 dark:border-indigo-800/50">
                    <div className="text-center py-8 text-indigo-600 dark:text-gray-400">
                      <p>Click the header to load your progress data</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly Test Analysis - Collapsible */}
              <div id="monthly-test-analysis-section" className="bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-200/50 dark:border-pink-500/20 overflow-hidden mt-6">
                {/* Header - Clickable */}
                <button
                  onClick={async () => {
                    if (!showMonthlyTestAnalysis) {
                      // Opening - fetch data
                      setShowMonthlyTestAnalysis(true);
                      fetchMonthlyAnalysisData();
                    } else {
                      // Closing
                      setShowMonthlyTestAnalysis(false);
                    }
                  }}
                  className="w-full p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-tech-gray-800 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Monthly Test Analysis</h3>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>Click to view your comprehensive monthly test performance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {loadingMonthlyTestAnalysis && (
                      <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <svg 
                      className={`w-6 h-6 text-purple-500 dark:text-pink-400 transition-transform duration-200 ${showMonthlyTestAnalysis ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Content */}
                {showMonthlyTestAnalysis && (
                  <div className="border-t border-purple-200 dark:border-pink-500/20 p-6 bg-purple-50/30 dark:bg-[#2a2438]/50">
                    {monthlyTestAnalysisError && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-purple-800 dark:text-purple-300">{monthlyTestAnalysisError}</p>
                        </div>
                      </div>
                    )}

                    {monthlyTestAnalysisData && monthlyTestAnalysisData.length > 0 ? (
                      <div className="space-y-4">
                        {monthlyTestAnalysisData.map((analysis, index) => {
                          // Determine if this is a retake by checking testAttempt
                          const isRetake = analysis.testAttempt && analysis.testAttempt > 1;
                          const attemptLabel = isRetake ? ` - Attempt ${analysis.testAttempt}` : '';
                          const monthKey = `${analysis.month}_${analysis.testAttempt || 1}`;
                          const isMonthExpanded = expandedMonthlyAnalysis[monthKey];
                          
                          // Calculate wrong count from raw data
                          const wrongCount = analysis.rawTestData?.wrongAnswers || analysis.rawTestData?.incorrectAnswers || 
                            (analysis.rawTestData?.totalQuestions ? analysis.rawTestData.totalQuestions - (analysis.rawTestData.correctAnswers || 0) : 0);
                          
                          return (
                          <div key={analysis._id || index} className={`${themeClasses.cardBackground} rounded-xl border-2 ${themeClasses.cardBorder} overflow-hidden shadow-sm`}>
                            {/* Month Header - Clickable Accordion */}
                            <button
                              onClick={() => setExpandedMonthlyAnalysis(prev => ({ ...prev, [monthKey]: !prev[monthKey] }))}
                              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white hover:from-purple-600 hover:to-indigo-700 transition-all"
                              type="button"
                            >
                              <div className="flex justify-between items-center">
                                <div className="text-left">
                                  <h4 className="text-xl font-bold flex items-center gap-2">
                                    Month {analysis.month} Analysis
                                    {analysis.testAttempt && analysis.testAttempt > 1 && (
                                      <span className="text-sm bg-white/20 px-2 py-1 rounded">Attempt {analysis.testAttempt}</span>
                                    )}
                                  </h4>
                                  <p className="text-sm opacity-90">Generated: {new Date(analysis.analysisDate).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-3xl font-bold">{analysis.rawTestData?.percentage || 0}%</div>
                                    <div className="text-sm opacity-90">{analysis.overallPerformance?.grade || 'N/A'}</div>
                                  </div>
                                  <svg 
                                    className={`w-6 h-6 transition-transform duration-200 ${isMonthExpanded ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </button>

                            {/* Analysis Content - Collapsible */}
                            {isMonthExpanded && (
                            <div className="p-6 space-y-6">
                              {/* Overall Performance */}
                              {analysis.overallPerformance && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg">
                                  <h5 className="font-bold text-purple-800 dark:text-purple-300 mb-2">📊 Overall Performance</h5>
                                  <p className={`${themeClasses.textPrimary} dark:text-gray-300 mb-3`}>{analysis.overallPerformance.summary}</p>
                                  <div className="flex gap-3">
                                    <span className="bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">
                                      {analysis.overallPerformance.grade}
                                    </span>
                                    <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-semibold">
                                      {analysis.overallPerformance.percentile}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Test Statistics */}
                              {analysis.rawTestData && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysis.rawTestData.totalQuestions}</div>
                                    <div className={`text-xs ${themeClasses.textSecondary}`}>Questions</div>
                                  </div>
                                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analysis.rawTestData.scoredMarks}/{analysis.rawTestData.totalMarks}</div>
                                    <div className={`text-xs ${themeClasses.textSecondary}`}>Marks</div>
                                  </div>
                                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analysis.rawTestData.percentage}%</div>
                                    <div className={`text-xs ${themeClasses.textSecondary}`}>Score</div>
                                  </div>
                                  <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{wrongCount}</div>
                                    <div className={`text-xs ${themeClasses.textSecondary}`}>Wrong</div>
                                  </div>
                                </div>
                              )}

                              {/* Topic-wise Analysis */}
                              {analysis.topicWiseAnalysis && analysis.topicWiseAnalysis.length > 0 && (
                                <div>
                                  <h5 className={`font-bold ${themeClasses.textPrimary} mb-3`}>📚 Topic-wise Performance</h5>
                                  <div className="space-y-2">
                                    {analysis.topicWiseAnalysis.map((topic, idx) => (
                                      <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{topic.topic.substring(0, 60)}...</span>
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            topic.performance === 'Strong' ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            topic.performance === 'Average' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                            'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                          }`}>
                                            {topic.performance}
                                          </span>
                                        </div>
                                        <div className={`flex justify-between text-xs ${themeClasses.textSecondary}`}>
                                          <span>Accuracy: <strong className="text-purple-600 dark:text-purple-400">{topic.accuracy}%</strong></span>
                                          <span>Score: <strong className="text-green-600 dark:text-green-400">{topic.correct}/{topic.totalQuestions}</strong></span>
                                          <span>Marks: <strong>{topic.marksScored}/{topic.totalMarks}</strong></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Difficulty Analysis */}
                              {analysis.difficultyAnalysis && (
                                <div>
                                  <h5 className={`font-bold ${themeClasses.textPrimary} dark:text-white mb-3`}>⚡ Difficulty Level Analysis</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                      <h6 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Medium Questions</h6>
                                      <div className="space-y-1 text-sm">
                                        <p>Total: <strong>{analysis.difficultyAnalysis.medium.total}</strong></p>
                                        <p>Correct: <strong className="text-green-600 dark:text-green-400">{analysis.difficultyAnalysis.medium.correct}</strong></p>
                                        <p>Accuracy: <strong className="text-blue-600 dark:text-blue-400">{analysis.difficultyAnalysis.medium.accuracy}%</strong></p>
                                      </div>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                      <h6 className="font-semibold text-red-800 dark:text-red-300 mb-2">Hard Questions</h6>
                                      <div className="space-y-1 text-sm">
                                        <p>Total: <strong>{analysis.difficultyAnalysis.hard.total}</strong></p>
                                        <p>Correct: <strong className="text-green-600 dark:text-green-400">{analysis.difficultyAnalysis.hard.correct}</strong></p>
                                        <p>Accuracy: <strong className="text-red-600 dark:text-red-400">{analysis.difficultyAnalysis.hard.accuracy}%</strong></p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Strengths & Weaknesses */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis.strengths && analysis.strengths.length > 0 && (
                                  <div>
                                    <h5 className="font-bold text-green-800 dark:text-green-300 mb-2">💪 Strengths</h5>
                                    <ul className="space-y-1 text-sm">
                                      {analysis.strengths.slice(0, 3).map((strength, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-green-600 dark:text-green-400">✓</span>
                                          <span className={`${themeClasses.textPrimary} dark:text-gray-300`}>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                                  <div>
                                    <h5 className="font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Areas to Improve</h5>
                                    <ul className="space-y-1 text-sm">
                                      {analysis.weaknesses.slice(0, 3).map((weakness, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <span className="text-red-600 dark:text-red-400">→</span>
                                          <span className={`${themeClasses.textPrimary} dark:text-gray-300`}>{weakness}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {/* Recommendations */}
                              {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div>
                                  <h5 className="font-bold text-purple-800 dark:text-purple-300 mb-3">🎯 Top Recommendations</h5>
                                  <div className="space-y-2">
                                    {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                                      <div key={idx} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-purple-500">
                                        <div className="flex justify-between items-start mb-1">
                                          <h6 className={`font-semibold text-sm ${themeClasses.textPrimary} dark:text-white`}>{rec.area}</h6>
                                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            rec.priority === 'High' ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                            rec.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                            'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                          }`}>
                                            {rec.priority}
                                          </span>
                                        </div>
                                        <p className={`text-xs ${themeClasses.textPrimary} dark:text-gray-300`}>{rec.action}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Motivational Message */}
                              {analysis.insights?.motivationalMessage && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
                                  <p className={`text-sm italic ${themeClasses.textPrimary} dark:text-gray-300`}>💬 {analysis.insights.motivationalMessage}</p>
                                </div>
                              )}
                            </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      !loadingMonthlyTestAnalysis && !monthlyTestAnalysisError && (
                        <div className="text-center py-12">
                          <svg className="w-16 h-16 mx-auto text-purple-300 dark:text-purple-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className={`${themeClasses.textSecondary}`}>No monthly test analysis available yet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Complete a monthly test and click the analysis button to see your comprehensive performance report</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {activeSection === 'certifications' && (
            <div className="space-y-8">
              {/* Header */}
              <div className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-amber-900 dark:text-white">Recommended Certifications</h2>
                    <p className="text-amber-700 dark:text-gray-400 mt-2">
                      Best Free and Paid Certifications for {linkedResume?.jobSelection?.jobRole ? formatJobRole(linkedResume.jobSelection.jobRole) : 'Your Selected Role'}
                    </p>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Free Certifications Section */}
              <div className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-white">Free Certifications</h3>
                    <p className="text-sm text-amber-600 dark:text-gray-400 mt-1">Start learning without any cost</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                    <span className="text-green-700 dark:text-green-400 font-semibold text-sm">100% Free</span>
                  </div>
                </div>
                
                {loadingCertifications ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <p className="text-amber-700 dark:text-gray-400 mt-4">Loading certifications...</p>
                  </div>
                ) : certificationsError ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400">{certificationsError}</p>
                  </div>
                ) : certificationsData?.free_certifications && certificationsData.free_certifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificationsData.free_certifications.map((cert, index) => {
                      const colors = [
                        { bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: '${themeClasses.cardBorder} dark:border-green-800', icon: 'bg-green-500', badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200', text: 'text-green-900 dark:text-green-400', desc: 'text-green-700 dark:text-gray-400', btn: 'bg-green-500 hover:bg-green-600' },
                        { bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-500', badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200', text: 'text-blue-900 dark:text-blue-400', desc: 'text-blue-700 dark:text-gray-400', btn: 'bg-blue-500 hover:bg-blue-600' },
                        { bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20', border: 'border-purple-200 dark:border-purple-800', icon: 'bg-purple-500', badge: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200', text: 'text-purple-900 dark:text-purple-400', desc: 'text-purple-700 dark:text-gray-400', btn: 'bg-purple-500 hover:bg-purple-600' },
                        { bg: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'bg-indigo-500', badge: 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200', text: 'text-indigo-900 dark:text-indigo-400', desc: 'text-indigo-700 dark:text-gray-400', btn: 'bg-indigo-500 hover:bg-indigo-600' },
                        { bg: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20', border: 'border-teal-200 dark:border-teal-800', icon: 'bg-teal-500', badge: 'bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200', text: 'text-teal-900 dark:text-teal-400', desc: 'text-teal-700 dark:text-gray-400', btn: 'bg-teal-500 hover:bg-teal-600' }
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={index} className={`bg-gradient-to-br ${color.bg} rounded-xl p-6 border ${color.border} hover:shadow-lg transition-shadow`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 ${color.icon} rounded-lg flex items-center justify-center`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className={`${color.badge} text-xs px-2 py-1 rounded`}>FREE</span>
                          </div>
                          <h4 className={`text-lg font-semibold ${color.text} mb-2 line-clamp-2`}>{cert.title}</h4>
                          <p className={`text-sm ${color.desc} mb-2 font-medium`}>{cert.platform}</p>
                          <p className={`text-xs ${color.desc} mb-4 line-clamp-3`}>{cert.description}</p>
                          <a 
                            href={cert.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`w-full block text-center ${color.btn} text-white py-2 rounded-lg transition-colors text-sm font-medium`}
                          >
                            View Certificate
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-amber-700 dark:text-gray-400">No free certifications available</p>
                  </div>
                )}
              </div>

              {/* Paid Certifications Section */}
              <div className={`bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder}/50 dark:border-pink-500/20`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-amber-900 dark:text-white">Paid Certifications</h3>
                    <p className="text-sm text-amber-600 dark:text-gray-400 mt-1">Industry-recognized professional certifications</p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">Premium</span>
                  </div>
                </div>
                
                {loadingCertifications ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                    <p className="text-amber-700 dark:text-gray-400 mt-4">Loading certifications...</p>
                  </div>
                ) : certificationsError ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400">{certificationsError}</p>
                  </div>
                ) : certificationsData?.paid_certifications && certificationsData.paid_certifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificationsData.paid_certifications.map((cert, index) => {
                      const colors = [
                        { bg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20', border: '${themeClasses.cardBorder} dark:border-orange-800', icon: 'from-orange-500 to-amber-500', badge: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200', text: 'text-orange-900 dark:text-orange-400', desc: 'text-orange-700 dark:text-gray-400', btn: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' },
                        { bg: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'from-indigo-500 to-blue-500', badge: 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200', text: 'text-indigo-900 dark:text-indigo-400', desc: 'text-indigo-700 dark:text-gray-400', btn: 'from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600' },
                        { bg: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20', border: 'border-rose-200 dark:border-rose-800', icon: 'from-rose-500 to-pink-500', badge: 'bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200', text: 'text-rose-900 dark:text-rose-400', desc: 'text-rose-700 dark:text-gray-400', btn: 'from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600' },
                        { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200', text: 'text-emerald-900 dark:text-emerald-400', desc: 'text-emerald-700 dark:text-gray-400', btn: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' },
                        { bg: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'from-violet-500 to-purple-500', badge: 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200', text: 'text-violet-900 dark:text-violet-400', desc: 'text-violet-700 dark:text-gray-400', btn: 'from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600' }
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                        <div key={index} className={`bg-gradient-to-br ${color.bg} rounded-xl p-6 border ${color.border} hover:shadow-lg transition-shadow`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${color.icon} rounded-lg flex items-center justify-center`}>
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <span className={`${color.badge} text-xs px-2 py-1 rounded`}>{cert.price || 'PAID'}</span>
                          </div>
                          <h4 className={`text-lg font-semibold ${color.text} mb-2 line-clamp-2`}>{cert.title}</h4>
                          <p className={`text-sm ${color.desc} mb-2 font-medium`}>{cert.platform}</p>
                          <p className={`text-xs ${color.desc} mb-4 line-clamp-3`}>{cert.description}</p>
                          <a 
                            href={cert.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`w-full block text-center bg-gradient-to-r ${color.btn} text-white py-2 rounded-lg transition-colors text-sm font-medium`}
                          >
                            View Certificate
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-amber-700 dark:text-gray-400">No paid certifications available</p>
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          </main>
        </div>
      </div>

      {/* Custom Scrollbar Styles and Animations */}
      <style jsx>{`
        /* Content fade-in animation */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-slideIn {
          animation: slideInRight 0.5s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }

        /* Enhanced Scrollbar styling for sidebar and scrollable containers */
        .sidebar-scrollbar::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.35);
          border-radius: 10px;
          transition: background 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s ease;
        }

        .dark .sidebar-scrollbar::-webkit-scrollbar-thumb,
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.25);
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.65);
          width: 8px;
        }

        .dark .sidebar-scrollbar::-webkit-scrollbar-thumb:hover,
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.45);
        }

        /* Gradient scrollbar for active scrolling with smooth transition */
        .sidebar-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, rgb(251, 191, 36), rgb(245, 158, 11));
          transition: background 0.2s ease;
        }

        .dark .sidebar-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, rgb(236, 72, 153), rgb(219, 39, 119));
          transition: background 0.2s ease;
        }

        /* Firefox */
        .sidebar-scrollbar,
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.35) transparent;
        }

        .dark .sidebar-scrollbar,
        .dark .overflow-y-auto {
          scrollbar-color: rgba(156, 163, 175, 0.25) transparent;
        }

        /* Smooth scroll behavior */
        .sidebar-scrollbar {
          scroll-behavior: smooth;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
        }

        /* Hide scrollbar on mobile when not scrolling */
        @media (max-width: 1023px) {
          .sidebar-scrollbar:not(:hover)::-webkit-scrollbar-thumb {
            background: transparent;
          }
          
          /* Mobile sidebar slide-in animation */
          .sidebar-scrollbar {
            animation: slideInLeft 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        }

        /* Smooth position transitions for sidebar */
        @media (min-width: 1024px) {
          .sidebar-scrollbar {
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        }

        /* Enhance hardware acceleration for smooth animations */
        .sidebar-scrollbar,
        .animate-fadeIn,
        .animate-slideIn,
        .animate-scaleIn {
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }
      `}</style>

      {/* Weekly Test Generation Overlay */}
      {showWeeklyTestOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-[#1e1a2e]/80 rounded-2xl p-8 max-w-md w-full shadow-2xl border ${themeClasses.cardBorder} dark:border-pink-500/20 transform animate-fadeIn`}>
            <div className="text-center">
              {/* AI Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-3xl font-bold text-white">AI</span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-bold text-amber-900 dark:text-white mb-3">
                Generating Your Weekly Test
              </h2>

              {/* Message */}
              <p className="text-amber-700 dark:text-gray-400 mb-6">
                {weeklyTestMessage || 'Our AI is creating personalized questions based on your skills...'}
              </p>

              {/* Loading Animation */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Additional Info */}
              <p className="text-sm text-amber-600 dark:text-gray-400">
                This may take a few moments...
              </p>

              {/* Mobile Display */}
              {getUserMobile() && (
                <p className="text-xs text-amber-500 dark:text-gray-500 mt-4">
                  Checking for analysis for: {getUserMobile()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Weekly Test Loading Overlay */}
      {generatingWeeklyTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1a2e]/90 rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-blue-300 dark:border-cyan-500/30 transform animate-fadeIn">
            <div className="text-center">
              {/* Animated AI Icon */}
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Heading */}
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>
                Generating Your Weekly Test
              </h2>

              {/* Message */}
              <p className={`${themeClasses.textPrimary} dark:text-gray-300 mb-6`}>
                Our AI is creating personalized questions based on your roadmap and progress...
              </p>

              {/* Loading Animation */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>

              {/* Additional Info */}
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Please wait while we generate your test...
              </p>

              {/* Mobile Display */}
              {getUserMobile() && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Mobile: {getUserMobile()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Test Analysis Loading Overlay - When Checking/Generating/Redirecting */}
      {redirectingToProgressTracking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1a2e]/95 rounded-3xl p-10 max-w-lg w-full shadow-2xl border-2 border-purple-300 dark:border-purple-500/30 transform animate-scaleIn">
            <div className="text-center">
              {/* Animated Icon with Multiple Rings */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                {/* Outer pulsing glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-2xl animate-pulse"></div>
                
                {/* Spinning outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-conic from-purple-500 via-pink-500 to-purple-500 animate-spin" style={{ animationDuration: '2s', WebkitMask: 'radial-gradient(transparent 60%, black 60%)', mask: 'radial-gradient(transparent 60%, black 60%)' }}></div>
                
                {/* Static middle ring */}
                <div className="absolute inset-3 rounded-full border-4 border-purple-200/50 dark:border-purple-800/50"></div>
                
                {/* Center icon container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Dynamic Heading */}
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                {progressTrackingMessage.includes('Month') ? 
                  (progressTrackingMessage.includes('Checking') || progressTrackingMessage.includes('Generating') ? 'Generating Monthly Test Analysis' :
                   progressTrackingMessage.includes('Found') || progressTrackingMessage.includes('Generated') ? 'Redirecting to Progress Tracking' :
                   'Processing Monthly Analysis...') :
                 progressTrackingMessage.includes('Checking') ? 'Generating Weekly Test Analysis' : 
                 progressTrackingMessage.includes('Found') ? 'Redirecting to Progress Tracking' :
                 progressTrackingMessage.includes('Generating') ? 'Generating Analysis' :
                 progressTrackingMessage.includes('Generated') ? 'Redirecting to Progress Tracking' :
                 'Processing...'}
              </h2>
              
              {/* Dynamic Message */}
              <p className={`${themeClasses.textPrimary} dark:text-gray-300 mb-8 text-lg leading-relaxed`}>
                {progressTrackingMessage || 'Please wait...'}
              </p>
              
              {/* Modern Loading Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full animate-pulse shadow-lg" 
                     style={{ 
                       width: progressTrackingMessage.includes('Checking') ? '30%' :
                              progressTrackingMessage.includes('Found') ? '100%' :
                              progressTrackingMessage.includes('Generating') ? '60%' :
                              progressTrackingMessage.includes('Generated') ? '100%' :
                              '50%',
                       transition: 'width 0.5s ease-in-out'
                     }}>
                </div>
              </div>
              
              {/* Animated Loading Dots */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              
              {/* Status Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-500/30">
                <p className="text-sm text-purple-800 dark:text-purple-300 font-medium">
                  {progressTrackingMessage.includes('Checking') && '⚙️ AI is generating your weekly test analysis...'}
                  {progressTrackingMessage.includes('Generating') && '⚙️ AI is analyzing your test performance...'}
                  {progressTrackingMessage.includes('Found') && '✅ Redirecting to Progress Tracking page...'}
                  {progressTrackingMessage.includes('Generated') && '✅ Redirecting to Progress Tracking page...'}
                  {!progressTrackingMessage && '⏳ Processing your request...'}
                </p>
              </div>
              
              {/* Mobile Number Display (optional) */}
              {getUserMobile() && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  User: {getUserMobile()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Inline Timer Component (shows below Generate button)
const WeeklyTestTimerInline = ({ onTimerComplete, theme }) => {
  const themeClasses = getThemeClasses(theme);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (onTimerComplete) {
            setTimeout(() => onTimerComplete(), 500);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimerComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className={`${themeClasses.sectionBackground} rounded-xl p-6 border-2 ${themeClasses.cardBorder}`}>
      <div className="text-center">
        {/* Timer Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
          Preparation Time
        </h3>

        {/* Circular Progress */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - percentage / 100)}`}
              className="text-amber-500 dark:text-pink-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold ${themeClasses.accent}`}>
                {formatTime(timeLeft)}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                remaining
              </div>
            </div>
          </div>
        </div>

        <p className={`text-sm ${themeClasses.textSecondary}`}>
          Use this time to prepare mentally and review your notes
        </p>
      </div>
    </div>
  );
};

// Post-Analysis Timer Component - Shows countdown after weekly analysis before generating next test
const PostAnalysisTimerInline = ({ timeRemaining, timerDuration, nextAction, isMonthEnd, isRoadmapTimer = false, theme }) => {
  const themeClasses = getThemeClasses(theme);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((timerDuration - timeRemaining) / timerDuration) * 100;
  
  // Determine display text based on timer type
  const isMonthlyNext = nextAction === 'generate_monthly_test';
  
  let timerTitle, timerMessage;
  if (isRoadmapTimer) {
    timerTitle = 'Roadmap Ready!';
    timerMessage = 'Your personalized learning roadmap is ready. Take a moment to review it before starting your first weekly test.';
  } else if (isMonthlyNext) {
    timerTitle = 'Monthly Test Preparation';
    timerMessage = 'Great job completing all 4 weeks! Prepare for your monthly assessment.';
  } else {
    timerTitle = 'Next Week Test Preparation';
    timerMessage = 'Analysis complete! Take a break before your next weekly test.';
  }

  return (
    <div className={`${themeClasses.sectionBackground} rounded-xl p-6 border-2 ${isRoadmapTimer ? 'border-blue-300 dark:border-blue-700' : isMonthlyNext ? 'border-purple-300 dark:border-purple-700' : themeClasses.cardBorder}`}>
      <div className="text-center">
        {/* Timer Icon */}
        <div className={`w-16 h-16 mx-auto mb-4 ${isRoadmapTimer ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : isMonthlyNext ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-green-500 to-teal-500'} dark:from-pink-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse`}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
          {timerTitle}
        </h3>
        
        <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
          {timerMessage}
        </p>

        {/* Timer Display */}
        <div className="relative w-36 h-36 mx-auto mb-4">
          <svg className="transform -rotate-90 w-36 h-36">
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 64}`}
              strokeDashoffset={`${2 * Math.PI * 64 * (1 - percentage / 100)}`}
              className={`${isMonthlyNext ? 'text-purple-500' : 'text-green-500'} dark:text-pink-500 transition-all duration-1000`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${themeClasses.accent}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                remaining
              </div>
            </div>
          </div>
        </div>

        <p className={`text-sm font-medium ${isMonthlyNext ? 'text-purple-600 dark:text-purple-400' : 'text-green-600 dark:text-green-400'}`}>
          {isMonthlyNext 
            ? `Generate Monthly Test button will appear in ${formatTime(timeRemaining)}`
            : `Generate Weekly Test button will appear in ${formatTime(timeRemaining)}`
          }
        </p>
      </div>
    </div>
  );
};

// Monthly Test Timer Component (similar to weekly but for monthly tests)
const MonthlyTestTimerInline = ({ timeRemaining, theme }) => {
  const themeClasses = getThemeClasses(theme);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((5 * 60 - timeRemaining) / (5 * 60)) * 100;

  return (
    <div className={`${themeClasses.sectionBackground} rounded-xl p-6 border-2 ${themeClasses.cardBorder}`}>
      <div className="text-center">
        {/* Timer Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
          Monthly Test Preparation Time
        </h3>

        {/* Circular Progress */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - percentage / 100)}`}
              className="text-purple-500 dark:text-pink-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold ${themeClasses.accent}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                remaining
              </div>
            </div>
          </div>
        </div>

        <p className={`text-sm ${themeClasses.textSecondary}`}>
          Use this time to prepare mentally and review the month's topics
        </p>
      </div>
    </div>
  );
};

// Monthly Test Timer Component with internal state (like WeeklyTestTimerInline)
// Shows a 5-minute countdown before the monthly test can be started
const MonthlyTestTimerInlineActive = ({ onTimerComplete, month, theme }) => {
  const themeClasses = getThemeClasses(theme);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (onTimerComplete) {
            setTimeout(() => onTimerComplete(), 500);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimerComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className={`${themeClasses.sectionBackground} rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700`}>
      <div className="text-center">
        {/* Timer Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-500 dark:to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>
          Month {month} Test - Preparation Time
        </h3>

        {/* Circular Progress */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="transform -rotate-90 w-40 h-40">
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="72"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - percentage / 100)}`}
              className="text-purple-500 dark:text-pink-500 transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold ${themeClasses.accent}`}>
                {formatTime(timeLeft)}
              </div>
              <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                remaining
              </div>
            </div>
          </div>
        </div>

        <p className={`text-sm ${themeClasses.textSecondary}`}>
          Use this time to prepare mentally and review all topics from this month
        </p>
        
        <ul className={`text-left max-w-md mx-auto mt-4 space-y-2 text-sm ${themeClasses.textSecondary}`}>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 dark:text-pink-500">•</span>
            <span>Review all 4 weeks of skills covered this month</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 dark:text-pink-500">•</span>
            <span>Ensure a stable internet connection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 dark:text-pink-500">•</span>
            <span>Find a quiet place without distractions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 dark:text-pink-500">•</span>
            <span>Camera and microphone will be required for proctoring</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Timer Component inside Dashboard (kept for compatibility)
const WeeklyTestTimerComponent = ({ onTimerComplete, theme }) => {
  const themeClasses = getThemeClasses(theme);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (onTimerComplete) {
            setTimeout(() => onTimerComplete(), 500);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimerComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="text-center">
      {/* Timer Icon */}
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Heading */}
      <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>
        {timeLeft === 0 ? 'Ready to Begin!' : 'Preparation Time'}
      </h2>

      {/* Instructions or Timer Display */}
      {timeLeft > 0 ? (
        <div className="mb-6">
          {/* Circular Progress */}
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                className="text-amber-500 dark:text-pink-500 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-5xl font-bold ${themeClasses.accent}`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                  remaining
                </div>
              </div>
            </div>
          </div>

          <p className={`text-lg ${themeClasses.textPrimary} font-semibold mb-2`}>
            Preparation Time
          </p>
          <p className={`${themeClasses.textSecondary}`}>
            Use this time to prepare mentally and review your notes
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className={`text-lg ${themeClasses.textPrimary} font-semibold mb-2`}>
            Timer Complete!
          </p>
          <p className={`${themeClasses.textSecondary}`}>
            Redirecting to your test...
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;




import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestResults = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [analysisNotAvailable, setAnalysisNotAvailable] = useState(false);
  const [isQAExpanded, setIsQAExpanded] = useState(false);

  // Get user mobile
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

  // Fetch and submit test results
  useEffect(() => {
    const submitTest = async () => {
      try {
        const mobile = getUserMobile();
        if (!mobile) throw new Error('Mobile number not found');

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

        // First, check which test type was taken (weekly or skills) using smart endpoint
        const testTypeResp = await fetch(`${backendUrl}/api/get-test-result/${encodeURIComponent(mobile)}`);
        let testType = 'skills'; // default to skills
        let testId = null;
        
        if (testTypeResp.ok) {
          const testTypeJson = await testTypeResp.json();
          if (testTypeJson.success) {
            testType = testTypeJson.testType || 'skills';
            testId = testTypeJson.testId;
            console.log(`📊 Detected test type: ${testType}`);
          }
        }
        
        // Get the test questions from appropriate storage
        // For weekly tests, use get-weekly-test-questions (read-only, doesn't regenerate)
        // For skills tests, use get-test-questions
        const getResp = testType === 'weekly' 
          ? await fetch(`${backendUrl}/api/get-weekly-test-questions/${encodeURIComponent(mobile)}`)
          : await fetch(`${backendUrl}/api/get-test-questions/${encodeURIComponent(mobile)}`);

        if (!getResp.ok) {
          // No pending test found — try fetching persisted results directly
          console.log(`⚠️ Test not in memory, trying persisted results...`);
          
          // Try weekly result first if testType is weekly, otherwise try quiz_result
          const resultEndpoint = testType === 'weekly' 
            ? `${backendUrl}/api/weekly-test-result/${encodeURIComponent(mobile)}`
            : `${backendUrl}/api/quiz-result/${encodeURIComponent(mobile)}`;
            
          try {
            const qrResp = await fetch(resultEndpoint);
            if (qrResp.ok) {
              const qrJson = await qrResp.json();
              if (qrJson && qrJson.success && qrJson.data) {
                const data = qrJson.data;
                const mappedFallback = {
                  testId: data._id || data.testId,
                  testType: testType,
                  testTitle: data.testTitle || (testType === 'weekly' ? 'Weekly Test' : 'Skills Test'),
                  mobile: data.mobile || mobile,
                  totalQuestions: data.totalQuestions || data.total_questions || data.total || (data.detailedResults ? data.detailedResults.length : 0) || 0,
                  correctAnswers: data.correctAnswers || data.correct_answers || data.correct || data.correctAnswers || 0,
                  incorrectAnswers: data.incorrectAnswers || data.incorrect_answers || ((data.totalQuestions || 0) - (data.correctAnswers || 0)) || 0,
                  score: data.correctAnswers || data.correct || 0,
                  scorePercentage: data.scorePercentage || data.score_percentage || data.score || 0,
                  totalScore: data.totalScore || data.total_score || 0,
                  maxPossibleScore: data.maxPossibleScore || data.max_possible_score || 0,
                  passed: typeof data.passed !== 'undefined' ? data.passed : ((data.scorePercentage || data.score || 0) >= 60),
                  skillAnalysisRaw: data.skillPerformance || data.skill_performance || data.skillAnalysis || [],
                  skillWisePerformance: data.skillPerformance ? Object.keys(data.skillPerformance).map(k => ({ skill: k, ...data.skillPerformance[k] })) : [],
                  detailedResults: data.detailedResults || data.detailed_results || data.answers || [],
                  summary: data.summary || ''
                };

                setResults(mappedFallback);
                setLoading(false);
                return;
              }
            }
          } catch (fallbackErr) {
            console.warn('Fallback to persisted result failed:', fallbackErr);
          }
          
          setAnalysisNotAvailable(true);
          setLoading(false);
          return;
        }

        const getJson = await getResp.json();
        testId = getJson?.data?.testId || testId;

        if (!testId) {
          setAnalysisNotAvailable(true);
          setLoading(false);
          return;
        }

        // Call submit-test-answers to compute score and persist results
        const submitResp = await fetch(`${backendUrl}/api/submit-test-answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, testId })
        });

        if (!submitResp.ok) {
          // Submission failed. Try fetching persisted result based on test type
          const resultEndpoint = testType === 'weekly' 
            ? `${backendUrl}/api/weekly-test-result/${encodeURIComponent(mobile)}`
            : `${backendUrl}/api/quiz-result/${encodeURIComponent(mobile)}`;
            
          try {
            const qrResp = await fetch(resultEndpoint);
            if (qrResp.ok) {
              const qrJson = await qrResp.json();
              if (qrJson && qrJson.success && qrJson.data) {
                const data = qrJson.data;
                const mappedFallback = {
                  testId: data._id || data.testId,
                  testType: testType,
                  testTitle: data.testTitle || (testType === 'weekly' ? 'Weekly Test' : 'Skills Test'),
                  mobile: data.mobile || mobile,
                  totalQuestions: data.totalQuestions || data.total_questions || data.total || (data.detailedResults ? data.detailedResults.length : 0) || 0,
                  correctAnswers: data.correctAnswers || data.correct_answers || data.correct || data.correctAnswers || 0,
                  incorrectAnswers: data.incorrectAnswers || data.incorrect_answers || ((data.totalQuestions || 0) - (data.correctAnswers || 0)) || 0,
                  score: data.correctAnswers || data.correct || 0,
                  scorePercentage: data.scorePercentage || data.score_percentage || data.score || 0,
                  totalScore: data.totalScore || data.total_score || 0,
                  maxPossibleScore: data.maxPossibleScore || data.max_possible_score || 0,
                  passed: typeof data.passed !== 'undefined' ? data.passed : ((data.scorePercentage || data.score || 0) >= 60),
                  skillAnalysisRaw: data.skillPerformance || data.skill_performance || data.skillAnalysis || [],
                  skillWisePerformance: data.skillPerformance ? Object.keys(data.skillPerformance).map(k => ({ skill: k, ...data.skillPerformance[k] })) : [],
                  detailedResults: data.detailedResults || data.detailed_results || data.answers || [],
                  summary: data.summary || ''
                };

                setResults(mappedFallback);
                setLoading(false);
                return;
              }
            }
          } catch (fallbackErr) {
            console.warn('Fallback to persisted result failed:', fallbackErr);
          }

          setAnalysisNotAvailable(true);
          setLoading(false);
          return;
        }

        const submitJson = await submitResp.json();

        if (submitJson && submitJson.success && submitJson.data) {
          // Map server result into component's expected shape
          const data = submitJson.data;
          const mapped = {
            testId: data.testId || testId,
            testType: testType,
            testTitle: data.testTitle || (testType === 'weekly' ? 'Weekly Test' : 'Skills Test'),
            mobile: data.mobile || mobile,
            totalQuestions: data.totalQuestions || data.total_questions || data.total || (data.detailedResults ? data.detailedResults.length : 0) || 0,
            correctAnswers: data.correctAnswers || data.correct_answers || data.correct || 0,
            incorrectAnswers: data.incorrectAnswers || data.incorrect_answers || ((data.totalQuestions || 0) - (data.correctAnswers || 0)) || 0,
            score: data.correctAnswers || data.correct || 0,
            scorePercentage: data.scorePercentage || data.score_percentage || data.score || 0,
            totalScore: data.totalScore || data.total_score || 0,
            maxPossibleScore: data.maxPossibleScore || data.max_possible_score || 0,
            passed: typeof data.passed !== 'undefined' ? data.passed : ((data.scorePercentage || data.score || 0) >= 60),
            skillAnalysisRaw: (data.skillPerformance) ? Object.keys(data.skillPerformance).map(k => ({ skill: k, ...data.skillPerformance[k] })) : [],
            skillWisePerformance: (data.skillPerformance) ? Object.keys(data.skillPerformance).map(k => ({ skill: k, correct: data.skillPerformance[k].correct, total: data.skillPerformance[k].total, percentage: data.skillPerformance[k].percentage })) : [],
            detailedResults: data.detailedResults || data.detailed_results || [],
            summary: ''
          };

          setResults(mapped);
          setLoading(false);
          return;
        }

        setAnalysisNotAvailable(true);
        setLoading(false);
        return;
      } catch (err) {
        console.error('Error while submitting test results:', err);
        setError(err.message || String(err));
        setLoading(false);
      }
    };

    submitTest();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-pink-500/20 border-t-blue-600 dark:border-t-blue-500 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Calculating results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{error}</p>
            <button
              onClick={() => navigate('/dashboard?section=skilltest')}
              className="px-6 py-2.5 bg-gray-100 dark:bg-[#2d1f3d] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#2d1f3d] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (analysisNotAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Results Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Complete a skills assessment to view your results.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/skills-test')}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Take Assessment
              </button>
              <button
                onClick={() => navigate('/dashboard?section=skilltest')}
                className="flex-1 px-6 py-2.5 bg-gray-100 dark:bg-[#2d1f3d] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#2d1f3d] transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // The backend returns a result object with these fields:
  // { testId, mobile, totalQuestions, correctAnswers, incorrectAnswers, scorePercentage, passed, skillPerformance, detailedResults, totalScore, maxPossibleScore }
  const totalQuestions = results.totalQuestions || results.total_questions || 0;
  const correctAnswers = results.correctAnswers || results.correct_answers || 0;
  const incorrectAnswers = results.incorrectAnswers || (totalQuestions - correctAnswers) || 0;
  const scorePercentage = results.scorePercentage || results.score_percentage || (totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0);
  
  // Get total score and max possible score - with fallback to skillPerformance calculation
  let totalScore = results.totalScore || results.total_score || 0;
  let maxPossibleScore = results.maxPossibleScore || results.max_possible_score || 0;
  
  // If not available directly, calculate from skillPerformance data
  if ((!totalScore || !maxPossibleScore) && results.skillPerformance) {
    const skillPerfArray = Array.isArray(results.skillPerformance) 
      ? results.skillPerformance 
      : Object.values(results.skillPerformance || {});
    
    totalScore = skillPerfArray.reduce((sum, skill) => sum + (skill.score || 0), 0);
    maxPossibleScore = skillPerfArray.reduce((sum, skill) => sum + (skill.maxScore || 0), 0);
  }
  
  console.log('Score Data:', { totalScore, maxPossibleScore, skillPerformance: results.skillPerformance });

  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-600 dark:text-green-400';
    if (scorePercentage >= 60) return 'text-blue-600 dark:text-blue-400';
    if (scorePercentage >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = () => {
    if (scorePercentage >= 80) return 'from-green-500 to-emerald-600';
    if (scorePercentage >= 60) return 'from-amber-500 to-orange-500';
    if (scorePercentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getScoreMessage = () => {
    if (scorePercentage >= 80) return 'Outstanding Performance';
    if (scorePercentage >= 60) return 'Good Performance';
    if (scorePercentage >= 40) return 'Average Performance';
    return 'Needs Improvement';
  };

  const getScoreDescription = () => {
    if (scorePercentage >= 80) return 'You have demonstrated excellent understanding of the concepts.';
    if (scorePercentage >= 60) return 'You have a solid grasp of most concepts covered in this test.';
    if (scorePercentage >= 40) return 'Consider reviewing the topics where you struggled.';
    return 'We recommend focusing on the fundamentals and retaking the test.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Score Overview */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 overflow-hidden mb-6">
          {/* Gradient Header Bar */}
          <div className={`h-2 bg-gradient-to-r ${getScoreBgColor()}`}></div>
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Score Circle and Marks Display */}
              <div className="flex items-center gap-6">
                {/* Percentage Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-700"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - scorePercentage / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={scorePercentage >= 60 ? '#3B82F6' : '#EF4444'} />
                          <stop offset="100%" stopColor={scorePercentage >= 60 ? '#8B5CF6' : '#F97316'} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor()}`}>{scorePercentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wide">Percentage</div>
                </div>
                
                {/* Marks Display - Highlighted like percentage */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-700"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#marksGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0))}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="marksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalScore.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">/</div>
                        <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">{maxPossibleScore.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wide">Marks</div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Assessment Complete</h1>
                  <p className={`text-lg font-semibold ${getScoreColor()}`}>{getScoreMessage()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{getScoreDescription()}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">Correct</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">Incorrect</div>
                </div>
                <div className="text-center p-4 bg-amber-50 dark:bg-[#2d1f3d]/50 rounded-lg border border-gray-200 dark:border-pink-500/20">
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{totalQuestions}</div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill-wise Performance */}
        {(results.skillAnalysisRaw && results.skillAnalysisRaw.length > 0) || (results.skillWisePerformance && results.skillWisePerformance.length > 0) ? (
          <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skill Performance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown by topic area</p>
              </div>
            </div>
            <div className="space-y-4">
              {(results.skillAnalysisRaw && results.skillAnalysisRaw.length > 0 ? results.skillAnalysisRaw : results.skillWisePerformance).map((skill, index) => {
                const name = skill.skill || skill.name || skill.topic || 'General';
                const total = skill.totalQuestions || skill.total_questions || skill.total || 0;
                const correct = skill.correctAnswers || skill.correct_answers || skill.correct || (skill.correct ? skill.correct : 0);
                const skillScore = skill.score || 0;
                const skillMaxScore = skill.maxScore || 0;
                const pct = skill.percentage || (skillMaxScore ? Math.round((skillScore / skillMaxScore) * 100) : (total ? Math.round((correct / total) * 100) : 0));
                const performanceColor = pct >= 70 ? 'text-green-600 dark:text-green-400' : pct >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
                const barColor = pct >= 70 ? 'from-green-500 to-emerald-500' : pct >= 50 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-rose-500';

                return (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-[#2d1f3d]/30 rounded-lg border border-gray-100 dark:border-pink-500/20">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-pink-500/20 text-gray-600 dark:text-gray-300">
                          {total} questions
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {skillMaxScore > 0 && (
                          <span className="px-3 py-1.5 rounded-lg font-bold text-base bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                            {skillScore.toFixed(1)}/{skillMaxScore.toFixed(1)}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">{correct}/{total}</span>
                        <span className={`text-sm font-semibold ${performanceColor}`}>{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-pink-500/20 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${barColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.round(pct)}%` }}
                      ></div>
                    </div>
                    {skill.missingTopics && skill.missingTopics.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-pink-500/20">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Areas to Improve</div>
                        <div className="flex flex-wrap gap-2">
                          {skill.missingTopics.map((t, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {skill.feedback && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-pink-500/20">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{skill.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Detailed Questions & Answers - Collapsible */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 overflow-hidden mb-6">
          <button
            onClick={() => setIsQAExpanded(!isQAExpanded)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-[#2d1f3d]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Questions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{(results.detailedResults || []).length} questions answered</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{isQAExpanded ? 'Hide' : 'Show'}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isQAExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {isQAExpanded && (
            <div className="border-t border-gray-200 dark:border-pink-500/20">
              <div className="p-6 space-y-4">
                {(results.detailedResults || []).map((q, idx) => {
                const options = q.options || [];
                
                // Helper function to convert answer to display text with letter prefix
                const getAnswerText = (answer) => {
                  if (answer === null || answer === undefined || answer === '') return '';
                  
                  // If it's a number, treat it as an index
                  if (typeof answer === 'number') {
                    const option = options[answer] ?? String(answer);
                    // Add letter prefix if not already present
                    if (!/^[A-D]\)/.test(String(option))) {
                      const letter = String.fromCharCode(65 + answer);
                      return `${letter}) ${option}`;
                    }
                    return option;
                  }
                  
                  // If it's a single letter (A, B, C, D), find the matching option
                  const answerStr = String(answer).trim().toUpperCase();
                  if (answerStr.length === 1 && /^[A-D]$/.test(answerStr)) {
                    // Find option that starts with this letter
                    const matchingOption = options.find(opt => 
                      String(opt).trim().toUpperCase().startsWith(answerStr + ')')
                    );
                    if (matchingOption) {
                      return matchingOption; // Return as-is with letter prefix
                    }
                    // If no match found, try using the letter as index (A=0, B=1, C=2, D=3)
                    const index = answerStr.charCodeAt(0) - 65;
                    if (index >= 0 && index < options.length) {
                      const opt = options[index];
                      // Add letter prefix if not already present
                      if (!/^[A-D]\)/.test(String(opt))) {
                        return `${answerStr}) ${opt}`;
                      }
                      return opt;
                    }
                    // Return just the letter if we can't find the option
                    return answerStr;
                  }
                  
                  // If answer already has format "A) something", return as-is
                  if (/^[A-D]\)\s*/.test(String(answer))) {
                    return String(answer);
                  }
                  
                  // Otherwise return as-is
                  return String(answer);
                };
                
                const correctText = getAnswerText(q.correctAnswer);
                const userText = getAnswerText(q.userAnswer);

                return (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${q.isCorrect ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10' : 'border-l-red-500 bg-red-50 dark:bg-red-900/10'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 dark:bg-pink-500/20 text-gray-600 dark:text-gray-300">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {q.skill || 'General'}
                          </span>
                          {q.difficulty && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              q.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              q.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {q.difficulty}
                            </span>
                          )}
                          {q.marks && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {q.marksEarned?.toFixed(1) || 0}/{q.marks?.toFixed(1)} marks
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 font-medium mb-3">{q.question}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Answer</span>
                            <div className={`mt-1 p-2 rounded text-sm ${q.isCorrect ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                              {userText || <span className="text-gray-400 italic">No answer</span>}
                            </div>
                          </div>
                          {!q.isCorrect && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Correct Answer</span>
                              <div className="mt-1 p-2 rounded text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                {correctText}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {q.isCorrect ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-pink-500/20 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/dashboard?section=skilltest')}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-[#2d1f3d] text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#2d1f3d] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-pink-500/20 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#2d1f3d] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;

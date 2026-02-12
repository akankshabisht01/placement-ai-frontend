import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const ATSScore = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  const [atsData, setAtsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calculateATSScore = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get parsed resume data from localStorage (set during resume parsing)
      const resumeData = localStorage.getItem('parsedResumeData');
      if (!resumeData) {
        setError('No resume data found. Please upload and parse a resume first.');
        setLoading(false);
        return;
      }

      const parsedData = JSON.parse(resumeData);
      
      // Get optional job description if provided
      const jobDescription = localStorage.getItem('jobDescription') || '';
      
      // Call ATS score calculation API with job description
      const response = await fetch(`${API_BASE}/api/ats-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...parsedData,
          job_description: jobDescription
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to calculate ATS score');
      }

      // Check if this is a personal resume (should update dashboard)
      const isPersonalResume = localStorage.getItem('isPersonalResume') === 'true';
      
      // Always store the current analysis result for viewing
      localStorage.setItem('atsAnalysisResult', JSON.stringify(result.data));
      
      // If personal resume, also update the personal ATS score for dashboard
      if (isPersonalResume) {
        localStorage.setItem('personalATSScore', JSON.stringify(result.data));
      }
      
      setAtsData(result.data);
    } catch (err) {
      console.error('Error calculating ATS score:', err);
      setError(err.message || 'Failed to calculate ATS score');
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    calculateATSScore();
  }, [calculateATSScore]);

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'Excellent':
        return '🏆';
      case 'Good':
        return '👍';
      case 'Fair':
        return '⚠️';
      case 'Needs Improvement':
        return '📈';
      default:
        return '📊';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600 dark:border-t-indigo-400 mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-purple-400 dark:border-t-purple-500 mx-auto"></div>
          </div>
          <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>Analyzing Your Resume</h2>
          <p className={`${themeClasses.textSecondary} mb-4`}>Calculating your ATS compatibility score...</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-amber-500 dark:bg-pink-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-500 dark:bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-amber-500 dark:bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 dark:bg-red-950/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/predict')}
            className="btn-primary"
          >
            Go Back to Upload Resume
          </button>
        </div>
      </div>
    );
  }

  if (!atsData) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="text-center">
          <p className={themeClasses.textSecondary}>No ATS data available</p>
          <button
            onClick={() => navigate('/predict')}
            className="btn-primary mt-4"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-8 relative overflow-hidden`}>
      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left large circle */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-amber-200/40 to-orange-300/30 dark:from-pink-500/10 dark:to-purple-500/10 rounded-full blur-3xl"></div>
        {/* Top-right circle */}
        <div className="absolute -top-20 right-10 w-72 h-72 bg-gradient-to-bl from-orange-200/50 to-yellow-200/40 dark:from-purple-500/15 dark:to-pink-500/10 rounded-full blur-2xl"></div>
        {/* Middle-left small circle */}
        <div className="absolute top-1/3 -left-16 w-48 h-48 bg-gradient-to-r from-yellow-200/40 to-amber-200/30 dark:from-pink-600/10 dark:to-orange-500/10 rounded-full blur-2xl"></div>
        {/* Middle-right medium circle */}
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-gradient-to-l from-amber-300/30 to-orange-200/40 dark:from-purple-600/15 dark:to-pink-600/10 rounded-full blur-3xl"></div>
        {/* Bottom-left circle */}
        <div className="absolute bottom-20 left-1/4 w-56 h-56 bg-gradient-to-tr from-orange-200/35 to-yellow-100/30 dark:from-pink-500/10 dark:to-purple-400/10 rounded-full blur-2xl"></div>
        {/* Bottom-right large circle */}
        <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-gradient-to-tl from-amber-200/45 to-orange-100/35 dark:from-purple-500/15 dark:to-pink-400/10 rounded-full blur-3xl"></div>
        {/* Center floating circle */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-yellow-100/30 to-orange-100/20 dark:from-pink-400/8 dark:to-purple-400/8 rounded-full blur-xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${themeClasses.gradient} rounded-full mb-6 shadow-lg`}>
            <span className="text-3xl">📊</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.gradientText} mb-4`}>
            ATS Score Analysis
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-2xl mx-auto leading-relaxed`}>
            Comprehensive analysis of your resume's compatibility with Applicant Tracking Systems
          </p>
          <div className="mt-4 flex justify-center">
            <div className={`h-1 w-24 ${themeClasses.gradient} rounded-full`}></div>
          </div>
        </div>

        {/* Overall Score Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-2xl mb-12 ${themeClasses.cardBackground} ${themeClasses.cardBorder} border-2`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-50"></div>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-32 translate-x-32 opacity-20 blur-3xl" style={{ background: 'currentColor' }}></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-24 -translate-x-24 opacity-20 blur-3xl" style={{ background: 'currentColor' }}></div>
          
          <div className="relative p-8 md:p-12">
            <div className="text-center">
              {/* Score Circle */}
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg dark:shadow-glow ${
                  atsData.total_score >= 88 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  atsData.total_score >= 72 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  atsData.total_score >= 55 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                  <div className="w-28 h-28 rounded-full bg-white dark:bg-[#1e1a2e] flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        atsData.total_score >= 88 ? 'text-green-600 dark:text-green-400' :
                        atsData.total_score >= 72 ? 'text-blue-600 dark:text-blue-400' :
                        atsData.total_score >= 55 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {atsData.total_score}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-tech-gray-400">/100</div>
                    </div>
                  </div>
                </div>
                {/* Rating Badge */}
                <div className={`absolute -top-2 -right-2 ${themeClasses.cardBackground} rounded-full px-4 py-2 shadow-lg border-2 ${themeClasses.cardBorder}`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getRatingIcon(atsData.rating)}</span>
                    <span className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{atsData.rating}</span>
                  </div>
                </div>
              </div>
              
              <h2 className={`text-3xl md:text-4xl font-bold ${themeClasses.textPrimary} mb-6`}>
                ATS Compatibility Score
              </h2>
              
              <div className="max-w-3xl mx-auto">
                <p className={`text-lg ${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                  {atsData.total_score >= 88 
                    ? "🎉 Excellent! Your resume is excellently optimized for ATS systems and should pass most automated screenings with flying colors."
                    : atsData.total_score >= 72
                    ? "👍 Good! Your resume is well-optimized for ATS systems with room for improvements to reach excellence."
                    : atsData.total_score >= 55
                    ? "⚡ Fair. Your resume shows promise but requires improvements to be more ATS-friendly."
                    : "📈 Needs Improvement. Your resume requires significant improvements to be ATS-friendly and pass automated screenings."
                  }
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-[#2d1f3d] rounded-full h-3 mb-6 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                      atsData.total_score >= 88 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                      atsData.total_score >= 72 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                      atsData.total_score >= 55 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${atsData.total_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description Match Analysis */}
        {atsData.job_match && atsData.job_match.has_job_description && (
          <div className={`mb-8 ${themeClasses.cardBackground} rounded-2xl shadow-lg p-8 border-2 ${themeClasses.cardBorder}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${themeClasses.gradient} rounded-full flex items-center justify-center mr-4 shadow-lg`}>
                  <span className="text-2xl text-white">🎯</span>
                </div>
                <div>
                  <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Job Description Match</h3>
                  <p className="text-gray-600 dark:text-tech-gray-300">How well your resume matches the target job</p>
                </div>
              </div>
              
              {/* Match Score Badge */}
              <div className={`px-6 py-3 rounded-full shadow-lg dark:shadow-glow font-bold text-lg ${
                atsData.job_match.match_color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700' :
                atsData.job_match.match_color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700' :
                atsData.job_match.match_color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
              }`}>
                <span className="mr-2">{atsData.job_match.match_emoji}</span>
                {atsData.job_match.match_percentage}% Match
              </div>
            </div>
            
            {/* Match Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-tech-gray-300">Keyword Match Progress</span>
                <span className={`text-sm font-bold ${
                  atsData.job_match.match_color === 'green' ? 'text-green-600 dark:text-green-400' :
                  atsData.job_match.match_color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  atsData.job_match.match_color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>{atsData.job_match.match_rating}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-[#2d1f3d] rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    atsData.job_match.match_color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    atsData.job_match.match_color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                    atsData.job_match.match_color === 'yellow' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                  style={{ width: `${atsData.job_match.match_percentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Recommendation */}
            <div className="bg-white dark:bg-[#2d1f3d]/50 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <span className="text-xl mr-3">💡</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{atsData.job_match.recommendation}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Matched Keywords */}
              {atsData.job_match.matched_keywords && atsData.job_match.matched_keywords.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">✅</span>
                    <h4 className="font-semibold text-green-800 dark:text-green-400">Keywords Found in Resume</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {atsData.job_match.matched_keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 text-xs bg-white dark:bg-[#2d1f3d]/60 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Missing Keywords */}
              {atsData.job_match.missing_keywords && atsData.job_match.missing_keywords.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">⚠️</span>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-400">Missing from Resume</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {atsData.job_match.missing_keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 text-xs bg-white dark:bg-[#2d1f3d]/60 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-3">
                    Consider adding these skills if you have them to improve your match
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Issue Summary */}
        {atsData.flagged_issues && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {atsData.flagged_issues.critical && atsData.flagged_issues.critical.length > 0 && (
              <div className="flex items-center bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 text-red-800 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium shadow-md dark:shadow-glow border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-200">
                <span className="mr-2 text-lg">🔴</span>
                <span className="font-bold">{atsData.flagged_issues.critical.length}</span>
                <span className="ml-1">Critical Issues</span>
              </div>
            )}
            {atsData.flagged_issues.major && atsData.flagged_issues.major.length > 0 && (
              <div className="flex items-center bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 text-orange-800 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium shadow-md dark:shadow-glow border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200">
                <span className="mr-2 text-lg">🟠</span>
                <span className="font-bold">{atsData.flagged_issues.major.length}</span>
                <span className="ml-1">Major Issues</span>
              </div>
            )}
            {atsData.flagged_issues.minor && atsData.flagged_issues.minor.length > 0 && (
              <div className="flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-medium shadow-md dark:shadow-glow border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-200">
                <span className="mr-2 text-lg">🟡</span>
                <span className="font-bold">{atsData.flagged_issues.minor.length}</span>
                <span className="ml-1">Minor Issues</span>
              </div>
            )}
          </div>
        )}

        {/* Spelling & Grammar Issues - Special Section */}
        {atsData.flagged_issues && (
          <div className="mb-8">
            {/* Check if there are spelling/grammar issues */}
            {(() => {
              const spellingGrammarIssues = [
                ...(atsData.flagged_issues.critical || []),
                ...(atsData.flagged_issues.major || []),
                ...(atsData.flagged_issues.minor || [])
              ].filter(issue => issue.category === 'Spelling & Grammar');
              
              if (spellingGrammarIssues.length > 0) {
                return (
                  <div className="mb-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-600 dark:to-pink-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                        <span className="text-2xl text-white">📝</span>
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Spelling & Grammar Issues</h3>
                        <p className="text-gray-600 dark:text-tech-gray-300">Critical writing quality issues that need immediate attention</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg dark:shadow-glow">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">⚠️</span>
                          <h4 className="text-xl font-bold text-red-800 dark:text-red-400">Writing Quality Issues</h4>
                        </div>
                        <div className="bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 px-4 py-2 rounded-full text-sm font-bold shadow-md dark:shadow-glow">
                          {spellingGrammarIssues.length} Issues Found
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {spellingGrammarIssues.map((issue, index) => (
                          <div key={index} className="bg-white dark:bg-[#2d1f3d]/50 border border-red-200 dark:border-red-800/50 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-glow transition-all duration-200">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-red-600 dark:text-red-400 text-sm font-bold">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-red-800 dark:text-red-300 text-sm mb-2">
                                  {issue.issue}
                                </div>
                                <div className="text-red-700 dark:text-red-200/80 text-xs mb-3 leading-relaxed">
                                  {issue.description}
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <span className="text-green-600 dark:text-green-400 text-sm">💡</span>
                                    <div className="text-green-800 dark:text-green-300 text-xs font-medium">
                                      <strong>Fix:</strong> {issue.fix}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">💡</span>
                          <div>
                            <div className="text-yellow-800 dark:text-yellow-400 text-sm font-bold mb-1">Pro Tip</div>
                            <div className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                              Use spell-check tools like Grammarly or Microsoft Word's built-in checker. 
                              Always proofread your resume multiple times before submitting.
                            </div>
                            <button
                              onClick={() => navigate('/grammar-correction')}
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">📝</span>
                                <span>View Detailed Grammar Analysis</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                <span className="text-2xl text-white">🚨</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Flagged Issues</h3>
                <p className="text-gray-600 dark:text-tech-gray-300">Additional areas for improvement in your resume</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical Issues */}
              {(() => {
                const criticalIssues = (atsData.flagged_issues.critical || []).filter(issue => issue.category !== 'Spelling & Grammar');
                return criticalIssues.length > 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg dark:shadow-glow hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-3 shadow-md dark:shadow-glow">
                          <span className="text-white text-lg">🔴</span>
                        </div>
                        <h4 className="text-lg font-bold text-red-800 dark:text-red-400">Critical Issues</h4>
                      </div>
                      <div className="bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-full text-sm font-bold shadow-md dark:shadow-glow">
                        {criticalIssues.length}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {criticalIssues.map((issue, index) => (
                        <div key={index} className="bg-white dark:bg-[#2d1f3d]/50 border border-red-200 dark:border-red-800/50 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-glow transition-all duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-red-600 dark:text-red-400 text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-red-800 dark:text-red-300 text-sm mb-2">
                                {issue.issue}
                              </div>
                              <div className="text-red-700 dark:text-red-200/80 text-xs mb-3 leading-relaxed">
                                {issue.description}
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-lg p-2">
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600 dark:text-green-400 text-xs">💡</span>
                                  <div className="text-green-800 dark:text-green-300 text-xs font-medium">
                                    {issue.fix}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Major Issues */}
              {(() => {
                const majorIssues = (atsData.flagged_issues.major || []).filter(issue => issue.category !== 'Spelling & Grammar');
                return majorIssues.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 shadow-lg dark:shadow-glow hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center mr-3 shadow-md dark:shadow-glow">
                          <span className="text-white text-lg">🟠</span>
                        </div>
                        <h4 className="text-lg font-bold text-orange-800 dark:text-orange-400">Major Issues</h4>
                      </div>
                      <div className="bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold shadow-md dark:shadow-glow">
                        {majorIssues.length}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {majorIssues.map((issue, index) => (
                        <div key={index} className="bg-white dark:bg-[#2d1f3d]/50 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-glow transition-all duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">
                                {issue.issue}
                              </div>
                              <div className="text-orange-700 dark:text-orange-200/80 text-xs mb-3 leading-relaxed">
                                {issue.description}
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-lg p-2">
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600 dark:text-green-400 text-xs">💡</span>
                                  <div className="text-green-800 dark:text-green-300 text-xs font-medium">
                                    {issue.fix}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Minor Issues */}
              {(() => {
                const minorIssues = (atsData.flagged_issues.minor || []).filter(issue => issue.category !== 'Spelling & Grammar');
                return minorIssues.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-lg dark:shadow-glow hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center mr-3 shadow-md dark:shadow-glow">
                          <span className="text-white text-lg">🟡</span>
                        </div>
                        <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-400">Minor Issues</h4>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-bold shadow-md dark:shadow-glow">
                        {minorIssues.length}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {minorIssues.map((issue, index) => (
                        <div key={index} className="bg-white dark:bg-[#2d1f3d]/50 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 shadow-sm hover:shadow-md dark:hover:shadow-glow transition-all duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm mb-2">
                                {issue.issue}
                              </div>
                              <div className="text-yellow-700 dark:text-yellow-200/80 text-xs mb-3 leading-relaxed">
                                {issue.description}
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-lg p-2">
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600 dark:text-green-400 text-xs">💡</span>
                                  <div className="text-green-800 dark:text-green-300 text-xs font-medium">
                                    {issue.fix}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Score Breakdown */}
          <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-lg dark:shadow-glow p-8 border border-gray-100 dark:border-pink-500/20 hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                <span className="text-2xl text-white">📈</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Score Breakdown</h3>
                <p className="text-gray-600 dark:text-tech-gray-300">Detailed analysis by category</p>
              </div>
            </div>
            <div className="space-y-6">
              {atsData.score_breakdown && Object.entries(atsData.score_breakdown).length > 0 ? (
                Object.entries(atsData.score_breakdown).map(([category, score]) => {
                  // Define max points for each category (optimized distribution)
                  const categoryMax = {
                    'contact_info': 5,       // Reduced from 15 - basic info
                    'education': 15,         // Unchanged - appropriate
                    'experience': 20,        // Unchanged - appropriate
                    'skills': 25,            // Increased from 15 - most critical
                    'keywords': 5,           // Reduced from 15 - avoid overlap
                    'format': 5,             // Unchanged - appropriate
                    'projects': 15,          // Increased from 10 - practical skills
                    'achievements': 5,       // Unchanged - appropriate
                    'spelling_grammar': 5    // Reduced from 10 - quality check
                  };
                  const maxScore = categoryMax[category] || 20;
                  const percentage = (score / maxScore) * 100;
                  
                  return (
                  <div key={category} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 mr-3 shadow-sm"></div>
                        <span className="text-gray-700 dark:text-tech-gray-200 font-medium capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${themeClasses.textPrimary}`}>
                        {score}/{maxScore}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-[#2d1f3d] rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ease-out group-hover:shadow-md ${
                          percentage >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          percentage >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                          percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#2d1f3d] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400 dark:text-tech-gray-500">📊</span>
                  </div>
                  <p className="text-gray-500 dark:text-tech-gray-400 italic">No score breakdown available</p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-lg dark:shadow-glow p-8 border border-gray-100 dark:border-pink-500/20 hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                <span className="text-2xl text-white">✅</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Strengths</h3>
                <p className="text-gray-600 dark:text-tech-gray-300">What's working well in your resume</p>
              </div>
            </div>
            {atsData.strengths && atsData.strengths.length > 0 ? (
              <div className="space-y-4">
                {atsData.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50 transition-all duration-200">
                    <div className="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-tech-gray-200 leading-relaxed">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2d1f3d] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400 dark:text-tech-gray-500">📝</span>
                </div>
                <p className="text-gray-500 dark:text-tech-gray-400 italic">No specific strengths identified</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips and Recommendations */}
        {/* Tips and Recommendations */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-lg dark:shadow-glow p-8 border border-gray-100 dark:border-pink-500/20 hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
              <span className="text-2xl text-white">💡</span>
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Tips & Recommendations</h3>
              <p className="text-gray-600 dark:text-tech-gray-300">Actionable advice to improve your resume</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Improvements Needed */}
            {atsData.tips && atsData.tips.filter(tip => tip.startsWith('❌')).length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">❌</span>
                  </div>
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-400">Improvements Needed</h4>
                </div>
                <div className="space-y-3">
                  {atsData.tips.filter(tip => tip.startsWith('❌')).map((tip, index) => (
                    <div key={index} className="flex items-start p-3 bg-white dark:bg-[#2d1f3d]/50 rounded-lg border border-red-200 dark:border-red-800/50">
                      <div className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <span className="text-red-600 dark:text-red-400 text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{tip.substring(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Suggestions */}
            {atsData.tips && atsData.tips.filter(tip => tip.startsWith('💡')).length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">💡</span>
                  </div>
                  <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">Suggestions</h4>
                </div>
                <div className="space-y-3">
                  {atsData.tips.filter(tip => tip.startsWith('💡')).map((tip, index) => (
                    <div key={index} className="flex items-start p-3 bg-white dark:bg-[#2d1f3d]/50 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                      <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{tip.substring(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Positive feedback */}
          {atsData.tips && atsData.tips.filter(tip => tip.startsWith('✅')).length > 0 && (
            <div className="mt-8 bg-green-50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">✅</span>
                </div>
                <h4 className="text-lg font-semibold text-green-800 dark:text-green-400">What's Working Well</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {atsData.tips.filter(tip => tip.startsWith('✅')).map((tip, index) => (
                  <div key={index} className="flex items-start p-3 bg-white dark:bg-[#2d1f3d]/50 rounded-lg border border-green-200 dark:border-green-800/50">
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{tip.substring(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actionable Suggestions (NEW) */}
        {atsData.corrections && atsData.corrections.actionableSuggestions && atsData.corrections.actionableSuggestions.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg dark:shadow-glow p-8 border border-blue-200 dark:border-blue-800 hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                <span className="text-2xl text-white">💡</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Actionable Suggestions</h3>
                <p className="text-gray-600 dark:text-tech-gray-300">Personalized recommendations to boost your ATS score</p>
              </div>
            </div>

            <div className="space-y-4">
              {atsData.corrections.actionableSuggestions.map((item, idx) => {
                const priorityColors = {
                  high: 'from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600',
                  medium: 'from-yellow-500 to-amber-500 dark:from-yellow-600 dark:to-amber-600',
                  low: 'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600'
                };
                const priorityBgColors = {
                  high: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                  medium: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
                  low: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                };
                const priorityTextColors = {
                  high: 'text-red-700 dark:text-red-400',
                  medium: 'text-yellow-700 dark:text-yellow-400',
                  low: 'text-blue-700 dark:text-blue-400'
                };

                return (
                  <div key={idx} className={`${priorityBgColors[item.priority] || priorityBgColors.low} border rounded-xl p-6 hover:shadow-md dark:hover:shadow-glow transition-all duration-200`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-r ${priorityColors[item.priority] || priorityColors.low} mr-2`}></span>
                        <h4 className={`text-lg font-bold ${priorityTextColors[item.priority] || priorityTextColors.low}`}>
                          {item.category}
                        </h4>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityTextColors[item.priority] || priorityTextColors.low} bg-white dark:bg-[#2d1f3d]/60`}>
                        {item.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3 font-medium">
                      {item.suggestion}
                    </p>
                    
                    {item.example && (
                      <div className="bg-white dark:bg-[#2d1f3d]/60 border border-gray-200 dark:border-pink-500/20 rounded-lg p-4 mb-3">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Example:</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 font-mono">{item.example}</div>
                      </div>
                    )}
                    
                    {item.impact && (
                      <div className="flex items-center text-sm text-green-700 dark:text-green-400">
                        <span className="mr-2">📈</span>
                        <span className="font-semibold">{item.impact}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill-Project Gaps (NEW) */}
        {atsData.corrections && atsData.corrections.skillProjectGaps && atsData.corrections.skillProjectGaps.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl shadow-lg dark:shadow-glow p-8 border border-orange-200 dark:border-orange-800 hover:shadow-xl dark:hover:shadow-glow-lg transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
                <span className="text-2xl text-white">⚠️</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Skills Not Demonstrated in Projects</h3>
                <p className="text-gray-600 dark:text-tech-gray-300">Skills you listed but haven't showcased in your projects</p>
              </div>
            </div>

            <div className="space-y-4">
              {atsData.corrections.skillProjectGaps.map((gap, idx) => {
                const severityColors = {
                  high: 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300',
                  medium: 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                };

                return (
                  <div key={idx} className={`border rounded-xl p-5 ${severityColors[gap.severity] || severityColors.medium}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold mb-2">{gap.message}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {gap.skills.map((skill, sidx) => (
                            <span key={sidx} className="px-3 py-1 text-sm bg-white dark:bg-[#2d1f3d]/60 border border-current rounded-full font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm font-medium opacity-75">
                          Domain: <span className="uppercase">{gap.domain}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Corrections & Rewrites (from backend corrections engine) */}
        {atsData.corrections && (
          <div className={`mt-8 ${themeClasses.cardBackground} rounded-2xl shadow-lg p-8 border-2 ${themeClasses.cardBorder} ${themeClasses.cardHover} transition-all duration-300`}>
            <div className="flex items-center mb-6">
              <div className={`w-12 h-12 ${themeClasses.gradient} rounded-full flex items-center justify-center mr-4 shadow-lg`}>
                <span className="text-2xl text-white">🛠️</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Corrections & Rewrites</h3>
                <p className={themeClasses.textSecondary}>Targeted suggestions to improve keywords, phrasing, and structure</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recommended Keywords */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">🏷️</span>
                  <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-400">Recommended Keywords</h4>
                </div>
                {atsData.corrections.recommendedKeywords && atsData.corrections.recommendedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {atsData.corrections.recommendedKeywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 text-sm bg-white dark:bg-[#2d1f3d]/60 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300 rounded-full shadow-sm">{kw}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-indigo-700 dark:text-indigo-400">No additional keywords suggested</div>
                )}
              </div>

              {/* Action Verbs */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">⚡</span>
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-400">Powerful Action Verbs</h4>
                </div>
                {atsData.corrections.actionVerbs && atsData.corrections.actionVerbs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {atsData.corrections.actionVerbs.map((v, idx) => (
                      <span key={idx} className="px-3 py-1 text-sm bg-white dark:bg-[#2d1f3d]/60 border border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300 rounded-full shadow-sm">{v}</span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-green-700 dark:text-green-400">No specific verbs suggested</div>
                )}
              </div>

              {/* Structure Tips */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">📐</span>
                  <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-400">Structure Tips</h4>
                </div>
                {atsData.corrections.structureTips && atsData.corrections.structureTips.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-yellow-900 dark:text-yellow-300 space-y-1">
                    {atsData.corrections.structureTips.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">No structure tips provided</div>
                )}
              </div>
            </div>

            {/* Sample Bullet Rewrites */}
            {atsData.corrections.sampleBulletRewrites && atsData.corrections.sampleBulletRewrites.length > 0 && (
              <div className="mt-8 bg-white dark:bg-[#2d1f3d]/50 border border-gray-200 dark:border-pink-500/20 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <span className="text-xl mr-2">✍️</span>
                  <h4 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Sample Bullet Rewrites</h4>
                </div>
                <div className="space-y-4">
                  {atsData.corrections.sampleBulletRewrites.map((rw, idx) => {
                    const parts = String(rw).split('\nAfter: ');
                    const before = parts[0].replace('Before: ', '');
                    const after = parts[1] || '';
                    return (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Before</div>
                          <div className="text-sm text-red-900 dark:text-red-300">{before}</div>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">After</div>
                          <div className="text-sm text-green-900 dark:text-green-300">{after}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/predict')}
            className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <span>Edit</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          {/* Grammar Correction Button - Show only if there are grammar issues */}
          {atsData.flagged_issues && (() => {
            const spellingGrammarIssues = [
              ...(atsData.flagged_issues.critical || []),
              ...(atsData.flagged_issues.major || []),
              ...(atsData.flagged_issues.minor || [])
            ].filter(issue => issue.category === 'Spelling & Grammar');
            
            return spellingGrammarIssues.length > 0 && (
              <button
                onClick={() => navigate('/grammar-correction')}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <span>Correct Grammar</span>
              </button>
            );
          })()}
          
          <button
            onClick={calculateATSScore}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <span>Recalculate</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <span>Home</span>
          </button>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 shadow-lg dark:shadow-glow">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 rounded-full flex items-center justify-center mr-4 shadow-lg dark:shadow-glow">
              <span className="text-2xl text-white">📚</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-white">ATS Optimization Resources</h3>
              <p className="text-blue-700 dark:text-blue-300">Essential tips to improve your resume's ATS compatibility</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#2d1f3d]/60 rounded-xl p-6 shadow-md dark:shadow-glow border border-blue-200 dark:border-blue-800/50 hover:shadow-lg dark:hover:shadow-glow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">✓</span>
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">Best Practices</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2 mt-1">•</span>
                  <span>Use standard section headers (Experience, Education, Skills)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2 mt-1">•</span>
                  <span>Include relevant keywords from job descriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2 mt-1">•</span>
                  <span>Use simple, clean formatting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 dark:text-green-400 mr-2 mt-1">•</span>
                  <span>Save as PDF or Word document</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-[#2d1f3d]/60 rounded-xl p-6 shadow-md dark:shadow-glow border border-blue-200 dark:border-blue-800/50 hover:shadow-lg dark:hover:shadow-glow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">✗</span>
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">Common Mistakes</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="text-red-500 dark:text-red-400 mr-2 mt-1">•</span>
                  <span>Avoid graphics, images, or complex layouts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 dark:text-red-400 mr-2 mt-1">•</span>
                  <span>Don't use tables or columns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 dark:text-red-400 mr-2 mt-1">•</span>
                  <span>Avoid unusual fonts or formatting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 dark:text-red-400 mr-2 mt-1">•</span>
                  <span>Don't include personal photos</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-[#2d1f3d]/60 rounded-xl p-6 shadow-md dark:shadow-glow border border-blue-200 dark:border-blue-800/50 hover:shadow-lg dark:hover:shadow-glow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">✍️</span>
                </div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">Writing Quality</h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Always use spell-check tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Proofread multiple times</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Use proper capitalization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Avoid common grammar mistakes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Use action verbs consistently</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 dark:text-yellow-400 mr-2 mt-1">•</span>
                  <span>Check for homophone errors</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSScore;

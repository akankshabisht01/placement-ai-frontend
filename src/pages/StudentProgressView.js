import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const StudentProgressView = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    // Check if placement cell is logged in
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    
    fetchStudentProgress();
  }, [mobile]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student-progress/${encodeURIComponent(mobile)}`);
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data);
      } else {
        setError(data.message || 'Failed to fetch student progress');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-blue-100';
    if (percentage >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${themeClasses.textSecondary}`}>Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-2`}>Error</h2>
          <p className={themeClasses.textSecondary}>{error}</p>
          <button
            onClick={() => navigate('/placement-cell/dashboard', { state: { tab: 'students' } })}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { student, stats, weeklyTests, monthlyTests, topicStrengths, placementPrediction, placementCellTests } = progressData || {};

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'weak': return 'text-yellow-600 bg-yellow-100';
      case 'very weak': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`min-h-screen pt-16 ${themeClasses.pageBackground}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/placement-cell/dashboard', { state: { tab: 'students' } })}
              className={`p-2 rounded-lg hover:bg-gray-100 transition ${themeClasses.textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Student Progress</h1>
              <p className={themeClasses.textSecondary}>Viewing progress for {student?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Student Info Card */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border} mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {student?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>{student?.name}</h2>
                <p className={themeClasses.textSecondary}>{student?.rollNumber} • {student?.course}</p>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{student?.year}</span>
                  <span className="ml-2">{student?.mobileNumber}</span>
                </p>
                {student?.jobRole && (
                  <p className={`text-sm mt-1`}>
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                      {student.jobRole.split('_').map(word => {
                        const acronyms = {
                          'uiux': 'UI/UX', 'ios': 'iOS', 'ml': 'ML', 'ai': 'AI', 'bi': 'BI',
                          'nlp': 'NLP', 'sre': 'SRE', 'soc': 'SOC', 'qa': 'QA', 'ar': 'AR',
                          'vr': 'VR', 'erp': 'ERP', 'crm': 'CRM', 'dapp': 'dApp', 'nft': 'NFT',
                          'iot': 'IoT', 'api': 'API', 'devops': 'DevOps', 'mlops': 'MLOps'
                        };
                        const lower = word.toLowerCase();
                        return acronyms[lower] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                      }).join(' ')}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={`p-4 rounded-lg ${themeClasses.sectionAlt}`}>
                <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{stats?.totalTests || 0}</div>
                <div className={`text-sm ${themeClasses.textSecondary}`}>Tests Taken</div>
              </div>
              <div className={`p-4 rounded-lg ${themeClasses.sectionAlt}`}>
                <div className={`text-2xl font-bold ${getScoreColor(stats?.averageScore || 0)}`}>{stats?.averageScore || 0}%</div>
                <div className={`text-sm ${themeClasses.textSecondary}`}>Avg Score</div>
              </div>
              <div className={`p-4 rounded-lg ${themeClasses.sectionAlt}`}>
                <div className={`text-2xl font-bold text-purple-600`}>{stats?.topicsTracked || 0}</div>
                <div className={`text-sm ${themeClasses.textSecondary}`}>Topics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Placement Prediction */}
        {placementPrediction && (
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} p-6 mb-8`}>
            <h3 className={`font-semibold ${themeClasses.textPrimary} mb-4`}>Placement Prediction</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  placementPrediction.probability >= 70 ? 'bg-green-100' : 
                  placementPrediction.probability >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    placementPrediction.probability >= 70 ? 'text-green-600' : 
                    placementPrediction.probability >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(placementPrediction.probability)}%
                  </span>
                </div>
                <div>
                  <p className={`font-medium ${themeClasses.textPrimary}`}>Placement Score</p>
                  <p className={`text-sm ${placementPrediction.isEligible ? 'text-green-600' : 'text-red-600'}`}>
                    {placementPrediction.isEligible ? 'Eligible' : 'Not Eligible'}
                  </p>
                </div>
              </div>
              
              {/* Component Scores */}
              {placementPrediction.componentScores && (
                <div className="md:col-span-2">
                  <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>Component Scores:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(placementPrediction.componentScores).map(([key, value]) => (
                      <div key={key} className={`p-2 rounded-lg text-center ${themeClasses.sectionAlt}`}>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>{key.replace('Score', '')}</p>
                        <p className={`font-bold ${getScoreColor(value)}`}>{Math.round(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {placementPrediction.strengths?.length > 0 && (
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Strengths:</p>
                  <div className="flex flex-wrap gap-2">
                    {placementPrediction.strengths.map((s, i) => (
                      <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {placementPrediction.improvements?.length > 0 && (
                <div>
                  <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Areas to Improve:</p>
                  <div className="flex flex-wrap gap-2">
                    {placementPrediction.improvements.map((s, i) => (
                      <span key={i} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placement Test Type Activity */}
        {placementCellTests && placementCellTests.some(t => t.attempted) && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Placement Test Type Activity</h3>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Check whether this student attempted each test type</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {placementCellTests.filter(t => t.attempted).map((test, index) => (
                <div
                  key={index}
                  className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} p-5 ${test.attempted ? 'cursor-pointer hover:shadow-md transition' : ''}`}
                  onClick={() => test.attempted && navigate(`/placement-cell/student-tests/${encodeURIComponent(mobile)}?type=${encodeURIComponent(test.testType)}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold ${themeClasses.textPrimary}`}>{test.testType}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${test.attempted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {test.attempted ? 'Attempted' : 'Not Attempted'}
                    </span>
                  </div>
                  {test.attempted ? (
                    <p className={`text-sm ${themeClasses.textSecondary}`}>
                      Attempts: <span className={`font-medium ${themeClasses.textPrimary}`}>{test.attempts}</span>
                    </p>
                  ) : (
                    <p className={`text-sm ${themeClasses.textSecondary} italic`}>No attempts recorded yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Tests */}
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Weekly Tests</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {weeklyTests?.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={themeClasses.textSecondary}>No weekly tests taken yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weeklyTests?.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg ${themeClasses.sectionAlt} hover:shadow-sm transition`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${themeClasses.textPrimary}`}>Week {test.week}</p>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            Month {test.month} • {test.correct}/{test.totalQuestions} correct
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(test.percentage)}`}>
                            {test.percentage}%
                          </span>
                          {test.passed ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">PASS</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">FAIL</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Tests */}
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Monthly Tests</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {monthlyTests?.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className={themeClasses.textSecondary}>No monthly tests taken yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyTests?.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg ${themeClasses.sectionAlt} hover:shadow-sm transition`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className={`font-medium ${themeClasses.textPrimary}`}>Month {test.month}</p>
                          <p className={`text-sm ${themeClasses.textSecondary}`}>
                            {test.correct}/{test.totalQuestions} correct
                          </p>
                          {test.strengths?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {test.strengths.slice(0, 2).map((s, i) => (
                                <span key={i} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className={`text-lg font-bold ${getScoreColor(test.percentage)}`}>
                            {test.percentage}%
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            test.grade === 'Excellent' ? 'bg-green-100 text-green-700' :
                            test.grade === 'Good' ? 'bg-blue-100 text-blue-700' :
                            test.grade === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{test.grade}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Topic Strengths Section */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} overflow-hidden mt-8`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Topic Performance</h3>
          </div>
          <div className="p-6">
            {topicStrengths?.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className={themeClasses.textSecondary}>No topic data yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicStrengths?.map((topic, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${themeClasses.border} hover:shadow-sm transition`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`font-medium ${themeClasses.textPrimary} truncate flex-1`} title={topic.name}>
                        {topic.name}
                      </p>
                      <span className={`text-sm font-bold ml-2 ${getScoreColor(topic.accuracy)}`}>
                        {topic.accuracy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${topic.accuracy >= 75 ? 'bg-green-500' : topic.accuracy >= 50 ? 'bg-blue-500' : topic.accuracy >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${topic.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded ${getLevelColor(topic.level)}`}>
                        {topic.level}
                      </span>
                      <span className={themeClasses.textSecondary}>
                        {topic.questionsAttempted} questions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </main>
    </div>
  );
};

export default StudentProgressView;

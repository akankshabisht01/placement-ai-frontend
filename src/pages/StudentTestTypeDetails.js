import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const StudentTestTypeDetails = () => {
  const navigate = useNavigate();
  const { mobile } = useParams();
  const [searchParams] = useSearchParams();
  const testType = searchParams.get('type') || '';
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [testHistory, setTestHistory] = useState([]);

  useEffect(() => {
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    window.scrollTo(0, 0);
    fetchData();
  }, [mobile, testType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student-progress/${encodeURIComponent(mobile)}`);
      const data = await response.json();
      if (data.success) {
        setStudentName(data.student?.name || '');
        const match = (data.placementCellTests || []).find(t => t.testType === testType);
        setTestHistory(match?.testHistory || []);
      } else {
        setError(data.message || 'Failed to fetch data');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className={`${themeClasses.cardBackground} rounded-xl p-8 text-center max-w-md`}>
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 ${themeClasses.pageBackground}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition ${themeClasses.textSecondary}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{testType}</h1>
              <p className={themeClasses.textSecondary}>Test history for {studentName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border} mb-8`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Total Attempts</p>
              <p className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{testHistory.length}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Best Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(Math.max(...testHistory.map(t => t.percentage || 0), 0))}`}>
                {testHistory.length > 0 ? `${Math.round(Math.max(...testHistory.map(t => t.percentage || 0)))}%` : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Average Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(testHistory.length > 0 ? testHistory.reduce((s, t) => s + (t.percentage || 0), 0) / testHistory.length : 0)}`}>
                {testHistory.length > 0 ? `${Math.round(testHistory.reduce((s, t) => s + (t.percentage || 0), 0) / testHistory.length)}%` : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Latest Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(testHistory[0]?.percentage || 0)}`}>
                {testHistory.length > 0 ? `${Math.round(testHistory[0].percentage)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Attempts List */}
        {testHistory.length === 0 ? (
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-12 border ${themeClasses.border} text-center`}>
            <p className={`text-lg ${themeClasses.textSecondary}`}>No attempts recorded for this test type</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testHistory.map((attempt, i) => (
              <div
                key={attempt.id || i}
                className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} p-5 cursor-pointer hover:shadow-md transition`}
                onClick={() => navigate(`/placement-cell/attempt-details/${attempt.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getScoreBg(attempt.percentage || 0)} ${getScoreColor(attempt.percentage || 0)}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className={`font-semibold ${themeClasses.textPrimary}`}>Attempt {i + 1}</p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Test Code: <span className="font-medium">{attempt.testCode}</span>
                      </p>
                      {attempt.submittedAt && (
                        <p className={`text-xs ${themeClasses.textSecondary} mt-0.5`}>
                          {new Date(attempt.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getScoreColor(attempt.percentage || 0)}`}>
                        {attempt.percentage != null ? `${Math.round(attempt.percentage)}%` : 'N/A'}
                      </span>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {attempt.score}/{attempt.totalMarks} marks
                      </p>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>
                        {attempt.correctCount}/{attempt.totalQuestions} correct
                      </p>
                    </div>
                    <svg className={`w-5 h-5 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentTestTypeDetails;

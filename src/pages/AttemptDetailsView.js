import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const AttemptDetailsView = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    window.scrollTo(0, 0);
    fetchDetails();
  }, [attemptId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student-details/${attemptId}`);
      const data = await response.json();
      if (data.success) {
        setStudentData(data.student);
        setQuestions(data.questions || []);
      } else {
        setError(data.message || 'Failed to fetch details');
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

  const percentage = studentData?.percentage || 0;
  const correctCount = studentData?.correctCount || 0;
  const totalQuestions = studentData?.totalQuestions || 0;
  const wrongCount = totalQuestions - correctCount;
  const unanswered = questions.filter(q => !q.studentAnswer).length;

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
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Attempt Details</h1>
              <p className={themeClasses.textSecondary}>{studentData?.name} - {studentData?.rollNumber}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Score Summary */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border} mb-8`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(percentage)}`}>{Math.round(percentage)}%</p>
              <p className={`text-xs ${themeClasses.textSecondary}`}>{studentData?.score}/{studentData?.totalMarks} marks</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Correct</p>
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Wrong</p>
              <p className="text-2xl font-bold text-red-600">{wrongCount - unanswered}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Unanswered</p>
              <p className="text-2xl font-bold text-gray-500">{unanswered}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${themeClasses.textSecondary}`}>Total Questions</p>
              <p className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Question-wise Review */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Question-wise Review</h3>
        </div>
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <div key={qi} className={`p-5 rounded-xl border ${q.isCorrect ? 'border-green-200 bg-green-50' : q.studentAnswer != null ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800 flex-1">Q{q.questionNumber}. {q.question}</p>
                <span className={`ml-3 px-2.5 py-1 rounded text-xs font-medium shrink-0 ${q.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {q.isCorrect ? `+${q.marksObtained}` : '0'}/{q.marks}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => {
                  const optionLetter = String.fromCharCode(65 + oi);
                  const isCorrectOption = q.correctOption === oi;
                  const isStudentAnswer = q.studentAnswer === oi;
                  let optClass = 'bg-white border-gray-200 text-gray-700';
                  if (isCorrectOption) optClass = 'bg-green-100 border-green-400 text-green-800 font-medium';
                  if (isStudentAnswer && !isCorrectOption) optClass = 'bg-red-100 border-red-400 text-red-800';
                  return (
                    <div key={oi} className={`px-3 py-2 rounded border text-sm ${optClass}`}>
                      <span className="font-medium mr-1">{optionLetter}.</span> {opt}
                    </div>
                  );
                })}
              </div>
              {(q.studentAnswer === null || q.studentAnswer === undefined) && (
                <p className="text-xs text-gray-500 mt-2 italic">Not answered</p>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AttemptDetailsView;

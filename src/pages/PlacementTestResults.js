import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const PlacementTestResults = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    fetchData();
  }, [navigate, testId]);

  const fetchData = async () => {
    try {
      const [testRes, resultsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/placement-test/preview/${testId}`),
        fetch(`${API_BASE_URL}/api/placement-test/results/${testId}`)
      ]);
      
      const testData = await testRes.json();
      const resultsData = await resultsRes.json();
      
      if (testData.success) {
        setTest(testData.testSession);
        setResultsVisible(testData.testSession.resultsVisible || false);
      }
      if (resultsData.success) {
        setResults(resultsData.results);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/toggle-results-visibility/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !resultsVisible })
      });
      
      const data = await response.json();
      if (data.success) {
        setResultsVisible(!resultsVisible);
      }
    } catch (err) {
      alert('Failed to update visibility');
    }
  };

  const fetchStudentDetails = async (studentTestId, studentInfo) => {
    setSelectedStudent(studentInfo);
    setLoadingDetails(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student-details/${studentTestId}`);
      const data = await response.json();
      
      if (data.success) {
        setStudentDetails(data);
      } else {
        alert('Failed to load student details');
        setSelectedStudent(null);
      }
    } catch (err) {
      alert('Failed to load student details');
      setSelectedStudent(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
  };

  const handleCloseTest = async () => {
    setClosing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/close/${testId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setShowCloseConfirm(false);
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to close test');
    } finally {
      setClosing(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;
    
    const headers = ['Rank', 'Name', 'Roll Number', 'Year', 'Score', 'Total Marks', 'Percentage', 'Correct Answers', 'Total Questions'];
    const rows = results.map(r => [
      r.rank,
      r.name,
      r.rollNumber,
      r.year,
      r.score,
      r.totalMarks,
      r.percentage + '%',
      r.correctCount || '-',
      r.totalQuestions || '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_results_${test?.testCode || testId}.csv`;
    a.click();
  };

  const getScoreBadge = (percentage) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${themeClasses.accent}`}></div>
      </div>
    );
  }

  const avgScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.percentage, 0) / results.length).toFixed(1)
    : 0;

  const passCount = results.filter(r => r.percentage >= 40).length;

  return (
    <div className={`min-h-screen pt-16 ${themeClasses.pageBackground}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm sticky top-16 z-10 border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/placement-cell/dashboard')}
                className={`${themeClasses.textSecondary} hover:opacity-80 mb-2 flex items-center gap-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Test Results</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className={themeClasses.textSecondary}>{test?.testType} - {test?.durationMinutes} minutes</p>
                {test?.testCode && (
                  <code className={`${themeClasses.badgeBackground} ${themeClasses.badgeText} px-2 py-1 rounded text-sm font-mono`}>
                    {test.testCode}
                  </code>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  test?.status === 'active' ? 'bg-green-100 text-green-700' : `${themeClasses.sectionAlt} ${themeClasses.textSecondary}`
                }`}>
                  {test?.status}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {test?.status === 'active' && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Close Test
                </button>
              )}
              <button
                onClick={handleToggleVisibility}
                className={`px-4 py-2 rounded-lg font-medium ${
                  resultsVisible
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : `${themeClasses.sectionAlt} ${themeClasses.textSecondary} border ${themeClasses.border}`
                }`}
              >
                {resultsVisible ? 'Results Visible to Students' : 'Results Hidden from Students'}
              </button>
              <button
                onClick={exportToCSV}
                disabled={results.length === 0}
                className={`px-4 py-2 ${themeClasses.gradient} text-white rounded-lg hover:opacity-90 disabled:opacity-50`}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm`}>Total Students</div>
            <div className={`text-3xl font-bold ${themeClasses.textPrimary}`}>{results.length}</div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm`}>Average Score</div>
            <div className="text-3xl font-bold text-indigo-600">{avgScore}%</div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm`}>Passed (40% or more)</div>
            <div className="text-3xl font-bold text-green-600">{passCount}</div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm`}>Highest Score</div>
            <div className="text-3xl font-bold text-yellow-600">
              {results.length > 0 ? `${results[0].percentage}%` : '-'}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm overflow-hidden border ${themeClasses.border}`}>
          <div className={`px-6 py-4 border-b ${themeClasses.border} flex justify-between items-center`}>
            <div>
              <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Student Results</h2>
              <p className={`text-sm ${themeClasses.textSecondary}`}>Sorted by score (highest first)</p>
            </div>
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-12">
              <svg className={`w-16 h-16 ${themeClasses.textSecondary} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className={themeClasses.textSecondary}>No students have submitted yet</p>
              <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                Share test code <strong className={themeClasses.textPrimary}>{test?.testCode}</strong> with students
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className={themeClasses.sectionAlt}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Rank</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Name</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Roll Number</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Year</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Score</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Percentage</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Submitted At</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${themeClasses.border}`}>
                {results.map((result) => (
                  <tr key={result._id} className={`${themeClasses.hover} transition-colors`}>
                    <td className="px-6 py-4">
                      {result.rank <= 3 ? (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          result.rank === 1 ? 'bg-yellow-500' :
                          result.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>
                          {result.rank}
                        </span>
                      ) : (
                        <span className={`${themeClasses.textSecondary} font-medium`}>{result.rank}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 font-medium ${themeClasses.textPrimary}`}>{result.name}</td>
                    <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{result.rollNumber}</td>
                    <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{result.year}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${themeClasses.textPrimary}`}>{result.score}</span>
                      <span className={themeClasses.textSecondary}>/{result.totalMarks}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(result.percentage)}`}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${themeClasses.textSecondary} text-sm`}>
                      {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchStudentDetails(result._id, result)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Close Test Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.cardBackground} rounded-2xl max-w-md w-full p-6 border ${themeClasses.border}`}>
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Close This Test?</h2>
              <p className={`${themeClasses.textSecondary} mt-2`}>
                Once closed, no more students will be able to submit their answers.
              </p>
            </div>
            
            <div className={`${themeClasses.sectionAlt} rounded-lg p-4 mb-6`}>
              <div className="flex items-center justify-between text-sm">
                <span className={themeClasses.textSecondary}>Students submitted</span>
                <span className={`font-semibold ${themeClasses.textPrimary}`}>{results.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className={themeClasses.textSecondary}>Test Code</span>
                <span className={`font-mono font-semibold ${themeClasses.textPrimary}`}>{test?.testCode}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className={`flex-1 px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.textPrimary} font-medium hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseTest}
                disabled={closing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {closing ? 'Closing...' : 'Yes, Close Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`${themeClasses.cardBackground} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border ${themeClasses.border}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${themeClasses.border} flex justify-between items-center sticky top-0 ${themeClasses.cardBackground}`}>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                  Detailed Result - {selectedStudent.name}
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Roll Number: {selectedStudent.rollNumber} | Year: {selectedStudent.year}
                </p>
              </div>
              <button
                onClick={closeDetailsModal}
                className={`p-2 rounded-lg ${themeClasses.hover}`}
              >
                <svg className={`w-6 h-6 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${themeClasses.accent}`}></div>
                </div>
              ) : studentDetails ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${themeClasses.sectionAlt} rounded-xl p-4 text-center`}>
                      <div className="text-2xl font-bold text-green-600">{studentDetails.student.correctCount}</div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>Correct</div>
                    </div>
                    <div className={`${themeClasses.sectionAlt} rounded-xl p-4 text-center`}>
                      <div className="text-2xl font-bold text-red-600">{studentDetails.student.totalQuestions - studentDetails.student.correctCount}</div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>Incorrect</div>
                    </div>
                    <div className={`${themeClasses.sectionAlt} rounded-xl p-4 text-center`}>
                      <div className="text-2xl font-bold text-indigo-600">{studentDetails.student.score}/{studentDetails.student.totalMarks}</div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>Score</div>
                    </div>
                    <div className={`${themeClasses.sectionAlt} rounded-xl p-4 text-center`}>
                      <div className={`text-2xl font-bold ${studentDetails.student.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                        {studentDetails.student.percentage}%
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>Percentage</div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {studentDetails.questions.map((q, index) => (
                      <div 
                        key={index}
                        className={`rounded-xl border ${q.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} p-4`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-sm font-medium ${q.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            Question {q.questionNumber}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {q.marksObtained}/{q.marks} marks
                          </span>
                        </div>
                        
                        <p className={`font-medium ${themeClasses.textPrimary} mb-3`}>{q.question}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((option, optIndex) => {
                            const optionLetter = String.fromCharCode(65 + optIndex);
                            // correctOption can be a number (index) or letter
                            const correctIndex = typeof q.correctOption === 'number' 
                              ? q.correctOption 
                              : q.correctOption.charCodeAt(0) - 65;
                            const studentIndex = typeof q.studentAnswer === 'number'
                              ? q.studentAnswer
                              : (q.studentAnswer !== null && q.studentAnswer !== undefined ? q.studentAnswer.charCodeAt(0) - 65 : -1);
                            
                            const isCorrectOption = optIndex === correctIndex;
                            const isStudentAnswer = optIndex === studentIndex;
                            
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg text-sm ${
                                  isCorrectOption 
                                    ? 'bg-green-100 text-green-800 font-medium' 
                                    : isStudentAnswer && !isCorrectOption
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                <span className="font-medium">{optionLetter}.</span> {option}
                              </div>
                            );
                          })}
                        </div>
                        
                        {(q.studentAnswer === null || q.studentAnswer === undefined) && (
                          <p className="text-sm text-gray-500 mt-2 italic">Not answered</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={`text-center ${themeClasses.textSecondary}`}>Failed to load details</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTestResults;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const StudentTestResult = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkMode, setCheckMode] = useState(false);
  const [listMode, setListMode] = useState(false);
  const [formData, setFormData] = useState({ testCode: '', rollNumber: '' });
  const [error, setError] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  useEffect(() => {
    // Check if student is logged in
    const linkedStudent = localStorage.getItem('linkedStudentProfile');
    if (linkedStudent) {
      const profile = JSON.parse(linkedStudent);
      setStudentProfile(profile);
      fetchAllResults(profile);
    } else {
      // Check if there's a result from submission
      const submittedResult = sessionStorage.getItem('testResult');
      if (submittedResult) {
        const parsedResult = JSON.parse(submittedResult);
        // Revalidate visibility from server to avoid stale score leakage
        if (parsedResult?.testCode && parsedResult?.rollNumber) {
          fetch(`${API_BASE_URL}/api/placement-test/student/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testCode: parsedResult.testCode,
              rollNumber: parsedResult.rollNumber
            })
          })
            .then(async (resp) => {
              const data = await resp.json();
              if (data.success) {
                setResult({
                  ...data.result,
                  testCode: data.result.testCode || parsedResult.testCode
                });
              } else if (resp.status === 403) {
                setResult({
                  ...parsedResult,
                  resultHidden: true,
                  resultsVisible: false
                });
              } else {
                setResult(parsedResult);
              }
            })
            .catch(() => setResult(parsedResult))
            .finally(() => setLoading(false));
        } else {
          setResult(parsedResult);
          setLoading(false);
        }
      } else {
        setCheckMode(true);
        setLoading(false);
      }
    }
  }, []);

  const handleViewDetailedResult = async () => {
    if (!result?.testCode || !result?.rollNumber) {
      setError('Detailed result is not available for this attempt');
      return;
    }

    setDetailsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/result-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode: result.testCode,
          rollNumber: result.rollNumber
        })
      });

      const data = await response.json();
      if (data.success) {
        setDetailsData(data);
        setDetailsOpen(true);
      } else {
        setError(data.message || 'Unable to load detailed result');
      }
    } catch (err) {
      setError('Network error while loading detailed result');
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchAllResults = async (profile) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/my-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: profile.sessionToken,
          rollNumber: profile.rollNumber
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAllResults(data.results);
        setListMode(true);
      } else {
        setError(data.message || 'Failed to fetch results');
        setCheckMode(true);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setCheckMode(true);
    } finally {
      setLoading(false);
    }
  };

  const viewResultDetails = (testResult) => {
    if (testResult.resultsVisible === false) {
      setError('Results for this test have not been released yet.');
      return;
    }

    setResult({
      name: testResult.name,
      rollNumber: testResult.rollNumber,
      score: testResult.score,
      totalMarks: testResult.totalMarks,
      percentage: testResult.percentage,
      correctCount: testResult.correctCount,
      totalQuestions: testResult.totalQuestions,
      testType: testResult.testType,
      testCode: testResult.testCode,
      autoSubmitted: testResult.autoSubmitted,
      submittedAt: testResult.submittedAt
    });
    setListMode(false);
  };

  const handleCheckResult = async (e) => {
    e.preventDefault();
    if (!formData.testCode.trim() || !formData.rollNumber.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode: formData.testCode.trim().toUpperCase(),
          rollNumber: formData.rollNumber.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
        setCheckMode(false);
      } else {
        setError(data.message || 'Result not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // List of all tests for logged-in student
  if (listMode && studentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">My Test Results</h1>
              <p className="text-gray-500 mt-1">{studentProfile.name} • {studentProfile.rollNumber}</p>
            </div>
          </div>

          {/* Results List */}
          {allResults.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tests Taken Yet</h3>
              <p className="text-gray-500 mb-4">You haven't submitted any tests yet.</p>
              <button
                onClick={() => navigate('/student-test')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Take a Test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {allResults.map((test, index) => (
                <div
                  key={test.id}
                  onClick={() => viewResultDetails(test)}
                  className={`bg-white rounded-xl shadow-lg p-5 transition transform ${
                    test.resultsVisible === false
                      ? 'cursor-not-allowed opacity-90'
                      : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {test.testType}
                        </span>
                        <span className="text-xs text-gray-400">#{test.testCode}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Test #{index + 1}</h3>
                      <p className="text-sm text-gray-500">
                        {test.submittedAt ? new Date(test.submittedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      {test.resultsVisible === false ? (
                        <>
                          <div className="text-lg font-semibold text-amber-600">Pending</div>
                          <p className="text-sm text-gray-500">Result not released</p>
                        </>
                      ) : (
                        <>
                          <div className={`text-2xl font-bold ${getScoreColor(test.percentage)}`}>
                            {test.percentage}%
                          </div>
                          <p className="text-sm text-gray-500">{test.score}/{test.totalMarks}</p>
                        </>
                      )}
                    </div>
                    {test.resultsVisible !== false && (
                      <svg className="w-5 h-5 text-gray-400 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {allResults.length > 0 && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 text-center text-white">
              <p className="text-sm">
                Total Tests: <span className="font-bold">{allResults.length}</span> • 
                Average Score: <span className="font-bold">
                  {(() => {
                    const visibleResults = allResults.filter(t => t.resultsVisible !== false);
                    if (visibleResults.length === 0) return 'N/A';
                    const avg = Math.round(visibleResults.reduce((sum, t) => sum + (t.percentage || 0), 0) / visibleResults.length);
                    return `${avg}%`;
                  })()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check Result Form
  if (checkMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="text-center mb-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Check Your Result</h1>
            <p className="text-gray-500 mt-2">Enter your details to view your test result</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleCheckResult} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
              <input
                type="text"
                value={formData.testCode}
                onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your roll number"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              View Result
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/student-test" className="text-blue-600 hover:text-blue-800 font-medium">
              Take a new test
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show Result
  if (result?.resultHidden || result?.resultsVisible === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-800 via-orange-800 to-yellow-700 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center text-white">
              <p className="text-amber-100 text-sm uppercase tracking-wider mb-2">Test Submitted</p>
              <h1 className="text-3xl font-bold mb-1">{result.name}</h1>
              <p className="text-amber-100">{result.rollNumber}</p>
            </div>

            <div className="px-6 py-10 text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-amber-800 mb-2">Result Not Released Yet</h2>
                <p className="text-amber-700">
                  Your test is submitted successfully. The placement cell has currently hidden results.
                  You will be able to view your score once they make results visible.
                </p>
              </div>

              {result.testType && (
                <div className="text-gray-600 text-sm">
                  <p>Test: {result.testType}</p>
                  {result.testCode && <p>Code: {result.testCode}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            {studentProfile ? (
              <>
                <button
                  onClick={() => {
                    setResult(null);
                    setListMode(true);
                  }}
                  className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Back to All Results
                </button>
                <button
                  onClick={() => navigate('/student/dashboard')}
                  className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  sessionStorage.removeItem('testResult');
                  navigate('/');
                }}
                className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-teal-800 to-blue-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Auto-submitted warning */}
        {result.autoSubmitted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800">Your test was auto-submitted because time expired.</p>
          </div>
        )}

        {/* Result Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-8 text-center text-white">
            <p className="text-green-100 text-sm uppercase tracking-wider mb-2">Test Completed</p>
            <h1 className="text-3xl font-bold mb-1">{result.name}</h1>
            <p className="text-green-100">{result.rollNumber}</p>
          </div>

          {/* Score Circle */}
          <div className="relative -mt-12 flex justify-center">
            <div className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-green-500">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.percentage)}`}>
                  {result.percentage}%
                </div>
                <div className="text-gray-500 text-sm">Score</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-8">
            {/* Grade Badge */}
            <div className="text-center mb-8">
              <span className={`inline-block px-6 py-2 rounded-full text-xl font-bold ${
                result.percentage >= 40 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                Grade: {getGrade(result.percentage)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{result.score}</div>
                <div className="text-gray-500 text-sm">Marks Obtained</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{result.totalMarks}</div>
                <div className="text-gray-500 text-sm">Total Marks</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.correctCount || '-'}</div>
                <div className="text-gray-500 text-sm">Correct Answers</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-800">{result.totalQuestions || '-'}</div>
                <div className="text-gray-500 text-sm">Total Questions</div>
              </div>
            </div>

            {/* Rank (if available) */}
            {result.rank && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {result.rank <= 3 && (
                    <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  <span className="text-4xl font-bold text-yellow-600">#{result.rank}</span>
                </div>
                <p className="text-yellow-700">
                  Your rank out of {result.totalStudents} students
                </p>
              </div>
            )}

            {/* Test Info */}
            {result.testType && (
              <div className="text-center text-gray-500 text-sm">
                <p>Test: {result.testType}</p>
                {result.testCode && <p>Code: {result.testCode}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          {studentProfile ? (
            <>
              <button
                onClick={() => {
                  setResult(null);
                  setListMode(true);
                }}
                className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Back to All Results
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  sessionStorage.removeItem('testResult');
                  navigate('/');
                }}
                className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('testResult');
                  navigate('/student-test');
                }}
                className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
              >
                Take Another Test
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition"
          >
            Print Result
          </button>
          {!result?.resultHidden && result?.resultsVisible !== false && (
            <button
              onClick={handleViewDetailedResult}
              disabled={detailsLoading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {detailsLoading ? 'Loading...' : 'View Detailed Result'}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Detailed Result Modal */}
        {detailsOpen && detailsData?.questions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Detailed Result</h3>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4">
                {detailsData.questions.map((q, idx) => (
                  <div key={q.questionNumber || idx} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">
                        Q{q.questionNumber}. {q.questionText}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOpt = optIdx === q.correctOption;
                        const isStudentOpt = optIdx === q.studentAnswer;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg border ${
                              isCorrectOpt
                                ? 'bg-green-50 border-green-300'
                                : isStudentOpt
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-sm text-gray-600">
                      Marks: {q.marksObtained}/{q.marks}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTestResult;

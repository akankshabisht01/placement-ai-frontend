import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const PlacementTestPreview = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTestCodeModal, setShowTestCodeModal] = useState(false);
  const [activatedTestCode, setActivatedTestCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [linkCopySuccess, setLinkCopySuccess] = useState(false);
  const [activationType, setActivationType] = useState('now'); // 'now' or 'schedule'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState('12');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledAmPm, setScheduledAmPm] = useState('AM');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);

  useEffect(() => {
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    fetchTest();
  }, [navigate, testId]);

  // Helper to convert 12-hour time to 24-hour format
  const getScheduledTime24 = () => {
    let hour = parseInt(scheduledHour, 10);
    if (scheduledAmPm === 'PM' && hour !== 12) {
      hour += 12;
    } else if (scheduledAmPm === 'AM' && hour === 12) {
      hour = 0;
    }
    return `${hour.toString().padStart(2, '0')}:${scheduledMinute}`;
  };

  const fetchTest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/preview/${testId}`);
      const data = await response.json();
      
      if (data.success) {
        setTest(data.testSession);
      } else {
        alert(data.message || 'Failed to load test');
        navigate('/placement-cell/dashboard');
      }
    } catch (err) {
      console.error('Error fetching test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/regenerate/${testId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setTest(data.testSession);
      } else {
        alert(data.message || 'Failed to regenerate');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleConfirm = async () => {
    // Validate scheduling if selected
    if (activationType === 'schedule') {
      if (!scheduledDate) {
        alert('Please select a date for scheduling');
        return;
      }
      const time24 = getScheduledTime24();
      const scheduledDateTime = new Date(`${scheduledDate}T${time24}`);
      if (scheduledDateTime <= new Date()) {
        alert('Scheduled time must be in the future');
        return;
      }
    }

    setConfirming(true);
    try {
      const time24 = getScheduledTime24();
      const requestBody = activationType === 'schedule' 
        ? { scheduledFor: new Date(`${scheduledDate}T${time24}`).toISOString() }
        : {};
        
      const response = await fetch(`${API_BASE_URL}/api/placement-test/confirm/${testId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      
      if (data.success) {
        setActivatedTestCode(data.testCode);
        setIsScheduled(data.status === 'scheduled');
        setScheduledFor(data.scheduledFor);
        setShowConfirmDialog(false);
        setShowTestCodeModal(true);
      } else {
        alert(data.message || 'Failed to confirm');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setConfirming(false);
    }
  };

  // Get minimum date (today) for scheduling
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activatedTestCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = activatedTestCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Generate direct link for students
  const getDirectLink = () => {
    return `${window.location.origin}/student-test?code=${activatedTestCode}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getDirectLink());
      setLinkCopySuccess(true);
      setTimeout(() => setLinkCopySuccess(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = getDirectLink();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopySuccess(true);
      setTimeout(() => setLinkCopySuccess(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const directLink = getDirectLink();
    let message;
    if (isScheduled && scheduledFor) {
      message = `🎓 Placement Test Scheduled!\n\nTest Code: ${activatedTestCode}\n📅 Goes live on: ${new Date(scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}\n\n🔗 Direct Link: ${directLink}\n\nClick the link or use the code to join when the test starts. Good luck!`;
    } else {
      message = `🎓 Placement Test Code: ${activatedTestCode}\n\n🔗 Direct Link: ${directLink}\n\nClick the link or use the code to access your test. Good luck!`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareEmail = () => {
    const directLink = getDirectLink();
    const subject = isScheduled ? 'Placement Test Scheduled' : 'Placement Test Access Code';
    let body;
    if (isScheduled && scheduledFor) {
      body = `Hi,\n\nA placement test has been scheduled for you.\n\nTest Code: ${activatedTestCode}\nGoes Live: ${new Date(scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}\n\nDirect Link: ${directLink}\n\nClick the link or use the code to join when the test becomes active.\n\nBest of luck!`;
    } else {
      body = `Hi,\n\nYour placement test access code is: ${activatedTestCode}\n\nDirect Link: ${directLink}\n\nClick the link or use the code to start your test.\n\nBest of luck!`;
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/delete/${testId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        navigate('/placement-cell/dashboard');
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${themeClasses.accent}`}></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <p className={themeClasses.textSecondary}>Test not found</p>
      </div>
    );
  }

  const difficultyStats = {
    easy: test.questions.filter(q => q.difficulty === 'easy').length,
    medium: test.questions.filter(q => q.difficulty === 'medium').length,
    hard: test.questions.filter(q => q.difficulty === 'hard').length
  };

  return (
    <div className={`min-h-screen pt-16 ${themeClasses.pageBackground}`}>
      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm sticky top-16 z-10 border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/placement-cell/dashboard')}
                className={`${themeClasses.textSecondary} hover:${themeClasses.textPrimary} mb-2 flex items-center gap-1`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Test Preview</h1>
              <p className={themeClasses.textSecondary}>{test.testType} - {test.durationMinutes} minutes</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textPrimary} rounded-lg hover:opacity-80 disabled:opacity-50`}
              >
                {regenerating ? 'Regenerating...' : 'Regenerate Questions'}
              </button>
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Confirm & Activate
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Test Summary */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 mb-8 border ${themeClasses.border}`}>
          <h2 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4`}>Test Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <div className={`${themeClasses.textSecondary} text-sm`}>Total Questions</div>
              <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{test.totalQuestions}</div>
            </div>
            <div>
              <div className={`${themeClasses.textSecondary} text-sm`}>Total Marks</div>
              <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{test.totalMarks}</div>
            </div>
            <div>
              <div className={`${themeClasses.textSecondary} text-sm`}>Duration</div>
              <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{test.durationMinutes} min</div>
            </div>
            <div>
              <div className={`${themeClasses.textSecondary} text-sm`}>Max Students</div>
              <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{test.maxStudents}</div>
            </div>
            <div>
              <div className={`${themeClasses.textSecondary} text-sm`}>Difficulty Mix</div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  E: {difficultyStats.easy}
                </span>
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  M: {difficultyStats.medium}
                </span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                  H: {difficultyStats.hard}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm overflow-hidden border ${themeClasses.border}`}>
          <div className={`px-6 py-4 border-b ${themeClasses.border}`}>
            <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Questions Preview</h2>
            <p className={`text-sm ${themeClasses.textSecondary}`}>Review all questions before activating the test</p>
          </div>
          
          <div className={`divide-y ${themeClasses.border}`}>
            {test.questions.map((question, index) => (
              <div key={index} className={`p-6 ${themeClasses.hover} transition-colors`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-full text-sm">
                      Q{question.questionNumber}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadge(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    {question.category && (
                      <span className={`text-xs ${themeClasses.textSecondary} ${themeClasses.sectionAlt} px-2 py-1 rounded`}>
                        {question.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-sm ${themeClasses.textSecondary}`}>{question.marks} marks</span>
                </div>
                
                <p className={`${themeClasses.textPrimary} font-medium mb-4`}>{question.questionText}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border-2 ${
                        optIndex === question.correctOption
                          ? 'border-green-500 bg-green-50'
                          : `${themeClasses.border} ${themeClasses.sectionAlt}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                          optIndex === question.correctOption
                            ? 'bg-green-500 text-white'
                            : `${themeClasses.sectionAlt} ${themeClasses.textSecondary}`
                        }`}>
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className={optIndex === question.correctOption ? 'text-green-800 font-medium' : themeClasses.textPrimary}>
                          {option}
                        </span>
                        {optIndex === question.correctOption && (
                          <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.cardBackground} rounded-2xl max-w-lg w-full p-6 border ${themeClasses.border}`}>
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Confirm Test Activation</h2>
              <p className={`${themeClasses.textSecondary} mt-2`}>
                Once confirmed, the test cannot be edited. A unique test code will be generated for students.
              </p>
            </div>
            
            <div className={`${themeClasses.sectionAlt} rounded-lg p-4 mb-6`}>
              <div className={`text-sm ${themeClasses.textSecondary} space-y-1`}>
                <p><strong className={themeClasses.textPrimary}>Test Type:</strong> {test.testType}</p>
                <p><strong className={themeClasses.textPrimary}>Duration:</strong> {test.durationMinutes} minutes</p>
                <p><strong className={themeClasses.textPrimary}>Questions:</strong> {test.totalQuestions}</p>
                <p><strong className={themeClasses.textPrimary}>Total Marks:</strong> {test.totalMarks}</p>
              </div>
            </div>

            {/* Activation Type Selection */}
            <div className="mb-6">
              <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-3`}>When should the test go live?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivationType('now')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activationType === 'now'
                      ? 'border-green-500 bg-green-50'
                      : `border-gray-200 ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activationType === 'now' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${activationType === 'now' ? 'text-green-700' : themeClasses.textPrimary}`}>
                        Activate Now
                      </p>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>Start immediately</p>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setActivationType('schedule')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    activationType === 'schedule'
                      ? 'border-purple-500 bg-purple-50'
                      : `border-gray-200 ${themeClasses.hover}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activationType === 'schedule' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${activationType === 'schedule' ? 'text-purple-700' : themeClasses.textPrimary}`}>
                        Schedule
                      </p>
                      <p className={`text-xs ${themeClasses.textSecondary}`}>Go live later</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Schedule Date/Time Picker */}
            {activationType === 'schedule' && (
              <div className={`${themeClasses.sectionAlt} rounded-lg p-4 mb-6`}>
                <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-3`}>
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Date & Time
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={`block text-xs ${themeClasses.textSecondary} mb-1`}>Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={getMinDate()}
                      className={`w-full px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.textPrimary}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs ${themeClasses.textSecondary} mb-1`}>Time</label>
                    <div className="flex gap-2">
                      <select
                        value={scheduledHour}
                        onChange={(e) => setScheduledHour(e.target.value)}
                        className={`flex-1 px-2 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.textPrimary} text-center`}
                      >
                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className={`flex items-center ${themeClasses.textPrimary} font-bold`}>:</span>
                      <select
                        value={scheduledMinute}
                        onChange={(e) => setScheduledMinute(e.target.value)}
                        className={`flex-1 px-2 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.textPrimary} text-center`}
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={scheduledAmPm}
                        onChange={(e) => setScheduledAmPm(e.target.value)}
                        className={`px-2 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.textPrimary} font-medium`}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                {scheduledDate && (
                  <p className="text-sm text-purple-600 mt-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test will go live on {new Date(`${scheduledDate}T${getScheduledTime24()}`).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setActivationType('now');
                  setScheduledDate('');
                  setScheduledHour('12');
                  setScheduledMinute('00');
                  setScheduledAmPm('AM');
                }}
                className={`flex-1 px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.textPrimary} font-medium hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || (activationType === 'schedule' && !scheduledDate)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium disabled:opacity-50 ${
                  activationType === 'schedule'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {confirming 
                  ? (activationType === 'schedule' ? 'Scheduling...' : 'Activating...') 
                  : (activationType === 'schedule' ? 'Schedule Test' : 'Activate Now')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Code Success Modal */}
      {showTestCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.cardBackground} rounded-2xl max-w-md w-full p-6 border ${themeClasses.border} animate-fadeIn`}>
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isScheduled ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                {isScheduled ? (
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                {isScheduled ? 'Test Scheduled!' : 'Test Activated!'}
              </h2>
              <p className={`${themeClasses.textSecondary} mt-2`}>
                {isScheduled 
                  ? 'Share this code with your students. The test will go live automatically.'
                  : 'Share this code with your students'
                }
              </p>
            </div>

            {/* Scheduled Time Badge */}
            {isScheduled && scheduledFor && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 text-center">
                <p className="text-sm text-purple-600 font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Goes live on {new Date(scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            )}
            
            {/* Test Code Display */}
            <div className={`rounded-xl p-6 mb-6 text-center ${
              isScheduled 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
            }`}>
              <p className="text-white text-sm mb-2 opacity-80">Test Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-bold text-white tracking-wider font-mono">
                  {activatedTestCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                  title="Copy code"
                >
                  {copySuccess ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copySuccess && (
                <p className="text-white text-sm mt-2 animate-pulse">Copied to clipboard!</p>
              )}
            </div>

            {/* Direct Link Display */}
            <div className={`${themeClasses.sectionAlt} rounded-xl p-4 mb-6`}>
              <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Direct Link (students can click to join)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getDirectLink()}
                  className={`flex-1 px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground} ${themeClasses.textPrimary} text-sm font-mono`}
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    linkCopySuccess 
                      ? 'bg-green-500 text-white' 
                      : `border ${themeClasses.border} ${themeClasses.textPrimary} hover:opacity-80`
                  }`}
                  title="Copy link"
                >
                  {linkCopySuccess ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {linkCopySuccess && (
                <p className="text-green-600 text-xs mt-1">Link copied!</p>
              )}
            </div>

            {/* Share Options */}
            <div className="mb-6">
              <p className={`text-sm ${themeClasses.textSecondary} mb-3 text-center`}>Share via</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  onClick={handleShareEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 px-4 py-2 border ${themeClasses.border} ${themeClasses.textPrimary} rounded-lg hover:opacity-80 transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowTestCodeModal(false);
                navigate('/placement-cell/dashboard');
              }}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTestPreview;

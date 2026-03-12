import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const StudentTestAccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testCode, setTestCode] = useState('');
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('code'); // 'code' | 'register' | 'link-profile' | 'student-login' | 'waiting'
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    year: ''
  });
  const [registering, setRegistering] = useState(false);
  const [linkProfileData, setLinkProfileData] = useState({
    name: '',
    mobileNumber: '',
    rollNumber: '',
    year: '',
    collegeName: '',
    course: ''
  });
  const [linkingProfile, setLinkingProfile] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [collegeSearchResults, setCollegeSearchResults] = useState([]);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [studentLoginMobile, setStudentLoginMobile] = useState('');
  const [studentLoggingIn, setStudentLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [scheduledTime, setScheduledTime] = useState(null);

  // Auto-fill test code from URL if present
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setTestCode(codeFromUrl.toUpperCase());
      // Auto-check the code
      checkCodeFromUrl(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Function to check code (used by URL auto-fill)
  const checkCodeFromUrl = async (code) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/access/${code}`);
      const data = await response.json();
      
      if (data.success) {
        setTestInfo(data.testInfo);
        
        if (data.testInfo.isScheduled && data.testInfo.scheduledFor) {
          setScheduledTime(data.testInfo.scheduledFor);
          setStep('waiting');
        } else {
          setStep('register');
        }
      } else {
        setError(data.message || 'Invalid test code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if student is already logged in (don't redirect, just track state)
  useEffect(() => {
    const storedProfile = localStorage.getItem('linkedStudentProfile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        if (profile && profile.sessionToken) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        localStorage.removeItem('linkedStudentProfile');
      }
    }
  }, []);

  // Countdown timer for scheduled tests
  useEffect(() => {
    if (step !== 'waiting' || !scheduledTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(scheduledTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        // Time's up! Check if test is now active
        checkIfTestActive();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds, total: diff });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [step, scheduledTime]);

  // Check if scheduled test is now active
  const checkIfTestActive = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/check-scheduled/${testCode.trim().toUpperCase()}`);
      const data = await response.json();
      
      if (data.success && data.status === 'active') {
        // Test is now active, update testInfo and move to register step
        setTestInfo(prev => ({ ...prev, status: 'active', isScheduled: false }));
        setStep('register');
      }
    } catch (err) {
      console.error('Error checking test status:', err);
    }
  };

  // Search colleges for autocomplete
  const searchColleges = async (query) => {
    if (query.length < 2) {
      setCollegeSearchResults([]);
      setShowCollegeSuggestions(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/colleges/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setCollegeSearchResults(data.colleges);
        setShowCollegeSuggestions(data.colleges.length > 0);
      }
    } catch (err) {
      console.error('Error searching colleges:', err);
    }
  };

  // Handle college input change
  const handleCollegeInputChange = (e) => {
    const value = e.target.value;
    setLinkProfileData({ ...linkProfileData, collegeName: value });
    searchColleges(value);
  };

  // Handle college selection from dropdown
  const handleSelectCollege = (collegeName) => {
    setLinkProfileData({ ...linkProfileData, collegeName: collegeName });
    setShowCollegeSuggestions(false);
    setCollegeSearchResults([]);
  };

  const handleCheckCode = async (e) => {
    e.preventDefault();
    if (!testCode.trim()) {
      setError('Please enter a test code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/access/${testCode.trim().toUpperCase()}`);
      const data = await response.json();
      
      if (data.success) {
        setTestInfo(data.testInfo);
        
        // Check if test is scheduled for later
        if (data.testInfo.isScheduled && data.testInfo.scheduledFor) {
          setScheduledTime(data.testInfo.scheduledFor);
          setStep('waiting');
        } else {
          setStep('register');
        }
      } else {
        setError(data.message || 'Invalid test code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.rollNumber.trim() || !formData.year.trim()) {
      setError('All fields are required');
      return;
    }
    
    setRegistering(true);
    setError('');
    
    try {
      // Get mobile number if student is logged in
      let mobileNumber = '';
      const storedProfile = localStorage.getItem('linkedStudentProfile');
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          mobileNumber = profile.mobileNumber || '';
        } catch (e) {}
      }
      
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCode: testCode.trim().toUpperCase(),
          ...formData,
          mobileNumber: mobileNumber  // Pass mobile number for linked students
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store test data in session storage
        sessionStorage.setItem('studentTestSession', JSON.stringify({
          studentTest: data.studentTest,
          test: data.test
        }));
        navigate('/student-test/take');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleLinkProfile = async (e) => {
    e.preventDefault();
    
    const { name, mobileNumber, rollNumber, year, collegeName, course } = linkProfileData;
    if (!name.trim() || !mobileNumber.trim() || !rollNumber.trim() || !year.trim() || !collegeName.trim() || !course.trim()) {
      setError('All fields are required');
      return;
    }
    
    // Validate mobile number (10 digits)
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLinkingProfile(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/link-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkProfileData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLinkSuccess(true);
        // Store linked profile in localStorage for future use
        localStorage.setItem('studentProfile', JSON.stringify(data.profile));
      } else {
        setError(data.message || 'Profile linking failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLinkingProfile(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    if (!studentLoginMobile.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    
    // Validate mobile number (10 digits)
    const cleanMobile = studentLoginMobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setStudentLoggingIn(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: cleanMobile })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store student profile in localStorage
        localStorage.setItem('linkedStudentProfile', JSON.stringify(data.student));
        // Navigate to student dashboard
        navigate('/student/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setStudentLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        {step === 'code' ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => navigate(isLoggedIn ? '/student/dashboard' : '/placement-cell/login')}
              className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Enter Test Code</h1>
              <p className="text-gray-500 mt-2">Enter the test code provided by your placement cell</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckCode}>
              <div className="mb-6">
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => {
                    setTestCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Want to check your result?{' '}
                <a href="/student-test/result" className="text-blue-600 hover:text-blue-800 font-medium">
                  View Result
                </a>
              </p>
            </div>
          </>
        ) : step === 'register' ? (
          <>
            <div className="mb-6">
              <button
                onClick={() => {
                  setStep('code');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Student Registration</h1>
              <p className="text-gray-500 mt-2">Enter your details to start the test</p>
            </div>

            {/* Test Info Card */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Test Type</span>
                  <p className="font-semibold text-gray-800">{testInfo?.testType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Duration</span>
                  <p className="font-semibold text-gray-800">{testInfo?.durationMinutes} minutes</p>
                </div>
                <div>
                  <span className="text-gray-500">Questions</span>
                  <p className="font-semibold text-gray-800">{testInfo?.totalQuestions}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Marks</span>
                  <p className="font-semibold text-gray-800">{testInfo?.totalMarks}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important Instructions:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-yellow-700">
                      <li>Test will auto-submit when time expires</li>
                      <li>Do not refresh or close the browser</li>
                      <li>All answers are auto-saved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 mt-6"
              >
                {registering ? 'Starting Test...' : 'Start Test'}
              </button>
            </form>
          </>
        ) : step === 'waiting' ? (
          <>
            <div className="text-center py-4">
              <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold animate-pulse">LIVE</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Scheduled</h2>
              <p className="text-gray-500 mb-6">This test is scheduled to start soon. Please wait...</p>
              
              {/* Test Info Card */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm opacity-80">Test Code</span>
                </div>
                <p className="text-2xl font-bold font-mono tracking-wider">{testCode.toUpperCase()}</p>
                <p className="text-sm opacity-80 mt-2">{testInfo?.testType}</p>
              </div>

              {/* Countdown Display */}
              {countdown && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3">Test begins in</p>
                  <div className="flex justify-center gap-4">
                    {countdown.hours > 0 && (
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-3 min-w-[70px]">
                        <div className="text-3xl font-bold text-purple-600">{countdown.hours.toString().padStart(2, '0')}</div>
                        <div className="text-xs text-gray-500 uppercase">Hours</div>
                      </div>
                    )}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-3 min-w-[70px]">
                      <div className="text-3xl font-bold text-purple-600">{countdown.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-xs text-gray-500 uppercase">Minutes</div>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-4 py-3 min-w-[70px]">
                      <div className="text-3xl font-bold text-purple-600 animate-pulse">{countdown.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-xs text-gray-500 uppercase">Seconds</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Time */}
              {scheduledTime && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Scheduled for: <strong>{new Date(scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong>
                  </p>
                </div>
              )}

              {/* Test Details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-800">{testInfo?.durationMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Questions</p>
                    <p className="font-semibold text-gray-800">{testInfo?.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Marks</p>
                    <p className="font-semibold text-gray-800">{testInfo?.totalMarks}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                The page will automatically refresh when the test starts
              </p>

              <button
                onClick={() => {
                  setStep('code');
                  setTestCode('');
                  setTestInfo(null);
                  setScheduledTime(null);
                  setCountdown(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Enter Different Code
              </button>
            </div>
          </>
        ) : step === 'link-profile' ? (
          <>
            {linkSuccess ? (
              <div className="text-center py-8">
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h2>
                <p className="text-gray-500 mb-8">Your request has been sent to the Placement Cell for approval.<br/>You'll be notified once approved.</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setStep('code');
                      setLinkSuccess(false);
                    }}
                    className="bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-blue-700 transition text-lg"
                  >
                    Take a Test
                  </button>
                  <button
                    onClick={() => {
                      setStep('code');
                      setLinkSuccess(false);
                    }}
                    className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition py-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Back Button */}
                <button
                  onClick={() => {
                    setStep('code');
                    setError('');
                    setLinkSuccess(false);
                  }}
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">Link Your Profile</h1>
                  <p className="text-gray-500 mt-2">Register with your placement cell to receive test updates</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLinkProfile}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={linkProfileData.name}
                        onChange={(e) => setLinkProfileData({ ...linkProfileData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={linkProfileData.mobileNumber}
                        onChange={(e) => setLinkProfileData({ ...linkProfileData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={linkProfileData.rollNumber}
                        onChange={(e) => setLinkProfileData({ ...linkProfileData, rollNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Enter your roll number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <select
                        value={linkProfileData.year}
                        onChange={(e) => setLinkProfileData({ ...linkProfileData, year: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      >
                        <option value="">Select year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                      <input
                        type="text"
                        value={linkProfileData.collegeName}
                        onChange={handleCollegeInputChange}
                        onFocus={() => linkProfileData.collegeName.length >= 2 && setShowCollegeSuggestions(collegeSearchResults.length > 0)}
                        onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Start typing college name..."
                        autoComplete="off"
                      />
                      {showCollegeSuggestions && collegeSearchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {collegeSearchResults.map((college, idx) => (
                            <div
                              key={idx}
                              onMouseDown={() => handleSelectCollege(college.name)}
                              className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">{college.name}</div>
                              <div className="text-sm text-gray-500">{college.city}, {college.state}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                      <input
                        type="text"
                        value={linkProfileData.course}
                        onChange={(e) => setLinkProfileData({ ...linkProfileData, course: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="e.g., B.Tech CSE, BCA, MCA"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={linkingProfile}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 mt-6"
                  >
                    {linkingProfile ? 'Linking Profile...' : 'Link My Profile'}
                  </button>
                </form>
              </>
            )}
          </>
        ) : step === 'student-login' ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => { setStep('code'); setError(''); setStudentLoginMobile(''); }}
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Student Login</h1>
              <p className="text-gray-500 mt-2">Login with your linked mobile number</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleStudentLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={studentLoginMobile}
                  onChange={(e) => setStudentLoginMobile(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-center text-lg tracking-widest"
                  placeholder="Enter your 10-digit number"
                  maxLength="10"
                />
              </div>

              <button
                type="submit"
                disabled={studentLoggingIn}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {studentLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm">
                Don't have a linked account?{' '}
                <button 
                  onClick={() => { setStep('link-profile'); setError(''); }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Link Profile
                </button>
              </p>
            </div>
          </>
        ) : null}

        {!(step === 'link-profile' && linkSuccess) && step !== 'student-login' && !isLoggedIn && (
          <div className="mt-6 text-center space-y-2">
            <button 
              onClick={() => { setStep('link-profile'); setError(''); }}
              className="text-blue-600 text-sm hover:text-blue-800 font-medium"
            >
              Link Profile with Your Placement Cell
            </button>
            <p className="text-gray-400 text-xs">|</p>
            <button 
              onClick={() => { setStep('student-login'); setError(''); }}
              className="text-green-600 text-sm hover:text-green-800 font-medium"
            >
              Already Linked? Student Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTestAccess;

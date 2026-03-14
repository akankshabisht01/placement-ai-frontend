import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const PlacementCellLogin = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [showLanding, setShowLanding] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    college: '',
    otp: ''
  });
  const [collegeSearchResults, setCollegeSearchResults] = useState([]);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotData, setForgotData] = useState({
    email: '',
    otpDigits: ['', '', '', '', '', ''],
    otpVerified: false,
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const forgotOtpInputRefs = useRef([]);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());

  // Check if user is already logged in on component mount
  useEffect(() => {
    // Check for placement cell admin login
    const storedAuth = localStorage.getItem('placementCellAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData && authData.email) {
          // Placement cell admin is already logged in, redirect to dashboard
          navigate('/placement-cell/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('placementCellAuth');
      }
    }
    
    // Check for linked student login
    const storedStudentProfile = localStorage.getItem('linkedStudentProfile');
    if (storedStudentProfile) {
      try {
        const studentData = JSON.parse(storedStudentProfile);
        if (studentData && studentData.sessionToken) {
          // Student is already logged in, redirect to student dashboard
          navigate('/student/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('linkedStudentProfile');
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
    setFormData({ ...formData, college: value });
    setError('');
    searchColleges(value);
  };

  // Handle college selection from dropdown
  const handleSelectCollege = (collegeName) => {
    setFormData({ ...formData, college: collegeName });
    setShowCollegeSuggestions(false);
    setCollegeSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otpDigits.join('');

    if (!isLogin && !otpVerified) {
      setError('Please verify OTP before creating account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/placement-test/auth/login' : '/api/placement-test/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            college: formData.college,
            otp: otpValue
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          // Store session
          localStorage.setItem('placementCellAuth', JSON.stringify(data.user));
          navigate('/placement-cell/dashboard');
        } else {
          // Switch to login after successful registration
          setIsLogin(true);
          setFormData({ email: formData.email, password: '', name: '', college: '', otp: '' });
          setOtpDigits(['', '', '', '', '', '']);
          setOtpSent(false);
          setOtpVerified(false);
          setOtpMessage('');
          setSuccessMessage('Registration successful! Please sign in with your new account.');
        }
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationOtp = async () => {
    if (otpCooldown > 0) {
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter email before requesting verification OTP');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter full name before requesting verification OTP');
      return;
    }

    setSendingOtp(true);
    setError('');
    setOtpMessage('');
    setOtpVerified(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        setOtpMessage(data.message || 'Verification OTP sent to your email');
        setOtpCooldown(30);
      } else {
        setError(data.message || 'Failed to send verification OTP');
      }
    } catch (err) {
      setError('Network error while sending verification OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join('');
    if (!formData.email.trim()) {
      setError('Please enter email first');
      return;
    }
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otpValue
        })
      });

      const data = await response.json();
      if (data.success) {
        setOtpVerified(true);
        setOtpMessage(data.message || 'OTP verified successfully');
      } else {
        setOtpVerified(false);
        setError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      setOtpVerified(false);
      setError('Network error while verifying OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpBoxChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    if (otpVerified) setOtpVerified(false);
    setError('');

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => {
      nextDigits[i] = d;
    });
    setOtpDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const openForgotPassword = () => {
    setForgotMode(true);
    setForgotStep('email');
    setForgotMessage('');
    setError('');
    setSuccessMessage('');
    setForgotCooldown(0);
    setForgotData({
      email: formData.email || '',
      otpDigits: ['', '', '', '', '', ''],
      otpVerified: false,
      newPassword: '',
      confirmPassword: ''
    });
  };

  const closeForgotPassword = () => {
    setForgotMode(false);
    setError('');
    setForgotMessage('');
    setForgotCooldown(0);
    setForgotStep('email');
    setForgotData({
      email: '',
      otpDigits: ['', '', '', '', '', ''],
      otpVerified: false,
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleForgotSendOtp = async () => {
    if (forgotCooldown > 0) return;
    const emailToUse = forgotData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      setError('Please enter a valid registered email');
      return;
    }

    setForgotLoading(true);
    setError('');
    setForgotMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });

      const data = await response.json();
      if (data.success) {
        setForgotData((prev) => ({ ...prev, email: emailToUse }));
        setForgotMessage(data.message || 'Reset OTP sent to your email');
        setForgotCooldown(30);
        setForgotStep('otp');
      } else {
        setError(data.message || 'Failed to send reset OTP');
      }
    } catch (err) {
      setError('Network error while sending reset OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...forgotData.otpDigits];
    nextDigits[index] = digit;
    setForgotData({ ...forgotData, otpDigits: nextDigits, otpVerified: false });
    setError('');
    if (digit && index < 5) {
      forgotOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !forgotData.otpDigits[index] && index > 0) {
      forgotOtpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      forgotOtpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      forgotOtpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => {
      nextDigits[i] = d;
    });
    setForgotData({ ...forgotData, otpDigits: nextDigits, otpVerified: false });
    const focusIndex = Math.min(pasted.length, 5);
    forgotOtpInputRefs.current[focusIndex]?.focus();
  };

  const handleForgotVerifyOtp = async () => {
    const otpValue = forgotData.otpDigits.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setForgotLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotData.email.trim().toLowerCase(),
          otp: otpValue
        })
      });

      const data = await response.json();
      if (data.success) {
        setForgotData({ ...forgotData, otpVerified: true });
        setForgotMessage(data.message || 'OTP verified successfully');
        setForgotStep('reset');
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      setError('Network error while verifying reset OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async () => {
    if (!forgotData.newPassword || !forgotData.confirmPassword) {
      setError('Please enter new password and confirm password');
      return;
    }
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotData.email.trim().toLowerCase(),
          newPassword: forgotData.newPassword,
          confirmPassword: forgotData.confirmPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage(data.message || 'Password reset successful. Please sign in with your new password.');
        setFormData({ ...formData, email: forgotData.email.trim().toLowerCase(), password: '' });
        closeForgotPassword();
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error while resetting password');
    } finally {
      setForgotLoading(false);
    }
  };

  // Landing Page with two options
  if (showLanding) {
    return (
      <div className={`min-h-screen pt-16 flex items-center justify-center p-4 ${themeClasses.pageBackground}`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl w-full max-w-lg p-8 border ${themeClasses.border}`}>
          <div className="text-center mb-8">
            <div className={`${themeClasses.gradient} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>Placement Cell Portal</h1>
            <p className={`${themeClasses.textSecondary} mt-2`}>
              Select your role to continue
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {/* Placement Cell Admin Option */}
            <button
              onClick={() => setShowLanding(false)}
              className={`group p-6 rounded-xl border-2 ${themeClasses.border} hover:border-orange-500 transition-all duration-300 hover:shadow-lg ${themeClasses.cardBackground}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-1`}>Placement Cell</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Manage tests & view results</p>
              </div>
            </button>

            {/* Student Option */}
            <button
              onClick={() => navigate('/student-test')}
              className={`group p-6 rounded-xl border-2 ${themeClasses.border} hover:border-green-500 transition-all duration-300 hover:shadow-lg ${themeClasses.cardBackground}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-1`}>Student</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Take a placement test</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password Screen
  if (forgotMode) {
    return (
      <div className={`min-h-screen pt-16 flex items-center justify-center p-4 ${themeClasses.pageBackground}`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl w-full max-w-md p-8 border ${themeClasses.border}`}>
          <button
            onClick={closeForgotPassword}
            className={`mb-4 flex items-center gap-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sign In
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Forgot Password</h1>
            <p className={`${themeClasses.textSecondary} mt-2`}>
              {forgotStep === 'email' && 'Enter your registered email to receive OTP'}
              {forgotStep === 'otp' && 'Enter and verify the OTP sent to your email'}
              {forgotStep === 'reset' && 'Set your new password'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {forgotStep === 'email' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Email Address</label>
                <input
                  type="email"
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  placeholder="Enter your registered email"
                />
              </div>
              <button
                type="button"
                onClick={handleForgotSendOtp}
                disabled={forgotLoading || forgotCooldown > 0}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {forgotLoading
                  ? 'Sending OTP...'
                  : forgotCooldown > 0
                    ? `Resend OTP in ${forgotCooldown}s`
                    : 'Send Reset OTP'}
              </button>
            </div>
          )}

          {forgotStep === 'otp' && (
            <div className="space-y-4">
              <p className={`text-sm ${themeClasses.textSecondary}`}>OTP sent to <span className="font-semibold">{forgotData.email}</span></p>
              <div className="flex gap-2 justify-between" onPaste={handleForgotOtpPaste}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => { forgotOtpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={forgotData.otpDigits[idx]}
                    onChange={(e) => handleForgotOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleForgotOtpKeyDown(idx, e)}
                    className={`w-11 h-11 text-center text-lg font-semibold border ${themeClasses.border} rounded-lg ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleForgotVerifyOtp}
                  disabled={forgotLoading || forgotData.otpDigits.join('').length !== 6}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleForgotSendOtp}
                  disabled={forgotLoading || forgotCooldown > 0}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  {forgotCooldown > 0 ? `${forgotCooldown}s` : 'Resend'}
                </button>
              </div>
            </div>
          )}

          {forgotStep === 'reset' && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-700 font-medium">OTP verified. Set your new password.</p>
              <input
                type="password"
                value={forgotData.newPassword}
                onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                placeholder="Enter new password"
              />
              <input
                type="password"
                value={forgotData.confirmPassword}
                onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={handleForgotResetPassword}
                disabled={forgotLoading}
                className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
              >
                {forgotLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          )}

          {forgotMessage && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm">
              {forgotMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login/Register Form
  return (
    <div className={`min-h-screen pt-16 flex items-center justify-center p-4 ${themeClasses.pageBackground}`}>
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl w-full max-w-md p-8 border ${themeClasses.border}`}>
        {/* Back Button */}
        <button
          onClick={() => setShowLanding(true)}
          className={`mb-4 flex items-center gap-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <div className={`${themeClasses.gradient} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Placement Cell Portal</h1>
          <p className={`${themeClasses.textSecondary} mt-2`}>
            {isLogin ? 'Sign in to manage tests' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
              <div className="relative">
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>College Name</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleCollegeInputChange}
                  onFocus={() => formData.college.length >= 2 && setShowCollegeSuggestions(collegeSearchResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  placeholder="Start typing college name..."
                  autoComplete="off"
                />
                {showCollegeSuggestions && collegeSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {collegeSearchResults.map((college, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => handleSelectCollege(college.name)}
                        className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{college.name}</div>
                        <div className="text-sm text-gray-500">{college.city}, {college.state}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
              placeholder="Enter your email"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <button
                type="button"
                onClick={handleSendVerificationOtp}
                disabled={sendingOtp || otpCooldown > 0 || !isValidEmail}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {sendingOtp
                  ? 'Sending OTP...'
                  : otpCooldown > 0
                    ? `Resend OTP in ${otpCooldown}s`
                    : (otpSent ? 'Resend Verification OTP' : 'Send Verification OTP')}
              </button>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Email Verification OTP</label>
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpDigits[idx]}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                    className={`w-12 h-12 text-center text-lg font-semibold border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>
              <input type="hidden" name="otp" value={otpDigits.join('')} />
              <div className="mt-3 flex items-center gap-3">
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpDigits.join('').length !== 6}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                )}
                {otpVerified && <span className="text-green-700 text-sm font-medium">Verified</span>}
              </div>
              {otpMessage && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        {otpVerified ? 'OTP Verified' : 'OTP Sent Successfully'}
                      </p>
                      <p className="text-sm text-emerald-700 mt-0.5">{otpMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
              placeholder="Enter your password"
              required
            />
            {isLogin && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${themeClasses.gradient} text-white py-3 rounded-lg font-semibold hover:opacity-90 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
              setForgotMode(false);
              setForgotMessage('');
              setForgotCooldown(0);
              setOtpSent(false);
              setOtpVerified(false);
              setOtpMessage('');
              setOtpCooldown(0);
              setOtpDigits(['', '', '', '', '', '']);
              setFormData({ ...formData, otp: '' });
            }}
            className={`${themeClasses.gradientText} hover:opacity-80 font-medium`}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementCellLogin;

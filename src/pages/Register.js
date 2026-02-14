import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CustomDatePicker from '../components/CustomDatePicker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    dateOfBirth: '',
    mobileNumber: '',
    email: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpFallback, setShowOtpFallback] = useState(false); // Show OTP input even when send fails
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [errors, setErrors] = useState({});

  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !canResendOtp) {
      setCanResendOtp(true);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, canResendOtp]);

  // Start countdown function
  const startCountdown = () => {
    setCountdown(60);
    setCanResendOtp(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error and success messages when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Real-time username validation
    if (name === 'username') {
      if (value.includes(' ')) {
        setErrors(prev => ({
          ...prev,
          username: 'Username cannot contain spaces'
        }));
      } else if (!/^[a-zA-Z0-9_]*$/.test(value)) {
        setErrors(prev => ({
          ...prev,
          username: 'Username can only contain letters, numbers, and underscores'
        }));
      }
    }
    
    // Real-time password validation
    if (name === 'password') {
      if (value.length > 0 && value.length < 8) {
        setErrors(prev => ({
          ...prev,
          password: 'Password must be at least 8 characters long'
        }));
      } else if (value.length >= 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        setErrors(prev => ({
          ...prev,
          password: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        }));
      }
    }
    
    // Clear success message when user changes email
    if (name === 'email' && successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (formData.username.includes(' ')) {
      newErrors.username = 'Username cannot contain spaces';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required to send OTP' }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    // Send OTP via API
    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        startCountdown(); // Start 60-second countdown
        if (data.demo_mode) {
          setSuccessMessage(`📧 Demo mode: Use OTP 123456 (email service unavailable)`);
        } else {
          setSuccessMessage(`OTP sent successfully to ${formData.email}! Please check your inbox.`);
        }
        setErrors(prev => ({ ...prev, email: '' })); // Clear any email errors
      } else {
        setErrors(prev => ({ ...prev, email: `Failed to send OTP: ${data.message}` }));
        setSuccessMessage('');
        setShowOtpFallback(true); // Show OTP input for bypass
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setErrors(prev => ({ ...prev, email: 'Network error. Please check if the backend server is running.' }));
      setSuccessMessage('');
      setShowOtpFallback(true); // Show OTP input for bypass
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      alert('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsVerified(true);
        setOtpMessage('Email verified successfully!');
      } else {
        setOtpMessage(data.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpMessage('Network error. Please check if the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isVerified) {
      setOtpMessage('Please verify your email first');
      return;
    }

    setIsLoading(true);

    try {
      // Save registration data to MongoDB
      const registrationData = {
        ...formData,
        domain: domainId || '',
        role: roleId || '',
        timeFrame: '' // Will be set later in time selection
      };

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/save-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (result.success) {
        // Store user data in localStorage and update auth context
        login(formData);
        localStorage.setItem('registrationId', result._id);
        
        // Navigate to resume profile selection page
        navigate(`/resume-profile-selection?domain=${domainId || ''}&role=${roleId || ''}`);
      } else {
        setErrors({ submit: result.message || 'Failed to save registration data' });
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      setErrors({ submit: 'Failed to save registration data. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${themeClasses.gradient} rounded-full text-white text-2xl font-bold mb-4 shadow-lg`}>
            📝
          </div>
          <h1 className={`text-4xl font-bold ${themeClasses.gradientText} mb-2`}>
            Register Here
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Create your account to get personalized career roadmaps
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-2xl dark:shadow-soft border border-gray-100 dark:border-pink-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                    errors.firstName ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                  }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                    errors.lastName ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                  }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                  errors.username ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                }`}
                placeholder="Enter your username (letters, numbers, underscores only)"
              />
              <p className="text-xs text-gray-500 dark:text-tech-gray-400 mt-1">
                Username can only contain letters, numbers, and underscores. No spaces or special characters.
              </p>
              {errors.username && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                  errors.password ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                }`}
                placeholder="Enter your password"
              />
              <p className="text-xs text-gray-500 dark:text-tech-gray-400 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and number.
              </p>
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Date of Birth *
              </label>
              <CustomDatePicker
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                error={errors.dateOfBirth}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500 dark:text-tech-gray-400 font-medium">+91</span>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  maxLength="10"
                  className={`w-full pl-16 pr-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                    errors.mobileNumber ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                  }`}
                  placeholder="9876543210"
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.mobileNumber}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                📋 Please ensure the contact information is the same as what is listed in your resume.
              </p>
            </div>

            {/* Email with OTP */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Email Address *
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300 ${
                    errors.email ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder} hover:border-gray-300 dark:hover:border-tech-gray-600`
                  }`}
                  placeholder="your.email@example.com"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!formData.email || !canResendOtp || isLoading}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center min-w-[120px] ${
                    !formData.email || !canResendOtp || isLoading
                      ? 'bg-gray-300 dark:bg-[#2d1f3d] text-gray-500 dark:text-gray-500 cursor-not-allowed'
                      : `${themeClasses.gradient} hover:opacity-90 text-white transform hover:scale-105 shadow-lg dark:shadow-glow`
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {countdown}s
                    </>
                  ) : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email}
                </p>
              )}
              {successMessage && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </p>
              )}
              {otpSent && countdown > 0 && (
                <p className={`${themeClasses.accent} text-sm mt-2 flex items-center`}>
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  OTP sent! You can resend in {countdown} seconds
                </p>
              )}
              {otpSent && canResendOtp && countdown === 0 && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center">
                  <span className="mr-1">✅</span>
                  You can now resend OTP if needed
                </p>
              )}
            </div>

            {/* OTP Verification */}
            {(otpSent || showOtpFallback) && (
              <div className={`${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-xl p-4`}>
                {showOtpFallback && !otpSent && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center">
                      <span className="mr-2">⚠️</span>
                      <span><strong>Email service unavailable.</strong> Use bypass code: <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded font-bold">123456</code></span>
                    </p>
                  </div>
                )}
                <label htmlFor="otp" className="block text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  Enter OTP *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    className={`flex-1 px-4 py-3 rounded-xl border-2 ${themeClasses.cardBorder} bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-4 focus:border-current transition-all duration-300`}
                    placeholder="Enter 6-digit OTP"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!otp || isVerified || isLoading}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                      !otp || isVerified || isLoading
                        ? 'bg-gray-300 dark:bg-[#2d1f3d] text-gray-500 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 transform hover:scale-105 shadow-lg dark:shadow-glow'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : isVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
                {otpMessage && (
                  <p className={`text-sm mt-2 flex items-center p-3 rounded-lg ${
                    isVerified 
                      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                  }`}>
                    {isVerified ? (
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="mr-2">⚠️</span>
                    )}
                    {otpMessage}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${themeClasses.gradient} hover:opacity-90 text-white font-bold py-4 px-8 rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl dark:shadow-glow flex items-center justify-center ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Registration...
                  </>
                ) : (
                  <>
                    <span className="mr-2 text-2xl">🚀</span>
                    Continue to Roadmap Planning
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              
              {/* Submit Error Message */}
              {errors.submit && (
                <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm mt-3 flex items-center p-3 rounded-lg">
                  <span className="mr-2">⚠️</span>
                  {errors.submit}
                </p>
              )}
            </div>

            {/* Back Links */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 text-center">
              <button 
                type="button"
                onClick={() => navigate(`/auth-selection?domain=${domainId || ''}&role=${roleId || ''}`)}
                className="text-gray-500 dark:text-tech-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Options
              </button>
              
              <button 
                type="button"
                onClick={() => navigate('/result')}
                className="text-gray-500 dark:text-tech-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Results
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

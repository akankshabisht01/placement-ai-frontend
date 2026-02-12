import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const SignIn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [signInMethod, setSignInMethod] = useState('otp'); // 'otp' or 'password'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [userEmail, setUserEmail] = useState(''); // Store actual email for OTP

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
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMethodChange = (method) => {
    setSignInMethod(method);
    // Clear form data and errors when switching methods
    setFormData({
      emailOrUsername: '',
      password: ''
    });
    setErrors({});
    setOtpMessage('');
    setSuccessMessage('');
    setOtpSent(false);
    setOtp('');
    setIsVerified(false);
    setUserEmail('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emailOrUsername.trim()) {
      if (signInMethod === 'otp') {
        newErrors.emailOrUsername = 'Email is required for OTP verification';
      } else {
        newErrors.emailOrUsername = 'Email or Username is required';
      }
    } else if (signInMethod === 'otp' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailOrUsername)) {
      // For OTP method, validate email format
      newErrors.emailOrUsername = 'Please enter a valid email address for OTP verification';
    }

    if (signInMethod === 'password' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setOtpMessage('');

    try {
      // First check if user exists
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const checkUserResponse = await fetch(`${backendUrl}/api/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: formData.emailOrUsername
        }),
      });

      const checkResult = await checkUserResponse.json();

      if (!checkResult.success) {
        setOtpMessage('Error checking user. Please try again.');
        return;
      }

      if (!checkResult.exists) {
        setOtpMessage('❌ Email not registered. Please check your email address or register first.');
        setErrors({ emailOrUsername: 'This email address is not registered in our system' });
        return;
      }

      // Store the user's actual email for OTP verification
      setUserEmail(checkResult.user.email);

      // If user exists, send OTP to their registered email
      const response = await fetch(`${backendUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: checkResult.user.email, // Use the email from user data
          firstName: checkResult.user.firstName || 'User'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpSent(true);
        if (result.demo_mode) {
          setSuccessMessage('Demo mode active: Use OTP 123456');
          setOtpMessage('📧 Email service unavailable. Use demo OTP: 123456');
        } else {
          setSuccessMessage('OTP sent successfully to your email!');
          setOtpMessage('Please check your email and enter the OTP below');
        }
        startCountdown();
      } else {
        setOtpMessage(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpMessage('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setOtpMessage('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setOtpMessage('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail, // Use the stored actual email
          otp: otp
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsVerified(true);
        setOtpMessage('Email verified successfully!');
        setSuccessMessage('Sign in successful!');
      } else {
        setOtpMessage(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpMessage('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // For OTP method, check if email is verified
    if (signInMethod === 'otp' && !isVerified) {
      setOtpMessage('Please verify your email first');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let signInResult;

      if (signInMethod === 'password') {
        // Password-based sign in
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/signin-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailOrUsername: formData.emailOrUsername,
            password: formData.password
          }),
        });

        signInResult = await response.json();

        if (!signInResult.success) {
          setErrors({ submit: signInResult.message || 'Invalid email/username or password' });
          return;
        }
      } else {
        // OTP-based sign in (already verified)
        // Fetch full user data from backend
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const checkUserResponse = await fetch(`${backendUrl}/api/check-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailOrUsername: userEmail
          }),
        });

        const checkResult = await checkUserResponse.json();

        if (checkResult.success && checkResult.exists) {
          signInResult = {
            success: true,
            user: checkResult.user
          };
        } else {
          signInResult = {
            success: true,
            user: { email: userEmail }
          };
        }
      }

      // Store user data using AuthContext
      login({
        ...signInResult.user,
        signedIn: true,
        signInMethod: signInMethod
      });
      
      // Check if user has mobile number and try to auto-link resume
      const userMobile = signInResult.user?.mobile || signInResult.user?.phone || signInResult.user?.mobileNumber;
      
      if (userMobile) {
        try {
          console.log('🔍 Checking for existing resume with mobile:', userMobile);
          
          // Try to auto-link existing resume
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
          const linkResponse = await fetch(`${backendUrl}/api/link-resume-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userData: signInResult.user,
              mobile: userMobile
            }),
          });

          const linkResult = await linkResponse.json();

          if (linkResult.success) {
            // Resume found and linked! Store it and go to dashboard
            console.log('✅ Resume auto-linked successfully');
            localStorage.setItem('linkedResumeData', JSON.stringify(linkResult.resumeData));
            localStorage.setItem('resumeId', linkResult.resumeId);
            localStorage.setItem('resumeCollection', linkResult.collection);
            localStorage.setItem('resumeChoice', 'use-existing');
            
            // Navigate directly to dashboard
            navigate('/dashboard');
            return;
          } else {
            // No resume found, show selection page
            console.log('ℹ️ No resume found, showing selection page');
          }
        } catch (error) {
          console.error('Error auto-linking resume:', error);
          // Continue to selection page on error
        }
      }
      
      // Navigate to resume profile selection page if auto-link failed or no mobile
      navigate(`/resume-profile-selection?domain=${domainId || ''}&role=${roleId || ''}`);
    } catch (error) {
      console.error('Error during sign in:', error);
      setErrors({ submit: 'Sign in failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${themeClasses.gradient} rounded-full text-white text-2xl font-bold mb-4 shadow-lg`}>
            🔑
          </div>
          <h1 className={`text-4xl font-bold ${themeClasses.gradientText} mb-2`}>
            Sign In
          </h1>
          <p className={`${themeClasses.textSecondary} text-lg`}>
            Welcome back! Sign in to access your roadmaps
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-2xl dark:shadow-soft border border-gray-100 dark:border-pink-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sign In Method Selector */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-3`}>
                Choose Sign In Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleMethodChange('otp')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    signInMethod === 'otp'
                      ? `${themeClasses.cardBorder} ${themeClasses.cardHover} ${themeClasses.accent}`
                      : `border-gray-200 dark:border-pink-500/30 hover:border-gray-300 dark:hover:border-tech-gray-600 dark:text-tech-gray-300`
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl block mb-2">📧</span>
                    <span className="font-medium">Email OTP</span>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>Secure verification</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleMethodChange('password')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    signInMethod === 'password'
                      ? `${themeClasses.cardBorder} ${themeClasses.cardHover} ${themeClasses.accent}`
                      : `border-gray-200 dark:border-pink-500/30 hover:border-gray-300 dark:hover:border-tech-gray-600 dark:text-tech-gray-300`
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl block mb-2">🔐</span>
                    <span className="font-medium">Password</span>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>Quick access</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Email/Username Field - Dynamic based on sign-in method */}
            <div>
              <label htmlFor="emailOrUsername" className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                {signInMethod === 'otp' ? 'Email Address *' : 'Email Address / Username *'}
              </label>
              <input
                type={signInMethod === 'otp' ? 'email' : 'text'}
                id="emailOrUsername"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleInputChange}
                placeholder={signInMethod === 'otp' ? 'Enter your registered email' : 'Enter your email or username'}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-tech-gray-500 focus:ring-2 focus:border-current transition-colors duration-200 ${
                  errors.emailOrUsername ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder}`
                }`}
                disabled={otpSent}
              />
              {errors.emailOrUsername && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.emailOrUsername}
                </p>
              )}
              {!errors.emailOrUsername && signInMethod === 'password' && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  💡 You can use either your email address or username
                </p>
              )}
            </div>

            {/* Password Field - Only show if password method selected */}
            {signInMethod === 'password' && (
              <div>
                <label htmlFor="password" className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-tech-gray-500 focus:ring-2 focus:border-current transition-colors duration-200 ${
                    errors.password ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30' : `${themeClasses.cardBorder}`
                  }`}
                />
                {errors.password && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            {/* Send OTP Button - Only show if OTP method selected */}
            {signInMethod === 'otp' && !otpSent && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-glow flex items-center justify-center ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">📧</span>
                      Send OTP
                    </>
                  )}
                </button>
                
                {/* Success Message Display */}
                {successMessage && !otpSent && (
                  <p className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm flex items-center p-3 rounded-lg">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </p>
                )}
              </div>
            )}

            {/* OTP Section - Only show if OTP method selected */}
            {signInMethod === 'otp' && otpSent && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-amber-700 dark:text-gray-200 mb-2">
                    Enter OTP *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-pink-500/30 rounded-xl bg-white dark:bg-[#1e1a2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-tech-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-pink-500 focus:border-amber-500 dark:border-pink-500 dark:focus:border-blue-600 transition-colors duration-200"
                      disabled={isVerified}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={isLoading || isVerified || !otp.trim()}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isVerified
                          ? 'bg-green-500 dark:bg-green-600 text-white cursor-not-allowed'
                          : isLoading || !otp.trim()
                          ? 'bg-gray-300 dark:bg-[#2d1f3d] text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-amber-600 dark:bg-pink-600 text-white hover:bg-amber-700 dark:hover:bg-pink-500'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </>
                      ) : isVerified ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={!canResendOtp || isLoading}
                    className={`text-sm ${
                      canResendOtp && !isLoading
                        ? 'text-amber-600 dark:text-pink-400 hover:text-amber-700 dark:hover:text-pink-300 cursor-pointer'
                        : 'text-gray-400 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {!canResendOtp ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>

                {/* OTP Messages */}
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
                disabled={isLoading || (signInMethod === 'otp' && !isVerified)}
                className={`w-full bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white font-bold py-4 px-8 rounded-2xl hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl dark:shadow-glow flex items-center justify-center ${
                  isLoading || (signInMethod === 'otp' && !isVerified) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
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
                className="text-amber-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-pink-400 transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Options
              </button>
              
              <button 
                type="button"
                onClick={() => navigate('/result')}
                className="text-amber-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-pink-400 transition-colors duration-200 flex items-center justify-center"
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

export default SignIn;

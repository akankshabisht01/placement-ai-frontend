import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const AuthSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hoveredOption, setHoveredOption] = useState(null);
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');

  const handleRegister = () => {
    navigate(`/register?domain=${domainId || ''}&role=${roleId || ''}`);
  };

  const handleSignIn = () => {
    navigate(`/signin?domain=${domainId || ''}&role=${roleId || ''}`);
  };

  // Per-theme accent gradient for header icon + sign-in button
  const accentGradient = {
    light:    'bg-gradient-to-r from-amber-500 to-orange-500',
    dark:     'bg-gradient-to-r from-pink-500 to-purple-600',
    midnight: 'bg-gradient-to-r from-indigo-500 to-violet-600',
    aloof:    'bg-gradient-to-r from-blue-500 to-blue-600',
  }[theme] ?? 'bg-gradient-to-r from-amber-500 to-orange-500';

  const accentGradientText = {
    light:    'bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent',
    dark:     'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent',
    midnight: 'bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent',
    aloof:    'bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent',
  }[theme] ?? 'bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent';

  // Checkmark icon color per card
  const registerCheckColor = 'text-green-500';
  const signinCheckColor = {
    light:    'text-amber-500',
    dark:     'text-pink-400',
    midnight: 'text-indigo-400',
    aloof:    'text-blue-500',
  }[theme] ?? 'text-amber-500';

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${accentGradient} rounded-full text-white text-3xl font-bold mb-6 shadow-2xl`}>
            🔐
          </div>
          <h1 className={`text-5xl font-bold ${accentGradientText} mb-4`}>
            Welcome Back!
          </h1>
          <p className={`${themeClasses.textSecondary} text-xl max-w-2xl mx-auto`}>
            Choose how you'd like to continue with your personalized career roadmap journey
          </p>
        </div>

        {/* Auth Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Register Option */}
          <div
            className={`relative overflow-hidden ${themeClasses.cardBackground} border ${themeClasses.cardBorder} rounded-3xl shadow-xl transition-all duration-500 cursor-pointer ${
              hoveredOption === 'register' ? 'scale-105 -translate-y-2 shadow-2xl' : 'hover:scale-[1.02]'
            } ${themeClasses.cardHover}`}
            onMouseEnter={() => setHoveredOption('register')}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={handleRegister}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10 pointer-events-none rounded-3xl"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-2xl font-bold mb-6 mx-auto shadow-lg">
                📝
              </div>

              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4 text-center`}>
                New User? Register
              </h3>

              <p className={`${themeClasses.textSecondary} text-center mb-6 leading-relaxed`}>
                Create a new account to get started with personalized career roadmaps and track your progress
              </p>

              <ul className="space-y-3 mb-8">
                {['Personalized roadmaps', 'Progress tracking', 'Career guidance'].map((item) => (
                  <li key={item} className={`flex items-center ${themeClasses.textSecondary}`}>
                    <svg className={`w-5 h-5 ${registerCheckColor} mr-3 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg">
                  Get Started →
                </span>
              </div>
            </div>
          </div>

          {/* Sign In Option */}
          <div
            className={`relative overflow-hidden ${themeClasses.cardBackground} border ${themeClasses.cardBorder} rounded-3xl shadow-xl transition-all duration-500 cursor-pointer ${
              hoveredOption === 'signin' ? 'scale-105 -translate-y-2 shadow-2xl' : 'hover:scale-[1.02]'
            } ${themeClasses.cardHover}`}
            onMouseEnter={() => setHoveredOption('signin')}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={handleSignIn}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10 pointer-events-none rounded-3xl"></div>
            <div className="relative p-8">
              <div className={`flex items-center justify-center w-16 h-16 ${accentGradient} rounded-2xl text-white text-2xl font-bold mb-6 mx-auto shadow-lg`}>
                🔑
              </div>

              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4 text-center`}>
                Already Registered? Sign In
              </h3>

              <p className={`${themeClasses.textSecondary} text-center mb-6 leading-relaxed`}>
                Access your existing account and continue with your personalized roadmap journey
              </p>

              <ul className="space-y-3 mb-8">
                {['Access saved roadmaps', 'View progress history', 'Quick access'].map((item) => (
                  <li key={item} className={`flex items-center ${themeClasses.textSecondary}`}>
                    <svg className={`w-5 h-5 ${signinCheckColor} mr-3 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <span className={`inline-flex items-center px-6 py-3 ${accentGradient} text-white font-semibold rounded-xl shadow-lg`}>
                  Sign In →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Results Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/result')}
            className={`${themeClasses.textSecondary} ${themeClasses.textAccent && `hover:${themeClasses.textAccent.replace('text-', 'text-')}`} transition-colors duration-200 flex items-center justify-center mx-auto hover:opacity-80`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Prediction Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthSelection;

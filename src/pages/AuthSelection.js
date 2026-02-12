import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hoveredOption, setHoveredOption] = useState(null);

  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');

  const handleRegister = () => {
    navigate(`/register?domain=${domainId || ''}&role=${roleId || ''}`);
  };

  const handleSignIn = () => {
    navigate(`/signin?domain=${domainId || ''}&role=${roleId || ''}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-full text-white text-3xl font-bold mb-6 shadow-2xl">
            🔐
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Welcome Back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl mx-auto">
            Choose how you'd like to continue with your personalized career roadmap journey
          </p>
        </div>

        {/* Auth Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Register Option */}
          <div
            className={`relative overflow-hidden bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-xl hover:shadow-2xl dark:shadow-glow transform transition-all duration-500 cursor-pointer ${
              hoveredOption === 'register' ? 'scale-105 -translate-y-2' : 'hover:scale-102'
            }`}
            onMouseEnter={() => setHoveredOption('register')}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={handleRegister}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10 dark:from-green-400/5 dark:to-emerald-600/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl text-white text-2xl font-bold mb-6 mx-auto shadow-lg">
                📝
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                New User? Register
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                Create a new account to get started with personalized career roadmaps and track your progress
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Personalized roadmaps
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Progress tracking
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Career guidance
                </li>
              </ul>
              
              <div className="text-center">
                <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white font-semibold rounded-xl shadow-lg">
                  Get Started →
                </span>
              </div>
            </div>
          </div>

          {/* Sign In Option */}
          <div
            className={`relative overflow-hidden bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-xl hover:shadow-2xl dark:shadow-glow transform transition-all duration-500 cursor-pointer ${
              hoveredOption === 'signin' ? 'scale-105 -translate-y-2' : 'hover:scale-102'
            }`}
            onMouseEnter={() => setHoveredOption('signin')}
            onMouseLeave={() => setHoveredOption(null)}
            onClick={handleSignIn}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-600/10 dark:from-pink-400/5 dark:to-purple-600/5"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 rounded-2xl text-white text-2xl font-bold mb-6 mx-auto shadow-lg">
                🔑
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                Already Registered? Sign In
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                Access your existing account and continue with your personalized roadmap journey
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-pink-500 dark:text-pink-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Access saved roadmaps
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-pink-500 dark:text-pink-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  View progress history
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 text-pink-500 dark:text-pink-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Quick access
                </li>
              </ul>
              
              <div className="text-center">
                <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 text-white font-semibold rounded-xl shadow-lg">
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
            className="text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-pink-400 transition-colors duration-200 flex items-center justify-center mx-auto"
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

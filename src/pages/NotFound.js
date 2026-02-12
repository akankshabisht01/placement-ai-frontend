import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 -mt-16 pt-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-24 w-24 text-amber-600 dark:text-pink-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-amber-900 dark:text-white mb-4">404 - Page Not Found</h1>
        <p className="text-xl text-amber-700 dark:text-gray-400 mb-8">
          Oops! We couldn't find the page you're looking for.
        </p>
        <div className="space-y-3">
          <Link 
            to="/" 
            className="block w-full bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 transition"
          >
            Go back to Home
          </Link>
          <Link 
            to="/predict" 
            className="block w-full bg-white dark:bg-[#1e1a2e] border border-gray-300 dark:border-pink-500/20 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#2d1f3d] transition"
          >
            Start Placement Prediction
          </Link>
        </div>
        <div className="mt-8 text-sm text-amber-600 dark:text-gray-500">
          <p>
            Lost? You might want to check out:
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            <Link to="/domains" className="text-amber-600 dark:text-pink-400 hover:text-amber-800 dark:hover:text-pink-300">
              Career Domains
            </Link>
            <Link to="/dashboard" className="text-amber-600 dark:text-pink-400 hover:text-amber-800 dark:hover:text-pink-300">
              Job Market Trends
            </Link>
            <Link to="/chatbot" className="text-amber-600 dark:text-pink-400 hover:text-amber-800 dark:hover:text-pink-300">
              AI Career Assistant
            </Link>
            <Link to="/about" className="text-amber-600 dark:text-pink-400 hover:text-amber-800 dark:hover:text-pink-300">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ResumeLinker = ({ mobile, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  // Use local Flask API instead of external webhook
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const RESUME_CHOICE_API = `${backendUrl}/api/resume-choice`;

  const handleChoice = async (choice) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        mobile: mobile,
        choice: choice, // 'link_resume' or 'upload_new'
        timestamp: new Date().toISOString()
      };

      const response = await fetch(RESUME_CHOICE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (onSuccess) {
          onSuccess(choice, data);
        }
      } else {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error('Resume linking error:', err);
      setError(err.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${theme === 'aloof' ? 'rounded-2xl' : 'bg-white rounded-2xl shadow-xl'} max-w-md w-full mx-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`${theme === 'aloof' ? 'w-16 h-16 mx-auto mb-4 bg-transparent' : 'w-16 h-16 mx-auto mb-4 bg-blue-100'} rounded-full flex items-center justify-center`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6m-3 0V4m0 0H9m3 0h3" />
              </svg>
            </div>
            <h2 className={`${theme === 'aloof' ? 'text-xl font-bold aloof-text-primary mb-2' : 'text-xl font-bold text-gray-900 mb-2'}`}>Resume Found!</h2>
            <p className={`${theme === 'aloof' ? 'aloof-text-secondary text-sm' : 'text-gray-600 text-sm'}`}>
              We found a resume linked with your mobile number: <span className="font-semibold">{mobile}</span>
            </p>
            <p className={`${theme === 'aloof' ? 'aloof-text-secondary text-sm mt-2' : 'text-gray-600 text-sm mt-2'}`}>
              Would you like to use this resume for your profile?
            </p>
          </div>

          {/* Result/Error Messages */}
          {result && (
            <div className={`mb-4 p-4 rounded-2xl ${theme === 'aloof' ? '' : (result.status === 'success' ? 'border-green-300 bg-green-50 text-green-700' : 'border-blue-300 bg-blue-50 text-blue-700')}`}>
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{result.message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className={`${theme === 'aloof' ? 'mb-4 p-4 rounded-2xl' : 'mb-4 p-4 rounded-lg border border-red-300 bg-red-50 text-red-700'}`}>
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!result && (
            <div className="space-y-3">
              <button
                onClick={() => handleChoice('link_resume')}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme === 'aloof' ? 'aloof-cta-primary' : 'bg-green-600 hover:bg-green-700'} disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors`}
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isLoading ? 'Processing...' : 'Yes, use my uploaded resume'}
              </button>

              <button
                onClick={() => handleChoice('upload_new')}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme === 'aloof' ? 'aloof-cta-secondary' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors`}
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/>
                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {isLoading ? 'Processing...' : 'No, I want to upload a new resume'}
              </button>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className={`${theme === 'aloof' ? 'aloof-text-secondary' : 'text-gray-600 hover:text-gray-800'} w-full px-4 py-2 font-medium text-sm transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeLinker;

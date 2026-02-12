import React, { useState } from 'react';
import PredictionSection from '../components/PredictionSection';

const PredictionDemo = () => {
  const [selectionData, setSelectionData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelectionChange = (data) => {
    setSelectionData(data);
    setShowDetails(!!(data.education && data.domain && data.role));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Placement Prediction System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Three Dependent Dropdowns for Career Prediction
          </p>
        </div>

        {/* Main Prediction Section */}
        <div className="mb-8">
          <PredictionSection 
            onSelectionChange={handleSelectionChange}
            className="mb-8"
          />
        </div>

        {/* Selection Details */}
        {showDetails && selectionData && (
          <div className="bg-white dark:bg-[#1e1a2e] rounded-lg shadow-lg dark:shadow-soft p-6 border border-gray-200 dark:border-pink-500/20">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Selection Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Selected Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Education:</span>
                    <span className="text-gray-900 dark:text-white">{selectionData.educationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Domain:</span>
                    <span className="text-gray-900 dark:text-white">{selectionData.domainName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Role:</span>
                    <span className="text-gray-900 dark:text-white">{selectionData.roleName}</span>
                  </div>
                </div>
              </div>

              {/* Role Details */}
              {selectionData.roleData && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Role Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Description:</span>
                      <p className="text-gray-900 dark:text-gray-200 mt-1">{selectionData.roleData.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Skills Required:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectionData.roleData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* JSON Data for Developers */}
            <div className="mt-8 p-4 bg-gray-100 dark:bg-[#2d1f3d] rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Raw Selection Data (for developers)</h4>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(selectionData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 bg-white dark:bg-[#1e1a2e] rounded-lg shadow-lg dark:shadow-soft p-6 border border-gray-200 dark:border-pink-500/20">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dependent Dropdowns</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Each dropdown filters the next based on compatibility</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Validation</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Instant feedback and error handling</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Extensible Design</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Easy to add new education backgrounds, domains, or roles</p>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-4">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Select your education background from the first dropdown</li>
            <li>Choose a compatible job domain from the second dropdown</li>
            <li>Pick a specific job role from the third dropdown</li>
            <li>View detailed information about your selected role including required skills</li>
            <li>Use the "Validate Selection" button to check if all fields are filled</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PredictionDemo;

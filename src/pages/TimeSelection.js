import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const TimeSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');

  // Animation effect on component mount
  useEffect(() => {
    setShowDetails(true);
  }, []);

  const timeOptions = [
    { 
      value: '3months', 
      label: '3 months or less', 
      description: 'Intensive crash course - Focus on most critical skills',
      icon: '⚡',
      color: 'from-red-400 to-red-600',
      features: ['Daily intensive study', 'Core skills only', 'Interview focused', 'Quick projects'],
      intensity: 'High Intensity'
    },
    { 
      value: '6months', 
      label: '6 months', 
      description: 'Balanced approach - Core skills + some projects',
      icon: '⚖️',
      color: 'from-orange-400 to-orange-600',
      features: ['Structured learning', 'Balanced pace', 'Portfolio building', 'Skill development'],
      intensity: 'Moderate Intensity'
    },
    { 
      value: '1year', 
      label: '1 year', 
      description: 'Comprehensive learning - Solid foundation + projects',
      icon: '🎯',
      color: 'from-blue-400 to-blue-600',
      features: ['Comprehensive coverage', 'Strong foundation', 'Multiple projects', 'Industry practices'],
      intensity: 'Steady Progress'
    },
    { 
      value: '2years', 
      label: '2 years or more', 
      description: 'Detailed roadmap - Complete mastery + specialization',
      icon: '🚀',
      color: 'from-green-400 to-green-600',
      features: ['Complete mastery', 'Specialization', 'Leadership skills', 'Advanced projects'],
      intensity: 'Comprehensive Growth'
    }
  ];

  const handleProceed = async () => {
    if (selectedTime) {
      setIsLoading(true);
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate(`/roadmap?domain=${domainId || ''}&role=${roleId || ''}&timeframe=${selectedTime}`);
    }
  };

  const handleGoBack = () => {
    navigate('/result');
  };

  const handleOptionClick = (value) => {
    setSelectedTime(value);
    // Add a slight delay for visual feedback
    setTimeout(() => {
      // Auto-scroll to proceed button
      document.getElementById('proceed-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Animated Header */}
        <div className={`text-center mb-8 transform transition-all duration-1000 ${showDetails ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-full mb-4 shadow-lg dark:shadow-glow">
            <span className="text-2xl">⏰</span>
          </div>
          <h1 className="text-4xl font-bold text-amber-900 dark:text-white mb-4">
            How much time do you have for preparation?
          </h1>
          <p className="text-amber-700 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Tell us your available timeframe and we'll create a personalized roadmap that fits your schedule and maximizes your success.
          </p>
        </div>

        {/* Dynamic Time Selection Cards */}
        <div className="bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-glow p-8 mb-8 border border-gray-100 dark:border-pink-500/20 transition-colors duration-300">
          <div className="grid gap-6">
            {timeOptions.map((option, index) => (
              <div
                key={option.value}
                className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedTime === option.value
                    ? 'border-amber-500 dark:border-pink-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-pink-950/30 dark:to-purple-950/30 shadow-lg scale-105'
                    : 'border-amber-200/50 dark:border-pink-500/20 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md bg-white dark:bg-[#1e1a2e]'
                } ${showDetails ? `animate-fadeInUp` : 'opacity-0'}`}
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                {/* Selection indicator */}
                {selectedTime === option.value && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  {/* Icon and Radio */}
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-xl shadow-md`}>
                      {option.icon}
                    </div>
                    <input
                      type="radio"
                      name="timeframe"
                      value={option.value}
                      checked={selectedTime === option.value}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="h-5 w-5 text-amber-600 border-gray-300 focus:ring-blue-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-amber-900 dark:text-white">
                        {option.label}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${option.color} text-white`}>
                        {option.intensity}
                      </span>
                    </div>
                    <p className="text-amber-700 dark:text-gray-300 mb-4">
                      {option.description}
                    </p>

                    {/* Dynamic Features - Show on hover or selection */}
                    {(hoveredOption === option.value || selectedTime === option.value) && (
                      <div className="animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2">
                          {option.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div id="proceed-section" className="bg-white/80 dark:bg-[#1e1a2e]/80 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-glow p-6 border border-gray-100 dark:border-pink-500/20 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGoBack}
              className="px-8 py-3 bg-amber-600 dark:bg-[#2d1f3d] text-white font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-[#2d1f3d] transition-all duration-200 transform hover:scale-105 shadow-md dark:shadow-glow"
            >
              ← Go Back
            </button>
            
            <button
              onClick={handleProceed}
              disabled={!selectedTime || isLoading}
              className={`px-10 py-3 font-medium rounded-xl transition-all duration-300 transform shadow-lg ${
                selectedTime && !isLoading
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-blue-200 dark:shadow-glow'
                  : 'bg-gray-300 dark:bg-[#2d1f3d] text-gray-500 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Roadmap...</span>
                </div>
              ) : (
                <>Generate My Roadmap →</>
              )}
            </button>
          </div>

          {/* Dynamic Progress Indicator */}
          {selectedTime && (
            <div className="mt-6 text-center animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Ready to generate your personalized roadmap!</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Info Box */}
        <div className={`mt-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-amber-200 dark:border-pink-500/30 rounded-2xl p-6 shadow-lg dark:shadow-glow transform transition-all duration-1000 ${showDetails ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-amber-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
                💡 Smart Roadmap Generation
              </h3>
              <div className="text-blue-700 dark:text-pink-400 space-y-2">
                <p className="font-medium">
                  Your roadmap will be intelligently customized based on your available time:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>• <strong>Shorter timeframes:</strong> Focus on critical skills and interview preparation</li>
                  <li>• <strong>Longer timeframes:</strong> Comprehensive learning with specialization</li>
                  <li>• <strong>Adaptive content:</strong> Phase-wise structure matching your pace</li>
                  <li>• <strong>Real-world focus:</strong> Industry-relevant skills and projects</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TimeSelection;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import domainsData from '../data/domainData';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const DomainSelection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  const handleDomainSelect = (domainId) => {
    localStorage.setItem('selectedDomainId', domainId);
    navigate(`/predict/${domainId}`);
  };
  
  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} transition-colors duration-300 -mt-16 pt-16 relative`}>
      {/* Coming Soon Overlay */}
      <div className={`fixed inset-0 ${themeClasses.pageBackground}/80 backdrop-blur-sm z-50 flex items-center justify-center`}>
        <div className={`text-center p-8 ${themeClasses.cardBackground} rounded-2xl shadow-2xl border ${themeClasses.cardBorder} max-w-md mx-4`}>
          <div className={`w-20 h-20 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <svg className={`w-10 h-10 ${themeClasses.badgeText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-3xl font-bold ${themeClasses.textPrimary} mb-3`}>In Progress</h2>
          <p className={`text-xl ${themeClasses.textAccent} font-semibold mb-4`}>Coming Soon!</p>
          <p className={`${themeClasses.textSecondary} mb-6`}>
            We're working hard to bring you an amazing domain selection experience. Stay tuned!
          </p>
          <Link 
            to="/" 
            className={`inline-block px-6 py-3 ${themeClasses.buttonPrimary} ${themeClasses.buttonHover} font-medium rounded-lg transition-colors`}
          >
            Go Back Home
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className={`text-3xl md:text-4xl font-bold ${themeClasses.textPrimary} mb-4`}>
            Select Your Career Domain
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-3xl mx-auto`}>
            Choose the domain that aligns with your interests and academic background to get domain-specific predictions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {domainsData.map((domain) => (
            <div 
              key={domain.id}
              className={`${themeClasses.cardBackground} rounded-xl shadow-md overflow-hidden cursor-pointer transition-all transform hover:-translate-y-1 border ${themeClasses.cardBorder} ${themeClasses.cardHover}`}
              onClick={() => handleDomainSelect(domain.id)}
            >
              <div className={`h-4 ${themeClasses.gradient}`}></div>
              <div className="p-6">
                <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-3`}>{domain.name}</h3>
                
                <div className="space-y-2 mb-6">
                  <p className={`${themeClasses.textSecondary} text-sm`}>
                    <strong className={themeClasses.textPrimary}>Categories:</strong> {domain.categories.map(cat => cat.name).join(', ')}
                  </p>
                  <p className={`${themeClasses.textSecondary} text-sm`}>
                    <strong className={themeClasses.textPrimary}>Top Roles:</strong>
                  </p>
                  <ul className={`${themeClasses.textSecondary} text-sm pl-5 list-disc`}>
                    {domain.categories.flatMap(cat => 
                      cat.roles.slice(0, 2)
                    ).slice(0, 4).map((role, index) => (
                      <li key={index}>{role}</li>
                    ))}
                    {domain.categories.flatMap(cat => cat.roles).length > 4 && (
                      <li className={themeClasses.textAccent}>And more...</li>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={() => handleDomainSelect(domain.id)}
                  className={`w-full py-2 ${themeClasses.buttonSecondary} font-medium rounded-md ${themeClasses.buttonHover} transition-colors`}
                >
                  Select & Continue
                </button>
              </div>
            </div>
        ))}
      </div>
      
      <div className="mt-16 text-center">
        <p className={`text-lg ${themeClasses.textSecondary} mb-4`}>
          Not sure which domain is right for you?
        </p>
        <Link to="/predict" className={`${themeClasses.textAccent} font-medium hover:underline`}>
          Continue without selecting a specific domain →
        </Link>
      </div>
      
      <div className={`mt-20 ${themeClasses.sectionBackground} rounded-2xl p-8 max-w-4xl mx-auto border ${themeClasses.cardBorder}`}>
        <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6 text-center`}>
          Why Choose a Specific Domain?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${themeClasses.badgeText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Personalized Predictions</h3>
              <p className={themeClasses.textSecondary}>
                Get career insights specifically tailored to your chosen field with higher accuracy.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${themeClasses.badgeText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Targeted Skill Gaps</h3>
              <p className={themeClasses.textSecondary}>
                Identify specific skills you need to develop for success in your chosen domain.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${themeClasses.badgeText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Industry Insights</h3>
              <p className={themeClasses.textSecondary}>
                Learn about job opportunities, hiring trends, and salary expectations in your specific field.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center`}>
                <svg className={`h-6 w-6 ${themeClasses.badgeText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Focused Learning Path</h3>
              <p className={themeClasses.textSecondary}>
                Get recommendations for courses, certifications, and resources specific to your career domain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default DomainSelection;

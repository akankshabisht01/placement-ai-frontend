import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const About = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} transition-colors duration-300 -mt-16 pt-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className={`text-4xl font-bold ${themeClasses.textPrimary} mb-4`}>
            About the Placement Prediction System
          </h1>
          <p className={`text-xl ${themeClasses.textSecondary} max-w-3xl mx-auto`}>
            Leveraging AI to help students maximize their placement opportunities
          </p>
        </div>
      
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-8 mb-10`}>
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6`}>Our Mission</h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                The Placement Prediction System is designed to bridge the gap between academic achievement and industry requirements. 
                Our mission is to empower students with data-driven insights about their placement prospects and provide 
                personalized recommendations to enhance their employability.
              </p>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                By analyzing academic performance, technical skills, and extracurricular activities, our AI-powered system 
                generates accurate placement predictions across multiple domains and career paths. We believe that every student 
                deserves access to quality career guidance that is tailored to their unique profile and aspirations.
              </p>
              <p className={themeClasses.textSecondary}>
                Whether you're a final-year student preparing for campus placements or an educational institution looking to 
                improve placement rates, our platform provides valuable insights and actionable recommendations for success.
              </p>
            </div>
            
            <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-8 mb-10`}>
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6`}>How It Works</h2>
              <div className="space-y-8">
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center ${themeClasses.badgeText} font-bold`}>
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Data Collection</h3>
                    <p className={themeClasses.textSecondary}>
                      Students input their academic details, technical skills, project experience, and other relevant information 
                      through our user-friendly interface. Alternatively, students can upload their resume for automated analysis.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center ${themeClasses.badgeText} font-bold`}>
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>AI Analysis</h3>
                    <p className={themeClasses.textSecondary}>
                      Our advanced machine learning model analyzes the input data against historical placement trends, 
                      industry requirements, and job market demands to generate a comprehensive placement prediction.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center ${themeClasses.badgeText} font-bold`}>
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Personalized Results</h3>
                    <p className={themeClasses.textSecondary}>
                      Students receive a detailed report including their placement probability score, recommended job roles, 
                      skills to develop, and personalized suggestions for improving their employability.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`h-12 w-12 ${themeClasses.badgeBackground} rounded-full flex items-center justify-center ${themeClasses.badgeText} font-bold`}>
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-2`}>Continuous Improvement</h3>
                    <p className={themeClasses.textSecondary}>
                      Students can track their progress over time, update their profile with new achievements, and receive 
                      updated predictions and recommendations as they enhance their skills and experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-8`}>
            <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6`}>Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${themeClasses.sectionBackground} p-6 rounded-lg`}>
                <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-3`}>For Students</h3>
                <ul className={`space-y-2 ${themeClasses.textSecondary}`}>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Early insights into placement prospects</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Personalized skill development roadmap</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Targeted preparation for specific job roles</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Improved confidence in career planning</span>
                  </li>
                </ul>
              </div>
              
              <div className={`${themeClasses.sectionBackground} p-6 rounded-lg`}>
                <h3 className={`text-lg font-medium ${themeClasses.textPrimary} mb-3`}>For Institutions</h3>
                <ul className={`space-y-2 ${themeClasses.textSecondary}`}>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Data-driven placement preparation</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Improved placement success rates</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Better alignment of curriculum with industry needs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Enhanced institutional reputation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
            <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-4`}>Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className={`${themeClasses.textAccent} hover:underline font-medium`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/domains" className={`${themeClasses.textAccent} hover:underline font-medium`}>
                  Explore Career Domains
                </Link>
              </li>
              <li>
                <Link to="/predict" className={`${themeClasses.textAccent} hover:underline font-medium`}>
                  Get Your Prediction
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={`${themeClasses.textAccent} hover:underline font-medium`}>
                  View Job Market Trends
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className={`${themeClasses.textAccent} hover:underline font-medium`}>
                  Chat with AI Assistant
                </Link>
              </li>
            </ul>
          </div>
          
          <div className={`${themeClasses.buttonPrimary} rounded-xl shadow-md p-6`}>
            <h3 className="text-xl font-bold mb-4">Get Started Today</h3>
            <p className="mb-6 opacity-90">
              Ready to discover your placement potential? Create your profile and get personalized predictions in minutes.
            </p>
            <Link 
              to="/predict" 
              className={`block w-full py-2 px-4 ${themeClasses.buttonSecondary} ${themeClasses.buttonHover} font-medium rounded-lg text-center transition`}
            >
              Start Your Prediction
            </Link>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
            <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-4`}>Contact Us</h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              Have questions or feedback about our platform? We'd love to hear from you!
            </p>
            <div className={`space-y-3 ${themeClasses.textSecondary}`}>
              <div className="flex items-start">
                <svg className={`h-5 w-5 ${themeClasses.textAccent} mr-2 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact@placementprediction.com</span>
              </div>
              <div className="flex items-start">
                <svg className={`h-5 w-5 ${themeClasses.textAccent} mr-2 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 8800 9900 11</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className={`mt-16 text-center text-sm ${themeClasses.textSecondary} max-w-3xl mx-auto`}>
        <p>
          Disclaimer: This application is a demonstration for educational purposes. Predictions and recommendations 
          are based on simulated data and should not be the sole basis for career decisions.
        </p>
      </div>
      </div>
    </div>
  );
};

export default About; 

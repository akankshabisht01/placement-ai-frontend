import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/themeHelpers';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  return (
    <footer className={`${themeClasses.pageBackground} ${themeClasses.textPrimary} transition-colors duration-300 border-t ${themeClasses.border} relative overflow-hidden`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden dark:block absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="hidden dark:block absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1 - Logo and info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${themeClasses.gradient} bg-clip-text text-transparent`}>PlacementAI</span>
            </div>
            <p className={`mt-2 text-sm ${themeClasses.textSecondary}`}>
              Predict your career path with our AI-powered placement prediction system.
            </p>
          </div>
          
          {/* Column 2 - Quick Links */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${themeClasses.accent} tracking-wider uppercase`}>
              Navigation
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/domains" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Domains
                </Link>
              </li>
              <li>
                <Link to="/predict" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Prediction
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  AI Chatbot
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3 - Resources */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${themeClasses.accent} tracking-wider uppercase`}>
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/anuvaad-ai" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Anuvaad AI
                </Link>
              </li>
              <li>
                <a href="#" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  Terms of Service
                </a>
              </li>
              <li>
                <Link to="/faq" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4 - Contact */}
          <div className="col-span-1">
            <h3 className={`text-sm font-semibold ${themeClasses.accent} tracking-wider uppercase`}>
              Connect
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:contact@placementai.com" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    contact@placementai.com
                  </span>
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </span>
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={`${themeClasses.textSecondary} ${themeClasses.hover} transition-colors`}>
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`mt-8 border-t ${themeClasses.border} pt-8 flex flex-col md:flex-row justify-between items-center`}>
          <p className={`text-base ${themeClasses.textSecondary}`}>
            &copy; {currentYear} PlacementAI. All rights reserved.
          </p>
          <p className={`text-sm ${themeClasses.accent} mt-4 md:mt-0`}>
            Made with ❤️ for Students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
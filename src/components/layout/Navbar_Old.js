import React, { useState, useEffect } from 'react';
import logo from './assets/logo.png';
import { Link, NavLink, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Login/Register', path: '/auth-selection', icon: '👤' },
    { name: 'Domains', path: '/domains', icon: '🎯' },
    { name: 'Prediction', path: '/predict', icon: '📊' },
    { name: 'Demo', path: '/prediction-demo', icon: '🚀' },
    { name: 'Dashboard', path: '/dashboard', icon: '📈' },
    { name: 'AI Chatbot', path: '/chatbot', icon: '🤖' },
    { name: 'About', path: '/about', icon: '📋' },
    { name: 'Feedback', path: '/feedback', icon: '💬' }
  ];

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <img 
                  className="h-10 w-10 mr-4 transition-transform duration-300 group-hover:scale-110" 
                  src={logo} 
                  alt="PlacementAI Logo" 
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <Link to="/" className="flex items-center group">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                  PlacementAI
                </span>
                <div className="ml-2 px-2 py-1 bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-semibold rounded-full opacity-90">
                  PRO
                </div>
              </Link>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 group ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {/* Hover effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </NavLink>
            ))}
            
            {/* Special Admin Button */}
            <NavLink
              to="/admin"
              className="ml-4 relative px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group overflow-hidden"
            >
              <div className="flex items-center space-x-2 relative z-10">
                <span className="text-base">⚡</span>
                <span>Admin</span>
              </div>
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-6">
                <span className={`absolute inset-0 transform transition duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0' : 'rotate-0 -translate-y-2'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16" />
                  </svg>
                </span>
                <span className={`absolute inset-0 transform transition duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
                  </svg>
                </span>
                <span className={`absolute inset-0 transform transition duration-300 ${isMenuOpen ? '-rotate-45 translate-y-0' : 'rotate-0 translate-y-2'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18h16" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
              AI Chatbot
            </NavLink>
            
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                isActive 
                  ? "px-3 py-2 text-lg font-medium text-primary-600 border-b-2 border-primary-500" 
                  : "px-3 py-2 text-lg font-medium text-gray-700 hover:text-primary-600"
              }
            >
              About
            </NavLink>
            
            <NavLink 
              to="/feedback" 
              className={({ isActive }) => 
                isActive 
                  ? "px-3 py-2 text-lg font-medium text-primary-600 border-b-2 border-primary-500" 
                  : "px-3 py-2 text-lg font-medium text-gray-700 hover:text-primary-600"
              }
            >
              Feedback
            </NavLink>
            
            <NavLink 
              to="/admin" 
              className="ml-2 px-4 py-2 text-lg font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Admin
            </NavLink>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu with enhanced animations */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 pt-2 pb-6 space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 transform ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg scale-105'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-md hover:scale-105'
                }`
              }
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: isMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : 'none'
              }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            </NavLink>
          ))}
          
          {/* Mobile Admin Button */}
          <NavLink
            to="/admin"
            onClick={() => setIsMenuOpen(false)}
            className="block mt-4 px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            style={{ 
              animationDelay: `${navItems.length * 50}ms`,
              animation: isMenuOpen ? 'slideInFromRight 0.3s ease-out forwards' : 'none'
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">⚡</span>
              <span>Admin Panel</span>
            </div>
          </NavLink>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
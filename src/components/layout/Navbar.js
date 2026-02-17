import React, { useState, useEffect, useRef } from 'react';
import logo from './assets/logo.png';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, User, Target, BarChart3, LayoutDashboard, Bot, Info, MessageCircle, Zap, Moon, Sun, MonitorSmartphone, FileCheck, UserCircle2, CreditCard, ChevronDown, CloudMoon, Cloud, Sparkles, Sunrise } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/themeHelpers';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopThemeDropdownOpen, setIsDesktopThemeDropdownOpen] = useState(false);
  const [isMobileThemeDropdownOpen, setIsMobileThemeDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { theme, setThemeMode } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const desktopThemeDropdownRef = useRef(null);
  const mobileThemeDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopThemeDropdownRef.current && !desktopThemeDropdownRef.current.contains(event.target)) {
        setIsDesktopThemeDropdownOpen(false);
      }
      if (mobileThemeDropdownRef.current && !mobileThemeDropdownRef.current.contains(event.target)) {
        setIsMobileThemeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDesktopThemeDropdown = () => {
    setIsDesktopThemeDropdownOpen(!isDesktopThemeDropdownOpen);
  };

  const toggleMobileThemeDropdown = () => {
    setIsMobileThemeDropdownOpen(!isMobileThemeDropdownOpen);
  };

  const handleDesktopThemeChange = (newTheme) => {
    setThemeMode(newTheme);
    setIsDesktopThemeDropdownOpen(false);
  };

  const handleMobileThemeChange = (newTheme) => {
    setThemeMode(newTheme);
    setIsMobileThemeDropdownOpen(false);
  };

  // Get the appropriate icon based on theme
  const getThemeIcon = () => {
    const base = 'group-hover:scale-110 transition-transform';
    if (theme === 'light') {
      return <Sun size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else if (theme === 'dark') {
      return <Moon size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else if (theme === 'midnight') {
      return <CloudMoon size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else if (theme === 'aloof') {
      return <Cloud size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else if (theme === 'aurora') {
      return <Sparkles size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else if (theme === 'solaris') {
      return <Sunrise size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    } else {
      return <MonitorSmartphone size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    }
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Daylight';
    if (theme === 'dark') return 'Neonpunk';
    if (theme === 'midnight') return 'Midnight';
    if (theme === 'aloof') return 'Aloof';
    if (theme === 'aurora') return 'Aurora';
    if (theme === 'solaris') return 'Solaris';
    return 'System Default';
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Predict', path: '/predict', icon: BarChart3 },
    { name: 'ATS', path: '/ats', icon: FileCheck },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Plans', path: '/plans', icon: CreditCard },
    { name: 'Domains', path: '/domains', icon: Target },
    { name: 'AI Chat', path: '/chatbot', icon: Bot },
    { name: 'Profile', path: '/profile', icon: UserCircle2 },
  ];

  const moreItems = [
    { name: 'Login', path: '/auth-selection', icon: User },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Feedback', path: '/feedback', icon: MessageCircle }
  ];

  return (
    <>
      <style>{`
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
        
        .slide-in {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
      `}</style>
      
      <nav 
        className={`fixed w-full top-0 transition-all duration-300 ${
          scrolled 
            ? `${themeClasses.cardBackground} backdrop-blur-lg shadow-soft ${theme !== 'aloof' ? `border-b ${themeClasses.border}` : ''}` 
            : `${themeClasses.cardBackground} shadow-soft ${theme !== 'aloof' ? 'border-b border-transparent' : ''}`
        }`}
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
      >
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 pointer-events-auto">
          <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-12' : 'h-16'}`}>
            <div className="flex items-center min-w-0 flex-shrink-0">
              <div className="flex items-center group">
                <div className="relative">
                  <img 
                    className={`mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                      scrolled ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-8 w-8 sm:h-10 sm:w-10'
                    }`}
                    src={logo} 
                    alt="PlacementAI Logo" 
                  />
                  <div className={`absolute -inset-1 ${themeClasses.gradient} rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300`}></div>
                </div>
                <Link to="/" className="flex items-center gap-1.5 group">
                  <span className={`font-bold ${theme === 'aloof' ? themeClasses.textPrimary : themeClasses.gradientText} transition-all duration-300 whitespace-nowrap ${
                    scrolled ? 'text-base sm:text-lg lg:text-xl' : 'text-lg sm:text-xl lg:text-2xl'
                  }`}>
                    PAG<span className="hidden sm:inline">.ai</span>
                  </span>
                  <div className={`${themeClasses.gradient} text-white font-semibold rounded shadow-md whitespace-nowrap transition-all duration-300 ${
                    scrolled ? 'px-1 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
                  }`}>
                    PRO
                  </div>
                </Link>
                
                {/* Theme Dropdown Button (Desktop only) */}
                <div className="relative ml-3 hidden lg:flex" ref={desktopThemeDropdownRef}>
                  <button
                    onClick={toggleDesktopThemeDropdown}
                    className={`flex items-center gap-1.5 rounded-lg transition-all duration-200 group ${themeClasses.buttonSecondary} ${
                      scrolled ? 'p-1.5' : 'p-2'
                    }`}
                    aria-label={`Toggle theme (${getThemeLabel()})`}
                    aria-expanded={isDesktopThemeDropdownOpen}
                  >
                    {getThemeIcon()}
                    <ChevronDown size={scrolled ? 12 : 14} className={`${themeClasses.textSecondary} transition-transform duration-200 ${isDesktopThemeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDesktopThemeDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-48 ${themeClasses.cardBackground} rounded-lg shadow-lg border ${themeClasses.border} overflow-hidden z-50`}>
                      <button
                        onClick={() => handleDesktopThemeChange('light')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'light'
                            ? 'bg-[#fbbf24] text-white'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <Sun size={16} />
                        <span>Daylight</span>
                      </button>
                      <button
                        onClick={() => handleDesktopThemeChange('dark')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-[#ec4899] text-white'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <Moon size={16} />
                        <span>Neonpunk</span>
                      </button>
                      <button
                        onClick={() => handleDesktopThemeChange('midnight')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'midnight'
                            ? 'bg-black text-white border-t border-b border-gray-700'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <CloudMoon size={16} />
                        <span>Midnight</span>
                      </button>
                      <button
                        onClick={() => handleDesktopThemeChange('aloof')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'aloof'
                            ? 'bg-[#8FBC8F] text-white'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <Cloud size={16} />
                        <span>Aloof</span>
                      </button>
                      <button
                        onClick={() => handleDesktopThemeChange('aurora')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'aurora'
                            ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-white'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <Sparkles size={16} />
                        <span>Aurora</span>
                      </button>
                      <button
                        onClick={() => handleDesktopThemeChange('solaris')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                          theme === 'solaris'
                            ? 'bg-[#ff7b3f] text-white'
                            : `${themeClasses.textPrimary} ${themeClasses.hover}`
                        }`}
                      >
                        <Sunrise size={16} />
                        <span>Solaris</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative rounded-lg transition-all duration-200 group whitespace-nowrap pointer-events-auto cursor-pointer ${
                        scrolled ? 'px-2 py-1.5 text-xs' : 'px-2.5 py-2 text-sm'
                      } font-medium ${
                        isActive
                          ? themeClasses.buttonPrimary
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`flex-shrink-0 transition-all duration-200 ${scrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                      <span className={scrolled ? 'text-xs' : 'text-sm'}>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2 justify-end">
              {/* Mobile Theme Dropdown */}
              <div className="relative" ref={mobileThemeDropdownRef}>
                <button
                  onClick={toggleMobileThemeDropdown}
                  className={`flex items-center justify-center gap-1 rounded-lg transition-all duration-200 ${themeClasses.buttonSecondary} ${
                    scrolled ? 'p-1.5 min-h-[32px]' : 'p-2 min-h-[40px]'
                  }`}
                  aria-label={`Toggle theme (${getThemeLabel()})`}
                  aria-expanded={isMobileThemeDropdownOpen}
                >
                  {getThemeIcon()}
                  <ChevronDown size={scrolled ? 12 : 14} className={`${themeClasses.textSecondary} transition-transform duration-200 ${isMobileThemeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mobile Dropdown Menu */}
                {isMobileThemeDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 ${themeClasses.cardBackground} rounded-lg shadow-lg border ${themeClasses.border} overflow-hidden z-50`}>
                    <button
                      onClick={() => handleMobileThemeChange('light')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-[#fbbf24] text-white'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <Sun size={16} />
                      <span>Daylight</span>
                    </button>
                    <button
                      onClick={() => handleMobileThemeChange('dark')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-[#ec4899] text-white'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <Moon size={16} />
                      <span>Neonpunk</span>
                    </button>
                    <button
                      onClick={() => handleMobileThemeChange('midnight')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'midnight'
                          ? 'bg-black text-white border-t border-b border-gray-700'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <CloudMoon size={16} />
                      <span>Midnight</span>
                    </button>
                    <button
                      onClick={() => handleMobileThemeChange('aloof')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'aloof'
                          ? 'bg-[#8FBC8F] text-white'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <Cloud size={16} />
                      <span>Aloof</span>
                    </button>
                    <button
                      onClick={() => handleMobileThemeChange('aurora')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'aurora'
                          ? 'bg-[#7cf8e4] text-white'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <Sparkles size={16} />
                      <span>Aurora</span>
                    </button>
                    <button
                      onClick={() => handleMobileThemeChange('solaris')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all duration-200 ${
                        theme === 'solaris'
                          ? 'bg-[#ff7b3f] text-white'
                          : `${themeClasses.textPrimary} ${themeClasses.hover}`
                      }`}
                    >
                      <Sunrise size={16} />
                      <span>Solaris</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleMenu}
                className={`inline-flex items-center justify-center rounded-lg ${themeClasses.textPrimary} ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-pink-500 transition-all duration-200 ${
                  scrolled ? 'p-1.5 min-h-[32px] min-w-[32px]' : 'p-2 min-h-[40px] min-w-[40px]'
                }`}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <div className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 ${scrolled ? 'w-5 h-5' : 'w-6 h-6'}`}>
                  <div className={`h-0.5 w-full bg-current transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[4.5px]' : 'rotate-0'}`}></div>
                  <div className={`h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
                  <div className={`h-0.5 w-full bg-current transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[4.5px]' : 'rotate-0'}`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu with enhanced animations */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
                  <div className={`px-4 pt-2 pb-6 space-y-2 ${themeClasses.pageBackground} border-t ${themeClasses.border}`}>
            {[...navItems, ...moreItems].map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? themeClasses.buttonPrimary
                        : `${themeClasses.textPrimary} ${themeClasses.hover}`
                    } ${isMenuOpen ? 'slide-in' : ''}`
                  }
                  style={{ 
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

import React, { useState, useEffect, useRef } from 'react';
import logo from './assets/logo.png';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Target, BarChart3, Rocket, LayoutDashboard, Bot, Info, MessageCircle, Zap, Moon, Sun, MonitorSmartphone, FileCheck, UserCircle2, CreditCard, ChevronDown, CloudMoon, Cloud, Mic, Settings, LogOut, Building2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/themeHelpers';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopThemeDropdownOpen, setIsDesktopThemeDropdownOpen] = useState(false);
  const [isMobileThemeDropdownOpen, setIsMobileThemeDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', image: null, isLoggedIn: false });
  const location = useLocation();
  const { theme, setThemeMode } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const desktopThemeDropdownRef = useRef(null);
  const mobileThemeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          const email = parsed.email;
          const name = parsed.name || parsed.fullName || email?.split('@')[0] || 'User';
          
          setUserProfile(prev => ({ ...prev, name, isLoggedIn: true }));
          
          // Try to fetch profile image from backend
          if (email) {
            try {
              const response = await fetch(`http://localhost:5000/api/profile/${email}`);
              if (response.ok) {
                const data = await response.json();
                if (data.profileImage) {
                  setUserProfile(prev => ({ ...prev, image: data.profileImage }));
                }
                if (data.profile?.fullName) {
                  setUserProfile(prev => ({ ...prev, name: data.profile.fullName }));
                }
              }
            } catch (error) {
              console.log('Could not fetch profile image');
            }
          }
        } else {
          setUserProfile({ name: '', image: null, isLoggedIn: false });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, [location.pathname]); // Re-check when route changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (desktopThemeDropdownRef.current && !desktopThemeDropdownRef.current.contains(event.target)) {
        setIsDesktopThemeDropdownOpen(false);
      }
      if (mobileThemeDropdownRef.current && !mobileThemeDropdownRef.current.contains(event.target)) {
        setIsMobileThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
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

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userSettings');
    setUserProfile({ name: '', image: null, isLoggedIn: false });
    setIsProfileDropdownOpen(false);
    navigate('/signin');
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
    } else {
      return <MonitorSmartphone size={16} className={`${themeClasses.textPrimary} ${base}`} />;
    }
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Daylight';
    if (theme === 'dark') return 'Neonpunk';
    if (theme === 'midnight') return 'Midnight';
    if (theme === 'aloof') return 'Aloof';
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
    { name: 'Placement Cell', path: '/placement-cell/login', icon: Building2 },
  ];

  // Items shown in profile dropdown
  const profileMenuItems = [
    { name: 'Profile', path: '/profile', icon: UserCircle2 },
    { name: 'Settings', path: '/settings', icon: Settings },
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
              
              {/* User Profile Avatar Dropdown */}
              {userProfile.isLoggedIn ? (
                <div className="relative ml-2" ref={profileDropdownRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className={`flex items-center gap-2 rounded-full transition-all duration-200 hover:ring-2 hover:ring-orange-400 hover:ring-offset-2 ${
                      scrolled ? 'p-0.5' : 'p-1'
                    }`}
                    aria-label="User menu"
                    aria-expanded={isProfileDropdownOpen}
                  >
                    {userProfile.image ? (
                      <img 
                        src={userProfile.image} 
                        alt={userProfile.name} 
                        className={`rounded-full object-cover border-2 border-orange-400 ${
                          scrolled ? 'w-7 h-7' : 'w-8 h-8'
                        }`}
                      />
                    ) : (
                      <div className={`rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold ${
                        scrolled ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
                      }`}>
                        {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown size={scrolled ? 12 : 14} className={`${themeClasses.textSecondary} transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Profile Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-56 ${themeClasses.cardBackground} rounded-xl shadow-lg border ${themeClasses.border} overflow-hidden z-50`}>
                      {/* User Info Header */}
                      <div className={`px-4 py-3 border-b ${themeClasses.border}`}>
                        <div className="flex items-center gap-3">
                          {userProfile.image ? (
                            <img 
                              src={userProfile.image} 
                              alt={userProfile.name} 
                              className="w-10 h-10 rounded-full object-cover border-2 border-orange-400"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold">
                              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${themeClasses.textPrimary}`}>{userProfile.name}</p>
                            <p className={`text-xs truncate ${themeClasses.textSecondary}`}>View your profile</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        {profileMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                                  isActive
                                    ? 'bg-orange-500/10 text-orange-500'
                                    : `${themeClasses.textPrimary} ${themeClasses.hover}`
                                }`
                              }
                            >
                              <Icon size={16} />
                              <span>{item.name}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                      
                      {/* Logout */}
                      <div className={`border-t ${themeClasses.border} py-1`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-200 text-red-500 hover:bg-red-500/10`}
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/auth-selection"
                  className={`rounded-lg transition-all duration-200 ${themeClasses.buttonPrimary} ${
                    scrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
                  } font-medium ml-2`}
                >
                  Login
                </NavLink>
              )}
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
                  </div>
                )}
              </div>
              
              {/* Mobile User Avatar Indicator */}
              {userProfile.isLoggedIn && (
                <div className="flex items-center">
                  {userProfile.image ? (
                    <img 
                      src={userProfile.image} 
                      alt={userProfile.name} 
                      className={`rounded-full object-cover border-2 border-orange-400 ${
                        scrolled ? 'w-7 h-7' : 'w-8 h-8'
                      }`}
                    />
                  ) : (
                    <div className={`rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold ${
                      scrolled ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'
                    }`}>
                      {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              )}
              
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
            {/* Mobile User Profile Header */}
            {userProfile.isLoggedIn && (
              <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl ${themeClasses.cardBackground} border ${themeClasses.border}`}>
                {userProfile.image ? (
                  <img 
                    src={userProfile.image} 
                    alt={userProfile.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${themeClasses.textPrimary}`}>{userProfile.name}</p>
                  <p className={`text-sm truncate ${themeClasses.textSecondary}`}>Manage your account</p>
                </div>
              </div>
            )}
            
            {[...navItems, ...moreItems, ...(userProfile.isLoggedIn ? profileMenuItems : [])].map((item, index) => {
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
            
            {/* Mobile Logout Button */}
            {userProfile.isLoggedIn && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className={`w-full block px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 ${isMenuOpen ? 'slide-in' : ''}`}
                style={{ animationDelay: `${([...navItems, ...moreItems, ...profileMenuItems].length) * 30}ms` }}
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

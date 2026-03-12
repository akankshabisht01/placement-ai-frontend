import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Bell, Lock, Palette, BookOpen, Download, HelpCircle, 
  ChevronRight, Moon, Sun, Mail, Shield, User, LogOut, Trash2, Eye, EyeOff,
  Key, CreditCard, FileText, Globe, Smartphone, Clock, Volume2, Languages,
  UserCircle, Camera, ChevronDown, Check, X, AlertTriangle, Users, Share2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setThemeMode } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [userProfile, setUserProfile] = useState({ name: '', email: '', image: null });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Change Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Secondary email OTP verification state
  const [shareEmailOtp, setShareEmailOtp] = useState('');
  const [shareEmailOtpSent, setShareEmailOtpSent] = useState(false);
  const [shareEmailVerified, setShareEmailVerified] = useState(false);
  const [shareEmailOtpLoading, setShareEmailOtpLoading] = useState(false);
  const [shareEmailOtpError, setShareEmailOtpError] = useState('');
  const [shareEmailOtpSuccess, setShareEmailOtpSuccess] = useState('');
  const [shareEmailInput, setShareEmailInput] = useState(''); // Local state to prevent jumping
  const [shareNameInput, setShareNameInput] = useState(''); // Local state for name field
  const [shareEmailEditMode, setShareEmailEditMode] = useState(false); // Track if editing verified email
  const [originalShareEmail, setOriginalShareEmail] = useState(''); // Store original email for cancel
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation
  const [deleteOtpSent, setDeleteOtpSent] = useState(false); // OTP sent for deletion
  const [deleteOtp, setDeleteOtp] = useState(''); // OTP input for deletion
  const [deleteOtpLoading, setDeleteOtpLoading] = useState(false);
  const [deleteOtpError, setDeleteOtpError] = useState('');
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification preferences
    emailNotifications: true,
    smsNotifications: false,
    testReminders: true,
    weeklyReports: true,
    jobAlerts: true,
    
    // Report sharing
    reportShareEmail: '',
    reportShareName: '',
    reportShareRelation: 'mentor',
    reportShareEnabled: false,
    reportShareEmailVerified: false,
    
    // Privacy settings
    profileVisibility: 'public',
    resumeVisibility: true,
    showPlacementScore: true,
    
    // Learning preferences
    dailyGoalReminder: true,
    reminderTime: '09:00',
    
    // App preferences
    soundEffects: true,
    language: 'en'
  });

  // Sidebar menu items organized by category
  const menuCategories = [
    {
      items: [
        { id: 'profile', name: 'Public Profile', icon: User },
        { id: 'account', name: 'Account', icon: Key },
        { id: 'appearance', name: 'Appearance', icon: Palette },
        { id: 'notifications', name: 'Notifications', icon: Bell },
      ]
    },
    {
      label: 'Access',
      items: [
        { id: 'privacy', name: 'Privacy & Security', icon: Shield },
        { id: 'sessions', name: 'Sessions', icon: Globe },
      ]
    },
    {
      label: 'Preferences',
      items: [
        { id: 'learning', name: 'Learning', icon: BookOpen },
        { id: 'data', name: 'Data & Export', icon: Download },
      ]
    },
    {
      label: 'Support',
      items: [
        { id: 'help', name: 'Help & Support', icon: HelpCircle },
      ]
    }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      navigate('/signin');
      return;
    }
    loadSettings();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        setUserProfile({
          name: userData.name || userData.fullName || userData.email?.split('@')[0] || 'User',
          email: userData.email || '',
          image: null
        });
        
        // Fetch profile image
        if (userData.email) {
          try {
            const response = await fetch(`http://localhost:5000/api/profile/${userData.email}`);
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
            console.log('Could not fetch profile');
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      if (!userData || !userData.email) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`http://localhost:5000/api/settings/${userData.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
            // Restore email verification state
            if (data.settings.reportShareEmailVerified) {
              setShareEmailVerified(true);
            }
            // Initialize local email input
            if (data.settings.reportShareEmail) {
              setShareEmailInput(data.settings.reportShareEmail);
            }
            if (data.settings.reportShareName) {
              setShareNameInput(data.settings.reportShareName);
            }
          }
        }
      } catch (error) {
        console.log('Using default settings');
      }
      
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
        // Also restore from local storage
        if (parsed.reportShareEmailVerified) {
          setShareEmailVerified(true);
        }
        // Initialize local email input from localStorage
        if (parsed.reportShareEmail) {
          setShareEmailInput(parsed.reportShareEmail);
        }
        if (parsed.reportShareName) {
          setShareNameInput(parsed.reportShareName);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      try {
        await fetch(`http://localhost:5000/api/settings/${userData?.email}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: newSettings })
        });
      } catch (error) {
        console.log('Settings saved locally');
      }
      
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPasswordSuccess('Password changed successfully! You will be logged out.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        // Update session version in localStorage and logout
        setTimeout(() => {
          localStorage.removeItem('userData');
          localStorage.removeItem('userSettings');
          navigate('/signin');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('userSettings');
    navigate('/signin');
  };

  // Reusable components
  const ToggleSetting = ({ label, description, value, onChange }) => (
    <div className={`flex items-center justify-between py-4 border-b ${themeClasses.border}`}>
      <div className="flex-1 pr-4">
        <p className={`font-medium ${themeClasses.textPrimary}`}>{label}</p>
        {description && <p className={`text-sm mt-0.5 ${themeClasses.textSecondary}`}>{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          value ? 'bg-orange-500' : themeClasses.inputBackground
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  const SelectSetting = ({ label, description, value, options, onChange }) => (
    <div className={`flex items-center justify-between py-4 border-b ${themeClasses.border}`}>
      <div className="flex-1 pr-4">
        <p className={`font-medium ${themeClasses.textPrimary}`}>{label}</p>
        {description && <p className={`text-sm mt-0.5 ${themeClasses.textSecondary}`}>{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${themeClasses.inputBackground} ${themeClasses.textPrimary} rounded-md px-3 py-1.5 text-sm border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const SectionHeader = ({ title, description }) => (
    <div className="mb-6">
      <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>{title}</h2>
      {description && <p className={`text-sm mt-1 ${themeClasses.textSecondary}`}>{description}</p>}
    </div>
  );

  const ActionRow = ({ label, description, buttonText, onClick, variant = 'default', icon: Icon }) => (
    <div className={`flex items-center justify-between py-4 border-b ${themeClasses.border}`}>
      <div className="flex-1 pr-4">
        <p className={`font-medium ${themeClasses.textPrimary}`}>{label}</p>
        {description && <p className={`text-sm mt-0.5 ${themeClasses.textSecondary}`}>{description}</p>}
      </div>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
          variant === 'danger' 
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30' 
            : variant === 'primary'
            ? 'bg-orange-500 text-white hover:bg-orange-600'
            : `${themeClasses.inputBackground} ${themeClasses.textPrimary} hover:opacity-80 border ${themeClasses.border}`
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {buttonText}
      </button>
    </div>
  );

  // Content sections
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div>
            <SectionHeader 
              title="Public Profile" 
              description="This information will be displayed publicly on your profile."
            />
            
            {/* Profile Picture */}
            <div className={`flex items-start gap-6 py-4 border-b ${themeClasses.border}`}>
              <div className="flex-1">
                <p className={`font-medium ${themeClasses.textPrimary}`}>Profile Picture</p>
                <p className={`text-sm mt-0.5 ${themeClasses.textSecondary}`}>
                  Your profile picture is visible to recruiters and other users.
                </p>
              </div>
              <div className="relative">
                {userProfile.image ? (
                  <img 
                    src={userProfile.image} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-orange-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <button 
                  onClick={() => navigate('/profile')}
                  className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${themeClasses.cardBackground} border ${themeClasses.border} hover:bg-orange-500 hover:text-white transition-all`}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ActionRow
              label="Name"
              description={userProfile.name || 'Not set'}
              buttonText="Edit"
              onClick={() => navigate('/profile')}
            />
            
            <ActionRow
              label="Email"
              description={userProfile.email || 'Not set'}
              buttonText="Edit"
              onClick={() => navigate('/profile')}
            />
            
            <ActionRow
              label="Full Profile"
              description="Edit your complete profile including education, skills, and more."
              buttonText="Go to Profile"
              onClick={() => navigate('/profile')}
              variant="primary"
            />
          </div>
        );

      case 'account':
        return (
          <div>
            <SectionHeader 
              title="Account" 
              description="Manage your account settings and preferences."
            />
            
            <ActionRow
              label="Change Password"
              description="Update your password to keep your account secure."
              buttonText="Change"
              onClick={() => setShowPasswordModal(true)}
              icon={Key}
            />
            
            <ActionRow
              label="Email Address"
              description={userProfile.email || 'Update your email address'}
              buttonText="Update"
              onClick={() => alert('Feature coming soon!')}
              icon={Mail}
            />
            
            <div className={`mt-8 p-4 rounded-lg border border-red-500/30 bg-red-500/5`}>
              <h3 className="text-red-500 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className={`text-sm mt-2 ${themeClasses.textSecondary}`}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion coming soon');
                  }
                }}
                className="mt-4 px-4 py-2 rounded-md text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div>
            <SectionHeader 
              title="Appearance" 
              description="Customize how PAG.ai looks on your device."
            />
            
            <div className={`py-4 border-b ${themeClasses.border}`}>
              <p className={`font-medium mb-3 ${themeClasses.textPrimary}`}>Theme</p>
              <p className={`text-sm mb-4 ${themeClasses.textSecondary}`}>Select your preferred theme for the application.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { value: 'light', label: 'Daylight', color: 'bg-amber-100', icon: Sun },
                  { value: 'dark', label: 'Neonpunk', color: 'bg-pink-900', icon: Moon },
                  { value: 'midnight', label: 'Midnight', color: 'bg-slate-900', icon: Moon },
                  { value: 'aloof', label: 'Aloof', color: 'bg-green-200', icon: Globe },
                ].map((themeOption) => {
                  const Icon = themeOption.icon;
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => setThemeMode(themeOption.value)}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        theme === themeOption.value 
                          ? 'border-orange-500 ring-2 ring-orange-500/20' 
                          : `${themeClasses.border} hover:border-orange-300`
                      } ${themeClasses.cardBackground}`}
                    >
                      <div className={`w-full h-12 rounded-md mb-2 ${themeOption.color}`}></div>
                      <p className={`text-sm font-medium ${themeClasses.textPrimary}`}>{themeOption.label}</p>
                      {theme === themeOption.value && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <ToggleSetting
              label="Sound Effects"
              description="Play sounds for notifications and actions"
              value={settings.soundEffects}
              onChange={() => handleToggle('soundEffects')}
            />
          </div>
        );

      case 'notifications':
        return (
          <div>
            <SectionHeader 
              title="Notifications" 
              description="Choose what notifications you want to receive."
            />
            
            <ToggleSetting
              label="Email Notifications"
              description="Receive updates and alerts via email"
              value={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <ToggleSetting
              label="SMS Notifications"
              description="Receive alerts via SMS"
              value={settings.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
            />
            <ToggleSetting
              label="Test Reminders"
              description="Get reminded before upcoming tests"
              value={settings.testReminders}
              onChange={() => handleToggle('testReminders')}
            />
            <ToggleSetting
              label="Weekly Reports"
              description="Receive weekly progress summary"
              value={settings.weeklyReports}
              onChange={() => handleToggle('weeklyReports')}
            />
            
            {/* Share Reports Section */}
            <div className={`mt-6 p-4 rounded-lg border ${themeClasses.border} ${themeClasses.cardBackground}`}>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-purple-500" />
                <h4 className="font-medium">Share Reports With Mentor/Parent</h4>
              </div>
              <p className={`text-sm mb-4 ${themeClasses.secondaryTextColor}`}>
                Send a weekly summary report to a mentor, parent, or guardian to keep them updated on your progress.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.textColor}`}>
                    Email Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={shareEmailInput}
                      onChange={(e) => {
                        setShareEmailInput(e.target.value);
                        // Reset OTP state if email changes (but not verified state in edit mode)
                        if (!shareEmailEditMode && (shareEmailVerified || shareEmailOtpSent)) {
                          setShareEmailVerified(false);
                          setShareEmailOtpSent(false);
                          setShareEmailOtp('');
                          setShareEmailOtpError('');
                          setShareEmailOtpSuccess('');
                        }
                      }}
                      onBlur={() => {
                        // Only save to settings on blur if not in edit mode
                        if (!shareEmailEditMode && !shareEmailVerified && shareEmailInput !== settings.reportShareEmail) {
                          handleChange('reportShareEmail', shareEmailInput);
                        }
                      }}
                      placeholder="mentor@example.com"
                      disabled={shareEmailVerified && !shareEmailEditMode}
                      className={`flex-1 px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textColor} focus:ring-2 focus:ring-blue-500 focus:border-transparent ${shareEmailVerified && !shareEmailEditMode ? 'opacity-60' : ''}`}
                    />
                    {/* Edit Mode - Show Save/Cancel */}
                    {shareEmailEditMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (!shareEmailInput || !shareEmailInput.includes('@')) {
                              setShareEmailOtpError('Please enter a valid email address');
                              return;
                            }
                            // Save and send OTP
                            handleChange('reportShareEmail', shareEmailInput);
                            handleChange('reportShareEmailVerified', false);
                            handleChange('reportShareEnabled', false);
                            setShareEmailEditMode(false);
                            setShareEmailOtpLoading(true);
                            setShareEmailOtpError('');
                            try {
                              const response = await fetch('http://localhost:5000/api/send-secondary-email-otp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  email: shareEmailInput,
                                  recipientName: settings.reportShareName || 'Recipient',
                                  studentName: JSON.parse(localStorage.getItem('userData'))?.firstName || 'Student',
                                  relationship: settings.reportShareRelation
                                })
                              });
                              const data = await response.json();
                              if (data.success) {
                                setShareEmailOtpSent(true);
                                setShareEmailOtpSuccess('OTP sent! Please ask the recipient to check their email.');
                              } else {
                                setShareEmailOtpError(data.message || 'Failed to send OTP');
                              }
                            } catch (err) {
                              setShareEmailOtpError('Failed to send OTP. Please try again.');
                            } finally {
                              setShareEmailOtpLoading(false);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium whitespace-nowrap"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            // Cancel - restore original
                            setShareEmailInput(originalShareEmail);
                            setShareEmailEditMode(false);
                            setShareEmailVerified(true);
                            setShareEmailOtpError('');
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : !shareEmailVerified ? (
                      <button
                        onClick={async () => {
                          if (!shareEmailInput || !shareEmailInput.includes('@')) {
                            setShareEmailOtpError('Please enter a valid email address');
                            return;
                          }
                          // Save email first
                          handleChange('reportShareEmail', shareEmailInput);
                          setShareEmailOtpLoading(true);
                          setShareEmailOtpError('');
                          try {
                            const response = await fetch('http://localhost:5000/api/send-secondary-email-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: shareEmailInput,
                                recipientName: settings.reportShareName || 'Recipient',
                                studentName: JSON.parse(localStorage.getItem('userData'))?.firstName || 'Student',
                                relationship: settings.reportShareRelation
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setShareEmailOtpSent(true);
                              setShareEmailOtpSuccess('OTP sent! Please ask the recipient to check their email.');
                            } else {
                              setShareEmailOtpError(data.message || 'Failed to send OTP');
                            }
                          } catch (err) {
                            setShareEmailOtpError('Failed to send OTP. Please try again.');
                          } finally {
                            setShareEmailOtpLoading(false);
                          }
                        }}
                        disabled={shareEmailOtpLoading || !shareEmailInput}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                      >
                        {shareEmailOtpLoading ? 'Sending...' : shareEmailOtpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Remove email"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Confirmation */}
                  {showDeleteConfirm && (
                    <div className="mt-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                            Remove shared email?
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                            {deleteOtpSent 
                              ? `Enter the OTP sent to ${shareEmailInput} to confirm removal.`
                              : `An OTP will be sent to ${shareEmailInput} for approval before removal.`
                            }
                          </p>
                          
                          {/* OTP Input for deletion */}
                          {deleteOtpSent && (
                            <div className="mb-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={deleteOtp}
                                  onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="Enter OTP"
                                  maxLength={6}
                                  className="flex-1 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-center tracking-widest font-mono"
                                />
                              </div>
                              {deleteOtpError && (
                                <p className="text-sm text-red-600 mt-2">{deleteOtpError}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            {!deleteOtpSent ? (
                              <button
                                onClick={async () => {
                                  setDeleteOtpLoading(true);
                                  setDeleteOtpError('');
                                  try {
                                    const response = await fetch('http://localhost:5000/api/send-removal-otp', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        email: shareEmailInput,
                                        recipientName: shareNameInput || 'Recipient',
                                        studentName: JSON.parse(localStorage.getItem('userData'))?.firstName || 'Student'
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      setDeleteOtpSent(true);
                                    } else {
                                      setDeleteOtpError(data.message || 'Failed to send OTP');
                                    }
                                  } catch (err) {
                                    setDeleteOtpError('Failed to send OTP. Please try again.');
                                  } finally {
                                    setDeleteOtpLoading(false);
                                  }
                                }}
                                disabled={deleteOtpLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                              >
                                {deleteOtpLoading ? 'Sending OTP...' : 'Send OTP to Remove'}
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (deleteOtp.length !== 6) {
                                    setDeleteOtpError('Please enter a 6-digit OTP');
                                    return;
                                  }
                                  setDeleteOtpLoading(true);
                                  setDeleteOtpError('');
                                  try {
                                    const response = await fetch('http://localhost:5000/api/verify-removal-otp', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        email: shareEmailInput,
                                        otp: deleteOtp
                                      })
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      // Remove email completely
                                      setShareEmailInput('');
                                      setShareNameInput('');
                                      setShareEmailVerified(false);
                                      setShareEmailOtpSent(false);
                                      setShareEmailOtp('');
                                      setShareEmailOtpError('');
                                      setShareEmailOtpSuccess('');
                                      setShowDeleteConfirm(false);
                                      setDeleteOtpSent(false);
                                      setDeleteOtp('');
                                      handleChange('reportShareEmail', '');
                                      handleChange('reportShareName', '');
                                      handleChange('reportShareEmailVerified', false);
                                      handleChange('reportShareEnabled', false);
                                    } else {
                                      setDeleteOtpError(data.message || 'Invalid OTP');
                                    }
                                  } catch (err) {
                                    setDeleteOtpError('Verification failed. Please try again.');
                                  } finally {
                                    setDeleteOtpLoading(false);
                                  }
                                }}
                                disabled={deleteOtpLoading || deleteOtp.length !== 6}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                              >
                                {deleteOtpLoading ? 'Verifying...' : 'Confirm Removal'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteOtpSent(false);
                                setDeleteOtp('');
                                setDeleteOtpError('');
                              }}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* OTP Input Section */}
                  {shareEmailOtpSent && !shareEmailVerified && !shareEmailEditMode && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                        Enter the 6-digit code sent to {shareEmailInput}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareEmailOtp}
                          onChange={(e) => setShareEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter OTP"
                          maxLength={6}
                          className={`flex-1 px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textColor} focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center tracking-widest font-mono`}
                        />
                        <button
                          onClick={async () => {
                            if (shareEmailOtp.length !== 6) {
                              setShareEmailOtpError('Please enter a 6-digit OTP');
                              return;
                            }
                            setShareEmailOtpLoading(true);
                            setShareEmailOtpError('');
                            try {
                              const response = await fetch('http://localhost:5000/api/verify-secondary-email-otp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  email: shareEmailInput,
                                  otp: shareEmailOtp
                                })
                              });
                              const data = await response.json();
                              if (data.success) {
                                setShareEmailVerified(true);
                                setShareEmailOtpSuccess('Email verified successfully!');
                                handleChange('reportShareEmailVerified', true);
                              } else {
                                setShareEmailOtpError(data.message || 'Invalid OTP');
                              }
                            } catch (err) {
                              setShareEmailOtpError('Verification failed. Please try again.');
                            } finally {
                              setShareEmailOtpLoading(false);
                            }
                          }}
                          disabled={shareEmailOtpLoading || shareEmailOtp.length !== 6}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {shareEmailOtpLoading ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Fixed height container for messages to prevent layout shift */}
                  <div className="min-h-[24px] mt-2">
                    {shareEmailOtpError && (
                      <p className="text-sm text-red-500">{shareEmailOtpError}</p>
                    )}
                    {shareEmailOtpSuccess && !shareEmailOtpError && (
                      <p className="text-sm text-green-500">{shareEmailOtpSuccess}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.textColor}`}>
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={shareNameInput}
                    onChange={(e) => setShareNameInput(e.target.value)}
                    onBlur={() => {
                      if (shareNameInput !== settings.reportShareName) {
                        handleChange('reportShareName', shareNameInput);
                      }
                    }}
                    placeholder="Dr. Smith or Mom"
                    className={`w-full px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textColor} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${themeClasses.textColor}`}>
                    Relationship
                  </label>
                  <select
                    value={settings.reportShareRelation}
                    onChange={(e) => handleChange('reportShareRelation', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textColor} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="mentor">Mentor</option>
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className={`text-sm ${themeClasses.textColor}`}>Enable Weekly Sharing</span>
                  </div>
                  <button
                    onClick={() => handleToggle('reportShareEnabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.reportShareEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    disabled={!shareEmailVerified}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reportShareEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {!shareEmailVerified && shareEmailInput && (
                  <p className="text-sm text-yellow-500">Please verify the email address to enable sharing.</p>
                )}
              </div>
            </div>
            
            <ToggleSetting
              label="Job Alerts"
              description="Notifications for matching job opportunities"
              value={settings.jobAlerts}
              onChange={() => handleToggle('jobAlerts')}
            />
          </div>
        );

      case 'privacy':
        return (
          <div>
            <SectionHeader 
              title="Privacy & Security" 
              description="Control your privacy settings and who can see your information."
            />
            
            <SelectSetting
              label="Profile Visibility"
              description="Control who can see your profile"
              value={settings.profileVisibility}
              options={[
                { value: 'public', label: 'Public - Anyone' },
                { value: 'recruiters', label: 'Recruiters Only' },
                { value: 'private', label: 'Private - Only Me' }
              ]}
              onChange={(value) => handleChange('profileVisibility', value)}
            />
            <ToggleSetting
              label="Resume Visibility"
              description="Allow companies to view and download your resume"
              value={settings.resumeVisibility}
              onChange={() => handleToggle('resumeVisibility')}
            />
            <ToggleSetting
              label="Show Placement Score"
              description="Display your placement score publicly"
              value={settings.showPlacementScore}
              onChange={() => handleToggle('showPlacementScore')}
            />
          </div>
        );

      case 'sessions':
        return (
          <div>
            <SectionHeader 
              title="Sessions" 
              description="Manage your active sessions and devices."
            />
            
            <div className={`p-4 rounded-lg ${themeClasses.cardBackground} border ${themeClasses.border} mb-4`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${themeClasses.textPrimary}`}>Current Session</p>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>This device • Active now</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Active</span>
              </div>
            </div>
            
            <ActionRow
              label="Sign out all other sessions"
              description="This will sign you out of all devices except this one."
              buttonText="Sign out all"
              onClick={() => alert('Feature coming soon!')}
              variant="danger"
            />
          </div>
        );

      case 'learning':
        return (
          <div>
            <SectionHeader 
              title="Learning Preferences" 
              description="Customize your learning experience."
            />
            
            <ToggleSetting
              label="Daily Goal Reminder"
              description="Get reminded to study every day"
              value={settings.dailyGoalReminder}
              onChange={() => handleToggle('dailyGoalReminder')}
            />
            
            <div className={`flex items-center justify-between py-4 border-b ${themeClasses.border}`}>
              <div className="flex-1 pr-4">
                <p className={`font-medium ${themeClasses.textPrimary}`}>Reminder Time</p>
                <p className={`text-sm mt-0.5 ${themeClasses.textSecondary}`}>When to send your daily study reminder</p>
              </div>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleChange('reminderTime', e.target.value)}
                className={`${themeClasses.inputBackground} ${themeClasses.textPrimary} rounded-md px-3 py-1.5 text-sm border ${themeClasses.border} focus:outline-none focus:ring-2 focus:ring-orange-500`}
              />
            </div>
          </div>
        );

      case 'data':
        return (
          <div>
            <SectionHeader 
              title="Data & Export" 
              description="Download your data and export reports."
            />
            
            <ActionRow
              label="Download My Data"
              description="Get a copy of all your data stored on PAG.ai"
              buttonText="Download"
              onClick={() => alert('Feature coming soon!')}
              icon={Download}
            />
            <ActionRow
              label="Export Progress Report"
              description="Download a PDF report of your learning progress"
              buttonText="Export"
              onClick={() => alert('Feature coming soon!')}
              icon={FileText}
            />
            <ActionRow
              label="Export Resume"
              description="Download your resume as PDF"
              buttonText="Export"
              onClick={() => alert('Feature coming soon!')}
              icon={FileText}
            />
          </div>
        );

      case 'help':
        return (
          <div>
            <SectionHeader 
              title="Help & Support" 
              description="Get help and contact our support team."
            />
            
            <ActionRow
              label="FAQs"
              description="Find answers to commonly asked questions"
              buttonText="View FAQs"
              onClick={() => navigate('/faq')}
              icon={HelpCircle}
            />
            <ActionRow
              label="Contact Support"
              description="Get in touch with our support team"
              buttonText="Contact"
              onClick={() => navigate('/feedback')}
              icon={Mail}
            />
            
            <div className={`mt-8 p-4 rounded-lg ${themeClasses.cardBackground} border ${themeClasses.border}`}>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                <span className="font-medium">PAG.ai</span> Version 1.0.0
              </p>
              <p className={`text-xs mt-1 ${themeClasses.textSecondary}`}>
                © 2026 PlacementAI. All rights reserved.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className={`w-full flex items-center justify-between p-4 rounded-lg ${themeClasses.cardBackground} border ${themeClasses.border}`}
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className={`w-5 h-5 ${themeClasses.textPrimary}`} />
              <span className={`font-medium ${themeClasses.textPrimary}`}>Settings</span>
            </div>
            <ChevronDown className={`w-5 h-5 ${themeClasses.textSecondary} transition-transform ${isMobileSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className={`lg:w-72 flex-shrink-0 ${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className={`${themeClasses.cardBackground} rounded-xl border ${themeClasses.border} overflow-hidden sticky top-20`}>
              {/* User Profile Header */}
              <div className={`p-4 border-b ${themeClasses.border}`}>
                <div className="flex items-center gap-3">
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
                    <p className={`text-xs truncate ${themeClasses.textSecondary}`}>Your personal account</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {menuCategories.map((category, catIdx) => (
                  <div key={catIdx} className={catIdx > 0 ? 'mt-4' : ''}>
                    {category.label && (
                      <p className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${themeClasses.textSecondary}`}>
                        {category.label}
                      </p>
                    )}
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                            isActive
                              ? 'bg-orange-500/10 text-orange-500 font-medium border-l-2 border-orange-500'
                              : `${themeClasses.textPrimary} hover:bg-orange-500/5`
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                
                {/* Logout Button */}
                <div className={`mt-4 pt-4 border-t ${themeClasses.border}`}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Save Message - Fixed position to prevent layout shift */}
            <div className="fixed bottom-4 right-4 z-50 transition-all duration-300" style={{ opacity: saveMessage ? 1 : 0, pointerEvents: saveMessage ? 'auto' : 'none' }}>
              <div className="p-3 bg-green-500 text-white rounded-lg shadow-lg font-medium flex items-center gap-2">
                <Check className="w-5 h-5" />
                {saveMessage || 'Settings saved!'}
              </div>
            </div>
            
            <div className={`${themeClasses.cardBackground} rounded-xl border ${themeClasses.border} p-6`}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md ${themeClasses.cardBackground} rounded-xl border ${themeClasses.border} shadow-2xl`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Key className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Change Password</h2>
              </div>
              <button 
                onClick={closePasswordModal}
                className={`p-1.5 rounded-md hover:bg-gray-500/10 transition-colors ${themeClasses.textSecondary}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-500">{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-500">{passwordSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${themeClasses.textPrimary}`}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${themeClasses.textPrimary}`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${themeClasses.textPrimary}`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${themeClasses.border} ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-lg bg-amber-500/10 border border-amber-500/30`}>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Changing your password will log you out from all devices. You'll receive an email notification about this change.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end gap-3 p-4 border-t ${themeClasses.border}`}>
              <button
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${themeClasses.textSecondary} hover:bg-gray-500/10 transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

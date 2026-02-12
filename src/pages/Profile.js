import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Calendar, Award, CheckCircle2, AlertCircle, Camera, Edit2, Save, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const Profile = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editCount, setEditCount] = useState(0);
  const [editsRemaining, setEditsRemaining] = useState(3);
  
  // Current editing data
  const [profileData, setProfileData] = useState({
    // Basic Information
    fullName: '',
    email: '',
    dateOfBirth: '',
    phoneNumber: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    linkedinProfile: '',
    githubProfile: '',
    personalWebsite: '',
    
    // Academic Background
    degree: '',
    branch: '',
    collegeName: '',
    graduationYear: '',
    cgpa: '',
    hasBacklogs: false,
    backlogCount: 0
  });

  // Saved profile data (only updated after successful save)
  const [savedProfileData, setSavedProfileData] = useState({
    fullName: '',
    email: '',
    dateOfBirth: '',
    phoneNumber: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    linkedinProfile: '',
    githubProfile: '',
    personalWebsite: '',
    degree: '',
    branch: '',
    collegeName: '',
    graduationYear: '',
    cgpa: '',
    hasBacklogs: false,
    backlogCount: 0
  });

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('userData');
    if (!userData) {
      navigate('/signin');
      return;
    }
    
    // Load profile data from backend or localStorage
    loadProfileData();
  }, []); // Remove navigate from dependencies to prevent infinite loop

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      if (!userData || !userData.email) {
        console.error('No user data found');
        setIsLoading(false);
        return;
      }
      
      // Try to fetch from backend
      const response = await fetch(`http://localhost:5000/api/profile/${userData.email}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.profile && data.profile.email) {
          // Profile exists or auto-filled from resume, load it
          console.log('📥 Profile loaded:', data.profile);
          if (data.autoFilled) {
            console.log('✨ Profile auto-filled from resume data');
          }
          
          setProfileData(data.profile);
          setSavedProfileData(data.profile); // Also update saved data
          if (data.profileImage) {
            setImagePreview(data.profileImage);
          }
          
          // Update edit count
          setEditCount(data.editCount || 0);
          setEditsRemaining(data.editsRemaining !== undefined ? data.editsRemaining : 3);
          
          // Auto-enable edit mode if profile is auto-filled or incomplete
          if (data.autoFilled) {
            setIsEditing(true);
          } else {
            // Check if profile is incomplete
            const hasMinimalData = data.profile.fullName && data.profile.phoneNumber && data.profile.degree;
            if (!hasMinimalData) {
              setIsEditing(true);
            }
          }
        } else {
          // No profile exists, create new one with user data
          const newProfile = {
            fullName: userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : userData.username || '',
            email: userData.email || '',
            dateOfBirth: '',
            phoneNumber: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            pincode: '',
            linkedinProfile: '',
            githubProfile: '',
            personalWebsite: '',
            degree: '',
            branch: '',
            collegeName: '',
            graduationYear: '',
            cgpa: '',
            hasBacklogs: false,
            backlogCount: 0
          };
          setProfileData(newProfile);
          setSavedProfileData(newProfile); // Also set as saved data
          setIsEditing(true); // Auto-enable edit mode for new profiles
        }
      } else {
        // Error response, use fallback
        const newProfile = {
          fullName: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData.username || '',
          email: userData.email || '',
          dateOfBirth: '',
          phoneNumber: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          pincode: '',
          linkedinProfile: '',
          githubProfile: '',
          personalWebsite: '',
          degree: '',
          branch: '',
          collegeName: '',
          graduationYear: '',
          cgpa: '',
          hasBacklogs: false,
          backlogCount: 0
        };
        setProfileData(newProfile);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Use userData as fallback
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData && userData.email) {
        const newProfile = {
          fullName: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData.username || '',
          email: userData.email || '',
          dateOfBirth: '',
          phoneNumber: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          pincode: '',
          linkedinProfile: '',
          githubProfile: '',
          personalWebsite: '',
          degree: '',
          branch: '',
          collegeName: '',
          graduationYear: '',
          cgpa: '',
          hasBacklogs: false,
          backlogCount: 0
        };
        setProfileData(newProfile);
        setIsEditing(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSaveMessage('Image size should be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setSaveMessage('');
      
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('💾 Saving profile for user:', userData.email);
      console.log('📋 Profile data to save:', profileData);
      
      const formData = new FormData();
      
      // Append profile data
      Object.keys(profileData).forEach(key => {
        formData.append(key, profileData[key]);
        console.log(`  ${key}: ${profileData[key]}`);
      });
      
      formData.append('email', userData.email);
      
      // Append profile image if changed
      if (profileImage) {
        formData.append('profileImage', profileImage);
        console.log('📷 Profile image included');
      }
      
      console.log('🌐 Sending request to backend...');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/profile/update`, {
        method: 'POST',
        body: formData
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Save successful:', result);
        
        // Update edit count
        setEditCount(result.editCount || 0);
        setEditsRemaining(result.editsRemaining !== undefined ? result.editsRemaining : 3);
        
        setSaveMessage('Profile saved successfully!');
        setIsEditing(false);
        setProfileImage(null); // Clear the file input
        
        // Update saved profile data to reflect the new save
        setSavedProfileData({...profileData});
        
        // Reload profile data from backend
        await loadProfileData();
        
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const error = await response.json();
        console.error('❌ Save failed:', error);
        
        // Check if edit limit reached
        if (error.editLimitReached) {
          setSaveMessage('Edit limit reached! You can only edit your profile 3 times.');
          setIsEditing(false);
        } else {
          setSaveMessage(error.message || 'Failed to save profile');
        }
      }
    } catch (error) {
      console.error('💥 Error saving profile:', error);
      setSaveMessage('Error saving profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = [
      savedProfileData.fullName,
      savedProfileData.email,
      savedProfileData.dateOfBirth,
      savedProfileData.phoneNumber,
      savedProfileData.address1,
      savedProfileData.city,
      savedProfileData.state,
      savedProfileData.pincode,
      savedProfileData.degree,
      savedProfileData.branch,
      savedProfileData.collegeName,
      savedProfileData.graduationYear,
      savedProfileData.cgpa
    ];
    
    const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
    const totalFields = fields.length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const getMissingFields = () => {
    const fieldLabels = {
      fullName: 'Full Name',
      email: 'Email',
      dateOfBirth: 'Date of Birth',
      phoneNumber: 'Phone Number',
      address1: 'Address Line 1',
      city: 'City',
      state: 'State',
      pincode: 'PIN Code',
      degree: 'Degree',
      branch: 'Branch/Specialization',
      collegeName: 'College Name',
      graduationYear: 'Year of Graduation',
      cgpa: 'CGPA/Percentage'
    };
    
    return Object.keys(fieldLabels).filter(
      key => !savedProfileData[key] || savedProfileData[key].toString().trim() === ''
    ).map(key => fieldLabels[key]);
  };

  const completionPercentage = calculateProfileCompletion();
  const missingFields = getMissingFields();

  // Show loading spinner while data is loading
  if (isLoading && !profileData.email) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-b-4 ${themeClasses.cardBorder} mx-auto mb-4`}></div>
          <p className={themeClasses.textSecondary}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.textPrimary} mb-2`}>My Profile</h1>
          <p className={themeClasses.textSecondary}>Manage your personal and academic information</p>
        </div>

        {/* Success Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.includes('success') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {saveMessage.includes('success') ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{saveMessage}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-6 sticky top-24`}>
              {/* Profile Image */}
              <div className="relative mb-6">
                <div className={`w-32 h-32 mx-auto rounded-full overflow-hidden ${themeClasses.gradient} p-1`}>
                  <div className={`w-full h-full rounded-full overflow-hidden ${themeClasses.cardBackground} flex items-center justify-center`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className={`w-16 h-16 ${themeClasses.textSecondary}`} />
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <label className={`absolute bottom-0 right-1/2 transform translate-x-16 ${themeClasses.buttonPrimary} rounded-full p-2 cursor-pointer shadow-lg transition-all`}>
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Name */}
              <h2 className={`text-xl font-bold text-center ${themeClasses.textPrimary} mb-1`}>
                {profileData.fullName || 'Your Name'}
              </h2>
              <p className={`text-sm text-center ${themeClasses.textMuted} mb-3`}>
                {profileData.degree ? `${profileData.degree} Student` : 'Student'}
              </p>

              {/* Edit Count Info - Below Name - PROMINENT */}
              <div className={`text-center mb-6 px-4 py-3 rounded-xl border-2 shadow-md ${
                editsRemaining === 0 
                  ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-400 dark:border-red-600'
                  : editsRemaining === 1
                  ? `${themeClasses.sectionBackground} border-${themeClasses.cardBorder}`
                  : `${themeClasses.sectionBackground} ${themeClasses.cardBorder}`
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle className={`w-5 h-5 ${
                    editsRemaining === 0 
                      ? 'text-red-600 dark:text-red-400'
                      : themeClasses.accent
                  }`} />
                  <p className={`text-sm font-bold uppercase tracking-wide ${
                    editsRemaining === 0 
                      ? 'text-red-700 dark:text-red-300'
                      : themeClasses.textPrimary
                  }`}>
                    Profile Edit Limit
                  </p>
                </div>
                <p className={`text-base font-bold ${
                  editsRemaining === 0 
                    ? 'text-red-600 dark:text-red-400'
                    : themeClasses.accent
                }`}>
                  {editsRemaining === 0 ? '⚠️ 0' : editsRemaining} edit{editsRemaining !== 1 ? 's' : ''} remaining out of 3
                </p>
                {editsRemaining === 1 && (
                  <p className={`text-xs font-semibold ${themeClasses.accent} mt-1`}>
                    ⚡ Last edit - use carefully!
                  </p>
                )}
                {editsRemaining === 0 && (
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mt-1">
                    🚫 Editing disabled
                  </p>
                )}
              </div>

              {/* Profile Completion */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>Profile Completion</span>
                  <span className={`text-sm font-bold ${themeClasses.accent}`}>{completionPercentage}%</span>
                </div>
                <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-2.5`}>
                  <div 
                    className={`${themeClasses.gradient} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Missing Fields Checklist */}
              {missingFields.length > 0 && (
                <div className={`${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className={`w-4 h-4 ${themeClasses.accent}`} />
                    <h3 className={`text-sm font-semibold ${themeClasses.textPrimary}`}>Missing Information</h3>
                  </div>
                  <ul className="space-y-1">
                    {missingFields.map((field, index) => (
                      <li key={index} className={`text-xs ${themeClasses.textSecondary} flex items-start gap-2`}>
                        <span className="mt-0.5">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Edit Profile Button */}
              {!isEditing && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={editsRemaining === 0}
                    className={`w-full font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                      editsRemaining === 0
                        ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 text-white'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                    {editsRemaining === 0 ? 'Edit Limit Reached' : 'Edit Profile'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Profile Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Information Card */}
            <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8`}>
              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6 flex items-center gap-2`}>
                <User className={`w-6 h-6 ${themeClasses.accent}`} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.fullName || '-'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.email || '-'}</p>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profileData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText} [color-scheme:light] dark:[color-scheme:dark]`}
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.dateOfBirth || '-'}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.phoneNumber || '-'}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address1"
                      value={profileData.address1}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="House No., Building Name, Street Name"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.address1 || '-'}</p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Address Line 2 <span className={`${themeClasses.textSecondary} text-xs`}>(Optional)</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address2"
                      value={profileData.address2}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="Area, Landmark (Optional)"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.address2 || '-'}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    City <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="city"
                      value={profileData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., Mumbai"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.city || '-'}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    State <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="state"
                      value={profileData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., Maharashtra"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.state || '-'}</p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="pincode"
                      value={profileData.pincode}
                      onChange={handleInputChange}
                      maxLength="6"
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., 400001"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.pincode || '-'}</p>
                  )}
                </div>

                {/* LinkedIn Profile */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    LinkedIn Profile
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="linkedinProfile"
                      value={profileData.linkedinProfile}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  ) : (
                    profileData.linkedinProfile ? (
                      <a href={profileData.linkedinProfile} target="_blank" rel="noopener noreferrer" className={`${themeClasses.accent} hover:underline py-2.5 block`}>
                        View Profile
                      </a>
                    ) : (
                      <p className={`${themeClasses.textPrimary} py-2.5`}>-</p>
                    )
                  )}
                </div>

                {/* GitHub Portfolio */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    GitHub Portfolio
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="githubProfile"
                      value={profileData.githubProfile}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="https://github.com/yourusername"
                    />
                  ) : (
                    profileData.githubProfile ? (
                      <a href={profileData.githubProfile} target="_blank" rel="noopener noreferrer" className={`${themeClasses.accent} hover:underline py-2.5 block`}>
                        View Profile
                      </a>
                    ) : (
                      <p className={`${themeClasses.textPrimary} py-2.5`}>-</p>
                    )
                  )}
                </div>

                {/* Personal Website */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Personal Website/Portfolio
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      name="personalWebsite"
                      value={profileData.personalWebsite}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {profileData.personalWebsite ? (
                        <a href={profileData.personalWebsite} target="_blank" rel="noopener noreferrer" className={`${themeClasses.accent} hover:underline py-2.5`}>
                          {profileData.personalWebsite}
                        </a>
                      ) : (
                        <p className={`${themeClasses.textPrimary} py-2.5`}>-</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Background Card */}
            <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8`}>
              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6 flex items-center gap-2`}>
                <GraduationCap className={`w-6 h-6 ${themeClasses.accent}`} />
                Academic Background
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Degree */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Degree <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      name="degree"
                      value={profileData.degree}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                    >
                      <option value="">Select Degree</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="BBA">BBA</option>
                      <option value="B.Sc">B.Sc</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="MCA">MCA</option>
                      <option value="MBA">MBA</option>
                      <option value="M.Sc">M.Sc</option>
                    </select>
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.degree || '-'}</p>
                  )}
                </div>

                {/* Branch/Specialization */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Branch / Specialization <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="branch"
                      value={profileData.branch}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., Computer Science, IT, ECE"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.branch || '-'}</p>
                  )}
                </div>

                {/* College Name */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    College Name <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="collegeName"
                      value={profileData.collegeName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="Enter your college name"
                    />
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.collegeName || '-'}</p>
                  )}
                </div>

                {/* Year of Graduation */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Year of Graduation <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="graduationYear"
                      value={profileData.graduationYear}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., 2025"
                      min="2020"
                      max="2030"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                      <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.graduationYear || '-'}</p>
                    </div>
                  )}
                </div>

                {/* CGPA/Percentage */}
                <div>
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    CGPA / Percentage <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="cgpa"
                      value={profileData.cgpa}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                      placeholder="e.g., 8.5 or 85%"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <p className={`${themeClasses.textPrimary} py-2.5`}>{profileData.cgpa || '-'}</p>
                    </div>
                  )}
                </div>

                {/* Backlogs */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-semibold ${themeClasses.textSecondary} mb-3`}>
                    Backlogs?
                  </label>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasBacklogs"
                            checked={!profileData.hasBacklogs}
                            onChange={() => setProfileData(prev => ({ ...prev, hasBacklogs: false, backlogCount: 0 }))}
                            className={`w-4 h-4 ${themeClasses.accent}`}
                          />
                          <span className="text-amber-700 dark:text-gray-300">No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasBacklogs"
                            checked={profileData.hasBacklogs}
                            onChange={() => setProfileData(prev => ({ ...prev, hasBacklogs: true }))}
                            className={`w-4 h-4 ${themeClasses.accent}`}
                          />
                          <span className="text-amber-700 dark:text-gray-300">Yes</span>
                        </label>
                      </div>
                      {profileData.hasBacklogs && (
                        <input
                          type="number"
                          name="backlogCount"
                          value={profileData.backlogCount}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2.5 border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} ${themeClasses.inputBackground} ${themeClasses.inputText}`}
                          placeholder="Number of backlogs"
                          min="0"
                        />
                      )}
                    </div>
                  ) : (
                    <p className={`${themeClasses.textPrimary} py-2.5`}>
                      {profileData.hasBacklogs ? `Yes (${profileData.backlogCount || 0})` : 'No'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Save Changes Button - Centered at Bottom */}
            {isEditing && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-12 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResumeProfileSelection = () => {
  // Dynamic API base for localhost and LAN usage
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');
  const [userData, setUserData] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [mobileInput, setMobileInput] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    } else {
      // If no user data, redirect to sign in
      navigate('/signin');
    }
  }, [navigate]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleMobileSubmit = async () => {
    // Validate mobile number
    if (!mobileInput) {
      alert('Please enter your mobile number');
      return;
    }
    
    // Clean the mobile number (remove non-digits)
    const cleanMobile = mobileInput.replace(/\D/g, '');
    
    if (cleanMobile.length < 10) {
      alert('Please enter a valid mobile number (at least 10 digits)');
      return;
    }
    
    // Normalize mobile number format for consistent searching
    let normalizedMobile = cleanMobile;
    
    // If it starts with country code, keep it as is
    // If it's just 10 digits, it might need country code for database search
    if (cleanMobile.length === 10) {
      // Try both formats - the backend will handle the search
      normalizedMobile = cleanMobile;
    } else if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
      // Indian number with country code 91
      normalizedMobile = cleanMobile;
    }
    
    // Send mobile number to n8n webhook via backend (non-blocking)
    console.log('🚀 Starting n8n webhook process...');
    console.log('📱 Normalized mobile:', normalizedMobile);
    console.log('👤 User data:', userData);
    
    // Fire and forget - don't wait for n8n webhook to complete
    const webhookData = {
      mobile: normalizedMobile,
      email: userData?.email || '',
      name: userData?.name || '',
      action: 'use_existing_resume'
    };

    console.log('📤 Sending to n8n webhook via:', `${API_BASE}/api/send-to-n8n`);
    console.log('📦 Webhook payload:', JSON.stringify(webhookData, null, 2));

    fetch(`${API_BASE}/api/send-to-n8n`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    })
      .then(response => {
        console.log('📡 Webhook response status:', response.status);
        return response.json();
      })
      .then(webhookResult => {
        console.log('✅ n8n webhook response:', JSON.stringify(webhookResult, null, 2));
        if (webhookResult.success) {
          console.log('🎉 Mobile number successfully sent to n8n!');
        } else {
          console.warn('⚠️ n8n webhook returned non-success:', webhookResult.message);
        }
      })
      .catch(webhookError => {
        console.error('❌ Failed to send data to n8n webhook:', webhookError);
      });
    
    // Add mobile to userData and continue with linking
    userData.mobile = normalizedMobile;
    setShowMobileInput(false);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/link-resume-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: userData,
          mobile: userData.mobile
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('linkedResumeData', JSON.stringify(result.resumeData));
        localStorage.setItem('resumeId', result.resumeId);
        localStorage.setItem('resumeCollection', result.collection);
        
        alert('Resume successfully linked to your profile!');
        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Failed to link resume to profile');
      }
    } catch (error) {
      console.error('Error linking resume:', error);
      alert(`Error: ${error.message || 'Failed to process your request. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedOption) {
      alert('Please select an option to continue');
      return;
    }

    setLoading(true);

    try {
      // Store the resume choice in localStorage
      localStorage.setItem('resumeChoice', selectedOption);

      if (selectedOption === 'use-existing') {
        // Check if mobile number is available
        const mobile = userData.mobile || userData.phone;
        
        if (!mobile) {
          // Show mobile input modal
          setLoading(false);
          setShowMobileInput(true);
          return;
        }
        
        // If using existing resume, link it with user profile
        
        // Send existing mobile number to n8n webhook (non-blocking)
        const webhookData = {
          mobile: mobile,
          email: userData?.email || '',
          name: userData?.name || '',
          action: 'use_existing_resume_with_mobile'
        };

        console.log('📤 Sending existing mobile to n8n webhook via:', `${API_BASE}/api/send-to-n8n`);
        console.log('📦 Webhook payload:', webhookData);

        // Fire and forget - don't wait for webhook
        fetch(`${API_BASE}/api/send-to-n8n`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        })
          .then(response => response.json())
          .then(webhookResult => {
            console.log('✅ n8n webhook response:', webhookResult);
            if (!webhookResult.success) {
              console.warn('⚠️ n8n webhook returned non-success:', webhookResult.message);
            }
          })
          .catch(webhookError => {
            console.error('❌ Failed to send existing mobile data to n8n webhook:', webhookError);
          });
        
        const response = await fetch(`${API_BASE}/api/link-resume-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userData: userData,
            mobile: userData.mobile || userData.phone
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Store the linked resume data in localStorage for dashboard use
          localStorage.setItem('linkedResumeData', JSON.stringify(result.resumeData));
          localStorage.setItem('resumeId', result.resumeId);
          localStorage.setItem('resumeCollection', result.collection);
          
          // Show success message
          alert('Resume successfully linked to your profile!');
          
          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          throw new Error(result.error || 'Failed to link resume to profile');
        }
      } else {
        // If uploading new resume, redirect to prediction form or upload page
        navigate(`/predict?domain=${domainId || ''}&role=${roleId || ''}`);
      }
    } catch (error) {
      console.error('Error linking resume:', error);
      alert(`Error: ${error.message || 'Failed to process your request. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="w-20 h-20 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg dark:shadow-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-amber-900 dark:text-white mb-4">
            Would you like to use this resume for your profile?
          </h1>
          
          <p className="text-xl text-amber-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We found a resume associated with your account. You can choose to use it for your profile 
            or upload a new one to get the most accurate predictions.
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-lg dark:shadow-glow p-6 mb-8 max-w-md mx-auto border border-gray-100 dark:border-pink-500/20 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <span className="text-amber-600 dark:text-pink-400 font-semibold text-lg">
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-white">{userData.name || 'User'}</h3>
              <p className="text-amber-700 dark:text-gray-300 text-sm">{userData.email || userData.username}</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Option 1: Use existing resume */}
          <div 
            className={`bg-white dark:bg-[#1e1a2e] rounded-xl shadow-lg dark:shadow-glow border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
              selectedOption === 'use-existing' 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30 dark:border-green-600' 
                : 'border-amber-200/50 dark:border-pink-500/20 hover:border-green-300 dark:hover:border-green-700'
            }`}
            onClick={() => handleOptionSelect('use-existing')}
          >
            <div className="p-8">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-1 ${
                  selectedOption === 'use-existing'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-pink-500/20'
                }`}>
                  {selectedOption === 'use-existing' && (
                    <svg className="w-4 h-4 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-amber-900 dark:text-white">
                      Yes, use my uploaded resume
                    </h3>
                    <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <p className="text-amber-700 dark:text-gray-300 leading-relaxed">
                    Continue with your existing resume. This will give you personalized predictions 
                    based on your current profile and help create a tailored roadmap for your career growth.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Upload new resume */}
          <div 
            className={`bg-white dark:bg-[#1e1a2e] rounded-xl shadow-lg dark:shadow-glow border-2 transition-all duration-300 cursor-pointer hover:shadow-xl ${
              selectedOption === 'upload-new' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600' 
                : 'border-amber-200/50 dark:border-pink-500/20 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
            onClick={() => handleOptionSelect('upload-new')}
          >
            <div className="p-8">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mt-1 ${
                  selectedOption === 'upload-new'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 dark:border-pink-500/20'
                }`}>
                  {selectedOption === 'upload-new' && (
                    <svg className="w-4 h-4 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-amber-900 dark:text-white">
                      No, I want to upload a new resume
                    </h3>
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                      Fresh Start
                    </span>
                  </div>
                  <p className="text-amber-700 dark:text-gray-300 leading-relaxed">
                    Upload a new resume if you've made significant updates or want to start fresh. 
                    This will give you the most current analysis based on your latest information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center mt-12">
          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              selectedOption && !loading
                ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl dark:shadow-glow transform hover:-translate-y-1'
                : 'bg-gray-300 dark:bg-[#2d1f3d] text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Continue to Next Step'
            )}
          </button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm underline"
          >
            Skip this step and continue
          </button>
        </div>
      </div>
      
      {/* Mobile Number Input Modal */}
      {showMobileInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-6 w-full max-w-md mx-4 border border-amber-200/50 dark:border-pink-500/20 shadow-2xl dark:shadow-glow">
            <h3 className="text-xl font-bold text-amber-900 dark:text-white mb-4">Enter Mobile Number</h3>
            <p className="text-amber-700 dark:text-gray-300 mb-6">
              Please enter your mobile number to link your existing resume with your profile.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder="e.g., 9548418927 or +91 9548418927"
                className="w-full px-4 py-3 border border-gray-300 dark:border-pink-500/20 rounded-lg bg-white dark:bg-[#2d1f3d] text-amber-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-pink-500 focus:border-amber-500 dark:focus:border-pink-500 outline-none transition-colors"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Enter with or without country code (+91). We'll search in all formats.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMobileInput(false);
                  setMobileInput('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-pink-500/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMobileSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeProfileSelection;

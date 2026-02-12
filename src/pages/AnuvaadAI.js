import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const AnuvaadAI = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  // Anuvaad AI states
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translatedVideoUrl, setTranslatedVideoUrl] = useState(null);
  
  // YouTube link translation states
  const [youtubeLink, setYoutubeLink] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'youtube'

  // Handle video file upload
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedVideo(file);
      console.log('Video uploaded:', file.name, 'Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');
    }
  };

  // Handle language selection
  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };

  // Handle translation start
  const handleStartTranslation = async () => {
    console.log('🎬 handleStartTranslation called');
    console.log('📁 Upload Method:', uploadMethod);
    console.log('🎥 Video:', uploadedVideo);
    console.log('🔗 YouTube Link:', youtubeLink);
    console.log('🌐 Language:', selectedLanguage);
    
    // Validation based on upload method
    if (uploadMethod === 'file') {
      if (!uploadedVideo) {
        alert('Please upload a video first');
        return;
      }
    } else if (uploadMethod === 'youtube') {
      if (!youtubeLink) {
        alert('Please enter a YouTube link');
        return;
      }
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(youtubeLink)) {
        alert('Please enter a valid YouTube URL');
        return;
      }
    }
    
    if (!selectedLanguage) {
      alert('Please select a target language');
      return;
    }

    // Set loading state
    setTranslating(true);
    setTranslationProgress(0);

    try {
      const formData = new FormData();
      
      if (uploadMethod === 'file') {
        // File upload method
        formData.append('video', uploadedVideo);
        formData.append('language', selectedLanguage);
        console.log('📦 FormData created with video:', uploadedVideo.name, 'size:', (uploadedVideo.size / (1024 * 1024)).toFixed(2), 'MB');
      } else {
        // YouTube link method
        formData.append('youtube_url', youtubeLink);
        formData.append('language', selectedLanguage);
        console.log('📦 FormData created with YouTube URL:', youtubeLink);
      }
      
      console.log('📦 FormData language:', selectedLanguage);

      // Use appropriate endpoint based on upload method
      const endpoint = uploadMethod === 'youtube' ? '/api/translate-youtube' : '/api/translate-video';
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const apiEndpoint = `${backendUrl}${endpoint}`;
      console.log('🌐 Making fetch request to:', apiEndpoint);

      // Call backend API
      console.log('⏳ Sending request...');
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      console.log('✅ Response received:', response.status, response.statusText);

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setTranslationProgress(100);
        setTranslatedVideoUrl(data.video_url);
        alert(`✅ Translation completed successfully! Video: ${data.filename}`);
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (error.message === 'Failed to fetch') {
        alert(`❌ Cannot connect to backend server. Please make sure:\n1. Backend is running (python app.py)\n2. Backend is at http://localhost:5000`);
      } else {
        alert(`❌ Translation failed: ${error.message}`);
      }
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} ${themeClasses.textPrimary}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-20 left-10 w-72 h-72 ${themeClasses.gradient} opacity-20 rounded-full blur-3xl`}></div>
          <div className={`absolute bottom-20 right-10 w-96 h-96 ${themeClasses.gradient} opacity-20 rounded-full blur-3xl`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          {/* Header */}
          <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border ${themeClasses.cardBorder} mb-8`}>
            <div className="text-center">
              <div className={`w-20 h-20 ${themeClasses.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h1 className={`text-4xl font-bold ${themeClasses.textPrimary} mb-4`}>Anuvaad AI - Video Translation</h1>
              <p className={`text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
                Upload your video and translate it to different Indian languages with AI-powered voice synthesis
              </p>
            </div>
          </div>

          {/* Upload and Translation Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Upload Video Card */}
            <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-dashed ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
              <div className="text-center">
                <div className={`w-20 h-20 ${themeClasses.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>Upload Video</h3>
                <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                  Upload video file or paste YouTube link
                </p>
                
                {/* Upload Method Toggle */}
                <div className="flex justify-center gap-2 mb-6">
                  <button
                    onClick={() => {
                      setUploadMethod('file');
                      setYoutubeLink('');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      uploadMethod === 'file'
                        ? `${themeClasses.buttonPrimary} text-white shadow-md`
                        : `${themeClasses.sectionBackground} ${themeClasses.textSecondary} ${themeClasses.hover}`
                    }`}
                  >
                    📁 Upload File
                  </button>
                  <button
                    onClick={() => {
                      setUploadMethod('youtube');
                      setUploadedVideo(null);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      uploadMethod === 'youtube'
                        ? `${themeClasses.buttonPrimary} text-white shadow-md`
                        : `${themeClasses.sectionBackground} ${themeClasses.textSecondary} ${themeClasses.hover}`
                    }`}
                  >
                    🎬 YouTube Link
                  </button>
                </div>

                {/* File Upload Method */}
                {uploadMethod === 'file' ? (
                  <>
                    {/* Show uploaded video info if file is selected */}
                    {uploadedVideo ? (
                      <div className={`mb-6 p-4 ${themeClasses.sectionBackground} border-2 ${themeClasses.cardBorder} rounded-xl`}>
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <svg className={`w-8 h-8 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-semibold ${themeClasses.textPrimary} break-all`}>
                              {uploadedVideo.name}
                            </p>
                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                              Size: {(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => setUploadedVideo(null)}
                            className={`${themeClasses.accent} hover:opacity-80 transition-colors`}
                            title="Remove video"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className={`flex items-center justify-center text-xs ${themeClasses.accent}`}>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Video uploaded successfully
                        </div>
                      </div>
                    ) : null}

                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="video-upload"
                      className={`inline-flex items-center px-6 py-3 ${themeClasses.buttonPrimary} text-white font-semibold rounded-xl cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {uploadedVideo ? 'Change Video File' : 'Choose Video File'}
                    </label>
                    <p className={`text-xs ${themeClasses.textSecondary} mt-4`}>
                      Supported formats: MP4, AVI, MOV, MKV
                    </p>
                  </>
                ) : (
                  /* YouTube Link Method */
                  <div className="space-y-4">
                    {/* YouTube Link Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        placeholder="Paste YouTube URL here..."
                        className={`w-full px-4 py-3 pl-12 ${themeClasses.inputBackground} border-2 ${themeClasses.inputBorder} ${themeClasses.inputText} rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-0 ${themeClasses.inputFocus} transition-all duration-200`}
                      />
                      <svg className={`w-6 h-6 ${themeClasses.accent} absolute left-3 top-1/2 transform -translate-y-1/2`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    
                    {/* Show YouTube link preview */}
                    {youtubeLink && (
                      <div className={`p-3 ${themeClasses.sectionBackground} border-2 ${themeClasses.cardBorder} rounded-lg`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-5 h-5 ${themeClasses.accent}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                          </svg>
                          <span className={`text-sm font-medium ${themeClasses.textPrimary} truncate flex-1`}>
                            {youtubeLink}
                          </span>
                          <button
                            onClick={() => setYoutubeLink('')}
                            className={`${themeClasses.accent} hover:opacity-80 transition-colors`}
                            title="Clear link"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    <p className={`text-xs ${themeClasses.textSecondary} mt-2`}>
                      💡 Example: https://www.youtube.com/watch?v=VIDEO_ID
                    </p>
                    <p className={`text-xs ${themeClasses.accent} mt-1`}>
                      ⚠️ Video will be trimmed to first 60 seconds for translation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Change Language Card */}
            <div className={`${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-200`}>
              <div className="text-center">
                <div className={`w-20 h-20 ${themeClasses.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>Select Target Language</h3>
                <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                  Choose the language for translation
                </p>
                
                {/* Language Dropdown */}
                <div className="relative inline-block w-full max-w-xs">
                  <select 
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className={`w-full px-4 py-3 ${themeClasses.inputBackground} border-2 ${themeClasses.inputBorder} ${themeClasses.inputText} rounded-xl font-medium focus:outline-none focus:ring-2 ${themeClasses.inputFocus} cursor-pointer transition-all duration-200 appearance-none`}
                  >
                    <option value="">Select Language</option>
                    <option value="hindi">🇮🇳 Hindi (हिंदी)</option>
                    <option value="bengali">🇮🇳 Bengali (বাংলা)</option>
                    <option value="telugu">🇮🇳 Telugu (తెలుగు)</option>
                    <option value="marathi">🇮🇳 Marathi (मराठी)</option>
                    <option value="tamil">🇮🇳 Tamil (தமிழ்)</option>
                    <option value="gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
                    <option value="kannada">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                    <option value="malayalam">🇮🇳 Malayalam (മലയാളം)</option>
                    <option value="punjabi">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
                    <option value="odia">🇮🇳 Odia (ଓଡ଼ିଆ)</option>
                    <option value="urdu">🇮🇳 Urdu (اردو)</option>
                    <option value="assamese">🇮🇳 Assamese (অসমীয়া)</option>
                  </select>
                  <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${themeClasses.accent}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button 
                  onClick={handleStartTranslation}
                  disabled={
                    translating || 
                    !selectedLanguage || 
                    (uploadMethod === 'file' && !uploadedVideo) || 
                    (uploadMethod === 'youtube' && !youtubeLink)
                  }
                  className={`mt-6 w-full px-6 py-3 ${themeClasses.buttonPrimary} text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="flex items-center justify-center">
                    {translating ? (
                      <>
                        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Start Translation
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Translation Progress */}
          {translating && (
            <div className={`mt-6 ${themeClasses.cardBackground} backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 ${themeClasses.cardBorder} mb-8`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Processing Translation</h4>
                <span className={`text-sm font-medium ${themeClasses.accent}`}>{translationProgress}%</span>
              </div>
              <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3 overflow-hidden`}>
                <div 
                  className={`h-full ${themeClasses.gradient} transition-all duration-500 ease-out flex items-center justify-end`}
                  style={{ width: `${translationProgress}%` }}
                >
                  <div className="w-3 h-3 bg-white rounded-full mr-1 animate-pulse"></div>
                </div>
              </div>
              <div className={`mt-3 flex items-center text-sm ${themeClasses.textSecondary}`}>
                <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Detecting language, transcribing audio, translating, and generating voice...
              </div>
            </div>
          )}

          {/* Download Translated Video */}
          {translatedVideoUrl && !translating && (
            <div className={`mt-6 ${themeClasses.sectionBackground} rounded-2xl p-6 shadow-sm border-2 ${themeClasses.cardBorder} mb-8`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-bold ${themeClasses.textPrimary}`}>Translation Complete!</h4>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Your video has been successfully translated</p>
                </div>
                <a
                  href={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${translatedVideoUrl}`}
                  download
                  className={`inline-flex items-center px-6 py-3 ${themeClasses.buttonPrimary} text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Video
                </a>
              </div>
              
              {/* Video Player */}
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-black">
                <video
                  controls
                  className="w-full max-h-96 object-contain"
                  src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${translatedVideoUrl}`}
                  type="video/mp4"
                >
                  Your browser does not support the video tag.
                </video>
                <div className={`absolute top-4 right-4 ${themeClasses.gradient} backdrop-blur-sm px-3 py-1 rounded-full`}>
                  <span className="text-white text-xs font-semibold">Translated Video</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setTranslatedVideoUrl(null);
                    setUploadedVideo(null);
                    setYoutubeLink('');
                  }}
                  className={`inline-flex items-center px-4 py-2 ${themeClasses.cardBackground} ${themeClasses.textPrimary} border-2 ${themeClasses.cardBorder} rounded-lg ${themeClasses.hover} transition-all duration-200`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Translate Another Video
                </button>
              </div>
            </div>
          )}

          {/* Features Info */}
          <div className={`${themeClasses.sectionBackground} rounded-2xl p-6 border ${themeClasses.cardBorder}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${themeClasses.sectionBackground} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-6 h-6 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className={`text-lg font-bold ${themeClasses.textPrimary} mb-2`}>How It Works</h4>
                <ul className={`space-y-2 ${themeClasses.textSecondary} text-sm`}>
                  <li className="flex items-start">
                    <span className={`${themeClasses.accent} mr-2`}>1.</span>
                    Upload your video in any supported format or paste a YouTube link
                  </li>
                  <li className="flex items-start">
                    <span className={`${themeClasses.accent} mr-2`}>2.</span>
                    Select your preferred Indian language for translation
                  </li>
                  <li className="flex items-start">
                    <span className={`${themeClasses.accent} mr-2`}>3.</span>
                    Our AI will process and translate the audio/subtitles
                  </li>
                  <li className="flex items-start">
                    <span className={`${themeClasses.accent} mr-2`}>4.</span>
                    Download your translated video with synthesized voice
                  </li>
                </ul>
                <p className={`text-xs ${themeClasses.textSecondary} mt-4`}>
                  💡 <strong>Note:</strong> This feature uses Whisper AI for transcription, Google Translator, Gemini AI for optimization, and ElevenLabs for voice synthesis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnuvaadAI;

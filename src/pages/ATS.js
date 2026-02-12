import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, Target, Award, Zap, FileCheck2, Briefcase, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const ATS = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [existingResume, setExistingResume] = useState(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const isLoggedIn = user && user.signedIn;
  const [isPersonalResume, setIsPersonalResume] = useState(false);

  // Check if resume already exists from prediction page
  useEffect(() => {
    const parsedData = localStorage.getItem('parsedResumeData');
    if (parsedData) {
      try {
        const data = JSON.parse(parsedData);
        setExistingResume(data);
      } catch (error) {
        console.error('Error parsing existing resume data:', error);
      }
    }
  }, []);

  // Auto-check "This is my personal resume" if user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      setIsPersonalResume(true);
    }
  }, [isLoggedIn]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      const validTypes = ['pdf', 'docx', 'doc', 'txt'];
      
      if (validTypes.includes(fileType)) {
        setFile(selectedFile);
      } else {
        alert('Please upload a valid file (PDF, DOCX, DOC, or TXT)');
      }
    }
  };

  const handleSubmit = async () => {
    // If existing resume is available, go directly to ATS score
    if (existingResume && !file) {
      // Store job description if provided
      if (jobDescription.trim()) {
        localStorage.setItem('jobDescription', jobDescription.trim());
      } else {
        localStorage.removeItem('jobDescription');
      }
      // Store personal resume flag
      localStorage.setItem('isPersonalResume', isPersonalResume ? 'true' : 'false');
      navigate('/ats-score');
      return;
    }

    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setParsing(true);
    setParseProgress(0);
    
    // Simulate parsing progress
    const progressInterval = setInterval(() => {
      setParseProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    const formData = new FormData();
    formData.append('resume', file); // Match PredictionForm's field name

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/parse-resume`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      
      if (!response.ok || !payload?.success || !payload?.data) {
        const err = payload?.error || `HTTP ${response.status}`;
        clearInterval(progressInterval);
        alert('Failed to parse resume: ' + err);
        setParsing(false);
        setParseProgress(0);
        setUploading(false);
        return;
      }

      const parsedData = payload.data || {};
      console.log('Parsed resume data:', parsedData);
      
      setParseProgress(100);
      clearInterval(progressInterval);
      
      // Brief delay to show 100% completion
      setTimeout(() => {
        // Store parsed data for ATS score calculation
        localStorage.setItem('parsedResumeData', JSON.stringify(parsedData));
        
        // Store job description if provided
        if (jobDescription.trim()) {
          localStorage.setItem('jobDescription', jobDescription.trim());
        } else {
          localStorage.removeItem('jobDescription');
        }
        
        // Store personal resume flag
        localStorage.setItem('isPersonalResume', isPersonalResume ? 'true' : 'false');
        
        navigate('/ats-score');
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume. Backend not reachable or parsing error.');
      setParsing(false);
      setParseProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'ATS Compatibility',
      description: 'Check how well your resume performs with Applicant Tracking Systems'
    },
    {
      icon: CheckCircle,
      title: 'Instant Analysis',
      description: 'Get detailed feedback on formatting, keywords, and structure'
    },
    {
      icon: TrendingUp,
      title: 'Score Improvement',
      description: 'Receive actionable tips to boost your ATS score'
    },
    {
      icon: Award,
      title: 'Expert Insights',
      description: 'AI-powered recommendations based on industry standards'
    }
  ];

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} py-12 px-4 sm:px-6 lg:px-8 relative`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${themeClasses.gradient} rounded-2xl shadow-glow mb-6`}>
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl md:text-5xl font-extrabold ${themeClasses.textPrimary} mb-4`}>
            ATS Resume Checker
          </h1>
          <p className={`text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
            Optimize your resume for Applicant Tracking Systems and increase your chances of landing interviews
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl dark:shadow-soft p-8 border ${themeClasses.cardBorder}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center`}>
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Upload Your Resume</h2>
            </div>

            {/* Existing Resume Notice */}
            {existingResume && !file && (
              <div className={`mb-6 p-4 ${themeClasses.sectionBackground} border-2 ${themeClasses.cardBorder} rounded-xl`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <FileCheck2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${themeClasses.textPrimary} mb-1`}>
                      Resume Already Uploaded!
                    </h3>
                    <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                      We found your resume from the Placement Prediction form. You can proceed directly to check your ATS score.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/ats-score')}
                        className={`px-4 py-2 ${themeClasses.buttonPrimary} rounded-lg font-medium text-sm transition-colors`}
                      >
                        Check ATS Score Now
                      </button>
                      <button
                        onClick={() => setExistingResume(null)}
                        className={`px-4 py-2 ${themeClasses.buttonSecondary} border ${themeClasses.cardBorder} rounded-lg font-medium text-sm transition-colors`}
                      >
                        Upload New Resume
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Drag & Drop Area - Only show if no existing resume or user wants to upload new */}
            {(!existingResume || file) && (
              <>
            {/* Parsing Progress Overlay */}
            {parsing && (
              <div className={`mb-6 p-6 ${themeClasses.sectionBackground} border-2 ${themeClasses.cardBorder} rounded-xl`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${themeClasses.accent} rounded-full flex items-center justify-center`}>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <div>
                        <h3 className={`font-semibold ${themeClasses.textPrimary}`}>
                          Parsing Your Resume...
                        </h3>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          {parseProgress < 30 ? 'Extracting text content...' :
                           parseProgress < 60 ? 'Analyzing structure and sections...' :
                           parseProgress < 90 ? 'Processing skills and experience...' :
                           'Finalizing analysis...'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-2xl font-bold ${themeClasses.accent}`}>{parseProgress}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3 overflow-hidden`}>
                    <div
                      className={`h-full ${themeClasses.gradient} rounded-full transition-all duration-300 ease-out`}
                      style={{ width: `${parseProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className={`text-xs ${themeClasses.accent} text-center`}>
                    Please wait while we analyze your resume...
                  </p>
                </div>
              </div>
            )}
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                parsing
                  ? 'opacity-50 pointer-events-none'
                  : dragActive
                  ? `${themeClasses.cardBorder} ${themeClasses.sectionBackground}`
                  : file
                  ? `${themeClasses.cardBorder} ${themeClasses.sectionBackground}`
                  : `${themeClasses.cardBorder} ${themeClasses.hover}`
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="resume-upload"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <label htmlFor="resume-upload" className="cursor-pointer block">
                {file ? (
                  <div className="space-y-4">
                    <div className={`w-16 h-16 ${themeClasses.sectionBackground} rounded-full flex items-center justify-center mx-auto`}>
                      <CheckCircle className={`w-8 h-8 ${themeClasses.accent}`} />
                    </div>
                    <div>
                      <p className={`text-lg font-semibold ${themeClasses.textPrimary} mb-1`}>
                        {file.name}
                      </p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                      className={`text-sm ${themeClasses.accent} font-medium ${themeClasses.hover}`}
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`w-16 h-16 ${themeClasses.sectionBackground} rounded-full flex items-center justify-center mx-auto`}>
                      <Upload className={`w-8 h-8 ${themeClasses.accent}`} />
                    </div>
                    <div>
                      <p className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>
                        Drop your resume here or click to browse
                      </p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        Supported formats: PDF, DOCX, DOC, TXT (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={(!file && !existingResume) || uploading}
              className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                (!file && !existingResume) || uploading
                  ? `${themeClasses.buttonSecondary} cursor-not-allowed opacity-50`
                  : `${themeClasses.buttonPrimary} shadow-glow hover:shadow-xl transform hover:scale-105`
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {existingResume && !file ? 'Check ATS Score' : 'Upload & Check ATS Score'}
                </>
              )}
            </button>

            {/* Personal Resume Toggle - Only show when user is logged in */}
            {isLoggedIn && (
              <div className={`mt-4 p-4 ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-xl`}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isPersonalResume}
                    onChange={(e) => setIsPersonalResume(e.target.checked)}
                    className={`mt-1 w-5 h-5 ${themeClasses.accent} ${themeClasses.cardBackground} border ${themeClasses.cardBorder} rounded focus:ring-2 cursor-not-allowed`}
                    disabled={true}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${themeClasses.accent}`} />
                      <span className={`font-semibold ${themeClasses.textPrimary}`}>This is my personal resume</span>
                    </div>
                    <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                      ✓ Score will be saved to your dashboard and overwrite any previous score
                    </p>
                  </div>
                </label>
              </div>
            )}
            </>
            )}

            {/* Job Description Field (Optional) */}
            <div className={`mt-6 pt-6 border-t ${themeClasses.cardBorder}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center`}>
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>Job Description</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Optional - Paste for tailored analysis</p>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to get personalized keyword recommendations and see how well your resume matches the specific role..."
                  className={`w-full h-32 px-4 py-3 text-sm ${themeClasses.textPrimary} ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-xl focus:ring-2 focus:ring-offset-0 resize-none transition-all duration-200`}
                  disabled={parsing}
                />
                {jobDescription && (
                  <button
                    onClick={() => setJobDescription('')}
                    className={`absolute top-2 right-2 ${themeClasses.textSecondary} text-xs font-medium px-2 py-1 rounded-md ${themeClasses.cardBackground} border ${themeClasses.cardBorder} ${themeClasses.hover}`}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {jobDescription && (
                <div className={`mt-2 flex items-center gap-2 text-sm ${themeClasses.accent}`}>
                  <CheckCircle className="w-4 h-4" />
                  <span>Job description added - You'll get tailored keyword matching!</span>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl dark:shadow-soft p-8 border ${themeClasses.cardBorder}`}>
              <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-6`}>Why Check Your ATS Score?</h2>
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className={`flex items-start gap-4 p-4 rounded-xl ${themeClasses.sectionBackground} ${themeClasses.hover} transition-all duration-300`}>
                      <div className={`w-10 h-10 ${themeClasses.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`font-semibold ${themeClasses.textPrimary} mb-1`}>{feature.title}</h3>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info Card */}
            <div className={`${themeClasses.gradient} rounded-2xl shadow-glow p-6 text-white`}>
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Did you know?</h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Over 75% of resumes are rejected by ATS before reaching human recruiters. 
                    Our AI-powered checker helps you optimize your resume to pass these automated systems 
                    and increase your interview chances by up to 40%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl dark:shadow-soft p-8 border ${themeClasses.cardBorder}`}>
          <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-8 text-center`}>How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Upload Resume', desc: 'Upload your resume in PDF, DOCX, or DOC format' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI analyzes keywords, format, and ATS compatibility' },
              { step: '3', title: 'Get Results', desc: 'Receive detailed score and improvement recommendations' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${themeClasses.gradient} rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-glow`}>
                  {item.step}
                </div>
                <h3 className={`font-bold ${themeClasses.textPrimary} mb-2`}>{item.title}</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATS;

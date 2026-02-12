import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const navItems = [
  { id: 'home', label: 'Home', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>
  )},
  { id: 'resume', label: 'Resume Analysis', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M9 8h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
  )},
  { id: 'roadmap', label: 'Roadmap', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M5 11h14M5 19h14M5 11a2 2 0 002-2h10a2 2 0 002 2M5 19a2 2 0 002-2h10a2 2 0 002 2"/></svg>
  )},
  { id: 'courses', label: 'Courses', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 19.5A2.5 2.5 0 006.5 22h11a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0017.5 4h-11A2.5 2.5 0 004 6.5v13z"/></svg>
  )},
  { id: 'projects', label: 'Projects', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.4 15A7.49 7.49 0 0112 19a7.49 7.49 0 01-7.4-4"/></svg>
  )},
  { id: 'performance', label: 'Performance', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3v18M5 13l-2 2 2 2m14-4l2 2-2 2M7 7l-2-2 2-2m10 4l2-2-2-2"/></svg>
  )},
  { id: 'roadmap2', label: 'Roadmap 2', icon: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  )}
];

const Avatar = ({ name }) => {
  const initials = (name || 'S T').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  return (
    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
      {initials}
    </div>
  );
};

// Dashboard-embedded Time Selection Component
const DashboardTimeSelection = () => {
  const [selectedTime, setSelectedTime] = useState('');
  const [hoveredOption, setHoveredOption] = useState(null);

  const timeOptions = [
    { 
      value: '3months', 
      label: '3 months or less', 
      description: 'Intensive crash course - Focus on most critical skills',
      icon: '⚡',
      color: 'from-red-400 to-red-600',
      intensity: 'High Intensity'
    },
    { 
      value: '6months', 
      label: '6 months', 
      description: 'Balanced approach - Core skills + some projects',
      icon: '⚖️',
      color: 'from-orange-400 to-orange-600',
      intensity: 'Moderate Intensity'
    },
    { 
      value: '1year', 
      label: '1 year', 
      description: 'Comprehensive learning - Solid foundation + projects',
      icon: '🎯',
      color: 'from-blue-400 to-blue-600',
      intensity: 'Steady Progress'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">How much time do you have for preparation?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Tell us your available timeframe and we'll create a personalized roadmap that fits your schedule and maximizes your success.
        </p>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        {timeOptions.map((option, index) => (
          <div
            key={option.value}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedTime === option.value
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : hoveredOption === option.value
                ? 'border-blue-300 bg-blue-25 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setSelectedTime(option.value)}
            onMouseEnter={() => setHoveredOption(option.value)}
            onMouseLeave={() => setHoveredOption(null)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-2xl`}>
                {option.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{option.label}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    option.intensity === 'High Intensity' ? 'bg-red-100 text-red-700' :
                    option.intensity === 'Moderate Intensity' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {option.intensity}
                  </span>
                </div>
                <p className="text-gray-600">{option.description}</p>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedTime === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedTime === option.value && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTime && (
        <div className="text-center mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-800 font-medium">
              Selected: {timeOptions.find(opt => opt.value === selectedTime)?.label}
            </p>
            <p className="text-green-600 text-sm mt-1">
              Your personalized roadmap is ready below!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard-embedded Roadmap Component
const DashboardRoadmap = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Career Roadmap</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Based on your preparation timeline, here's your customized learning path to achieve your career goals.
        </p>
      </div>

      {/* Estimated Duration and Key Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-900">Estimated Duration</h3>
          </div>
          <p className="text-2xl font-bold text-green-700 mb-2">3 months - Intensive preparation</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-purple-900">Key Skills (8)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Python', 'SQL', 'Excel', 'Tableau'].map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">+4 more</span>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">1</span>
          </div>
          <h3 className="text-2xl font-bold">Week 1-4: Core Essentials</h3>
        </div>
        <p className="text-blue-100 mb-6">Focus on absolute must-have skills for interviews</p>
        
        {/* Python Core Topics */}
        <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Python - Core Topics</h4>
            </div>
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">High Priority</span>
          </div>
          <p className="text-blue-100 mb-3">5 topics to master</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm text-blue-100">Variables & Data Types</span>
            </div>
            <div className="flex items-center gap-2">  
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm text-blue-100">Functions & Parameters</span>
            </div>
          </div>
        </div>

        {/* SQL Core Topics */}
        <div className="bg-white bg-opacity-10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">SQL - Core Topics</h4>
            </div>
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">High Priority</span>
          </div>
          <p className="text-blue-100 mb-3">5 topics to master</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm text-blue-100">SELECT Statements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm text-blue-100">JOINs (INNER, LEFT, RIGHT)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Progress = ({ label, value, color = 'blue' }) => (
  <div>
    <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-semibold text-gray-900">{value}%</span></div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-2 rounded-full bg-${color}-500`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Tag = ({ children, tone='blue' }) => (
  <span className={`px-2 py-0.5 text-xs rounded-full bg-${tone}-100 text-${tone}-700`}>{children}</span>
);

const Dashboard = () => {
  const [active, setActive] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roadmap, setRoadmap] = useState(() => {
    const saved = localStorage.getItem('dashboard.roadmap');
    try {
      return saved ? JSON.parse(saved) : {
        y1: [ {t:'Learn programming fundamentals', done:false}, {t:'Build 2 mini projects', done:false} ],
        y2: [ {t:'Data structures & algorithms basics', done:false}, {t:'Start internship search', done:false} ],
        y3: [ {t:'Contribute to open-source', done:false}, {t:'Advanced domain course', done:false} ],
        y4: [ {t:'Mock interviews & resume polish', done:false}, {t:'Apply to 20+ roles', done:false} ]
      };
    } catch (e) {
      console.error('Error parsing dashboard.roadmap:', e);
      return {
        y1: [ {t:'Learn programming fundamentals', done:false}, {t:'Build 2 mini projects', done:false} ],
        y2: [ {t:'Data structures & algorithms basics', done:false}, {t:'Start internship search', done:false} ],
        y3: [ {t:'Contribute to open-source', done:false}, {t:'Advanced domain course', done:false} ],
        y4: [ {t:'Mock interviews & resume polish', done:false}, {t:'Apply to 20+ roles', done:false} ]
      };
    }
  });

  // Check authentication status
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    setIsAuthenticated(!!userData);
  }, []);

  useEffect(() => { localStorage.setItem('dashboard.roadmap', JSON.stringify(roadmap)); }, [roadmap]);

  // Personalization from localStorage
  const { name, domain, atsScore, missingSkills, linkedResume } = useMemo(() => {
    let n = 'Student';
    let d = 'Your Domain';
    let s = 72; // default readiness/ATS
    let m = 3;  // default missing skills
    let linkedResumeData = null;
    
    try {
      // Check for linked resume data first
      const linkedRaw = localStorage.getItem('linkedResumeData');
      if (linkedRaw) {
        linkedResumeData = JSON.parse(linkedRaw);
        if (linkedResumeData.name) n = linkedResumeData.name;
        if (linkedResumeData.email) n = `${linkedResumeData.name} (${linkedResumeData.email})`;
      }
      
      // Check user data
      const userRaw = localStorage.getItem('userData');
      if (userRaw && !linkedResumeData) {
        const userData = JSON.parse(userRaw);
        if (userData.name) n = userData.name;
      }
      
      const raw = localStorage.getItem('predictionFormData');
      if (raw) {
        const fd = JSON.parse(raw);
        if (fd.name && !linkedResumeData) n = fd.name;
        if (fd.customDomain || fd.selectedDomainId) d = fd.customDomain || fd.selectedDomainId;
      }
      const apiRaw = localStorage.getItem('predictionApiResult');
      if (apiRaw) {
        const api = JSON.parse(apiRaw);
        const score = api?.placementScore ?? api?.placement_score ?? api?.data?.placementScore ?? null;
        if (typeof score === 'number') s = Math.max(0, Math.min(100, Math.round(score)));
        const ms = api?.missingSkills || api?.data?.missingSkills;
        if (Array.isArray(ms)) m = ms.length;
      }
    } catch {}
    return { name: n, domain: d, atsScore: s, missingSkills: m, linkedResume: linkedResumeData };
  }, []);

  const readiness = atsScore; // alias for display

  const courses = [
    { title:'Data Structures & Algorithms', platform:'Coursera', free:false, img:'https://source.unsplash.com/featured/320x180?code', tags:['DSA','Coding','Interview'] },
    { title:'React for Beginners', platform:'Udemy', free:false, img:'https://source.unsplash.com/featured/320x180?react', tags:['Frontend','JS'] },
    { title:'Machine Learning Basics', platform:'NPTEL', free:true, img:'https://source.unsplash.com/featured/320x180?machine-learning', tags:['ML','AI'] },
    { title:'SQL Fundamentals', platform:'Coursera', free:true, img:'https://source.unsplash.com/featured/320x180?database', tags:['SQL','Data'] },
  ];

  const projectIdeas = [
    { title:'Placement Tracker App', difficulty:'Beginner', skills:['React','Firebase'] },
    { title:'ATS Resume Parser', difficulty:'Intermediate', skills:['Python','NLP'] },
    { title:'Job Recommendation Engine', difficulty:'Advanced', skills:['ML','Recommender'] },
    { title:'Portfolio Generator', difficulty:'Beginner', skills:['Next.js','Tailwind'] },
  ];

  const aiTips = [
    { type:'error', text:'Your resume is missing quantified achievements for projects.' },
    { type:'suggestion', text:'Add a summary section highlighting your top 3 skills aligned to the role.' },
    { type:'suggestion', text:'Use active verbs like “Built”, “Optimized”, “Automated” to describe work.' },
  ];

  const StatCard = ({ title, value, tone='blue' }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-3xl font-bold mt-1 text-${tone}-600`}>{value}</div>
    </div>
  );

  const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>}
    </div>
  );

  // Webhook URL for resume analysis
  const RESUME_ANALYSIS_WEBHOOK = 'https://n8n-1-2ldl.onrender.com/webhook/55197d5b-d160-43ad-a219-cd8058619fd7';

  const handleResumeAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Get user data from localStorage
      const formData = localStorage.getItem('predictionFormData');
      const apiResult = localStorage.getItem('predictionApiResult');
      
      let parsedFormData = null;
      let parsedApiResult = null;
      
      try {
        parsedFormData = formData ? JSON.parse(formData) : null;
      } catch (e) {
        console.error('Error parsing predictionFormData:', e);
      }
      
      try {
        parsedApiResult = apiResult ? JSON.parse(apiResult) : null;
      } catch (e) {
        console.error('Error parsing predictionApiResult:', e);
      }
      
      const payload = {
        action: 'resume_analysis',
        timestamp: new Date().toISOString(),
        userData: parsedFormData,
        predictionData: parsedApiResult,
        userInfo: {
          name: name,
          domain: domain,
          atsScore: atsScore,
          missingSkills: missingSkills
        }
      };

      const response = await fetch(RESUME_ANALYSIS_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setAnalysisResult({
          success: true,
          message: 'Resume analysis request sent successfully! Check your email for detailed feedback.'
        });
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Resume analysis webhook error:', error);
      setAnalysisResult({
        success: false,
        message: 'Failed to send resume analysis request. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('predictionFormData');
    localStorage.removeItem('predictionApiResult');
    localStorage.removeItem('linkedResumeData');
    localStorage.removeItem('resumeId');
    localStorage.removeItem('resumeCollection');
    localStorage.removeItem('resumeChoice');
    setIsAuthenticated(false);
  };

  const SidebarItem = ({ item }) => (
    <button onClick={() => { setActive(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active===item.id? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </button>
  );

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Lock Icon */}
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            
            {/* Content */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Your Dashboard
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access your personalized dashboard with resume analysis, career roadmap, and placement insights.
            </p>
            
            {/* Sign In Button */}
            <Link 
              to="/auth-selection" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors w-full mb-4"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign In to Continue
            </Link>
            
            {/* Register Link */}
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link 
                to="/auth-selection" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Top bar for mobile */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <div>
              <div className="text-sm text-gray-500">Welcome back</div>
              <div className="font-semibold text-gray-900">{name}</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(s=>!s)} className="p-2 rounded-md hover:bg-gray-100">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className={`col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-2 transition-all ${sidebarOpen? '' : 'md:block'} ${collapsed? 'md:w-20' : ''}`}>
          <div className="sticky top-20">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              {/* Profile */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={name} />
                {!collapsed && (
                  <div>
                    <div className="font-semibold text-gray-900 leading-tight">{name}</div>
                    <div className="text-xs text-gray-500">Aspiring {domain}</div>
                  </div>
                )}
              </div>
              {/* Collapse toggle */}
              <div className="flex justify-between items-center mb-3">
                {!collapsed && <div className="text-xs text-gray-500">Your Career Companion</div>}
                <button onClick={() => setCollapsed(c=>!c)} className="p-1.5 rounded-md hover:bg-gray-100">
                  <svg className={`h-4 w-4 ${collapsed? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
              </div>
              {/* Nav */}
              <div className="space-y-1">
                {navItems.map(item => <SidebarItem key={item.id} item={item} />)}
              </div>
              
              {/* Logout Button */}
              {!collapsed && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9 xl:col-span-10">
          {/* Home */}
          {active==='home' && (
            <div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-sm opacity-90">Welcome</div>
                    <h1 className="text-2xl md:text-3xl font-bold">{name}, your dashboard is ready</h1>
                    <p className="mt-1 text-white/90">Keep going, your placement journey is on track 🚀</p>
                  </div>
                  <div className="flex gap-3">
                    <Link to="/feedback" className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg shadow hover:shadow-md transition">Give Feedback</Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard title="ATS Score" value={`${atsScore}%`} tone="green" />
                <StatCard title="Missing Skills" value={missingSkills} tone="orange" />
                <StatCard title="Readiness" value={`${readiness}%`} tone="blue" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionHeader title="Recommended Next Steps" subtitle="Small actions to boost your profile this week" />
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3"><span className="h-2 w-2 bg-blue-500 rounded-full"></span><span>Complete 1 coding challenge on arrays and strings</span></li>
                    <li className="flex items-center gap-3"><span className="h-2 w-2 bg-green-500 rounded-full"></span><span>Refactor your top project README with clear bullet points</span></li>
                    <li className="flex items-center gap-3"><span className="h-2 w-2 bg-orange-500 rounded-full"></span><span>Add 2 quantifiable achievements to your resume</span></li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <SectionHeader title="Weekly Progress" />
                  <div className="space-y-3">
                    <Progress label="Skills mastered" value={Math.min(100, Math.round(atsScore*0.8))} />
                    <Progress label="Courses completed" value={30} color="green" />
                    <Progress label="Projects completed" value={45} color="orange" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resume Analysis */}
          {active==='resume' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <SectionHeader title="Resume Analysis & Feedback" subtitle="AI suggestions to improve your resume" />
              
              {/* Linked Resume Information */}
              {linkedResume && (
                <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-1">Linked Resume Found</h3>
                      <p className="text-blue-700 text-sm mb-2">Your resume has been successfully linked to your profile!</p>
                      <div className="space-y-1 text-sm">
                        {linkedResume.name && <p><span className="font-medium">Name:</span> {linkedResume.name}</p>}
                        {linkedResume.email && <p><span className="font-medium">Email:</span> {linkedResume.email}</p>}
                        {linkedResume.mobile && <p><span className="font-medium">Mobile:</span> {linkedResume.mobile}</p>}
                        {linkedResume.skills && linkedResume.skills.length > 0 && (
                          <p><span className="font-medium">Skills:</span> {linkedResume.skills.slice(0, 5).join(', ')}{linkedResume.skills.length > 5 ? '...' : ''}</p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Resume Linked
                        </span>
                        <span className="text-blue-500">Ready for analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Analysis Action Button */}
              <div className="mb-6">
                <button
                  onClick={handleResumeAnalysis}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {isAnalyzing && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/>
                      <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75"/>
                    </svg>
                  )}
                  {isAnalyzing ? 'Analyzing Resume...' : 'Start AI Resume Analysis'}
                </button>
              </div>

              {/* Analysis Result Message */}
              {analysisResult && (
                <div className={`mb-6 p-4 rounded-lg border ${analysisResult.success ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
                  <div className="flex items-start gap-2">
                    {analysisResult.success ? (
                      <svg className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className="text-sm">{analysisResult.message}</p>
                  </div>
                </div>
              )}

              {/* Current AI Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiTips.map((t,i) => (
                  <div key={i} className={`p-4 rounded-xl border ${t.type==='error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'} hover:shadow-sm transition`}>
                    <div className="flex items-start gap-3">
                      {t.type==='error' ? (
                        <span className="h-2.5 w-2.5 mt-1 rounded-full bg-red-500"></span>
                      ) : (
                        <span className="h-2.5 w-2.5 mt-1 rounded-full bg-green-500"></span>
                      )}
                      <p className="text-sm text-gray-800">{t.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap */}
          {active==='roadmap' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <SectionHeader title="Personalized Roadmap" subtitle="Track key milestones semester by semester" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(roadmap).map(([year, tasks]) => (
                  <div key={year} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <h3 className="font-semibold text-gray-900">{year.toUpperCase()}</h3>
                    </div>
                    <ul className="space-y-2">
                      {tasks.map((it, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <input type="checkbox" checked={it.done} onChange={() => {
                            const copy = { ...roadmap };
                            copy[year] = copy[year].map((t,i2)=> i2===idx? {...t, done:!t.done} : t);
                            setRoadmap(copy);
                          }} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className={`${it.done? 'line-through text-gray-400' : 'text-gray-800'}`}>{it.t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {active==='courses' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="h-36 bg-gray-100 overflow-hidden">
                      <img src={c.img} alt="Course" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{c.title}</h3>
                        <Tag tone={c.free? 'green' : 'orange'}>{c.free? 'Free' : 'Paid'}</Tag>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{c.platform}</span>
                        {c.tags.map((t,idx)=>(<span key={idx} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t}</span>))}
                      </div>
                      <button className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">View Course</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {active==='projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectIdeas.map((p,i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <Tag tone={p.difficulty==='Advanced'? 'red' : p.difficulty==='Intermediate'? 'orange' : 'green'}>{p.difficulty}</Tag>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.skills.map((s, idx)=>(<span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">{s}</span>))}
                  </div>
                  <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">View Details</button>
                </div>
              ))}
            </div>
          )}

          {/* Performance */}
          {active==='performance' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <SectionHeader title="Performance Overview" subtitle="Track your growth over time" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Progress label="Skills mastered" value={Math.min(100, Math.round(atsScore*0.85))} />
                  <Progress label="Courses completed" value={34} color="green" />
                  <Progress label="Projects completed" value={48} color="orange" />
                </div>
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-2">Growth (last 6 months)</div>
                  <div className="flex items-end gap-1 h-32">
                    {[30,45,50,60,72,readiness].map((v,i)=>(
                      <div key={i} className="flex-1 bg-blue-100 rounded-t" style={{height:`${v}%`}}>
                        <div className="w-full h-full bg-blue-500 rounded-t" style={{height:'100%'}}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roadmap 2 */}
          {active==='roadmap2' && (
            <div className="space-y-6">
              <SectionHeader title="Roadmap 2" subtitle="Plan your career preparation journey" />
              
              {/* Time Selection Component */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <DashboardTimeSelection />
              </div>
              
              {/* Roadmap Component */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <DashboardRoadmap />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

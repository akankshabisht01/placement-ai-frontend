import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const PlacementCellLogin = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [showLanding, setShowLanding] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    college: ''
  });
  const [collegeSearchResults, setCollegeSearchResults] = useState([]);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);

  // Check if user is already logged in on component mount
  useEffect(() => {
    // Check for placement cell admin login
    const storedAuth = localStorage.getItem('placementCellAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData && authData.email) {
          // Placement cell admin is already logged in, redirect to dashboard
          navigate('/placement-cell/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('placementCellAuth');
      }
    }
    
    // Check for linked student login
    const storedStudentProfile = localStorage.getItem('linkedStudentProfile');
    if (storedStudentProfile) {
      try {
        const studentData = JSON.parse(storedStudentProfile);
        if (studentData && studentData.sessionToken) {
          // Student is already logged in, redirect to student dashboard
          navigate('/student/dashboard', { replace: true });
          return;
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('linkedStudentProfile');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Search colleges for autocomplete
  const searchColleges = async (query) => {
    if (query.length < 2) {
      setCollegeSearchResults([]);
      setShowCollegeSuggestions(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/colleges/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setCollegeSearchResults(data.colleges);
        setShowCollegeSuggestions(data.colleges.length > 0);
      }
    } catch (err) {
      console.error('Error searching colleges:', err);
    }
  };

  // Handle college input change
  const handleCollegeInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, college: value });
    setError('');
    searchColleges(value);
  };

  // Handle college selection from dropdown
  const handleSelectCollege = (collegeName) => {
    setFormData({ ...formData, college: collegeName });
    setShowCollegeSuggestions(false);
    setCollegeSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/placement-test/auth/login' : '/api/placement-test/auth/register';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          // Store session
          localStorage.setItem('placementCellAuth', JSON.stringify(data.user));
          navigate('/placement-cell/dashboard');
        } else {
          // Switch to login after successful registration
          setIsLogin(true);
          setFormData({ email: formData.email, password: '', name: '', college: '' });
          alert('Registration successful! Please login.');
        }
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Landing Page with two options
  if (showLanding) {
    return (
      <div className={`min-h-screen pt-16 flex items-center justify-center p-4 ${themeClasses.pageBackground}`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl w-full max-w-lg p-8 border ${themeClasses.border}`}>
          <div className="text-center mb-8">
            <div className={`${themeClasses.gradient} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>Placement Cell Portal</h1>
            <p className={`${themeClasses.textSecondary} mt-2`}>
              Select your role to continue
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {/* Placement Cell Admin Option */}
            <button
              onClick={() => setShowLanding(false)}
              className={`group p-6 rounded-xl border-2 ${themeClasses.border} hover:border-orange-500 transition-all duration-300 hover:shadow-lg ${themeClasses.cardBackground}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-1`}>Placement Cell</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Manage tests & view results</p>
              </div>
            </button>

            {/* Student Option */}
            <button
              onClick={() => navigate('/student-test')}
              className={`group p-6 rounded-xl border-2 ${themeClasses.border} hover:border-green-500 transition-all duration-300 hover:shadow-lg ${themeClasses.cardBackground}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold ${themeClasses.textPrimary} mb-1`}>Student</h3>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Take a placement test</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login/Register Form
  return (
    <div className={`min-h-screen pt-16 flex items-center justify-center p-4 ${themeClasses.pageBackground}`}>
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl w-full max-w-md p-8 border ${themeClasses.border}`}>
        {/* Back Button */}
        <button
          onClick={() => setShowLanding(true)}
          className={`mb-4 flex items-center gap-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <div className={`${themeClasses.gradient} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Placement Cell Portal</h1>
          <p className={`${themeClasses.textSecondary} mt-2`}>
            {isLogin ? 'Sign in to manage tests' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
              <div className="relative">
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>College Name</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleCollegeInputChange}
                  onFocus={() => formData.college.length >= 2 && setShowCollegeSuggestions(collegeSearchResults.length > 0)}
                  onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  placeholder="Start typing college name..."
                  autoComplete="off"
                />
                {showCollegeSuggestions && collegeSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {collegeSearchResults.map((college, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => handleSelectCollege(college.name)}
                        className="px-4 py-3 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-800">{college.name}</div>
                        <div className="text-sm text-gray-500">{college.city}, {college.state}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${themeClasses.gradient} text-white py-3 rounded-lg font-semibold hover:opacity-90 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className={`${themeClasses.gradientText} hover:opacity-80 font-medium`}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlacementCellLogin;

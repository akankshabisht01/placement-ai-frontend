import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const Admin = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [loginState, setLoginState] = useState('login'); // login, authenticating, dashboard
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  
  // Mock student data for dashboard
  const studentData = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      domain: 'CS/IT',
      skills: ['Python', 'React', 'SQL'],
      placementScore: 87,
      date: '2025-05-15'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      domain: 'CS/IT',
      skills: ['Java', 'Spring Boot', 'MySQL'],
      placementScore: 92,
      date: '2025-05-14'
    },
    {
      id: 3,
      name: 'Robert Johnson',
      email: 'robert.j@example.com',
      domain: 'Mechanical Engineering',
      skills: ['AutoCAD', 'SolidWorks', 'MATLAB'],
      placementScore: 75,
      date: '2025-05-14'
    },
    {
      id: 4,
      name: 'Emily Chen',
      email: 'emily.chen@example.com',
      domain: 'Electronics',
      skills: ['PCB Design', 'C/C++', 'Microcontrollers'],
      placementScore: 82,
      date: '2025-05-13'
    },
    {
      id: 5,
      name: 'Michael Brown',
      email: 'michael.b@example.com',
      domain: 'BBA',
      skills: ['Excel', 'Financial Analysis', 'Communication'],
      placementScore: 78,
      date: '2025-05-12'
    }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }
    
    // Simple email validation
    if (!credentials.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Simulate authentication process
    setLoginState('authenticating');
    
    // For demo, accept any valid email with password "admin123"
    setTimeout(() => {
      if (credentials.password === 'admin123') {
        setLoginState('dashboard');
      } else {
        setError('Invalid credentials. For demo, use any email with password: admin123');
        setLoginState('login');
      }
    }, 1500);
  };
  
  const handleLogout = () => {
    setLoginState('login');
    setCredentials({
      email: '',
      password: ''
    });
  };
  
  // Login Form
  if (loginState === 'login') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className={`text-3xl font-bold ${themeClasses.textPrimary} mb-4`}>Admin / Recruiter Login</h1>
          <p className={themeClasses.textSecondary}>Access the recruitment dashboard</p>
        </div>
        
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-lg border ${themeClasses.cardBorder} p-8`}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 dark:border-red-600 p-4 mb-6 rounded">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="email" className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className={`block text-sm font-medium ${themeClasses.textPrimary} mb-1`}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-tech-gray-400">
                For demo purposes, use <strong className="dark:text-tech-gray-300">admin123</strong> as the password
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full btn-primary py-3"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // Loading/Authenticating state
  if (loginState === 'authenticating') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'currentColor' }}></div>
        <h2 className={`text-xl font-medium ${themeClasses.textPrimary}`}>Authenticating...</h2>
      </div>
    );
  }
  
  // Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>Recruiter Dashboard</h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>View and manage student placement data</p>
        </div>
        <button
          onClick={handleLogout}
          className={`px-4 py-2 ${themeClasses.buttonSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors duration-200`}
        >
          Sign Out
        </button>
      </div>
      
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
          <div className={`text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Total Students</div>
          <div className={`text-3xl font-bold ${themeClasses.textPrimary}`}>{studentData.length}</div>
        </div>
        
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
          <div className={`text-sm font-medium ${themeClasses.textSecondary} mb-1`}>High Potential</div>
          <div className={`text-3xl font-bold ${themeClasses.textAccent}`}>
            {studentData.filter(s => s.placementScore >= 85).length}
          </div>
        </div>
        
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
          <div className={`text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Needs Improvement</div>
          <div className={`text-3xl font-bold ${themeClasses.textPrimary}`}>
            {studentData.filter(s => s.placementScore < 75).length}
          </div>
        </div>
        
        <div className={`${themeClasses.cardBackground} rounded-xl shadow-md border ${themeClasses.cardBorder} p-6`}>
          <div className={`text-sm font-medium ${themeClasses.textSecondary} mb-1`}>New This Week</div>
          <div className={`text-3xl font-bold ${themeClasses.textAccent}`}>
            {studentData.length}
          </div>
        </div>
      </div>
      
      {/* Student data table */}
      <div className={`${themeClasses.cardBackground} rounded-xl shadow-lg border ${themeClasses.cardBorder} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
          <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
            Student Placement Data
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-tech-gray-800">
            <thead className="bg-gray-50 dark:bg-tech-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Domain
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Skills
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-tech-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-tech-dark divide-y divide-gray-200 dark:divide-tech-gray-800">
              {studentData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-tech-gray-900 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">{student.name.charAt(0)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-amber-900 dark:text-white">{student.name}</div>
                        <div className="text-sm text-gray-500 dark:text-tech-gray-400">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {student.domain}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {student.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-tech-gray-800 text-gray-800 dark:text-tech-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      student.placementScore >= 85 ? 'text-green-600 dark:text-green-400' : 
                      student.placementScore >= 75 ? 'text-amber-600 dark:text-pink-400' : 
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {student.placementScore}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-tech-gray-400">
                    {student.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 mr-3 transition-colors duration-150">
                      View Details
                    </button>
                    <button className="text-gray-600 dark:text-tech-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150">
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-tech-gray-400">
        <p>
          This is a demo admin dashboard. No actual student data is stored or processed.
        </p>
      </div>
    </div>
  );
};

export default Admin; 

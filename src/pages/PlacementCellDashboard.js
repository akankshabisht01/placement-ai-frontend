import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const PlacementCellDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'tests'); // 'tests' | 'students'
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    testType: '',
    duration: 30,
    maxStudents: 100
  });
  const [creating, setCreating] = useState(false);
  const [processingStudent, setProcessingStudent] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const notificationRef = useRef(null);

  // Filter and sort state for students
  const [yearFilter, setYearFilter] = useState('');
  const [jobRoleFilter, setJobRoleFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Compute unique values for filter dropdowns (dynamically from actual data)
  const uniqueYears = useMemo(() => [...new Set(linkedStudents.map(s => s.year).filter(Boolean))].sort(), [linkedStudents]);
  const uniqueJobRoles = useMemo(() => [...new Set(linkedStudents.map(s => s.jobRole).filter(Boolean))].sort(), [linkedStudents]);
  const uniqueCourses = useMemo(() => [...new Set(linkedStudents.map(s => s.course).filter(Boolean))].sort(), [linkedStudents]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let result = [...linkedStudents];
    
    // Apply filters
    if (yearFilter) result = result.filter(s => s.year === yearFilter);
    if (jobRoleFilter) result = result.filter(s => s.jobRole === jobRoleFilter);
    if (courseFilter) result = result.filter(s => s.course === courseFilter);
    
    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      // Handle date sorting
      if (sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [linkedStudents, yearFilter, jobRoleFilter, courseFilter, sortBy, sortOrder]);

  // Toggle sort order or set new sort field
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-indigo-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    const auth = localStorage.getItem('placementCellAuth');
    if (!auth) {
      navigate('/placement-cell/login');
      return;
    }
    const userData = JSON.parse(auth);
    setUser(userData);
    fetchData(userData.id, userData.college);
  }, [navigate]);

  const fetchData = async (userId, collegeName) => {
    try {
      const [testsRes, typesRes, studentsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/placement-test/list?createdBy=${userId}`),
        fetch(`${API_BASE_URL}/api/placement-test/test-types`),
        fetch(`${API_BASE_URL}/api/placement-test/linked-students?college=${encodeURIComponent(collegeName || '')}`),
        fetch(`${API_BASE_URL}/api/placement-test/pending-requests?college=${encodeURIComponent(collegeName || '')}`)
      ]);
      
      const testsData = await testsRes.json();
      const typesData = await typesRes.json();
      const studentsData = await studentsRes.json();
      const requestsData = await requestsRes.json();
      
      if (testsData.success) setTests(testsData.tests);
      if (typesData.success) setTestTypes(typesData.testTypes);
      if (studentsData.success) setLinkedStudents(studentsData.students);
      if (requestsData.success) setPendingRequests(requestsData.requests);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!createForm.testType) {
      alert('Please select a test type');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          createdBy: user?.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        navigate(`/placement-cell/preview/${data.testSession._id}`);
      } else {
        alert(data.message || 'Failed to create test');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('placementCellAuth');
    navigate('/placement-cell/login');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const selectedTestType = testTypes.find(t => t.name === createForm.testType);

  const handleApproveStudent = async (mobileNumber) => {
    setProcessingStudent(mobileNumber);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });
      const data = await response.json();
      if (data.success) {
        // Refresh data
        fetchData(user?.id, user?.college);
      } else {
        alert(data.message || 'Failed to approve student');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setProcessingStudent(null);
    }
  };

  const handleRejectStudent = async (mobileNumber) => {
    const reason = window.prompt('Enter reason for rejection (optional):');
    setProcessingStudent(mobileNumber);
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, reason })
      });
      const data = await response.json();
      if (data.success) {
        // Refresh data
        fetchData(user?.id, user?.college);
      } else {
        alert(data.message || 'Failed to reject student');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setProcessingStudent(null);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-16 ${themeClasses.pageBackground} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${themeClasses.accent}`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 ${themeClasses.pageBackground}`}>
      {/* Notification animation style */}
      <style>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-5deg); }
          50%, 100% { transform: rotate(0); }
        }
        .notification-ring {
          animation: ring 2s ease-in-out infinite;
          transform-origin: top center;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
        .notification-pulse {
          animation: pulse-ring 1.5s ease-out infinite;
        }
      `}</style>

      {/* Header */}
      <header className={`${themeClasses.cardBackground} shadow-sm border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Placement Cell Dashboard</h1>
            <p className={themeClasses.textSecondary}>Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} font-medium`}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Total Tests</div>
            <div className={`text-3xl font-bold ${themeClasses.textPrimary}`}>{tests.length}</div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Active Tests</div>
            <div className="text-3xl font-bold text-green-600">
              {tests.filter(t => t.status === 'active').length}
            </div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Scheduled</div>
            <div className="text-3xl font-bold text-purple-600">
              {tests.filter(t => t.status === 'scheduled').length}
            </div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Linked Students</div>
            <div className="text-3xl font-bold text-blue-600">
              {linkedStudents.length}
            </div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border} cursor-pointer hover:shadow-md transition`} onClick={() => setShowNotifications(!showNotifications)}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Pending Requests</div>
            <div className={`text-3xl font-bold text-orange-600`}>
              {pendingRequests.length}
            </div>
          </div>
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm p-6 border ${themeClasses.border}`}>
            <div className={`${themeClasses.textSecondary} text-sm mb-1`}>Test Attempts</div>
            <div className="text-3xl font-bold text-indigo-600">
              {tests.reduce((acc, t) => acc + (t.studentsAttempted || 0), 0)}
            </div>
          </div>
        </div>

        {/* Tab Switcher with Notification */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('tests')}
              className={`pb-3 px-2 font-semibold transition-colors ${
                activeTab === 'tests'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : `${themeClasses.textSecondary} hover:text-gray-800`
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-3 px-2 font-semibold transition-colors ${
                activeTab === 'students'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : `${themeClasses.textSecondary} hover:text-gray-800`
              }`}
            >
              Linked Students ({linkedStudents.length})
            </button>
          </div>
          
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-full hover:bg-gray-100 transition ${pendingRequests.length > 0 ? 'notification-pulse' : ''}`}
            >
              <svg className={`w-6 h-6 ${pendingRequests.length > 0 ? 'text-orange-500 notification-ring' : themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-96 ${themeClasses.cardBackground} rounded-xl shadow-2xl border ${themeClasses.border} z-50 max-h-96 overflow-hidden`}>
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Pending Requests</h3>
                  <span className="text-sm text-orange-600 font-medium">{pendingRequests.length} pending</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {pendingRequests.length === 0 ? (
                    <div className="p-6 text-center">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className={themeClasses.textSecondary}>No pending requests</p>
                    </div>
                  ) : (
                    pendingRequests.map((student, index) => (
                      <div key={student.mobileNumber || index} className={`border-b ${themeClasses.border}`}>
                        {/* Collapsed View - Name Only */}
                        <div 
                          className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition`}
                          onClick={() => setExpandedRequest(expandedRequest === student.mobileNumber ? null : student.mobileNumber)}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 transition-transform ${expandedRequest === student.mobileNumber ? 'rotate-90' : ''} ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <p className={`font-medium ${themeClasses.textPrimary}`}>{student.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApproveStudent(student.mobileNumber); }}
                              disabled={processingStudent === student.mobileNumber}
                              className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"
                              title="Approve"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRejectStudent(student.mobileNumber); }}
                              disabled={processingStudent === student.mobileNumber}
                              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Expanded View - Details */}
                        {expandedRequest === student.mobileNumber && (
                          <div className="px-4 pb-4 pt-0 ml-6 bg-gray-50 rounded-b-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className={themeClasses.textSecondary}>Roll Number:</span>
                                <span className={`ml-2 font-medium ${themeClasses.textPrimary}`}>{student.rollNumber}</span>
                              </div>
                              <div>
                                <span className={themeClasses.textSecondary}>Course:</span>
                                <span className={`ml-2 font-medium ${themeClasses.textPrimary}`}>{student.course}</span>
                              </div>
                              <div>
                                <span className={themeClasses.textSecondary}>Year:</span>
                                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{student.year}</span>
                              </div>
                              <div>
                                <span className={themeClasses.textSecondary}>Mobile:</span>
                                <span className={`ml-2 font-medium ${themeClasses.textPrimary}`}>{student.mobileNumber}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'tests' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>All Tests</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`${themeClasses.gradient} text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Test
              </button>
            </div>

            {/* Tests Table */}
            <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm overflow-hidden border ${themeClasses.border}`}>
              {tests.length === 0 ? (
                <div className="text-center py-12">
                  <svg className={`w-16 h-16 ${themeClasses.textSecondary} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={themeClasses.textSecondary}>No tests created yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`mt-4 ${themeClasses.gradientText} font-medium`}
                  >
                    Create your first test
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className={themeClasses.sectionAlt}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Test Type</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Duration</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Questions</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Students</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Status</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Test Code</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${themeClasses.border}`}>
                {tests.map((test) => (
                  <tr key={test._id} className={`${themeClasses.hover} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${themeClasses.textPrimary}`}>{test.testType}</div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                      {test.status === 'scheduled' && test.scheduledFor && (
                        <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Scheduled: {new Date(test.scheduledFor).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}
                    </td>
                    <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{test.durationMinutes} mins</td>
                    <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{test.questionCount || test.totalQuestions}</td>
                    <td className="px-6 py-4">
                      <span className={themeClasses.textPrimary}>{test.studentsAttempted || 0}</span>
                      <span className={themeClasses.textSecondary}>/{test.maxStudents}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(test.status)}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {test.testCode ? (
                        <code className={`${themeClasses.sectionAlt} px-2 py-1 rounded text-sm font-mono ${themeClasses.textPrimary}`}>
                          {test.testCode}
                        </code>
                      ) : (
                        <span className={themeClasses.textSecondary}>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {test.status === 'draft' && (
                          <button
                            onClick={() => navigate(`/placement-cell/preview/${test._id}`)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            Preview
                          </button>
                        )}
                        {test.status === 'scheduled' && (
                          <button
                            onClick={() => navigate(`/placement-cell/results/${test._id}`)}
                            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                          >
                            View
                          </button>
                        )}
                        {(test.status === 'active' || test.status === 'closed') && (
                          <button
                            onClick={() => navigate(`/placement-cell/results/${test._id}`)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            Results
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Students Tab */
          <div className={`${themeClasses.cardBackground} rounded-xl shadow-sm overflow-hidden border ${themeClasses.border}`}>
            {linkedStudents.length === 0 ? (
              <div className="text-center py-12">
                <svg className={`w-16 h-16 ${themeClasses.textSecondary} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className={themeClasses.textSecondary}>No students have linked their profile yet</p>
                <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>Share your college name with students to get started</p>
              </div>
            ) : (
              <>
                {/* Filter Row */}
                <div className={`px-6 py-4 border-b ${themeClasses.border} ${themeClasses.sectionAlt}`}>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>Year:</label>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className={`px-3 py-1.5 border ${themeClasses.border} rounded-lg text-sm ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:ring-2 focus:ring-indigo-500`}
                      >
                        <option value="">All</option>
                        {uniqueYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>Job Role:</label>
                      <select
                        value={jobRoleFilter}
                        onChange={(e) => setJobRoleFilter(e.target.value)}
                        className={`px-3 py-1.5 border ${themeClasses.border} rounded-lg text-sm ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:ring-2 focus:ring-indigo-500`}
                      >
                        <option value="">All</option>
                        {uniqueJobRoles.map(role => (
                          <option key={role} value={role}>
                            {role.split('_').map(word => {
                              const acronyms = { 'uiux': 'UI/UX', 'ios': 'iOS', 'ml': 'ML', 'ai': 'AI', 'devops': 'DevOps' };
                              const lower = word.toLowerCase();
                              return acronyms[lower] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            }).join(' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>Course:</label>
                      <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className={`px-3 py-1.5 border ${themeClasses.border} rounded-lg text-sm ${themeClasses.inputBackground} ${themeClasses.textPrimary} focus:ring-2 focus:ring-indigo-500`}
                      >
                        <option value="">All</option>
                        {uniqueCourses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                    </div>
                    {(yearFilter || jobRoleFilter || courseFilter) && (
                      <button
                        onClick={() => { setYearFilter(''); setJobRoleFilter(''); setCourseFilter(''); }}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                    <span className={`text-sm ${themeClasses.textSecondary} ml-auto`}>
                      Showing {filteredStudents.length} of {linkedStudents.length} students
                    </span>
                  </div>
                </div>
                
              <table className="w-full">
                <thead className={themeClasses.sectionAlt}>
                  <tr>
                    <th 
                      onClick={() => handleSort('name')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Name <SortIndicator field="name" />
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Mobile</th>
                    <th 
                      onClick={() => handleSort('rollNumber')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Roll Number <SortIndicator field="rollNumber" />
                    </th>
                    <th 
                      onClick={() => handleSort('year')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Year <SortIndicator field="year" />
                    </th>
                    <th 
                      onClick={() => handleSort('course')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Course <SortIndicator field="course" />
                    </th>
                    <th 
                      onClick={() => handleSort('jobRole')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Job Role <SortIndicator field="jobRole" />
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary} cursor-pointer hover:text-indigo-600 transition select-none`}
                    >
                      Linked On <SortIndicator field="createdAt" />
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${themeClasses.textSecondary}`}>Progress</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${themeClasses.border}`}>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.mobileNumber || index} className={`${themeClasses.hover} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${themeClasses.textPrimary}`}>{student.name}</div>
                      </td>
                      <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{student.mobileNumber}</code>
                      </td>
                      <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{student.rollNumber}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {student.year}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>{student.course}</td>
                      <td className="px-6 py-4">
                        {student.jobRole ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {student.jobRole.split('_').map(word => {
                              const acronyms = {
                                'uiux': 'UI/UX', 'ios': 'iOS', 'ml': 'ML', 'ai': 'AI', 'bi': 'BI',
                                'nlp': 'NLP', 'sre': 'SRE', 'soc': 'SOC', 'qa': 'QA', 'ar': 'AR',
                                'vr': 'VR', 'erp': 'ERP', 'crm': 'CRM', 'dapp': 'dApp', 'nft': 'NFT',
                                'iot': 'IoT', 'api': 'API', 'devops': 'DevOps', 'mlops': 'MLOps'
                              };
                              const lower = word.toLowerCase();
                              return acronyms[lower] || word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                            }).join(' ')}
                          </span>
                        ) : (
                          <span className={themeClasses.textSecondary}>-</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 ${themeClasses.textSecondary}`}>
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/placement-cell/student-progress/${encodeURIComponent(student.mobileNumber)}`)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}
      </main>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.cardBackground} rounded-2xl max-w-lg w-full p-6 border ${themeClasses.border}`}>
            <h2 className={`text-xl font-bold ${themeClasses.textPrimary} mb-6`}>Create New Test</h2>
            
            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>Test Type</label>
                <select
                  value={createForm.testType}
                  onChange={(e) => {
                    const selectedType = testTypes.find(t => t.name === e.target.value);
                    setCreateForm({ 
                      ...createForm, 
                      testType: e.target.value,
                      duration: selectedType?.standardDuration || 30
                    });
                  }}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                >
                  <option value="">Select test type</option>
                  {testTypes.map((type) => (
                    <option key={type._id} value={type.name}>{type.name}</option>
                  ))}
                </select>
                {selectedTestType && (
                  <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>{selectedTestType.description}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>Duration</label>
                {selectedTestType?.standardDuration ? (
                  <div className={`px-4 py-3 border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-lg font-medium flex items-center justify-between`}>
                    <span>{selectedTestType.standardDuration} minutes</span>
                    <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Standard</span>
                  </div>
                ) : (
                <div className="flex gap-3">
                  {[30, 45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, duration: dur })}
                      className={`flex-1 py-3 rounded-lg border-2 font-medium transition ${
                        createForm.duration === dur
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : `${themeClasses.border} ${themeClasses.textSecondary} hover:border-gray-300`
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={createForm.maxStudents}
                  onChange={(e) => setCreateForm({ ...createForm, maxStudents: parseInt(e.target.value) || 100 })}
                  className={`w-full px-4 py-3 border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 ${themeClasses.inputBackground} ${themeClasses.textPrimary}`}
                  min="1"
                  max="10000"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 px-4 py-3 border ${themeClasses.border} rounded-lg ${themeClasses.textPrimary} font-medium hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                disabled={creating || !createForm.testType}
                className={`flex-1 px-4 py-3 ${themeClasses.gradient} text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50`}
              >
                {creating ? 'Generating...' : 'Generate Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementCellDashboard;

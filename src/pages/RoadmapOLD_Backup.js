import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Roadmap = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const navigate = useNavigate();

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const mobile = userData.mobile;

  useEffect(() => {
    if (!mobile) {
      navigate('/signin');
      return;
    }
    fetchAllRoadmaps();
  }, [mobile, navigate]);

  const fetchAllRoadmaps = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/get-all-roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();
      
      if (data.success) {
        setRoadmaps(data.data.roadmapsByDomain);
        setError('');
      } else {
        setError(data.message || 'No roadmaps found');
        setRoadmaps([]);
      }
    } catch (err) {
      setError('Failed to fetch roadmaps');
      console.error('Error fetching roadmaps:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRoadmaps = () => {
    if (selectedDomain === 'all') {
      return roadmaps;
    }
    return { [selectedDomain]: roadmaps[selectedDomain] || [] };
  };

  const getAllDomains = () => {
    return Object.keys(roadmaps);
  };

  const getSkillGapPercentage = (roadmap) => {
    // For Roadmap_Dashboard data structure
    if (roadmap.identified_gaps) {
      const gapsCount = roadmap.identified_gaps.length;
      // If there are gaps, we're just starting (0-20%)
      return gapsCount > 0 ? 15 : 100;
    }
    
    // Fallback for old structure
    const total = roadmap.jobRoleSkills?.skillsCount + (roadmap.learningPath?.skillGaps?.length || 0);
    const acquired = roadmap.jobRoleSkills?.skillsCount || 0;
    return total > 0 ? Math.round((acquired / total) * 100) : 0;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Career Roadmaps</h1>
                <p className="text-gray-600">Track your skills and learning progress for different job roles</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard?section=roadmap')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Roadmaps Found</h3>
            <p className="text-gray-600 mb-6">
              Start by selecting job role skills to create your first learning roadmap.
            </p>
            <button
              onClick={() => navigate('/prediction')}
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Skills Assessment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filter by Domain</h2>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Domains</option>
                  {getAllDomains().map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roadmaps Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(getFilteredRoadmaps()).map(([domain, domainRoadmaps]) => 
                domainRoadmaps.map((roadmap, index) => {
                  const progressPercentage = getSkillGapPercentage(roadmap);
                  const progressColor = getProgressColor(progressPercentage);
                  
                  return (
                    <div key={`${domain}-${index}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0712 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{roadmap.jobRole}</h3>
                            <p className="text-sm text-gray-600">{roadmap.jobDomain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{progressPercentage}%</div>
                          <div className="text-xs text-gray-500">Complete</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Skills Progress</span>
                          <span className="text-sm text-gray-500">
                            {roadmap.jobRoleSkills.skillsCount} of {roadmap.jobRoleSkills.skillsCount + (roadmap.learningPath.skillGaps?.length || 0)} skills
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${progressColor} h-2 rounded-full transition-all duration-300`} style={{width: `${progressPercentage}%`}}></div>
                        </div>
                      </div>

                      {/* Current Skills */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills You Have</h4>
                        <div className="flex flex-wrap gap-2">
                          {roadmap.jobRoleSkills.selectedSkills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                            >
                              <svg className="w-3 h-3 mr-1.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skill Gaps */}
                      {roadmap.learningPath.skillGaps && roadmap.learningPath.skillGaps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Skills to Learn</h4>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.learningPath.skillGaps.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                              >
                                <svg className="w-3 h-3 mr-1.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Courses */}
                      {roadmap.learningPath.courseSuggestions && roadmap.learningPath.courseSuggestions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Courses</h4>
                          <div className="space-y-2">
                            {roadmap.learningPath.courseSuggestions.map((course, courseIndex) => (
                              <div key={courseIndex} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-sm text-blue-900">{course}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {roadmap.learningPath.timelineWeeks && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">
                              Estimated timeline: {roadmap.learningPath.timelineWeeks} weeks
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Updated {new Date(roadmap.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roadmap;

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
      console.log('Roadmaps API response:', data);
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="bg-white shadow-sm border-b border-amber-200/50">
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
                <p className="text-gray-600">Your personalized learning journey</p>
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
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-amber-200/50">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Roadmaps Found</h3>
            <p className="text-gray-600 mb-6">
              Start by completing a placement prediction to get your personalized career roadmap.
            </p>
            <button
              onClick={() => navigate('/prediction')}
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Prediction
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Section */}
            {getAllDomains().length > 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-200/50">
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
            )}

            {/* Roadmaps Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(getFilteredRoadmaps()).map(([domain, domainRoadmaps]) => 
                domainRoadmaps.map((roadmap, index) => {
                  return (
                    <div key={`${domain}-${index}`} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-200/50 hover:shadow-md transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{roadmap.role || 'Career Path'}</h3>
                            <p className="text-sm text-gray-600">{domain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-purple-600">{roadmap.duration || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>

                      {/* Introduction */}
                      {roadmap.introduction && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-gray-700 leading-relaxed">{roadmap.introduction}</p>
                        </div>
                      )}

                      {/* Identified Gaps */}
                      {roadmap.identified_gaps && roadmap.identified_gaps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Skill Gaps to Address
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.identified_gaps.map((gap, gapIndex) => (
                              <span
                                key={gapIndex}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                              >
                                {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Month 1 Plan */}
                      {roadmap.month_1 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-purple-600">1</span>
                            </div>
                            Month 1 Plan
                          </h4>
                          <div className="pl-8 space-y-3">
                            {roadmap.month_1.goal && (
                              <div>
                                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Goal</span>
                                <p className="text-sm text-gray-800 mt-1">{roadmap.month_1.goal}</p>
                              </div>
                            )}
                            {roadmap.month_1.topics && roadmap.month_1.topics.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Topics to Cover</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {roadmap.month_1.topics.map((topic, topicIndex) => (
                                    <span key={topicIndex} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {roadmap.month_1.practice && (
                              <div>
                                <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Practice</span>
                                <p className="text-sm text-gray-800 mt-1">{roadmap.month_1.practice}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Month 2 Plan */}
                      {roadmap.month_2 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-pink-600">2</span>
                            </div>
                            Month 2 Plan
                          </h4>
                          <div className="pl-8 space-y-3">
                            {roadmap.month_2.goal && (
                              <div>
                                <span className="text-xs font-medium text-pink-600 uppercase tracking-wide">Goal</span>
                                <p className="text-sm text-gray-800 mt-1">{roadmap.month_2.goal}</p>
                              </div>
                            )}
                            {roadmap.month_2.topics && roadmap.month_2.topics.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-pink-600 uppercase tracking-wide">Topics to Cover</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {roadmap.month_2.topics.map((topic, topicIndex) => (
                                    <span key={topicIndex} className="text-xs px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full border border-pink-200">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {roadmap.month_2.practice && (
                              <div>
                                <span className="text-xs font-medium text-pink-600 uppercase tracking-wide">Practice</span>
                                <p className="text-sm text-gray-800 mt-1">{roadmap.month_2.practice}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Next Steps */}
                      {roadmap.next_steps && roadmap.next_steps.length > 0 && (
                        <div className="mb-4 pt-4 border-t border-amber-200/50">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Next Steps
                          </h4>
                          <ul className="space-y-2 pl-6">
                            {roadmap.next_steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-sm text-gray-700 list-disc leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="flex items-center justify-between pt-4 border-t border-amber-200/50">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                          {roadmap.category || 'Career Roadmap'}
                        </span>
                      </div>
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

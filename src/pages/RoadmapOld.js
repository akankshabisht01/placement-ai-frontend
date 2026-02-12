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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/get-all-roadmaps`, {
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
    const total = roadmap.jobRoleSkills.skillsCount + (roadmap.learningPath.skillGaps?.length || 0);
    const acquired = roadmap.jobRoleSkills.skillsCount;
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
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
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    >
      <div className={`bg-white rounded-xl border-2 ${config.borderColor} hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
        {/* Skill Header */}
        <div 
          className={`bg-gradient-to-r ${config.bgGradient} text-white p-4 cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl mr-3">{config.icon}</div>
              <div>
                <h4 className="text-lg font-bold">{task.title}</h4>
                <p className="text-white/80 text-sm">{task.topics.length} topics to master</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-xs rounded-full border ${config.badgeStyle} font-semibold`}>
                {config.label}
              </span>
              <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Topics Grid - Expandable */}
        <div className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-20 opacity-60'
        } overflow-hidden`}>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {task.topics.map((topic, topicIndex) => (
                <div 
                  key={topicIndex} 
                  className="group/topic bg-amber-50 dark:bg-[#2d1f3d] hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 rounded-lg p-3 transition-all duration-300 hover:shadow-md transform hover:scale-105"
                  style={{
                    animation: isExpanded ? `slideInLeft 0.3s ease-out ${topicIndex * 0.05}s both` : 'none'
                  }}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${config.iconBg} mr-3 flex-shrink-0 group-hover/topic:animate-pulse`}></div>
                    <span className="text-gray-700 text-sm font-medium group-hover/topic:text-blue-700 transition-colors duration-200">
                      {topic}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {!isExpanded && (
              <div className="mt-2 text-center">
                <span className="text-gray-400 text-xs">Click to expand and see all topics</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Roadmap = () => {
  const [searchParams] = useSearchParams();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillsExpanded, setSkillsExpanded] = useState(false);

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: .5;
        }
      }
      
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const domainId = searchParams.get('domain');
  const roleId = searchParams.get('role');
  const timeframe = searchParams.get('timeframe');

  useEffect(() => {
    const generateRoadmap = () => {
      try {
        // Check if timeframe is provided, if not redirect to time selection
        if (!timeframe) {
          window.location.href = `/time-selection?domain=${domainId || ''}&role=${roleId || ''}`;
          return;
        }
        
        // Generate automated roadmap based on domain, role, and timeframe parameters
        const roadmap = generateAutomatedRoadmap(domainId, roleId, timeframe);
        console.log('Generated roadmap:', roadmap); // Debug log
        setRoadmapData(roadmap);
        setLoading(false);
      } catch (error) {
        console.error('Error generating roadmap:', error);
        setRoadmapData({
          error: true,
          message: "An error occurred while generating your roadmap. Please try again."
        });
        setLoading(false);
      }
    };

    generateRoadmap();
  }, [domainId, roleId, timeframe]);

  const getTimeframeDuration = (timeframe) => {
    const durations = {
      '3months': '3 months - Intensive preparation',
      '6months': '6 months - Balanced learning approach',
      '1year': '1 year - Comprehensive skill development',
      '2years': '2+ years - Complete mastery and specialization'
    };
    return durations[timeframe] || '6-8 months for job readiness';
  };

  const getDetailedTopics = (skill) => {
    const topicMappings = {
      'Python': {
        high: ['Variables & Data Types', 'Functions & Parameters', 'Control Structures (if/else, loops)', 'Lists & Dictionaries', 'File Handling'],
        medium: ['Object-Oriented Programming', 'Exception Handling', 'Modules & Packages', 'Lambda Functions', 'List Comprehensions'],
        low: ['Decorators', 'Generators', 'Context Managers', 'Metaclasses', 'Async/Await Programming']
      },
      'JavaScript': {
        high: ['Variables (let, const, var)', 'Functions & Arrow Functions', 'DOM Manipulation', 'Event Handling', 'Arrays & Objects'],
        medium: ['ES6+ Features', 'Promises & Async/Await', 'Closures', 'Prototypes', 'JSON Handling'],
        low: ['Design Patterns', 'Web APIs', 'Service Workers', 'Module Systems', 'Advanced Array Methods']
      },
      'Java': {
        high: ['Basic Syntax', 'OOP Concepts', 'Collections Framework', 'Exception Handling', 'String Manipulation'],
        medium: ['Multithreading', 'File I/O', 'Streams API', 'Lambda Expressions', 'Annotations'],
        low: ['Reflection', 'JVM Internals', 'Design Patterns', 'Concurrency Utilities', 'Memory Management']
      },
      'React.js': {
        high: ['Components & JSX', 'Props & State', 'Event Handling', 'Hooks (useState, useEffect)', 'Conditional Rendering'],
        medium: ['Custom Hooks', 'Context API', 'React Router', 'Form Handling', 'Component Lifecycle'],
        low: ['Performance Optimization', 'Error Boundaries', 'Portals', 'Refs & DOM Access', 'Testing with Jest']
      },
      'Node.js': {
        high: ['Basic Setup', 'NPM & Package Management', 'File System Operations', 'HTTP Modules', 'Express.js Basics'],
        medium: ['Middleware', 'Routing', 'Database Integration', 'Authentication', 'Error Handling'],
        low: ['Microservices', 'Performance Tuning', 'Cluster Module', 'Stream Processing', 'Security Best Practices']
      },
      'SQL': {
        high: ['SELECT Statements', 'JOINs (INNER, LEFT, RIGHT)', 'WHERE Clauses', 'GROUP BY & HAVING', 'ORDER BY'],
        medium: ['Subqueries', 'Stored Procedures', 'Indexes', 'Views', 'Transactions'],
        low: ['Query Optimization', 'Database Design', 'Triggers', 'Window Functions', 'Advanced Analytics']
      },
      'Git': {
        high: ['Basic Commands (add, commit, push)', 'Branching & Merging', 'Remote Repositories', 'Pull Requests', 'Status & History'],
        medium: ['Rebase & Squash', 'Stashing', 'Tagging', 'Branch Strategies', 'Conflict Resolution'],
        low: ['Git Hooks', 'Advanced Workflows', 'Git Internals', 'Custom Commands', 'Repository Management']
      },
      'HTML5': {
        high: ['Basic Structure', 'Forms & Input Types', 'Semantic Elements', 'Links & Navigation', 'Images & Media'],
        medium: ['Canvas API', 'Local Storage', 'Geolocation', 'Web Workers', 'Drag & Drop'],
        low: ['Progressive Web Apps', 'Service Workers', 'Web Components', 'Accessibility (ARIA)', 'Performance Optimization']
      },
      'CSS3': {
        high: ['Selectors & Properties', 'Box Model', 'Flexbox', 'Grid Layout', 'Responsive Design'],
        medium: ['Animations & Transitions', 'Transforms', 'Media Queries', 'Pseudo-classes', 'Custom Properties'],
        low: ['CSS Architecture', 'Preprocessors (Sass)', 'CSS-in-JS', 'Performance Optimization', 'Advanced Selectors']
      },
      'Machine Learning': {
        high: ['Supervised Learning', 'Data Preprocessing', 'Linear Regression', 'Classification', 'Model Evaluation'],
        medium: ['Unsupervised Learning', 'Feature Engineering', 'Cross-validation', 'Ensemble Methods', 'Neural Networks'],
        low: ['Deep Learning', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'MLOps']
      },
      'AWS': {
        high: ['EC2 Instances', 'S3 Storage', 'IAM & Security', 'VPC Basics', 'Lambda Functions'],
        medium: ['RDS & DynamoDB', 'CloudFormation', 'API Gateway', 'CloudWatch', 'Load Balancers'],
        low: ['EKS & Containers', 'Data Pipeline', 'ML Services', 'DevOps Integration', 'Cost Optimization']
      },
      'Docker': {
        high: ['Containers Basics', 'Images & Dockerfile', 'Container Management', 'Volumes', 'Networks'],
        medium: ['Docker Compose', 'Multi-stage Builds', 'Registry Management', 'Health Checks', 'Environment Variables'],
        low: ['Orchestration', 'Security Scanning', 'Production Deployment', 'Performance Tuning', 'Kubernetes Integration']
      },
      'MongoDB': {
        high: ['Documents & Collections', 'CRUD Operations', 'Query Language', 'Indexes', 'Data Modeling'],
        medium: ['Aggregation Pipeline', 'Replication', 'Sharding', 'Transactions', 'Performance Tuning'],
        low: ['Advanced Aggregation', 'Time Series', 'Full-text Search', 'GridFS', 'Atlas Cloud Features']
      },
      'Excel': {
        high: ['Formulas & Functions', 'Pivot Tables', 'Data Sorting & Filtering', 'Charts & Graphs', 'Conditional Formatting'],
        medium: ['VLOOKUP & XLOOKUP', 'Data Validation', 'Macros & VBA', 'Power Query', 'Advanced Formulas'],
        low: ['Power Pivot', 'Dashboard Creation', 'Data Analysis ToolPak', 'Advanced Charting', 'Integration with Other Tools']
      },
      'Tableau': {
        high: ['Data Connections', 'Basic Visualizations', 'Filters & Parameters', 'Calculated Fields', 'Dashboard Basics'],
        medium: ['Advanced Charts', 'Table Calculations', 'Sets & Groups', 'Dashboard Actions', 'Story Points'],
        low: ['Advanced Analytics', 'Custom SQL', 'Performance Optimization', 'Server Administration', 'API Integration']
      },
      'Power BI': {
        high: ['Data Import & Modeling', 'Basic Visualizations', 'DAX Basics', 'Filters & Slicers', 'Report Creation'],
        medium: ['Advanced DAX', 'Data Relationships', 'Custom Visuals', 'Row-level Security', 'Power Query'],
        low: ['Advanced Analytics', 'Embedded Analytics', 'REST APIs', 'Gateway Configuration', 'Performance Tuning']
      }
    };

    return topicMappings[skill] || {
      high: [`Learn ${skill} basics`, `Practice ${skill} concepts`, `Build projects with ${skill}`],
      medium: [`Intermediate ${skill} topics`, `Advanced ${skill} features`, `${skill} best practices`],
      low: [`Expert ${skill} techniques`, `${skill} optimization`, `${skill} architecture patterns`]
    };
  };

  const generateTimeBasedPhases = (skills, timeframe) => {
    const coreSkills = skills.slice(0, 3);
    const allSkills = skills.slice(0, 6);
    const advancedSkills = skills.slice(0, 8);

    const generateDetailedTasks = (skillList, priority = 'high', includeTopics = true) => {
      if (!includeTopics) {
        return skillList.map(skill => `Master ${skill} fundamentals`);
      }
      
      const tasks = [];
      skillList.forEach(skill => {
        const topics = getDetailedTopics(skill);
        const priorityTopics = topics[priority] || topics.high || [];
        
        // Ensure we have valid topics array
        if (priorityTopics && Array.isArray(priorityTopics) && priorityTopics.length > 0) {
          tasks.push({
            skill: skill,
            title: `${skill} - ${priority === 'high' ? 'Core Topics' : priority === 'medium' ? 'Intermediate Topics' : 'Advanced Topics'}`,
            topics: priorityTopics,
            priority: priority
          });
        } else {
          // Fallback if no detailed topics available
          tasks.push({
            skill: skill,
            title: `${skill} - Fundamentals`,
            topics: [`Learn ${skill} basics`, `Practice ${skill} concepts`, `Build projects with ${skill}`],
            priority: priority
          });
        }
      });
      return tasks;
    };

    switch (timeframe) {
      case '3months':
        return [
          {
            phase: 1,
            title: "Week 1-4: Core Essentials",
            description: "Focus on absolute must-have skills for interviews",
            tasks: generateDetailedTasks(coreSkills, 'high'),
            additionalTasks: [
              "Set up development environment quickly",
              "Practice 20+ coding problems daily",
              "Learn basic data structures and algorithms"
            ]
          },
          {
            phase: 2,
            title: "Week 5-8: Interview Skills",
            description: "Build interview-ready knowledge",
            tasks: generateDetailedTasks(coreSkills, 'medium'),
            additionalTasks: [
              "Complete 2 small but impressive projects",
              "Master common interview patterns and algorithms",
              "Practice system design basics",
              "Learn to explain your code clearly"
            ]
          },
          {
            phase: 3,
            title: "Week 9-12: Final Preparation",
            description: "Polish and practice intensively",
            tasks: [
              {
                skill: "Interview Preparation",
                title: "Final Interview Prep",
                topics: [
                  "Mock interviews daily",
                  "Resume optimization",
                  "Technical communication",
                  "Behavioral questions",
                  "Company research"
                ],
                priority: "high"
              }
            ],
            additionalTasks: [
              "Complete 1 portfolio project showcasing key skills",
              "Review and memorize key concepts",
              "Apply to companies and practice technical tests"
            ]
          }
        ];

      case '6months':
        return [
          {
            phase: 1,
            title: "Month 1-2: Foundation",
            description: "Build solid fundamental skills",
            tasks: generateDetailedTasks(coreSkills, 'high'),
            additionalTasks: [
              "Set up professional development environment",
              "Practice basic problem-solving daily",
              "Complete 2-3 beginner projects"
            ]
          },
          {
            phase: 2,
            title: "Month 3-4: Skill Building",
            description: "Develop domain-specific expertise",
            tasks: generateDetailedTasks(allSkills.slice(0, 4), 'medium'),
            additionalTasks: [
              "Complete 3-4 intermediate projects",
              "Learn testing and debugging techniques",
              "Start contributing to open source",
              "Study industry best practices"
            ]
          },
          {
            phase: 3,
            title: "Month 5-6: Interview Preparation",
            description: "Focus on placement readiness",
            tasks: generateDetailedTasks(coreSkills, 'low').concat([
              {
                skill: "Professional Skills",
                title: "Career Preparation",
                topics: [
                  "Portfolio development",
                  "Technical interviews",
                  "System design basics",
                  "Communication skills",
                  "Industry networking"
                ],
                priority: "high"
              }
            ]),
            additionalTasks: [
              "Build 2-3 showcase projects",
              "Practice mock interviews weekly",
              "Apply to target companies",
              "Optimize LinkedIn and resume"
            ]
          }
        ];

      case '1year':
        return [
          {
            phase: 1,
            title: "Month 1-3: Strong Foundation",
            description: "Master core programming and domain concepts",
            tasks: generateDetailedTasks(coreSkills, 'high'),
            additionalTasks: [
              "Set up comprehensive development environment",
              "Practice coding daily (1-2 hours)",
              "Complete 5-6 foundational projects",
              "Join coding communities and forums"
            ]
          },
          {
            phase: 2,
            title: "Month 4-6: Skill Expansion",
            description: "Broaden your technical expertise",
            tasks: generateDetailedTasks(allSkills, 'medium'),
            additionalTasks: [
              "Complete 4-5 intermediate projects",
              "Learn testing frameworks and best practices",
              "Contribute to 2-3 open source projects",
              "Start a technical blog or documentation"
            ]
          },
          {
            phase: 3,
            title: "Month 7-9: Advanced Concepts",
            description: "Dive deep into advanced topics and specialization",
            tasks: generateDetailedTasks(advancedSkills, 'low'),
            additionalTasks: [
              "Build 2-3 complex, production-ready projects",
              "Learn system design and architecture patterns",
              "Practice advanced problem-solving",
              "Mentor beginners or teach concepts"
            ]
          },
          {
            phase: 4,
            title: "Month 10-12: Career Preparation",
            description: "Focus on job readiness and professional development",
            tasks: [
              {
                skill: "Professional Development",
                title: "Career Readiness",
                topics: [
                  "Portfolio optimization",
                  "Advanced interviewing",
                  "Salary negotiation",
                  "Professional networking",
                  "Industry trends research"
                ],
                priority: "high"
              }
            ],
            additionalTasks: [
              "Build impressive portfolio website",
              "Complete 10+ technical interviews",
              "Apply to target companies strategically",
              "Obtain relevant certifications"
            ]
          }
        ];

      case '2years':
        return [
          {
            phase: 1,
            title: "Month 1-6: Comprehensive Foundation",
            description: "Build rock-solid fundamentals across all core areas",
            tasks: generateDetailedTasks(coreSkills, 'high'),
            additionalTasks: [
              "Master development environment and tools",
              "Practice coding 2+ hours daily consistently",
              "Complete 10+ foundational projects",
              "Establish strong learning habits and routine"
            ]
          },
          {
            phase: 2,
            title: "Month 7-12: Broad Skill Development",
            description: "Expand knowledge across multiple technologies and domains",
            tasks: generateDetailedTasks(allSkills, 'medium'),
            additionalTasks: [
              "Complete 8+ intermediate projects",
              "Master testing, debugging, and code quality",
              "Contribute significantly to open source",
              "Build technical writing and communication skills"
            ]
          },
          {
            phase: 3,
            title: "Month 13-18: Specialization & Mastery",
            description: "Develop deep expertise in chosen specialization",
            tasks: generateDetailedTasks(advancedSkills, 'low'),
            additionalTasks: [
              "Build 5+ complex, industry-standard projects",
              "Master system design and architecture",
              "Lead projects or mentor other developers",
              "Speak at meetups or write technical articles"
            ]
          },
          {
            phase: 4,
            title: "Month 19-24: Industry Leadership",
            description: "Establish yourself as an expert and prepare for senior roles",
            tasks: [
              {
                skill: "Leadership & Expertise",
                title: "Industry Leadership",
                topics: [
                  "Technical leadership",
                  "Project management",
                  "Team collaboration",
                  "Innovation and research",
                  "Industry contribution"
                ],
                priority: "high"
              }
            ],
            additionalTasks: [
              "Build comprehensive portfolio of work",
              "Establish professional brand and reputation",
              "Target senior-level positions",
              "Contribute to technical community significantly"
            ]
          }
        ];

      default:
        return [
          {
            phase: 1,
            title: "Foundation Phase",
            description: "Build strong fundamentals",
            tasks: generateDetailedTasks(coreSkills, 'high'),
            additionalTasks: [
              "Set up development environment",
              "Practice basic concepts daily",
              "Complete beginner projects"
            ]
          }
        ];
    }
  };

  const generateAutomatedRoadmap = (domainId, roleId, timeframe) => {
    // Automated roadmap generation based on domain, role IDs, and available timeframe
    const roleMapping = {
      // Software Development roles
      'frontend_developer': {
        name: 'Frontend Developer',
        description: 'Specializes in user interface and user experience development',
        domain: 'Web Development',
        skills: ['HTML5', 'CSS3', 'JavaScript', 'React.js', 'Vue.js', 'Bootstrap', 'Git', 'Responsive Design']
      },
      'backend_developer': {
        name: 'Backend Developer',
        description: 'Focuses on server-side development and database management',
        domain: 'Web Development',
        skills: ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'REST API', 'Git', 'Authentication']
      },
      'fullstack_developer': {
        name: 'Full-Stack Developer',
        description: 'Handles both frontend and backend development',
        domain: 'Web Development',
        skills: ['React.js', 'Node.js', 'JavaScript', 'SQL', 'MongoDB', 'REST API', 'Git', 'Docker']
      },
      'mobile_developer': {
        name: 'Mobile App Developer',
        description: 'Develops applications for mobile platforms',
        domain: 'Mobile Development',
        skills: ['React Native', 'Flutter', 'Java', 'Swift', 'Kotlin', 'Firebase', 'Git', 'UI/UX Design']
      },
      // Data Science roles
      'data_analyst': {
        name: 'Data Analyst',
        description: 'Analyzes data and provides actionable insights for business decisions',
        domain: 'Data & Analytics',
        skills: ['Python', 'SQL', 'Excel', 'Tableau', 'Power BI', 'Statistics', 'Data Visualization', 'Pandas']
      },
      'data_scientist': {
        name: 'Data Scientist',
        description: 'Uses statistical analysis and machine learning to extract insights from data',
        domain: 'Data Science',
        skills: ['Python', 'R', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics', 'Data Mining', 'Pandas']
      },
      'data_engineer': {
        name: 'Data Engineer',
        description: 'Builds and maintains data infrastructure and pipelines',
        domain: 'Data Engineering',
        skills: ['Python', 'SQL', 'Apache Spark', 'Kafka', 'Docker', 'AWS', 'Data Modeling', 'ETL']
      },
      'ml_engineer': {
        name: 'Machine Learning Engineer',
        description: 'Designs and implements machine learning systems in production',
        domain: 'AI & Machine Learning',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Docker', 'AWS', 'MLOps', 'Statistics', 'Git']
      },
      // Other tech roles
      'devops_engineer': {
        name: 'DevOps Engineer',
        description: 'Manages development operations and infrastructure automation',
        domain: 'DevOps & Infrastructure',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Git', 'Linux', 'Terraform', 'Monitoring']
      },
      'cloud_engineer': {
        name: 'Cloud Engineer',
        description: 'Specializes in cloud infrastructure and services',
        domain: 'Cloud Computing',
        skills: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Networking', 'Security', 'Monitoring']
      },
      'cybersecurity_analyst': {
        name: 'Cybersecurity Analyst',
        description: 'Protects systems and data from cyber threats',
        domain: 'Cybersecurity',
        skills: ['Network Security', 'Ethical Hacking', 'SIEM Tools', 'Risk Assessment', 'Compliance', 'Forensics', 'Python', 'Linux']
      },
      'qa_engineer': {
        name: 'QA Engineer',
        description: 'Ensures software quality through testing and automation',
        domain: 'Quality Assurance',
        skills: ['Test Automation', 'Selenium', 'Java', 'Python', 'API Testing', 'Performance Testing', 'Git', 'Agile']
      },
      'product_manager': {
        name: 'Product Manager',
        description: 'Manages product development and strategy',
        domain: 'Product Management',
        skills: ['Product Strategy', 'User Research', 'Analytics', 'Agile', 'Wireframing', 'SQL', 'Communication', 'Leadership']
      },
      'ui_ux_designer': {
        name: 'UI/UX Designer',
        description: 'Designs user interfaces and experiences',
        domain: 'Design',
        skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing', 'HTML5', 'CSS3', 'Design Systems']
      },
      'business_analyst': {
        name: 'Business Analyst',
        description: 'Analyzes business processes and requirements',
        domain: 'Business Analysis',
        skills: ['Requirements Analysis', 'SQL', 'Excel', 'Process Modeling', 'Stakeholder Management', 'Documentation', 'Agile', 'Power BI']
      }
    };

    // Domain mapping for generic roles
    const domainMapping = {
      'software_development': {
        name: 'Software Developer',
        description: 'Develops software applications and systems',
        domain: 'Software Development',
        skills: ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git', 'Agile']
      },
      'data_science': {
        name: 'Data Scientist',
        description: 'Analyzes complex data to help businesses make decisions',
        domain: 'Data Science',
        skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Tableau', 'Pandas', 'NumPy']
      },
      'ai_ml': {
        name: 'AI/ML Engineer',
        description: 'Develops artificial intelligence and machine learning solutions',
        domain: 'AI/ML',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Statistics', 'Git']
      },
      'web_development': {
        name: 'Web Developer',
        description: 'Creates and maintains websites and web applications',
        domain: 'Web Development',
        skills: ['HTML5', 'CSS3', 'JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Git', 'REST API']
      },
      'mobile_development': {
        name: 'Mobile Developer',
        description: 'Develops applications for mobile devices',
        domain: 'Mobile Development',
        skills: ['React Native', 'Flutter', 'Java', 'Swift', 'Android', 'iOS', 'Firebase', 'Git']
      }
    };

    // Get role info from mapping or create default
    let roleInfo = roleMapping[roleId] || domainMapping[domainId];
    
    if (!roleInfo) {
      // Fallback for unknown roles
      roleInfo = {
        name: roleId ? roleId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Software Developer',
        description: 'Professional role in technology industry',
        domain: domainId ? domainId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Technology',
        skills: ['Programming', 'Problem Solving', 'Git', 'Communication', 'Teamwork', 'Learning', 'Project Management', 'Testing']
      };
    }

    const skills = roleInfo.skills;
    const roleName = roleInfo.name;
    const roleDescription = roleInfo.description;
    const domainName = roleInfo.domain;

    // Generate timeframe-specific roadmap
    const phases = generateTimeBasedPhases(skills, timeframe);
    const estimatedDuration = getTimeframeDuration(timeframe);

    // Generate comprehensive resources
    const resources = {
      learningPlatforms: [
        "Coursera - University courses and specializations",
        "Udemy - Practical skill-based courses", 
        "edX - Academic courses from top universities",
        "Pluralsight - Technology-focused learning",
        "freeCodeCamp - Free coding bootcamp",
        "Khan Academy - Foundation concepts"
      ],
      practiceplatforms: [
        "LeetCode - Coding interview preparation",
        "HackerRank - Programming challenges",
        "Codewars - Coding exercises and kata",
        "GeeksforGeeks - CS concepts and practice",
        "HackerEarth - Competitive programming",
        "Exercism - Code practice with mentoring"
      ],
      projectIdeas: [
        `Build a ${roleName.toLowerCase()} portfolio website`,
        "Create a personal project showcasing your skills",
        "Contribute to open source projects on GitHub",
        "Build projects using modern technologies",
        "Develop mobile or web applications",
        "Create data analysis or automation projects"
      ],
      certifications: [
        ...skills.slice(0, 3).map(skill => `${skill} Professional Certification`),
        "Industry-recognized technical certifications",
        "Cloud platform certifications (AWS, Azure, GCP)",
        "Project management certifications (if applicable)"
      ],
      books: [
        "Clean Code by Robert C. Martin",
        "The Pragmatic Programmer by Andy Hunt",
        "You Don't Know JS (book series)",
        "Introduction to Algorithms by CLRS",
        "System Design Interview by Alex Xu"
      ]
    };

    return {
      roleName,
      roleDescription,
      domainName,
      skills,
      phases,
      resources,
      estimatedDuration,
      timeframe,
      error: false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized roadmap...</p>
        </div>
      </div>
    );
  }

  if (roadmapData?.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{roadmapData.message}</p>
            <Link 
              to="/result" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Go Back to Prediction Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Add safety check for roadmapData
  if (!roadmapData || !roadmapData.phases) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Loading...</h1>
            <p className="text-gray-600 mb-6">Please wait while we generate your roadmap.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          {/* Modern Header Section */}
          <div className="text-center mb-8">
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-10 rounded-full translate-y-16 -translate-x-16"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 animate-bounce">🚀</div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Your Personalized Career Roadmap
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-blue-100">
                  {roadmapData.roleName}
                </h2>
                <p className="text-xl text-blue-50 mb-2">{roadmapData.domainName}</p>
                <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">{roadmapData.roleDescription}</p>
                
                {roadmapData.timeframe && (
                  <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full text-lg font-bold border border-white/30">
                    <span className="mr-2 text-2xl">⏰</span>
                    {roadmapData.timeframe === '3months' ? 'Intensive 3-Month Plan' : 
                     roadmapData.timeframe === '6months' ? 'Balanced 6-Month Plan' :
                     roadmapData.timeframe === '1year' ? 'Comprehensive 1-Year Plan' :
                     'Detailed 2+ Year Plan'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Duration and Skills Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-green-800">Estimated Duration</h3>
              </div>
              <p className="text-green-700 text-lg font-medium">{roadmapData.estimatedDuration}</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div 
                className="flex items-center mb-3 cursor-pointer hover:bg-purple-100 rounded-lg p-2 -m-2 transition-all duration-300"
                onClick={() => setSkillsExpanded(!skillsExpanded)}
              >
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-purple-800 flex-1">Key Skills ({(roadmapData.skills || []).length})</h3>
                <div className={`transition-transform duration-300 ${skillsExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(roadmapData.skills || [])
                  .slice(0, skillsExpanded ? (roadmapData.skills || []).length : 4)
                  .map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200 hover:bg-purple-200 transition-colors duration-200"
                    style={{
                      animation: skillsExpanded ? `fadeInUp 0.3s ease-out ${(index % 8) * 0.05}s both` : 'none'
                    }}
                  >
                    {skill}
                  </span>
                ))}
                {!skillsExpanded && (roadmapData.skills || []).length > 4 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSkillsExpanded(true);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                  >
                    +{(roadmapData.skills || []).length - 4} more
                  </button>
                )}
                {skillsExpanded && (roadmapData.skills || []).length > 4 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSkillsExpanded(false);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Phases */}
        <div className="space-y-8 mb-8">
          {(roadmapData.phases || []).map((phase, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
              }}
            >
              {/* Phase Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center font-bold text-lg mr-4 shadow-lg">
                    {phase.phase}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{phase.title}</h3>
                    <p className="text-blue-100 text-lg">{phase.description}</p>
                  </div>
                </div>
              </div>

              {/* Skills and Topics */}
              <div className="p-6">
                <div className="grid gap-6">
                  {(phase.tasks || []).map((task, taskIndex) => {
                    // Handle both string and object tasks for backward compatibility
                    if (typeof task === 'string') {
                      return (
                        <div key={taskIndex} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-300">
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-white text-xs">•</span>
                            </div>
                            <span className="text-gray-700 font-medium">{task}</span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle object tasks with detailed structure
                    if (!task || !task.topics || !Array.isArray(task.topics)) {
                      return null;
                    }
                    
                    return (
                      <SkillCard key={taskIndex} task={task} taskIndex={taskIndex} />
                    );
                  })}
                </div>

                {/* Additional Activities */}
                {phase.additionalTasks && phase.additionalTasks.length > 0 && (
                  <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border-l-4 border-blue-400">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm">+</span>
                      </span>
                      Additional Activities
                      <span className="ml-3 px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium">
                        General Tasks
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {phase.additionalTasks.map((task, taskIndex) => (
                        <div 
                          key={taskIndex} 
                          className="flex items-start bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm font-medium">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modern Resources Section */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 mb-8 border border-indigo-100">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🚀 Resources to Accelerate Your Journey
            </h3>
            <p className="text-gray-600">Curated tools and platforms to help you master your skills faster</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Learning Platforms */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-2xl">📚</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800">Learning Platforms</h4>
              </div>
              <div className="space-y-3">
                {roadmapData.resources.learningPlatforms.map((platform, index) => (
                  <div key={index} className="flex items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 text-sm font-medium">{platform}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Platforms */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-2xl">💻</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800">Practice Platforms</h4>
              </div>
              <div className="space-y-3">
                {roadmapData.resources.practiceplatforms.map((platform, index) => (
                  <div key={index} className="flex items-center p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 text-sm font-medium">{platform}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Ideas */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-purple-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-2xl">🛠️</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800">Project Ideas</h4>
              </div>
              <div className="space-y-3">
                {roadmapData.resources.projectIdeas.map((idea, index) => (
                  <div key={index} className="flex items-center p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 text-sm font-medium">{idea}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Resources Row */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🏆</span>
                </div>
                <h4 className="text-lg font-bold text-gray-800">Certifications</h4>
              </div>
              <div className="space-y-2">
                {roadmapData.resources.certifications.map((cert, index) => (
                  <div key={index} className="text-gray-700 text-sm flex items-center">
                    <span className="text-orange-500 mr-2">•</span>{cert}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">📖</span>
                </div>
                <h4 className="text-lg font-bold text-gray-800">Essential Books</h4>
              </div>
              <div className="space-y-2">
                {roadmapData.resources.books.map((book, index) => (
                  <div key={index} className="text-gray-700 text-sm flex items-center">
                    <span className="text-red-500 mr-2">•</span>{book}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h4 className="text-lg font-bold text-gray-800">Key Skills</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {roadmapData.skills.slice(0, 6).map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back to Form Link */}
        <div className="text-center">
          <Link 
            to="/result" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Prediction Results
          </Link>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <Link 
            to="/result"
            className="group bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="ml-2 font-medium hidden group-hover:block transition-all duration-300">
              Back to Results
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

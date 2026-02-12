import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingWithFacts, { LoadingFactsInline } from '../components/LoadingWithFacts';
import { useTheme } from '../contexts/ThemeContext';

const Roadmap = () => {
  const { theme } = useTheme();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [expandedMonths, setExpandedMonths] = useState({}); // Track which months are expanded
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false); // Track roadmap generation
  const [roadmapReady, setRoadmapReady] = useState(false); // Track if roadmap is ready
  const [courses, setCourses] = useState({}); // Store courses from Course collection
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [expandedCourseTopics, setExpandedCourseTopics] = useState({}); // Track which course topics are expanded
  const [completedCourses, setCompletedCourses] = useState({}); // Track completed courses
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [weeklyPlans, setWeeklyPlans] = useState({}); // Store weekly organized courses
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({}); // Track which weeks are expanded
  const [expandedTopics, setExpandedTopics] = useState({}); // Track which Topics & Course sections are expanded
  const [expandedOtherCourses, setExpandedOtherCourses] = useState({}); // Track which Other Recommended Courses are expanded
  const [unlockedWeeks, setUnlockedWeeks] = useState({ completed_weeks: [], unlocked_weeks: [1], current_week: 1 }); // Track week unlock status
  const [loadingUnlockStatus, setLoadingUnlockStatus] = useState(true);
  const navigate = useNavigate();

  // Load completed courses from localStorage on mount
  useEffect(() => {
    const savedCompletedCourses = localStorage.getItem('completedCourses');
    if (savedCompletedCourses) {
      try {
        setCompletedCourses(JSON.parse(savedCompletedCourses));
      } catch (e) {
        console.error('Error loading completed courses:', e);
      }
    }
  }, []);

  // Get user data from localStorage
  const getUserMobile = () => {
    // Try to get mobile from linkedResumeData first
    try {
      const linkedData = localStorage.getItem('linkedResumeData');
      if (linkedData) {
        const parsed = JSON.parse(linkedData);
        if (parsed.mobile) return parsed.mobile;
      }
    } catch (e) {
      console.error('Error parsing linkedResumeData:', e);
    }

    // Try to get mobile from userData
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.mobile) return parsed.mobile;
      }
    } catch (e) {
      console.error('Error parsing userData:', e);
    }

    // Try to get from predictionFormData
    try {
      const formData = localStorage.getItem('predictionFormData');
      if (formData) {
        const parsed = JSON.parse(formData);
        if (parsed.mobile) return parsed.mobile;
      }
    } catch (e) {
      console.error('Error parsing predictionFormData:', e);
    }

    return null;
  };

  const mobile = getUserMobile();

  useEffect(() => {
    console.log('🔄 Courses state changed:', Object.keys(courses).length, 'skills');
    if (Object.keys(courses).length > 0) {
      console.log('✅ Skills available:', Object.keys(courses));
    }
  }, [courses]);

  useEffect(() => {
    if (!mobile) {
      console.warn('No mobile number found in localStorage. Redirecting to signin...');
      navigate('/signin');
      return;
    }
    console.log('🔍 Using mobile number for roadmap fetch:', mobile);
    fetchAllRoadmaps();
    fetchAllCourses(); // Fetch courses from Course collection
    fetchUnlockedWeeks(); // Fetch week unlock status
  }, [mobile, navigate]);

  // Fetch unlocked weeks status
  const fetchUnlockedWeeks = async () => {
    try {
      setLoadingUnlockStatus(true);
      const mobile = getUserMobile();
      if (!mobile) {
        console.error('❌ No mobile number found');
        setLoadingUnlockStatus(false);
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/get-unlocked-weeks/${encodeURIComponent(mobile)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Unlocked weeks fetched:', data.data);
          setUnlockedWeeks(data.data);
        } else {
          console.error('❌ Failed to fetch unlocked weeks:', data.message);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching unlocked weeks:', err);
    } finally {
      setLoadingUnlockStatus(false);
    }
  };

  // Auto-fetch weekly plans in background - runs regardless of view mode
  // This preloads weekly plans so they're ready when user switches to weekly view
  // Track which months are being fetched to prevent duplicate calls
  const [fetchingMonths, setFetchingMonths] = useState({});
  const [backgroundFetchStarted, setBackgroundFetchStarted] = useState(false);

  useEffect(() => {
    // Only run once when both roadmaps and courses are loaded
    if (Object.keys(roadmaps).length > 0 && Object.keys(courses).length > 0 && !backgroundFetchStarted) {
      setBackgroundFetchStarted(true);
      
      // Background fetch for all months with a slight delay to not block initial render
      const fetchWeeklyPlansInBackground = async () => {
        console.log('🚀 Starting auto-fetch of all weekly plans on page load...');
        
        for (const domain of Object.keys(roadmaps)) {
          for (let roadmapIndex = 0; roadmapIndex < roadmaps[domain].length; roadmapIndex++) {
            const roadmap = roadmaps[domain][roadmapIndex];
            const roadmapKey = `${domain}-${roadmapIndex}`;
            
            // Check each month (up to 6)
            for (let monthNum = 1; monthNum <= 6; monthNum++) {
              const weeklyKey = `${roadmapKey}-month${monthNum}`;
              const monthData = roadmap[`month_${monthNum}`];
              
              // If this month has data, fetch it (backend will return cached if exists)
              if (monthData && monthData.raw_text) {
                console.log(`🔄 Auto-fetching weekly plan for ${domain} - Month ${monthNum}`);
                try {
                  await fetchWeeklyPlan(monthData, roadmapKey, monthNum);
                } catch (err) {
                  console.error(`❌ Auto-fetch failed for ${weeklyKey}:`, err);
                }
                // Small delay between fetches to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            }
          }
        }
        console.log('✅ Auto-fetch of all weekly plans complete!');
      };
      
      // Start background fetch immediately (no delay to ensure data ready when switching view)
      fetchWeeklyPlansInBackground();
    }
  }, [roadmaps, courses, backgroundFetchStarted]); // Don't include weeklyPlans to avoid loops

  // Additional auto-fetch for expanded months (immediate fetch when expanded)
  useEffect(() => {
    if (Object.keys(roadmaps).length > 0) {
      Object.keys(roadmaps).forEach((domain, domainIndex) => {
        roadmaps[domain].forEach((roadmap, roadmapIndex) => {
          const roadmapKey = `${domain}-${roadmapIndex}`;
          
          // Check each month
          for (let monthNum = 1; monthNum <= 6; monthNum++) {
            const monthKey = `${roadmapKey}-month${monthNum}`;
            const weeklyKey = `${roadmapKey}-month${monthNum}`;
            
            // If this month is expanded and doesn't have a weekly plan yet
            if (expandedMonths[monthKey] && !weeklyPlans[weeklyKey] && !loadingWeekly) {
              const monthData = roadmap[`month_${monthNum}`];
              if (monthData && monthData.raw_text) {
                console.log(`Auto-fetching weekly plan for ${domain} - Month ${monthNum}`);
                fetchWeeklyPlan(monthData, roadmapKey, monthNum);
                return; // Fetch one at a time to avoid overwhelming the API
              }
            }
          }
        });
      });
    }
  }, [expandedMonths, roadmaps, weeklyPlans, loadingWeekly]);

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
      console.log('Response success:', data.success);
      console.log('Response data:', data.data);
      
      if (data.success) {
        // Check if we have roadmaps data
        if (!data.data || !data.data.roadmapsByDomain) {
          console.error('❌ No roadmapsByDomain in response');
          setError('No roadmaps data found in response');
          setRoadmaps({});
          setLoading(false);
          return;
        }
        
        // Fix: Check if month_3 data is incorrectly nested in month_2
        const roadmapsByDomain = data.data.roadmapsByDomain;
        console.log('📊 Roadmaps by domain:', roadmapsByDomain);
        console.log('📊 Domain keys:', Object.keys(roadmapsByDomain));
        
        Object.keys(roadmapsByDomain).forEach(domain => {
          roadmapsByDomain[domain].forEach(roadmap => {
            
            // NEW: Check if introduction contains the entire roadmap as JSON
            if (roadmap.introduction && roadmap.introduction.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(roadmap.introduction);
                
                // If it's a full roadmap object, extract the data
                if (parsed.skills_summary || parsed._id || parsed.id) {
                  console.log('Found full roadmap JSON in introduction field, extracting...');
                  
                  // Extract role and domain
                  if (parsed.job_role && !roadmap.role) {
                    roadmap.role = parsed.job_role.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  }
                  if (parsed.domain && !roadmap.domain) {
                    roadmap.domain = parsed.domain.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  }
                  
                  // Extract duration (calculate from academic_year if available)
                  if (parsed.academic_year) {
                    // Extract semester number from academic_year like "4th Year (Semester 7)"
                    const semMatch = parsed.academic_year.match(/Semester (\d+)/i);
                    if (semMatch) {
                      const currentSem = parseInt(semMatch[1]);
                      const remainingSemesters = 8 - currentSem;
                      roadmap.duration = `${remainingSemesters * 6} months`;
                    }
                  }
                  
                  // Extract skills present and skills to learn
                  if (parsed.skills_summary) {
                    const skillsPresent = parsed.skills_summary.skills_present || [];
                    const skillsToLearn = parsed.skills_summary.skills_to_learn || [];
                    
                    // Format skills to learn with comments as identified gaps
                    roadmap.identified_gaps = skillsToLearn.map(s => {
                      if (typeof s === 'object' && s.skill) {
                        return `${s.skill}${s.comment ? ': ' + s.comment : ''}`;
                      }
                      return s.skill || s;
                    });
                  }
                  
                  // Clear the introduction so it doesn't show the raw JSON
                  roadmap.introduction = '';
                }
              } catch (e) {
                console.warn('Failed to parse introduction as JSON:', e);
              }
            }
            
            // If month_2 has a "Month 3" section in its raw_text, try to split it
            if (roadmap.month_2 && roadmap.month_2.raw_text && !roadmap.month_3) {
              const text = roadmap.month_2.raw_text;
              // Check if text contains "Month 3" or "**Month 3**"
              const month3Match = text.match(/\*\*Month 3[:\s]*\*\*[\s\S]*$/i) || text.match(/Month 3[:\s]*[\s\S]*$/i);
              
              if (month3Match) {
                // Split the text
                const month3StartIndex = month3Match.index;
                const month2Text = text.substring(0, month3StartIndex).trim();
                const month3Text = text.substring(month3StartIndex).trim();
                
                // Update month_2 with only its content
                roadmap.month_2.raw_text = month2Text;
                
                // Create month_3 with the extracted content
                roadmap.month_3 = {
                  raw_text: month3Text
                };
                
                console.log('Fixed: Split Month 3 from Month 2 for roadmap:', roadmap.role);
              }
            }
          });
        });
        
        setRoadmaps(roadmapsByDomain);
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

  const fetchAllCourses = async () => {
    try {
      setLoadingCourses(true);
      
      const mobile = getUserMobile();
      if (!mobile) {
        console.error('❌ No mobile number found in localStorage');
        setLoadingCourses(false);
        return;
      }
      
      console.log(`📱 Fetching courses for mobile: ${mobile}`);
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const apiUrl = `${backendUrl}/api/get-user-courses`;
      
      console.log(`🌐 API URL: ${apiUrl}`);
      console.log(`📤 Request body:`, JSON.stringify({ mobile }));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile })
      });
      
      console.log(`📊 Response status: ${response.status}`);
      console.log(`✅ Response ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('📚 User Courses API response:', data);
      console.log('📚 Response success:', data.success);
      console.log('📚 Courses data:', data.data);
      console.log('📚 Number of skills:', data.data?.courses ? Object.keys(data.data.courses).length : 0);
      
      if (data.success) {
        setCourses(data.data.courses);
        console.log(`✅ Loaded courses for ${data.data.total_skills} skills`);
        console.log('✅ Course skills:', Object.keys(data.data.courses));
      } else {
        console.warn(`⚠️ Failed to fetch courses: ${data.message}`);
        // Set empty courses if not found
        setCourses({});
      }
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
      setCourses({});
    } finally {
      setLoadingCourses(false);
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

  const toggleMonth = (roadmapKey, monthNumber) => {
    const key = `${roadmapKey}-month${monthNumber}`;
    setExpandedMonths(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isMonthExpanded = (roadmapKey, monthNumber) => {
    const key = `${roadmapKey}-month${monthNumber}`;
    return expandedMonths[key] || false;
  };

  const toggleWeek = (roadmapKey, monthNumber, weekNumber) => {
    const key = `${roadmapKey}-month${monthNumber}-week${weekNumber}`;
    setExpandedWeeks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isWeekExpanded = (roadmapKey, monthNumber, weekNumber) => {
    const key = `${roadmapKey}-month${monthNumber}-week${weekNumber}`;
    return expandedWeeks[key] || false;
  };

  const toggleTopics = (roadmapKey, monthNumber, weekNumber) => {
    const key = `${roadmapKey}-month${monthNumber}-week${weekNumber}-topics`;
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isTopicsExpanded = (roadmapKey, monthNumber, weekNumber) => {
    const key = `${roadmapKey}-month${monthNumber}-week${weekNumber}-topics`;
    return expandedTopics[key] !== undefined ? expandedTopics[key] : false; // Default collapsed
  };

  const toggleOtherCourses = (roadmapKey, monthNumber, weekNumber, topicIdx) => {
    const key = `${roadmapKey}-m${monthNumber}-w${weekNumber}-t${topicIdx}`;
    setExpandedOtherCourses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isOtherCoursesExpanded = (roadmapKey, monthNumber, weekNumber, topicIdx) => {
    const key = `${roadmapKey}-m${monthNumber}-w${weekNumber}-t${topicIdx}`;
    return expandedOtherCourses[key] !== undefined ? expandedOtherCourses[key] : false; // Default collapsed
  };

  const fetchWeeklyPlan = async (monthData, roadmapKey, monthNumber) => {
    const weeklyKey = `${roadmapKey}-month${monthNumber}`;
    
    // Check if already loaded
    if (weeklyPlans[weeklyKey]) {
      console.log(`💾 Weekly plan already in memory for ${weeklyKey}`);
      return weeklyPlans[weeklyKey];
    }
    
    // Check if already being fetched
    if (fetchingMonths[weeklyKey]) {
      console.log(`⏳ Already fetching ${weeklyKey}, skipping...`);
      return null;
    }

    // Mark as being fetched
    setFetchingMonths(prev => ({ ...prev, [weeklyKey]: true }));
    setLoadingWeekly(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      // Get the full month text (contains Daily Plan, Mini Project, etc.)
      const monthText = monthData.raw_text || '';
      
      // Also get courses for supplementary recommendations
      const skillFocusSections = parseSkillFocusSections(monthText);
      
      // Combine all courses from all sections
      const coursesForTopics = {};
      skillFocusSections.forEach(section => {
        if (section.courses) {
          Object.keys(section.courses).forEach(skill => {
            if (!coursesForTopics[skill]) {
              coursesForTopics[skill] = [];
            }
            // Add courses, avoiding duplicates by URL
            const existingUrls = new Set(coursesForTopics[skill].map(c => c.url));
            section.courses[skill].forEach(course => {
              if (!existingUrls.has(course.url)) {
                coursesForTopics[skill].push(course);
                existingUrls.add(course.url);
              }
            });
          });
        }
      });
      
      const topics = Object.keys(coursesForTopics);
      
      // Get mobile number for caching
      const userMobile = getUserMobile();
      
      console.log(`📅 Fetching weekly plan for Month ${monthNumber}...`);
      console.log(`   User mobile: ${userMobile}`);
      console.log(`   Sending full month text (${monthText.length} chars)`);
      console.log(`   Topics: ${topics.length}`, topics);
      console.log(`   Total courses: ${Object.values(coursesForTopics).reduce((sum, arr) => sum + arr.length, 0)}`);
      
      // Send the full month text to backend for AI to parse and organize
      const response = await fetch(`${backendUrl}/api/organize-courses-by-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: userMobile,
          month_data: {
            month_number: monthNumber,
            topics: topics,
            raw_text: monthText
          },
          all_courses: coursesForTopics
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const isCached = data.data.cached;
        console.log(`✅ Weekly plan loaded for Month ${monthNumber} ${isCached ? '(from cache)' : '(generated new)'}`);
        setWeeklyPlans(prev => ({
          ...prev,
          [weeklyKey]: data.data.weekly_plan
        }));
        return data.data.weekly_plan;
      } else {
        console.error('❌ Failed to fetch weekly plan:', data.message);
        return null;
      }
    } catch (err) {
      console.error('❌ Error fetching weekly plan:', err);
      return null;
    } finally {
      setLoadingWeekly(false);
      // Clear fetching state
      setFetchingMonths(prev => {
        const updated = { ...prev };
        delete updated[weeklyKey];
        return updated;
      });
    }
  };

  const handleViewModeToggle = async (roadmapKey, monthNumber, monthData) => {
    if (viewMode === 'week') {
      setViewMode('month');
    } else {
      setViewMode('week');
      // Fetch weekly plan if not already loaded
      await fetchWeeklyPlan(monthData, roadmapKey, monthNumber);
    }
  };

  // Extract skills mentioned in a month's text and match with available courses
  const getCoursesForMonth = (monthData) => {
    console.log('🔍 getCoursesForMonth called');
    console.log('   monthData:', monthData ? 'exists' : 'null');
    console.log('   courses keys count:', Object.keys(courses).length);
    
    if (!monthData || !monthData.raw_text || Object.keys(courses).length === 0) {
      console.log('   ⚠️ Early return:', {
        hasMonthData: !!monthData,
        hasRawText: !!monthData?.raw_text,
        coursesCount: Object.keys(courses).length
      });
      return {};
    }

    const monthText = monthData.raw_text;
    
    // Parse Skill Focus sections from the text
    const skillFocusSections = parseSkillFocusSections(monthText);
    console.log('   📋 Found Skill Focus sections:', skillFocusSections.length);
    
    return skillFocusSections;
  };

  // Helper function to render courses section
  const renderCoursesSection = (matchedCourses, themeColor, prefix) => {
    const allCourses = Object.values(matchedCourses).flat();
    const completedCount = allCourses.filter(course => isCourseCompleted(course.url)).length;
    const progressPercentage = allCourses.length > 0 ? Math.round((completedCount / allCourses.length) * 100) : 0;
    
    return (
      <div className="mt-8 mb-6 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-pink-900/30 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-amber-300 dark:border-pink-500/30 shadow-lg">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h6 className="text-xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
                📚 Recommended Courses for This Month
              </h6>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {allCourses.length} curated courses to master these topics
              </p>
            </div>
          </div>
          
          {allCourses.length > 0 && (
            <div className="text-right">
              <div className={`text-sm font-bold text-${themeColor}-700 dark:text-${themeColor}-300`}>
                {completedCount}/{allCourses.length} completed
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {progressPercentage}% progress
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {Object.entries(matchedCourses).map(([skill, skillCourses]) => {
            const topicKey = `${prefix}-${skill}`;
            return renderCuratedSkillSection(skill, skillCourses, topicKey);
          })}
        </div>
      </div>
    );
  };

  // Render curated skill section with Recommended Path and Alternatives
  const renderCuratedSkillSection = (skill, skillCourses, topicKey) => {
    const isExpanded = expandedCourseTopics[topicKey];
    const completedCoursesCount = skillCourses.filter(course => isCourseCompleted(course.url)).length;
    const isTopicCompleted = completedCoursesCount === skillCourses.length && skillCourses.length > 0;
    
    // Split courses into recommended (first 2) and alternatives (rest)
    const recommendedPath = skillCourses.slice(0, 2);
    const alternatives = skillCourses.slice(2);
    
    return (
      <div key={skill} className={`bg-white dark:bg-[#1e1a2e] rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        isTopicCompleted 
          ? 'border-green-400 dark:border-green-600' 
          : 'border-gray-200 dark:border-pink-500/20'
      }`}>
        <button
          onClick={() => toggleCourseTopic(topicKey)}
          className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
            isTopicCompleted
              ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40'
              : 'bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800/90 dark:to-slate-900/90'
          }`}
        >
          <div className="flex items-center flex-1">
            {isTopicCompleted ? (
              <div className="w-5 h-5 mr-3 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <svg className="w-5 h-5 mr-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
              </svg>
            )}
            <span className={`text-base font-bold ${
              isTopicCompleted ? 'text-green-900 dark:text-green-100' : 'text-purple-200'
            }`}>
              {skill}
            </span>
            <span className={`ml-3 text-sm px-2 py-0.5 rounded-full ${
              isTopicCompleted
                ? 'bg-green-200 text-green-800'
                : 'bg-purple-300/80 text-purple-900'
            }`}>
              {skillCourses.length} {skillCourses.length === 1 ? 'course' : 'courses'}
            </span>
          </div>
          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isTopicCompleted ? 'text-green-700' : 'text-purple-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]/50">
            {/* Recommended Learning Path */}
            {recommendedPath.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-700 dark:text-green-300">🎯 Recommended Learning Path</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Start here for best results</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {recommendedPath.map((course, courseIdx) => renderCourseCard(course, courseIdx, true))}
                </div>
              </div>
            )}
            
            {/* Alternative Options */}
            {alternatives.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-200 dark:border-pink-500/20">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300">📚 Alternative Options</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Choose based on your preference</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {alternatives.map((course, courseIdx) => renderCourseCard(course, courseIdx, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render individual course card
  const renderCourseCard = (course, courseIdx, isRecommended) => {
    const isCompleted = isCourseCompleted(course.url);
    return (
      <div key={courseIdx} className={`bg-white dark:bg-[#1e1a2e] rounded-lg p-4 border-2 transition-all ${
        isCompleted 
          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
          : isRecommended
            ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
            : 'border-gray-200 dark:border-pink-500/20 hover:border-blue-300 dark:hover:border-blue-700'
      }`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleCourseCompletion(course.url)}
            className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              {isRecommended && !isCompleted && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  ⭐ Recommended
                </span>
              )}
              <a href={course.url} target="_blank" rel="noopener noreferrer"
                className={`flex-1 font-semibold text-sm hover:underline ${
                  isCompleted ? 'text-green-700 dark:text-green-300 line-through' : 'text-gray-900 dark:text-gray-100'
                }`}>
                {course.title || 'Untitled Course'}
              </a>
            </div>
            <div className="flex gap-2 text-xs flex-wrap">
              {(course.provider || course.channel) && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-pink-900/40 dark:text-pink-300">
                  {course.provider || course.channel}
                </span>
              )}
              {course.level && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-purple-900/40 dark:text-purple-300">
                  {course.level}
                </span>
              )}
              {course.duration && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-[#2d1f3d] dark:text-gray-300">
                  ⏱️ {course.duration}
                </span>
              )}
              {course.certification && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                  🎓 {course.certification}
                </span>
              )}
            </div>
          </div>
          
          <a href={course.url} target="_blank" rel="noopener noreferrer"
            className={`p-2 rounded-lg transition-colors ${
              isRecommended 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  };

  const parseSkillFocusSections = (text) => {
    const sections = [];
    const seenCourseUrls = new Set(); // Track courses already added to avoid duplicates
    
    console.log('🔍 parseSkillFocusSections called');
    console.log('📚 Courses available:', Object.keys(courses).length, 'skills');
    console.log('📝 Skills:', Object.keys(courses).slice(0, 10));
    
    // Split by "**🎯 Skill Focus:**" or "**Skill Focus:**" pattern (with or without emoji)
    const skillFocusRegex = /\*\*(?:🎯\s*)?Skill Focus:\*\*\s*([^\n]+)/gi;
    const matches = [...text.matchAll(skillFocusRegex)];
    
    console.log('   🔎 Skill Focus matches found:', matches.length);
    
    matches.forEach((match, index) => {
      const skillsText = match[1].trim();
      const startIndex = match.index;
      const endIndex = matches[index + 1] ? matches[index + 1].index : text.length;
      const sectionText = text.substring(startIndex, endIndex).toLowerCase();
      
      console.log(`   📌 Skill Focus ${index + 1}: "${skillsText}"`);
      console.log(`      Section length: ${sectionText.length} chars`);
      
      // Match courses based on this section's content
      const matchedCourses = {};
      
      // Extract keywords from the Skill Focus line itself
      const focusKeywords = skillsText.toLowerCase()
        .split(/[,()\/\-]+/)  // Split by commas, parens, slashes, hyphens
        .map(s => s.trim())
        .filter(s => s.length > 3)
        .flatMap(phrase => phrase.split(/\s+/))  // Also split by spaces
        .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'from', 'into', 'basic', 'advanced', 'initial'].includes(w));
      
      console.log(`      🔑 Focus keywords:`, focusKeywords.slice(0, 10));
      
      Object.keys(courses).forEach(skill => {
        const skillLower = skill.toLowerCase();
        
        // Split skill into words and filter out common words
        const skillWords = skillLower
          .split(/[\s\/\-,()]+/)
          .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'data', 'from', 'basic', 'advanced'].includes(w));
        
        // Check if any significant word from skill appears in:
        // 1. Section text
        // 2. Skills text (Skill Focus line)
        // 3. Focus keywords match any skill word
        const isRelevant = skillWords.some(skillWord => {
          const regex = new RegExp(`\\b${skillWord}`, 'i');
          return regex.test(sectionText) || 
                 regex.test(skillsText) || 
                 focusKeywords.some(keyword => keyword.includes(skillWord) || skillWord.includes(keyword));
        }) || sectionText.includes(skillLower) || skillsText.toLowerCase().includes(skillLower);

        if (isRelevant && Array.isArray(courses[skill]) && courses[skill].length > 0) {
          // Filter out duplicate courses based on URL
          const uniqueCourses = courses[skill].filter(course => {
            if (seenCourseUrls.has(course.url)) {
              return false; // Skip duplicate
            }
            seenCourseUrls.add(course.url); // Mark as seen
            return true;
          });
          
          // Only add skill if it has unique courses
          if (uniqueCourses.length > 0) {
            matchedCourses[skill] = uniqueCourses;
            console.log(`      ✅ Matched skill: "${skill}" with ${uniqueCourses.length} courses`);
          }
        }
      });
      
      console.log(`      🎯 Total matched skills: ${Object.keys(matchedCourses).length}`);
      console.log(`      📚 Total unique courses so far: ${seenCourseUrls.size}`);
      
      sections.push({
        title: skillsText,
        courses: matchedCourses
      });
    });
    
    return sections;
  };

  // Toggle course topic expansion
  const toggleCourseTopic = (topicKey) => {
    setExpandedCourseTopics(prev => ({
      ...prev,
      [topicKey]: !prev[topicKey]
    }));
  };

  // Toggle course completion status
  const toggleCourseCompletion = (courseUrl) => {
    setCompletedCourses(prev => {
      const newCompleted = {
        ...prev,
        [courseUrl]: !prev[courseUrl]
      };
      // Save to localStorage
      localStorage.setItem('completedCourses', JSON.stringify(newCompleted));
      return newCompleted;
    });
  };

  // Check if course is completed
  const isCourseCompleted = (courseUrl) => {
    return completedCourses[courseUrl] || false;
  };

  // Calculate progress statistics
  const getProgressStats = () => {
    const total = Object.keys(completedCourses).length;
    const completed = Object.values(completedCourses).filter(Boolean).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // Calculate actual duration based on available months
  const calculateDuration = (roadmap) => {
    // Count how many month_X fields exist
    let monthCount = roadmap.total_months || 0;
    
    // Fallback: count manually if total_months not provided
    if (monthCount === 0) {
      monthCount = Object.keys(roadmap).filter(key => key.startsWith('month_') && roadmap[key] && Object.keys(roadmap[key]).length > 0).length;
    }
    
    if (monthCount === 0) return roadmap.duration || 'N/A';
    return `${monthCount} Month${monthCount > 1 ? 's' : ''}`;
  };

  // Get all month data from roadmap dynamically
  const getMonthsData = (roadmap) => {
    const months = [];
    let monthNum = 1;
    
    // Keep checking for month_X until we don't find any more
    while (roadmap[`month_${monthNum}`]) {
      months.push({
        number: monthNum,
        data: roadmap[`month_${monthNum}`],
        weekRange: `${(monthNum - 1) * 4 + 1}-${monthNum * 4}`
      });
      monthNum++;
    }
    
    return months;
  };

  // Color schemes for months (cycling through colors) - using full static classes
  const monthColors = [
    { name: 'purple', bgClass: 'bg-purple-500/20 dark:bg-purple-900/40', borderClass: 'border-purple-400 dark:border-purple-700', badgeClass: 'bg-purple-600 dark:bg-purple-700', textClass: 'text-purple-700 dark:text-purple-300', hoverClass: 'hover:bg-purple-500/30 dark:hover:bg-purple-900/50', contentBgClass: 'bg-purple-500/10 dark:bg-purple-900/30' },
    { name: 'pink', bgClass: 'bg-pink-500/20 dark:bg-pink-900/40', borderClass: 'border-pink-400 dark:border-pink-700', badgeClass: 'bg-pink-600 dark:bg-pink-700', textClass: 'text-pink-700 dark:text-pink-300', hoverClass: 'hover:bg-pink-500/30 dark:hover:bg-pink-900/50', contentBgClass: 'bg-pink-500/10 dark:bg-pink-900/30' },
    { name: 'indigo', bgClass: 'bg-indigo-500/20 dark:bg-indigo-900/40', borderClass: 'border-indigo-400 dark:border-indigo-700', badgeClass: 'bg-indigo-600 dark:bg-indigo-700', textClass: 'text-indigo-700 dark:text-indigo-300', hoverClass: 'hover:bg-indigo-500/30 dark:hover:bg-indigo-900/50', contentBgClass: 'bg-indigo-500/10 dark:bg-indigo-900/30' },
    { name: 'teal', bgClass: 'bg-teal-500/20 dark:bg-teal-900/40', borderClass: 'border-teal-400 dark:border-teal-700', badgeClass: 'bg-teal-600 dark:bg-teal-700', textClass: 'text-teal-700 dark:text-teal-300', hoverClass: 'hover:bg-teal-500/30 dark:hover:bg-teal-900/50', contentBgClass: 'bg-teal-500/10 dark:bg-teal-900/30' },
    { name: 'cyan', bgClass: 'bg-cyan-500/20 dark:bg-cyan-900/40', borderClass: 'border-cyan-400 dark:border-cyan-700', badgeClass: 'bg-cyan-600 dark:bg-cyan-700', textClass: 'text-cyan-700 dark:text-cyan-300', hoverClass: 'hover:bg-cyan-500/30 dark:hover:bg-cyan-900/50', contentBgClass: 'bg-cyan-500/10 dark:bg-cyan-900/30' },
    { name: 'blue', bgClass: 'bg-blue-500/20 dark:bg-blue-900/40', borderClass: 'border-blue-400 dark:border-blue-700', badgeClass: 'bg-blue-600 dark:bg-blue-700', textClass: 'text-blue-700 dark:text-blue-300', hoverClass: 'hover:bg-blue-500/30 dark:hover:bg-blue-900/50', contentBgClass: 'bg-blue-500/10 dark:bg-blue-900/30' },
    { name: 'violet', bgClass: 'bg-violet-500/20 dark:bg-violet-900/40', borderClass: 'border-violet-400 dark:border-violet-700', badgeClass: 'bg-violet-600 dark:bg-violet-700', textClass: 'text-violet-700 dark:text-violet-300', hoverClass: 'hover:bg-violet-500/30 dark:hover:bg-violet-900/50', contentBgClass: 'bg-violet-500/10 dark:bg-violet-900/30' },
    { name: 'fuchsia', bgClass: 'bg-fuchsia-500/20 dark:bg-fuchsia-900/40', borderClass: 'border-fuchsia-400 dark:border-fuchsia-700', badgeClass: 'bg-fuchsia-600 dark:bg-fuchsia-700', textClass: 'text-fuchsia-700 dark:text-fuchsia-300', hoverClass: 'hover:bg-fuchsia-500/30 dark:hover:bg-fuchsia-900/50', contentBgClass: 'bg-fuchsia-500/10 dark:bg-fuchsia-900/30' },
    { name: 'rose', bgClass: 'bg-rose-500/20 dark:bg-rose-900/40', borderClass: 'border-rose-400 dark:border-rose-700', badgeClass: 'bg-rose-600 dark:bg-rose-700', textClass: 'text-rose-700 dark:text-rose-300', hoverClass: 'hover:bg-rose-500/30 dark:hover:bg-rose-900/50', contentBgClass: 'bg-rose-500/10 dark:bg-rose-900/30' },
    { name: 'emerald', bgClass: 'bg-emerald-500/20 dark:bg-emerald-900/40', borderClass: 'border-emerald-400 dark:border-emerald-700', badgeClass: 'bg-emerald-600 dark:bg-emerald-700', textClass: 'text-emerald-700 dark:text-emerald-300', hoverClass: 'hover:bg-emerald-500/30 dark:hover:bg-emerald-900/50', contentBgClass: 'bg-emerald-500/10 dark:bg-emerald-900/30' },
    { name: 'amber', bgClass: 'bg-amber-500/20 dark:bg-amber-900/40', borderClass: 'border-amber-400 dark:border-amber-700', badgeClass: 'bg-amber-600 dark:bg-amber-700', textClass: 'text-amber-700 dark:text-amber-300', hoverClass: 'hover:bg-amber-500/30 dark:hover:bg-amber-900/50', contentBgClass: 'bg-amber-500/10 dark:bg-amber-900/30' },
    { name: 'lime', bgClass: 'bg-lime-500/20 dark:bg-lime-900/40', borderClass: 'border-lime-400 dark:border-lime-700', badgeClass: 'bg-lime-600 dark:bg-lime-700', textClass: 'text-lime-700 dark:text-lime-300', hoverClass: 'hover:bg-lime-500/30 dark:hover:bg-lime-900/50', contentBgClass: 'bg-lime-500/10 dark:bg-lime-900/30' },
  ];

  const getMonthColor = (monthNumber) => {
    return monthColors[(monthNumber - 1) % monthColors.length];
  };

  // Helper function to format markdown-like text to HTML with enhanced styling
  const formatRoadmapText = (text) => {
    if (!text) return null;
    
    // Split into lines
    let lines = text.split('\n');
    let formatted = [];
    let inList = false;
    let listItems = [];
    
    const flushList = (index) => {
      if (listItems.length > 0) {
        formatted.push(
          <ul key={`list-${index}`} className="space-y-2 mb-4">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };
    
    // Helper to parse bold text within a line
    const parseBoldText = (text) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-bold text-purple-700 dark:text-purple-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Skip empty lines but add spacing
      if (line.trim() === '') {
        flushList(i);
        formatted.push(<div key={i} className="h-3"></div>);
        continue;
      }
      
      // H3 headings (### )
      if (line.startsWith('### ')) {
        flushList(i);
        const headingText = line.replace('### ', '').trim();
        formatted.push(
          <h3 key={i} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-pink-400 dark:to-purple-400 mt-6 mb-4 pb-2 border-b-2 border-amber-200 dark:border-pink-500/30">
            {headingText}
          </h3>
        );
      }
      // H2 headings (## )
      else if (line.startsWith('## ')) {
        flushList(i);
        const headingText = line.replace('## ', '').trim();
        formatted.push(
          <h2 key={i} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-700 dark:from-pink-300 dark:to-purple-300 mt-8 mb-4 pb-3 border-b-2 border-amber-300 dark:border-pink-500/20">
            {headingText}
          </h2>
        );
      }
      // Bullet points with * or -
      else if (line.trim().match(/^[\*\-]\s+/)) {
        inList = true;
        const content = line.trim().replace(/^[\*\-]\s+/, '');
        listItems.push(
          <li key={i} className="flex items-start space-x-3 text-gray-700 dark:text-gray-300">
            <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
            <span className="flex-1 text-base leading-relaxed">
              {parseBoldText(content)}
            </span>
          </li>
        );
      }
      // Regular text with possible bold formatting
      else {
        flushList(i);
        formatted.push(
          <p key={i} className="text-base text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
            {parseBoldText(line)}
          </p>
        );
      }
    }
    
    // Flush any remaining list items
    flushList(lines.length);
    
    return <div className="space-y-2">{formatted}</div>;
  };

  // Format roadmap text with inline courses after each Skill Focus section
  const formatRoadmapWithCourses = (monthData, themeColor = 'purple') => {
    if (!monthData?.raw_text) return null;
    
    const text = monthData.raw_text;
    
    // Debug: Check if courses are loaded
    console.log('🎓 Total courses available:', Object.keys(courses).length);
    console.log('📝 Month text length:', text.length);
    console.log('📋 First 500 chars:', text.substring(0, 500));
    
    // Try to find Skill Focus sections first
    const skillFocusRegex = /\*\*(?:🎯\s*)?Skill Focus:\*\*\s*([^\n]+)/gi;
    const skillFocusMatches = [...text.matchAll(skillFocusRegex)];
    
    console.log('🔍 Skill Focus matches found:', skillFocusMatches.length);
    
    // If no Skill Focus sections, show courses at the end of the month
    if (skillFocusMatches.length === 0) {
      console.warn('⚠️ No Skill Focus sections found, showing courses at end of month');
      
      // Match courses based on overall month content
      const matchedCourses = {};
      const textLower = text.toLowerCase();
      const seenCourseUrls = new Set();
      
      Object.keys(courses).forEach(skill => {
        const skillLower = skill.toLowerCase();
        const skillWords = skillLower.split(/[\s\/\-,()]+/).filter(w => w.length > 2);
        
        const isRelevant = skillWords.some(word => {
          const regex = new RegExp(`\\b${word}`, 'i');
          return regex.test(textLower);
        }) || textLower.includes(skillLower);
        
        if (isRelevant && Array.isArray(courses[skill]) && courses[skill].length > 0) {
          const uniqueCourses = courses[skill].filter(course => {
            if (seenCourseUrls.has(course.url)) return false;
            seenCourseUrls.add(course.url);
            return true;
          });
          
          if (uniqueCourses.length > 0) {
            matchedCourses[skill] = uniqueCourses;
            console.log(`✅ Matched: "${skill}" (${uniqueCourses.length} courses)`);
          }
        }
      });
      
      console.log(`🎯 Total skills: ${Object.keys(matchedCourses).length}, Total courses: ${seenCourseUrls.size}`);
      
      // Render text with courses at the end
      return (
        <>
          {formatRoadmapText(text)}
          {Object.keys(matchedCourses).length > 0 && renderCoursesSection(matchedCourses, themeColor, 'month')}
        </>
      );
    }
    
    // Use Skill Focus sections
    const skillFocusSections = parseSkillFocusSections(text);
    const matches = skillFocusMatches;
    
    const result = [];
    let lastIndex = 0;
    
    // Render intro text before first Skill Focus
    if (matches[0].index > 0) {
      const introText = text.substring(0, matches[0].index);
      result.push(
        <div key="intro">
          {formatRoadmapText(introText)}
        </div>
      );
    }
    
    matches.forEach((match, idx) => {
      const sectionStart = match.index;
      const nextMatch = matches[idx + 1];
      const sectionEnd = nextMatch ? nextMatch.index : text.length;
      
      // Get the section text
      const sectionText = text.substring(sectionStart, sectionEnd);
      
      // Render the section text
      result.push(
        <div key={`section-${idx}`}>
          {formatRoadmapText(sectionText)}
          
          {/* Render courses for this Skill Focus section */}
          {(() => {
            console.log(`📊 Section ${idx} courses:`, skillFocusSections[idx]?.courses ? Object.keys(skillFocusSections[idx].courses).length : 0);
            
            if (!skillFocusSections[idx] || Object.keys(skillFocusSections[idx].courses).length === 0) {
              console.log(`⚠️ No courses found for section ${idx}`);
              return null;
            }
            
            // Calculate completion stats for this section
            const allCoursesInSection = Object.values(skillFocusSections[idx].courses).flat();
            const completedInSection = allCoursesInSection.filter(course => isCourseCompleted(course.url)).length;
            const totalInSection = allCoursesInSection.length;
            const progressPercentage = totalInSection > 0 ? Math.round((completedInSection / totalInSection) * 100) : 0;
            
            console.log(`✅ Rendering ${totalInSection} courses for section ${idx}`);
            
            return (
            <div className="mt-6 mb-8 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-pink-900/30 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-amber-300 dark:border-pink-500/30 shadow-lg">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 flex items-center justify-center shadow-md">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
                      📚 Recommended Courses For This Section
                    </h6>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      Curated learning resources for your skill development
                    </p>
                  </div>
                </div>
                
                {/* Progress Badge */}
                {totalInSection > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-bold text-${themeColor}-700 dark:text-${themeColor}-300`}>
                        {completedInSection}/{totalInSection} completed
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {progressPercentage}% progress
                      </div>
                    </div>
                    <div className={`relative w-16 h-16 rounded-full border-4 border-${themeColor}-200 dark:border-${themeColor}-700`}>
                      <svg className="transform -rotate-90 w-full h-full">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className={`text-${themeColor}-600 dark:text-${themeColor}-400`}
                          strokeDasharray={`${progressPercentage * 1.76} 176`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold text-${themeColor}-700 dark:text-${themeColor}-300`}>
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {Object.entries(skillFocusSections[idx].courses).map(([skill, skillCourses]) => {
                  const topicKey = `${idx}-${skill}`;
                  const isExpanded = expandedCourseTopics[topicKey];
                  
                  // Check if all courses in this topic are completed
                  const completedCoursesCount = skillCourses.filter(course => isCourseCompleted(course.url)).length;
                  const isTopicCompleted = completedCoursesCount === skillCourses.length && skillCourses.length > 0;
                  
                  return (
                    <div key={skill} className={`bg-white dark:bg-[#1e1a2e] rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                      isTopicCompleted 
                        ? 'border-green-400 dark:border-green-600' 
                        : 'border-gray-200 dark:border-pink-500/20'
                    }`}>
                      {/* Clickable Header */}
                      <button
                        onClick={() => toggleCourseTopic(topicKey)}
                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                          isTopicCompleted
                            ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 hover:from-green-200 hover:to-green-300 dark:hover:from-green-800/50 dark:hover:to-green-700/50'
                            : 'bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800/90 dark:to-slate-900/90 hover:from-slate-600 hover:to-slate-700 dark:hover:from-slate-700/90 dark:hover:to-slate-800/90'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          {isTopicCompleted ? (
                            <div className="w-5 h-5 mr-3 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <svg className="w-5 h-5 mr-3 text-purple-400 dark:text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                            </svg>
                          )}
                          <span className={`text-base font-bold ${
                            isTopicCompleted 
                              ? 'text-green-900 dark:text-green-100' 
                              : 'text-purple-200 dark:text-purple-100'
                          }`}>
                            {skill}
                          </span>
                          <div className="ml-3 flex items-center gap-2">
                            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                              isTopicCompleted
                                ? 'bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-200'
                                : 'bg-purple-300/80 dark:bg-purple-500/40 text-purple-900 dark:text-purple-200'
                            }`}>
                              {skillCourses.length} {skillCourses.length === 1 ? 'course' : 'courses'}
                            </span>
                            {isTopicCompleted && (
                              <span className="text-xs font-bold bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                            isTopicCompleted ? 'text-green-600 dark:text-green-400' : `text-${themeColor}-600 dark:text-${themeColor}-400`
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-[#1e1a2e]">
                          <div className="space-y-3">
                            {skillCourses.map((course, courseIdx) => {
                              const isCompleted = isCourseCompleted(course.url);
                              
                              return (
                                <div
                                  key={courseIdx}
                                  className={`relative rounded-lg border transition-all ${
                                    isCompleted 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                                      : `bg-gradient-to-r from-${themeColor}-50/50 to-white dark:from-${themeColor}-900/20 dark:to-gray-800 border-${themeColor}-200 dark:border-${themeColor}-700 hover:border-${themeColor}-400 dark:hover:border-${themeColor}-500`
                                  } hover:shadow-md`}
                                >
                                  <div className="flex items-start p-4">
                                    {/* Checkbox for completion */}
                                    <div className="flex-shrink-0 mr-3 pt-1">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleCourseCompletion(course.url);
                                        }}
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                          isCompleted
                                            ? 'bg-green-500 border-green-600 hover:bg-green-600'
                                            : `border-gray-300 dark:border-gray-600 hover:border-${themeColor}-500 dark:hover:border-${themeColor}-400`
                                        }`}
                                        title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                                      >
                                        {isCompleted && (
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                    
                                    {/* Course Content */}
                                    <a
                                      href={course.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 group"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className={`text-base font-semibold mb-2 ${
                                            isCompleted 
                                              ? 'text-green-900 dark:text-green-100 line-through' 
                                              : `text-${themeColor}-900 dark:text-${themeColor}-100 group-hover:text-${themeColor}-700 dark:group-hover:text-${themeColor}-300`
                                          }`}>
                                            {course.title}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-2">
                                            {course.type && (
                                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                isCompleted
                                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                  : `bg-${themeColor}-100 dark:bg-${themeColor}-900/50 text-${themeColor}-700 dark:text-${themeColor}-300`
                                              }`}>
                                                📖 {course.type}
                                              </span>
                                            )}
                                            {course.level && (
                                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                isCompleted
                                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                              }`}>
                                                🎯 {course.level}
                                              </span>
                                            )}
                                            {course.duration_minutes && (
                                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                                isCompleted
                                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                  : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                                              }`}>
                                                ⏱️ {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                                              </span>
                                            )}
                                            {isCompleted && (
                                              <span className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-bold">
                                                ✅ Completed
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <svg className={`w-5 h-5 flex-shrink-0 ml-3 group-hover:translate-x-1 transition-transform ${
                                          isCompleted ? 'text-green-500' : `text-${themeColor}-500`
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </div>
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}
        </div>
      );
    });
    
    return <>{result}</>;
  };

  if (loading) {
    return (
      <LoadingWithFacts 
        title="Loading Your Career Roadmap"
        subtitle="Fetching your personalized learning journey..."
        context="roadmap"
        userPhone={mobile}
        showAfterDelay={2000}
      />
    );
  }

  return (
    <div className="min-h-screen roadmap-background bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e1a2e] shadow-sm border-b border-gray-200 dark:border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Career Roadmaps</h1>
                <p className="text-gray-600 dark:text-gray-400">Your personalized learning journey</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard?section=roadmap')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-8 text-center shadow-sm border border-gray-200 dark:border-pink-500/20">
            {/* Complex Example Career Roadmap Flowchart with Months */}
            <div className="mb-1 flex justify-center overflow-x-auto pb-2">
              <svg width="1200" height="420" viewBox="0 0 1200 420" className="max-w-full h-auto">
                {/* Define gradients and filters based on theme */}
                <defs>
                  {/* Drop shadow filter */}
                  <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  {theme === 'midnight' ? (
                    <>
                      <linearGradient id="boxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#1a1a1a', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#2a2a2a', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#2a2a2a', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#3a3a3a', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#121212', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#252525', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#3a3a3a', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#4a4a4a', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#2f2f2f', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#3f3f3f', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#1a1a1a', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#353535', stopOpacity: 1}} />
                      </linearGradient>
                    </>
                  ) : theme === 'dark' ? (
                    <>
                      <linearGradient id="boxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#10b981', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#f97316', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#06b6d4', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                      </linearGradient>
                    </>
                  ) : (
                    <>
                      <linearGradient id="boxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#f97316', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#a855f7', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#10b981', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#ec4899', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#f97316', stopOpacity: 1}} />
                      </linearGradient>
                      <linearGradient id="boxGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#10b981', stopOpacity: 1}} />
                      </linearGradient>
                    </>
                  )}
                  
                  {/* Arrow markers */}
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#ec4899' : '#f97316'} />
                  </marker>
                  <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} />
                  </marker>
                </defs>
                
                {/* Main timeline connecting lines (row 1) */}
                <path d="M 115 120 L 185 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 285 120 L 355 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 455 120 L 525 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 625 120 L 695 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 795 120 L 865 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 965 120 L 1035 120" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                
                {/* Vertical branches to row 2 */}
                <path d="M 115 160 L 115 205" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)" opacity="0.6" />
                <path d="M 455 160 L 455 205" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)" opacity="0.6" />
                <path d="M 795 160 L 795 205" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} strokeWidth="2" fill="none" markerEnd="url(#arrowhead2)" opacity="0.6" />
                
                {/* Row 2 horizontal connections */}
                <path d="M 185 245 L 355 245" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 525 245 L 695 245" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                <path d="M 865 245 L 1035 245" stroke={theme === 'midnight' ? '#404040' : theme === 'dark' ? '#ec4899' : '#f97316'} strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.7" />
                
                {/* Month 1 */}
                <g filter="url(#dropShadow)">
                  <rect x="30" y="85" width="85" height="75" rx="10" fill="url(#boxGrad1)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="72.5" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 1</text>
                  <text x="72.5" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Python Basics</text>
                  <text x="72.5" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Variables, Loops</text>
                </g>
                
                {/* Month 2 */}
                <g filter="url(#dropShadow)">
                  <rect x="185" y="85" width="100" height="75" rx="10" fill="url(#boxGrad2)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="235" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 2</text>
                  <text x="235" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">OOP, Functions</text>
                  <text x="235" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Data Structures</text>
                </g>
                
                {/* Month 3 */}
                <g filter="url(#dropShadow)">
                  <rect x="355" y="85" width="100" height="75" rx="10" fill="url(#boxGrad3)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="405" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 3</text>
                  <text x="405" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">DSA Basics</text>
                  <text x="405" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Arrays, Strings</text>
                </g>
                
                {/* Month 4 */}
                <g filter="url(#dropShadow)">
                  <rect x="525" y="85" width="100" height="75" rx="10" fill="url(#boxGrad4)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="575" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 4</text>
                  <text x="575" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Web Dev</text>
                  <text x="575" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">HTML, CSS, JS</text>
                </g>
                
                {/* Month 5 */}
                <g filter="url(#dropShadow)">
                  <rect x="695" y="85" width="100" height="75" rx="10" fill="url(#boxGrad5)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="745" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 5</text>
                  <text x="745" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">React Basics</text>
                  <text x="745" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Components</text>
                </g>
                
                {/* Month 6 */}
                <g filter="url(#dropShadow)">
                  <rect x="865" y="85" width="100" height="75" rx="10" fill="url(#boxGrad6)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="915" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 6</text>
                  <text x="915" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">First Project</text>
                  <text x="915" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Portfolio Site</text>
                </g>
                
                {/* Month 7 */}
                <g filter="url(#dropShadow)">
                  <rect x="1035" y="85" width="145" height="75" rx="10" fill="url(#boxGrad1)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="1107.5" y="112" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="13" fontWeight="bold" filter="blur(3px)">Month 7-12</text>
                  <text x="1107.5" y="130" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Advanced Topics</text>
                  <text x="1107.5" y="143" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Backend, Databases</text>
                </g>
                
                {/* Row 2: Deep dive topics */}
                <g filter="url(#dropShadow)">
                  <rect x="30" y="210" width="155" height="70" rx="10" fill="url(#boxGrad2)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="107.5" y="235" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="12" fontWeight="bold" filter="blur(2.8px)">Node.js & Express</text>
                  <text x="107.5" y="252" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">REST APIs, Authentication</text>
                  <text x="107.5" y="266" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="8" filter="blur(2.5px)">Build Full Stack Apps</text>
                </g>
                
                <g filter="url(#dropShadow)">
                  <rect x="355" y="210" width="170" height="70" rx="10" fill="url(#boxGrad3)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="440" y="235" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="12" fontWeight="bold" filter="blur(2.8px)">Database & Cloud</text>
                  <text x="440" y="252" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">MongoDB, PostgreSQL, AWS</text>
                  <text x="440" y="266" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="8" filter="blur(2.5px)">Deploy Applications</text>
                </g>
                
                <g filter="url(#dropShadow)">
                  <rect x="695" y="210" width="170" height="70" rx="10" fill="url(#boxGrad4)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="780" y="235" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="12" fontWeight="bold" filter="blur(2.8px)">DevOps & Testing</text>
                  <text x="780" y="252" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Docker, CI/CD, Jest, Cypress</text>
                  <text x="780" y="266" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="8" filter="blur(2.5px)">Professional Workflow</text>
                </g>
                
                <g filter="url(#dropShadow)">
                  <rect x="1035" y="210" width="145" height="70" rx="10" fill="url(#boxGrad5)" stroke={theme === 'midnight' ? '#505050' : theme === 'dark' ? '#a855f7' : '#fb923c'} strokeWidth="2" />
                  <text x="1107.5" y="235" textAnchor="middle" fill={theme === 'midnight' ? '#ffffff' : '#ffffff'} fontSize="12" fontWeight="bold" filter="blur(2.8px)">Career Ready</text>
                  <text x="1107.5" y="252" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="9" filter="blur(2.5px)">Portfolio, Resume</text>
                  <text x="1107.5" y="266" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#e9d5ff' : '#fff7ed'} fontSize="8" filter="blur(2.5px)">Start Applying</text>
                </g>
                
                {/* Milestone indicators */}
                <g opacity="0.8">
                  <circle cx="72.5" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#8b5cf6' : '#f59e0b'} />
                  <text x="72.5" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 1</text>
                </g>
                <g opacity="0.8">
                  <circle cx="235" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} />
                  <text x="235" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 2</text>
                </g>
                <g opacity="0.8">
                  <circle cx="405" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#10b981' : '#3b82f6'} />
                  <text x="405" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 3</text>
                </g>
                <g opacity="0.8">
                  <circle cx="575" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#f59e0b' : '#10b981'} />
                  <text x="575" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 4</text>
                </g>
                <g opacity="0.8">
                  <circle cx="745" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#ec4899'} />
                  <text x="745" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 6</text>
                </g>
                <g opacity="0.8">
                  <circle cx="915" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#06b6d4' : '#f59e0b'} />
                  <text x="915" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 8</text>
                </g>
                <g opacity="0.8">
                  <circle cx="1107.5" cy="335" r="5" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#a855f7' : '#10b981'} />
                  <text x="1107.5" y="355" textAnchor="middle" fill={theme === 'midnight' ? '#a0a0a0' : theme === 'dark' ? '#cbd5e1' : '#78716c'} fontSize="8">Week 12</text>
                </g>
                
                {/* Connection dots */}
                <circle cx="115" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
                <circle cx="285" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
                <circle cx="455" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
                <circle cx="625" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
                <circle cx="795" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
                <circle cx="965" cy="150" r="4" fill={theme === 'midnight' ? '#606060' : theme === 'dark' ? '#ec4899' : '#f97316'} opacity="0.6" />
              </svg>
            </div>
            
            <button
              onClick={async () => {
                try {
                  console.log('🚀 Start Prediction button clicked');
                  console.log('📱 Mobile number:', mobile);
                  
                  setGeneratingRoadmap(true);
                  setError('');
                  setLoading(true);
                  
                  // Trigger roadmap webhook
                  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
                  console.log('🔗 Backend URL:', backendUrl);
                  console.log('📤 Sending payload:', { mobile, action: 'roadmap_click' });
                  
                  const response = await fetch(`${backendUrl}/api/notify-answer-response`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile, action: 'roadmap_click' })
                  });
                  
                  const result = await response.json();
                  console.log('✅ Roadmap webhook response:', result);
                  
                  if (result.success) {
                    console.log('✅ Webhook triggered successfully');
                    console.log('🔗 Webhook URL used:', result.webhook?.url_used);
                    console.log('📊 Webhook status:', result.webhook?.status_code);
                    
                    // Wait for n8n to process and save courses in Course collection
                    console.log('⏳ Waiting for n8n to generate courses...');
                    
                    // Poll for courses in Course collection with timeout
                    let attempts = 0;
                    const maxAttempts = 24; // 24 attempts x 5 seconds = 120 seconds max
                    let coursesFound = false;
                    
                    while (attempts < maxAttempts && !coursesFound) {
                      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
                      attempts++;
                      console.log(`🔄 Checking for courses in Course collection... (Attempt ${attempts}/${maxAttempts})`);
                      
                      // Check Course collection by mobile number as _id
                      const checkResponse = await fetch('http://localhost:5000/api/get-user-courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mobile }),
                      });
                      
                      const checkData = await checkResponse.json();
                      
                      if (checkData.success && checkData.data?.courses && 
                          Object.keys(checkData.data.courses).length > 0) {
                        console.log('✅ Courses found in Course collection!');
                        coursesFound = true;
                        // Update state with courses
                        setCourses(checkData.data.courses);
                        // Also fetch roadmaps to display both together
                        console.log('🔄 Fetching roadmaps to display alongside courses...');
                        await fetchAllRoadmaps();
                        break;
                      }
                    }
                    
                    if (!coursesFound) {
                      setError('Course generation is taking longer than expected. Please refresh the page in a few moments.');
                    }
                    
                    setGeneratingRoadmap(false);
                    setLoading(false);
                  } else {
                    console.error('❌ Webhook failed:', result);
                    setError('Failed to trigger course generation. Please try again.');
                    setGeneratingRoadmap(false);
                    setLoading(false);
                  }
                } catch (err) {
                  console.error('❌ Error triggering course webhook:', err);
                  setError('Error generating courses. Please try again.');
                  setGeneratingRoadmap(false);
                  setLoading(false);
                }
              }}
              disabled={generatingRoadmap}
              className="inline-flex items-center px-6 py-3 bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingRoadmap ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Courses...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Roadmap
                </>
              )}
            </button>
            
            {/* Show loading questions/facts during generation */}
            {generatingRoadmap && (
              <div className="mt-8">
                <LoadingFactsInline context="roadmap_generation" minDisplayTime={8000} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Section */}
            {getAllDomains().length > 1 && (
              <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-pink-500/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Domain</h2>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2d1f3d] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400"
                  >
                    <option value="all">All Domains</option>
                    {getAllDomains().map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Roadmaps List - Full Width */}
            <div className="space-y-6">
              {Object.entries(getFilteredRoadmaps()).map(([domain, domainRoadmaps]) => 
                domainRoadmaps.map((roadmap, index) => {
                  return (
                    <div key={`${domain}-${index}`} className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-pink-500/20 hover:shadow-md dark:hover:shadow-glow transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 dark:from-purple-600 dark:to-pink-700 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{roadmap.role || 'Career Path'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{domain}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">{calculateDuration(roadmap)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">Duration</div>
                        </div>
                      </div>

                      {/* Introduction */}
                      {roadmap.introduction && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800">
                          {/* Check if introduction is JSON string and parse it, otherwise show as text */}
                          {(() => {
                            const intro = roadmap.introduction;
                            // Check if it looks like JSON
                            if (intro.trim().startsWith('{') || intro.trim().startsWith('[')) {
                              try {
                                const parsed = JSON.parse(intro);
                                
                                // Check if the entire roadmap data is in the introduction field
                                if (parsed._id || parsed.id || (parsed.skills_summary && parsed.academic_year)) {
                                  // This is a full roadmap JSON object stored as text - hide it since we'll show structured data
                                  return null;
                                }
                                
                                // If it's a roadmap object with timeline
                                if (parsed.roadmap && parsed.roadmap.timeline) {
                                  return (
                                    <div className="space-y-3">
                                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{parsed.message}</p>
                                      {parsed.roadmap.timeline.map((item, idx) => (
                                        <div key={idx} className="border-l-4 border-blue-400 dark:border-blue-500 pl-3">
                                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{item.duration}</p>
                                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                // Otherwise don't show the raw JSON
                                return null;
                              } catch (e) {
                                // If parsing fails, show as regular text with formatting
                                return (
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {intro.split('\n').map((line, idx) => {
                                      if (line.startsWith('###')) {
                                        const text = line.replace(/^###\s*\*?\*?\s*/, '').trim();
                                        return <h3 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{text}</h3>;
                                      }
                                      if (line.startsWith('**') && line.endsWith('**')) {
                                        const text = line.replace(/^\*\*|\*\*$/g, '');
                                        return <p key={idx} className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{text}</p>;
                                      }
                                      if (line.startsWith('*   ')) {
                                        const text = line.replace(/^\*\s+/, '');
                                        return <li key={idx} className="text-gray-700 dark:text-gray-300 ml-4">{text}</li>;
                                      }
                                      if (line.trim() === '---') {
                                        return <hr key={idx} className="my-4 border-gray-300 dark:border-gray-600" />;
                                      }
                                      if (line.trim() === '') {
                                        return <br key={idx} />;
                                      }
                                      return <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{line}</p>;
                                    })}
                                  </div>
                                );
                              }
                            }
                            // Regular text introduction - format and display
                            return (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {intro.split('\n').map((line, idx) => {
                                  // Check if line is a heading
                                  if (line.startsWith('###')) {
                                    const text = line.replace(/^###\s*\*?\*?\s*/, '').trim();
                                    return <h3 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{text}</h3>;
                                  }
                                  if (line.startsWith('**') && line.endsWith('**')) {
                                    const text = line.replace(/^\*\*|\*\*$/g, '');
                                    return <p key={idx} className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{text}</p>;
                                  }
                                  if (line.startsWith('*   ')) {
                                    const text = line.replace(/^\*\s+/, '');
                                    return <li key={idx} className="text-gray-700 dark:text-gray-300 ml-4">{text}</li>;
                                  }
                                  if (line.trim() === '---') {
                                    return <hr key={idx} className="my-4 border-gray-300 dark:border-gray-600" />;
                                  }
                                  if (line.trim() === '') {
                                    return <br key={idx} />;
                                  }
                                  return <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{line}</p>;
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Identified Gaps */}
                      {roadmap.identified_gaps && roadmap.identified_gaps.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Skill Gaps to Address
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {roadmap.identified_gaps.map((gap, gapIndex) => (
                              <span
                                key={gapIndex}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                              >
                                {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Mode Toggle */}
                      <div className="mb-6 inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-[#1e1a2e] p-1 rounded-lg">
                        <button
                          onClick={() => setViewMode('month')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'month'
                              ? 'bg-white dark:bg-[#2d1f3d] text-purple-600 dark:text-purple-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Month View
                        </button>
                        <button
                          onClick={() => setViewMode('week')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            viewMode === 'week'
                              ? 'bg-white dark:bg-[#2d1f3d] text-purple-600 dark:text-purple-400 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Weekly View (AI Curated)
                        </button>
                      </div>

                      {/* Dynamically render all months */}
                      {getMonthsData(roadmap).map((month) => {
                        const color = getMonthColor(month.number);
                        const roadmapKey = `${domain}-${index}`;
                        const weeklyKey = `${roadmapKey}-month${month.number}`;
                        const weeklyPlan = weeklyPlans[weeklyKey];
                        
                        return (
                          <div key={month.number} className={`mb-4 border-2 ${color.borderClass} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all`}>
                            <button
                              onClick={() => {
                                const wasExpanded = isMonthExpanded(roadmapKey, month.number);
                                toggleMonth(roadmapKey, month.number);
                                
                                // If in weekly view and expanding the month (not collapsing), fetch the plan
                                if (viewMode === 'week' && !wasExpanded && !weeklyPlan) {
                                  fetchWeeklyPlan(month.data, roadmapKey, month.number);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-4 ${color.bgClass} ${color.hoverClass} transition-colors`}
                            >
                              <div className="flex items-center">
                                <div className={`w-8 h-8 ${color.badgeClass} rounded-full flex items-center justify-center mr-3 shadow-md`}>
                                  <span className="text-sm font-bold text-white">{month.number}</span>
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Month {month.number}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {viewMode === 'week' ? (
                                      (() => {
                                        // Calculate how many weeks are unlocked in this month
                                        const monthWeeks = [1, 2, 3, 4];
                                        const unlockedInMonth = monthWeeks.filter(weekNum => {
                                          const actualWeekNumber = ((month.number - 1) * 4) + weekNum;
                                          return unlockedWeeks.unlocked_weeks.includes(actualWeekNumber);
                                        }).length;
                                        
                                        if (unlockedInMonth === 0) {
                                          return '🔒 Locked - Complete previous weeks';
                                        } else if (unlockedInMonth === 4) {
                                          return '✓ All 4 Weeks Unlocked';
                                        } else {
                                          return `${unlockedInMonth} of 4 Weeks Unlocked`;
                                        }
                                      })()
                                    ) : (
                                      `Weeks ${month.weekRange}`
                                    )}
                                  </p>
                                </div>
                              </div>
                              <svg 
                                className={`w-5 h-5 ${color.textClass} transform transition-transform ${isMonthExpanded(roadmapKey, month.number) ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {isMonthExpanded(roadmapKey, month.number) && (
                              <div className={`p-6 ${color.contentBgClass}`}>
                                {viewMode === 'month' ? (
                                  // Original Month View
                                  <>
                                    {month.data?.raw_text && (
                                      <div className={`prose prose-${color.name} dark:prose-invert max-w-none`}>
                                        {formatRoadmapWithCourses(month.data, color.name)}
                                      </div>
                                    )}
                                    {!month.data?.raw_text && (
                                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">Month {month.number} plan is not yet available.</p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  // Weekly View with AI Curated Courses
                                  <>
                                    {loadingWeekly && !weeklyPlan ? (
                                      <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mx-auto"></div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Organizing courses by week...</p>
                                      </div>
                                    ) : weeklyPlan ? (
                                      <div className="space-y-4">
                                        {(() => {
                                          console.log(`🔍 Weekly Plan Keys for Month ${month.number}:`, Object.keys(weeklyPlan));
                                          console.log(`🔍 Weekly Plan Data:`, JSON.stringify(weeklyPlan, null, 2).substring(0, 500));
                                          return null;
                                        })()}
                                        
                                        {[1, 2, 3, 4].map(weekNum => {
                                          const weekKey = `week_${weekNum}`;
                                          const weekData = weeklyPlan[weekKey];
                                          
                                          // Calculate actual week number (Month 1 Week 1 = Week 1, Month 2 Week 1 = Week 5, etc.)
                                          const actualWeekNumber = ((month.number - 1) * 4) + weekNum;
                                          const isWeekUnlocked = unlockedWeeks.unlocked_weeks.includes(actualWeekNumber);
                                          const isWeekCompleted = unlockedWeeks.completed_weeks.includes(actualWeekNumber);
                                          
                                          console.log(`📅 Checking ${weekKey}:`, {
                                            exists: !!weekData,
                                            hasTopics: weekData?.topics ? true : false,
                                            topicsLength: weekData?.topics?.length || 0,
                                            actualWeekNumber,
                                            isWeekUnlocked,
                                            isWeekCompleted,
                                            unlockedWeeksList: unlockedWeeks.unlocked_weeks
                                          });
                                          
                                          // Skip if no data
                                          if (!weekData || !weekData.topics || weekData.topics.length === 0) {
                                            console.log(`⚠️ Skipping ${weekKey} - no data or topics`);
                                            return null;
                                          }
                                          
                                          // SHOW ALL WEEKS - locked weeks will be grayed out and disabled
                                          
                                          return (
                                            <div key={weekNum} className={`border-2 rounded-lg overflow-hidden transition-all ${
                                              isWeekCompleted 
                                                ? 'border-green-400 dark:border-green-600'
                                                : isWeekUnlocked
                                                  ? 'border-purple-300 dark:border-pink-500/50'
                                                  : 'border-gray-300 dark:border-gray-700 opacity-60'
                                            }`}>
                                              <button
                                                onClick={() => isWeekUnlocked && toggleWeek(roadmapKey, month.number, weekNum)}
                                                disabled={!isWeekUnlocked}
                                                className={`w-full flex items-center justify-between p-4 transition-colors ${
                                                  isWeekUnlocked 
                                                    ? 'bg-gray-50 dark:bg-[#1e1a2e] hover:bg-gray-100 dark:hover:bg-[#2d1f3d] cursor-pointer'
                                                    : 'bg-gray-100 dark:bg-gray-900/60 cursor-not-allowed'
                                                }`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  {/* Week number badge or lock icon */}
                                                  {isWeekUnlocked ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                      isWeekCompleted
                                                        ? 'bg-green-500 dark:bg-green-600'
                                                        : 'bg-purple-500 dark:bg-purple-600'
                                                    }`}>
                                                      {isWeekCompleted ? (
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                      ) : (
                                                        <span className="text-sm font-bold text-white">{weekNum}</span>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div className="w-8 h-8 bg-gray-400 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                      </svg>
                                                    </div>
                                                  )}
                                                  <div className="text-left">
                                                    <div className="flex items-center gap-2">
                                                      <h5 className={`text-sm font-bold ${
                                                        isWeekUnlocked 
                                                          ? 'text-gray-900 dark:text-white'
                                                          : 'text-gray-500 dark:text-gray-500'
                                                      }`}>
                                                        Week {weekNum}
                                                      </h5>
                                                      {isWeekCompleted && (
                                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                                          ✓ Completed
                                                        </span>
                                                      )}
                                                      {!isWeekUnlocked && (
                                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                                                          🔒 Locked
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className={`text-xs ${
                                                      isWeekUnlocked
                                                        ? 'text-gray-600 dark:text-gray-400'
                                                        : 'text-gray-500 dark:text-gray-600'
                                                    }`}>
                                                      {isWeekUnlocked 
                                                        ? `${weekData.topics.length} Topics`
                                                        : `Complete Week ${actualWeekNumber - 1} to unlock`
                                                      }
                                                    </p>
                                                  </div>
                                                </div>
                                                {isWeekUnlocked && (
                                                  <svg 
                                                    className={`w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform ${isWeekExpanded(roadmapKey, month.number, weekNum) ? 'rotate-180' : ''}`}
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                  </svg>
                                                )}
                                              </button>
                                              
                                              {isWeekExpanded(roadmapKey, month.number, weekNum) && isWeekUnlocked && (
                                                <div className="p-4 space-y-4">
                                                  {/* Learning Goal Section */}
                                                  {weekData.learning_goal && (
                                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                                                      <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                          <h6 className="text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">🎯 Learning Goal</h6>
                                                          <p className="text-sm text-gray-700 dark:text-gray-300">{weekData.learning_goal}</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Weekly Roadmap Section */}
                                                  {weekData.roadmap && (
                                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-amber-200 dark:border-pink-500/30 rounded-lg p-4">
                                                      <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                        </svg>
                                                        <div className="flex-1">
                                                          <h6 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">🗺️ Weekly Roadmap</h6>
                                                          <p className="text-sm text-gray-700 dark:text-gray-300">{weekData.roadmap}</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Topics and Courses Section Header */}
                                                  <div className="flex items-center gap-2 pt-2">
                                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    <h6 className="text-sm font-bold text-gray-700 dark:text-gray-300">📚 Topics & Course Recommendations</h6>
                                                  </div>
                                                  
                                                  {/* Topics and Courses */}
                                                  <div className="space-y-6">
                                                  {weekData.topics.map((topic, topicIdx) => (
                                                    <div key={topicIdx} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#1e1a2e] dark:to-[#2d1f3d] rounded-lg p-5 border-l-4 border-purple-500 dark:border-purple-400 shadow-sm">
                                                      {/* Topic Header */}
                                                      <div className="flex items-start gap-3 mb-4">
                                                        <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                          <span className="text-white font-bold text-sm">{topicIdx + 1}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                          <h6 className="text-base font-bold text-gray-900 dark:text-white mb-1">📖 {topic.name}</h6>
                                                          <div className="h-0.5 bg-gradient-to-r from-purple-500 to-transparent dark:from-purple-400 w-24"></div>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Best Course */}
                                                      {topic.best_course && (
                                                        <div className="mb-4">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded">⭐ BEST COURSE</span>
                                                            {topic.reasoning && (
                                                              <span className="text-xs text-gray-600 dark:text-gray-400 italic">{topic.reasoning}</span>
                                                            )}
                                                          </div>
                                                          <a
                                                            href={topic.best_course.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg hover:shadow-md transition-all"
                                                          >
                                                            <div className="flex items-start justify-between">
                                                              <div className="flex-1">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{topic.best_course.title}</div>
                                                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                  {topic.best_course.provider || topic.best_course.channel || 'Online Course'}
                                                                </div>
                                                              </div>
                                                              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                              </svg>
                                                            </div>
                                                          </a>
                                                        </div>
                                                      )}
                                                      
                                                      {/* No courses available message */}
                                                      {!topic.best_course && (!topic.other_courses || topic.other_courses.length === 0) && (
                                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                                            📚 {topic.reasoning || 'Courses for this topic will be added soon.'}
                                                          </p>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Other Recommended Courses */}
                                                      {topic.other_courses && topic.other_courses.length > 0 && (
                                                        <div>
                                                          <div 
                                                            className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded px-2 py-1 -mx-2 transition-colors"
                                                            onClick={() => toggleOtherCourses(roadmap.key, month.number, weekNum, topicIdx)}
                                                          >
                                                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Other Recommended Courses:</div>
                                                            <svg 
                                                              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOtherCoursesExpanded(roadmap.key, month.number, weekNum, topicIdx) ? 'rotate-180' : ''}`}
                                                              fill="none" 
                                                              stroke="currentColor" 
                                                              viewBox="0 0 24 24"
                                                            >
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                          </div>
                                                          {isOtherCoursesExpanded(roadmap.key, month.number, weekNum, topicIdx) && (
                                                          <div className="space-y-2 mt-2">
                                                            {topic.other_courses.map((course, courseIdx) => (
                                                              <a
                                                                key={courseIdx}
                                                                href={course.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block p-2 bg-gray-50 dark:bg-[#1e1a2e] border border-gray-200 dark:border-pink-500/20 rounded hover:bg-gray-100 dark:hover:bg-[#2d1f3d] transition-colors"
                                                              >
                                                                <div className="flex items-start justify-between">
                                                                  <div className="flex-1">
                                                                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{course.title}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                                                      {course.provider || course.channel || 'Online'}
                                                                    </div>
                                                                  </div>
                                                                  <svg className="w-3 h-3 text-gray-400 dark:text-gray-600 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                  </svg>
                                                                </div>
                                                              </a>
                                                            ))}
                                                          </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                        
                                        {/* Show message if no weeks were rendered */}
                                        {[1, 2, 3, 4].every(weekNum => {
                                          const weekKey = `week_${weekNum}`;
                                          const weekData = weeklyPlan[weekKey];
                                          return !weekData || !weekData.topics || weekData.topics.length === 0;
                                        }) && (
                                          <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                            <svg className="w-12 h-12 mx-auto text-yellow-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">No weekly data found</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Weekly plan structure may be incomplete. Check console for details.</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">Weekly plan not available. Click to load.</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Next Steps */}
                      {roadmap.next_steps && roadmap.next_steps.length > 0 && (
                        <div className="mb-4 pt-4 border-t border-gray-200 dark:border-pink-500/20">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Next Steps
                          </h4>
                          <ul className="space-y-2 pl-6">
                            {roadmap.next_steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-sm text-gray-700 dark:text-gray-300 list-disc leading-relaxed">
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-pink-500/20">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-300">
                          {roadmap.category || 'Career Roadmap'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recommended Courses Section */}
            {Object.keys(courses).length > 0 && (
              <div className="mt-8">
                <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-pink-500/20 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Courses</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Curated learning resources from Microsoft Learn</p>
                      </div>
                    </div>
                    
                    {Object.keys(courses).length > 1 && (
                      <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2d1f3d] text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                      >
                        <option value="all">All Skills</option>
                        {Object.keys(courses).sort().map(skill => (
                          <option key={skill} value={skill}>{skill}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {loadingCourses ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(courses)
                        .filter(([skill]) => selectedSkill === 'all' || skill === selectedSkill)
                        .map(([skill, skillCourses]) => {
                          // Ensure skillCourses is an array
                          const coursesArray = Array.isArray(skillCourses) ? skillCourses : [];
                          const isExpanded = expandedCourseTopics[skill];
                          
                          return (
                          <div key={skill} className="border border-gray-200 dark:border-pink-500/20 rounded-xl overflow-hidden">
                            <button
                              onClick={() => setExpandedCourseTopics(prev => ({ ...prev, [skill]: !prev[skill] }))}
                              className="w-full bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 px-4 py-3 border-b border-gray-200 dark:border-pink-500/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-start">
                                  <svg className="w-5 h-5 mr-2 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="text-left">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {skill}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{coursesArray.length} course{coursesArray.length !== 1 ? 's' : ''} available</p>
                                  </div>
                                </div>
                                <svg 
                                  className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>
                            
                            {isExpanded && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                              {coursesArray.map((course, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <a 
                                        href={course.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center group"
                                      >
                                        {course.title}
                                        <svg className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                      
                                      {course.summary && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                          {course.summary}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-3 mt-3">
                                        {course.type && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                            {course.type}
                                          </span>
                                        )}
                                        {course.level && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                            {course.level}
                                          </span>
                                        )}
                                        {course.duration_minutes && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                                          </span>
                                        )}
                                        {course.relevance_score && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                            <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            {course.relevance_score}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roadmap;

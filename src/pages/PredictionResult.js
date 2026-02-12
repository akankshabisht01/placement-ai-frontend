import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import domainsData, { getCareerPathsByCategoryId, findCategoryByKeywords } from '../data/domainData';
import { getDomainById as getJobDomainById } from '../data/jobDomainData';
import { evaluateCandidate } from '../utils/candidateEvaluator';
import CareerPathsSection from '../components/CareerPathsSection';

// Modern Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, label, color = 'blue' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    blue: 'stroke-blue-500 dark:stroke-blue-400',
    green: 'stroke-green-500 dark:stroke-green-400',
    purple: 'stroke-purple-500 dark:stroke-purple-400',
    orange: 'stroke-orange-500 dark:stroke-orange-400',
    red: 'stroke-red-500 dark:stroke-red-400',
    indigo: 'stroke-indigo-500 dark:stroke-indigo-400'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorMap[color]} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{Math.round(percentage)}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  );
};

// Modern Score Card Component
const ScoreCard = ({ title, score, maxScore, description, icon, color = 'blue', showMeter = true }) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const colorMap = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800',
    green: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800',
    orange: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-orange-200 dark:border-orange-800',
    red: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-200 dark:border-red-800',
    indigo: 'from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-800'
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-6 hover:shadow-lg dark:hover:shadow-glow transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && <span className="text-2xl">{icon}</span>}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {typeof score === 'number' ? Math.round(score) : score}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/{maxScore}</span>
          </div>
        </div>

        {showMeter && (
          <CircularProgress
            percentage={percentage}
            size={80}
            strokeWidth={6}
            color={color}
          />
        )}
      </div>
    </div>
  );
};

const interpretSchoolScore = (value) => {
  if (value === null || value === undefined || value === '') {
    return { numeric: 0, display: 'N/A', detail: 'N/A' };
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { numeric: 0, display: 'N/A', detail: 'N/A' };
  }

  const formatNumber = (val) => {
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(1).replace(/\.0$/, '');
  };

  if (numericValue <= 10) {
    const percentEquivalent = Math.min(100, Number((numericValue * 9.5).toFixed(2)));
    const cgpaFormatted = formatNumber(numericValue);
    return {
      numeric: percentEquivalent,
      display: `${cgpaFormatted} CGPA`,
      detail: `${cgpaFormatted} CGPA (~${formatNumber(percentEquivalent)}%)`
    };
  }

  const percentFormatted = formatNumber(numericValue);
  return {
    numeric: numericValue,
    display: `${percentFormatted}%`,
    detail: `${percentFormatted}%`
  };
};

const PredictionResult = () => {
  const [predictionData, setPredictionData] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearStoredPrediction = () => {
    localStorage.removeItem('predictionApiResult');
    localStorage.removeItem('predictionFormData');
    localStorage.removeItem('predictionFormSession');
  };

  const handleStartNewPrediction = () => {
    clearStoredPrediction();
    navigate('/predict');
  };
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    // Get prediction API result (the actual prediction data)
    const apiResult = localStorage.getItem('predictionApiResult');
    // Get form data (which contains the selected domain info)
    const storedFormData = localStorage.getItem('predictionFormData');
    
    console.log('PredictionResult - Retrieved from localStorage:');
    console.log('apiResult:', apiResult ? 'Found' : 'Not found');
    console.log('formData:', storedFormData ? 'Found' : 'Not found');
    
    // Parse and set form data first
    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      console.log('Parsed form data:', parsedFormData);
      console.log('Selected Domain ID:', parsedFormData.selectedDomainId);
      console.log('Selected Role ID:', parsedFormData.selectedRoleId);
      setFormData(parsedFormData);
      setSelectedDomain({
        selectedDomainId: parsedFormData.selectedDomainId
      });
    }
    
    if (apiResult) {
      const parsedApiResult = JSON.parse(apiResult);
      console.log('Parsed API result:', parsedApiResult);
      console.log('Skill Score Debug:', parsedApiResult.skillScore);
      console.log('Skill Score Type:', typeof parsedApiResult.skillScore);

      // Use the enhanced backend data directly - it contains all the improved scoring
      setPredictionData({
        ...parsedApiResult,
        // Ensure compatibility with frontend display expectations
        academicScore: parsedApiResult.academicScore,
        skillScore: parsedApiResult.skillScore,
        projectScore: parsedApiResult.projectScore,
        experienceScore: parsedApiResult.experienceScore,
        placementScore: parsedApiResult.placementScore,
        mlModelScore: parsedApiResult.mlModelScore,
        // Keep other fields for compatibility
        isEligible: parsedApiResult.isEligible,
        recommendations: parsedApiResult.recommendations,
        scoreBreakdown: parsedApiResult.scoreBreakdown,
        strongProjects: parsedApiResult.strongProjects,
        extractedAchievements: parsedApiResult.extractedAchievements,
        inputData: parsedApiResult.inputData,
        modelUsed: parsedApiResult.modelUsed
      });

      // Don't run the complex evaluation logic if we have backend data
      setLoading(false);
      return;
    }

    if (storedFormData) {
      const parsedFormData = JSON.parse(storedFormData);
      console.log('Parsed form data - selectedDomainId:', parsedFormData.selectedDomainId);
      setSelectedDomain({
        selectedDomainId: parsedFormData.selectedDomainId
      });
      setFormData(parsedFormData);

      // If we already have API result, we can skip the complex evaluation
      if (apiResult) {
        setLoading(false);
        return;
      }

      setTimeout(() => {
        try {
          const backend = apiResult ? JSON.parse(apiResult) : null;
          const evaluation = evaluateCandidate(parsedFormData);

          let personalizationLevel = 'medium';
          if (evaluation.candidateScore < 40) personalizationLevel = 'low';
          else if (evaluation.candidateScore >= 75) personalizationLevel = 'high';

          const mergedSuggestions = Array.from(new Set([
            ...(evaluation.suggestions || []),
            ...((backend?.recommendations || []))
          ]));

          const domain = parsedFormData.selectedDomainId ? getJobDomainById(parsedFormData.selectedDomainId) : null;
          const categoryName = parsedFormData.selectedCategoryId || 'General';

          let filteredDomains = evaluation.jobDomainsAndRoles;
          if (parsedFormData.selectedDomainId) {
            const sel = parsedFormData.selectedDomainId.toLowerCase();
            const byExact = evaluation.jobDomainsAndRoles.filter(d => d.domain.toLowerCase() === sel);
            const byContains = byExact.length ? byExact : evaluation.jobDomainsAndRoles.filter(d => d.domain.toLowerCase().includes(sel));
            filteredDomains = byContains.length ? byContains : evaluation.jobDomainsAndRoles;
          }

          let chosenRoleSkills = [];
          if (parsedFormData.selectedDomainId && parsedFormData.selectedRoleId) {
            const jobDomain = getJobDomainById(parsedFormData.selectedDomainId);
            const roleObj = jobDomain?.roles?.find(r => r.id === parsedFormData.selectedRoleId);
            if (roleObj?.skills) chosenRoleSkills = roleObj.skills;
          }
          const providedSkills = parsedFormData.selectedSkills || [];
          const missingRoleSkills = chosenRoleSkills.filter(s => !providedSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));

          const backendBreakdown = backend?.scoreBreakdown || null;

          setPredictionData({
            placementScore: backend?.placementScore ?? backend?.placement_score ?? evaluation.candidateScore,
            academicScore: evaluation.scoreBreakdown.academic,
            skillScore: evaluation.scoreBreakdown.skills,
            expScore: evaluation.scoreBreakdown.experience,
            projectAnalysis: evaluation.projectAnalysis || { strong: [], basic: [] },
            missingSkills: evaluation.missingSkills || [],
            missingRoleSkills,
            chosenRoleSkills,
            recommendedRoles: filteredDomains.flatMap(d => d.roles),
            jobDomainsAndRoles: filteredDomains,
            chosenRole: evaluation.chosenRole || null,
            suggestions: mergedSuggestions,
            personalizationLevel,
            domain: domain?.name || parsedFormData.customDomain || 'General',
            category: categoryName,
            isEligible: backend?.isEligible ?? (evaluation.candidateScore >= 50),
            modelUsed: backend?.modelUsed || (apiResult ? 'ML Model' : 'Original Scoring'),
            mlPrediction: backend || null,
            eligibilityMessage: evaluation.eligibilityMessage,
            eligibleCompanies: evaluation.eligibleCompanies,
            nonEligibleCompanies: evaluation.nonEligibleCompanies,
            eligiblePercent: evaluation.eligiblePercent,
            nonEligiblePercent: evaluation.nonEligiblePercent,
            breakdown: backendBreakdown || {
              academics: evaluation.scoreBreakdown.academic,
              skills: evaluation.scoreBreakdown.skills,
              experience: evaluation.scoreBreakdown.experience,
              projects: evaluation.scoreBreakdown.projects || 0,
            },
            achievements: parsedFormData.achievements || '',
            certifications: parsedFormData.certifications || '',
            hackathons: {
              participated: !!parsedFormData.hackathonsParticipated,
              count: parsedFormData.numHackathons || 0,
              winner: parsedFormData.hackathonWinner === 'yes'
            },
            internships: {
              completed: !!parsedFormData.internshipsCompleted,
              count: parsedFormData.numInternships || 0
            }
          });
        } catch (e) {
        const evaluation = evaluateCandidate(parsedFormData);
        let filteredDomains = evaluation.jobDomainsAndRoles;
        if (parsedFormData.selectedDomainId) {
          const sel = parsedFormData.selectedDomainId.toLowerCase();
          const byExact = evaluation.jobDomainsAndRoles.filter(d => d.domain.toLowerCase() === sel);
          const byContains = byExact.length ? byExact : evaluation.jobDomainsAndRoles.filter(d => d.domain.toLowerCase().includes(sel));
          filteredDomains = byContains.length ? byContains : evaluation.jobDomainsAndRoles;
        }
        let chosenRoleSkills = [];
        if (parsedFormData.selectedDomainId && parsedFormData.selectedRoleId) {
          const jobDomain = getJobDomainById(parsedFormData.selectedDomainId);
          const roleObj = jobDomain?.roles?.find(r => r.id === parsedFormData.selectedRoleId);
          if (roleObj?.skills) chosenRoleSkills = roleObj.skills;
        }
        const providedSkills = parsedFormData.selectedSkills || [];
        const missingRoleSkills = chosenRoleSkills.filter(s => !providedSkills.some(ps => ps.toLowerCase() === s.toLowerCase()));

        setPredictionData({
          placementScore: evaluation.candidateScore,
          academicScore: evaluation.scoreBreakdown.academic,
          skillScore: evaluation.scoreBreakdown.skills,
          expScore: evaluation.scoreBreakdown.experience,
          missingSkills: evaluation.missingSkills || [],
          missingRoleSkills,
          chosenRoleSkills,
          recommendedRoles: filteredDomains.flatMap(d => d.roles),
          jobDomainsAndRoles: filteredDomains,
          projectAnalysis: evaluation.projectAnalysis || { strong: [], basic: [] },
          chosenRole: evaluation.chosenRole || null,
          suggestions: evaluation.suggestions || [],
          personalizationLevel: evaluation.candidateScore >= 75 ? 'high' : (evaluation.candidateScore < 40 ? 'low' : 'medium'),
          domain: parsedFormData.selectedDomainId || parsedFormData.customDomain || 'General',
          category: parsedFormData.selectedCategoryId || 'General',
          isEligible: evaluation.candidateScore >= 50,
          modelUsed: 'Original Scoring',
          mlPrediction: null,
          eligibilityMessage: evaluation.eligibilityMessage,
          eligibleCompanies: evaluation.eligibleCompanies,
          nonEligibleCompanies: evaluation.nonEligibleCompanies,
          eligiblePercent: evaluation.eligiblePercent,
          nonEligiblePercent: evaluation.nonEligiblePercent,
          breakdown: {
            academics: evaluation.scoreBreakdown.academic,
            skills: evaluation.scoreBreakdown.skills,
            experience: evaluation.scoreBreakdown.experience,
            projects: evaluation.scoreBreakdown.projects || 0,
          },
          achievements: parsedFormData.achievements || '',
          certifications: parsedFormData.certifications || '',
          hackathons: {
            participated: !!parsedFormData.hackathonsParticipated,
            count: parsedFormData.numHackathons || 0,
            winner: parsedFormData.hackathonWinner === 'yes'
          },
          internships: {
            completed: !!parsedFormData.internshipsCompleted,
            count: parsedFormData.numInternships || 0
          }
        });
      } finally {
        setLoading(false);
      }
    }, 800);
    }
  }, []);

  // Function to get career paths based on domain selection
  const getCareerPathsData = () => {
    if (!selectedDomain?.selectedDomainId) {
      console.log('No selectedDomainId found');
      return null;
    }

    const selectedDomainId = selectedDomain.selectedDomainId;
    console.log('Looking for career paths for domain ID:', selectedDomainId);

    // Find the domain by ID (like "btech_cse", "btech_mechanical", etc.)
    const domain = domainsData.find(d => d.id === selectedDomainId);
    
    if (domain) {
      console.log('Found domain:', domain.name);
      
      // First, try to find the best matching category based on user's skills or recommendations
      let bestMatchCategory = null;
      let bestMatchScore = 0;
      
      if (predictionData?.recommendations && Array.isArray(predictionData.recommendations)) {
        const recommendationsText = predictionData.recommendations.join(' ').toLowerCase();
        
        for (const category of domain.categories) {
          if (category.keywords && category.careerPaths) {
            const matchCount = category.keywords.reduce((count, keyword) => {
              return count + (recommendationsText.includes(keyword.toLowerCase()) ? 1 : 0);
            }, 0);
            
            if (matchCount > bestMatchScore) {
              bestMatchScore = matchCount;
              bestMatchCategory = category;
            }
          }
        }
      }
      
      // If we found a good match based on keywords, use that
      if (bestMatchCategory && bestMatchScore > 0) {
        console.log('Found best matching category by keywords:', bestMatchCategory.name, 'Score:', bestMatchScore);
        return bestMatchCategory.careerPaths;
      }
      
      // Otherwise, look for the first category with career paths in this domain
      for (const category of domain.categories) {
        if (category.careerPaths) {
          console.log('Found career paths in category:', category.name, 'ID:', category.id);
          return category.careerPaths;
        }
      }
      
      console.log('Domain found but no categories have career paths:', domain.name);
    } else {
      console.log('Domain not found with ID:', selectedDomainId);
      
      // Fallback: try to find as category ID in case it's stored differently
      for (const d of domainsData) {
        for (const category of d.categories) {
          if (category.id === selectedDomainId && category.careerPaths) {
            console.log('Found as category ID:', selectedDomainId, 'in domain:', d.name);
            return category.careerPaths;
          }
        }
      }
    }

    // If still no match found, try to find by keywords from recommendations
    if (predictionData?.recommendations && Array.isArray(predictionData.recommendations)) {
      const recommendationsText = predictionData.recommendations.join(' ').toLowerCase();
      console.log('Searching by keywords in recommendations:', recommendationsText.substring(0, 100) + '...');
      
      for (const d of domainsData) {
        for (const category of d.categories) {
          if (category.keywords && category.careerPaths) {
            const keywordMatch = category.keywords.some(keyword => 
              recommendationsText.includes(keyword.toLowerCase())
            );
            if (keywordMatch) {
              console.log('Found category by recommendation keywords:', category.id, 'in domain:', d.name);
              return category.careerPaths;
            }
          }
        }
      }
    }

    console.log('No career paths found for domain/category:', selectedDomainId);
    return null;
  };

  const careerPathsData = getCareerPathsData();
  
  // Add debugging for career paths
  console.log('Career paths data:', careerPathsData);
  console.log('Career paths data type:', typeof careerPathsData);
  console.log('Career paths exists:', !!careerPathsData);

  if (!predictionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Prediction Results Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            It looks like you haven't completed a prediction yet, or your data might have been cleared.
          </p>
          <div className="space-y-3">
            <Link 
              to="/predict" 
              onClick={clearStoredPrediction}
              className="block w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Take Placement Prediction Test
            </Link>
            <Link 
              to="/domains" 
              className="block w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#1e1a2e] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Browse Job Domains
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const twelfthScoreInfo = interpretSchoolScore(predictionData.inputData?.twelfthPercentage);
  const tenthScoreInfo = interpretSchoolScore(predictionData.inputData?.tenthPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                Placement Analysis Report
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent mb-4">
              Your Career Potential
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              AI-powered comprehensive analysis of your placement readiness and career prospects
            </p>
          </div>

          {/* Main Score Display */}
          <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-xl dark:shadow-glow p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full -translate-y-32 translate-x-32 opacity-30"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-6">
                  <CircularProgress 
                    percentage={predictionData.placementScore || 0} 
                    size={160} 
                    strokeWidth={12}
                    label="Overall Score"
                    color={
                      (predictionData.placementScore || 0) >= 80 ? 'green' :
                      (predictionData.placementScore || 0) >= 60 ? 'orange' : 'red'
                    }
                  />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {(predictionData.placementScore || 0) >= 80 ? 'Excellent' : 
                   (predictionData.placementScore || 0) >= 60 ? 'Good' : 'Needs Improvement'} Placement Potential
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Based on {predictionData.modelUsed || 'comprehensive'} analysis
                </p>
              </div>

              {/* Score Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <ScoreCard
                  title="Academic"
                  score={predictionData.academicScore || 0}
                  maxScore={100}
                  description="CGPA & Academic Performance"
                  icon=""
                  color="blue"
                />
                <ScoreCard
                  title="Skills"
                  score={predictionData.skillScore || 0}
                  maxScore={100}
                  description="Technical & Domain Skills"
                  icon=""
                  color="green"
                />
                <ScoreCard
                  title="Projects"
                  score={predictionData.projectScore || 0}
                  maxScore={100}
                  description="Project Quality & Impact"
                  icon=""
                  color="purple"
                />
                <ScoreCard
                  title="DSA"
                  score={predictionData.dsaScore || 0}
                  maxScore={100}
                  description="Problem Solving Skills"
                  icon=""
                  color="indigo"
                />
                <ScoreCard
                  title="Experience"
                  score={predictionData.experienceScore || 0}
                  maxScore={10}
                  description="Internships & Work Experience"
                  icon=""
                  color="orange"
                />
              </div>

              {/* Career Role Match Section */}
              {formData && formData.selectedDomainId && formData.selectedRoleId && (() => {
                const domain = getJobDomainById(formData.selectedDomainId);
                const role = domain?.roles?.find(r => r.id === formData.selectedRoleId);
                
                if (!domain || !role) return null;
                
                // Career progression and related roles mapping (Ordered by seniority)
                const careerPathMap = {
                  // Data & Analytics
                  'data_analyst': {
                    nextRoles: ['Senior Data Analyst', 'Data Scientist', 'Data Engineer'],
                    relatedRoles: ['Business Analyst', 'BI Analyst'],
                    skillGap: 'medium'
                  },
                  'business_analyst': {
                    nextRoles: ['Senior Business Analyst', 'Product Manager', 'Data Analyst'],
                    relatedRoles: ['Data Analyst', 'BI Analyst'],
                    skillGap: 'medium'
                  },
                  'bi_analyst': {
                    nextRoles: ['Senior BI Analyst', 'Data Engineer', 'Analytics Manager'],
                    relatedRoles: ['Data Analyst', 'Business Analyst'],
                    skillGap: 'medium'
                  },
                  'data_engineer': {
                    nextRoles: ['Senior Data Engineer', 'Big Data Engineer', 'Data Architect'],
                    relatedRoles: ['Data Scientist', 'ML Engineer'],
                    skillGap: 'high'
                  },
                  'big_data_engineer': {
                    nextRoles: ['Senior Big Data Engineer', 'Data Architect', 'Engineering Manager'],
                    relatedRoles: ['Data Engineer', 'Cloud Engineer'],
                    skillGap: 'high'
                  },
                  'junior_data_scientist': {
                    nextRoles: ['Data Scientist', 'ML Engineer', 'Senior Data Scientist'],
                    relatedRoles: ['Data Analyst', 'Data Engineer'],
                    skillGap: 'medium'
                  },
                  'data_scientist': {
                    nextRoles: ['Senior Data Scientist', 'Lead Data Scientist', 'ML Engineer'],
                    relatedRoles: ['ML Engineer', 'Data Engineer'],
                    skillGap: 'high'
                  },
                  'quantitative_analyst': {
                    nextRoles: ['Senior Quantitative Analyst', 'Quantitative Researcher', 'Risk Manager'],
                    relatedRoles: ['Data Scientist', 'Research Analyst'],
                    skillGap: 'high'
                  },
                  'research_analyst': {
                    nextRoles: ['Senior Research Analyst', 'Data Scientist', 'Research Manager'],
                    relatedRoles: ['Data Analyst', 'Business Analyst'],
                    skillGap: 'medium'
                  },
                  
                  // Web Development
                  'frontend_developer': {
                    nextRoles: ['Senior Frontend Developer', 'Full-Stack Developer', 'Tech Lead'],
                    relatedRoles: ['UI/UX Developer', 'Full-Stack Developer'],
                    skillGap: 'medium'
                  },
                  'backend_developer': {
                    nextRoles: ['Senior Backend Developer', 'Full-Stack Developer', 'Solutions Architect'],
                    relatedRoles: ['Full-Stack Developer', 'DevOps Engineer'],
                    skillGap: 'medium'
                  },
                  'fullstack_developer': {
                    nextRoles: ['Senior Full-Stack Developer', 'Tech Lead', 'Solutions Architect'],
                    relatedRoles: ['Backend Developer', 'Frontend Developer'],
                    skillGap: 'high'
                  },
                  'uiux_developer': {
                    nextRoles: ['Senior UI/UX Designer', 'Product Designer', 'Design Lead'],
                    relatedRoles: ['Frontend Developer', 'Product Designer'],
                    skillGap: 'medium'
                  },
                  
                  // Mobile Development
                  'android_developer': {
                    nextRoles: ['Senior Android Developer', 'Cross-Platform Developer', 'Mobile Tech Lead'],
                    relatedRoles: ['iOS Developer', 'Cross-Platform Developer'],
                    skillGap: 'medium'
                  },
                  'ios_developer': {
                    nextRoles: ['Senior iOS Developer', 'Cross-Platform Developer', 'Mobile Tech Lead'],
                    relatedRoles: ['Android Developer', 'Cross-Platform Developer'],
                    skillGap: 'medium'
                  },
                  'cross_platform_developer': {
                    nextRoles: ['Senior Cross-Platform Developer', 'Mobile Architect', 'Tech Lead'],
                    relatedRoles: ['Android Developer', 'iOS Developer'],
                    skillGap: 'medium'
                  },
                  'mobile_app_tester': {
                    nextRoles: ['Senior QA Engineer', 'QA Lead', 'Test Automation Architect'],
                    relatedRoles: ['QA Engineer', 'Automation Engineer'],
                    skillGap: 'medium'
                  },
                  
                  // AI/ML
                  'ml_engineer': {
                    nextRoles: ['Senior ML Engineer', 'Lead ML Engineer', 'ML Architect'],
                    relatedRoles: ['Data Scientist', 'AI Engineer'],
                    skillGap: 'high'
                  },
                  'ai_engineer': {
                    nextRoles: ['Senior AI Engineer', 'ML Engineer', 'AI Architect'],
                    relatedRoles: ['ML Engineer', 'Data Scientist'],
                    skillGap: 'high'
                  },
                  'data_scientist_ml': {
                    nextRoles: ['Senior Data Scientist', 'ML Engineer', 'Lead Data Scientist'],
                    relatedRoles: ['ML Engineer', 'Data Engineer'],
                    skillGap: 'high'
                  },
                  'nlp_engineer': {
                    nextRoles: ['Senior NLP Engineer', 'ML Engineer', 'AI Research Scientist'],
                    relatedRoles: ['ML Engineer', 'AI Engineer'],
                    skillGap: 'high'
                  },
                  'computer_vision_engineer': {
                    nextRoles: ['Senior CV Engineer', 'ML Engineer', 'AI Research Scientist'],
                    relatedRoles: ['ML Engineer', 'AI Engineer'],
                    skillGap: 'high'
                  },
                  
                  // Cloud & DevOps
                  'cloud_engineer': {
                    nextRoles: ['Senior Cloud Engineer', 'Cloud Architect', 'Solutions Architect'],
                    relatedRoles: ['DevOps Engineer', 'Site Reliability Engineer'],
                    skillGap: 'high'
                  },
                  'devops_engineer': {
                    nextRoles: ['Senior DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
                    relatedRoles: ['Cloud Engineer', 'Backend Developer'],
                    skillGap: 'high'
                  },
                  'sre': {
                    nextRoles: ['Senior SRE', 'SRE Lead', 'Platform Architect'],
                    relatedRoles: ['DevOps Engineer', 'Cloud Engineer'],
                    skillGap: 'high'
                  },
                  
                  // Cybersecurity
                  'security_analyst': {
                    nextRoles: ['Senior Security Analyst', 'Security Engineer', 'SOC Lead'],
                    relatedRoles: ['SOC Analyst', 'Security Engineer'],
                    skillGap: 'high'
                  },
                  'penetration_tester': {
                    nextRoles: ['Senior Penetration Tester', 'Security Architect', 'Red Team Lead'],
                    relatedRoles: ['Security Analyst', 'Security Engineer'],
                    skillGap: 'high'
                  },
                  'security_engineer': {
                    nextRoles: ['Senior Security Engineer', 'Security Architect', 'CISO'],
                    relatedRoles: ['Security Analyst', 'Penetration Tester'],
                    skillGap: 'high'
                  },
                  
                  // QA & Testing
                  'qa_engineer': {
                    nextRoles: ['Senior QA Engineer', 'QA Lead', 'Test Architect'],
                    relatedRoles: ['Automation Engineer', 'SDET'],
                    skillGap: 'medium'
                  },
                  'automation_engineer': {
                    nextRoles: ['Senior Automation Engineer', 'SDET', 'QA Architect'],
                    relatedRoles: ['QA Engineer', 'DevOps Engineer'],
                    skillGap: 'medium'
                  },
                  
                  // Blockchain
                  'blockchain_developer': {
                    nextRoles: ['Senior Blockchain Developer', 'Blockchain Architect', 'Tech Lead'],
                    relatedRoles: ['Smart Contract Developer', 'Backend Developer'],
                    skillGap: 'high'
                  },
                  'smart_contract_developer': {
                    nextRoles: ['Senior Smart Contract Developer', 'Blockchain Architect', 'Security Auditor'],
                    relatedRoles: ['Blockchain Developer', 'Security Engineer'],
                    skillGap: 'high'
                  }
                };
                
                const careerPath = careerPathMap[role.id];
                
                return (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl p-6 mb-6 border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-cyan-500 dark:bg-cyan-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          Your Career Role Match
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Based on your profile analysis and selected preferences
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-white dark:bg-[#1e1a2e] rounded-xl p-4">
                            <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Domain</div>
                            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{domain.name}</div>
                          </div>
                          <div className="bg-white dark:bg-[#1e1a2e] rounded-xl p-4">
                            <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Best Suited Role</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{role.name}</div>
                          </div>
                        </div>
                        
                        {role.description && (
                          <div className="mb-4 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg p-3">
                            <p className="text-sm text-cyan-900 dark:text-cyan-300">
                              <span className="font-semibold">Role Overview:</span> {role.description}
                            </p>
                          </div>
                        )}
                        
                        {careerPath && (
                          <>
                            {/* Career Growth Path */}
                            {careerPath.nextRoles && careerPath.nextRoles.length > 0 && (
                              <div className="mb-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  Career Growth Path - Next Level Roles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {careerPath.nextRoles.map((nextRole, idx) => (
                                    <span key={idx} className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                                      {nextRole}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Related Roles */}
                            {careerPath.relatedRoles && careerPath.relatedRoles.length > 0 && (
                              <div className="mb-4 bg-purple-100 dark:bg-purple-900/40 rounded-lg p-3">
                                <p className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  Related Roles You Can Explore
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {careerPath.relatedRoles.map((relatedRole, idx) => (
                                    <span key={idx} className="bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-medium">
                                      {relatedRole}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Skill Gap Indicator */}
                            {careerPath.skillGap && (
                              <div className={`rounded-lg p-3 ${
                                careerPath.skillGap === 'high' 
                                  ? 'bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700'
                                  : 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700'
                              }`}>
                                <p className={`text-xs font-semibold mb-1 flex items-center ${
                                  careerPath.skillGap === 'high'
                                    ? 'text-orange-900 dark:text-orange-300'
                                    : 'text-green-900 dark:text-green-300'
                                }`}>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Skill Development Required
                                </p>
                                <p className={`text-xs ${
                                  careerPath.skillGap === 'high'
                                    ? 'text-orange-800 dark:text-orange-400'
                                    : 'text-green-800 dark:text-green-400'
                                }`}>
                                  {careerPath.skillGap === 'high'
                                    ? 'Advanced roles require significant upskilling. Focus on mastering domain-specific technical skills and gaining hands-on experience through projects.'
                                    : 'Moderate upskilling needed. Continue building your domain skills while gaining practical experience to transition smoothly.'}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top Recruiting Companies Section */}
              {formData && formData.selectedDomainId && formData.selectedRoleId && (() => {
                const domain = getJobDomainById(formData.selectedDomainId);
                const role = domain?.roles?.find(r => r.id === formData.selectedRoleId);
                
                if (!domain || !role) return null;
                
                // Company recruitment data by role - Based on Official Company Criteria (2024-25)
                const companyRecruitmentMap = {
                  // Data & Analytics
                  'data_analyst': {
                    companies: [
                      // Product-Based (Verified eligibility criteria from company career pages)
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Walmart Labs', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'EY', type: 'Service', tier: 'Top', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } }
                    ]
                  },
                  'business_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Walmart Labs', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'McKinsey', type: 'Service', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'data_scientist': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'data_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Walmart Labs', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 1 } },
                      // Startups
                      { name: 'Uber', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Airbnb', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'frontend_developer': {
                    companies: [
                      // Product-Based (Google: No CGPA cutoff officially, Microsoft/Amazon: 6.5-7.0, Meta: 6.5+, Adobe: 6.0+)
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Top', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      // Startups (Razorpay/PhonePe: 6.0+, Swiggy/Zomato: 6.0+, Ola: 6.0+)
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      // Service-Based (Accenture: 6.0/60%, Capgemini: 6.0/60%, Infosys: 6.0/60%, TCS: 6.0/60%, Wipro: 6.0/55%)
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 55, percentage10: 55, backlog: 3 } }
                    ]
                  },
                  'backend_developer': {
                    companies: [
                      // Product-Based (Google/Microsoft/Amazon: 6.5-7.0+, Netflix: 7.0+, Uber: 6.5+)
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Netflix', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Uber', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 55, percentage10: 55, backlog: 3 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } }
                    ]
                  },
                  'fullstack_developer': {
                    companies: [
                      // Product-Based (Verified from official career pages - most require 60% throughout)
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 60, percentage10: 60, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      // Service-Based (Accenture: 60% all, Capgemini: 60%, TCS Digital: 60%, Wipro/Infosys: 55-60%)
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 2 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 55, percentage10: 55, backlog: 3 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 3 } }
                    ]
                  },
                  'android_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Paytm', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'ios_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Apple', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'ml_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'OpenAI', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Hugging Face', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'cloud_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Amazon Web Services', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft Azure', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google Cloud', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'DigitalOcean', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'devops_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Netflix', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Uber', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'qa_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 3 } }
                    ]
                  },
                  'cybersecurity_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Cisco', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Paytm', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'blockchain_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Coinbase', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'IBM Blockchain', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Polygon', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'WazirX', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'CoinDCX', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'ui_ux_designer': {
                    companies: [
                      // Product-Based
                      { name: 'Adobe', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'product_manager': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'game_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Unity Technologies', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Epic Games', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft (Xbox)', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon Game Studios', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Google (Stadia)', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Dream11', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Mobile Premier League', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Nazara Games', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'WinZO Games', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Octro', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'embedded_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Intel', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Qualcomm', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Texas Instruments', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Nvidia', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Samsung', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Ather Energy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Ola Electric', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Bosch India', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Robert Bosch', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Continental', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'HCL', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'system_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 3 } }
                    ]
                  },
                  'network_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Cisco', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Juniper Networks', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'database_administrator': {
                    companies: [
                      // Product-Based
                      { name: 'Oracle', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'sap_consultant': {
                    companies: [
                      // Product-Based
                      { name: 'SAP', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'ai_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Nvidia', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'OpenAI', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Hugging Face', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'nlp_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'OpenAI', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Hugging Face', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Research', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'computer_vision_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Tesla', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Nvidia', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Good', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Ola Electric', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Ather Energy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Research', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'sre': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Netflix', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Uber', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 1 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'security_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Cisco', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Paytm', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'penetration_tester': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Cisco', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Paytm', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'security_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Cisco', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'IBM', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Paytm', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'automation_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 3 } }
                    ]
                  },
                  'smart_contract_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Coinbase', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'IBM Blockchain', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Oracle', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Polygon', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'WazirX', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'CoinDCX', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'bi_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Walmart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'EY', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'big_data_engineer': {
                    companies: [
                      // Product-Based
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Uber', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Walmart Labs', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'junior_data_scientist': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'quantitative_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Goldman Sachs', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'JP Morgan', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Morgan Stanley', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Deutsche Bank', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Citadel', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Paytm', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'EY', type: 'Service', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'research_analyst': {
                    companies: [
                      // Product-Based
                      { name: 'Google Research', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Microsoft Research', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Razorpay', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'McKinsey', type: 'Service', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'TCS Research', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'uiux_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Adobe', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'TCS Digital', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 2 } }
                    ]
                  },
                  'cross_platform_developer': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Walmart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Cognizant', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  },
                  'mobile_app_tester': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Flipkart', type: 'Product', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      // Startups
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 0 } },
                      { name: 'PhonePe', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      { name: 'Meesho', type: 'Startup', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 1 } },
                      // Service-Based
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Capgemini', type: 'Service', tier: 'Good', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'TCS', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.0, percentage12: 50, percentage10: 50, backlog: 3 } }
                    ]
                  },
                  'data_scientist_ml': {
                    companies: [
                      // Product-Based
                      { name: 'Google', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Microsoft', type: 'Product', tier: 'Top', criteria: { cgpa: 8.0, percentage12: 80, percentage10: 80, backlog: 0 } },
                      { name: 'Meta', type: 'Product', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Amazon', type: 'Product', tier: 'Good', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Adobe', type: 'Product', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      // Startups
                      { name: 'OpenAI', type: 'Startup', tier: 'Top', criteria: { cgpa: 7.5, percentage12: 75, percentage10: 75, backlog: 0 } },
                      { name: 'Hugging Face', type: 'Startup', tier: 'Good', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Swiggy', type: 'Startup', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'Zomato', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Ola', type: 'Startup', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      // Service-Based
                      { name: 'Deloitte', type: 'Service', tier: 'Top', criteria: { cgpa: 7.0, percentage12: 70, percentage10: 70, backlog: 0 } },
                      { name: 'Accenture', type: 'Service', tier: 'Good', criteria: { cgpa: 6.5, percentage12: 65, percentage10: 65, backlog: 0 } },
                      { name: 'TCS Research', type: 'Service', tier: 'Mass', criteria: { cgpa: 6.0, percentage12: 60, percentage10: 60, backlog: 1 } },
                      { name: 'Infosys', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } },
                      { name: 'Wipro', type: 'Service', tier: 'Mass', criteria: { cgpa: 5.5, percentage12: 55, percentage10: 55, backlog: 2 } }
                    ]
                  }
                };

                const skillFriendlyCompanyMap = {
                  default: [
                    {
                      name: 'Tech Mahindra',
                      type: 'Service',
                      tier: 'Mass',
                      notes: 'Known for relaxed 10th/12th criteria when skills and project work are strong.',
                      criteria: { cgpa: 5.5, percentage12: 55, percentage10: 50, backlog: 3 }
                    },
                    {
                      name: 'HCLTech',
                      type: 'Service',
                      tier: 'Mass',
                      notes: 'Focuses on technical certifications and CGPA; past academics have flexible thresholds.',
                      criteria: { cgpa: 5.5, percentage12: 55, percentage10: 50, backlog: 3 }
                    },
                    {
                      name: 'Mindtree',
                      type: 'Service',
                      tier: 'Good',
                      notes: 'Evaluates candidates on aptitude plus coding rounds with flexible school marks.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Persistent Systems',
                      type: 'Service',
                      tier: 'Good',
                      notes: 'Allows lower 10th/12th if candidates clear technical assessments.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 0, backlog: 2 }
                    },
                    {
                      name: 'Zoho',
                      type: 'Product',
                      tier: 'Good',
                      notes: 'Project-heavy interviews with no strict 10th/12th cut-offs.',
                      criteria: { cgpa: 6.0, percentage12: 0, percentage10: 0, backlog: 2 }
                    },
                    {
                      name: 'Freshworks',
                      type: 'Product',
                      tier: 'Good',
                      notes: 'Prefers strong UI/product sense over rigid school percentages.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'BrowserStack',
                      type: 'Product',
                      tier: 'Good',
                      notes: 'Hands-on coding rounds; marks are flexible if projects are solid.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'InMobi',
                      type: 'Product',
                      tier: 'Good',
                      notes: 'Looks at problem-solving strength more than school academics.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Paytm Labs',
                      type: 'Product',
                      tier: 'Good',
                      notes: 'Skill-first hiring with relaxed historical cut-offs.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Meesho',
                      type: 'Startup',
                      tier: 'Mass',
                      notes: 'Portfolio and take-home challenge outweigh school scores.',
                      criteria: { cgpa: 5.5, percentage12: 50, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Cure.fit',
                      type: 'Startup',
                      tier: 'Good',
                      notes: 'Prefers demonstrable product skills and internships.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Groww',
                      type: 'Startup',
                      tier: 'Good',
                      notes: 'Case-study driven process with flexible academics.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Licious',
                      type: 'Startup',
                      tier: 'Mass',
                      notes: 'Hackathon and assignment driven evaluations.',
                      criteria: { cgpa: 5.5, percentage12: 50, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'ShareChat',
                      type: 'Startup',
                      tier: 'Good',
                      notes: 'Looks for real-world app building experience more than marks.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    }
                  ],
                  data_analyst: [
                    {
                      name: 'Fractal Analytics',
                      type: 'Startup',
                      tier: 'Good',
                      notes: 'Prioritises analytics projects and case performance over school percentages.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    },
                    {
                      name: 'Mu Sigma',
                      type: 'Service',
                      tier: 'Good',
                      notes: 'Focuses on aptitude and puzzle rounds; 10th/12th relaxations allowed for strong problem solving.',
                      criteria: { cgpa: 6.0, percentage12: 55, percentage10: 50, backlog: 2 }
                    }
                  ]
                };
                
                const companyData = companyRecruitmentMap[role.id];
                if (!companyData) return null;
                
                // Check user eligibility
                const userCGPA = predictionData.inputData?.collegeCGPA || 0;
                const user12th = twelfthScoreInfo.numeric;
                const user10th = tenthScoreInfo.numeric;
                const user12thDetail = twelfthScoreInfo.detail;
                const user10thDetail = tenthScoreInfo.detail;
                const userBacklogs = 0; // You can add this to form data if needed
                
                const checkEligibility = (criteria) => {
                  const barriers = [];
                  // Check all criteria
                  if (userCGPA < criteria.cgpa) barriers.push({ 
                    type: 'CGPA', 
                    canImprove: true,
                    message: `CGPA ${criteria.cgpa}+ required (You have ${userCGPA.toFixed(2)})`
                  });
                  if (user12th < criteria.percentage12) barriers.push({ 
                    type: '12th',
                    canImprove: false,
                    message: `12th: ${criteria.percentage12}%+ required (You have ${user12thDetail})`
                  });
                  if (user10th < criteria.percentage10) barriers.push({ 
                    type: '10th',
                    canImprove: false,
                    message: `10th: ${criteria.percentage10}%+ required (You have ${user10thDetail})`
                  });
                  if (userBacklogs > criteria.backlog) barriers.push({ 
                    type: 'Backlogs',
                    canImprove: true,
                    message: `Max ${criteria.backlog} backlog${criteria.backlog !== 1 ? 's' : ''} allowed (You have ${userBacklogs})`
                  });
                  return barriers;
                };
                
                // Get top 5 companies from each category
                const productCompanies = companyData.companies.filter(c => c.type === 'Product').slice(0, 5);
                const startupCompanies = companyData.companies.filter(c => c.type === 'Startup').slice(0, 5);
                const serviceCompanies = companyData.companies.filter(c => c.type === 'Service').slice(0, 5);
                
                const evaluateCompany = (company, source = 'primary') => {
                  const barriers = checkEligibility(company.criteria);
                  return {
                    company,
                    barriers,
                    isEligible: barriers.length === 0,
                    improvableBarriers: barriers.filter(b => b.canImprove),
                    historicalBarriers: barriers.filter(b => !b.canImprove),
                    source
                  };
                };

                const productEvaluated = productCompanies.map(company => evaluateCompany(company));
                const startupEvaluated = startupCompanies.map(company => evaluateCompany(company));
                const serviceEvaluated = serviceCompanies.map(company => evaluateCompany(company));
                const allEvaluated = [...productEvaluated, ...startupEvaluated, ...serviceEvaluated];

                const eligibleCompaniesList = allEvaluated.filter(item => item.isEligible);

                const fallbackPool = [
                  ...(skillFriendlyCompanyMap.default || []),
                  ...(skillFriendlyCompanyMap[role.id] || [])
                ];
                const uniqueFallback = fallbackPool.filter(fallbackCompany =>
                  !allEvaluated.some(({ company }) => company.name === fallbackCompany.name)
                );
                const fallbackEvaluated = uniqueFallback.map(company => evaluateCompany(company, 'fallback'));
                const additionalEligible = fallbackEvaluated.filter(item => item.isEligible);
                const combinedEligible = [...eligibleCompaniesList, ...additionalEligible];
                const combinedEligibleUnique = combinedEligible.filter((item, index, arr) =>
                  arr.findIndex(other => other.company.name === item.company.name) === index
                );

                const eligibleProduct = productEvaluated.filter(item => item.isEligible);
                const ineligibleProduct = productEvaluated.filter(item => !item.isEligible);
                const eligibleStartups = startupEvaluated.filter(item => item.isEligible);
                const ineligibleStartups = startupEvaluated.filter(item => !item.isEligible);
                const eligibleService = serviceEvaluated.filter(item => item.isEligible);
                const ineligibleService = serviceEvaluated.filter(item => !item.isEligible);

                const fallbackEligibleProduct = fallbackEvaluated.filter(item => item.company.type === 'Product' && item.isEligible);
                const fallbackEligibleStartups = fallbackEvaluated.filter(item => item.company.type === 'Startup' && item.isEligible);
                const fallbackEligibleService = fallbackEvaluated.filter(item => item.company.type === 'Service' && item.isEligible);

                const getEligibleDisplayList = (primaryList, fallbackList) => {
                  const display = [...primaryList];
                  fallbackList.forEach(item => {
                    if (display.length < 5 && !display.some(existing => existing.company.name === item.company.name)) {
                      display.push(item);
                    }
                  });
                  return display.slice(0, 5);
                };

                const getPrimaryReason = (item) => {
                  if (item.improvableBarriers.length > 0) return item.improvableBarriers[0].message;
                  if (item.historicalBarriers.length > 0) return item.historicalBarriers[0].message;
                  return 'Awaiting updated eligibility information';
                };

                const productEligibleDisplay = getEligibleDisplayList(eligibleProduct, fallbackEligibleProduct);
                const serviceEligibleDisplay = getEligibleDisplayList(eligibleService, fallbackEligibleService);
                const startupEligibleDisplay = getEligibleDisplayList(eligibleStartups, fallbackEligibleStartups);
                
                return (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-6 mb-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          Top Recruiting Companies
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Companies actively hiring for {role.name} positions
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mb-4 bg-white dark:bg-[#1e1a2e] rounded-lg p-2 inline-block">
                          <strong>Your Profile:</strong> CGPA: {userCGPA.toFixed(2)} | 12th: {user12th}% | 10th: {user10th}%
                        </div>
                        
                        {/* Product-Based Companies */}
                        {productEvaluated.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-3 flex items-center bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span>Product-Based Companies</span>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {productEligibleDisplay.length > 0
                                  ? `Top ${productEligibleDisplay.length} product companies ready to apply`
                                  : 'No product companies open right now'}
                              </div>
                              {productEligibleDisplay.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {productEligibleDisplay.map(({ company, source }, idx) => (
                                    <div
                                      key={`${company.name}-${idx}`}
                                      className="rounded-lg p-4 bg-white dark:bg-[#1e1a2e] border border-green-200 dark:border-green-700 shadow-sm dark:shadow-glow"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-semibold text-gray-900 dark:text-white text-base">
                                            {company.name}
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Product</span>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">{company.tier} Tier</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                          {source === 'fallback' && (
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Skill-friendly</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                                        Meets your current profile. Focus on interview practice and referrals.
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1a2e] border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                                  Gain experience through the flexible companies below, then revisit product buckets once CGPA/backlogs improve.
                                </div>
                              )}
                            </div>
                            {ineligibleProduct.length > 0 && (
                              <div className="bg-white dark:bg-[#1e1a2e] border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                                <div className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Currently locked product companies
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ineligibleProduct.map((item, idx) => (
                                    <div
                                      key={`prod-locked-${idx}`}
                                      className="text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-pink-500/20 rounded-full px-3 py-1 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]/40 flex items-center gap-2"
                                    >
                                      <span className="font-semibold text-gray-900 dark:text-white">{item.company.name}</span>
                                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{getPrimaryReason(item)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Startup Companies */}
                        {startupEvaluated.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-bold text-pink-800 dark:text-pink-300 mb-3 flex items-center bg-pink-50 dark:bg-pink-900/30 p-2 rounded-lg">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              <span>Startup Companies</span>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {startupEligibleDisplay.length > 0
                                  ? `Top ${startupEligibleDisplay.length} startups ready to interview`
                                  : 'No startup slots open right now'}
                              </div>
                              {startupEligibleDisplay.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {startupEligibleDisplay.map(({ company, source }, idx) => (
                                    <div
                                      key={`${company.name}-${idx}`}
                                      className="rounded-lg p-4 bg-white dark:bg-[#1e1a2e] border border-green-200 dark:border-green-700 shadow-sm dark:shadow-glow"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-semibold text-gray-900 dark:text-white text-base">
                                            {company.name}
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-800 dark:text-pink-300">Startup</span>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">{company.tier} Tier</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {source === 'fallback' && (
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Skill-friendly</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xs text-green-700 dark:text-green-300 font-semibold">
                                        Great cultural fit — highlight shipped projects and problem-solving wins.
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1a2e] border border-pink-200 dark:border-pink-700 rounded-lg p-4">
                                  Use hackathons, open-source, and referrals to spark startup conversations while building portfolio depth.
                                </div>
                              )}
                            </div>
                            {ineligibleStartups.length > 0 && (
                              <div className="bg-white dark:bg-[#1e1a2e] border border-pink-200 dark:border-pink-700 rounded-lg p-4">
                                <div className="text-xs font-semibold text-pink-900 dark:text-pink-200 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Currently locked startup options
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ineligibleStartups.map((item, idx) => (
                                    <div
                                      key={`start-locked-${idx}`}
                                      className="text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-pink-500/20 rounded-full px-3 py-1 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]/40 flex items-center gap-2"
                                    >
                                      <span className="font-semibold text-gray-900 dark:text-white">{item.company.name}</span>
                                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{getPrimaryReason(item)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Service-Based Companies */}
                        {serviceEvaluated.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>Service-Based Companies</span>
                            </div>
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {serviceEligibleDisplay.length > 0
                                  ? `Top ${serviceEligibleDisplay.length} service companies ready to hire`
                                  : 'No service companies open right now'}
                              </div>
                              {serviceEligibleDisplay.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {serviceEligibleDisplay.map(({ company, source }, idx) => (
                                    <div
                                      key={`${company.name}-${idx}`}
                                      className="rounded-lg p-4 bg-white dark:bg-[#1e1a2e] border border-green-200 dark:border-green-700 shadow-sm dark:shadow-glow"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <div className="font-semibold text-gray-900 dark:text-white text-base">
                                            {company.name}
                                          </div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">Service</span>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">{company.tier} Tier</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {source === 'fallback' && (
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Skill-friendly</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xs text-green-700 dark:text-green-300 font-semibold">
                                        Clear to apply — highlight internships, certifications, and problem-solving streak.
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1a2e] border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                  Use the skill-friendly companies below and keep sharpening aptitude/DSA to unlock service MNC drives.
                                </div>
                              )}
                            </div>
                            {ineligibleService.length > 0 && (
                              <div className="bg-white dark:bg-[#1e1a2e] border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Currently locked service companies
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ineligibleService.map((item, idx) => (
                                    <div
                                      key={`serv-locked-${idx}`}
                                      className="text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-pink-500/20 rounded-full px-3 py-1 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]/40 flex items-center gap-2"
                                    >
                                      <span className="font-semibold text-gray-900 dark:text-white">{item.company.name}</span>
                                      <span className="text-[11px] text-gray-600 dark:text-gray-400">{getPrimaryReason(item)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DSA Details */}
              {predictionData.inputData && (predictionData.inputData.dsaEasy !== undefined || predictionData.inputData.dsaMedium !== undefined || predictionData.inputData.dsaHard !== undefined) && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    DSA & Problem Solving Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1e1a2e] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {predictionData.inputData?.dsaEasy || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Easy Problems</div>
                    </div>
                    <div className="bg-white dark:bg-[#1e1a2e] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {predictionData.inputData?.dsaMedium || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Medium Problems</div>
                    </div>
                    <div className="bg-white dark:bg-[#1e1a2e] rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {predictionData.inputData?.dsaHard || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Hard Problems</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-xl p-4 text-center border-2 border-purple-300 dark:border-purple-700">
                      <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {predictionData.dsaScore || 0}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">DSA Score</div>
                    </div>
                  </div>

                  {/* Conditional Messages Based on DSA Progress */}
                  {(() => {
                    const easy = predictionData.inputData?.dsaEasy || 0;
                    const medium = predictionData.inputData?.dsaMedium || 0;
                    const hard = predictionData.inputData?.dsaHard || 0;
                    const totalDSA = easy + medium + hard;

                    // No DSA done at all
                    if (totalDSA === 0) {
                      return (
                        <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">Start with Basic DSA!</h4>
                              <p className="text-sm text-red-800 dark:text-red-400 mb-2">
                                Begin your DSA journey with fundamental topics to build a strong foundation:
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-medium">Arrays</span>
                                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-medium">Strings</span>
                                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-medium">Mathematics</span>
                                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-medium">Basic Loops</span>
                                <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-medium">Sorting</span>
                              </div>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                After covering the basics, focus on your domain-specific skills for better placement opportunities.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Good progress: Easy >= 50, Medium >= 20, Hard >= 3
                    if (easy >= 50 && medium >= 20 && hard >= 3) {
                      return (
                        <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Excellent DSA Foundation!</h4>
                              <p className="text-sm text-green-800 dark:text-green-400 mb-2">
                                You've completed the basic DSA requirements with {easy} Easy, {medium} Medium, and {hard} Hard problems.
                              </p>
                              <div className="bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg p-3 mt-3">
                                <p className="text-sm text-green-900 dark:text-green-300 font-semibold mb-1">Next Step: Prioritize Domain Skills</p>
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  Now majorly focus on domain-specific technical skills and practical projects while continuing DSA practice to maximize your placement potential.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Some progress but not enough
                    if (totalDSA > 0 && totalDSA < 73) {
                      const remaining = {
                        easy: Math.max(0, 50 - easy),
                        medium: Math.max(0, 20 - medium),
                        hard: Math.max(0, 3 - hard)
                      };
                      
                      return (
                        <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Keep Going! You're Making Progress</h4>
                              <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                                You've solved {totalDSA} problems so far. Here's what's needed to reach a solid baseline:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                {remaining.easy > 0 && (
                                  <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-center">
                                    <div className="text-xs text-blue-600 dark:text-blue-400">Easy Remaining</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-300">{remaining.easy}</div>
                                  </div>
                                )}
                                {remaining.medium > 0 && (
                                  <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-center">
                                    <div className="text-xs text-blue-600 dark:text-blue-400">Medium Remaining</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-300">{remaining.medium}</div>
                                  </div>
                                )}
                                {remaining.hard > 0 && (
                                  <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-center">
                                    <div className="text-xs text-blue-600 dark:text-blue-400">Hard Remaining</div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-300">{remaining.hard}</div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-blue-700 dark:text-blue-400">
                                Balance DSA practice with domain skills development for well-rounded preparation.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              )}


            </div>
          </div>

          {/* Projects Section */}
          {predictionData.strongProjects && predictionData.strongProjects.length > 0 && (
            <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-xl dark:shadow-glow p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                Strong Projects Identified
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {predictionData.strongProjects.map((project, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300 flex-1">{project}</h4>
                      <div className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium ml-4">
                        High Impact
                      </div>
                    </div>
                    <p className="text-purple-700 dark:text-purple-400 text-sm">
                      Project Depth: {predictionData.projectDepth || 'Advanced level detected'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility Overview */}
          {predictionData.eligibilityMessage && (
            <div className="bg-white dark:bg-[#1e1a2e] rounded-3xl shadow-xl dark:shadow-glow p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Company Eligibility Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <div className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-200 dark:border-green-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
                    <div className="relative z-10">
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{predictionData.eligiblePercent}%</div>
                      <div className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">Eligible Companies</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Ready for placement</div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl border border-orange-200 dark:border-orange-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
                    <div className="relative z-10">
                      <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{predictionData.nonEligiblePercent}%</div>
                      <div className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-1">Needs Improvement</div>
                      <div className="text-sm text-orange-600 dark:text-orange-400">Focus areas identified</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Analysis */}
          {predictionData.projectAnalysis && (predictionData.projectAnalysis.strong.length > 0 || predictionData.projectAnalysis.basic.length > 0) && (
            <div className="bg-white dark:bg-[#1e1a2e] rounded-xl shadow-sm dark:shadow-glow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Strong & Unique Projects</h3>
              {predictionData.projectAnalysis.strong.length > 0 ? (
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                  {predictionData.projectAnalysis.strong.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mb-4">No advanced projects detected yet.</p>
              )}

              {predictionData.projectAnalysis.basic.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Basic Tutorial-like Projects (Upgrade Suggested)</h4>
                  <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                    {predictionData.projectAnalysis.basic.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Skills Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* All Domain Skills */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-3xl shadow-xl dark:shadow-glow p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-900/30 rounded-full -translate-y-16 translate-x-16 opacity-40"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">All Required Skills</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">For Your Selected Role</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1e1a2e] rounded-xl px-4 py-2 shadow-md">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(() => {
                        // Get all domain skills from chosenRoleSkills or calculate from formData
                        let allDomainSkills = predictionData?.chosenRoleSkills || [];
                        
                        // If not in predictionData, get from formData
                        if (allDomainSkills.length === 0 && formData?.selectedDomainId && formData?.selectedRoleId) {
                          const jobDomain = getJobDomainById(formData.selectedDomainId);
                          const roleObj = jobDomain?.roles?.find(r => r.id === formData.selectedRoleId);
                          if (roleObj?.skills) {
                            allDomainSkills = roleObj.skills;
                          }
                        }
                        
                        return allDomainSkills.length;
                      })()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>

                {(() => {
                  // Get all domain skills from chosenRoleSkills or calculate from formData
                  let allDomainSkills = predictionData?.chosenRoleSkills || [];
                  
                  // If not in predictionData, get from formData
                  if (allDomainSkills.length === 0 && formData?.selectedDomainId && formData?.selectedRoleId) {
                    const jobDomain = getJobDomainById(formData.selectedDomainId);
                    const roleObj = jobDomain?.roles?.find(r => r.id === formData.selectedRoleId);
                    if (roleObj?.skills) {
                      allDomainSkills = roleObj.skills;
                    }
                  }
                  
                  const formSelected = predictionData?.inputData?.selectedSkills || [];
                  // Only use selectedSkills, not resume parsed skills
                  // Resume parsed skills are stored separately, but selectedSkills reflects user's final choice
                  const userSkills = [...new Set([...formSelected])];
                  
                  return allDomainSkills.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {allDomainSkills.map((skill, index) => {
                          const hasSkill = userSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                          return (
                            <div 
                              key={index}
                              className={`group border rounded-xl px-3 py-2 flex items-center space-x-2 transition-all duration-300 ${
                                hasSkill 
                                  ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700' 
                                  : 'bg-white dark:bg-[#1e1a2e] border-blue-200 dark:border-blue-700 opacity-60'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                hasSkill 
                                  ? 'bg-green-500 dark:bg-green-600' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}>
                                {hasSkill ? (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <span className={`font-medium text-sm ${
                                hasSkill 
                                  ? 'text-green-800 dark:text-green-300' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>{skill}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-[#2d1f3d] rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">No role skills defined</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Select a role to see required skills</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Skills to Develop */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-3xl shadow-xl dark:shadow-glow p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 dark:bg-orange-900/30 rounded-full -translate-y-16 translate-x-16 opacity-40"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100">Skills to Develop</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-400">Level Up Your Game</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1e1a2e] rounded-xl px-4 py-2 shadow-md">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {(() => {
                        const unselected = predictionData?.inputData?.unselectedSkills || [];
                        const missing = predictionData.missingRoleSkills || [];
                        // Combine and deduplicate
                        const allMissing = [...new Set([...unselected, ...missing])];
                        return allMissing.length;
                      })()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Missing</div>
                  </div>
                </div>

                {(() => {
                  const unselected = predictionData?.inputData?.unselectedSkills || [];
                  const missing = predictionData.missingRoleSkills || [];
                  // Combine and deduplicate
                  const allMissing = [...new Set([...unselected, ...missing])];
                  
                  return allMissing.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {allMissing.map((skill, index) => (
                          <div 
                            key={index}
                            className="group bg-white dark:bg-[#1e1a2e] border border-orange-200 dark:border-orange-700 rounded-xl px-3 py-2 flex items-center space-x-2 hover:shadow-lg dark:hover:shadow-glow transition-all duration-300 transform hover:scale-105"
                          >
                            <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{skill}</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Perfect Match!</h4>
                      <p className="text-green-700 dark:text-green-400 text-sm">
                        You have all the key skills for your chosen role
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-2">Keep mastering them to stay ahead</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Personalized Roadmap Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-3xl shadow-xl dark:shadow-glow p-8 mb-8 border border-indigo-100 dark:border-indigo-800">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your Personalized Career Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Get a tailored preparation strategy based on your profile, selected career path, and available time to maximize your placement potential.
              </p>
            </div>
            <div className="text-center">
              <Link 
                to={`/auth-selection?domain=${formData?.selectedDomainId || ''}&role=${formData?.selectedRoleId || ''}`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white font-semibold rounded-2xl hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl dark:shadow-glow transform hover:scale-105"
              >
                Move to My Dashboard
                <svg className="ml-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Modern Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              type="button"
              onClick={handleStartNewPrediction}
              className="group bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 dark:from-purple-600 dark:to-pink-700 dark:hover:from-purple-500 dark:hover:to-pink-600 text-white rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl dark:shadow-glow w-full"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">New Prediction</h4>
              <p className="text-sm opacity-90">Analyze another profile</p>
            </button>
            <Link 
              to="/career-guidance" 
              className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 dark:from-blue-600 dark:to-cyan-700 dark:hover:from-blue-500 dark:hover:to-cyan-600 text-white rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl dark:shadow-glow"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">AI Career Guide</h4>
              <p className="text-sm opacity-90">Get expert guidance</p>
            </Link>
            <Link 
              to="/market-trends" 
              className="group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-700 dark:hover:from-emerald-500 dark:hover:to-teal-600 text-white rounded-2xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl dark:shadow-glow"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-lg font-bold mb-2">Market Trends</h4>
              <p className="text-sm opacity-90">Industry insights</p>
            </Link>
          </div>

          {/* Modern Disclaimer */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#1e1a2e]/50 dark:to-[#2d1f3d]/30 rounded-2xl p-6 border border-gray-200 dark:border-pink-500/20">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Important Note</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              This AI-powered analysis is based on your provided information and current industry trends. 
              Actual placement outcomes may vary based on market conditions, company requirements, and individual performance during interviews.
              Use these insights as guidance for your career preparation journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;

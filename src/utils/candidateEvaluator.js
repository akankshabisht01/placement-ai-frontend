// Candidate Evaluation and Job Recommendation System
// This system evaluates candidates based on academic scores, skills, projects, hackathons, and internships
// and recommends relevant job domains and roles based on their actual experience.

import domainsData from '../data/domainData.js';

/**
 * Extract advanced keywords from domainData.js for consistent keyword matching
 * @returns {Array} - Array of advanced technology keywords
 */
const getAdvancedKeywordsFromDomainData = () => {
  const allKeywords = new Set();
  
  // Extract all keywords from all domains and categories
  domainsData.forEach(domain => {
    domain.categories?.forEach(category => {
      category.keywords?.forEach(keyword => {
        allKeywords.add(keyword.toLowerCase().trim());
      });
    });
  });
  
  // Filter for advanced technology keywords
  const advancedTechTerms = [
    'docker', 'kubernetes', 'microservice', 'cloud', 'aws', 'azure', 'gcp',
    'machine learning', 'ai', 'ml', 'deep learning', 'neural network',
    'react', 'angular', 'vue', 'node.js', 'spring boot', 'django',
    'architecture', 'scalable', 'pipeline', 'ci/cd', 'devops',
    'mongodb', 'postgresql', 'redis', 'elasticsearch',
    'automation', 'testing', 'monitoring', 'security',
    'real-time', 'streaming', 'kafka', 'websocket', 'api', 'rest'
  ];
  
  // Return keywords that contain advanced tech terms
  return Array.from(allKeywords).filter(keyword => 
    advancedTechTerms.some(term => keyword.includes(term))
  );
};

// BASIC PROJECT LIST - Projects that do not add points to the final score
const BASIC_PROJECTS = {
  'Data Science/ML': [
    'Titanic survival prediction',
    'MNIST digit classification', 
    'Iris dataset analysis',
    'House price prediction with linear regression',
    'Basic EDA projects (Iris/Titanic)',
    'Spam/Ham email classifier',
    'Sentiment analysis on tweets using bag-of-words',
    'Simple chatbot',
    'Stock price prediction (unimproved/standard approach)',
    'Basic movie recommendation',
    'Heart disease prediction (UCI)',
    'Breast cancer prediction (UCI)',
    'Wine quality prediction',
    'Boston housing price prediction',
    'Diabetes prediction (UCI)',
    'Loan approval prediction',
    'Handwritten digit recognition',
    'Basic clustering (Iris/Mall customers)',
    'Basic time series forecasting (AirPassengers)',
    'Basic recommender system (MovieLens)',
    'Basic spam classifier',
    'Basic weather prediction',
    'Basic COVID-19 data analysis',
    'Basic resume parser',
    'Basic OCR with Tesseract',
    'Basic face detection with OpenCV',
    'Basic object detection with YOLO sample code'
  ],
  'Mechanical': [
    '2D/3D component modeling (nut/bolt/bracket)',
    'Basic mechanism design',
    'Static beam/plate FEA',
    'Basic HVAC duct design',
    'CAD assembly (ball bearing)',
    'Simple thermal analysis',
    'Basic gear design',
    'Simple cam/follower simulation',
    'Basic stress analysis',
    'Simple 3D printing demo',
    'Basic CNC programming',
    'Basic sheet metal design',
    'Simple wind turbine model',
    'Basic solar water heater design',
    'Simple robotic arm (simulation only)'
  ],
  'ECE': [
    'Blinking LED',
    'Line-following robot',
    'Digital clock',
    'Simple PCB power supply',
    'Basic remote-controlled car',
    'IoT temp logger',
    'Signal processing using sample codes',
    'Logic gate simulations',
    'Basic IR sensor circuit',
    'Simple 555 timer project',
    'Basic audio amplifier',
    'Simple wireless transmitter/receiver',
    'Basic RFID attendance system',
    'Basic Bluetooth car',
    'Basic DTMF controlled robot'
  ],
  'Electrical': [
    'Basic circuit simulation',
    'Home automation (relay/arduino)',
    'LDR light automation',
    'Basic motor control/PWM',
    'Solar phone charger',
    'Simple transformer calculation',
    'Basic power factor projects',
    'Simple inverter circuit',
    'Basic UPS design',
    'Simple solar tracker',
    'Basic energy meter',
    'Simple relay driver',
    'Basic DC-DC converter',
    'Simple battery charger'
  ],
  'BBA': [
    'Market survey via Google Forms',
    'SWOT analysis of major brands',
    'Basic Excel sales/HR dashboard',
    'Sample business plan (café, store)',
    'HR manual for hypothetical firm',
    'Basic budgeting',
    'Social media stats analysis'
  ],
  'Agriculture': [
    'Soil pH recording',
    'Crop calendar',
    'Pest control review',
    'Organic vs chemical fertilizer report',
    'Basic farm yield tracking',
    'Survey on tech adoption',
    'Desk research on agri topics'
  ],
  'Software': [
    'To-do app',
    'Personal blog',
    'Weather app',
    'CRUD demo app',
    'Static landing page',
    'Calculator',
    'Simple chat app',
    'Dockerized hello world',
    'Basic portfolio website',
    'Simple quiz app',
    'Basic notes app',
    'Simple expense tracker',
    'Basic stopwatch/timer',
    'Simple markdown editor',
    'Basic REST API demo',
    'Simple file uploader',
    'Basic authentication demo',
    'Simple image gallery',
    'Basic e-commerce cart',
    'Simple blog CMS',
    'Basic URL shortener',
    'Simple PDF merger',
    'Basic CSV to JSON converter'
  ],
  'Game Dev': [
    'Snake/Tetris/Pong clones',
    'Guess the Number',
    '2D template platformer',
    'Basic memory game',
    'Simple flappy bird clone',
    'Basic endless runner',
    'Simple maze solver',
    'Basic tic-tac-toe',
    'Simple hangman',
    'Basic Simon game'
  ],
  'Cybersecurity': [
    'Firewall setup',
    'Wireshark traffic capture',
    'Simple vulnerability scan',
    'Basic auth system',
    'Simulated DoS',
    'Keylogger/port scanner demo',
    'Basic SQL injection demo',
    'Simple XSS demo',
    'Basic brute force script',
    'Simple password generator',
    'Basic phishing page',
    'Simple port scanner',
    'Basic ransomware simulation'
  ],
  'Cloud': [
    'Static website on AWS/Azure/GCP tutorial',
    'S3 file upload',
    'Default app containerization',
    'Basic VM setup',
    'Simple Lambda function',
    'Basic cloud storage demo',
    'Simple CDN setup',
    'Basic load balancer config',
    'Simple cloud monitoring',
    'Basic serverless API',
    'Simple cloud backup script'
  ],
  'Emerging Tech': [
    'Line-follower robot',
    'Home automation lighting',
    'Sensor data logging',
    'Face detection from sample code',
    'Basic smart contract',
    'Local blockchain',
    'Qiskit demo notebook',
    'Bell states simulation',
    'Basic AR filter',
    'Simple VR demo',
    'Basic drone simulation',
    'Simple IoT dashboard',
    'Basic edge AI demo',
    'Simple quantum circuit',
    'Basic blockchain explorer'
  ],
  'Other Analytics': [
    'Sales trend with Excel',
    'Regression with open data',
    'Product comparison from reviews',
    'Basic Power BI dashboard',
    'Bioinformatics sequence alignment',
    'Basic GIS heatmap',
    'Simple linear programming in Excel'
  ]
};

// Professional domain relevance mapping for skills
const SKILL_DOMAIN_MAPPING = {
  // Software Development
  'Java': ['Software Development', 'Backend Development', 'Android Development'],
  'Python': ['Software Development', 'Data Science', 'AI/ML', 'Backend Development'],
  'JavaScript': ['Software Development', 'Frontend Development', 'Full Stack Development'],
  'React': ['Frontend Development', 'Full Stack Development', 'UI/UX Development'],
  'Node.js': ['Backend Development', 'Full Stack Development'],
  'Angular': ['Frontend Development', 'Full Stack Development'],
  'Vue.js': ['Frontend Development', 'Full Stack Development'],
  'C++': ['Software Development', 'Game Development', 'System Programming'],
  'C#': ['Software Development', 'Game Development', 'Windows Development'],
  'PHP': ['Backend Development', 'Web Development'],
  'SQL': ['Data Science', 'Backend Development', 'Database Administration'],
  'MongoDB': ['Backend Development', 'Database Administration', 'Full Stack Development'],
  'Git': ['Software Development', 'DevOps', 'All Technical Roles'],
  'Docker': ['DevOps', 'Cloud Engineering', 'Backend Development'],
  'AWS': ['Cloud Engineering', 'DevOps', 'Backend Development'],
  'Azure': ['Cloud Engineering', 'DevOps', 'Backend Development'],
  'REST API': ['Backend Development', 'Full Stack Development', 'API Development'],
  'GraphQL': ['Backend Development', 'Full Stack Development', 'API Development'],
  'Agile': ['Project Management', 'All Technical Roles'],
  'Scrum': ['Project Management', 'All Technical Roles'],
  
  // Data Science & Analytics
  'R': ['Data Science', 'Data Analysis', 'Business Intelligence'],
  'Pandas': ['Data Science', 'Data Analysis', 'Business Intelligence'],
  'NumPy': ['Data Science', 'Data Analysis', 'AI/ML'],
  'Scikit-learn': ['Data Science', 'Machine Learning', 'AI Engineering'],
  'TensorFlow': ['AI/ML', 'Machine Learning Engineering', 'Data Science'],
  'PyTorch': ['AI/ML', 'Machine Learning Engineering', 'Data Science'],
  'Power BI': ['Business Intelligence', 'Data Analysis', 'Business Analytics'],
  'Tableau': ['Business Intelligence', 'Data Analysis', 'Business Analytics'],
  'Excel': ['Business Analytics', 'Data Analysis', 'Business Intelligence'],
  'Statistics': ['Data Science', 'Data Analysis', 'Business Intelligence'],
  'Mathematics': ['Data Science', 'AI/ML', 'Research'],
  'Deep Learning': ['AI/ML', 'Machine Learning Engineering', 'Data Science'],
  'NLP': ['AI/ML', 'Data Science', 'Machine Learning Engineering'],
  'Computer Vision': ['AI/ML', 'Data Science', 'Machine Learning Engineering'],
  
  // DevOps & Cloud
  'Kubernetes': ['DevOps', 'Cloud Engineering', 'Site Reliability Engineering'],
  'Jenkins': ['DevOps', 'CI/CD Engineering', 'Automation Engineering'],
  'Terraform': ['DevOps', 'Cloud Engineering', 'Infrastructure Engineering'],
  'Ansible': ['DevOps', 'Automation Engineering', 'Infrastructure Engineering'],
  'Linux': ['DevOps', 'System Administration', 'Cloud Engineering'],
  'Shell Scripting': ['DevOps', 'System Administration', 'Automation Engineering'],
  'CI/CD': ['DevOps', 'Automation Engineering', 'Software Engineering'],
  'Monitoring': ['DevOps', 'Site Reliability Engineering', 'Cloud Engineering'],
  'Logging': ['DevOps', 'Site Reliability Engineering', 'Cloud Engineering'],
  'Microservices': ['Software Architecture', 'Backend Development', 'Cloud Engineering'],
  
  // Mechanical Engineering
  'SolidWorks': ['Mechanical Design', 'Product Design', 'CAD Engineering'],
  'AutoCAD': ['Mechanical Design', 'CAD Engineering', 'Drafting'],
  'CATIA': ['Mechanical Design', 'Product Design', 'CAD Engineering'],
  'ANSYS': ['Mechanical Analysis', 'FEA Engineering', 'Simulation Engineering'],
  'Creo': ['Mechanical Design', 'Product Design', 'CAD Engineering'],
  'Manufacturing': ['Manufacturing Engineering', 'Production Engineering', 'Industrial Engineering'],
  'Thermal Analysis': ['Thermal Engineering', 'Mechanical Analysis', 'HVAC Engineering'],
  'HVAC': ['HVAC Engineering', 'Building Services', 'Mechanical Engineering'],
  'Automotive': ['Automotive Engineering', 'Vehicle Design', 'Mechanical Engineering'],
  'Robotics': ['Robotics Engineering', 'Automation Engineering', 'Mechanical Engineering'],
  
  // Electrical Engineering
  'Circuit Design': ['Electrical Engineering', 'Electronics Engineering', 'Hardware Engineering'],
  'PCB Design': ['Electrical Engineering', 'Electronics Engineering', 'Hardware Engineering'],
  'Embedded Systems': ['Embedded Engineering', 'IoT Engineering', 'Hardware Engineering'],
  'IoT': ['IoT Engineering', 'Embedded Engineering', 'Smart City Engineering'],
  'Microcontroller': ['Embedded Engineering', 'Hardware Engineering', 'Electronics Engineering'],
  'Power Systems': ['Power Engineering', 'Electrical Engineering', 'Energy Engineering'],
  'Renewable Energy': ['Energy Engineering', 'Power Engineering', 'Sustainability Engineering'],
  'Control Systems': ['Control Engineering', 'Automation Engineering', 'Electrical Engineering'],
  
  // Business & Management
  'Marketing': ['Marketing Management', 'Digital Marketing', 'Business Development'],
  'Finance': ['Financial Analysis', 'Investment Banking', 'Corporate Finance'],
  'Business Analysis': ['Business Analysis', 'Product Management', 'Strategy Consulting'],
  'Project Management': ['Project Management', 'Program Management', 'Product Management'],
  'Strategy': ['Strategy Consulting', 'Business Strategy', 'Corporate Strategy'],
  'Operations': ['Operations Management', 'Supply Chain Management', 'Process Improvement'],
  'Human Resources': ['HR Management', 'Talent Acquisition', 'Organizational Development'],
  'Sales': ['Sales Management', 'Business Development', 'Account Management'],
  
  // Communication & Soft Skills
  'Communication': ['All Roles', 'Leadership', 'Management'],
  'Leadership': ['Management', 'Team Leadership', 'Project Management'],
  'Problem Solving': ['All Technical Roles', 'Consulting', 'Research'],
  'Team Management': ['Management', 'Project Management', 'Team Leadership'],
  'Presentation': ['All Roles', 'Sales', 'Consulting'],
  'Negotiation': ['Sales', 'Business Development', 'Management'],
  'Critical Thinking': ['All Roles', 'Research', 'Consulting'],
  'Time Management': ['All Roles', 'Project Management', 'Management']
};

// Job domain and role recommendations based on skills and experience
const JOB_DOMAIN_ROLES = {
  'Software Development': [
    'Software Developer/Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Mobile App Developer',
    'Game Developer',
    'UI/UX Developer',
    'QA/Test Engineer',
    'DevOps Engineer',
    'Cloud Engineer'
  ],
  'Data Science & Analytics': [
    'Data Scientist',
    'Data Analyst',
    'Machine Learning Engineer',
    'AI Engineer',
    'Business Intelligence Analyst',
    'Data Engineer',
    'Analytics Consultant'
  ],
  'AI/ML': [
    'Machine Learning Engineer',
    'AI Engineer',
    'Data Scientist',
    'Computer Vision Engineer',
    'NLP Engineer',
    'AI Research Scientist',
    'ML Ops Engineer'
  ],
  'DevOps & Cloud': [
    'DevOps Engineer',
    'Cloud Engineer',
    'Site Reliability Engineer',
    'Infrastructure Engineer',
    'Platform Engineer',
    'Cloud Architect'
  ],
  'Mechanical Engineering': [
    'Mechanical Design Engineer',
    'Product Design Engineer',
    'CAD Engineer',
    'Manufacturing Engineer',
    'HVAC Engineer',
    'Automotive Engineer',
    'Robotics Engineer'
  ],
  'Electrical Engineering': [
    'Electrical Engineer',
    'Electronics Engineer',
    'Hardware Engineer',
    'Embedded Systems Engineer',
    'IoT Engineer',
    'Power Engineer',
    'Control Systems Engineer'
  ],
  'Business & Management': [
    'Business Analyst',
    'Product Manager',
    'Project Manager',
    'Marketing Manager',
    'Financial Analyst',
    'Operations Manager',
    'Strategy Consultant'
  ],
  'Cybersecurity': [
    'Security Engineer',
    'Cybersecurity Analyst',
    'Penetration Tester',
    'Security Architect',
    'Incident Response Analyst',
    'Security Consultant'
  ],
  'Game Development': [
    'Game Developer',
    'Game Programmer',
    'Game Designer',
    'Unity Developer',
    'Unreal Engine Developer',
    'Game Artist'
  ]
};

// Required skills per common job role (normalized lowercase keys)
const ROLE_REQUIRED_SKILLS = {
  'data analyst': ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Statistics'],
  'data scientist': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'Statistics', 'Machine Learning', 'SQL'],
  'machine learning engineer': ['Python', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Data Preprocessing', 'ML Ops', 'Git'],
  'ai engineer': ['Python', 'Machine Learning', 'Deep Learning', 'APIs', 'Model Deployment', 'Cloud Basics'],
  'software developer': ['Data Structures', 'Algorithms', 'Git', 'JavaScript', 'React', 'Node.js', 'Databases (SQL)'],
  'backend developer': ['Node.js', 'Express', 'REST API', 'SQL', 'Authentication', 'Git', 'Testing'],
  'frontend developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design', 'Git', 'Testing'],
  'full stack developer': ['JavaScript', 'React', 'Node.js', 'REST API', 'SQL', 'Git', 'CI/CD Basics'],
  'devops engineer': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Cloud (AWS/Azure/GCP)'],
  'cloud engineer': ['AWS', 'Azure', 'GCP', 'Networking Basics', 'Linux', 'Terraform', 'Scripting'],
  'business analyst': ['Excel', 'SQL', 'Power BI', 'Requirements Gathering', 'Documentation', 'Communication']
};

// Company academic eligibility criteria (typical thresholds)
const CORE_COMPANY_CRITERIA = [
  { name: 'TCS', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'Infosys', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'Wipro', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'Accenture', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'HCL', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'Tech Mahindra', tenth: 60, twelfth: 60, cgpa: 6.5 },
  { name: 'Cognizant', tenth: 60, twelfth: 60, cgpa: 6.0 },
  { name: 'Capgemini', tenth: 60, twelfth: 60, cgpa: 6.0 }
];

const FLEXIBLE_COMPANIES = [
  'Early-stage Startup',
  'Growth Startup',
  'Product-based SME',
  'FinTech Startup',
  'AI/ML Startup',
  'Data Analytics Boutique'
];

const evaluateEligibility = (tenthPercentage, twelfthPercentage, collegeCGPA, skills = [], projects = []) => {
  const t10 = parseFloat(tenthPercentage) || 0;
  const t12 = parseFloat(twelfthPercentage) || 0;
  const cg = parseFloat(collegeCGPA) || 0;
  const hasSkillSignal = (skills && skills.length >= 3);
  const hasProjectSignal = (projects && projects.some(p => (p.title || p.description))); 
  const eligibleCompanies = [];
  const nonEligibleCompanies = [];
  CORE_COMPANY_CRITERIA.forEach(c => {
    const ok = t10 >= c.tenth && t12 >= c.twelfth && cg >= c.cgpa;
    (ok ? eligibleCompanies : nonEligibleCompanies).push(c.name);
  });
  // Inject flexible companies always considered eligible if skill/project signal
  if (hasSkillSignal || hasProjectSignal) {
    FLEXIBLE_COMPANIES.forEach(fc => {
      if (!eligibleCompanies.includes(fc)) eligibleCompanies.push(fc);
    });
  } else {
    // Even without signals ensure at least one flexible company to avoid 0% eligible per rules
    if (!eligibleCompanies.length) {
      eligibleCompanies.push(FLEXIBLE_COMPANIES[0]);
    }
  }
  const total = eligibleCompanies.length + nonEligibleCompanies.length;
  const eligiblePercent = total ? Math.round((eligibleCompanies.length / total) * 100) : 100;
  const nonEligiblePercent = 100 - eligiblePercent;
  const eligibilityMessage = `You meet academic or skill-based criteria for ${eligibleCompanies.length}/${total} companies.`;
  return { eligibleCompanies, nonEligibleCompanies, eligiblePercent, nonEligiblePercent, eligibilityMessage };
};

/**
 * Check if a project is basic (should not add points)
 * @param {string} projectTitle - The project title to check
 * @param {string} projectDescription - The project description to check
 * @param {string} domain - The candidate's domain/background
 * @returns {boolean} - True if the project is basic, false otherwise
 */
export const isBasicProject = (projectTitle, projectDescription, domain) => {
  if (!projectTitle && !projectDescription) return true;
  
  const title = (projectTitle || '').toLowerCase();
  const description = (projectDescription || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  // Check against all basic project categories
  for (const [, basicProjects] of Object.entries(BASIC_PROJECTS)) {
    for (const basicProject of basicProjects) {
      const basicKeywords = basicProject.toLowerCase().split(/[\s\-()]/); // eslint-disable-line no-useless-escape
      const hasBasicKeywords = basicKeywords.every(keyword => 
        keyword.length === 0 || combinedText.includes(keyword)
      );
      if (hasBasicKeywords && basicKeywords.length > 1) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Calculate skill score based on relevant professional skills
 * @param {Array} skills - Array of candidate skills
 * @returns {number} - Skill score (0-100)
 */
export const calculateSkillScore = (skills) => {
  if (!skills || skills.length === 0) return 0;
  
  let relevantSkills = 0;
  let totalSkills = skills.length;
  
  for (const skill of skills) {
    if (SKILL_DOMAIN_MAPPING[skill]) {
      relevantSkills++;
    }
  }
  
  return Math.round((relevantSkills / totalSkills) * 100);
};

/**
 * Calculate project score based on non-basic projects with keyword weighting (evaluate only first 2-3 projects)
 * @param {Array} projects - Array of project objects with title and description
 * @param {string} domain - Candidate's domain/background
 * @returns {number} - Project score (0-100)
 */
export const calculateProjectScore = (projects, domain) => {
  if (!projects || projects.length === 0) return 0;
  
  // Limit evaluation to first 3 projects only (consistent with backend ML model)
  const projectsToEvaluate = projects.slice(0, 3);
  
  let nonBasicProjects = 0;
  let totalProjects = 0;
  let keywordBonus = 0;
  
  // Get advanced keywords directly from domainData.js for consistency with backend
  const advancedKeywords = getAdvancedKeywordsFromDomainData();
  
  for (const project of projectsToEvaluate) {
    if (project.title || project.description) {
      totalProjects++;
      
      // Check if project is non-basic
      const isNonBasic = !isBasicProject(project.title, project.description, domain);
      if (isNonBasic) {
        nonBasicProjects++;
      }
      
      // Calculate keyword bonus for advanced technologies
      const combinedText = `${project.title || ''} ${project.description || ''}`.toLowerCase();
      const keywordHits = advancedKeywords.filter(keyword => combinedText.includes(keyword)).length;
      
      // Add keyword bonus (each keyword worth 10 points, max 50 per project)
      keywordBonus += Math.min(keywordHits * 10, 50);
    }
  }
  
  if (totalProjects === 0) return 0;
  
  // Base score: percentage of non-basic projects (max 50 points)
  let baseScore = nonBasicProjects === 0 ? 0 : Math.round((nonBasicProjects / totalProjects) * 50);
  
  // Add keyword bonus (max 50 points)
  const finalScore = Math.min(baseScore + keywordBonus, 100);
  
  return finalScore;
};

/**
 * Calculate hackathon score
 * @param {boolean} participated - Whether candidate participated in hackathons
 * @param {number} numHackathons - Number of hackathons participated
 * @param {string} winner - Whether candidate was a winner
 * @returns {number} - Hackathon score (0-100)
 */
export const calculateHackathonScore = (participated, numHackathons, winner) => {
  if (!participated || numHackathons === 0) return 0;
  
  let score = Math.min(numHackathons * 20, 60); // Base score for participation
  
  if (winner === 'yes') {
    score += 40; // Bonus for winning
  }
  
  return Math.min(score, 100);
};

/**
 * Calculate internship score
 * @param {boolean} completed - Whether candidate completed internships
 * @param {number} numInternships - Number of internships completed
 * @returns {number} - Internship score (0-100)
 */
export const calculateInternshipScore = (completed, numInternships) => {
  if (!completed || numInternships === 0) return 0;
  
  // Score based on number of internships (max 100)
  return Math.min(numInternships * 25, 100);
};

/**
 * Get relevant job domains and roles based on candidate's skills and experience
 * @param {Array} skills - Candidate's skills
 * @param {Array} projects - Candidate's projects
 * @param {boolean} hackathon - Whether candidate participated in hackathons
 * @param {boolean} internship - Whether candidate completed internships
 * @param {string} domain - Candidate's educational domain
 * @returns {Array} - Array of relevant job domains and roles
 */
export const getRelevantJobDomains = (skills, projects, hackathon, internship, domain) => {
  const relevantDomains = new Set();
  
  // Check skills relevance
  for (const skill of skills) {
    if (SKILL_DOMAIN_MAPPING[skill]) {
      SKILL_DOMAIN_MAPPING[skill].forEach(domain => relevantDomains.add(domain));
    }
  }
  
  // Check if they have non-basic projects
  const hasNonBasicProjects = projects && projects.some(project => 
    !isBasicProject(project.title, project.description, domain)
  );
  
  // Check hackathon and internship relevance
  const hasRelevantExperience = hackathon || internship;
  
  // Filter domains based on actual experience
  const filteredDomains = [];
  for (const domainName of relevantDomains) {
    // Only include domains where candidate has relevant skills AND experience
    if (hasNonBasicProjects || hasRelevantExperience) {
      filteredDomains.push(domainName);
    }
  }
  
  // If no specific domains found, suggest general ones based on background
  if (filteredDomains.length === 0) {
    if (domain && domain.toLowerCase().includes('computer')) {
      filteredDomains.push('Software Development');
    } else if (domain && domain.toLowerCase().includes('mechanical')) {
      filteredDomains.push('Mechanical Engineering');
    } else if (domain && domain.toLowerCase().includes('electrical')) {
      filteredDomains.push('Electrical Engineering');
    } else if (domain && domain.toLowerCase().includes('business')) {
      filteredDomains.push('Business & Management');
    }
  }
  
  // Return 2-4 most relevant domains
  return filteredDomains.slice(0, Math.min(4, Math.max(2, filteredDomains.length)));
};

/**
 * Get specific job roles for a domain
 * @param {string} domainName - The domain name
 * @returns {Array} - Array of job roles for that domain
 */
export const getJobRolesForDomain = (domainName) => {
  return JOB_DOMAIN_ROLES[domainName] || [];
};

/**
 * Calculate total candidate score
 * @param {Object} candidateData - Candidate's data including academic scores, skills, projects, etc.
 * @returns {Object} - Object containing total score and breakdown
 */
export const calculateCandidateScore = (candidateData) => {
  const {
    tenthPercentage,
    twelfthPercentage,
    collegeCGPA,
    selectedSkills,
    projects,
    hackathonsParticipated,
    numHackathons,
    hackathonWinner,
    internshipsCompleted,
    numInternships,
    selectedDomainId,
    customDomain,
    achievements,
    certifications
  } = candidateData;
  // === RAW SUB-SCORES (0-100 each) ===
  // Academics: derive from CGPA (10 -> 100) and penalize weak 10th/12th per rules
  let academicScore = parseFloat(collegeCGPA) * 10; 
  const tenth = parseFloat(tenthPercentage)||0;
  const twelfth = parseFloat(twelfthPercentage)||0;
  // Base cap if either below threshold
  if (tenth < 60) {
    // Heavy penalty: scale down sharply
    // Map CGPA-derived score to max 50 before weighting (i.e., 15/30 when converted later) then adjust by how close 10th is to 60
    const proximity = Math.max(0, (tenth - 40) / 20); // 40->0, 60->1
    academicScore = Math.min(academicScore, 50 + (proximity * 20)); // between 50 and 70
  } else if (twelfth < 60) {
    // Moderate penalty on 12th shortfall
    academicScore = Math.min(academicScore, 75);
  }
  academicScore = Math.min(100, Math.max(0, academicScore));

  // Skills: reuse existing relevance calculation
  const skillScore = calculateSkillScore(selectedSkills);

  // Projects: non-basic project ratio
  const domain = selectedDomainId || customDomain || 'Computer Science';
  const projectScore = calculateProjectScore(projects, domain);

  // Experience: blend hackathons + internships
  const hackathonScore = calculateHackathonScore(
    hackathonsParticipated, 
    parseInt(numHackathons) || 0, 
    hackathonWinner
  );
  const internshipScore = calculateInternshipScore(
    internshipsCompleted, 
    parseInt(numInternships) || 0
  );
  const experienceScore = Math.round((hackathonScore + internshipScore) / 2);

  // Achievements & Certifications: revised tiered scoring
  const achList = (achievements || '').split(/\n|[,;]/).map(a=>a.trim()).filter(a=>a.length>0);
  const certList = (certifications || '').split(/\n|[,;]/).map(a=>a.trim()).filter(a=>a.length>0);
  let achievementsPoints;
  if (!achList.length && !certList.length) {
    achievementsPoints = 0; // nothing listed
  } else {
    // Baseline if any evidence
    achievementsPoints = 5;
    const achExtra = Math.min(5, Math.max(0, achList.length - 1) * 2); // up to +5
    const certExtra = Math.min(4, Math.max(0, certList.length) * 1.5); // up to +4 (rounded later)
    const synergy = (achList.length && certList.length) ? 1 : 0; // small bonus
    achievementsPoints += achExtra + certExtra + synergy;
    achievementsPoints = Math.min(15, Math.round(achievementsPoints));
  }
  const achievementsScore = Math.round((achievementsPoints / 15) * 100);

  // === WEIGHTS ===
  const WEIGHTS = { academics:30, skills:20, projects:20, experience:15, achievements:15 };
  const weightedAcademic = (academicScore/100) * WEIGHTS.academics;
  const weightedSkills = (skillScore/100) * WEIGHTS.skills;
  const weightedProjects = (projectScore/100) * WEIGHTS.projects;
  const weightedExperience = (experienceScore/100) * WEIGHTS.experience;
  // Achievements already in 0-15 scale
  const weightedAchievements = achievementsPoints; 
  const totalScore = Math.round(weightedAcademic + weightedSkills + weightedProjects + weightedExperience + weightedAchievements);
  
  return {
    totalScore: Math.min(100, totalScore),
    academicScore,
    skillScore,
    projectScore,
    experienceScore,
    achievementsScore,
    hackathonScore,
    internshipScore,
    weighted: {
      academics: weightedAcademic,
      skills: weightedSkills,
      projects: weightedProjects,
      experience: weightedExperience,
      achievements: weightedAchievements
    }
  };
};

/**
 * Generate comprehensive candidate evaluation and job recommendations
 * @param {Object} candidateData - Candidate's complete data
 * @returns {Object} - Evaluation results and job recommendations
 */
export const evaluateCandidate = (candidateData) => {
  // Calculate scores
  const scores = calculateCandidateScore(candidateData);
  // Score breakdown for UI
  const scoreBreakdown = {
    academics: (scores.weighted?.academics ?? (scores.academicScore/100*30)),
    skills: (scores.weighted?.skills ?? (scores.skillScore/100*20)),
    projects: (scores.weighted?.projects ?? (scores.projectScore/100*20)),
    experience: (scores.weighted?.experience ?? (scores.experienceScore/100*15)),
    achievements_certifications: scores.weighted?.achievements ?? (scores.achievementsScore/100*15)
  };
  const selectedDomain = candidateData.selectedDomainId || candidateData.customDomain;
  // Get relevant job domains
  const relevantDomains = getRelevantJobDomains(
    candidateData.selectedSkills,
    candidateData.projects,
    candidateData.hackathonsParticipated,
    candidateData.internshipsCompleted,
    selectedDomain
  );
  const jobRecommendations = relevantDomains
    .filter(domain => {
      const hasSkill = candidateData.selectedSkills && candidateData.selectedSkills.some(skill => SKILL_DOMAIN_MAPPING[skill]?.includes(domain));
      const hasNonBasicProject = candidateData.projects && candidateData.projects.some(project => !isBasicProject(project.title, project.description, domain));
      const hasRelevantExp = (candidateData.hackathonsParticipated || candidateData.internshipsCompleted);
      return hasSkill || hasNonBasicProject || hasRelevantExp;
    })
    .slice(0, 4)
    .slice(0, Math.max(2, relevantDomains.length));
  // Build domains & roles, fallback to selected domain spec list
  let jobDomainsAndRoles = jobRecommendations.map(domain => ({
    domain,
    roles: (SPEC_DOMAIN_ROLES[domain] || getJobRolesForDomain(domain) || []).slice(0,6)
  }));
  // Consolidate to a single Data & Analytics domain if user selected a data-focused domain
  if ((selectedDomain || '').toLowerCase().includes('data')) {
    const dataRoles = SPEC_DOMAIN_ROLES['Data & Analytics'] || [];
    if (dataRoles.length) {
      jobDomainsAndRoles = [{ domain: 'Data & Analytics', roles: dataRoles }];
    }
  }
  // Eligibility check
  const elig = evaluateEligibility(
    candidateData.tenthPercentage,
    candidateData.twelfthPercentage,
    candidateData.collegeCGPA,
    candidateData.selectedSkills,
    candidateData.projects
  );
  // Skill gap analysis
  const chosenRoleRaw = (candidateData.customJobRole || candidateData.jobRoleName || candidateData.selectedCategoryId || '').toString().toLowerCase();
  let chosenRoleKey = Object.keys(ROLE_REQUIRED_SKILLS).find(k => chosenRoleRaw.includes(k)) || '';
  if (!chosenRoleKey && jobDomainsAndRoles.length && jobDomainsAndRoles[0].roles.length) {
    const firstRole = jobDomainsAndRoles[0].roles[0].toLowerCase();
    chosenRoleKey = Object.keys(ROLE_REQUIRED_SKILLS).find(k => firstRole.includes(k)) || '';
  }
  const requiredSkills = chosenRoleKey ? ROLE_REQUIRED_SKILLS[chosenRoleKey] : [];
  const userSkillsSet = new Set((candidateData.selectedSkills || []).map(s => s.toString().toLowerCase()));
  const missingSkills = requiredSkills.filter(rs => !userSkillsSet.has(rs.toString().toLowerCase()));
  // Project classification
  const strongProjects = [];
  const basicProjects = [];
  (candidateData.projects || []).forEach(p => {
    const basic = isBasicProject(p.title, p.description, selectedDomain);
    (basic ? basicProjects : strongProjects).push(p.title || 'Untitled Project');
  });
  // Suggestions
  const suggestions = [];
  if (missingSkills.length) suggestions.push(`Build the following critical skills for ${chosenRoleKey || 'your target role'}: ${missingSkills.slice(0, 6).join(', ')}`);
  if (basicProjects.length && strongProjects.length === 0) suggestions.push('Upgrade at least 1-2 projects from basic tutorials to problem-solving or real-world datasets.');
  if (!candidateData.internshipsCompleted || !parseInt(candidateData.numInternships || 0)) suggestions.push('Add an internship (even a short-term or virtual one) to strengthen practical exposure.');
  if (!candidateData.hackathonsParticipated) suggestions.push('Participate in a hackathon or coding challenge to demonstrate applied skills.');
  if (elig.eligiblePercent < 50) suggestions.push('Improve academics (raise CGPA or focus on companies with flexible criteria).');
  if (chosenRoleKey === 'data analyst') suggestions.push('Complete a Power BI + SQL mini-project (end-to-end dashboard) and add it to your resume.');
  else if (['software developer','backend developer','frontend developer'].includes(chosenRoleKey)) suggestions.push('Strengthen DSA basics and complete 50-100 LeetCode problems for interviews.');
  const evaluationNotes = {
    hasNonBasicProjects: strongProjects.length > 0,
    hasRelevantExperience: Boolean(candidateData.hackathonsParticipated || candidateData.internshipsCompleted)
  };
  return {
  candidateScore: scores.totalScore,
    scoreBreakdown,
    evaluationNotes,
    jobDomainsAndRoles,
    eligibilityMessage: elig.eligibilityMessage,
    eligibleCompanies: elig.eligibleCompanies,
    nonEligibleCompanies: elig.nonEligibleCompanies,
    eligiblePercent: elig.eligiblePercent,
    nonEligiblePercent: elig.nonEligiblePercent,
    chosenRole: chosenRoleKey || null,
    missingSkills,
    projectAnalysis: { strong: strongProjects, basic: basicProjects },
    suggestions
  };
};

// Added explicit domain role list per spec and fallback generator
const SPEC_DOMAIN_ROLES = {
  // Refined Data & Analytics roles (focused & relevant)
  'Data & Analytics': [
    'Data Analyst',
    'Data Engineer',
    'Business Intelligence Analyst',
    'Big Data Engineer',
    'Junior Data Scientist',
    'BI Developer'
  ],
  'Software Development': ['Software Developer','Frontend Developer','Backend Developer','Full Stack Developer','Mobile App Developer'],
  'AI/ML': ['Machine Learning Engineer','AI Engineer','NLP Engineer','Computer Vision Engineer','Deep Learning Engineer'],
  'Backend Development': ['Backend Developer','API Developer','Cloud Backend Engineer','Database Engineer','DevOps Engineer']
};

// eslint-disable-next-line no-unused-vars
const generateFallbackRoles = (domain) => {
  if (domain.toLowerCase().includes('data')) return ['Data Analyst', 'Data Engineer', 'Business Analyst'];
  else if (domain.toLowerCase().includes('software')) return ['Software Developer', 'Full Stack Developer', 'Backend Developer'];
  else if (domain.toLowerCase().includes('ai') || domain.toLowerCase().includes('ml')) return ['Machine Learning Engineer', 'AI Engineer', 'Data Scientist'];
  else if (domain.toLowerCase().includes('devops') || domain.toLowerCase().includes('cloud')) return ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer'];
  else if (domain.toLowerCase().includes('mechanical')) return ['Mechanical Design Engineer', 'CAD Engineer', 'Manufacturing Engineer'];
  else if (domain.toLowerCase().includes('electrical')) return ['Electrical Engineer', 'Embedded Systems Engineer', 'IoT Engineer'];
  else if (domain.toLowerCase().includes('business')) return ['Business Analyst', 'Product Manager', 'Project Manager'];
  return [];
};

export const formatEvaluationOutput = (evaluation, originalForm) => {
  if (!evaluation) return '';
  const b = evaluation.scoreBreakdown || {};
  const acad = Math.round((b.academics || b.academic || 0));
  const skills = Math.round(b.skills || 0);
  const proj = Math.round(b.projects || 0);
  const exp = Math.round(b.experience || 0);
  const ach = Math.round(b.achievements_certifications || b.achievements || 0);
  const total = evaluation.candidateScore || 0;
  const lines = [];
  lines.push('📊 Placement Prediction Score');
  lines.push(`- Final score: ${total} / 100`);
  lines.push('- Breakdown:');
  lines.push(`  🎓 Academics: ${acad} / 30`);
  lines.push(`  🛠 Skills: ${skills} / 20`);
  lines.push(`  🚀 Projects: ${proj} / 20`);
  lines.push(`  🏅 Experience: ${exp} / 15`);
  lines.push(`  🏆 Achievements: ${ach} / 15`);
  lines.push('');
  lines.push('✅ Eligible Companies (' + (evaluation.eligiblePercent||0) + '%)');
  lines.push((evaluation.eligibleCompanies||[]).join(', ') || 'None');
  lines.push('');
  lines.push('❌ Not Eligible Companies (' + (evaluation.nonEligiblePercent||0) + '%)');
  lines.push((evaluation.nonEligibleCompanies||[]).join(', ') || 'None');
  lines.push('');
  lines.push('💡 Suggestions');
  (evaluation.suggestions||[]).slice(0,8).forEach(s=>lines.push('- ' + s));
  return lines.join('\n');
};

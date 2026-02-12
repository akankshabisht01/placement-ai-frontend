import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDomainById } from '../data/jobDomainData';
import { getAllSkills } from '../data/domainData';
import PredictionSection from '../components/PredictionSection';
import ResumeLinker from '../components/ResumeLinker';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

// Add Data Analyst and update all role mappings with company-required skills
const roleSkillsMap = {
  // Web Development
  'Frontend Developer': [
    'HTML', 'HTML5', 'CSS', 'CSS3', 'JavaScript (ES6+)', 'Responsive Design', 'React.js', 'Angular', 'Vue.js', 'Bootstrap', 'Version Control (Git)', 'Browser Developer Tools', 'DOM Manipulation', 'API Integration (REST)', 'Debugging'
  ],
  'Backend Developer': [
    'JavaScript (Node.js)', 'Python (Django)', 'Java (Spring Boot)', 'C# (.NET)', 'Express.js', 'Django', 'Spring Boot', 'ASP.NET Core', 'SQL', 'NoSQL Databases (MySQL, PostgreSQL, MongoDB)', 'REST API Development', 'Git Version Control', 'Authentication and Authorization', 'Basic Cloud or Deployment (Heroku, AWS)', 'Unit Testing'
  ],
  'Full-Stack Developer': [
    'HTML5', 'CSS3', 'JavaScript', 'React.js', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Spring Boot', 'ASP.NET Core', 'RESTful APIs', 'SQL', 'NoSQL Databases', 'Responsive Web Design', 'Version Control (Git)', 'Basic Testing (Jest, Mocha, JUnit)', 'Cross-functional Collaboration'
  ],
  'UI/UX Developer': [
    'Wireframing and Prototyping', 'User Interface (UI) Design', 'User Experience (UX) Principles', 'Figma', 'Adobe XD', 'HTML', 'CSS', 'JavaScript (basic)', 'Responsive Design', 'Accessibility (WCAG)', 'Usability Testing'
  ],
  'Web Tester / QA Engineer': [
    'Manual Testing', 'Automation Testing (Selenium, Cypress)', 'Test Case Design', 'Bug Tracking (JIRA, Bugzilla)', 'Regression Testing', 'API Testing (Postman)', 'SQL (basic)', 'Git Version Control'
  ],
  // Shared Skills
  'Shared Web Skills': [
    'Problem Solving', 'Communication', 'Collaboration', 'Adaptability', 'Time Management'
  ],
  // Mobile Development
  'Android Developer': [
    'Kotlin', 'Java', 'Android SDK', 'Android Studio', 'XML/JSON', 'RESTful APIs', 'SQLite', 'UI/UX Design', 'Material Design', 'Git', 'Unit Testing'
  ],
  'iOS Developer': [
    'Swift', 'Objective-C', 'iOS SDK', 'Xcode', 'UIKit', 'Auto Layout', 'Storyboarding', 'REST APIs', 'Core Data', 'Git', 'Unit Testing'
  ],
  'Cross-Platform Developer': [
    'Flutter', 'Dart', 'React Native', 'JavaScript (ES6+)', 'Mobile App Development', 'UI/UX Design', 'API Integration', 'State Management (Redux, Provider, Bloc)', 'Git', 'Automated Testing'
  ],
  'Mobile App Tester / QA Engineer': [
    'Manual Testing', 'Automation Testing (Appium, Espresso, XCUITest)', 'Test Cases', 'Bug Tracking (JIRA)', 'API Testing (Postman)', 'Regression Testing', 'Git', 'SQL (basic)'
  ],
  // Data & Analytics
  'Data Analyst': [
    'Data Analysis', 'SQL', 'Microsoft Excel', 'Data Visualization', 'Tableau', 'Power BI', 'Data Cleaning', 'Statistical Analysis', 'Python', 'R', 'Reporting'
  ],
  'Business Intelligence (BI) Analyst / BI Developer': [
    'Business Intelligence', 'SQL', 'Data Visualization (Tableau, Power BI)', 'ETL', 'Dashboard Development', 'Data Modeling', 'Reporting', 'Data Mining', 'Critical Thinking'
  ],
  'Data Engineer': [
    'Data Engineering', 'SQL', 'ETL Pipelines', 'Python', 'Scala', 'Java', 'Data Warehousing', 'Cloud Platforms (AWS, Azure, GCP)', 'Big Data (Hadoop, Spark)', 'Database Design', 'Git'
  ],
  'Big Data Engineer': [
    'Hadoop', 'Spark', 'Kafka', 'SQL', 'NoSQL Databases (MongoDB, Cassandra)', 'Data Pipelines', 'ETL', 'Python', 'Java', 'Scala', 'Cloud Platforms', 'Data Modeling'
  ],
  'Junior Data Scientist': [
    'Python', 'Machine Learning', 'SQL', 'Data Analysis', 'Data Visualization', 'Statistics', 'Scikit-learn', 'Data Cleaning', 'Communication Skills'
  ],
  // AI & ML
  'Machine Learning Engineer': [
    'Machine Learning', 'Python', 'scikit-learn', 'Model Development', 'Data Preprocessing', 'Model Training', 'Model Deployment', 'Git', 'Statistics'
  ],
  'AI Engineer': [
    'Machine Learning', 'Python', 'Model Integration', 'Software Engineering', 'API Development', 'Data Analytics'
  ],
  'Deep Learning Engineer': [
    'Deep Learning', 'Python', 'TensorFlow', 'PyTorch', 'CNN/RNN', 'Neural Networks', 'Data Preprocessing', 'Model Optimization', 'Git'
  ],
  'NLP Engineer': [
    'Natural Language Processing (NLP)', 'Python', 'Text Preprocessing', 'Transformers', 'Chatbots', 'Machine Learning Models', 'scikit-learn'
  ],
  'Computer Vision Engineer': [
    'Computer Vision', 'Python', 'OpenCV', 'Image Processing', 'Deep Learning', 'CNNs', 'Model Deployment'
  ],
  'AI Research Assistant / Junior Researcher': [
    'Python', 'Machine Learning', 'Data Analysis', 'Research', 'Model Implementation', 'Communication Skills'
  ],
  // Cloud & DevOps
  'Cloud Engineer': [
    'AWS', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'EC2', 'S3', 'Lambda', 'VM', 'Blob Storage (platform services)', 'Cloud Architecture', 'Bash', 'Python', 'Terraform', 'CloudFormation', 'Linux Systems', 'Git Version Control', 'Monitoring Tools (CloudWatch, Azure Monitor)', 'Troubleshooting'
  ],
  'DevOps Engineer': [
    'CI/CD Pipelines (Jenkins, GitLab CI)', 'Docker', 'Kubernetes', 'Infrastructure as Code (Terraform/Ansible)', 'Scripting (Bash/Python)', 'Linux Administration', 'Git', 'Monitoring/Logging (Prometheus, Grafana, ELK Stack)'
  ],
  'Site Reliability Engineer (SRE)': [
    'Monitoring & Incident Response', 'Automation (Python, Bash)', 'Cloud Platforms (AWS/Azure/GCP)', 'Docker/Kubernetes', 'Reliability Engineering', 'Linux/Unix Systems', 'Troubleshooting'
  ],
  'Cloud Support Associate / Cloud Administrator': [
    'Cloud Platforms (AWS, Azure, GCP)', 'Helpdesk/Support', 'Basic Networking (TCP/IP, DNS, VPN)', 'Monitoring/Alerting', 'Linux/Windows Server Administration', 'Documentation'
  ],
  'Junior Infrastructure Engineer': [
    'Linux Administration', 'Networking Fundamentals (firewall, routing, DNS)', 'Bash/Python Scripting', 'System Monitoring', 'Cloud Basics', 'Troubleshooting', 'Documentation'
  ],
  // Cybersecurity
  'Cybersecurity Analyst': [
    'Security Operations Center (SOC) skills', 'Threat Monitoring & Detection', 'SIEM Tools (Splunk, QRadar)', 'Incident Response', 'Network Security Fundamentals', 'Report Writing', 'Communication Skills'
  ],
  'Application Security Engineer': [
    'Secure Coding Practices', 'Application Vulnerability Assessment', 'OWASP Top 10', 'Static/Dynamic Analysis', 'Penetration Testing (basics)', 'Code Review'
  ],
  'Network Security Engineer': [
    'Network Security', 'Firewalls (configuration)', 'IDS/IPS (Intrusion Detection/Prevention Systems)', 'VPN Technologies', 'TCP/IP', 'LAN/WAN', 'Network Monitoring'
  ],
  'Ethical Hacker / Penetration Tester': [
    'Ethical Hacking', 'Penetration Testing', 'Vulnerability Scanning (Nessus, Burp Suite)', 'Bug Bounty', 'Kali Linux', 'Report Writing', 'Scripting (Python/Bash)'
  ],
  'Security Operations Center (SOC) Associate': [
    'SIEM Platforms', 'Threat Intelligence', 'Security Monitoring', 'Incident Response', 'Investigation/Analysis', 'Documentation & Reporting'
  ],
  // Embedded Systems & IoT
  'Embedded Systems Engineer': [
    'C', 'C++', 'Microcontroller Programming (ARM, STM32, PIC)', 'Real-Time Operating Systems (RTOS)', 'Embedded Linux', 'Firmware Development', 'Hardware Debugging (oscilloscope, logic analyzer)', 'PCB Design & Testing', 'Communication Protocols (SPI, I2C, UART)', 'Git Version Control', 'Problem Solving & Troubleshooting', 'System Integration'
  ],
  'Firmware Developer': [
    'Low-level Programming (C, Assembly)', 'Device Drivers', 'Debugging & Testing', 'RTOS', 'Hardware-Software Integration', 'Version Control (Git)'
  ],
  'IoT Developer': [
    'Arduino', 'Raspberry Pi', 'ESP32', 'MQTT', 'HTTP', 'CoAP protocols', 'Sensor & Actuator Integration', 'Embedded Linux', 'Python', 'C/C++', 'Cloud IoT Platforms (AWS IoT, Azure IoT)', 'Networking Basics'
  ],
  'Robotics Engineer': [
    'ROS Basics (Robot Operating System)', 'Sensors & Actuators', 'Embedded Programming', 'Computer Vision Basics', 'C++', 'Python', 'Robotics Middleware'
  ],
  'Electronics Hardware Design Engineer': [
    'PCB Design (Altium, Eagle)', 'Circuit Testing & Simulation', 'Signal Processing', 'Hardware Prototyping', 'Compliance Standards (FCC, CE)'
  ],
  // Game Development
  'Game Developer': [
    'Unity Engine', 'C#', 'Unreal Engine', 'C++', 'Game Physics', '2D/3D Graphics', 'Animation', 'Shader Programming Basics', 'Version Control (Git)', 'Debugging and Optimization'
  ],
  'Game Programmer': [
    'OpenGL', 'DirectX', 'Graphics Programming', 'C++', 'Algorithms & Data Structures', 'Mathematics for Graphics (linear algebra, vectors)'
  ],
  'AR/VR Developer': [
    'Unity or Unreal Engine', 'ARKit', 'ARCore', 'C#', 'C++', '3D Modeling Basics', 'VR Hardware (Oculus, HTC Vive)', 'Spatial Computing'
  ],
  'Game Designer': [
    'Game Design Principles', 'User Interface (UI) Design', 'User Experience (UX)', 'Storyboarding & Narrative Design', 'Level Design Tools'
  ],
  'Game Tester / QA Engineer': [
    'Bug Tracking', 'Functional Testing', 'Performance Testing', 'Test Case Management', 'Automation Testing Basics', 'Version Control'
  ],
  // Blockchain & Web3
  'Blockchain Developer': [
    'Solidity', 'Ethereum Platform', 'Hyperledger Fabric', 'Smart Contract Development', 'Cryptography', 'Distributed Ledger Technology (DLT)', 'JavaScript', 'Python', 'Go', 'C++', 'Decentralized Applications (DApps)', 'Blockchain Architecture', 'APIs and Web3.js', 'Git & Version Control'
  ],
  'Smart Contract Developer': [
    'Solidity', 'Rust (basics)', 'Smart Contract Security', 'Remix IDE', 'Truffle', 'Hardhat', 'Testing & Auditing Smart Contracts', 'Gas Optimization', 'Blockchain Protocols'
  ],
  'dApp Developer': [
    'Web3.js', 'Ethers.js', 'Frontend Integration', 'IPFS', 'Decentralized Storage', 'React.js', 'Angular', 'Vue.js', 'Blockchain Analyst', 'Blockchain Platforms Research', 'Testnet Experience', 'Network Analysis', 'Data Analytics', 'Security Auditing Basics'
  ],
  'Web3 Developer': [
    'NFTs Standards (ERC-721, ERC-1155)', 'Wallet Integration', 'DeFi Protocols Basics', 'Tokenomics', 'Smart Contract Interaction', 'Metamask', 'WalletConnect'
  ],
  // Enterprise & Systems Software
  'Systems Software Engineer': [
    'C', 'C++', 'Operating Systems (Linux, Windows)', 'Low-Level Programming', 'Multithreading', 'Concurrency', 'Memory Management', 'Debugging Tools (GDB, Valgrind)', 'Scripting (Bash, Python)', 'Git'
  ],
  'Middleware Developer': [
    'Java', 'Spring Framework', '.NET', 'ASP.NET Core', 'RESTful APIs', 'Message Queues (RabbitMQ, Kafka)', 'Microservices', 'SQL', 'NoSQL Databases', 'Unit Testing Frameworks'
  ],
  'ERP/CRM Developer': [
    'SAP Modules (FICO, MM, SD basics)', 'Oracle ERP', 'Salesforce CRM Basics', 'SQL', 'Business Process Tools', 'Reporting & Dashboards', 'Integration APIs'
  ],
  'Enterprise Application Developer': [
    'Java', 'Spring Boot', '.NET Core', 'C#', 'Microservices Architecture', 'RESTful APIs', 'SQL Databases', 'Cloud Basics (AWS/Azure)', 'Unit Testing (JUnit, NUnit)'
  ],
  'Legacy Systems Modernization Engineer': [
    'COBOL', 'Mainframe Basics', 'Modern Language (Java, C#)', 'Migration Tools', 'Database Conversion', 'Code Refactoring'
  ],
  // Testing & Quality Assurance
  'Manual Tester': [
    'Manual Testing', 'Test Case Design & Execution', 'Bug Tracking (JIRA, Bugzilla)', 'Regression Testing', 'Functional Testing', 'API Testing (Postman)', 'SQL Basics', 'Software Development Life Cycle (SDLC)', 'Communication & Teamwork'
  ],
  'Automation Test Engineer': [
    'Selenium WebDriver', 'TestNG', 'JUnit', 'Python', 'Java (basic)', 'Automation Frameworks', 'API Testing (Postman)', 'Continuous Integration (Jenkins)', 'Git Version Control', 'Debugging & Troubleshooting'
  ],
  'Performance & Load Test Engineer': [
    'JMeter', 'LoadRunner', 'Performance Testing', 'Test Planning', 'Report Analysis', 'Scripting (basic)'
  ],
  'QA Engineer / QA Analyst': [
    'End-to-end Testing', 'Test Planning & Documentation', 'Defect Tracking', 'Agile & Scrum Methodologies', 'Cross-browser Testing', 'Mobile Testing (Appium)', 'Test Automation Basics'
  ],
  'Test Engineer – Entry Level': [
    'Software Testing Fundamentals', 'Test Case Writing', 'Defect Lifecycle', 'Automation Testing Exposure', 'Attention to Detail', 'Collaboration Skills'
  ],
  // Research & Emerging Tech
  'Research Assistant': [
    'Research Methodology', 'Data Collection & Analysis', 'Python (for AI/ML)', 'Machine Learning Basics', 'Scientific Writing', 'Literature Review'
  ],
  'Quantum Computing Research Intern': [
    'Qiskit', 'Quantum Algorithms (basic)', 'Python Programming', 'Quantum Gates & Circuits', 'Data Analysis'
  ],
  'Edge Computing Engineer': [
    'IoT Fundamentals', 'Edge Computing Concepts', 'Cloud Platforms (AWS IoT, Azure IoT)', 'Networking Basics', 'Python', 'C/C++'
  ],
  'Bioinformatics Researcher': [
    'Python', 'R Programming', 'Genomics Tools', 'Data Visualization', 'Statistical Analysis'
  ],
  'Green Computing Engineer': [
    'Energy-Efficient Computing', 'Sustainable IT Practices', 'Cloud Computing Basics', 'Performance Optimization', 'Research & Reporting'
  ],
};

const PredictionForm = () => {
  // Use environment variable for backend URL, fallback to localhost for development
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const { domainId } = useParams();
  const navigate = useNavigate();
  const allSkills = getAllSkills();
  
  // If a completed prediction exists, redirect user back to the result page
  useEffect(() => {
    const savedResult = localStorage.getItem('predictionApiResult');
    if (savedResult && savedResult !== 'null') {
      navigate('/result', { replace: true });
    }
  }, [navigate]);
  
  // Find selected domain if domainId is provided
  const selectedDomain = domainId ? getDomainById(domainId) : null;
  
  // Session storage key for this form
  const SESSION_STORAGE_KEY = 'predictionFormSession';
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  // Always start at step 1
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    name: '',
    email: '',
    mobile: '',
    college: '',
    degree: '',
    collegeCGPA: '',
    currentSem: '',
    tenthPercentage: '',
    twelfthPercentage: '',
  // Optional Master's
  hasMasters: false,
  mastersDegree: '',
  mastersCollege: '',
  mastersCGPA: '',
  mastersCurrentSem: '',
    
    // Step 2: Education & Career Selection
    selectedEducationId: '',
    selectedDomainId: domainId || '',
    selectedRoleId: '',
    customDomain: '',
    customJobRole: '',
    
  // Step 3: Skills & Experience
    selectedSkills: [],
    resumeSkills: [], // Skills parsed from resume upload
    numProjects: 0,
  // Structured list of projects used for prediction
  projects: [],
    hackathonsParticipated: false,
    numHackathons: '',
    hackathonsList: [], // Array of {title: string, winner: string}
    internshipsCompleted: false,
    numInternships: '',
    industrialInternships: '',
    virtualInternships: '',
    certifications: '',
    certificationsList: [], // Array of individual certifications
  achievements: '',
    // DSA Problem Solving
    dsaEasy: '',
    dsaMedium: '',
    dsaHard: '',
    resumeFile: null
  });
  
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showResumeLinker, setShowResumeLinker] = useState(false);
  const [mobileForResume, setMobileForResume] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [sessionRestored, setSessionRestored] = useState(false);
  const [manualOverrides, setManualOverrides] = useState({});
  const [internshipWarning, setInternshipWarning] = useState('');
  const [newHackathon, setNewHackathon] = useState({ title: '', winner: '' });
  const [incompleteFieldsWarning, setIncompleteFieldsWarning] = useState('');
  const [isPersonalResume, setIsPersonalResume] = useState(false); // Default unchecked
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [skillSectionsCollapsed, setSkillSectionsCollapsed] = useState({
    selected: true,
    unselected: true,
    resume: true
  });
  
  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.username) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);
  
  // Restore session on mount (do NOT clear sessionStorage on mount)
  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setFormData(parsed.formData || {});
          // Restore manual overrides if present
          if (parsed.manualOverrides) setManualOverrides(parsed.manualOverrides || {});
          // If last step was 3, set to 2 instead
          let step = parsed.currentStep || 1;
          if (step === 3) step = 2;
          setCurrentStep(step);
          // Restore any other state as needed
          console.log('🔄 Restored session data from sessionStorage');
        }
        setSessionRestored(true);
      } catch (err) {
        console.error('Error restoring session:', err);
        setSessionRestored(true);
      }
    };
    restoreSession();
  }, []);
    // Save session on formData or currentStep change
    useEffect(() => {
      if (sessionRestored) {
        const sessionData = {
          formData,
          currentStep,
          manualOverrides
        };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      }
    }, [formData, currentStep, sessionRestored]);
  
  // Clear session when user closes the browser/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear the session storage when user closes the site
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  useEffect(() => {
    // Update domain when URL parameter changes
    setFormData(prev => ({
      ...prev,
      selectedDomainId: domainId || ''
    }));
  }, [domainId]);

  // Auto-match resume parsed skills with available skill checkboxes
  useEffect(() => {
    // Only run auto-matching if we have resume skills and a job selection
    if (formData.resumeSkills && formData.resumeSkills.length > 0 && 
        formData.selectedRoleId && formData.selectedDomainId) {
      
      console.log('🔍 Starting auto-skill matching...');
      console.log('Resume skills:', formData.resumeSkills);
      console.log('Selected domain:', formData.selectedDomainId);
      console.log('Selected role:', formData.selectedRoleId);
      
      // Get available skills for the selected role
      const domain = getDomainById(formData.selectedDomainId);
      const roleObj = domain?.roles.find(r => r.id === formData.selectedRoleId);
      let relevantSkills = [];
      
      if (roleObj && Array.isArray(roleObj.skills) && roleObj.skills.length > 0) {
        relevantSkills = roleObj.skills;
        console.log('Using role-specific skills:', relevantSkills);
      } else {
        // Fallback to roleSkillsMap if needed
        const roleName = roleObj?.name;
        if (roleName && roleSkillsMap[roleName]) {
          relevantSkills = roleSkillsMap[roleName];
          console.log('Using roleSkillsMap for role:', roleName, relevantSkills);
        } else {
          relevantSkills = allSkills;
          console.log('Using all skills as fallback');
        }
      }
      
      // Find matching skills (case-insensitive comparison)
      const matchingSkills = formData.resumeSkills.filter(resumeSkill => 
        relevantSkills.some(availableSkill => 
          resumeSkill.toLowerCase().trim() === availableSkill.toLowerCase().trim()
        )
      );
      
      console.log('Matching skills found:', matchingSkills);
      
      // Auto-select matching skills that aren't already selected
      const skillsToAdd = matchingSkills.filter(skill => 
        !formData.selectedSkills.some(selected => 
          selected.toLowerCase().trim() === skill.toLowerCase().trim()
        )
      );
      
      console.log('Skills to add (not already selected):', skillsToAdd);
      console.log('Currently selected skills:', formData.selectedSkills);
      
      if (skillsToAdd.length > 0) {
        const updatedSelectedSkills = [...formData.selectedSkills, ...skillsToAdd];
        
        setFormData(prev => ({
          ...prev,
          selectedSkills: updatedSelectedSkills
        }));
        
        // Update skills in database
        updateResumeSkills(updatedSelectedSkills);
        
        console.log(`🎯 Auto-matched ${skillsToAdd.length} skills from resume:`, skillsToAdd);
        console.log('Updated selected skills:', updatedSelectedSkills);
      } else {
        console.log('No new skills to auto-select');
      }
    } else {
      console.log('Auto-matching skipped - missing requirements:', {
        hasResumeSkills: !!(formData.resumeSkills && formData.resumeSkills.length > 0),
        hasSelectedRoleId: !!formData.selectedRoleId,
        hasSelectedDomainId: !!formData.selectedDomainId
      });
    }
  }, [formData.resumeSkills, formData.selectedRoleId, formData.selectedDomainId]);
  
  // Keep UI clean: remove debug logs/effects
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'resumeFile') {
      const file = files[0];
      if (file) {
      setFormData(prev => ({
        ...prev,
          resumeFile: file
      }));
        
        // Auto-parse resume if file is uploaded
        parseResumeFile(file);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Auto-fill bachelor's currentSem as "completed" when Master's is enabled
        ...(name === 'hasMasters' && checked ? { currentSem: 'completed' } : {})
      }));
    } else {
      // Enforce internship breakdown validation
      if (name === 'industrialInternships' || name === 'virtualInternships') {
        const newValue = parseInt(value) || 0;
        const total = parseInt(formData.numInternships) || 0;
        const otherField = name === 'industrialInternships' ? 'virtualInternships' : 'industrialInternships';
        const otherValue = parseInt(formData[otherField]) || 0;
        
        // Prevent exceeding total
        if (newValue + otherValue > total) {
          // Show warning message
          setInternshipWarning(`Cannot add more! Total internships is ${total}. You already have ${otherValue} ${otherField === 'industrialInternships' ? 'industrial' : 'virtual'} internships.`);
          setTimeout(() => setInternshipWarning(''), 3000); // Clear after 3 seconds
          return; // Don't update if it would exceed total
        }
        // Clear warning if user is within limits
        setInternshipWarning('');
      }
      
      // Reset breakdown when total internships is decreased
      if (name === 'numInternships') {
        const newTotal = parseInt(value) || 0;
        const currentIndustrial = parseInt(formData.industrialInternships) || 0;
        const currentVirtual = parseInt(formData.virtualInternships) || 0;
        
        // If new total is less than current breakdown sum, reset breakdown to 0
        if (newTotal < currentIndustrial + currentVirtual) {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            industrialInternships: 0,
            virtualInternships: 0
          }));
          return;
        }
      }
      
      // Mark manual overrides for percentage/CGPA fields so parsers don't overwrite user input
      if (['tenthPercentage', 'twelfthPercentage', 'collegeCGPA', 'mastersCGPA'].includes(name)) {
        setManualOverrides(prev => ({ ...prev, [name]: true }));
      }

      setFormData(prev => ({
        ...prev,
        [name]: value
      }));

      // Check for existing resume when mobile number is entered/changed
      if (name === 'mobile' && value && value.length >= 10) {
        // Debounce the check to avoid excessive API calls
        setTimeout(() => {
          checkExistingResume(value);
        }, 1000);
      }
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Toggle manual override lock for specific fields
  const toggleManualOverride = (field) => {
    setManualOverrides(prev => {
      const next = { ...prev, [field]: !prev[field] };
      // Persist immediately to session so restores keep lock
      try {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        parsed.manualOverrides = next;
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handlePredictionSelection = (selectionData) => {
    console.log('🎯 DOMAIN SELECTION TRIGGERED');
    console.log('📥 Selection Data Received:', selectionData);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        selectedEducationId: selectionData.education || '',
        selectedDomainId: selectionData.domain || '',
        selectedRoleId: selectionData.role || ''
      };
      
      console.log('✅ FormData Updated:');
      console.log('   Domain ID:', updated.selectedDomainId || '⚠️ EMPTY');
      console.log('   Role ID:', updated.selectedRoleId || '⚠️ EMPTY');
      
      return updated;
    });
  };

  // Check if resume exists for the mobile number
  const checkExistingResume = async (mobile) => {
    try {
      const response = await fetch('http://localhost:5000/api/check-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile: mobile }),
      });

      const result = await response.json();

      if (result.success && result.exists) {
        // Resume found, show the linker modal
        setMobileForResume(mobile);
        setShowResumeLinker(true);
      } else {
        // No resume found, continue normally
        console.log(`No resume found for mobile: ${mobile}`);
      }
    } catch (error) {
      console.error('Error checking existing resume:', error);
      // Don't show modal on error, just continue normally
    }
  };

  // Handle resume linker choice
  const handleResumeLinkerSuccess = async (choice, result) => {
    if (choice === 'link_resume' && result.status === 'success') {
      // Resume was successfully linked - now fetch complete resume data
      setUploadMsg('Resume linked successfully! Fetching complete data...');
      
      try {
        // Call the link-resume-profile API to get complete resume data
        const response = await fetch('http://localhost:5000/api/link-resume-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: mobileForResume || formData.mobile,
            userData: {
              name: formData.name,
              email: formData.email,
              mobile: mobileForResume || formData.mobile
            }
          }),
        });

        const linkResult = await response.json();
        
        if (linkResult.success && linkResult.resumeData) {
          // Store complete resume data in localStorage for Dashboard
          localStorage.setItem('linkedResumeData', JSON.stringify(linkResult.resumeData));
          
          // Auto-populate form fields with resume data
          const resumeData = linkResult.resumeData;
          
          // Extract certifications and achievements
          const certificationsRaw = resumeData.certifications || resumeData.certs || [];
          const certificationsList = Array.isArray(certificationsRaw) 
            ? certificationsRaw 
            : (typeof certificationsRaw === 'string' 
                ? certificationsRaw.split(/\n|[,;]/).map(s => s.trim()).filter(Boolean) 
                : []);
          
          const achievementsRaw = resumeData.achievements || resumeData.awards || [];
          const achievementsList = Array.isArray(achievementsRaw) 
            ? achievementsRaw 
            : (typeof achievementsRaw === 'string' 
                ? achievementsRaw.split(/\n|[,;]/).map(s => s.trim()).filter(Boolean) 
                : []);
          
          // When a resume is linked, parsed percentages/CGPA should take priority.
          // If parser doesn't provide them, default to '0'. Also clear any manual overrides for these fields.
          setFormData(prev => ({
            ...prev,
            name: resumeData.name || prev.name,
            email: resumeData.email || prev.email,
            mobile: resumeData.mobile || prev.mobile,
            collegeCGPA: (resumeData.cgpa != null ? String(resumeData.cgpa) : '0'),
            tenthPercentage: (resumeData.tenthPercentage != null ? String(resumeData.tenthPercentage) : '0'),
            twelfthPercentage: (resumeData.twelfthPercentage != null ? String(resumeData.twelfthPercentage) : '0'),
            university: resumeData.university || prev.university,
            degree: resumeData.degree || prev.degree,
            certifications: certificationsList.join(', ') || prev.certifications,
            certificationsList: certificationsList.length > 0 ? certificationsList : prev.certificationsList,
            achievements: achievementsList.join('\n') || prev.achievements
          }));

          // Clear manualOverrides for academic fields because resume now has priority
          setManualOverrides(prev => ({ ...prev, tenthPercentage: false, twelfthPercentage: false, collegeCGPA: false, mastersCGPA: false }));

          // Auto-populate skills if available
          if (resumeData.skills && resumeData.skills.length > 0) {
            const resumeSkills = Array.isArray(resumeData.skills) ? resumeData.skills : [];
            setFormData(prev => ({
              ...prev,
              selectedSkills: [...new Set([...prev.selectedSkills, ...resumeSkills])]
            }));
          }

          setUploadMsg(`Resume linked successfully! Found ${resumeData.skills?.length || 0} skills, ${resumeData.projects?.length || 0} projects, ${resumeData.certifications?.length || 0} certifications.`);
        } else {
          setUploadMsg('Resume linked but failed to fetch complete data. Please check manually.');
        }
      } catch (error) {
        console.error('Error fetching complete resume data:', error);
        setUploadMsg('Resume linked but failed to fetch complete data. Please try again.');
      }
      
      setTimeout(() => {
        setShowResumeLinker(false);
      }, 3000);
    } else if (choice === 'upload_new') {
      // User wants to upload new resume
      setUploadMsg('Please upload a new resume using the file upload below.');
      setShowResumeLinker(false);
    }
  };

  const handleResumeLinkerClose = () => {
    setShowResumeLinker(false);
  };

  // (Projects are captured via a simple text area; structured editing removed)
  // Project field helpers (structured inputs like before)
  const handleNumProjectsChange = (e) => {
    const value = Math.max(0, Math.min(5, parseInt(e.target.value || '0', 10)));
    setFormData(prev => {
      const projects = Array.isArray(prev.projects) ? [...prev.projects] : [];
      if (projects.length < value) {
        while (projects.length < value) projects.push({ title: '', description: '' });
      } else if (projects.length > value) {
        projects.length = value;
      }
      return { ...prev, numProjects: value, projects };
    });
  };

  const handleProjectChange = (index, field, value) => {
    setFormData(prev => {
      const projects = Array.isArray(prev.projects) ? [...prev.projects] : [];
      if (!projects[index]) projects[index] = { title: '', description: '' };
      projects[index] = { ...projects[index], [field]: value };
      return { ...prev, projects };
    });
  };
  
  const parseResumeFile = async (file) => {
    if (!file) return;

    const fd = new FormData();
    fd.append('resume', file);

    let progressInterval = null;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadMsg('Uploading and parsing resume…');
      
      // Simulate progress animation
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            return prev; // Stay at 90% until actual completion
          }
          // Faster progress initially, slower as it approaches 90%
          const increment = prev < 30 ? 8 : prev < 60 ? 5 : prev < 80 ? 3 : 1;
          return Math.min(prev + increment, 90);
        });
      }, 150);
      
      // Clear old session data when new resume is uploaded
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('🧹 Cleared old session data before parsing new resume');
      
  const res = await fetch(`${API_BASE}/api/parse-resume`, {
        method: 'POST',
        body: fd
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success || !payload?.data) {
        const err = payload?.error || `HTTP ${res.status}`;
        setUploadMsg(`Resume parsing failed: ${err}`);
        clearInterval(progressInterval);
        setUploadProgress(0);
        setUploading(false);
        alert('Failed to parse resume: ' + err);
        return;
      }

      const d = payload.data || {};
      console.log('Parsed resume data:', d);

      setFormData(prev => {
        // Normalize projects and also fill a simple comma-separated titles field
        const rawProjects = Array.isArray(d.projects) ? d.projects : [];
        const projectsStructured = rawProjects.slice(0, 5).map(p => (
          typeof p === 'string' ? { title: p, description: '' } : { title: p?.title || '', description: p?.description || '' }
        ));

        // Extract achievements & certifications: support array or string fields from parser
        const achievementsRaw = d.achievements || d.awards || [];
        const certificationsRaw = d.certifications || d.certs || [];
        const achievementsList = Array.isArray(achievementsRaw) ? achievementsRaw : (typeof achievementsRaw === 'string' ? achievementsRaw.split(/\n|[,;]/).map(s=>s.trim()).filter(Boolean) : []);
        const certificationsList = Array.isArray(certificationsRaw) ? certificationsRaw : (typeof certificationsRaw === 'string' ? certificationsRaw.split(/\n|[,;]/).map(s=>s.trim()).filter(Boolean) : []);

        const updated = {
          ...prev,
          // Basic information
          name: d.name ?? prev.name,
          email: d.email ?? prev.email,
          mobile: d.phone ?? prev.mobile,
          // Academic (prefer new explicit bachelor fields; fallback to legacy)
          degree: d.bachelorDegree ?? d.degree ?? prev.degree,
          college: d.bachelorUniversity ?? d.university ?? prev.college,
          // When a resume is parsed, prefer resume values; default to '0' if missing
          collegeCGPA: (d.bachelorCGPA != null ? String(d.bachelorCGPA) : (d.cgpa != null ? String(d.cgpa) : '0')),
          // Master's (only auto-fill if present)
          hasMasters: !!(d.mastersDegree || d.mastersUniversity || (d.mastersCGPA && d.mastersCGPA > 0)),
          mastersDegree: d.mastersDegree || '',
          mastersCollege: d.mastersUniversity || '',
          mastersCGPA: d.mastersCGPA || '',
          mastersCurrentSem: d.mastersCurrentSem || '',
          // If Master's fields exist, set bachelor's currentSem to "completed"
          currentSem: (d.mastersDegree || d.mastersUniversity || (d.mastersCGPA && d.mastersCGPA > 0)) ? 'completed' : (d.currentSem || ''),
          
          selectedDomainId: prev.selectedDomainId,

          // Skills and experience - reset skills when new resume is uploaded
          resumeSkills: Array.isArray(d.skills) ? d.skills : [],
          // Clear previously selected skills when new resume is uploaded
          selectedSkills: [],
          numProjects: projectsStructured.filter(p => p.title || p.description).length,
          // Projects (structured)
          projects: projectsStructured,

          // Internships
          internshipsCompleted: Array.isArray(d.internships) ? d.internships.length > 0 : prev.internshipsCompleted,
          numInternships: Array.isArray(d.internships) ? d.internships.length : prev.numInternships,

          // Academics - parsed resume values take priority; default to '0' when missing
          tenthPercentage: (d.tenthPercentage != null ? String(d.tenthPercentage) : '0'),
          twelfthPercentage: (d.twelfthPercentage != null ? String(d.twelfthPercentage) : '0'),

          // Achievements & Certifications (joined with newlines for textarea compatibility)
          achievements: achievementsList.join('\n') || prev.achievements,
          certifications: certificationsList.join(', ') || prev.certifications,
          certificationsList: certificationsList.length > 0 ? certificationsList : prev.certificationsList,
        };
        
        // Store parsed resume data for ATS score calculation
        sessionStorage.setItem('parsedResumeData', JSON.stringify(d));

        // Since parser provided values, clear manual override flags so resume values remain.
        setManualOverrides(prev => ({ ...prev, tenthPercentage: false, twelfthPercentage: false, collegeCGPA: false, mastersCGPA: false }));

        return updated;
  });
  setUploadMsg('Resume parsed successfully. Form auto-filled. Submit to generate score.');
      
      // Complete progress animation
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error parsing resume:', error);
      setUploadMsg('Backend not reachable or parsing error.');
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleSkillToggle = async (skill) => {
    const updatedSkills = formData.selectedSkills.includes(skill)
      ? formData.selectedSkills.filter(s => s !== skill)
      : [...formData.selectedSkills, skill];
      
    setFormData(prev => ({
      ...prev,
      selectedSkills: updatedSkills
    }));

    // Update skills in database if mobile number is available
    await updateResumeSkills(updatedSkills);
  };

  // Function to update selected skills in resume database
  const updateResumeSkills = async (selectedSkills) => {
    try {
      const mobile = mobileForResume || formData.mobile;
      if (!mobile || selectedSkills.length === 0) {
        return; // Don't update if no mobile or no skills selected
      }

      // Compute unselected skills (Skills You Can Develop)
      const relevantSkills = getRelevantSkills();
      const unselectedSkills = relevantSkills.filter(skill => !selectedSkills.includes(skill));

      console.log('📤 Sending to backend:', {
        mobile,
        selectedCount: selectedSkills.length,
        unselectedCount: unselectedSkills.length
      });

      const response = await fetch('http://localhost:5000/api/update-resume-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          selectedSkills: selectedSkills,
          unselectedSkills: unselectedSkills,
          jobDomain: formData.selectedDomainId || formData.customDomain || '',
          jobRole: formData.selectedRoleId || ''
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Resume updated: ${selectedSkills.length} selected, ${unselectedSkills.length} to develop`);
        // Optionally show a success message to user
        // setUploadMsg(`Skills updated in your resume! (${selectedSkills.length} skills selected)`);
      } else {
        console.warn('Failed to update resume skills:', result.error);
      }
    } catch (error) {
      console.error('Error updating resume skills:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Add certification
  const handleAddCertification = () => {
    if (newCertification.trim()) {
      const updatedList = [...formData.certificationsList, newCertification.trim()];
      setFormData(prev => ({
        ...prev,
        certificationsList: updatedList,
        certifications: updatedList.join(', ')
      }));
      setNewCertification('');
    }
  };

  // Remove certification
  const handleRemoveCertification = (index) => {
    const updatedList = formData.certificationsList.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      certificationsList: updatedList,
      certifications: updatedList.join(', ')
    }));
  };

  // Handle Enter key press in certification input
  const handleCertificationKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCertification();
    }
  };

  // Add hackathon
  const handleAddHackathon = () => {
    if (newHackathon.title.trim() && newHackathon.winner) {
      const updatedList = [...formData.hackathonsList, { title: newHackathon.title.trim(), winner: newHackathon.winner }];
      setFormData(prev => ({
        ...prev,
        hackathonsList: updatedList
      }));
      setNewHackathon({ title: '', winner: '' });
    }
  };

  // Remove hackathon
  const handleRemoveHackathon = (index) => {
    const updatedList = formData.hackathonsList.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      hackathonsList: updatedList
    }));
  };

  // Handle Enter key press in hackathon input
  const handleHackathonKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHackathon();
    }
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
  if (step === 1) {
      // Validate Step 1: Basic Details
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
      
      if (!formData.tenthPercentage) newErrors.tenthPercentage = '10th percentage is required';
      else if (parseFloat(formData.tenthPercentage) < 0 || parseFloat(formData.tenthPercentage) > 100) {
        newErrors.tenthPercentage = '10th percentage must be between 0 and 100';
      }
      
      if (!formData.twelfthPercentage) newErrors.twelfthPercentage = '12th percentage is required';
      else if (parseFloat(formData.twelfthPercentage) < 0 || parseFloat(formData.twelfthPercentage) > 100) {
        newErrors.twelfthPercentage = '12th percentage must be between 0 and 100';
      }
      
      // Bachelor's Degree Details
      if (!formData.degree.trim()) newErrors.degree = 'Degree/Course is required';
      if (!formData.college.trim()) newErrors.college = 'College/University is required';
      
      if (!formData.collegeCGPA) newErrors.collegeCGPA = 'College CGPA is required';
      else if (parseFloat(formData.collegeCGPA) < 0 || parseFloat(formData.collegeCGPA) > 10) {
        newErrors.collegeCGPA = 'CGPA must be between 0 and 10';
      }
      
      if (!formData.currentSem) newErrors.currentSem = 'Current semester is required';
      
      // Master's validation only if section is enabled
      if (formData.hasMasters) {
        if (!formData.mastersCurrentSem) {
          newErrors.mastersCurrentSem = "Master's current semester is required";
        }
        // Master's CGPA validation only if value entered
        if (formData.mastersCGPA) {
          const m = parseFloat(formData.mastersCGPA);
          if (isNaN(m) || m < 0 || m > 10) {
            newErrors.mastersCGPA = "Master's CGPA must be between 0 and 10";
          }
        }
      }
    }
    
    if (step === 2) {
      // Validate Step 2: Education & Career Selection
      if (!formData.selectedEducationId) {
        newErrors.education = 'Please select your education background';
      }
      if (!formData.selectedDomainId) {
        newErrors.domain = 'Please select a job domain';
      }
      if (!formData.selectedRoleId) {
        newErrors.role = 'Please select a job role';
      }
    }
    
    if (step === 3) {
      // Validate internship breakdown if internships are completed
      if (formData.internshipsCompleted) {
        const total = parseInt(formData.numInternships) || 0;
        const industrial = parseInt(formData.industrialInternships) || 0;
        const virtual = parseInt(formData.virtualInternships) || 0;
        const breakdown = industrial + virtual;
        
        if (breakdown !== total) {
          newErrors.internships = `Internship breakdown (${industrial} industrial + ${virtual} virtual = ${breakdown}) must equal total internships (${total})`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (currentStep >= 3) return;
    
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setIncompleteFieldsWarning(''); // Clear warning on successful validation
    } else {
      // Show warning message based on the step
      if (currentStep === 1) {
        setIncompleteFieldsWarning('Please fill in all required fields in Basic Details before proceeding.');
      } else if (currentStep === 2) {
        setIncompleteFieldsWarning('Please select Education Background, Job Domain, and Job Role before proceeding to the next step.');
      }
      // Auto-hide warning after 3 seconds
      setTimeout(() => {
        setIncompleteFieldsWarning('');
      }, 3000);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep !== 3) return;

    if (validateStep(currentStep)) {
      try {
        setSubmitting(true);
        setErrorMessage('');
        // Normalize projects and build payload
        const projects = (Array.isArray(formData.projects) ? formData.projects : []).slice(0, 5);
        const filledProjects = projects.filter(p => (p.title && p.title.trim()) || (p.description && p.description.trim()));
        
        // Get available role skills count for 100% skill score logic
        const relevantSkills = getRelevantSkills();
        const availableRoleSkills = Array.isArray(relevantSkills) ? relevantSkills.length : 0;
        
        // Compute unselected skills (Skills You Can Develop)
        const selectedSkillsList = formData.selectedSkills || [];
        const unselectedSkills = relevantSkills.filter(skill => !selectedSkillsList.includes(skill));
        
        // Enhanced payload with separate skill sources for backend processing
        const payload = { 
          ...formData,
          // Convert DSA problem counts to numbers (0 if empty)
          dsaEasy: parseInt(formData.dsaEasy) || 0,
          dsaMedium: parseInt(formData.dsaMedium) || 0,
          dsaHard: parseInt(formData.dsaHard) || 0,
          // Convert hackathon count to number (0 if empty)
          numHackathons: parseInt(formData.numHackathons) || 0,
          // Convert internship counts to numbers (0 if empty)
          numInternships: parseInt(formData.numInternships) || 0,
          industrialInternships: parseInt(formData.industrialInternships) || 0,
          virtualInternships: parseInt(formData.virtualInternships) || 0,
          projects: filledProjects, 
          numProjects: filledProjects.length,
          // Send both skill sources to backend for enhanced scoring
          selectedSkills: selectedSkillsList, // Skills manually selected in form
          unselectedSkills: unselectedSkills, // Skills to develop (unselected)
          skills: formData.resumeSkills || [],  // Skills extracted from resume parsing
          availableRoleSkills: availableRoleSkills,  // Total skills available for the selected role
          // Flag to indicate if this should be saved to user's dashboard/MongoDB
          isPersonalResume: isLoggedIn && isPersonalResume
        };

        // 🔍 DEBUG: Log what's being sent
        console.log('🚀 SUBMITTING PREDICTION REQUEST');
        console.log('📝 Selected Domain ID:', payload.selectedDomainId || '⚠️ EMPTY!');
        console.log('📝 Selected Role ID:', payload.selectedRoleId || '⚠️ EMPTY!');
        console.log('📝 Selected Skills Count:', payload.selectedSkills?.length || 0);
        console.log('📝 Unselected Skills Count:', payload.unselectedSkills?.length || 0);
        console.log('📝 Resume Skills Count:', payload.skills?.length || 0);
        console.log('📝 Available Role Skills:', payload.availableRoleSkills);
        console.log('📦 Full Payload:', payload);

        // Persist form data regardless of API result
        localStorage.setItem('predictionFormData', JSON.stringify(payload));

        // Call backend ML prediction
        const res = await fetch(`${API_BASE}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          const err = json?.error || `HTTP ${res.status}`;
          setErrorMessage(`Prediction failed: ${err}`);
          return;
        }

        localStorage.setItem('predictionApiResult', JSON.stringify(json.data));
        
        // If this is a personal resume for a logged-in user, also update linkedResumeData for dashboard
        if (isLoggedIn && isPersonalResume) {
          const linkedData = {
            ...payload,
            prediction: json.data,
            jobSelection: {
              selectedSkills: payload.selectedSkills,
              unselectedSkills: payload.unselectedSkills,
              jobDomain: payload.selectedDomainId,
              jobRole: payload.selectedRoleId,
              updatedAt: new Date().toISOString()
            },
            lastUpdated: new Date().toISOString()
          };
          localStorage.setItem('linkedResumeData', JSON.stringify(linkedData));
          console.log('📊 Personal resume data saved to linkedResumeData for dashboard');
        }
        
        // Clear session storage after successful submission
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        console.log('🧹 Session cleared after successful submission');
        
        navigate('/result');
      } catch (err) {
        setErrorMessage('Prediction service is not reachable.');
      } finally {
        setSubmitting(false);
      }
    } else {
      setErrorMessage('Please complete all required fields in Step 3 before submitting.');
    }
  };
  
  const getRelevantSkills = () => {
    // Use skills from the selected role object in jobDomainData.js if available
    if (formData.selectedRoleId && formData.selectedDomainId) {
      const domain = getDomainById(formData.selectedDomainId);
      const roleObj = domain?.roles.find(r => r.id === formData.selectedRoleId);
      if (roleObj && Array.isArray(roleObj.skills) && roleObj.skills.length > 0) {
        return roleObj.skills;
      }
      // Fallback to roleSkillsMap if needed
      const roleName = roleObj?.name;
      if (roleName && roleSkillsMap[roleName]) {
        return roleSkillsMap[roleName];
      }
    }
    return allSkills;
  };
  
  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Basic Details</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Fill in your personal and academic information</p>
      </div>

      {/* Resume Upload Section - At the very top */}
      <div className={`${themeClasses.sectionBackground} rounded-lg p-6 mb-6 border ${themeClasses.cardBorder}`}>
        <div className="text-center mb-4">
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>📄 Resume Upload (Optional)</h3>
          <p className={`${themeClasses.textSecondary} text-sm`}>Upload your resume to auto-fill the form with your details</p>
        </div>

        <div>
          <label htmlFor="resumeFile" className={`block text-sm font-medium ${themeClasses.textPrimary} mb-2`}>
            Upload Resume - Auto-fill Form
          </label>
          
          {uploadMsg && !uploading && (
            <div className={`mb-2 text-sm ${uploadMsg.startsWith('Resume parsed') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {uploadMsg}
            </div>
          )}
          
          <input
            type="file"
            id="resumeFile"
            name="resumeFile"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.txt"
            disabled={uploading}
            className={`block w-full text-sm ${themeClasses.textSecondary}
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:${themeClasses.badgeBackground} file:${themeClasses.badgeText}
              hover:file:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <p className={`${themeClasses.textSecondary} mt-2 text-xs`}>
            Supported formats: PDF, DOCX, DOC, TXT (Max 5MB)
          </p>

          {formData.resumeFile && !uploading && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded text-sm text-green-800 dark:text-green-300">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="font-medium">Resume uploaded successfully!</div>
                  <div className="text-xs mt-1">Form has been auto-filled where possible. You can edit any field if needed.</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {uploadMsg && (
          <div className={`mt-2 text-xs ${uploading ? themeClasses.accent : uploadMsg.startsWith('Resume parsed') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{uploadMsg}</div>
        )}
      </div>

      {/* Two-column form layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Row 1 */}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Full Name*</label>
          <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" className={`form-input border-2 ${errors.name ? 'border-red-500' : themeClasses.cardBorder}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Email Address*</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="johndoe@example.com" className={`form-input border-2 ${errors.email ? 'border-red-500' : themeClasses.cardBorder}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Row 2 */}
        <div>
          <label htmlFor="mobile" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Mobile Number*</label>
          <input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} placeholder="+91 98765 43210" className={`form-input border-2 ${errors.mobile ? 'border-red-500' : themeClasses.cardBorder}`} />
          {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
        </div>
        <div>
          <label htmlFor="tenthPercentage" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">10th Percentage* (out of 100)</label>
          <div className="flex items-center gap-2">
            <input id="tenthPercentage" name="tenthPercentage" type="number" value={formData.tenthPercentage} onChange={handleChange} placeholder="e.g. 85" min="0" max="100" step="0.01" className={`form-input flex-1 border-2 ${errors.tenthPercentage ? 'border-red-500' : themeClasses.cardBorder}`} />
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => toggleManualOverride('tenthPercentage')} title={manualOverrides.tenthPercentage ? 'Locked — parser will not overwrite' : 'Unlocked — click to lock this field'} className="px-2 py-1 rounded-full bg-gray-200 dark:bg-[#2d1f3d] text-sm">
                {manualOverrides.tenthPercentage ? '🔒' : '🔓'}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">{manualOverrides.tenthPercentage ? 'Locked' : 'Lock if correct'}</span>
            </div>
          </div>
          {errors.tenthPercentage && <p className="text-red-500 text-xs mt-1">{errors.tenthPercentage}</p>}
        </div>

        {/* Row 3: 12th Percentage only */}
        <div>
          <label htmlFor="twelfthPercentage" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">12th Percentage* (out of 100)</label>
          <div className="flex items-center gap-2">
            <input id="twelfthPercentage" name="twelfthPercentage" type="number" value={formData.twelfthPercentage} onChange={handleChange} placeholder="e.g. 78" min="0" max="100" step="0.01" className={`form-input flex-1 border-2 ${errors.twelfthPercentage ? 'border-red-500' : themeClasses.cardBorder}`} />
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => toggleManualOverride('twelfthPercentage')} title={manualOverrides.twelfthPercentage ? 'Locked — parser will not overwrite' : 'Unlocked — click to lock this field'} className="px-2 py-1 rounded-full bg-gray-200 dark:bg-[#2d1f3d] text-sm">
                {manualOverrides.twelfthPercentage ? '🔒' : '🔓'}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">{manualOverrides.twelfthPercentage ? 'Locked' : 'Lock if correct'}</span>
            </div>
          </div>
          {errors.twelfthPercentage && <p className="text-red-500 text-xs mt-1">{errors.twelfthPercentage}</p>}
        </div>
        <div className="md:col-span-1" />

        {/* Bachelor's Degree Details Heading */}
        <div className="md:col-span-2 pt-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide mb-2">Bachelor's Degree Details</h3>
        </div>
        <div>
          <label htmlFor="degree" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Degree / Course*</label>
          <input id="degree" name="degree" type="text" value={formData.degree} onChange={handleChange} placeholder="B.Tech, BSc, BBA" className={`form-input border-2 ${errors.degree ? 'border-red-500' : themeClasses.cardBorder}`} />
          {errors.degree && <p className="text-red-500 text-xs mt-1">{errors.degree}</p>}
        </div>
        <div>
          <label htmlFor="college" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">College / University*</label>
          <input id="college" name="college" type="text" value={formData.college} onChange={handleChange} placeholder="IIT Delhi, IIM Bangalore" className={`form-input border-2 ${errors.college ? 'border-red-500' : themeClasses.cardBorder}`} />
          {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college}</p>}
        </div>
        <div>
          <label htmlFor="collegeCGPA" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">CGPA* (out of 10)</label>
          <div className="flex items-center gap-2">
            <input id="collegeCGPA" name="collegeCGPA" type="number" value={formData.collegeCGPA} onChange={handleChange} placeholder="7" min="0" max="10" step="0.01" className={`form-input flex-1 border-2 ${errors.collegeCGPA ? 'border-red-500' : themeClasses.cardBorder}`} />
            <div className="flex flex-col items-center gap-1">
              <button type="button" onClick={() => toggleManualOverride('collegeCGPA')} title={manualOverrides.collegeCGPA ? 'Locked — parser will not overwrite' : 'Unlocked — click to lock this field'} className="px-2 py-1 rounded-full bg-gray-200 dark:bg-[#2d1f3d] text-sm">
                {manualOverrides.collegeCGPA ? '🔒' : '🔓'}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">{manualOverrides.collegeCGPA ? 'Locked' : 'Lock if correct'}</span>
            </div>
          </div>
          {errors.collegeCGPA && <p className="text-red-500 text-xs mt-1">{errors.collegeCGPA}</p>}
        </div>
        <div>
          <label htmlFor="currentSem" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Current Sem*</label>
          <select id="currentSem" name="currentSem" value={formData.currentSem} onChange={handleChange} className={`form-input border-2 ${errors.currentSem ? 'border-red-500' : themeClasses.cardBorder}`}>
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="3">3rd Semester</option>
            <option value="4">4th Semester</option>
            <option value="5">5th Semester</option>
            <option value="6">6th Semester</option>
            <option value="7">7th Semester</option>
            <option value="8">8th Semester</option>
            <option value="completed">Completed</option>
          </select>
          {errors.currentSem && <p className="text-red-500 text-xs mt-1">{errors.currentSem}</p>}
        </div>
      </div>

      {/* Master's Section Toggle */}
      <div className="pt-2 border-t border-gray-200 dark:border-tech-gray-700">
        <div className="flex items-center mb-4">
          <input id="hasMasters" name="hasMasters" type="checkbox" checked={formData.hasMasters} onChange={handleChange} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
          <label htmlFor="hasMasters" className="ml-2 text-sm font-bold text-gray-800 dark:text-white">Add Master's Degree Details</label>
        </div>
        {formData.hasMasters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="mastersDegree" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Master's Degree</label>
              <input id="mastersDegree" name="mastersDegree" type="text" value={formData.mastersDegree} onChange={handleChange} placeholder="M.Tech, M.Sc, MBA" className="form-input border-2 border-pink-300 dark:border-pink-700 focus:border-pink-500 dark:focus:border-pink-400" />
            </div>
            <div>
              <label htmlFor="mastersCollege" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Master's College/University</label>
              <input id="mastersCollege" name="mastersCollege" type="text" value={formData.mastersCollege} onChange={handleChange} placeholder="IIT Delhi, IIM Bangalore" className="form-input border-2 border-pink-300 dark:border-pink-700 focus:border-pink-500 dark:focus:border-pink-400" />
            </div>
            <div>
              <label htmlFor="mastersCGPA" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Master's CGPA (out of 10)</label>
              <div className="flex items-center gap-2">
                <input id="mastersCGPA" name="mastersCGPA" type="number" value={formData.mastersCGPA} onChange={handleChange} placeholder="8.2" min="0" max="10" step="0.01" className={`form-input flex-1 border-2 ${errors.mastersCGPA ? 'border-red-500' : 'border-pink-300 dark:border-pink-700 focus:border-pink-500 dark:focus:border-pink-400'}`} />
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => toggleManualOverride('mastersCGPA')} title={manualOverrides.mastersCGPA ? 'Locked — parser will not overwrite' : 'Unlocked — click to lock this field'} className="px-2 py-1 rounded-full bg-gray-200 dark:bg-[#2d1f3d] text-sm">
                    {manualOverrides.mastersCGPA ? '🔒' : '🔓'}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{manualOverrides.mastersCGPA ? 'Locked' : 'Lock if correct'}</span>
                </div>
              </div>
              {errors.mastersCGPA && <p className="text-red-500 text-xs mt-1">{errors.mastersCGPA}</p>}
            </div>
            <div>
              <label htmlFor="mastersCurrentSem" className="block text-sm font-bold text-gray-800 dark:text-white mb-2">Current Sem*</label>
              <select id="mastersCurrentSem" name="mastersCurrentSem" value={formData.mastersCurrentSem} onChange={handleChange} className={`form-input border-2 ${errors.mastersCurrentSem ? 'border-red-500' : 'border-pink-300 dark:border-pink-700 focus:border-pink-500 dark:focus:border-pink-400'}`}>
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">3rd Semester</option>
                <option value="4">4th Semester</option>
                <option value="completed">Completed</option>
              </select>
              {errors.mastersCurrentSem && <p className="text-red-500 text-xs mt-1">{errors.mastersCurrentSem}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderStep2 = () => {
    // Wait for session restoration to complete before rendering
    if (!sessionRestored) {
      return (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <PredictionSection 
          onSelectionChange={handlePredictionSelection}
          initialEducation={formData.selectedEducationId}
          initialDomain={formData.selectedDomainId}
          initialRole={formData.selectedRoleId}
          className="mb-6"
        />
        
        {/* Validation Warning - Below Job Role */}
        {incompleteFieldsWarning && currentStep === 2 && (
          <div className="mt-4 animate-bounce-in">
            <div className="bg-yellow-900 dark:bg-yellow-800 border-2 border-yellow-600 dark:border-yellow-500 rounded-xl shadow-xl">
              <div className="flex items-center p-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-yellow-100">
                    {incompleteFieldsWarning}
                  </p>
                </div>
                <button
                  onClick={() => setIncompleteFieldsWarning('')}
                  className="ml-4 flex-shrink-0 text-yellow-400 hover:text-yellow-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* Selected Career Path Summary */}
        {(formData.selectedEducationId || formData.selectedDomainId || formData.selectedRoleId) && (
        <div className="mt-6 p-4 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-900">
          <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-300 mb-2">Selected Career Path</h3>
          <div className="space-y-1">
            {formData.selectedEducationId && (
              <p className="text-sm text-pink-800 dark:text-pink-300">
                <span className="font-medium">Education:</span> {formData.selectedEducationId}
              </p>
            )}
            {formData.selectedDomainId && (
              <p className="text-sm text-pink-800 dark:text-pink-300">
                <span className="font-medium">Domain:</span> {formData.selectedDomainId}
              </p>
            )}
            {formData.selectedRoleId && (
              <p className="text-sm text-pink-800 dark:text-pink-300">
                <span className="font-medium">Role:</span> {formData.selectedRoleId}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
    );
  };
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8 bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)]">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Skills & Experience
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">Select your skills and provide experience details</p>
        <div className="mt-4 w-20 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 dark:from-pink-500 dark:via-purple-500 dark:to-orange-500 rounded-full mx-auto shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-glow"></div>
      </div>
          
      <div className="space-y-6">
        {/* Technical Skills Section - Neumorphism Theme */}
        <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                  Technical Skills
                  <span className="text-xs bg-gray-100 dark:bg-[#12121a] text-red-600 dark:text-red-400 px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] font-bold">Required</span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Select all skills you're confident with</p>
              </div>
            </div>
            {formData.selectedSkills.length > 0 && (
              <span className="bg-gray-100 dark:bg-[#12121a] text-pink-700 dark:text-pink-400 text-sm font-bold px-4 py-2 rounded-full shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)]">
                {formData.selectedSkills.length} Selected
              </span>
            )}
          </div>

          {errors.skills && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-red-500">
              <p className="text-sm text-red-700 dark:text-red-400 font-semibold">⚠️ {errors.skills}</p>
            </div>
          )}
          {errors.skillsWarning && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-orange-500">
              <p className="text-sm text-orange-700 dark:text-orange-400 font-semibold">💡 {errors.skillsWarning}</p>
            </div>
          )}

          {/* Selected Skills Summary - Collapsible */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] border-l-4 border-green-500">
            <button 
              type="button"
              onClick={() => setSkillSectionsCollapsed(prev => ({...prev, selected: !prev.selected}))}
              className="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                  Selected Skills ({formData.selectedSkills.length})
                </h4>
              </div>
              {skillSectionsCollapsed.selected ? (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            {!skillSectionsCollapsed.selected && (
              <div className="mt-3">
                {formData.selectedSkills.length === 0 ? (
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                    ⚠️ None selected - This will result in 0% skill score!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedSkills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 dark:bg-[#12121a] text-pink-800 dark:text-pink-300 px-3 py-1.5 rounded-full text-sm font-medium shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:hover:shadow-glow transition-all duration-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Unselected Skills Summary - Collapsible */}
          {(() => {
            const relevantSkills = getRelevantSkills();
            const unselectedSkills = relevantSkills.filter(skill => !formData.selectedSkills.includes(skill));
            
            return unselectedSkills.length > 0 && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] border-l-4 border-purple-500">
                <button 
                  type="button"
                  onClick={() => setSkillSectionsCollapsed(prev => ({...prev, unselected: !prev.unselected}))}
                  className="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                      Skills You Can Develop ({unselectedSkills.length})
                    </h4>
                  </div>
                  {skillSectionsCollapsed.unselected ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                {!skillSectionsCollapsed.unselected && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {unselectedSkills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 dark:bg-[#12121a] text-purple-800 dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-medium shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:hover:shadow-glow transition-all duration-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-400 font-medium mt-3">
                      💡 Consider learning these skills to improve your job prospects!
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Resume Skills Summary - Collapsible */}
          {formData.resumeSkills && formData.resumeSkills.length > 0 && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-green-500">
              <button 
                type="button"
                onClick={() => setSkillSectionsCollapsed(prev => ({...prev, resume: !prev.resume}))}
                className="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <h4 className="text-sm font-bold text-green-800 dark:text-green-400">
                    Resume Parsed Skills ({formData.resumeSkills.length})
                  </h4>
                </div>
                {skillSectionsCollapsed.resume ? (
                  <ChevronDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </button>
              {!skillSectionsCollapsed.resume && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.resumeSkills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 dark:bg-[#12121a] text-green-800 dark:text-green-300 px-3 py-1.5 rounded-full text-sm font-medium shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)]">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    ✓ These skills were automatically extracted from your resume
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Skills Checkboxes */}
          <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] p-5 border border-gray-300/30 dark:border-gray-600/30">
            <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-lg">🔘</span>
              Available Skills - Select all that apply
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
              {getRelevantSkills().map(skill => {
                const isSelected = formData.selectedSkills.includes(skill);
                const isFromResume = formData.resumeSkills && formData.resumeSkills.some(resumeSkill => 
                  resumeSkill.toLowerCase().trim() === skill.toLowerCase().trim()
                );
                
                return (
                  <div 
                    key={skill} 
                    className={`flex items-center p-3 rounded-xl transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-gray-100 dark:bg-[#12121a] shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-pink-500' 
                        : 'bg-gray-100 dark:bg-[#12121a] shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:hover:shadow-glow border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`skill-${skill}`}
                      checked={isSelected}
                      onChange={() => handleSkillToggle(skill)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 focus:ring-2 border-gray-300 rounded cursor-pointer"
                    />
                    <label 
                      htmlFor={`skill-${skill}`} 
                      className={`ml-3 text-sm font-medium flex items-center cursor-pointer ${
                        isSelected ? 'text-pink-800 dark:text-pink-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {skill}
                      {isFromResume && isSelected && (
                        <span className="ml-2 text-sm" title="Auto-matched from your resume">📄</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-matched Skills Indicator */}
          {(() => {
            const autoMatchedCount = formData.selectedSkills.filter(selectedSkill => 
              formData.resumeSkills && formData.resumeSkills.some(resumeSkill => 
                resumeSkill.toLowerCase().trim() === selectedSkill.toLowerCase().trim()
              )
            ).length;
            
            return autoMatchedCount > 0 ? (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-green-500">
                <p className="text-sm text-green-800 dark:text-green-400 font-semibold">
                  🎯 <b>{autoMatchedCount} skill{autoMatchedCount > 1 ? 's' : ''}</b> automatically selected from your resume (marked with 📄)
                </p>
              </div>
            ) : null;
          })()}
        </div>
          
        {/* DSA Problem Solving Section - Neumorphism Theme */}
        <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-2xl">💻</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  DSA & Problem Solving
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">LeetCode/CodeChef/Codeforces</p>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-purple-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-lg mr-2">📊</span>
              Enter the number of problems solved by difficulty level on competitive coding platforms
            </p>
          </div>

          {/* Problem Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Easy Problems */}
            <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl p-5 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:hover:shadow-glow transition-all duration-300 border-t-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">✅</span>
                <label htmlFor="dsaEasy" className="text-base font-bold text-green-800 dark:text-green-400">
                  Easy Problems
                </label>
              </div>
              <input
                type="number"
                id="dsaEasy"
                name="dsaEasy"
                value={formData.dsaEasy}
                onChange={handleChange}
                className="form-input w-full bg-gray-100 dark:bg-[#12121a] shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] focus:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-glow transition-all text-2xl font-bold text-center text-green-700 dark:text-green-400 rounded-xl focus:outline-none"
                min="0"
                step="1"
                placeholder="0"
              />
            </div>

            {/* Medium Problems */}
            <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl p-5 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:hover:shadow-glow transition-all duration-300 border-t-4 border-orange-500">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚡</span>
                <label htmlFor="dsaMedium" className="text-base font-bold text-orange-800 dark:text-orange-400">
                  Medium Problems
                </label>
              </div>
              <input
                type="number"
                id="dsaMedium"
                name="dsaMedium"
                value={formData.dsaMedium}
                onChange={handleChange}
                className="form-input w-full bg-gray-100 dark:bg-[#12121a] shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] focus:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-glow transition-all text-2xl font-bold text-center text-orange-700 dark:text-orange-400 rounded-xl focus:outline-none"
                min="0"
                step="1"
                placeholder="0"
              />
            </div>

            {/* Hard Problems */}
            <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl p-5 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:hover:shadow-glow transition-all duration-300 border-t-4 border-red-500">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🔥</span>
                <label htmlFor="dsaHard" className="text-base font-bold text-red-800 dark:text-red-400">
                  Hard Problems
                </label>
              </div>
              <input
                type="number"
                id="dsaHard"
                name="dsaHard"
                value={formData.dsaHard}
                onChange={handleChange}
                className="form-input w-full bg-gray-100 dark:bg-[#12121a] shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] focus:shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-glow transition-all text-2xl font-bold text-center text-red-700 dark:text-red-400 rounded-xl focus:outline-none"
                min="0"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          {/* Bonus Info */}
          <div className="p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-1">💡</span>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Solving <span className="font-bold text-orange-700 dark:text-orange-400">50+ Medium</span> or <span className="font-bold text-red-700 dark:text-red-400">15+ Hard</span> problems automatically gives you full marks for lower difficulties!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Number of Projects Input - Neumorphism Theme */}
        <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
            <label htmlFor="numProjects" className="flex items-center gap-4">
              <span className="text-3xl">📂</span>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                Number of Projects
              </span>
            </label>
            {formData.numProjects > 0 && (
              <span className="bg-gray-100 dark:bg-[#12121a] text-pink-700 dark:text-pink-400 text-sm font-bold px-4 py-2 rounded-full shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)]">
                {formData.numProjects} {formData.numProjects === 1 ? 'Project' : 'Projects'}
              </span>
            )}
          </div>
          <input
            type="number"
            id="numProjects"
            name="numProjects"
            value={formData.numProjects}
            onChange={handleNumProjectsChange}
            className="form-input bg-gray-100 dark:bg-[#12121a] shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] dark:focus:shadow-glow transition-all text-3xl font-bold text-center text-pink-700 dark:text-pink-400 rounded-xl focus:outline-none"
            min="0"
            max="5"
            step="1"
            placeholder="0-5"
          />
          <div className="mt-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#12121a] p-3 rounded-xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-pink-500">
            <span className="text-lg">💡</span>
            <span>Showcase your best work (maximum 5 projects)</span>
          </div>
        </div>

        {/* Structured Projects (title + description) - Neumorphism Theme */}
        {formData.numProjects > 0 && (
          <div className="space-y-6">
            {[...Array(formData.numProjects)].map((_, idx) => (
              <div 
                key={idx} 
                className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-6 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(255,255,255,0.05)] hover:shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:hover:shadow-glow transition-all duration-300 border-l-4 border-indigo-500"
              >
                {/* Project Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-[#12121a] text-indigo-700 dark:text-indigo-400 rounded-full font-bold text-xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)]">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        Project {idx + 1}
                        <span className="text-xs bg-gray-100 dark:bg-[#12121a] text-red-700 dark:text-red-400 px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] font-bold">Required</span>
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Auto-filled from resume - You can edit title and description</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {/* Project Title Field */}
                  <div>
                    <label className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
                      <span className="text-lg">📌</span>
                      <span>Project Title</span>
                      <span className="text-red-500 dark:text-red-400">*</span>
                      <span className="ml-auto text-xs bg-gray-100 dark:bg-[#12121a] text-red-700 dark:text-red-400 px-3 py-1 rounded-full shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] font-bold">Required</span>
                    </label>
                    <input
                      type="text"
                      value={formData.projects[idx]?.title || ''}
                      onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                      className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-gray-700 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all text-base font-medium"
                      placeholder="e.g. E-commerce Website, ML Prediction Model, Data Dashboard..."
                    />
                  </div>
                  
                  {/* Project Description Field */}
                  <div>
                    <label className="flex text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span>Project Description</span>
                      <span className="ml-auto text-xs bg-gray-100 dark:bg-[#12121a] text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)]">Optional</span>
                    </label>
                    <textarea
                      value={formData.projects[idx]?.description || ''}
                      onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                      className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-gray-700 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow min-h-[100px] transition-all resize-none text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                      placeholder="What you built | Technologies used (Python, React, SQL) | Key features | Impact & results..."
                      rows="4"
                    />
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-lg mr-2">💡</span>
                        <span className="font-semibold text-pink-600 dark:text-pink-400">Tip:</span> Mention technologies, tools, and quantifiable results (e.g., "Built using React & Node.js, processed 10,000+ records")
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications Section - Neumorphism Theme */}
        <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Certifications
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Professional credentials & licenses</p>
              </div>
            </div>
            {formData.certificationsList.length > 0 && (
              <span className="bg-gray-100 dark:bg-[#12121a] text-teal-700 dark:text-teal-400 text-sm font-bold px-4 py-2 rounded-full shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)]">
                {formData.certificationsList.length} {formData.certificationsList.length === 1 ? 'Cert' : 'Certs'}
              </span>
            )}
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-teal-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-lg mr-2">📜</span>
              Include: AWS, Azure, Google Cloud, Coursera, Udemy, PMP, Scrum Master, Docker, Kubernetes, CCNA, CompTIA, etc.
            </p>
          </div>
          
          {/* Add New Certification Input */}
          <div className="mb-6 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4">
            <label className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
              <span className="text-lg">➕</span>
              <span>Add New Certification</span>
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={handleCertificationKeyPress}
                className="form-input flex-1 bg-gray-100 dark:bg-[#12121a] text-gray-800 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-base placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="e.g. AWS Certified Solutions Architect..."
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-6 py-3 bg-gray-100 dark:bg-[#12121a] text-teal-700 dark:text-teal-400 rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:hover:shadow-glow transition-all font-bold text-base transform hover:scale-105"
              >
                Add
              </button>
            </div>
          </div>
          
          {/* Display Certifications as Badges */}
          {formData.certificationsList.length > 0 ? (
            <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] p-4 border-l-4 border-teal-500">
              <div className="flex flex-wrap gap-3">
                {formData.certificationsList.map((cert, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-3 bg-gray-100 dark:bg-[#12121a] text-teal-800 dark:text-teal-300 rounded-full px-4 py-2 text-sm font-bold shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:hover:shadow-glow transition-all"
                  >
                    <span className="flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-[#12121a] text-teal-700 dark:text-teal-400 rounded-full text-xs font-bold shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
                      {index + 1}
                    </span>
                    <span className="max-w-xs truncate">{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(index)}
                      className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      title="Remove certification"
                    >
                      <span className="text-lg font-bold">×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-2 border-dashed border-gray-400/30 dark:border-gray-600/30 p-6 text-center">
              <span className="text-4xl mb-2 block">📚</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                No certifications added yet. Add your professional certifications above!
              </p>
            </div>
          )}
        </div>
        
        {/* Achievements Section - Neumorphism Theme */}
        <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-8 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Achievements
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Highlight your accomplishments</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-green-500">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              <span className="text-lg mr-2">💡</span>
              <span className="font-bold text-green-800 dark:text-green-400">What to Include:</span>
            </p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-6">
              <li>• Hackathon wins, Publications, Open-source contributions</li>
              <li>• Competitive ranks, Scholarships, Patents</li>
            </ul>
          </div>

          {/* Achievements Textarea */}
          <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4">
            <label htmlFor="achievements" className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
              <span className="text-lg">✍️</span>
              <span>Add Your Achievements (One per line)</span>
              <span className="ml-auto text-xs bg-gray-100 dark:bg-[#12121a] text-gray-700 dark:text-gray-400 px-3 py-1 rounded-full shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] font-semibold">Optional</span>
            </label>
            <textarea
              id="achievements"
              name="achievements"
              value={formData.achievements}
              onChange={handleChange}
              className="form-input w-full min-h-[120px] bg-gray-100 dark:bg-[#12121a] text-gray-800 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all resize-none text-base placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Type each achievement on a new line..."
            />
            <div className="mt-3 p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-pink-500">
              <p className="text-sm text-pink-700 dark:text-pink-400">
                <span className="text-lg mr-2">💫</span>
                Press <span className="font-bold">Enter</span> after each achievement for separate display
              </p>
            </div>
          </div>

          {/* Display Achievements as Individual Cards */}
          {formData.achievements && formData.achievements.trim().split('\n').filter(ach => ach.trim()).length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">🌟</span>
                Your Achievements ({formData.achievements.trim().split('\n').filter(ach => ach.trim()).length})
              </h4>
              <div className="space-y-3">
                {formData.achievements.trim().split('\n').filter(ach => ach.trim()).map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-[#12121a] rounded-2xl p-4 shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:hover:shadow-glow transition-all duration-300 border-l-4 border-green-500"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-[#12121a] text-green-700 dark:text-green-400 rounded-full font-bold text-sm shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium flex-1 leading-relaxed">
                        {achievement.trim()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.achievements && formData.achievements.trim().split('\n').filter(ach => ach.trim()).length === 0 && (
            <div className="mt-6 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-2 border-dashed border-gray-400/30 dark:border-gray-600/30 p-6 text-center">
              <span className="text-4xl mb-2 block">🏆</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                No achievements added yet. Start typing your accomplishments above!
              </p>
            </div>
          )}
        </div>
        
        {/* Hackathons & Internships Section - Neumorphism Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hackathons Section */}
          <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-6 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Hackathons</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Coding competitions</p>
              </div>
            </div>

            {/* Checkbox Toggle */}
            <div className="mb-5 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] p-4 border-l-4 border-pink-500">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hackathonsParticipated"
                  name="hackathonsParticipated"
                  checked={formData.hackathonsParticipated}
                  onChange={handleChange}
                  className="h-5 w-5 text-pink-600 focus:ring-pink-500 focus:ring-2 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-[#12121a]"
                />
                <label htmlFor="hackathonsParticipated" className="ml-3 text-sm font-bold text-gray-800 dark:text-white cursor-pointer">
                  I have participated in hackathons
                </label>
              </div>
            </div>
            
            {formData.hackathonsParticipated && (
              <div className="space-y-4">
                {/* Number of Hackathons */}
                <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4">
                  <label htmlFor="numHackathons" className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
                    <span className="text-lg">🔢</span>
                    <span>How many hackathons?</span>
                  </label>
                  <input
                    type="number"
                    id="numHackathons"
                    name="numHackathons"
                    value={formData.numHackathons}
                    onChange={handleChange}
                    className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-pink-700 dark:text-pink-400 rounded-2xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-xl font-bold text-center"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>

                {/* Add Hackathon Section */}
                <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4 space-y-4">
                  <label className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span>Add Hackathon Details</span>
                    <span className="ml-auto text-xs bg-gray-100 dark:bg-[#12121a] text-gray-700 dark:text-gray-400 px-3 py-1 rounded-full shadow-[2px_2px_4px_#b8b9be,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)] font-semibold">Optional</span>
                  </label>

                  {/* Hackathon Title Input */}
                  <input
                    type="text"
                    value={newHackathon.title}
                    onChange={(e) => setNewHackathon(prev => ({ ...prev, title: e.target.value }))}
                    onKeyPress={handleHackathonKeyPress}
                    className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-gray-800 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-base placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="e.g., Smart India Hackathon 2024"
                  />

                  {/* Winner Status Dropdown */}
                  <div>
                    <select
                      value={newHackathon.winner}
                      onChange={(e) => setNewHackathon(prev => ({ ...prev, winner: e.target.value }))}
                      className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-gray-800 dark:text-gray-200 rounded-2xl shadow-[inset_3px_3px_6px_#b8b9be,inset_-3px_-3px_6px_#ffffff] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-base font-bold"
                      disabled={!(parseInt(formData.numHackathons) > 0)}
                    >
                      <option value="">-- Select Status --</option>
                      <option value="yes">✅ Yes - I won!</option>
                      <option value="no">Participated</option>
                    </select>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-1">
                      💡 Note: 1st and 2nd runner-ups should also select "Winner"
                    </p>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleAddHackathon}
                    disabled={
                      !newHackathon.title.trim() ||
                      !newHackathon.winner ||
                      (parseInt(formData.numHackathons) > 0 && formData.hackathonsList.length >= parseInt(formData.numHackathons))
                    }
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                  >
                    + Add Hackathon
                  </button>
                </div>

                {/* Display Added Hackathons */}
                {formData.hackathonsList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Added Hackathons ({formData.hackathonsList.length}):</p>
                    {formData.hackathonsList.map((hackathon, index) => (
                      <div key={index} className="flex items-center justify-between bg-pink-50 dark:bg-pink-950/30 p-3 rounded-xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-white">{hackathon.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {hackathon.winner === 'yes' ? '🏆 Winner' : '👥 Participated'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHackathon(index)}
                          className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold text-xl"
                          aria-label="Remove hackathon"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!formData.hackathonsParticipated && (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                <span className="text-4xl mb-2 block">🎯</span>
                <p className="text-sm">Check the box above if you've participated</p>
              </div>
            )}
          </div>
          
          {/* Internships Section */}
          <div className="bg-gray-100 dark:bg-[#12121a] rounded-3xl p-6 shadow-[8px_8px_16px_#b8b9be,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5),-8px_-8px_20px_rgba(50,50,80,0.1)] hover:shadow-[12px_12px_24px_#b8b9be,-12px_-12px_24px_#ffffff] dark:hover:shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.08)] transition-all duration-300">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b-2 border-gray-300/50 dark:border-gray-600/50">
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#12121a] rounded-full flex items-center justify-center shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)]">
                <span className="text-xl">💼</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Internships</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">Work experience</p>
              </div>
            </div>

            {/* Checkbox Toggle */}
            <div className="mb-5 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] p-4 border-l-4 border-orange-500">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="internshipsCompleted"
                  name="internshipsCompleted"
                  checked={formData.internshipsCompleted}
                  onChange={handleChange}
                  className="h-5 w-5 text-orange-600 focus:ring-orange-500 focus:ring-2 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-[#12121a]"
                />
                <label htmlFor="internshipsCompleted" className="ml-3 text-sm font-bold text-gray-800 dark:text-white cursor-pointer">
                  I have completed internships
                </label>
              </div>
            </div>
            
            {formData.internshipsCompleted && (
              <div className="space-y-4">
                {/* Total Internships */}
                <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4">
                  <label htmlFor="numInternships" className="flex text-sm font-bold text-gray-800 dark:text-white mb-3 items-center gap-2">
                    <span className="text-lg">🔢</span>
                    <span>Total internships completed?</span>
                  </label>
                  <input
                    type="number"
                    id="numInternships"
                    name="numInternships"
                    value={formData.numInternships}
                    onChange={handleChange}
                    className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-orange-700 dark:text-orange-400 rounded-2xl shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05)] focus:shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-xl font-bold text-center"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>

                {/* Breakdown by Type */}
                <div className="bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05)] p-4">
                  <label className="flex text-sm font-bold text-gray-800 dark:text-white mb-4 items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <span>Breakdown by type</span>
                  </label>
                  
                  <div className="space-y-4">
                    {/* Industrial Internships */}
                    <div>
                      <label htmlFor="industrialInternships" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <span>🏭</span>
                          <span>Industrial/Company Internships</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        id="industrialInternships"
                        name="industrialInternships"
                        value={formData.industrialInternships}
                        onChange={handleChange}
                        max={formData.numInternships || 0}
                        className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-green-700 dark:text-green-400 rounded-xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-lg font-bold text-center"
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-1">Real work experience at companies, startups, organizations</p>
                    </div>

                    {/* Virtual Internships */}
                    <div>
                      <label htmlFor="virtualInternships" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <span>💻</span>
                          <span>Virtual/Training Internships</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        id="virtualInternships"
                        name="virtualInternships"
                        value={formData.virtualInternships}
                        onChange={handleChange}
                        max={formData.numInternships || 0}
                        className="form-input w-full bg-gray-100 dark:bg-[#12121a] text-pink-700 dark:text-pink-400 rounded-xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] focus:shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:focus:shadow-glow focus:outline-none transition-all text-lg font-bold text-center"
                        min="0"
                        step="1"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-1">Online programs, certificate-based (e.g., Prodigy InfoTech)</p>
                    </div>
                  </div>
                </div>

                {/* Validation Warning */}
                {internshipWarning && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-yellow-500 animate-pulse">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
                      <span className="text-lg mr-2">⚠️</span>
                      {internshipWarning}
                    </p>
                  </div>
                )}
                
                {(parseInt(formData.industrialInternships) || 0) + (parseInt(formData.virtualInternships) || 0) > (parseInt(formData.numInternships) || 0) && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-red-500">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <span className="text-lg mr-2">⚠️</span>
                      Total breakdown ({(parseInt(formData.industrialInternships) || 0) + (parseInt(formData.virtualInternships) || 0)}) cannot exceed total internships ({formData.numInternships})
                    </p>
                  </div>
                )}
                
                {/* Error message for internship breakdown mismatch */}
                {errors.internships && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-red-500">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <span className="text-lg mr-2">❌</span>
                      {errors.internships}
                    </p>
                  </div>
                )}

                {/* Helper Info */}
                <div className="p-3 bg-gray-100 dark:bg-[#12121a] rounded-2xl shadow-[inset_2px_2px_4px_#b8b9be,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] border-l-4 border-orange-500">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-lg mr-2">💡</span>
                    Industrial internships typically have higher value in placement predictions
                  </p>
                </div>
              </div>
            )}

            {!formData.internshipsCompleted && (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400">
                <span className="text-4xl mb-2 block">🎓</span>
                <p className="text-sm">Check the box above if you've completed any</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= step 
                ? 'bg-primary-600 dark:bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-[#2d1f3d] text-gray-600 dark:text-gray-400'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-1 mx-2 ${
                currentStep > step ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-[#2d1f3d]'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderNavigation = () => (
    <div className="mt-8 space-y-4">
      {/* Personal Resume Toggle - Only show on Step 3 for logged-in users */}
      {currentStep === 3 && isLoggedIn && (
        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPersonalResume}
              onChange={(e) => setIsPersonalResume(e.target.checked)}
              className="mt-1 w-5 h-5 text-pink-600 bg-white dark:bg-[#1e1a2e] border-gray-300 dark:border-gray-600 rounded focus:ring-pink-500 focus:ring-2 cursor-pointer"
              disabled={submitting}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                <span className="font-semibold text-pink-900 dark:text-pink-100">This is my personal resume</span>
              </div>
              <p className="text-sm text-pink-700 dark:text-pink-300 mt-1">
                {isPersonalResume 
                  ? "✓ Prediction will be saved to your dashboard and MongoDB"
                  : "Score will only be shown for analysis, won't affect your dashboard"}
              </p>
            </div>
          </label>
        </div>
      )}
      
      <div className="flex justify-between">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            ← Previous
          </button>
        )}
        
        <div className="flex-1" />
        
    {currentStep < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Next →
          </button>
        ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className={`bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold px-10 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${submitting || uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? '🔄 Getting Results…' : '🎯 Get Prediction Results'}
            </button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${themeClasses.pageBackground} transition-colors duration-300 relative`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Textured Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <svg className="w-full h-full opacity-[0.06] dark:opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
            <filter id="predictionFormNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
              <feColorMatrix type="saturate" values="0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#predictionFormNoise)"/>
          </svg>
        </div>
      
      {/* Full-screen blur overlay for resume parsing */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className={`${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4`}>
            <div className="text-center">
              {/* Spinning loader with document icon */}
              <div className="relative inline-block mb-6">
                <div className={`w-20 h-20 border-4 ${themeClasses.cardBorder} border-t-current rounded-full animate-spin ${themeClasses.accent}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className={`w-10 h-10 ${themeClasses.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              {/* Status text */}
              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>Uploading and parsing resume...</h3>
              <p className={`${themeClasses.textSecondary} mb-6`}>Please wait while we extract your information</p>
              
              {/* Animated dots */}
              <div className="flex justify-center space-x-2">
                <div className={`w-3 h-3 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-3 h-3 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-3 h-3 ${themeClasses.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedDomain ? `${selectedDomain.name} Placement Prediction` : 'Placement Prediction'}
        </h1>
        <p className="text-xl text-gray-600 dark:text-tech-gray-300 max-w-3xl mx-auto">
          Fill in your details to get personalized placement insights
        </p>
      </div>
      
  <form onSubmit={(e) => e.preventDefault()} className="bg-white/95 dark:bg-[#1e1a2e]/95 backdrop-blur-sm rounded-xl shadow-lg dark:shadow-soft border dark:border-pink-500/20 p-8 relative z-10" style={{ position: 'static' }}>
        {renderStepIndicator()}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {renderNavigation()}
        
        {errorMessage && (
    <div className="text-red-500 text-sm mt-2">
      {errorMessage}
    </div>
  )}
      </form>

      {/* Resume Linker Modal */}
      {showResumeLinker && (
        <ResumeLinker
          mobile={mobileForResume}
          onClose={handleResumeLinkerClose}
          onSuccess={handleResumeLinkerSuccess}
        />
      )}
    </div>
  );
};

export default PredictionForm;

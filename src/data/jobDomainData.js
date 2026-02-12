// Job Domain Data with Roles and Skills
export const jobDomains = [
  {
    id: "web_development",
    name: "Web Development",
    roles: [
      {
        id: "frontend_developer",
        name: "Frontend Developer",
        skills: [
          "HTML", "HTML5", "CSS", "CSS3", "JavaScript (ES6+)", "Responsive Design", "React.js", "Angular", "Vue.js", "Bootstrap", "Version Control (Git)", "Browser Developer Tools", "DOM Manipulation", "API Integration (REST)", "Debugging"
        ],
        description: "Specializes in user interface and user experience development"
      },
      {
        id: "backend_developer",
        name: "Backend Developer",
        skills: [
          "JavaScript (Node.js)", "Python (Django)", "Java (Spring Boot)", "C# (.NET)", "Express.js", "Django", "Spring Boot", "ASP.NET Core", "SQL", "NoSQL Databases (MySQL, PostgreSQL, MongoDB)", "REST API Development", "Git Version Control", "Authentication and Authorization", "Basic Cloud or Deployment (Heroku, AWS)", "Unit Testing"
        ],
        description: "Focuses on server-side development and database management"
      },
      {
        id: "fullstack_developer",
        name: "Full-Stack Developer",
        skills: [
          "HTML5", "CSS3", "JavaScript", "React.js", "Angular", "Vue.js", "Node.js", "Express.js", "MongoDB", "Mongoose", "Redux", "Django", "Spring Boot", "ASP.NET Core", "RESTful APIs", "SQL", "NoSQL Databases", "Responsive Web Design", "Version Control (Git)", "Basic Testing (Jest, Mocha, JUnit)", "Cross-functional Collaboration"
        ],
        description: "Handles both frontend and backend development"
      },
      {
        id: "uiux_developer",
        name: "UI/UX Developer",
        skills: [
          "Wireframing and Prototyping", "User Interface (UI) Design", "User Experience (UX) Principles", "Figma", "Adobe XD", "HTML", "CSS", "JavaScript (basic)", "Responsive Design", "Accessibility (WCAG)", "Usability Testing"
        ],
        description: "Designs and tests user interfaces and experiences"
      }
    ]
  },
    {
      id: "mobile_development",
      name: "Mobile Development",
      roles: [
        {
          id: "android_developer",
          name: "Android Developer",
          skills: ["Kotlin", "Java", "Android SDK", "Android Studio", "XML/JSON", "RESTful APIs", "SQLite", "UI/UX Design", "Material Design", "Git", "Unit Testing"],
          description: "Develops applications for Android platform"
        },
        {
          id: "ios_developer",
          name: "iOS Developer",
          skills: ["Swift", "Objective-C", "iOS SDK", "Xcode", "UIKit", "Auto Layout", "Storyboarding", "REST APIs", "Core Data", "Git", "Unit Testing"],
          description: "Develops applications for iOS platform"
        },
        {
          id: "cross_platform_developer",
          name: "Cross-Platform Developer",
          skills: ["Flutter", "Dart", "React Native", "JavaScript (ES6+)", "Mobile App Development", "UI/UX Design", "API Integration", "State Management (Redux, Provider, Bloc)", "Git", "Automated Testing"],
          description: "Develops applications that work across multiple platforms"
        },
        {
          id: "mobile_app_tester",
          name: "Mobile App Tester / QA Engineer",
          skills: ["Manual Testing", "Automation Testing (Appium, Espresso, XCUITest)", "Test Cases", "Bug Tracking (JIRA)", "API Testing (Postman)", "Regression Testing", "Git", "SQL (basic)"],
          description: "Ensures mobile app quality through manual and automated testing"
        }
      ]
    },
  {
    id: "data_analytics",
    name: "Data & Analytics",
    roles: [
      {
        id: "data_analyst",
        name: "Data Analyst",
        skills: ["Data Analysis", "SQL", "Microsoft Excel", "Data Visualization", "Tableau", "Power BI", "Data Cleaning", "Statistical Analysis", "Python", "R", "Reporting"],
        description: "Analyzes data, builds reports, and provides actionable insights for business decisions"
      },
      {
        id: "business_analyst",
        name: "Business Analyst", 
        skills: ["Business Analysis", "Requirements Gathering", "SQL", "Excel", "Power BI", "Process Mapping", "Stakeholder Management", "Data Analysis", "Documentation"],
        description: "Bridges business needs and technical solutions through data-driven insights"
      },
      {
        id: "bi_analyst",
        name: "Business Intelligence Analyst",
        skills: ["Business Intelligence", "SQL", "Data Visualization (Tableau, Power BI)", "ETL", "Dashboard Development", "Data Modeling", "Reporting", "Data Mining", "Critical Thinking"],
        description: "Creates reports and dashboards for business decision making"
      },
      {
        id: "data_engineer",
        name: "Data Engineer",
        skills: ["Data Engineering", "SQL", "ETL Pipelines", "Python", "Scala", "Java", "Data Warehousing", "Cloud Platforms (AWS, Azure, GCP)", "Big Data (Hadoop, Spark)", "Database Design", "Git"],
        description: "Builds and maintains data infrastructure and pipelines"
      },
      {
        id: "big_data_engineer",
        name: "Big Data Engineer",
        skills: ["Hadoop", "Spark", "Kafka", "SQL", "NoSQL Databases (MongoDB, Cassandra)", "Data Pipelines", "ETL", "Python", "Java", "Scala", "Cloud Platforms", "Data Modeling"],
        description: "Specializes in processing and managing large-scale data systems"
      },
      {
        id: "junior_data_scientist",
        name: "Junior Data Scientist",
        skills: ["Python", "Machine Learning", "SQL", "Data Analysis", "Data Visualization", "Statistics", "Scikit-learn", "Data Cleaning", "Communication Skills"],
        description: "Entry-level data scientist role for freshers"
      },
      {
        id: "data_scientist",
        name: "Data Scientist",
        skills: ["Python", "R", "Machine Learning", "Deep Learning", "SQL", "Statistics", "Data Visualization", "Scikit-learn", "TensorFlow", "PyTorch", "Feature Engineering", "Model Evaluation"],
        description: "Develops predictive models and extracts insights from complex datasets"
      },
      {
        id: "quantitative_analyst",
        name: "Quantitative Analyst",
        skills: ["Statistics", "Mathematics", "Python", "R", "SQL", "Financial Modeling", "Risk Analysis", "Econometrics", "Time Series Analysis"],
        description: "Applies mathematical and statistical methods to financial and risk management problems"
      },
      {
        id: "research_analyst",
        name: "Research Analyst",
        skills: ["Research Methodology", "Statistical Analysis", "Python", "R", "SQL", "Data Collection", "Report Writing", "Critical Thinking", "Domain Expertise"],
        description: "Conducts research and analysis to support business decisions and strategy"
      }
    ]
  },
  {
    id: "ai_ml",
    name: "Artificial Intelligence & Machine Learning",
    roles: [
      {
        id: "ml_engineer",
        name: "Machine Learning Engineer",
        skills: ["Machine Learning", "Python", "scikit-learn", "Model Development", "Data Preprocessing", "Model Training", "Model Deployment", "Git", "Statistics"],
        description: "Builds and deploys machine learning models in production"
      },
      {
        id: "ai_engineer",
        name: "AI Engineer",
        skills: ["Machine Learning", "Python", "Model Integration", "Software Engineering", "API Development", "Data Analytics"],
        description: "Basic ML + integration with apps"
      },
      {
        id: "data_scientist_ml",
        name: "Data Scientist (ML Focus)",
        skills: ["Python", "Machine Learning", "Deep Learning", "Statistics", "Data Analysis", "Feature Engineering", "Model Evaluation", "TensorFlow", "PyTorch", "SQL"],
        description: "Focuses on machine learning and statistical modeling for data-driven insights"
      },
      {
        id: "deep_learning_engineer",
        name: "Deep Learning Engineer",
        skills: ["Deep Learning", "Python", "TensorFlow", "PyTorch", "CNN/RNN", "Neural Networks", "Data Preprocessing", "Model Optimization", "Git"],
        description: "Specializes in deep learning algorithms and neural networks"
      },
      {
        id: "nlp_engineer",
        name: "NLP Engineer",
        skills: ["Natural Language Processing (NLP)", "Python", "Text Preprocessing", "Transformers", "Chatbots", "Machine Learning Models", "scikit-learn"],
        description: "Works on natural language processing and understanding"
      },
      {
        id: "computer_vision_engineer",
        name: "Computer Vision Engineer",
        skills: ["Computer Vision", "Python", "OpenCV", "Image Processing", "Deep Learning", "CNNs", "Model Deployment"],
        description: "Develops systems that can interpret and understand visual information"
      },
      {
        id: "mlops_engineer",
        name: "MLOps Engineer",
        skills: ["MLOps", "Python", "Docker", "Kubernetes", "CI/CD", "Model Deployment", "Cloud Platforms", "Monitoring", "Version Control"],
        description: "Manages the lifecycle of machine learning models in production"
      },
      {
        id: "ai_research_assistant",
        name: "AI Research Assistant / Junior Researcher",
        skills: ["Python", "Machine Learning", "Data Analysis", "Research", "Model Implementation", "Communication Skills"],
        description: "Entry-level research role for AI/ML labs/startups"
      },
      {
        id: "applied_scientist",
        name: "Applied Scientist",
        skills: ["Machine Learning", "Statistics", "Python", "R", "Research", "Experimentation", "A/B Testing", "Data Science", "Scientific Computing"],
        description: "Applies scientific methods and ML techniques to solve business problems"
      }
    ]
  },
  {
    id: "cloud_devops",
    name: "Cloud & DevOps",
    roles: [
      {
        id: "cloud_engineer",
        name: "Cloud Engineer",
        skills: ["AWS", "Microsoft Azure", "Google Cloud Platform (GCP)", "EC2", "S3", "Lambda", "VM", "Blob Storage (platform services)", "Cloud Architecture", "Bash", "Python", "Terraform", "CloudFormation", "Linux Systems", "Git Version Control", "Monitoring Tools (CloudWatch, Azure Monitor)", "Troubleshooting"],
        description: "Designs and manages cloud infrastructure and services"
      },
      {
        id: "devops_engineer",
        name: "DevOps Engineer",
        skills: ["CI/CD Pipelines (Jenkins, GitLab CI)", "Docker", "Kubernetes", "Infrastructure as Code (Terraform/Ansible)", "Scripting (Bash/Python)", "Linux Administration", "Git", "Monitoring/Logging (Prometheus, Grafana, ELK Stack)"],
        description: "Streamlines development and deployment processes"
      },
      {
        id: "sre_engineer",
        name: "Site Reliability Engineer",
        skills: ["Monitoring & Incident Response", "Automation (Python, Bash)", "Cloud Platforms (AWS/Azure/GCP)", "Docker/Kubernetes", "Reliability Engineering", "Linux/Unix Systems", "Troubleshooting"],
        description: "Ensures system reliability and performance"
      },
      {
        id: "cloud_support_associate",
        name: "Cloud Support Associate / Cloud Administrator",
        skills: ["Cloud Platforms (AWS, Azure, GCP)", "Helpdesk/Support", "Basic Networking (TCP/IP, DNS, VPN)", "Monitoring/Alerting", "Linux/Windows Server Administration", "Documentation"],
        description: "Entry-level cloud support and administration role"
      },
      {
        id: "junior_infrastructure_engineer",
        name: "Junior Infrastructure Engineer",
        skills: ["Linux Administration", "Networking Fundamentals (firewall, routing, DNS)", "Bash/Python Scripting", "System Monitoring", "Cloud Basics", "Troubleshooting", "Documentation"],
        description: "Entry-level infrastructure engineer role"
      }
    ]
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    roles: [
      {
        id: "cybersecurity_analyst",
        name: "Cybersecurity Analyst",
        skills: ["Security Operations Center (SOC) skills", "Threat Monitoring & Detection", "SIEM Tools (Splunk, QRadar)", "Incident Response", "Network Security Fundamentals", "Report Writing", "Communication Skills"],
        description: "SOC Analyst, monitoring threats"
      },
      {
        id: "app_security_engineer",
        name: "Application Security Engineer",
        skills: ["Secure Coding Practices", "Application Vulnerability Assessment", "OWASP Top 10", "Static/Dynamic Analysis", "Penetration Testing (basics)", "Code Review"],
        description: "Secure coding, vulnerability testing basics"
      },
      {
        id: "network_security_engineer",
        name: "Network Security Engineer",
        skills: ["Network Security", "Firewalls (configuration)", "IDS/IPS (Intrusion Detection/Prevention Systems)", "VPN Technologies", "TCP/IP", "LAN/WAN", "Network Monitoring"],
        description: "Firewalls, IDS/IPS, VPN basics"
      },
      {
        id: "ethical_hacker",
        name: "Ethical Hacker / Penetration Tester",
        skills: ["Ethical Hacking", "Penetration Testing", "Vulnerability Scanning (Nessus, Burp Suite)", "Bug Bounty", "Kali Linux", "Report Writing", "Scripting (Python/Bash)"],
        description: "Junior level (bug bounty, basic pentesting)"
      },
      {
        id: "soc_associate",
        name: "Security Operations Center Associate",
        skills: ["SIEM Platforms", "Threat Intelligence", "Security Monitoring", "Incident Response", "Investigation/Analysis", "Documentation & Reporting"],
        description: "Entry-level SOC analyst role for monitoring threats"
      }
    ]
  },
  {
    id: "embedded_iot",
    name: "Embedded Systems & IoT",
    roles: [
      {
        id: "embedded_systems_engineer",
        name: "Embedded Systems Engineer",
        skills: ["C", "C++", "Microcontroller Programming (ARM, STM32, PIC)", "Real-Time Operating Systems (RTOS)", "Embedded Linux", "Firmware Development", "Hardware Debugging (oscilloscope, logic analyzer)", "PCB Design & Testing", "Communication Protocols (SPI, I2C, UART)", "Git Version Control", "Problem Solving & Troubleshooting", "System Integration"],
        description: "Hardware programming, microcontrollers"
      },
      {
        id: "firmware_developer",
        name: "Firmware Developer",
        skills: ["Low-level Programming (C, Assembly)", "Device Drivers", "Debugging & Testing", "RTOS", "Hardware-Software Integration", "Version Control (Git)"],
        description: "Low-level programming, drivers, debugging"
      },
      {
        id: "iot_developer",
        name: "IoT Developer",
        skills: ["Arduino", "Raspberry Pi", "ESP32", "MQTT", "HTTP", "CoAP protocols", "Sensor & Actuator Integration", "Embedded Linux", "Python", "C/C++", "Cloud IoT Platforms (AWS IoT, Azure IoT)", "Networking Basics"],
        description: "IoT development, protocols"
      },
      {
        id: "robotics_engineer",
        name: "Robotics Engineer",
        skills: ["ROS Basics (Robot Operating System)", "Sensors & Actuators", "Embedded Programming", "Computer Vision Basics", "C++", "Python", "Robotics Middleware"],
        description: "Entry-level robotics support"
      },
      {
        id: "electronics_hardware_design_engineer",
        name: "Electronics Hardware Design Engineer",
        skills: ["PCB Design (Altium, Eagle)", "Circuit Testing & Simulation", "Signal Processing", "Hardware Prototyping", "Compliance Standards (FCC, CE)"],
        description: "PCB design, testing"
      }
    ]
  },
  {
    id: "game_development",
    name: "Game Development",
    roles: [
      {
        id: "game_developer",
        name: "Game Developer",
        skills: ["Unity Engine", "C#", "Unreal Engine", "C++", "Game Physics", "2D/3D Graphics", "Animation", "Shader Programming Basics", "Version Control (Git)", "Debugging and Optimization"],
        description: "Unity with C# / Unreal Engine with C++"
      },
      {
        id: "game_programmer",
        name: "Game Programmer",
        skills: ["OpenGL", "DirectX", "Graphics Programming", "C++", "Algorithms & Data Structures", "Mathematics for Graphics (linear algebra, vectors)"],
        description: "2D/3D Graphics, OpenGL, DirectX basics"
      },
      {
        id: "ar_vr_developer",
        name: "AR/VR Developer",
        skills: ["Unity or Unreal Engine", "ARKit", "ARCore", "C#", "C++", "3D Modeling Basics", "VR Hardware (Oculus, HTC Vive)", "Spatial Computing"],
        description: "Unity/Unreal with ARKit/ARCore basics"
      },
      {
        id: "game_designer",
        name: "Game Designer",
        skills: ["Game Design Principles", "User Interface (UI) Design", "User Experience (UX)", "Storyboarding & Narrative Design", "Level Design Tools"],
        description: "UI/UX for games, level design, storyboarding"
      },
      {
        id: "game_tester_qa",
        name: "Game Tester / QA Engineer",
        skills: ["Bug Tracking", "Functional Testing", "Performance Testing", "Test Case Management", "Automation Testing Basics", "Version Control"],
        description: "Bug finding, performance testing for games"
      }
    ]
  },
  {
    id: "blockchain_web3",
    name: "Blockchain & Web3",
    roles: [
      {
        id: "blockchain_developer",
        name: "Blockchain Developer",
        skills: ["Solidity", "Ethereum", "Web3.js", "Truffle", "Hardhat", "JavaScript", "Python", "Blockchain"],
        description: "Develops decentralized applications and blockchain solutions"
      },
      {
        id: "smart_contract_developer",
        name: "Smart Contract Developer",
        skills: ["Solidity", "Ethereum", "Web3.js", "Truffle", "Hardhat", "JavaScript", "Python", "Blockchain", "DeFi"],
        description: "Creates and audits smart contracts for blockchain platforms"
      },
      {
        id: "dapp_developer",
        name: "dApp Developer",
        skills: ["React", "Web3.js", "Ethers.js", "Solidity", "IPFS", "JavaScript", "TypeScript", "Blockchain"],
        description: "Builds decentralized applications (dApps)"
      },
      {
        id: "cryptocurrency_engineer",
        name: "Cryptocurrency Systems Engineer",
        skills: ["Python", "JavaScript", "Blockchain", "Cryptography", "Node.js", "MongoDB", "Redis", "Security"],
        description: "Develops cryptocurrency exchanges and trading systems"
      },
      {
        id: "nft_platform_developer",
        name: "NFT Platform Developer",
        skills: ["Solidity", "IPFS", "Web3.js", "React", "Node.js", "MongoDB", "Blockchain", "Smart Contracts"],
        description: "Creates NFT marketplaces and digital asset platforms"
      }
    ]
  },
  {
    id: "enterprise_systems",
    name: "Enterprise & Systems Software",
    roles: [
      {
        id: "systems_software_engineer",
        name: "Systems Software Engineer",
        skills: ["C", "C++", "Assembly", "Linux Kernel", "Windows Internals", "System Programming", "Memory Management", "Process Management"],
        description: "Develops operating systems and low-level software"
      },
      {
        id: "middleware_developer",
        name: "Middleware Developer",
        skills: ["Java", "Python", "Node.js", "Message Queues", "API Gateway", "Microservices", "Docker", "Kubernetes"],
        description: "Creates middleware solutions for enterprise applications"
      },
      {
        id: "erp_crm_developer",
        name: "ERP/CRM Developer",
        skills: ["SAP", "Salesforce", "Oracle", "Java", "Python", "SQL", "Business Process", "Integration"],
        description: "Customizes and develops enterprise resource planning systems"
      },
      {
        id: "legacy_modernization_engineer",
        name: "Legacy Systems Modernization Engineer",
        skills: ["COBOL", "Mainframe", "Java", "Python", "Cloud Migration", "Database Migration", "System Integration"],
        description: "Modernizes and migrates legacy systems to new platforms"
      }
    ]
  },
  {
    id: "testing_qa",
    name: "Testing & Quality Assurance",
    roles: [
      {
        id: "manual_tester",
        name: "Manual Tester",
        skills: ["Test Planning", "Test Cases", "Bug Reporting", "JIRA", "Test Management", "Agile", "Scrum", "Communication"],
        description: "Performs manual testing to identify software defects"
      },
      {
        id: "automation_test_engineer",
        name: "Automation Test Engineer",
        skills: ["Selenium", "Cypress", "Python", "Java", "JavaScript", "TestNG", "JUnit", "API Testing"],
        description: "Creates and maintains automated test suites"
      },
      {
        id: "performance_test_engineer",
        name: "Performance & Load Test Engineer",
        skills: ["JMeter", "LoadRunner", "Gatling", "Python", "Java", "Performance Testing", "Load Testing", "Monitoring"],
        description: "Tests application performance under various load conditions"
      },
      {
        id: "qa_engineer",
        name: "Quality Assurance Engineer",
        skills: ["Test Strategy", "Test Planning", "Automation", "CI/CD", "Python", "Java", "Agile", "Leadership"],
        description: "Oversees quality assurance processes and strategies"
      }
    ]
  },
  {
    id: "research_emerging",
    name: "Research & Emerging Tech",
    roles: [
      {
        id: "quantum_computing_researcher",
        name: "Quantum Computing Researcher",
        skills: ["Qiskit", "Cirq", "Python", "Quantum Algorithms", "Linear Algebra", "Physics", "Mathematics", "Research"],
        description: "Conducts research in quantum computing and quantum algorithms"
      },
      {
        id: "edge_computing_engineer",
        name: "Edge Computing Engineer",
        skills: ["Edge Computing", "IoT", "Microservices", "Docker", "Kubernetes", "Python", "C++", "Networking"],
        description: "Develops edge computing solutions for distributed systems"
      },
      {
        id: "bioinformatics_scientist",
        name: "Bioinformatics Scientist / Health Tech Researcher",
        skills: ["Python", "R", "Bioinformatics", "Machine Learning", "Statistics", "Genomics", "Data Analysis", "Healthcare"],
        description: "Applies computational methods to biological and health data"
      },
      {
        id: "green_computing_specialist",
        name: "Green Computing Specialist / Sustainable Tech Engineer",
        skills: ["Energy Efficiency", "Sustainable Computing", "Python", "C++", "Optimization", "Renewable Energy", "Environmental Science"],
        description: "Develops environmentally sustainable technology solutions"
      }
    ]
  }
];

export const getDomainById = (id) => {
  return jobDomains.find(domain => domain.id === id);
};

export const getRoleById = (domainId, roleId) => {
  const domain = getDomainById(domainId);
  if (domain) {
    return domain.roles.find(role => role.id === roleId);
  }
  return null;
};

export const getDomainsByEducation = (educationId) => {
  // This will be used with the education compatibility data
  return jobDomains;
};

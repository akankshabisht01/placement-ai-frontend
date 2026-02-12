const domainsData = [
  {
    id: "btech_cse",
    name: "B.Tech in Computer Science & Engineering (CSE)",
    categories: [
      {
        id: "software_development",
        name: "Software Development",
        keywords: [
          // Basic/Low Level
          "web development", "software", "programming", "coding", "frontend", "backend", "fullstack", "web", "development", 
          "html", "css", "javascript", "python", "java", "beginner programming", "learn coding", "basic programming",
          
          // Medium Level
          "react", "angular", "vue", "nodejs", "express", "django", "flask", "spring boot", "api development", 
          "database", "sql", "mongodb", "git", "version control", "testing", "debugging", "frameworks",
          
          // Advanced/High Level
          "microservices", "system design", "architecture", "scalability", "performance optimization", "devops integration",
          "cloud deployment", "containerization", "ci/cd", "agile development", "scrum", "software engineering",
          "design patterns", "data structures", "algorithms", "software architect", "tech lead", "full stack"
        ],
        roles: [
          "Software Developer / Engineer",
          "Full Stack Developer",
          "Frontend Developer",
          "Backend Developer",
          "Mobile App Developer",
          "Game Developer",
          "UI/UX Designer",
          "QA/Test Engineer"
        ],
        skills: [
          "Java",
          "Python",
          "JavaScript",
          "React",
          "Node.js",
          "Angular",
          "Vue.js",
          "C++",
          "C#",
          "PHP",
          "SQL",
          "MongoDB",
          "Git",
          "Docker",
          "AWS",
          "Azure",
          "REST API",
          "GraphQL",
          "Agile",
          "Scrum"
        ],
        averageSalary: "6-18 LPA",
        demandTrend: "Very high",
        topCompanies: ["TCS", "Infosys", "Wipro", "Microsoft", "Amazon", "Google", "Apple"],
        careerPaths: {
          icon: "💻",
          title: "Software Development Career Paths",
          entryLevel: [
            {
              title: "Frontend Developer",
              description: "HTML, CSS, JavaScript, React, UI/UX basics"
            },
            {
              title: "Backend Developer", 
              description: "Server-side languages, Databases, API development"
            },
            {
              title: "Full-Stack Developer",
              description: "Frontend + Backend, End-to-end development"
            },
            {
              title: "Junior Software Engineer",
              description: "Programming fundamentals, Version control"
            }
          ],
          midLevel: [
            {
              title: "Senior Software Engineer",
              description: "System design, Code reviews, Mentoring"
            },
            {
              title: "Tech Lead",
              description: "Technical leadership, Architecture decisions"
            },
            {
              title: "Software Architect",
              description: "System architecture, Technical strategy"
            }
          ],
          skillsRoadmap: {
            foundation: ["Programming fundamentals", "Version control (Git)", "Problem-solving", "Debugging"],
            frontend: ["HTML/CSS", "JavaScript", "React/Angular/Vue", "Responsive design"],
            backend: ["Server languages", "Databases", "APIs", "Authentication"],
            advanced: ["System design", "Microservices", "Performance optimization", "Security"]
          }
        }
      },
      {
        id: "data_science",
        name: "Data Science & Analytics",
        keywords: [
          // Basic/Low Level
          "data science", "data analytics", "data analysis", "analytics", "data", "statistics", "excel", "basic statistics",
          "data entry", "data collection", "spreadsheets", "charts", "graphs", "reporting", "business intelligence",
          
          // Medium Level
          "machine learning", "ml", "python", "r", "sql", "pandas", "numpy", "matplotlib", "seaborn", "tableau", 
          "power bi", "data visualization", "data mining", "predictive analytics", "regression", "classification",
          
          // Advanced/High Level
          "deep learning", "neural networks", "artificial intelligence", "ai", "nlp", "computer vision", "tensorflow", 
          "pytorch", "scikit-learn", "big data", "hadoop", "spark", "mlops", "model deployment", "feature engineering",
          "data engineering", "etl", "data pipeline", "advanced analytics", "statistical modeling", "time series",
          "recommendation systems", "ensemble methods", "kaggle", "research", "phd", "data scientist"
        ],
        roles: [
          "Data Scientist",
          "Data Analyst",
          "Machine Learning Engineer",
          "AI Engineer",
          "Business Intelligence Analyst",
          "Business Intelligence (BI) Analyst / BI Developer"
        ],
        skills: [
          "Python",
          "R",
          "SQL",
          "Pandas",
          "NumPy",
          "Scikit-learn",
          "TensorFlow",
          "PyTorch",
          "Power BI",
          "Tableau",
          "Excel",
          "Statistics",
          "Mathematics",
          "Deep Learning",
          "NLP",
          "Computer Vision"
        ],
        averageSalary: "8-20 LPA",
        demandTrend: "Very high and growing",
        topCompanies: ["Microsoft", "Google", "Amazon", "IBM", "Accenture", "Tata Consultancy"],
        careerPaths: {
          icon: "📊",
          title: "Data Science Career Paths",
          entryLevel: [
            {
              title: "Data Analyst",
              description: "SQL, Excel, Data visualization, Basic statistics"
            },
            {
              title: "Business Intelligence Analyst",
              description: "BI tools, Dashboard creation, Business metrics"
            },
            {
              title: "Junior Data Scientist",
              description: "Python/R, Statistics, ML fundamentals"
            },
            {
              title: "Data Engineer (Entry)",
              description: "ETL processes, Data pipelines, SQL"
            }
          ],
          midLevel: [
            {
              title: "Data Scientist",
              description: "Advanced ML, Model deployment, Research"
            },
            {
              title: "Machine Learning Engineer",
              description: "MLOps, Model optimization, Production systems"
            },
            {
              title: "Senior Data Engineer",
              description: "Big data, Cloud platforms, Architecture"
            }
          ],
          skillsRoadmap: {
            foundation: ["Statistics basics", "SQL", "Excel", "Python/R basics"],
            analysis: ["Data visualization", "Statistical analysis", "Business intelligence", "Reporting"],
            modeling: ["Machine learning", "Deep learning", "Feature engineering", "Model evaluation"],
            advanced: ["MLOps", "Big data", "Cloud platforms", "Domain expertise"]
          }
        }
      },
      {
        id: "devops_cloud",
        name: "DevOps & Cloud",
        keywords: [
          // Basic/Low Level
          "devops", "cloud", "linux", "command line", "bash", "shell scripting", "git", "basic networking",
          "server administration", "system admin", "troubleshooting", "monitoring", "logs", "basic automation",
          
          // Medium Level
          "aws", "azure", "gcp", "docker", "containers", "ci/cd", "jenkins", "github actions", "gitlab ci",
          "infrastructure", "automation", "configuration management", "deployment", "load balancing",
          
          // Advanced/High Level
          "kubernetes", "k8s", "terraform", "ansible", "chef", "puppet", "infrastructure as code", "iac",
          "microservices deployment", "service mesh", "istio", "prometheus", "grafana", "elk stack",
          "site reliability", "sre", "chaos engineering", "cloud architecture", "multi-cloud", "hybrid cloud",
          "serverless", "lambda", "azure functions", "cloud security", "cost optimization", "scalability"
        ],
        roles: [
          "DevOps Engineer",
          "Cloud Engineer",
          "Site Reliability Engineer",
          "Infrastructure Engineer"
        ],
        skills: [
          "Docker",
          "Kubernetes",
          "Jenkins",
          "AWS",
          "Azure",
          "GCP",
          "Terraform",
          "Ansible",
          "Linux",
          "Shell Scripting",
          "CI/CD",
          "Monitoring",
          "Logging",
          "Microservices"
        ],
        averageSalary: "8-16 LPA",
        demandTrend: "High and increasing",
        topCompanies: ["Amazon", "Microsoft", "Google", "IBM", "Oracle"],
        careerPaths: {
          icon: "☁️",
          title: "Cloud & DevOps Career Paths",
          entryLevel: [
            {
              title: "Junior DevOps Engineer",
              description: "Linux, Git, Basic scripting, CI/CD fundamentals"
            },
            {
              title: "Cloud Support Associate",
              description: "AWS/Azure basics, Monitoring, Troubleshooting"
            },
            {
              title: "System Administrator",
              description: "Linux/Windows, Networking, System maintenance"
            },
            {
              title: "Build Engineer",
              description: "CI/CD pipelines, Build automation, Version control"
            }
          ],
          midLevel: [
            {
              title: "DevOps Engineer",
              description: "Infrastructure as Code, Automation, Cloud platforms"
            },
            {
              title: "Site Reliability Engineer",
              description: "Monitoring, Performance, Incident response"
            },
            {
              title: "Cloud Architect",
              description: "Cloud design, Migration strategies, Cost optimization"
            }
          ],
          skillsRoadmap: {
            foundation: ["Linux basics", "Version control", "Networking", "Command line"],
            automation: ["Scripting", "CI/CD", "Infrastructure as Code", "Configuration management"],
            cloud: ["AWS/Azure/GCP", "Containerization", "Orchestration", "Monitoring"],
            advanced: ["Architecture design", "Security", "Cost optimization", "Multi-cloud"]
          }
        }
      },
      {
        id: "cybersecurity",
        name: "Cybersecurity",
        keywords: [
          // Basic/Low Level
          "cybersecurity", "security", "information security", "infosec", "cyber", "security analyst", "password security",
          "antivirus", "firewalls", "network security", "basic security", "security awareness", "cyber hygiene",
          
          // Medium Level
          "ethical hacking", "penetration testing", "pen testing", "vulnerability assessment", "security testing",
          "incident response", "forensics", "malware analysis", "risk assessment", "compliance", "audit",
          
          // Advanced/High Level
          "advanced persistent threat", "apt", "red team", "blue team", "threat hunting", "security architecture",
          "cryptography", "blockchain security", "cloud security", "iot security", "mobile security",
          "zero trust", "siem", "soar", "threat intelligence", "reverse engineering", "exploit development",
          "security research", "bug bounty", "ceh", "cissp", "oscp", "security consultant", "ciso"
        ],
        roles: [
          "Cybersecurity Analyst",
          "Security Engineer",
          "Penetration Tester",
          "Security Architect",
          "Incident Responder"
        ],
        skills: [
          "Network Security",
          "Ethical Hacking",
          "Penetration Testing",
          "Cryptography",
          "Python",
          "Linux",
          "Wireshark",
          "Metasploit",
          "Security Tools",
          "Risk Assessment",
          "Compliance",
          "Incident Response"
        ],
        averageSalary: "7-15 LPA",
        demandTrend: "High and increasing",
        topCompanies: ["Cisco", "Palo Alto Networks", "Symantec", "IBM", "Accenture"],
        careerPaths: {
          icon: "🔒",
          title: "Cybersecurity Career Paths",
          entryLevel: [
            {
              title: "Cybersecurity Analyst",
              description: "Security monitoring, Incident response, Basic tools"
            },
            {
              title: "Junior Penetration Tester",
              description: "Vulnerability assessment, Basic pen testing"
            },
            {
              title: "Security Operations Center (SOC) Analyst",
              description: "SIEM tools, Log analysis, Threat detection"
            },
            {
              title: "Compliance Analyst",
              description: "Security frameworks, Risk assessment, Auditing"
            }
          ],
          midLevel: [
            {
              title: "Security Engineer",
              description: "Security architecture, Advanced threat hunting"
            },
            {
              title: "Senior Penetration Tester",
              description: "Advanced exploitation, Red team activities"
            },
            {
              title: "Security Architect",
              description: "Security design, Enterprise security strategy"
            }
          ],
          skillsRoadmap: {
            foundation: ["IT fundamentals", "Networking", "Operating systems", "Security basics"],
            tools: ["SIEM platforms", "Vulnerability scanners", "Penetration testing tools", "Forensics"],
            advanced: ["Threat intelligence", "Incident response", "Security architecture", "Compliance"],
            specialized: ["Malware analysis", "Digital forensics", "Cloud security", "IoT security"]
          }
        }
      }
    ]
  },
  {
    id: "btech_mechanical",
    name: "B.Tech in Mechanical Engineering (ME)",
    categories: [
      {
        id: "design_engineering",
        name: "Design Engineering",
        keywords: [
          // Basic/Low Level
          "design engineering", "mechanical design", "product design", "engineering drawing", "technical drawing",
          "drafting", "basic cad", "2d design", "sketching", "blueprint reading", "dimensioning",
          
          // Medium Level
          "cad", "solidworks", "autocad", "3d modeling", "inventor", "creo", "catia", "parametric modeling",
          "assembly design", "part design", "engineering analysis", "tolerance analysis",
          
          // Advanced/High Level
          "advanced cad", "surface modeling", "complex assemblies", "simulation", "finite element analysis", "fea",
          "optimization", "generative design", "additive manufacturing", "3d printing design", "reverse engineering",
          "product lifecycle management", "plm", "design for manufacturing", "dfm", "design for assembly", "dfa",
          "innovation", "r&d", "patent design", "design validation", "prototype development"
        ],
        roles: [
          "Design Engineer",
          "CAD Designer",
          "Product Design Engineer",
          "Mechanical Design Engineer"
        ],
        skills: [
          "SolidWorks",
          "AutoCAD",
          "CATIA",
          "Creo",
          "ANSYS",
          "3D Modeling",
          "Technical Drawing",
          "GD&T",
          "Product Development",
          "Prototyping"
        ],
        averageSalary: "5-12 LPA",
        demandTrend: "Steady",
        topCompanies: ["Tata Motors", "Mahindra", "Maruti Suzuki", "L&T", "Godrej"]
      },
      {
        id: "manufacturing",
        name: "Manufacturing & Production",
        keywords: [
          // Basic/Low Level
          "manufacturing", "production", "factory", "assembly line", "quality control", "inspection",
          "basic manufacturing", "operations", "safety", "inventory", "materials", "tools",
          
          // Medium Level
          "lean manufacturing", "six sigma", "process improvement", "kaizen", "5s", "quality assurance",
          "iso standards", "supply chain", "logistics", "planning", "scheduling", "maintenance",
          
          // Advanced/High Level
          "advanced manufacturing", "industry 4.0", "smart manufacturing", "automation", "robotics",
          "plc programming", "scada", "mes", "erp", "digital twin", "predictive maintenance",
          "statistical process control", "design of experiments", "continuous improvement", "tpm",
          "changeover optimization", "bottleneck analysis", "value stream mapping", "kanban"
        ],
        roles: [
          "Production Engineer",
          "Manufacturing Engineer",
          "Quality Control Engineer",
          "Process Engineer",
          "Industrial Engineer"
        ],
        skills: [
          "Manufacturing Processes",
          "Quality Control",
          "Lean Manufacturing",
          "Six Sigma",
          "CAD/CAM",
          "PLC",
          "Automation",
          "Industrial Safety",
          "Supply Chain",
          "Project Management"
        ],
        averageSalary: "5-11 LPA",
        demandTrend: "Steady",
        topCompanies: ["Tata Steel", "JSW", "Hindalco", "L&T", "Godrej"]
      },
      {
        id: "automotive_aerospace",
        name: "Automotive & Aerospace",
        keywords: [
          // Basic/Low Level
          "automotive", "aerospace", "vehicles", "aircraft", "basic automotive", "car design",
          "mechanical systems", "engines", "transmission", "brakes", "suspension", "maintenance",
          
          // Medium Level
          "automotive engineering", "aerospace engineering", "vehicle dynamics", "aerodynamics",
          "thermodynamics", "fluid mechanics", "hvac", "air conditioning", "powertrain", "chassis",
          
          // Advanced/High Level
          "advanced automotive", "electric vehicles", "ev", "hybrid vehicles", "autonomous vehicles",
          "adas", "flight control systems", "avionics", "spacecraft", "satellite", "rocket design",
          "cfd", "fem", "crash analysis", "emissions", "fuel efficiency", "lightweight materials",
          "composite materials", "testing", "certification", "regulatory compliance", "safety systems"
        ],
        roles: [
          "Automotive Engineer",
          "Aerospace Engineer",
          "HVAC Engineer",
          "Robotics Engineer",
          "Mechatronics Engineer"
        ],
        skills: [
          "Automotive Systems",
          "Aerodynamics",
          "Thermodynamics",
          "Fluid Mechanics",
          "Robotics",
          "Control Systems",
          "MATLAB",
          "Simulink",
          "Finite Element Analysis",
          "Vehicle Dynamics"
        ],
        averageSalary: "6-14 LPA",
        demandTrend: "High",
        topCompanies: ["Tata Motors", "Mahindra", "Boeing", "Airbus", "HAL"]
      },
      {
        id: "maintenance",
        name: "Maintenance & Operations",
        keywords: [
          // Basic/Low Level
          "maintenance", "operations", "facility management", "building maintenance", "equipment maintenance",
          "preventive maintenance", "corrective maintenance", "basic troubleshooting", "repairs", "inspection",
          
          // Medium Level
          "reliability engineering", "asset management", "maintenance planning", "work orders", "cmms",
          "root cause analysis", "failure analysis", "condition monitoring", "vibration analysis", "lubrication",
          
          // Advanced/High Level
          "advanced maintenance", "predictive maintenance", "reliability centered maintenance", "rcm",
          "total productive maintenance", "tpm", "maintenance optimization", "digital maintenance",
          "iot maintenance", "machine learning maintenance", "thermal analysis", "ndt testing",
          "ultrasonic testing", "infrared thermography", "oil analysis", "maintenance strategy",
          "lifecycle management", "maintenance cost optimization", "spare parts optimization"
        ],
        roles: [
          "Maintenance Engineer",
          "Reliability Engineer",
          "Plant Engineer",
          "Facility Manager"
        ],
        skills: [
          "Equipment Maintenance",
          "Preventive Maintenance",
          "Reliability Engineering",
          "Root Cause Analysis",
          "Vibration Analysis",
          "Thermal Analysis",
          "Safety Management",
          "Asset Management"
        ],
        averageSalary: "5-10 LPA",
        demandTrend: "Steady",
        topCompanies: ["L&T", "BHEL", "NTPC", "Reliance", "Adani"]
      }
    ]
  },
  {
    id: "btech_ece",
    name: "B.Tech in Electronics & Communication Engineering (ECE)",
    categories: [
      {
        id: "embedded_systems",
        name: "Embedded Systems",
        keywords: [
          // Basic/Low Level
          "embedded systems", "microcontrollers", "arduino", "raspberry pi", "basic electronics", "circuits",
          "sensors", "actuators", "gpio", "digital logic", "analog circuits", "breadboard", "prototyping",
          
          // Medium Level
          "firmware", "c programming", "c++", "embedded c", "iot", "internet of things", "serial communication",
          "i2c", "spi", "uart", "pwm", "adc", "dac", "interrupts", "timers", "embedded linux",
          
          // Advanced/High Level
          "rtos", "real-time systems", "freertos", "embedded linux kernel", "device drivers", "bootloader",
          "arm cortex", "fpga", "verilog", "vhdl", "system on chip", "soc", "edge computing",
          "wireless protocols", "bluetooth", "wifi", "zigbee", "lora", "cellular iot", "industrial iot",
          "automotive embedded", "medical devices", "robotics", "machine learning on edge", "tinyml"
        ],
        roles: [
          "Embedded Systems Engineer",
          "IoT Developer",
          "Firmware Engineer",
          "Hardware Engineer"
        ],
        skills: [
          "C/C++",
          "Microcontrollers",
          "ARM",
          "RTOS",
          "IoT",
          "Arduino",
          "Raspberry Pi",
          "Embedded Linux",
          "Digital Electronics",
          "Communication Protocols"
        ],
        averageSalary: "6-14 LPA",
        demandTrend: "High",
        topCompanies: ["Intel", "Qualcomm", "Texas Instruments", "AMD", "Broadcom"],
        careerPaths: {
          icon: "🔧",
          title: "Embedded Systems & IoT Career Paths",
          entryLevel: [
            {
              title: "Embedded Systems Engineer",
              description: "C/C++, Microcontrollers, Real-time systems"
            },
            {
              title: "IoT Developer",
              description: "Arduino, Raspberry Pi, Sensor integration"
            },
            {
              title: "Firmware Developer",
              description: "Low-level programming, Device drivers"
            }
          ],
          midLevel: [
            {
              title: "Robotics Engineer",
              description: "ROS, Sensor fusion, Control systems"
            },
            {
              title: "Hardware Design Engineer",
              description: "PCB design, Circuit simulation"
            },
            {
              title: "IoT Solutions Architect",
              description: "System design, Cloud connectivity"
            }
          ],
          skillsRoadmap: {
            foundation: ["C/C++ programming", "Digital electronics", "Microcontroller basics", "Circuit analysis"],
            hardware: ["Arduino/Raspberry Pi", "PCB design", "Sensor integration", "Communication protocols"],
            software: ["Real-time OS (RTOS)", "Firmware development", "Device drivers", "Debugging tools"],
            systems: ["Cloud integration", "Wireless protocols", "Data analytics", "Security protocols"]
          }
        }
      },
      {
        id: "mobile_development",
        name: "Mobile Development",
        keywords: [
          // Basic/Low Level
          "mobile development", "mobile apps", "smartphone", "mobile", "app development", "basic app design",
          "ui design", "user interface", "mobile ui", "app store", "play store", "mobile basics",
          
          // Medium Level
          "android", "ios", "java", "kotlin", "swift", "objective-c", "android studio", "xcode",
          "flutter", "dart", "react native", "javascript", "cross-platform", "hybrid apps",
          
          // Advanced/High Level
          "native development", "advanced mobile architecture", "mvvm", "mvp", "clean architecture",
          "mobile performance optimization", "memory management", "battery optimization", "offline apps",
          "mobile security", "push notifications", "in-app purchases", "mobile analytics", "crash reporting",
          "mobile testing", "ui automation", "mobile devops", "ci/cd mobile", "app distribution",
          "mobile ar", "mobile vr", "mobile ml", "progressive web apps", "pwa", "mobile backend"
        ],
        roles: [
          "Android Developer",
          "iOS Developer", 
          "Cross-Platform Developer",
          "Mobile App Developer",
          "Flutter Developer",
          "React Native Developer"
        ],
        skills: [
          "Kotlin",
          "Java", 
          "Swift",
          "Objective-C",
          "Flutter",
          "Dart",
          "React Native",
          "JavaScript",
          "Mobile UI/UX",
          "REST APIs",
          "SQLite",
          "Git",
          "App Store Deployment"
        ],
        averageSalary: "6-16 LPA",
        demandTrend: "Very high",
        topCompanies: ["Google", "Apple", "Samsung", "Uber", "Swiggy", "PayTM", "PhonePe"],
        careerPaths: {
          icon: "📱",
          title: "Mobile Development Career Paths",
          entryLevel: [
            {
              title: "Android Developer",
              description: "Kotlin/Java, Android SDK, Material Design"
            },
            {
              title: "iOS Developer", 
              description: "Swift, iOS SDK, Human Interface Guidelines"
            },
            {
              title: "Flutter Developer",
              description: "Dart, Flutter framework, Cross-platform development"
            },
            {
              title: "React Native Developer",
              description: "JavaScript, React Native, Cross-platform apps"
            }
          ],
          midLevel: [
            {
              title: "Senior Mobile Developer",
              description: "Advanced patterns, Performance optimization"
            },
            {
              title: "Mobile Architect",
              description: "App architecture, Technical leadership"
            },
            {
              title: "Cross-Platform Specialist",
              description: "Multi-platform expertise, Framework mastery"
            }
          ],
          skillsRoadmap: {
            foundation: ["Programming basics", "Mobile UI concepts", "Version control", "Debugging"],
            platform: ["Native development", "Platform SDKs", "UI frameworks", "App lifecycle"],
            integration: ["APIs", "Databases", "Authentication", "Push notifications"],
            advanced: ["Performance optimization", "Security", "CI/CD", "App store optimization"]
          }
        }
      },
      {
        id: "ai_ml",
        name: "AI & Machine Learning", 
        keywords: [
          // Basic/Low Level
          "artificial intelligence", "ai", "machine learning", "ml", "basic ml", "supervised learning",
          "unsupervised learning", "linear regression", "logistic regression", "decision trees", "basic statistics",
          
          // Medium Level
          "deep learning", "neural networks", "python", "scikit-learn", "pandas", "numpy", "matplotlib",
          "classification", "regression", "clustering", "random forest", "svm", "naive bayes", "knn",
          
          // Advanced/High Level
          "advanced deep learning", "convolutional neural networks", "cnn", "recurrent neural networks", "rnn",
          "lstm", "transformer", "attention mechanism", "generative ai", "gpt", "bert", "nlp", 
          "natural language processing", "computer vision", "opencv", "image processing", "object detection",
          "tensorflow", "pytorch", "keras", "mlops", "model deployment", "model optimization", "automl",
          "reinforcement learning", "gan", "generative adversarial networks", "research", "papers",
          "ai ethics", "explainable ai", "edge ai", "quantization", "pruning", "knowledge distillation"
        ],
        roles: [
          "Machine Learning Engineer",
          "AI Engineer",
          "Deep Learning Engineer",
          "NLP Engineer", 
          "Computer Vision Engineer",
          "AI Research Scientist"
        ],
        skills: [
          "Python",
          "TensorFlow",
          "PyTorch",
          "Scikit-learn",
          "Pandas",
          "NumPy",
          "Deep Learning",
          "Neural Networks",
          "NLP",
          "Computer Vision",
          "Statistics",
          "Mathematics",
          "MLOps",
          "Model Deployment"
        ],
        averageSalary: "10-25 LPA",
        demandTrend: "Extremely high and growing",
        topCompanies: ["Google", "Microsoft", "OpenAI", "NVIDIA", "Amazon", "Meta", "Apple"],
        careerPaths: {
          icon: "🤖",
          title: "AI & Machine Learning Career Paths", 
          entryLevel: [
            {
              title: "ML Engineer (Junior)",
              description: "Python, Basic ML, Model training, Data preprocessing"
            },
            {
              title: "AI Engineer (Entry)",
              description: "Model integration, API development, Basic deployment"
            },
            {
              title: "Data Scientist (ML Focus)",
              description: "Statistical analysis, ML algorithms, Business insights"
            },
            {
              title: "Research Assistant",
              description: "Literature review, Experiment design, Paper writing"
            }
          ],
          midLevel: [
            {
              title: "Senior ML Engineer",
              description: "Advanced modeling, MLOps, Production systems"
            },
            {
              title: "Deep Learning Engineer", 
              description: "Neural networks, Computer vision, Advanced architectures"
            },
            {
              title: "NLP Engineer",
              description: "Language models, Text processing, Conversational AI"
            }
          ],
          skillsRoadmap: {
            foundation: ["Python programming", "Statistics", "Linear algebra", "Calculus"],
            ml: ["Supervised learning", "Unsupervised learning", "Model evaluation", "Feature engineering"],
            deep: ["Neural networks", "Deep learning frameworks", "Computer vision", "NLP"],
            production: ["MLOps", "Model deployment", "Monitoring", "A/B testing"]
          }
        }
      },
      {
        id: "vlsi_design",
        name: "VLSI Design",
        keywords: [
          // Basic/Low Level
          "vlsi", "digital design", "digital electronics", "logic design", "boolean algebra", "gates",
          "combinational circuits", "sequential circuits", "flip flops", "counters", "basic verilog",
          
          // Medium Level
          "verilog", "vhdl", "fpga", "xilinx", "altera", "intel fpga", "synthesis", "simulation",
          "testbench", "modelsim", "vivado", "quartus", "rtl design", "state machines",
          
          // Advanced/High Level
          "asic design", "physical design", "place and route", "timing analysis", "power analysis",
          "dft", "design for test", "verification", "uvm", "system verilog", "assertion based verification",
          "low power design", "high speed design", "analog mixed signal", "pll", "serdes", "memory design",
          "processor design", "soc design", "ip design", "silicon validation", "tape out"
        ],
        roles: [
          "VLSI Design Engineer",
          "ASIC Design Engineer",
          "FPGA Developer",
          "Physical Design Engineer"
        ],
        skills: [
          "Verilog",
          "VHDL",
          "SystemVerilog",
          "Digital Design",
          "ASIC Design",
          "FPGA",
          "Physical Design",
          "Timing Analysis",
          "Power Analysis",
          "Design Verification"
        ],
        averageSalary: "8-16 LPA",
        demandTrend: "High",
        topCompanies: ["Intel", "Qualcomm", "Texas Instruments", "AMD", "NVIDIA"]
      },
      {
        id: "telecom_networks",
        name: "Telecommunications & Networks",
        keywords: [
          // Basic/Low Level
          "telecommunications", "telecom", "networking", "basic networking", "osi model", "tcp/ip",
          "ethernet", "lan", "wan", "routers", "switches", "cables", "network basics",
          
          // Medium Level
          "network protocols", "wireless", "wifi", "bluetooth", "cellular", "gsm", "3g", "4g", "lte",
          "antenna", "rf", "radio frequency", "signal processing", "modulation", "demodulation",
          
          // Advanced/High Level
          "5g", "advanced wireless", "mimo", "beamforming", "massive mimo", "network optimization",
          "rf design", "antenna design", "microwave", "satellite communication", "fiber optics",
          "network planning", "coverage optimization", "interference mitigation", "spectrum management",
          "network security", "sdn", "nfv", "edge computing", "network slicing", "iot connectivity"
        ],
        roles: [
          "Telecom Engineer",
          "RF Engineer",
          "Network Engineer",
          "Signal Processing Engineer"
        ],
        skills: [
          "5G",
          "4G/LTE",
          "RF Design",
          "Antenna Design",
          "Signal Processing",
          "Digital Communications",
          "Network Protocols",
          "Wireless Communications",
          "Satellite Communications"
        ],
        averageSalary: "6-12 LPA",
        demandTrend: "High",
        topCompanies: ["Ericsson", "Nokia", "Huawei", "Qualcomm", "Reliance Jio"]
      },
      {
        id: "pcb_design",
        name: "PCB Design & Electronics",
        keywords: [
          // Basic/Low Level
          "pcb design", "printed circuit board", "electronics", "circuit design", "schematic design",
          "breadboard", "prototyping", "basic electronics", "resistors", "capacitors", "components",
          
          // Medium Level
          "eagle", "kicad", "altium designer", "layout design", "routing", "gerber files", "fabrication",
          "smd", "through hole", "soldering", "pcb assembly", "testing", "debugging",
          
          // Advanced/High Level
          "advanced pcb design", "high speed design", "signal integrity", "power integrity", "emi/emc",
          "thermal management", "multi-layer pcb", "flex pcb", "rigid-flex", "hdmi design", "ddr design",
          "rf pcb design", "impedance control", "differential pairs", "via optimization", "crosstalk",
          "power distribution", "decoupling", "design for manufacturing", "design for assembly", "dfm", "dfa"
        ],
        roles: [
          "PCB Design Engineer",
          "Electronics Design Engineer",
          "Circuit Design Engineer"
        ],
        skills: [
          "PCB Design",
          "Eagle",
          "Altium Designer",
          "KiCad",
          "Circuit Design",
          "Analog Electronics",
          "Digital Electronics",
          "Power Electronics",
          "EMI/EMC",
          "Thermal Management"
        ],
        averageSalary: "5-12 LPA",
        demandTrend: "Steady",
        topCompanies: ["Intel", "Qualcomm", "Texas Instruments", "AMD", "Broadcom"]
      }
    ]
  },
  {
    id: "btech_eee",
    name: "B.Tech in Electrical & Electronics Engineering (EEE)",
    categories: [
      {
        id: "power_systems",
        name: "Power Systems",
        keywords: [
          // Basic/Low Level
          "power systems", "electrical systems", "electricity", "power", "voltage", "current", "basic electrical",
          "circuits", "ac", "dc", "transformers", "generators", "motors", "electrical safety",
          
          // Medium Level
          "power generation", "power transmission", "power distribution", "substations", "switchgear",
          "protection systems", "relays", "power electronics", "inverters", "converters", "ups",
          
          // Advanced/High Level
          "advanced power systems", "smart grid", "power system analysis", "load flow", "fault analysis",
          "stability analysis", "phasor measurement units", "pmu", "wide area monitoring", "facts devices",
          "hvdc", "renewable energy integration", "grid modernization", "energy storage", "microgrids",
          "power quality", "harmonics", "power system planning", "energy management systems", "ems"
        ],
        roles: [
          "Power Systems Engineer",
          "Electrical Design Engineer",
          "Transmission Engineer",
          "Distribution Engineer"
        ],
        skills: [
          "Power Systems",
          "Electrical Design",
          "AutoCAD Electrical",
          "ETAP",
          "MATLAB",
          "PLC",
          "SCADA",
          "Power Electronics",
          "Electrical Safety",
          "Energy Management"
        ],
        averageSalary: "6-12 LPA",
        demandTrend: "High",
        topCompanies: ["BHEL", "NTPC", "Power Grid", "L&T", "Siemens"]
      },
      {
        id: "control_automation",
        name: "Control & Automation",
        keywords: [
          // Basic/Low Level
          "control systems", "automation", "basic control", "feedback control", "pid", "proportional",
          "integral", "derivative", "sensors", "actuators", "control loops", "process control",
          
          // Medium Level
          "plc programming", "plc", "programmable logic controller", "scada", "hmi", "human machine interface",
          "industrial automation", "ladder logic", "function block", "structured text", "instrumentation",
          
          // Advanced/High Level
          "advanced control systems", "model predictive control", "mpc", "adaptive control", "robust control",
          "nonlinear control", "optimal control", "state space", "digital control", "dcs", "distributed control",
          "industrial robotics", "motion control", "servo systems", "fieldbus", "profibus", "modbus",
          "industrial networks", "system integration", "fault diagnosis", "predictive maintenance",
          "industry 4.0", "iot in automation", "smart manufacturing", "digital twin"
        ],
        roles: [
          "Control Systems Engineer",
          "Automation Engineer (PLC/SCADA)",
          "Instrumentation Engineer",
          "Robotics Engineer"
        ],
        skills: [
          "Control Systems",
          "PLC Programming",
          "SCADA",
          "PID Control",
          "Automation",
          "Industrial Robotics",
          "Sensors",
          "Actuators",
          "HMI",
          "Industrial Networks"
        ],
        averageSalary: "6-14 LPA",
        demandTrend: "High",
        topCompanies: ["Siemens", "ABB", "Schneider Electric", "Rockwell", "Honeywell"]
      },
      {
        id: "renewable_energy",
        name: "Renewable Energy",
        keywords: [
          // Basic/Low Level
          "renewable energy", "clean energy", "green energy", "solar", "wind", "basic renewable",
          "photovoltaic", "pv", "solar panel", "wind turbine", "hydroelectric", "biomass", "geothermal",
          
          // Medium Level
          "solar energy systems", "wind energy systems", "battery storage", "energy storage", "inverters",
          "charge controllers", "mppt", "grid tied systems", "off grid systems", "electric vehicles", "ev",
          
          // Advanced/High Level
          "advanced renewable energy", "smart grid integration", "grid stability", "energy management systems",
          "battery management systems", "bms", "lithium ion", "power conversion", "microgrids", "virtual power plants",
          "energy harvesting", "concentrated solar power", "csp", "offshore wind", "floating solar",
          "green hydrogen", "fuel cells", "power to x", "energy trading", "renewable forecasting",
          "grid codes", "power quality", "ancillary services", "demand response", "net metering"
        ],
        roles: [
          "Renewable Energy Engineer",
          "Solar Engineer",
          "Wind Energy Engineer",
          "Electric Vehicle Engineer"
        ],
        skills: [
          "Solar Energy",
          "Wind Energy",
          "Battery Technology",
          "Electric Vehicles",
          "Power Electronics",
          "Energy Storage",
          "Grid Integration",
          "Sustainability"
        ],
        averageSalary: "7-15 LPA",
        demandTrend: "Very high and growing",
        topCompanies: ["Suzlon", "Adani Green", "Tata Power", "ReNew Power", "Hero MotoCorp"]
      },
      {
        id: "circuit_design",
        name: "Circuit Design",
        keywords: [
          // Basic/Low Level
          "circuit design", "electronic circuits", "analog circuits", "digital circuits", "basic electronics",
          "resistors", "capacitors", "inductors", "diodes", "transistors", "circuit analysis", "ohms law",
          
          // Medium Level
          "pcb design", "printed circuit board", "schematic design", "component selection", "circuit simulation",
          "altium", "kicad", "eagle", "orcad", "spice", "ltspice", "prototyping", "breadboard",
          
          // Advanced/High Level
          "advanced circuit design", "high frequency design", "rf circuit design", "analog integrated circuits",
          "mixed signal design", "layout optimization", "signal integrity", "power integrity", "emi emc",
          "electromagnetic interference", "electromagnetic compatibility", "high speed digital", "impedance control",
          "differential signaling", "clock distribution", "power distribution networks", "thermal management",
          "dft", "design for test", "design for manufacturing", "dfm", "yield optimization", "process variations"
        ],
        roles: [
          "Circuit Design Engineer",
          "Analog Design Engineer",
          "Digital Design Engineer"
        ],
        skills: [
          "Analog Circuit Design",
          "Digital Circuit Design",
          "PCB Design",
          "SPICE",
          "Cadence",
          "Mixed Signal Design",
          "Power Management",
          "Signal Integrity"
        ],
        averageSalary: "6-14 LPA",
        demandTrend: "High",
        topCompanies: ["Intel", "Qualcomm", "Texas Instruments", "AMD", "Broadcom"]
      }
    ]
  },
  {
    id: "btech_civil",
    name: "B.Tech in Civil Engineering",
    categories: [
      {
        id: "structural_engineering",
        name: "Structural Engineering",
        keywords: [
          // Basic/Low Level
          "structural engineering", "structures", "building design", "concrete", "steel", "basic structural",
          "beams", "columns", "slabs", "foundations", "loads", "analysis", "design", "construction",
          
          // Medium Level
          "reinforced concrete", "rcc", "structural analysis", "structural design", "earthquake engineering",
          "seismic design", "wind loads", "staad pro", "etabs", "sap2000", "autocad", "reinforcement",
          
          // Advanced/High Level
          "advanced structural analysis", "finite element analysis", "fea", "nonlinear analysis",
          "dynamic analysis", "pushover analysis", "performance based design", "high rise buildings",
          "bridge engineering", "prestressed concrete", "post tensioned", "steel connections",
          "composite structures", "seismic isolation", "base isolation", "dampers", "structural optimization",
          "life cycle assessment", "sustainability", "green building", "leed", "building information modeling", "bim"
        ],
        roles: [
          "Structural Engineer",
          "Structural Design Engineer",
          "Bridge Engineer",
          "Seismic Engineer"
        ],
        skills: [
          "Structural Analysis",
          "STAAD Pro",
          "ETABS",
          "SAP2000",
          "AutoCAD",
          "Reinforced Concrete",
          "Steel Structures",
          "Seismic Design",
          "Foundation Design"
        ],
        averageSalary: "5-12 LPA",
        demandTrend: "Steady",
        topCompanies: ["L&T", "Gammon India", "HCC", "IRCON", "NHAI"]
      },
      {
        id: "construction_management",
        name: "Construction Management",
        keywords: [
          // Basic/Low Level
          "construction management", "construction", "project management", "site management", "basic construction",
          "building construction", "civil construction", "project planning", "scheduling", "cost estimation",
          
          // Medium Level
          "construction planning", "quality control", "safety management", "contract management",
          "quantity surveying", "cost control", "primavera", "ms project", "autocad", "construction methods",
          
          // Advanced/High Level
          "advanced project management", "construction technology", "lean construction", "building information modeling",
          "bim", "4d planning", "5d cost modeling", "construction automation", "prefabrication", "modular construction",
          "sustainable construction", "green construction", "construction robotics", "digital construction",
          "construction innovation", "value engineering", "risk management", "claims management",
          "construction law", "dispute resolution", "mega projects", "international construction"
        ],
        roles: [
          "Construction Manager",
          "Site Engineer",
          "Project Engineer",
          "Quantity Surveyor"
        ],
        skills: [
          "Project Management",
          "Construction Planning",
          "Cost Estimation",
          "Quality Control",
          "Safety Management",
          "AutoCAD",
          "Primavera",
          "MS Project",
          "BIM"
        ],
        averageSalary: "5-11 LPA",
        demandTrend: "Steady",
        topCompanies: ["L&T", "Gammon India", "HCC", "IRCON", "DLF"]
      },
      {
        id: "transportation_urban",
        name: "Transportation & Urban Planning",
        keywords: [
          // Basic/Low Level
          "transportation", "urban planning", "traffic", "roads", "highways", "basic transportation",
          "city planning", "town planning", "public transport", "transport systems", "traffic management",
          
          // Medium Level
          "transportation engineering", "highway engineering", "traffic engineering", "transportation planning",
          "pavement design", "traffic signals", "intersection design", "gis", "autocad", "civil 3d",
          
          // Advanced/High Level
          "advanced transportation systems", "intelligent transportation systems", "its", "smart cities",
          "sustainable transportation", "transportation modeling", "traffic simulation", "transit oriented development",
          "multimodal transportation", "logistics planning", "freight transportation", "railway engineering",
          "metro systems", "brt", "bus rapid transit", "autonomous vehicles", "connected vehicles",
          "mobility as a service", "maas", "transportation economics", "land use planning",
          "environmental impact assessment", "eia", "transportation policy", "smart mobility"
        ],
        roles: [
          "Transportation Engineer",
          "Urban Planner",
          "Highway Engineer",
          "Traffic Engineer"
        ],
        skills: [
          "Transportation Planning",
          "Urban Planning",
          "Traffic Engineering",
          "Highway Design",
          "GIS",
          "AutoCAD",
          "Civil 3D",
          "Transportation Modeling"
        ],
        averageSalary: "5-10 LPA",
        demandTrend: "Growing",
        topCompanies: ["NHAI", "IRCON", "Metro Corporations", "Municipal Corporations"]
      },
      {
        id: "environmental_geotechnical",
        name: "Environmental & Geotechnical",
        keywords: [
          // Basic/Low Level
          "environmental engineering", "geotechnical engineering", "soil mechanics", "foundation engineering",
          "water resources", "basic environmental", "soil testing", "water treatment", "waste management",
          
          // Medium Level
          "groundwater", "water supply", "wastewater treatment", "solid waste management", "air pollution control",
          "soil investigation", "foundation design", "retaining walls", "slope stability", "environmental impact",
          
          // Advanced/High Level
          "advanced geotechnical engineering", "deep foundations", "ground improvement", "soil stabilization",
          "earthquake geotechnics", "geotechnical instrumentation", "advanced environmental systems",
          "environmental modeling", "remediation technologies", "groundwater modeling", "contaminated site remediation",
          "environmental monitoring", "climate change adaptation", "sustainable development", "circular economy",
          "waste to energy", "advanced water treatment", "membrane technology", "nanotechnology in environment",
          "environmental biotechnology", "phytoremediation", "carbon sequestration", "life cycle assessment"
        ],
        roles: [
          "Environmental Engineer",
          "Geotechnical Engineer",
          "Surveyor",
          "Water Resources Engineer"
        ],
        skills: [
          "Environmental Impact Assessment",
          "Soil Mechanics",
          "Foundation Engineering",
          "Surveying",
          "GIS",
          "Water Resources",
          "Waste Management",
          "Environmental Compliance"
        ],
        averageSalary: "5-10 LPA",
        demandTrend: "Growing",
        topCompanies: ["L&T", "Gammon India", "HCC", "Environmental Agencies"]
      }
    ]
  },
  {
    id: "bca",
    name: "BCA (Bachelor of Computer Applications)",
    categories: [
      {
        id: "software_development_bca",
        name: "Software Development",
        keywords: [
          // Basic/Low Level
          "software development", "programming", "coding", "basic programming", "web development", "app development",
          "java", "python", "javascript", "html", "css", "basic web", "frontend", "backend",
          
          // Medium Level
          "full stack development", "react", "nodejs", "php", "mysql", "mongodb", "rest api", "git",
          "responsive design", "bootstrap", "jquery", "express", "spring boot", "django", "flask",
          
          // Advanced/High Level
          "advanced software development", "microservices", "system design", "software architecture",
          "design patterns", "clean code", "solid principles", "test driven development", "tdd",
          "devops", "ci cd", "docker", "kubernetes", "cloud deployment", "agile", "scrum",
          "performance optimization", "scalability", "security", "authentication", "authorization",
          "advanced frameworks", "graphql", "websockets", "progressive web apps", "pwa"
        ],
        roles: [
          "Software Developer",
          "Web Developer",
          "App Developer",
          "Full Stack Developer",
          "Backend Developer"
        ],
        skills: [
          "Java",
          "Python",
          "JavaScript",
          "HTML/CSS",
          "React",
          "Node.js",
          "PHP",
          "MySQL",
          "MongoDB",
          "Git",
          "REST API"
        ],
        averageSalary: "4-10 LPA",
        demandTrend: "High",
        topCompanies: ["TCS", "Infosys", "Wipro", "HCL", "Cognizant"]
      },
      {
        id: "it_support",
        name: "IT Support & Administration",
        keywords: [
          // Basic/Low Level
          "it support", "technical support", "help desk", "troubleshooting", "computer support", "basic it",
          "windows", "microsoft office", "hardware", "software", "customer support", "problem solving",
          
          // Medium Level
          "system administration", "network administration", "linux", "active directory", "database management",
          "server management", "backup", "security", "networking", "tcp ip", "dns", "dhcp",
          
          // Advanced/High Level
          "advanced system administration", "enterprise it", "infrastructure management", "virtualization",
          "vmware", "hyper-v", "cloud computing", "aws", "azure", "gcp", "powershell", "bash scripting",
          "automation", "monitoring", "itil", "service management", "disaster recovery", "business continuity",
          "compliance", "cybersecurity", "penetration testing", "incident response", "change management",
          "capacity planning", "performance tuning", "enterprise architecture"
        ],
        roles: [
          "Technical Support Engineer",
          "IT Support Specialist",
          "System Analyst",
          "Network Administrator",
          "Database Administrator"
        ],
        skills: [
          "Windows/Linux",
          "Networking",
          "Database Management",
          "Troubleshooting",
          "Customer Support",
          "System Administration",
          "Security",
          "Cloud Computing"
        ],
        averageSalary: "3-8 LPA",
        demandTrend: "Steady",
        topCompanies: ["TCS", "Infosys", "Wipro", "HCL", "Cognizant"]
      },
      {
        id: "ui_ux_qa",
        name: "UI/UX & Quality Assurance",
        keywords: [
          // Basic/Low Level
          "ui design", "ux design", "user interface", "user experience", "basic design", "testing",
          "quality assurance", "qa", "manual testing", "bug testing", "user testing", "design basics",
          
          // Medium Level
          "figma", "adobe xd", "sketch", "prototyping", "wireframing", "user research", "usability testing",
          "selenium", "automation testing", "test cases", "test planning", "regression testing", "api testing",
          
          // Advanced/High Level
          "advanced ui ux design", "design systems", "user centered design", "design thinking", "interaction design",
          "accessibility", "inclusive design", "design research", "advanced testing", "test automation frameworks",
          "performance testing", "load testing", "security testing", "mobile testing", "cross browser testing",
          "continuous testing", "shift left testing", "behavior driven development", "bdd", "test driven development",
          "quality engineering", "test strategy", "risk based testing", "exploratory testing"
        ],
        roles: [
          "UI/UX Designer",
          "QA Tester",
          "Quality Analyst",
          "Test Engineer"
        ],
        skills: [
          "UI/UX Design",
          "Figma",
          "Adobe XD",
          "Testing",
          "Selenium",
          "Manual Testing",
          "Automation Testing",
          "User Research"
        ],
        averageSalary: "4-9 LPA",
        demandTrend: "High",
        topCompanies: ["TCS", "Infosys", "Wipro", "HCL", "Cognizant"]
      },
      {
        id: "cybersecurity_cloud",
        name: "Cybersecurity & Cloud",
        keywords: [
          // Basic/Low Level
          "cybersecurity", "information security", "network security", "basic security", "cloud computing",
          "cloud basics", "security awareness", "password security", "antivirus", "firewall",
          
          // Medium Level
          "ethical hacking", "penetration testing", "vulnerability assessment", "security auditing",
          "aws", "azure", "google cloud", "cloud migration", "cloud deployment", "cloud security",
          
          // Advanced/High Level
          "advanced cybersecurity", "security architecture", "threat intelligence", "incident response",
          "digital forensics", "malware analysis", "security operations center", "soc", "siem",
          "advanced cloud computing", "cloud architecture", "multi cloud", "hybrid cloud", "serverless",
          "container security", "devsecops", "zero trust", "compliance", "gdpr", "iso 27001",
          "risk management", "security governance", "threat modeling", "red team", "blue team"
        ],
        roles: [
          "Cybersecurity Associate",
          "Cloud Support Associate",
          "Security Analyst"
        ],
        skills: [
          "Cybersecurity",
          "Cloud Computing",
          "AWS",
          "Azure",
          "Security Tools",
          "Network Security",
          "Incident Response"
        ],
        averageSalary: "4-9 LPA",
        demandTrend: "High",
        topCompanies: ["TCS", "Infosys", "Wipro", "HCL", "Cognizant"]
      }
    ]
  },
  {
    id: "bsc_agriculture",
    name: "B.Sc. in Agriculture",
    categories: [
      {
        id: "agricultural_officer",
        name: "Agricultural Officer & Management",
        keywords: [
          // Basic/Low Level
          "agriculture", "farming", "crop cultivation", "basic agriculture", "agricultural officer", "farm management",
          "crops", "seeds", "fertilizers", "pesticides", "soil", "water", "irrigation", "harvest",
          
          // Medium Level
          "agricultural economics", "crop management", "pest management", "soil science", "agricultural extension",
          "rural development", "farm planning", "agricultural marketing", "cooperative farming", "organic farming",
          
          // Advanced/High Level
          "advanced farm management", "precision agriculture", "sustainable agriculture", "agricultural technology",
          "smart farming", "digital agriculture", "agricultural policy", "agribusiness management",
          "supply chain management", "value chain", "post harvest technology", "agricultural finance",
          "risk management", "climate smart agriculture", "integrated pest management", "ipm",
          "soil health management", "nutrient management", "agricultural innovation", "farm mechanization"
        ],
        roles: [
          "Agricultural Officer",
          "Farm Manager",
          "Agri-Business Manager",
          "Agriculture Field Officer (AFO)"
        ],
        skills: [
          "Crop Management",
          "Farm Management",
          "Agricultural Economics",
          "Soil Science",
          "Pest Management",
          "Irrigation Systems",
          "Agricultural Extension",
          "Rural Development"
        ],
        averageSalary: "4-8 LPA",
        demandTrend: "Growing",
        topCompanies: ["NABARD", "State Agricultural Departments", "Private Farms", "Agri Companies"]
      },
      {
        id: "agricultural_research",
        name: "Agricultural Research",
        keywords: [
          // Basic/Low Level
          "agricultural research", "research", "plant science", "soil science", "basic research", "laboratory",
          "data collection", "field experiments", "plant breeding", "seed technology", "crop improvement",
          
          // Medium Level
          "research methodology", "soil analysis", "plant pathology", "agronomist", "crop physiology",
          "genetics", "biotechnology", "tissue culture", "molecular markers", "statistical analysis",
          
          // Advanced/High Level
          "advanced agricultural research", "genomics", "proteomics", "bioinformatics", "marker assisted selection",
          "genetic engineering", "crispr", "gene editing", "climate resilient crops", "drought tolerance",
          "disease resistance", "yield enhancement", "nutritional improvement", "biofortification",
          "phenotyping", "high throughput screening", "multi location trials", "gxe interaction",
          "quantitative genetics", "plant molecular biology", "agricultural data science", "remote sensing"
        ],
        roles: [
          "Agricultural Research Scientist",
          "Soil Scientist",
          "Agronomist",
          "Plant Pathologist",
          "Seed Technologist"
        ],
        skills: [
          "Research Methodology",
          "Soil Analysis",
          "Plant Breeding",
          "Crop Pathology",
          "Seed Technology",
          "Laboratory Techniques",
          "Data Analysis",
          "R/Python"
        ],
        averageSalary: "5-10 LPA",
        demandTrend: "Growing",
        topCompanies: ["ICAR", "Agricultural Universities", "Research Institutes", "Seed Companies"]
      },
      {
        id: "horticulture_food",
        name: "Horticulture & Food Safety",
        keywords: [
          // Basic/Low Level
          "horticulture", "fruits", "vegetables", "flowers", "gardening", "basic horticulture", "food safety",
          "quality control", "organic farming", "greenhouse", "nursery", "landscaping", "kitchen garden",
          
          // Medium Level
          "crop consulting", "pest control", "plant protection", "food processing", "post harvest management",
          "food quality", "food standards", "haccp", "food testing", "agricultural consulting",
          
          // Advanced/High Level
          "advanced horticulture", "controlled environment agriculture", "hydroponics", "aeroponics",
          "vertical farming", "protected cultivation", "precision horticulture", "advanced food safety",
          "food safety management systems", "iso 22000", "brc", "food traceability", "food forensics",
          "nutraceuticals", "functional foods", "food innovation", "product development", "shelf life studies",
          "packaging technology", "cold chain management", "export quality standards", "phytosanitary"
        ],
        roles: [
          "Horticulturist",
          "Food Safety Officer",
          "Crop Consultant",
          "Pest Control Advisor"
        ],
        skills: [
          "Horticulture",
          "Food Safety",
          "Pest Management",
          "Crop Consulting",
          "Quality Control",
          "Organic Farming",
          "Sustainable Agriculture"
        ],
        averageSalary: "4-8 LPA",
        demandTrend: "Growing",
        topCompanies: ["FSSAI", "Agricultural Companies", "Food Processing Units", "Export Houses"]
      },
      {
        id: "irrigation_specialist",
        name: "Irrigation & Water Management",
        keywords: [
          // Basic/Low Level
          "irrigation", "water management", "basic irrigation", "drip irrigation", "sprinkler irrigation",
          "water conservation", "watershed management", "agricultural economics", "farm economics",
          
          // Medium Level
          "irrigation systems", "water use efficiency", "micro irrigation", "fertigation", "irrigation scheduling",
          "soil moisture", "evapotranspiration", "water quality", "drainage", "salinity management",
          
          // Advanced/High Level
          "advanced water management", "precision irrigation", "smart irrigation", "automated irrigation",
          "remote sensing for irrigation", "gis in water management", "water resource planning",
          "integrated water resource management", "iwrm", "climate change and water", "water footprint",
          "virtual water", "water productivity", "deficit irrigation", "regulated deficit irrigation",
          "saline agriculture", "water recycling", "desalination for agriculture", "groundwater management",
          "aquifer recharge", "rainwater harvesting", "agricultural drainage systems"
        ],
        roles: [
          "Irrigation Specialist",
          "Water Management Specialist",
          "Agricultural Economist"
        ],
        skills: [
          "Irrigation Systems",
          "Water Management",
          "Agricultural Economics",
          "GIS",
          "Remote Sensing",
          "Water Conservation",
          "Drip Irrigation"
        ],
        averageSalary: "4-8 LPA",
        demandTrend: "Growing",
        topCompanies: ["NABARD", "Irrigation Departments", "Agricultural Companies", "NGOs"]
      }
    ]
  },
  {
    id: "management",
    name: "Management (BBA, MBA, etc.)",
    categories: [
      {
        id: "business_analysis",
        name: "Business Analysis",
        keywords: [
          // Basic/Low Level
          "business analysis", "business analyst", "financial analysis", "market research", "basic analysis",
          "excel", "powerpoint", "data analysis", "reporting", "business intelligence", "dashboard",
          
          // Medium Level
          "power bi", "tableau", "sql", "statistics", "process modeling", "requirements gathering",
          "business process", "gap analysis", "stakeholder management", "project management", "agile",
          
          // Advanced/High Level
          "advanced business analysis", "strategic analysis", "business intelligence architecture",
          "predictive analytics", "advanced analytics", "machine learning", "data science", "big data",
          "business transformation", "digital transformation", "process optimization", "lean six sigma",
          "enterprise architecture", "system integration", "business case development", "roi analysis",
          "competitive intelligence", "market intelligence", "customer analytics", "advanced reporting"
        ],
        roles: [
          "Business Analyst",
          "Financial Analyst",
          "Market Research Analyst",
          "Data Analyst"
        ],
        skills: [
          "Business Analysis",
          "Financial Analysis",
          "Market Research",
          "Excel",
          "Power BI",
          "SQL",
          "Statistics",
          "Data Visualization",
          "Process Modeling"
        ],
        averageSalary: "5-12 LPA",
        demandTrend: "High",
        topCompanies: ["Deloitte", "KPMG", "EY", "PwC", "McKinsey"]
      },
      {
        id: "marketing_sales",
        name: "Marketing & Sales",
        keywords: [
          // Basic/Low Level
          "marketing", "sales", "digital marketing", "social media", "basic marketing", "advertising",
          "promotion", "customer service", "lead generation", "brand awareness", "market research",
          
          // Medium Level
          "social media marketing", "seo", "sem", "content marketing", "email marketing", "sales management",
          "brand management", "customer relationship management", "crm", "google analytics", "facebook ads",
          
          // Advanced/High Level
          "advanced digital marketing", "marketing automation", "growth hacking", "conversion optimization",
          "marketing analytics", "customer segmentation", "personalization", "omnichannel marketing",
          "marketing technology", "martech", "attribution modeling", "customer lifetime value", "clv",
          "advanced sales strategies", "account based marketing", "abm", "sales enablement", "revenue operations",
          "marketing operations", "demand generation", "product marketing", "brand strategy", "customer experience"
        ],
        roles: [
          "Marketing Executive",
          "Sales Manager",
          "Brand Manager",
          "Digital Marketing Specialist",
          "Customer Relationship Manager"
        ],
        skills: [
          "Digital Marketing",
          "Social Media Marketing",
          "SEO/SEM",
          "Sales Management",
          "Brand Management",
          "Customer Relationship",
          "Market Research",
          "Advertising"
        ],
        averageSalary: "4-10 LPA",
        demandTrend: "High",
        topCompanies: ["HUL", "P&G", "Nestle", "Coca-Cola", "Amazon"]
      },
      {
        id: "hr_operations",
        name: "HR & Operations",
        keywords: [
          // Basic/Low Level
          "human resources", "hr", "operations", "basic hr", "recruitment", "hiring", "employee relations",
          "payroll", "operations management", "process improvement", "project coordination", "supply chain",
          
          // Medium Level
          "performance management", "talent acquisition", "training and development", "compensation",
          "benefits administration", "hris", "project management", "lean", "six sigma", "supply chain management",
          
          // Advanced/High Level
          "advanced hr management", "strategic hr", "hr analytics", "people analytics", "workforce planning",
          "organizational development", "change management", "talent management", "succession planning",
          "advanced operations management", "operations strategy", "digital transformation", "automation",
          "process optimization", "continuous improvement", "operational excellence", "quality management",
          "risk management", "compliance", "vendor management", "strategic sourcing", "logistics optimization"
        ],
        roles: [
          "HR Executive / Manager",
          "Operations Manager",
          "Project Coordinator",
          "Supply Chain Analyst"
        ],
        skills: [
          "Human Resources",
          "Operations Management",
          "Project Management",
          "Supply Chain",
          "Recruitment",
          "Employee Relations",
          "Performance Management",
          "Process Improvement"
        ],
        averageSalary: "4-10 LPA",
        demandTrend: "Steady",
        topCompanies: ["Deloitte", "KPMG", "EY", "PwC", "McKinsey"]
      },
      {
        id: "product_consulting",
        name: "Product & Consulting",
        keywords: [
          // Basic/Low Level
          "product management", "consulting", "basic product", "product development", "business consulting",
          "client management", "problem solving", "presentation", "research", "analysis", "strategy",
          
          // Medium Level
          "product strategy", "product roadmap", "agile", "scrum", "user research", "market analysis",
          "management consulting", "business strategy", "process consulting", "project management", "stakeholder management",
          
          // Advanced/High Level
          "advanced product management", "product analytics", "growth product management", "data driven product",
          "product metrics", "a b testing", "user experience", "product led growth", "platform strategy",
          "advanced consulting", "strategic consulting", "transformation consulting", "digital strategy",
          "innovation consulting", "organizational design", "change management", "business model innovation",
          "ecosystem strategy", "partnership strategy", "merger and acquisition", "due diligence", "post merger integration"
        ],
        roles: [
          "Product Manager",
          "Management Consultant",
          "Retail Manager",
          "Business Development"
        ],
        skills: [
          "Product Management",
          "Consulting",
          "Retail Management",
          "Business Development",
          "Strategy",
          "Market Analysis",
          "Stakeholder Management"
        ],
        averageSalary: "6-15 LPA",
        demandTrend: "High",
        topCompanies: ["McKinsey", "BCG", "Bain", "Amazon", "Flipkart"]
      }
    ]
  },
  {
    id: "pharmacy",
    name: "Pharmacy (B.Pharm, M.Pharm)",
    categories: [
      {
        id: "clinical_research_pharma",
        name: "Clinical Research",
        keywords: [
          // Basic/Low Level
          "clinical research", "drug trials", "pharmaceutical research", "basic clinical", "drug development",
          "clinical trials", "drug safety", "medical research", "patient studies", "clinical data",
          
          // Medium Level
          "clinical research associate", "cra", "drug safety associate", "medical writing", "biostatistics",
          "regulatory guidelines", "data management", "ich guidelines", "gcp", "good clinical practice",
          
          // Advanced/High Level
          "advanced clinical research", "clinical development", "phase i ii iii trials", "regulatory strategy",
          "clinical operations", "clinical data management", "biomarker research", "personalized medicine",
          "pharmacokinetics", "pharmacodynamics", "clinical pharmacology", "drug metabolism", "toxicology",
          "regulatory submissions", "nda", "anda", "investigational new drug", "ind", "clinical trial design",
          "adaptive trials", "real world evidence", "rwe", "pharmacovigilance", "signal detection"
        ],
        roles: [
          "Clinical Research Associate",
          "Drug Safety Associate",
          "Medical Writer",
          "Biostatistician"
        ],
        skills: [
          "Clinical Trials",
          "Drug Safety",
          "Medical Writing",
          "Biostatistics",
          "Regulatory Guidelines",
          "Data Management",
          "ICH Guidelines",
          "GCP"
        ],
        averageSalary: "4-8 LPA",
        demandTrend: "High",
        topCompanies: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Abbott", "Pfizer"]
      },
      {
        id: "quality_regulatory",
        name: "Quality & Regulatory",
        keywords: [
          // Basic/Low Level
          "quality control", "quality assurance", "regulatory affairs", "basic quality", "gmp",
          "good manufacturing practices", "documentation", "compliance", "audit", "validation",
          
          // Medium Level
          "quality systems", "regulatory guidelines", "fda", "ich", "who", "usp", "quality management",
          "capa", "corrective and preventive action", "deviation", "change control", "stability studies",
          
          // Advanced/High Level
          "advanced quality systems", "quality by design", "qbd", "process analytical technology", "pat",
          "continuous improvement", "lean manufacturing", "advanced regulatory affairs", "regulatory strategy",
          "global regulatory", "regulatory intelligence", "submission management", "health authority interactions",
          "regulatory compliance", "inspection readiness", "risk management", "ich q9", "pharmaceutical quality system",
          "serialization", "data integrity", "computer system validation", "csv", "21 cfr part 11"
        ],
        roles: [
          "Quality Control Analyst",
          "Quality Assurance Executive",
          "Regulatory Affairs Associate",
          "Compliance Officer"
        ],
        skills: [
          "Quality Control",
          "Quality Assurance",
          "Regulatory Affairs",
          "GMP",
          "Documentation",
          "Compliance",
          "Audit",
          "Validation"
        ],
        averageSalary: "4-7 LPA",
        demandTrend: "Steady",
        topCompanies: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Abbott", "Pfizer"]
      },
      {
        id: "production_sales",
        name: "Production & Sales",
        keywords: [
          // Basic/Low Level
          "pharmaceutical production", "manufacturing", "sales", "medical representative", "basic production",
          "formulation", "pharmaceutical sales", "customer relations", "product knowledge", "market analysis",
          
          // Medium Level
          "production management", "pharmaceutical technology", "tablet manufacturing", "capsule filling",
          "liquid formulations", "sales management", "territory management", "key account management", "kam",
          
          // Advanced/High Level
          "advanced pharmaceutical production", "continuous manufacturing", "process optimization", "scale up",
          "technology transfer", "advanced pharmaceutical sales", "strategic account management", "market access",
          "pricing strategy", "commercial excellence", "sales analytics", "customer insights", "digital marketing",
          "omnichannel engagement", "value based selling", "therapeutic area expertise", "medical affairs",
          "health economics", "outcomes research", "reimbursement", "payer relations", "competitive intelligence"
        ],
        roles: [
          "Production Executive",
          "Medical Representative",
          "Pharmaceutical Sales Manager",
          "Formulation Scientist"
        ],
        skills: [
          "Production Management",
          "Sales",
          "Formulation",
          "Pharmaceutical Technology",
          "Customer Relationship",
          "Market Analysis",
          "Product Knowledge"
        ],
        averageSalary: "4-8 LPA",
        demandTrend: "Steady",
        topCompanies: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Abbott", "Pfizer"]
      },
      {
        id: "research_development",
        name: "Research & Development",
        keywords: [
          // Basic/Low Level
          "pharmaceutical research", "drug discovery", "research and development", "basic research", "formulation development",
          "analytical research", "pharmacovigilance", "drug analysis", "pharmaceutical analysis", "laboratory research",
          
          // Medium Level
          "research scientist", "formulation scientist", "analytical scientist", "method development",
          "pharmaceutical chemistry", "medicinal chemistry", "drug formulation", "stability testing", "impurity profiling",
          
          // Advanced/High Level
          "advanced pharmaceutical research", "drug discovery and development", "computational chemistry", "molecular modeling",
          "structure activity relationship", "sar", "lead optimization", "hit to lead", "preclinical development",
          "advanced formulation development", "novel drug delivery systems", "nanotechnology", "targeted drug delivery",
          "sustained release", "controlled release", "biopharmaceutics", "pharmacokinetics", "bioequivalence",
          "advanced analytical methods", "hyphenated techniques", "lc ms ms", "nmr", "bioanalytical methods",
          "pharmacogenomics", "personalized medicine", "biopharmaceuticals", "biosimilars", "gene therapy"
        ],
        roles: [
          "Research Scientist",
          "Formulation Scientist",
          "Analytical Scientist",
          "Pharmacovigilance Officer"
        ],
        skills: [
          "Research",
          "Formulation Development",
          "Analytical Chemistry",
          "Pharmacovigilance",
          "Laboratory Techniques",
          "Data Analysis",
          "Documentation"
        ],
        averageSalary: "5-10 LPA",
        demandTrend: "High",
        topCompanies: ["Sun Pharma", "Dr. Reddy's", "Cipla", "Abbott", "Pfizer"]
      }
    ]
  },
  {
    id: "other",
    name: "Other",
    categories: [
      {
        id: "custom_domain",
        name: "Custom Domain",
        roles: [
          "Custom Role"
        ],
        skills: [
          "Custom Skills"
        ],
        averageSalary: "Varies",
        demandTrend: "Varies",
        topCompanies: ["Varies"]
      }
    ]
  }
];

export const getAllSkills = () => {
  const allSkills = new Set();
  domainsData.forEach(domain => {
    domain.categories.forEach(category => {
      category.skills.forEach(skill => allSkills.add(skill));
      });
    });
  return Array.from(allSkills).sort();
};

export const getAllRoles = () => {
  const allRoles = new Set();
  domainsData.forEach(domain => {
    domain.categories.forEach(category => {
      category.roles.forEach(role => allRoles.add(role));
      });
    });
  return Array.from(allRoles).sort();
};

export const getAllKeywords = () => {
  const allKeywords = new Set();
  domainsData.forEach(domain => {
    domain.categories.forEach(category => {
      if (category.keywords) {
        category.keywords.forEach(keyword => allKeywords.add(keyword));
      }
    });
  });
  return Array.from(allKeywords).sort();
};

export const getDomainById = (domainId) => {
  return domainsData.find(domain => domain.id === domainId);
};

export const getCategoryById = (domainId, categoryId) => {
  const domain = getDomainById(domainId);
  if (domain) {
    return domain.categories.find(category => category.id === categoryId);
  }
  return null;
};

export const getCareerPathsByCategoryId = (domainId, categoryId) => {
  const category = getCategoryById(domainId, categoryId);
  return category?.careerPaths || null;
};

export const findCategoryByKeywords = (searchText) => {
  const lowerSearchText = searchText.toLowerCase();
  
  for (const domain of domainsData) {
    for (const category of domain.categories) {
      if (category.keywords) {
        const keywordMatch = category.keywords.some(keyword => 
          lowerSearchText.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(lowerSearchText)
        );
        if (keywordMatch) {
          return { domain, category };
        }
      }
    }
  }
  return null;
};

export default domainsData; 
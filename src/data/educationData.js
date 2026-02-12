// Education Background Data with Job Domain Compatibility
export const educationBackgrounds = [
  {
    id: "btech_cse",
    name: "B.Tech in Computer Science and Engineering",
    compatibleDomains: [
      "web_development", "mobile_development", "data_analytics", "ai_ml", 
      "cloud_devops", "cybersecurity", "embedded_iot", "game_development", 
      "blockchain_web3", "enterprise_systems", "testing_qa", "research_emerging"
    ]
  },
  {
    id: "btech_ece",
    name: "B.Tech in Electronics & Communication Engineering",
    compatibleDomains: [
      "embedded_iot", "cybersecurity", "data_analytics", "ai_ml", 
      "cloud_devops", "web_development", "mobile_development", "game_development",
      "blockchain_web3", "enterprise_systems", "testing_qa", "research_emerging"
    ]
  },
  {
    id: "btech_eee",
    name: "B.Tech in Electrical Engineering",
    compatibleDomains: [
      "embedded_iot", "cloud_devops", "data_analytics", "ai_ml", 
      "cybersecurity", "enterprise_systems", "research_emerging", "testing_qa"
    ]
  },
  {
    id: "btech_mechanical",
    name: "B.Tech in Mechanical Engineering",
    compatibleDomains: [
      "embedded_iot", "game_development", "data_analytics", "ai_ml", 
      "cloud_devops", "research_emerging", "testing_qa", "enterprise_systems"
    ]
  },
  {
    id: "btech_civil",
    name: "B.Tech in Civil Engineering",
    compatibleDomains: [
      "data_analytics", "ai_ml", "cloud_devops", "research_emerging", 
      "testing_qa", "enterprise_systems"
    ]
  },
  {
    id: "bca",
    name: "BCA (Bachelor of Computer Applications)",
    compatibleDomains: [
      "web_development", "mobile_development", "data_analytics", "ai_ml", 
      "cloud_devops", "cybersecurity", "game_development", "blockchain_web3", 
      "enterprise_systems", "testing_qa"
    ]
  },
  {
    id: "bba",
    name: "BBA (Bachelor of Business Administration)",
    compatibleDomains: [
      "data_analytics", "web_development", "mobile_development", "cloud_devops", 
      "cybersecurity", "enterprise_systems", "testing_qa", "research_emerging"
    ]
  },
  {
    id: "pharmacy",
    name: "Pharmacy (B.Pharm, M.Pharm)",
    compatibleDomains: [
      "data_analytics", "ai_ml", "research_emerging", "enterprise_systems", 
      "testing_qa", "cloud_devops"
    ]
  },
  {
    id: "agriculture",
    name: "Agriculture (B.Sc. Agriculture)",
    compatibleDomains: [
      "data_analytics", "ai_ml", "research_emerging", "embedded_iot", 
      "cloud_devops", "testing_qa"
    ]
  },
  {
    id: "other",
    name: "Other",
    compatibleDomains: [
      "web_development", "mobile_development", "data_analytics", "ai_ml", 
      "cloud_devops", "cybersecurity", "embedded_iot", "game_development", 
      "blockchain_web3", "enterprise_systems", "testing_qa", "research_emerging"
    ]
  }
];

export const getEducationById = (id) => {
  return educationBackgrounds.find(edu => edu.id === id);
};

export const getCompatibleDomains = (educationId) => {
  const education = getEducationById(educationId);
  return education ? education.compatibleDomains : [];
};

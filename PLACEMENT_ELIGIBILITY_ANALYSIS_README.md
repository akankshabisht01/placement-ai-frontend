# Placement Eligibility Analysis System

## Overview

The Placement Eligibility Analysis System provides comprehensive analysis of candidate eligibility for placement opportunities based on parsed resume data. It includes ATS scoring, company-specific eligibility checking, skill gap analysis, and domain suitability recommendations.

## Features

### 1. ATS (Applicant Tracking System) Scoring
- **Score Range**: 0-100
- **Components**:
  - Academic Performance (30% weight)
  - Skills Match (35% weight)
  - Project Quality (20% weight)
  - Experience (15% weight)

### 2. Company Eligibility Analysis
- Checks against specific company criteria
- Identifies eligibility issues
- Provides detailed reasons for non-eligibility
- Calculates overall company eligibility percentage

### 3. Skill Gap Analysis
- Identifies missing essential, preferred, and advanced skills
- Provides targeted recommendations
- Calculates skill match percentage

### 4. Domain Suitability
- Recommends suitable job domains based on skills and experience
- Provides suitability scores for each domain
- Suggests alternative career paths

## Usage Example

```javascript
import { generatePlacementEligibilityAnalysis } from '../utils/placementEligibilityAnalyzer';

// Example parsed resume data
const parsedResumeData = {
  tenthPercentage: 85,
  twelfthPercentage: 78,
  collegeCGPA: 7.5,
  selectedSkills: ['Java', 'Python', 'SQL', 'React', 'Git'],
  projects: [
    {
      title: 'E-commerce Website',
      description: 'Full-stack web application with React frontend and Node.js backend'
    },
    {
      title: 'Data Analysis Dashboard',
      description: 'Python-based dashboard using Pandas and Matplotlib'
    }
  ],
  hackathonsParticipated: true,
  numHackathons: 2,
  hackathonWinner: 'no',
  internshipsCompleted: true,
  numInternships: 1
};

// Generate comprehensive analysis
const analysis = generatePlacementEligibilityAnalysis(parsedResumeData, 'Software Development');

console.log('ATS Score:', analysis.atsScore);
console.log('Eligibility:', analysis.eligibility);
console.log('Missing Skills:', analysis.missingSkills);
console.log('Recommendations:', analysis.recommendations);
console.log('Suggested Domains:', analysis.suggestedDomains);
console.log('Company Eligibility %:', analysis.companyEligibilityPercentage);
```

## Output Format

The system provides a structured output with the following components:

### 1. ATS Score
- **Format**: XX/100
- **Description**: Overall applicant tracking system score

### 2. Eligibility Status
- **Values**: "Eligible" or "Ineligible"
- **Explanation**: Detailed message about eligibility status

### 3. Missing Skills & Recommendations
- **Essential Skills**: Critical skills required for the domain
- **Preferred Skills**: Skills that enhance candidacy
- **Advanced Skills**: Specialized skills for senior roles
- **Recommendations**: Actionable suggestions for improvement

### 4. Suggested Domains
- **List**: Array of suitable job domains
- **Based on**: Current skills and experience

### 5. Company Eligibility Percentage
- **Format**: XX%
- **Description**: Percentage of companies the candidate is eligible for

### 6. Company Restrictions
- **List**: Companies with eligibility issues
- **Reasons**: Specific criteria not met

## Company Criteria

The system includes criteria for major companies:

### Tier 1 Companies (High Requirements)
- **TCS, Infosys, Wipro, HCL, Cognizant**: 60% in 10th/12th, 6.0 CGPA
- **Accenture**: 65% in 10th/12th, 6.5 CGPA
- **Microsoft, Amazon**: 70% in 10th/12th, 7.0 CGPA
- **Google**: 75% in 10th/12th, 7.5 CGPA

### Tier 2 Companies (Medium-High Requirements)
- **IBM, Oracle**: 65% in 10th/12th, 6.5 CGPA
- **Capgemini, Tech Mahindra**: 55% in 10th/12th, 5.5 CGPA

### Tier 3 Companies (Medium Requirements)
- **Startups**: 50% in 10th/12th, 5.0 CGPA
- **Product Companies**: 60% in 10th/12th, 6.0 CGPA

## Domain-Specific Requirements

### Software Development
- **Essential**: Java, Python, JavaScript, SQL
- **Preferred**: React, Node.js, Git, Docker, AWS
- **Advanced**: Microservices, Kubernetes, CI/CD, Agile

### Data Science
- **Essential**: Python, SQL, Statistics, Mathematics
- **Preferred**: Pandas, NumPy, Scikit-learn, Power BI, Tableau
- **Advanced**: TensorFlow, PyTorch, Deep Learning, NLP, Computer Vision

### DevOps
- **Essential**: Linux, Docker, Git
- **Preferred**: Kubernetes, AWS, Jenkins, CI/CD
- **Advanced**: Terraform, Ansible, Monitoring, Microservices

## Integration with UI

The system is integrated with the PredictionResult component to display:

1. **ATS Score Card**: Visual representation with progress bar
2. **Eligibility Status**: Clear eligibility indication
3. **Missing Skills Section**: Categorized skill gaps
4. **Recommendations**: Actionable improvement suggestions
5. **Suggested Domains**: Alternative career paths
6. **Company Restrictions**: Detailed eligibility issues

## Customization

The system can be customized by:

1. **Adding New Companies**: Update `COMPANY_CRITERIA` object
2. **Modifying Domain Requirements**: Update `DOMAIN_SKILL_REQUIREMENTS`
3. **Adjusting Skill Weights**: Modify `SKILL_WEIGHTS` object
4. **Changing Scoring Algorithm**: Update scoring functions

## Benefits

1. **Comprehensive Analysis**: Multi-dimensional evaluation
2. **Actionable Insights**: Specific recommendations for improvement
3. **Company-Specific**: Tailored eligibility checking
4. **Domain-Aware**: Context-sensitive skill analysis
5. **Visual Presentation**: Clear, user-friendly interface
6. **Extensible**: Easy to add new companies and domains

This system provides candidates with detailed, actionable insights to improve their placement prospects and make informed career decisions.

# Candidate Evaluation and Job Recommendation System

## Overview
This system evaluates early-career job seekers based on their academic performance, skills, projects, hackathon participation, and internship experience. It provides a comprehensive scoring system and recommends relevant job domains and roles based on actual experience.

## Features

### 1. Academic Score Calculation
- Uses trained ML model for 10th, 12th, and CGPA scoring
- 40% weight in final candidate score

### 2. Skills Evaluation
- Evaluates skills based on professional domain relevance
- Only counts skills that are directly relevant to recognized professional domains
- 30% weight in final candidate score

### 3. Project Assessment
- Filters out basic/tutorial projects using comprehensive BASIC PROJECT LIST
- Only awards points for non-basic, innovative projects
- 20% weight in final candidate score

### 4. Experience Scoring
- Hackathon participation and awards
- Internship experience
- 10% weight in final candidate score

## BASIC PROJECT LIST

The system automatically identifies and filters out basic projects that don't add value to the candidate's score:

### Data Science/ML
- Titanic survival prediction, MNIST digit classification, Iris dataset analysis
- House price prediction with linear regression, Basic EDA projects
- Spam/Ham email classifier, Sentiment analysis on tweets
- Simple chatbot, Stock price prediction (standard approach)

### Software Development
- To-do app, Personal blog, Weather app, CRUD demo app
- Static landing page, Calculator, Simple chat app
- Dockerized hello world

### Mechanical Engineering
- 2D/3D component modeling (nut/bolt/bracket)
- Basic mechanism design, Static beam/plate FEA
- Basic HVAC duct design, CAD assembly

### And many more categories...

## Job Domain Recommendations

The system recommends 2-4 most relevant job domains based on:
- Candidate's actual skills (not generic suggestions)
- Non-basic project experience
- Relevant hackathon and internship experience
- Educational background

### Supported Job Domains
- Software Development
- Data Science & Analytics
- AI/ML
- DevOps & Cloud
- Mechanical Engineering
- Electrical Engineering
- Business & Management
- Cybersecurity
- Game Development

## Usage

### Frontend Integration
```javascript
import { evaluateCandidate } from '../utils/candidateEvaluator';

const evaluation = evaluateCandidate(candidateData);
console.log('Candidate Score:', evaluation.candidateScore);
console.log('Job Domains:', evaluation.jobDomainsAndRoles);
```

### API Endpoints
- `POST /api/predict/ml` - ML-based academic scoring
- `POST /api/parse-resume` - Resume parsing and auto-fill

## Scoring Algorithm

```
Total Score = (Academic Score × 0.4) + (Skill Score × 0.3) + (Project Score × 0.2) + (Experience Score × 0.1)
```

Where:
- **Academic Score**: ML model prediction based on 10th, 12th, CGPA
- **Skill Score**: Percentage of relevant professional skills
- **Project Score**: Percentage of non-basic projects
- **Experience Score**: Combined hackathon and internship scores

## Key Principles

1. **Evidence-Based**: Only evaluates and recommends based on provided input
2. **No Generic Suggestions**: Never suggests skills or projects not mentioned by candidate
3. **Relevance-First**: Job recommendations are based on actual relevant experience
4. **Quality Over Quantity**: Basic projects don't add points; only innovative work counts
5. **Domain-Specific**: Recommendations are tailored to candidate's actual background

## File Structure

```
src/
├── utils/
│   └── candidateEvaluator.js    # Core evaluation logic
├── pages/
│   ├── PredictionForm.js        # Data collection form
│   └── PredictionResult.js      # Results display
└── data/
    └── domainData.js            # Domain and skill mappings
```

## Example Output

```json
{
  "candidateScore": 78,
  "scoreBreakdown": {
    "academic": 85,
    "skills": 80,
    "projects": 70,
    "experience": 65
  },
  "jobDomainsAndRoles": [
    {
      "domain": "Software Development",
      "roles": ["Full Stack Developer", "Backend Developer", "Software Engineer"]
    },
    {
      "domain": "Data Science & Analytics",
      "roles": ["Data Analyst", "Business Intelligence Analyst"]
    }
  ]
}
```

## Technical Notes

- Built with React and modern JavaScript
- Integrates with Flask backend for ML predictions
- Uses comprehensive skill-to-domain mapping
- Implements intelligent project filtering
- Provides detailed scoring breakdowns
- Supports resume parsing and auto-fill

## Future Enhancements

- Industry-specific scoring adjustments
- Real-time market demand integration
- Advanced project complexity analysis
- Skill gap analysis and learning paths
- Company-specific role matching

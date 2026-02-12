import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, User, CreditCard, BarChart3, FileText, Shield, HelpCircle, BookOpen, Bot } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

const faqData = {
  account: {
    title: 'Account & Registration',
    icon: User,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click on "Sign Up" in the navigation bar, enter your details (name, email, phone, password), and verify your email. You can then log in and access all features.'
      },
      {
        q: 'Do I need an account to use PlacementAI?',
        a: 'Some features like predictions and ATS scoring are available without an account. However, to save your results, take skill tests, access your dashboard, and get personalized roadmaps, you need to sign up.'
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the sign-in page, enter your registered email, and follow the reset link sent to your inbox.'
      },
      {
        q: 'Can I change my registered email or phone number?',
        a: 'Yes. Go to your Profile page after logging in. You can update your email, phone, and other details from there.'
      }
    ]
  },
  profile: {
    title: 'Profile & Data',
    icon: FileText,
    questions: [
      {
        q: 'What information is stored in my profile?',
        a: 'Your profile includes personal details (name, email, phone), academic information (CGPA, degree, specialization), skill test results, resume analysis history, and personalized roadmaps.'
      },
      {
        q: 'How do I update my profile information?',
        a: 'Navigate to the Profile page from the dashboard. You can edit your academic details, skills, and preferences at any time.'
      },
      {
        q: 'Can I delete my account and data?',
        a: 'Yes. Contact us at contact@placementai.com with your registered email to request account deletion. All your data will be permanently removed within 7 days.'
      },
      {
        q: 'Is my resume stored on your servers?',
        a: 'Resumes are processed for analysis but not permanently stored. We extract relevant information and discard the original file after processing.'
      }
    ]
  },
  analysis: {
    title: 'Analysis & Predictions',
    icon: BarChart3,
    questions: [
      {
        q: 'How does the placement prediction work?',
        a: 'Our AI model analyzes your academic performance, skills, projects, certifications, and other factors to predict your placement probability. The model is trained on historical placement data from various institutions.'
      },
      {
        q: 'How accurate are the predictions?',
        a: 'Accuracy depends on the completeness of your profile. On average, our predictions have 75-85% accuracy. Use them as guidance alongside your own preparation efforts.'
      },
      {
        q: 'What is ATS Score analysis?',
        a: 'ATS (Applicant Tracking System) Score measures how well your resume matches job requirements. We scan your resume against industry standards and provide a score out of 100 with improvement suggestions.'
      },
      {
        q: 'Why is my prediction score low?',
        a: 'Low scores may indicate gaps in skills, projects, or certifications relevant to your target role. Check the detailed breakdown and recommendations to identify areas for improvement.'
      },
      {
        q: 'Can I get predictions for multiple domains?',
        a: 'Yes! You can run predictions for different career domains (IT, Finance, Core Engineering, etc.) to compare your readiness across fields.'
      }
    ]
  },
  tests: {
    title: 'Skill Tests & Assessments',
    icon: BookOpen,
    questions: [
      {
        q: 'What are Skill Tests?',
        a: 'Skill Tests are timed assessments covering domain-specific topics like DSA, Web Development, Machine Learning, etc. They help evaluate your knowledge and identify strengths and weaknesses.'
      },
      {
        q: 'How long do skill tests take?',
        a: 'Most tests are 15-30 minutes with 10-25 questions. The timer is displayed during the test, and you can submit early if finished.'
      },
      {
        q: 'Can I retake a skill test?',
        a: 'Yes, you can retake tests after a cooldown period (usually 24 hours). Your best score is saved to your profile.'
      },
      {
        q: 'How are test scores calculated?',
        a: 'Scores are based on correct answers, with some tests including partial credit for partially correct responses. Results show overall score, topic-wise breakdown, and time taken.'
      },
      {
        q: 'Do test results affect my predictions?',
        a: 'Yes. Strong test performance can positively influence your placement predictions and personalized recommendations.'
      }
    ]
  },
  roadmap: {
    title: 'Roadmaps & AI Chat',
    icon: Bot,
    questions: [
      {
        q: 'What is the personalized roadmap?',
        a: 'Based on your profile, test results, and target role, we generate a week-by-week study plan with resources, milestones, and focus areas to help you prepare systematically.'
      },
      {
        q: 'How does the AI Chatbot help me?',
        a: 'The AI Chatbot answers career-related questions, explains concepts, suggests resources, and provides guidance on your preparation journey. It remembers context within a session for personalized responses.'
      },
      {
        q: 'Can I customize my roadmap?',
        a: 'Currently, roadmaps are auto-generated based on your profile. We are working on allowing manual customization and goal-setting in future updates.'
      }
    ]
  },
  privacy: {
    title: 'Privacy & Security',
    icon: Shield,
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard encryption for data transmission (HTTPS) and storage. Passwords are hashed and never stored in plain text.'
      },
      {
        q: 'Do you share my data with third parties?',
        a: 'No. Your personal data is never sold or shared with third parties. We may use anonymized, aggregated data for improving our models.'
      },
      {
        q: 'What data do you collect?',
        a: 'We collect information you provide (name, email, phone, academic details) and usage data (pages visited, features used) to improve the platform. See our Privacy Policy for full details.'
      }
    ]
  },
  general: {
    title: 'General & Support',
    icon: HelpCircle,
    questions: [
      {
        q: 'Is PlacementAI free to use?',
        a: 'Core features like predictions, ATS scoring, and skill tests are free. Premium features (if any) will be clearly marked with pricing.'
      },
      {
        q: 'Why is the Domains page showing "Coming Soon"?',
        a: 'We are enhancing the domain selection experience with more detailed career paths. The feature will be available soon with improved functionality.'
      },
      {
        q: 'How can I report a bug or give feedback?',
        a: 'Use the Feedback form in the footer or email contact@placementai.com. Include screenshots and steps to reproduce the issue for faster resolution.'
      },
      {
        q: 'Which browsers are supported?',
        a: 'PlacementAI works best on modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). Mobile browsers are also supported.'
      }
    ]
  }
};

const FAQItem = ({ question, answer, isOpen, onClick, themeClasses }) => (
  <div className={`border-b ${themeClasses.border} last:border-b-0`}>
    <button
      onClick={onClick}
      className={`w-full py-4 flex items-center justify-between text-left ${themeClasses.hover} transition-colors px-4 -mx-4`}
    >
      <span className={`font-medium ${themeClasses.textPrimary} pr-4`}>{question}</span>
      {isOpen ? (
        <ChevronUp className={`w-5 h-5 ${themeClasses.accentText} flex-shrink-0`} />
      ) : (
        <ChevronDown className={`w-5 h-5 ${themeClasses.textMuted} flex-shrink-0`} />
      )}
    </button>
    {isOpen && (
      <div className="pb-4 px-4 -mx-4">
        <p className={`${themeClasses.textSecondary} leading-relaxed`}>{answer}</p>
      </div>
    )}
  </div>
);

const FAQ = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [openItems, setOpenItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const toggleItem = (categoryKey, index) => {
    const key = `${categoryKey}-${index}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = Object.entries(faqData);
  const totalQuestions = categories.reduce((sum, [, cat]) => sum + cat.questions.length, 0);

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.cardBackground} border-b ${themeClasses.border}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <div className="text-center">
            <h1 className={`text-3xl md:text-4xl font-bold ${themeClasses.textPrimary}`}>
              Frequently Asked Questions
            </h1>
            <p className={`mt-3 text-lg ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
              Find answers to common questions about PlacementAI. Browse by category or search for specific topics.
            </p>
            <p className={`mt-2 text-sm ${themeClasses.textMuted}`}>
              {totalQuestions} questions across {categories.length} categories
            </p>
          </div>

          {/* Category Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? themeClasses.buttonPrimary
                  : themeClasses.buttonSecondary
              }`}
            >
              All Questions
            </button>
            {categories.map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeCategory === key
                      ? themeClasses.buttonPrimary
                      : themeClasses.buttonSecondary
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {categories
            .filter(([key]) => activeCategory === 'all' || activeCategory === key)
            .map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className={`${themeClasses.cardBackground} rounded-xl shadow-sm border ${themeClasses.border} overflow-hidden`}>
                  <div className={`${themeClasses.cardHover} px-6 py-4 border-b ${themeClasses.border}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${themeClasses.accent} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${themeClasses.accentText}`} />
                      </div>
                      <div>
                        <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>{category.title}</h2>
                        <p className={`text-sm ${themeClasses.textMuted}`}>{category.questions.length} questions</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-2">
                    {category.questions.map((item, idx) => (
                      <FAQItem
                        key={idx}
                        question={item.q}
                        answer={item.a}
                        isOpen={openItems[`${key}-${idx}`]}
                        onClick={() => toggleItem(key, idx)}
                        themeClasses={themeClasses}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Contact Section */}
        <div className={`mt-12 ${themeClasses.gradient} rounded-2xl p-8 text-center text-white`}>
          <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
          <p className="text-amber-100 mb-6">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/feedback"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Send Feedback
            </Link>
            <a
              href="mailto:contact@placementai.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 dark:from-pink-600 dark:to-purple-600 text-white font-medium rounded-lg hover:bg-primary-400 transition-colors"
            >
              Email Support
            </a>
          </div>
        </div>

        {/* Need Further Help Section */}
        <div className={`mt-8 ${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.border} text-center`}>
          <h4 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>Need further help?</h4>
          <p className={`${themeClasses.textSecondary} mb-4`}>
            If your issue requires detailed assistance, you can raise a support ticket.
          </p>
          <button
            disabled
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-300 dark:bg-gray-600 text-amber-600 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed opacity-60"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Raise a Ticket
            <span className="ml-2 text-xs bg-gray-400 dark:bg-gray-500 text-white px-2 py-0.5 rounded-full">Coming Soon</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/about" className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.border} hover:shadow-md transition-shadow text-center`}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className={`font-semibold ${themeClasses.textPrimary}`}>About Us</h4>
            <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Learn more about PlacementAI</p>
          </Link>
          <Link to="/chatbot" className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.border} hover:shadow-md transition-shadow text-center`}>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className={`font-semibold ${themeClasses.textPrimary}`}>AI Chatbot</h4>
            <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Get instant answers</p>
          </Link>
          <Link to="/predict" className={`${themeClasses.cardBackground} rounded-xl p-6 border ${themeClasses.border} hover:shadow-md transition-shadow text-center`}>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className={`font-semibold ${themeClasses.textPrimary}`}>Get Predictions</h4>
            <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Start your analysis</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

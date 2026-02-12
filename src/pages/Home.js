import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Target, Zap, Check } from 'lucide-react';
import './Home.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';
// Attempt to import react-countup; if unavailable, provide a fallback component.
let CountUp;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  CountUp = require('react-countup').default; // dynamic require to avoid build failure if missing
} catch (e) {
  CountUp = ({ end }) => <span>{end}</span>;
}

const Home = () => {
  const [inView, setInView] = useState(false);
  const statsRef = useRef(null);
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Stop observing once it's in view
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the section is visible
      }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  // Helper to get root and section classes for theme
  const getRootClass = () => {
    if (theme === 'aloof') return 'aloof-root';
    if (theme === 'aurora') return 'aurora-root';
    if (theme === 'solaris') return 'solaris-root';
    return '';
  };
  const getSectionClass = () => {
    if (theme === 'aloof') return 'aloof-section relative min-h-screen flex items-center justify-center overflow-hidden pt-16';
    if (theme === 'aurora') return 'aurora-section relative min-h-screen flex items-center justify-center overflow-hidden pt-16';
    if (theme === 'solaris') return 'solaris-section relative min-h-screen flex items-center justify-center overflow-hidden pt-16';
    return `relative min-h-screen flex items-center justify-center overflow-hidden ${themeClasses.pageBackground} pt-16`;
  };

  return (
    <div className={`${getRootClass()} ${themeClasses.pageBackground} transition-colors duration-300 -mt-16`}>

      {/* Hero Section - Modern Clean Design */}
      <section className={getSectionClass()}>
        {/* Modern Gradient Background with Blur Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Base gradient layer */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: theme === 'light' 
                ? 'radial-gradient(circle at 20% 30%, rgba(251, 146, 60, 0.10) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.10) 0%, transparent 50%)'
                : theme === 'dark'
                ? 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)'
                : theme === 'midnight'
                ? 'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(14, 165, 233, 0.12) 0%, transparent 50%)'
                : theme === 'aurora'
                ? 'radial-gradient(circle at 20% 30%, rgba(167, 139, 250, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)'
                : theme === 'solaris'
                ? 'radial-gradient(circle at 20% 30%, rgba(251, 146, 60, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(249, 115, 22, 0.12) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 30%, rgba(251, 146, 60, 0.10) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.10) 0%, transparent 50%)'
            }}
          />
          
          {/* Animated gradient orbs with blur - Modern and minimal */}
          {theme !== 'aloof' && (
            <>
              {/* Top left orb */}
              <div 
                className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-40 blur-[120px] animate-float"
                style={{ 
                  background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.45), rgba(252, 211, 77, 0.35))'
                    : theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.4))'
                    : theme === 'midnight'
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(14, 165, 233, 0.4))'
                    : theme === 'aurora'
                    ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.5), rgba(59, 130, 246, 0.4))'
                    : theme === 'solaris'
                    ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.5), rgba(249, 115, 22, 0.4))'
                    : 'linear-gradient(135deg, rgba(251, 146, 60, 0.45), rgba(252, 211, 77, 0.35))',
                  animationDuration: '20s'
                }}
              />
              
              {/* Bottom right orb */}
              <div 
                className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] rounded-full opacity-35 blur-[140px] animate-float"
                style={{ 
                  background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(251, 113, 133, 0.35), rgba(249, 115, 22, 0.4))'
                    : theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.45))'
                    : theme === 'midnight'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.4))'
                    : theme === 'aurora'
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(236, 72, 153, 0.4))'
                    : theme === 'solaris'
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4), rgba(251, 146, 60, 0.4))'
                    : 'linear-gradient(135deg, rgba(251, 113, 133, 0.35), rgba(249, 115, 22, 0.4))',
                  animationDelay: '2s',
                  animationDuration: '25s'
                }}
              />
              
              {/* Center accent orb */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full opacity-20 blur-[160px] animate-pulse-soft"
                style={{ 
                  background: theme === 'light'
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.28), rgba(253, 224, 71, 0.22))'
                    : theme === 'dark'
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.3))'
                    : theme === 'midnight'
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.3), rgba(6, 182, 212, 0.25))'
                    : theme === 'aurora'
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(167, 139, 250, 0.25))'
                    : theme === 'solaris'
                    ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(253, 186, 116, 0.25))'
                    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.28), rgba(253, 224, 71, 0.22))',
                  animationDuration: '15s'
                }}
              />
            </>
          )}
          
          {/* Minimal decorative dots - Only 3 subtle ones */}
          {theme !== 'aloof' && (
            <>
              <div className={`absolute top-20 right-20 w-2 h-2 rounded-full animate-pulse ${theme === 'light' ? 'bg-amber-400/30' : 'bg-indigo-400/40'}`} style={{ animationDuration: '3s' }} />
              <div className={`absolute bottom-32 left-1/4 w-2 h-2 rounded-full animate-pulse ${theme === 'light' ? 'bg-orange-400/30' : 'bg-purple-400/40'}`} style={{ animationDelay: '1s', animationDuration: '3s' }} />
              <div className={`absolute top-1/3 right-1/3 w-2 h-2 rounded-full animate-pulse ${theme === 'light' ? 'bg-rose-400/30' : 'bg-pink-400/40'}`} style={{ animationDelay: '2s', animationDuration: '3s' }} />
            </>
          )}
          
          {/* Subtle grid overlay - very faint */}
          {theme !== 'aloof' && (
            <div 
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" 
              style={{
                backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                backgroundSize: '80px 80px'
              }}
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
          <div className="text-center">
            {/* Badge - Light Theme */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${themeClasses.cardBackground} backdrop-blur-md border ${themeClasses.border} rounded-full ${themeClasses.accent} text-sm font-semibold mb-8 animate-fade-in shadow-sm`}>
              <Sparkles className="w-4 h-4" />
              AI-Powered Career Intelligence
            </div>

            {/* Main Headline - Light Theme */}
            <h1 className={`text-6xl md:text-7xl lg:text-8xl font-bold ${themeClasses.textPrimary} mb-6 leading-tight animate-slide-up`}>
              Map Your Career Path
              <br />
              <span className={`${theme === 'aloof' ? 'aloof-accent-text' : theme === 'solaris' ? 'text-[#c23408] font-extrabold' : `${themeClasses.gradient} bg-clip-text text-transparent`} animate-gradient-shift bg-200`}>
                with AI!
              </span>
            </h1>

            {/* Subheadline - Light Theme */}
            <p className={`${theme === 'aloof' ? 'aloof-text-secondary' : themeClasses.textSecondary} text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up`} style={{ animationDelay: '0.1s' }}>
              Get personalized placement insights, domain-wise suggestions, and actionable feedback to improve your chances.
            </p>

            {/* CTA Buttons - Light Theme */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link 
                to="/predict" 
                className={`group px-8 py-4 ${theme === 'aloof' ? 'aloof-cta-primary' : `${themeClasses.buttonPrimary}`} font-semibold rounded-xl shadow-lg hover:shadow-xl dark:shadow-glow dark:hover:shadow-glow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2`}
              >
                Start Free Analysis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/domains" 
                className={`px-8 py-4 ${theme === 'aloof' ? 'aloof-cta-secondary' : `${themeClasses.cardBackground} backdrop-blur-md border-2 ${themeClasses.border} ${themeClasses.hover} ${themeClasses.textPrimary}`} font-semibold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-sm hover:shadow-md`}>
                Explore Domains
              </Link>
            </div>

            {/* Stats Bar - Light Theme */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className={`text-center p-4 ${themeClasses.cardBackground} backdrop-blur-sm rounded-xl border ${themeClasses.border}`}>
                <div className={`${theme === 'aloof' ? 'aloof-stat-number text-3xl font-bold' : theme === 'solaris' ? 'text-3xl font-bold text-[#c23408]' : `text-3xl font-bold ${themeClasses.gradient} bg-clip-text text-transparent`} mb-1`}>0</div>
                <div className={`text-sm ${themeClasses.textSecondary} font-medium`}>Students Helped</div>
              </div>
              <div className={`text-center p-4 ${themeClasses.cardBackground} backdrop-blur-sm rounded-xl border ${themeClasses.border}`}>
                <div className={`${theme === 'aloof' ? 'aloof-stat-number text-3xl font-bold' : theme === 'solaris' ? 'text-3xl font-bold text-[#c23408]' : `text-3xl font-bold ${themeClasses.gradient} bg-clip-text text-transparent`} mb-1`}>0%</div>
                <div className={`text-sm ${themeClasses.textSecondary} font-medium`}>Accuracy Rate</div>
              </div>
              <div className={`text-center p-4 ${themeClasses.cardBackground} backdrop-blur-sm rounded-xl border ${themeClasses.border}`}>
                <div className={`${theme === 'aloof' ? 'aloof-stat-number text-3xl font-bold' : theme === 'solaris' ? 'text-3xl font-bold text-[#c23408]' : `text-3xl font-bold ${themeClasses.gradient} bg-clip-text text-transparent`} mb-1`}>50+</div>
                <div className={`text-sm ${themeClasses.textSecondary} font-medium`}>Job Roles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-80" style={{ background: `linear-gradient(to top, ${theme === 'light' ? '#fef3c7' : theme === 'dark' ? '#1a1625' : theme === 'solaris' ? '#451a03' : 'transparent'}, transparent)` }}></div>
      </section>
      
      {/* How It Works Section */}
      <section className={`py-32 ${themeClasses.pageBackground} relative transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${themeClasses.cardBackground} ${themeClasses.accent} rounded-full text-sm font-semibold mb-4 border ${themeClasses.border}`}>
              <Zap className="w-4 h-4" />
              SIMPLE PROCESS
            </div>
            <h2 className={`text-5xl md:text-6xl font-bold ${theme === 'aloof' ? 'aloof-accent-text' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-6`}>
              How It Works
            </h2>
            <p className={`text-xl ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
              Get career insights in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className={`hidden md:block absolute top-24 left-0 right-0 h-1 ${themeClasses.gradient} opacity-30`}></div>
            
            {/* Step 1 - Light Theme */}
            <div className="relative group">
              <div className={`${themeClasses.cardBackground} rounded-2xl p-8 shadow-lg hover:shadow-xl dark:shadow-soft dark:hover:shadow-medium transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center ${themeClasses.textPrimary} text-2xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  01
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                  Upload Your Data
                </h3>
                <p className={`${themeClasses.textSecondary} leading-relaxed mb-6`}>
                  Enter your academic details and skills, or simply upload your resume for instant parsing.
                </p>
                <div className={`flex items-center gap-2 ${themeClasses.accent} font-medium`}>
                  <Check className="w-5 h-5" />
                  Resume auto-fill
                </div>
              </div>
            </div>
            
            {/* Step 2 - Light Theme */}
            <div className="relative group">
              <div className={`${themeClasses.cardBackground} rounded-2xl p-8 shadow-lg hover:shadow-xl dark:shadow-soft dark:hover:shadow-medium transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center ${themeClasses.textPrimary} text-2xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  02
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                  AI Analysis
                </h3>
                <p className={`${themeClasses.textSecondary} leading-relaxed mb-6`}>
                  Our advanced machine learning model analyzes your profile against industry standards.
                </p>
                <div className={`flex items-center gap-2 ${themeClasses.accent} font-medium`}>
                  <TrendingUp className="w-5 h-5" />
                  92% accuracy
                </div>
              </div>
            </div>
            
            {/* Step 3 - Light Theme */}
            <div className="relative group">
              <div className={`${themeClasses.cardBackground} rounded-2xl p-8 shadow-lg hover:shadow-xl dark:shadow-soft dark:hover:shadow-medium transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`w-16 h-16 ${themeClasses.gradient} rounded-2xl flex items-center justify-center ${themeClasses.textPrimary} text-2xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  03
                </div>
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-4`}>
                  Get Insights
                </h3>
                <p className={`${themeClasses.textSecondary} leading-relaxed mb-6`}>
                  Receive personalized placement scores, role recommendations, and actionable feedback.
                </p>
                <div className={`flex items-center gap-2 ${themeClasses.accent} font-medium`}>
                  <Target className="w-5 h-5" />
                  Tailored to you
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Domains Section */}
      <section className={`py-32 ${themeClasses.pageBackground} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 px-4 py-2 ${themeClasses.cardBackground} ${themeClasses.accent} rounded-full text-sm font-semibold mb-4 border ${themeClasses.border}`}>
              <Sparkles className="w-4 h-4" />
              CAREER DOMAINS
            </div>
            <h2 className={`text-5xl md:text-6xl font-bold ${theme === 'aloof' ? 'aloof-accent-text' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-6`}>
              Explore Your Path
            </h2>
            <p className={`text-xl ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
              Discover opportunities across diverse career domains
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CS/IT Domain - Light Theme */}
            <Link to="/domains/cs_it" className="group">
              <div className={`${themeClasses.cardBackground} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-soft dark:hover:shadow-large transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`h-2 ${themeClasses.gradient}`}></div>
                <div className="p-8">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${themeClasses.border}`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>CS/IT</h3>
                  <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                    AI/ML, Data Science, Web Dev, Software Engineering
                  </p>
                  <div className={`flex items-center ${themeClasses.accent} font-medium group-hover:gap-2 transition-all`}>
                    Explore <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Engineering Domain - Light Theme */}
            <Link to="/domains/engineering" className="group">
              <div className={`${themeClasses.cardBackground} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-soft dark:hover:shadow-large transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`h-2 ${themeClasses.gradient}`}></div>
                <div className="p-8">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${themeClasses.border}`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>Engineering</h3>
                  <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                    Mechanical, Electrical, Electronics, Core Engineering
                  </p>
                  <div className={`flex items-center ${themeClasses.accent} font-medium group-hover:gap-2 transition-all`}>
                    Explore <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Business Domain - Light Theme */}
            <Link to="/domains/bba" className="group">
              <div className={`${themeClasses.cardBackground} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-soft dark:hover:shadow-large transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`h-2 ${themeClasses.gradient}`}></div>
                <div className="p-8">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${themeClasses.border}`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>Business</h3>
                  <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                    Analytics, HR, Marketing, Finance, Operations
                  </p>
                  <div className={`flex items-center ${themeClasses.accent} font-medium group-hover:gap-2 transition-all`}>
                    Explore <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Other Domains - Light Theme */}
            <Link to="/domains" className="group">
              <div className={`${themeClasses.cardBackground} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-soft dark:hover:shadow-large transition-all duration-300 border-2 ${themeClasses.border} ${themeClasses.cardHover} hover:-translate-y-2`}>
                <div className={`h-2 ${themeClasses.gradient}`}></div>
                <div className="p-8">
                  <div className={`w-14 h-14 ${themeClasses.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border ${themeClasses.border}`}>
                    <svg className={`w-7 h-7 ${themeClasses.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>More Fields</h3>
                  <p className={`${themeClasses.textSecondary} mb-6 leading-relaxed`}>
                    Pharmacy, Agriculture, and specialized domains
                  </p>
                  <div className={`flex items-center ${themeClasses.accent} font-medium group-hover:gap-2 transition-all`}>
                    View All <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section ref={statsRef} className={`py-32 ${theme === 'aloof' ? 'aloof-stats-section' : themeClasses.gradient} relative overflow-hidden`}>
        {/* Matte Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px'
        }}></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: '4rem 4rem'
          }}></div>
          {theme !== 'aloof' && (
            <>
              <div className="absolute top-10 left-10 w-96 h-96 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: 'currentColor' }}></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 opacity-15 rounded-full blur-3xl" style={{ backgroundColor: 'currentColor' }}></div>
            </>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className={`text-5xl md:text-6xl font-bold mb-6 ${theme === 'light' ? 'text-white' : themeClasses.textPrimary}`}>
              Trusted by <span className={theme === 'light' ? 'text-yellow-100 font-extrabold' : `${themeClasses.gradient} bg-clip-text text-transparent`}>Thousands</span>
            </h2>
            <p className={`text-xl ${theme === 'light' ? 'text-orange-50' : themeClasses.textSecondary} max-w-2xl mx-auto`}>
              Join students and institutions who rely on our AI-powered platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className={`${themeClasses.cardBackground} backdrop-blur-md border ${themeClasses.border} rounded-2xl p-8 text-center ${themeClasses.cardHover} transition-all duration-300 hover:scale-105`}>
              <div className={`text-5xl md:text-6xl font-bold ${theme === 'light' ? 'text-orange-600' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-3`}>
                {inView && <CountUp end={0} duration={2.5} separator="," />}
              </div>
              <div className={`text-lg ${theme === 'light' ? 'text-orange-800 font-medium' : themeClasses.textSecondary}`}>Predictions Made</div>
            </div>
            
            <div className={`${themeClasses.cardBackground} backdrop-blur-md border ${themeClasses.border} rounded-2xl p-8 text-center ${themeClasses.cardHover} transition-all duration-300 hover:scale-105`}>
              <div className={`text-5xl md:text-6xl font-bold ${theme === 'light' ? 'text-orange-600' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-3`}>
                {inView && <CountUp end={0} duration={2.5} />}%
              </div>
              <div className={`text-lg ${theme === 'light' ? 'text-orange-800 font-medium' : themeClasses.textSecondary}`}>Accuracy Rate</div>
            </div>
            
            <div className={`${themeClasses.cardBackground} backdrop-blur-md border ${themeClasses.border} rounded-2xl p-8 text-center ${themeClasses.cardHover} transition-all duration-300 hover:scale-105`}>
              <div className={`text-5xl md:text-6xl font-bold ${theme === 'light' ? 'text-orange-600' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-3`}>
                {inView && <CountUp end={9} duration={2.5} />}
              </div>
              <div className={`text-lg ${theme === 'light' ? 'text-orange-800 font-medium' : themeClasses.textSecondary}`}>Career Domains</div>
            </div>
            
            <div className={`${themeClasses.cardBackground} backdrop-blur-md border ${themeClasses.border} rounded-2xl p-8 text-center ${themeClasses.cardHover} transition-all duration-300 hover:scale-105`}>
              <div className={`text-5xl md:text-6xl font-bold ${theme === 'light' ? 'text-orange-600' : `${themeClasses.gradient} bg-clip-text text-transparent`} mb-3`}>
                {inView && <CountUp end={50} duration={2.5} />}+
              </div>
              <div className={`text-lg ${theme === 'light' ? 'text-orange-800 font-medium' : themeClasses.textSecondary}`}>Job Roles</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className={`py-32 ${themeClasses.pageBackground} relative overflow-hidden`}>
        <div className="absolute inset-0">
          {theme !== 'aloof' && (
            <>
              <div className="absolute top-10 right-10 w-96 h-96 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: 'currentColor' }}></div>
              <div className="absolute bottom-10 left-10 w-96 h-96 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: 'currentColor' }}></div>
            </>
          )}
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`${themeClasses.gradient} rounded-3xl p-12 md:p-16 shadow-2xl border ${themeClasses.border} relative overflow-hidden`}>
            {/* Matte Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.12] dark:opacity-[0.06] rounded-3xl" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '150px 150px'
            }}></div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '2rem 2rem'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${themeClasses.cardBackground} backdrop-blur-md border ${theme === 'light' ? 'border-white/40' : themeClasses.border} rounded-full ${theme === 'light' ? 'text-white' : themeClasses.accent} text-sm font-medium mb-8`}>
                <Sparkles className="w-4 h-4" />
                Start Your Journey
              </div>
              
              <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${theme === 'light' ? 'text-white' : themeClasses.textPrimary} mb-6 leading-tight`}>
                Ready to Unlock Your
                <br />
                <span className={theme === 'light' ? 'text-yellow-100 font-extrabold' : `${themeClasses.gradient} bg-clip-text text-transparent`}>
                  Career Potential?
                </span>
              </h2>
              
              <p className={`text-xl ${theme === 'light' ? 'text-orange-50' : themeClasses.textSecondary} mb-10 max-w-2xl mx-auto leading-relaxed`}>
                Join thousands of students who discovered their ideal career path with our AI-powered platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/predict" 
                  className={`group px-10 py-5 ${themeClasses.buttonPrimary} font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/chatbot" 
                  className={`px-10 py-5 ${themeClasses.cardBackground} backdrop-blur-md border-2 ${themeClasses.border} ${themeClasses.hover} ${themeClasses.textPrimary} font-semibold rounded-xl transition-all duration-300 hover:scale-105`}
                >
                  Talk to AI Assistant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

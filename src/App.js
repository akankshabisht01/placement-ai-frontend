import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Context Providers
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastProvider from './components/ui/ToastProvider';

// Pages
import Home from './pages/Home';
import DomainSelection from './pages/DomainSelection';
import PredictionForm from './pages/PredictionForm';
import PredictionResult from './pages/PredictionResult';
import ATS from './pages/ATS';
import ATSScore from './pages/ATSScore';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Register from './pages/Register';
import AuthSelection from './pages/AuthSelection';
import SignIn from './pages/SignIn';
import NotFound from './pages/NotFound';
import CustomerFeedback from './pages/CustomerFeedback';
import ResumeProfileSelection from './pages/ResumeProfileSelection';
import Roadmap from './pages/Roadmap';
import SkillsTest from './pages/SkillsTest';
import WeeklyTest from './pages/WeeklyTest';
import MonthlyTest from './pages/MonthlyTest';
import TestResults from './pages/TestResults';
import TestAnalysisReport from './pages/TestAnalysisReport';
import Plans from './pages/Plans';
import PaymentSuccess from './pages/PaymentSuccess';
import AnuvaadAI from './pages/AnuvaadAI';
import AIInterview from './pages/AIInterview';

// Example Components (for demo purposes)
import ComponentShowcase from './components/examples/ComponentShowcase';
import ModernPredictionFormExample from './components/examples/ModernPredictionFormExample';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Layout wrapper to conditionally show/hide Navbar
const AppLayout = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const shellClass = () => {
    if (theme === 'aloof') return 'page-shell aloof-root aloof-shell';
    if (theme === 'aurora') return 'page-shell aurora-shell';
    if (theme === 'solaris') return 'page-shell solaris-shell';
    if (theme === 'midnight') return 'page-shell midnight-shell';
    if (theme === 'dark') return 'page-shell dark-shell';
    return 'page-shell light-shell';
  };

  const mainClass = () => {
    if (theme === 'aloof') return 'page-main aloof-main';
    if (theme === 'aurora') return 'page-main aurora-main';
    if (theme === 'solaris') return 'page-main solaris-main';
    if (theme === 'midnight') return 'page-main midnight-main';
    if (theme === 'dark') return 'page-main dark-main';
    return 'page-main light-main';
  };
  
  // Hide navbar on test pages
  const hideNavbar = location.pathname === '/skills-test' || location.pathname === '/weekly-test' || location.pathname === '/monthly-test';
  
  return (
    <div className={`${shellClass()} flex flex-col min-h-screen transition-colors duration-300`}>
      {!hideNavbar && <Navbar />}
      
      <main className={`${mainClass()} ${!hideNavbar ? 'pt-16' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/domains" element={<DomainSelection />} />
        <Route path="/predict" element={<PredictionForm />} />
        <Route path="/predict/:domainId" element={<PredictionForm />} />
        <Route path="/result" element={<PredictionResult />} />
        <Route path="/ats" element={<ATS />} />
        <Route path="/ats-score" element={<ATSScore />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/skills-test" element={<ProtectedRoute><SkillsTest /></ProtectedRoute>} />
        <Route path="/weekly-test" element={<ProtectedRoute><WeeklyTest /></ProtectedRoute>} />
        <Route path="/monthly-test" element={<ProtectedRoute><MonthlyTest /></ProtectedRoute>} />
        <Route path="/test-results" element={<ProtectedRoute><TestResults /></ProtectedRoute>} />
        <Route path="/test-analysis" element={<ProtectedRoute><TestAnalysisReport /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/resume-profile-selection" element={<ResumeProfileSelection />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth-selection" element={<AuthSelection />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/feedback" element={<CustomerFeedback />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/anuvaad-ai" element={<AnuvaadAI />} />
        <Route path="/interview" element={<ProtectedRoute><AIInterview /></ProtectedRoute>} />
        
        {/* Modern UI Examples - Remove these routes in production */}
        <Route path="/component-showcase" element={<ComponentShowcase />} />
        <Route path="/modern-form-example" element={<ModernPredictionFormExample />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    
    {!hideNavbar && <Footer />}
  </div>
  );
};

function App() {
  // Mark app as loaded to prevent flash
  React.useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      // Small delay to ensure auth context is initialized
      requestAnimationFrame(() => {
        root.classList.add('loaded');
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastProvider />
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

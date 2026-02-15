import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingWithFacts from '../components/LoadingWithFacts';

const TestAnalysisReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastVariant, setLastVariant] = useState(null);
  const pollRef = useRef(null);

  const getUserMobile = () => {
    const linkedData = localStorage.getItem('linkedResumeData');
    const userData = localStorage.getItem('userData');
    const predictionData = localStorage.getItem('predictionFormData');

    if (linkedData) {
      const parsed = JSON.parse(linkedData);
      return parsed.mobile || parsed.phoneNumber;
    }
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.mobile || parsed.phoneNumber;
    }
    if (predictionData) {
      const parsed = JSON.parse(predictionData);
      return parsed.mobile || parsed.phoneNumber;
    }
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;

    const fetchAnalysis = async () => {
      try {
        const mobile = getUserMobile();
        if (!mobile) {
          setError('Mobile number not found');
          setLoading(false);
          return;
        }

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        // Use specific phone format (clean 10 digits with +91 prefix)
        const clean = mobile.split('').filter(c => /\d/.test(c)).join('');
        const phoneFormat = clean.length === 10 ? `+91 ${clean}` : mobile;
        
        console.log('[TestAnalysisReport] Step 1: Checking if analysis exists in database');
        
        // STEP 1: Check if analysis exists in database
        const url = `${backendUrl}/api/quiz-analysis/${encodeURIComponent(phoneFormat)}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('[TestAnalysisReport] ✅ Analysis found in database');
            setAnalysis(result.data);
            setLoading(false);
            // Redirect to Progress Tracking after short delay to show success
            setTimeout(() => {
              navigate('/dashboard?section=progress');
            }, 1500);
            return;
          }
        }
        
        // STEP 2: Analysis not found, trigger webhook to generate it
        console.log('[TestAnalysisReport] ❌ Analysis not found, triggering webhook');
        setGenerating(true);
        
        try {
          await fetch(`${backendUrl}/api/notify-answer-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: phoneFormat, action: 'analysis_request' })
          });
          console.log('[TestAnalysisReport] 📤 Webhook triggered successfully');
        } catch (webhookErr) {
          console.error('[TestAnalysisReport] Webhook trigger failed:', webhookErr);
        }
        
        // STEP 3: Wait 10 seconds then check database
        console.log('[TestAnalysisReport] ⏳ Waiting 10 seconds before checking database');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        if (cancelled) return;
        
        console.log('[TestAnalysisReport] 🔍 Checking database after 10 seconds');
        const checkResponse = await fetch(url);
        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          if (checkResult.success && checkResult.data) {
            console.log('[TestAnalysisReport] ✅ Analysis found after 10 seconds');
            setAnalysis(checkResult.data);
            setGenerating(false);
            setLoading(false);
            return;
          }
        }
        
        // STEP 4: Poll every 5 seconds for 8 attempts
        console.log('[TestAnalysisReport] 🔄 Starting polling (8 attempts, 5 seconds interval)');
        let attempts = 0;
        const maxAttempts = 8;
        
        pollInterval = setInterval(async () => {
          if (cancelled) {
            clearInterval(pollInterval);
            return;
          }
          
          attempts++;
          console.log(`[TestAnalysisReport] Polling attempt ${attempts}/${maxAttempts}`);
          
          try {
            const pollResponse = await fetch(url);
            if (pollResponse.ok) {
              const pollResult = await pollResponse.json();
              if (pollResult.success && pollResult.data) {
                console.log(`[TestAnalysisReport] ✅ Analysis found on attempt ${attempts}`);
                setAnalysis(pollResult.data);
                setGenerating(false);
                setLoading(false);
                clearInterval(pollInterval);
                // Redirect to Progress Tracking after short delay
                setTimeout(() => {
                  navigate('/dashboard?section=progress');
                }, 1500);
                return;
              }
            }
          } catch (pollErr) {
            console.error(`[TestAnalysisReport] Polling attempt ${attempts} failed:`, pollErr);
          }
          
          if (attempts >= maxAttempts) {
            console.log('[TestAnalysisReport] ❌ Max polling attempts reached, no analysis found');
            setGenerating(false);
            setNotFound(true);
            setLoading(false);
            clearInterval(pollInterval);
          }
        }, 5000);
        
      } catch (err) {
        console.error('[TestAnalysisReport] Error:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load analysis');
          setLoading(false);
          setGenerating(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      cancelled = true;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  if (generating) return (
    <LoadingWithFacts
      title="Generating Skills Test Analysis Report"
      subtitle="Our AI is analyzing your test performance and creating a detailed report..."
      context="resume_analysis"
      showAfterDelay={0}
      minDisplayTime={3000}
    />
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading analysis report...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]">
      <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-white">Error</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
  <button onClick={() => navigate('/dashboard?section=skilltest')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Back</button>
      </div>
    </div>
  );

  if (notFound || !analysis) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625]">
      <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-white">Report Not Available</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">No analysis found for your account. Take the skills test to generate an analysis.</p>
  <div className="flex gap-4 justify-center">
    <button onClick={() => navigate('/skills-test')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Take Skills Test</button>
    <button onClick={() => navigate('/dashboard?section=skilltest')} className="px-6 py-3 bg-white dark:bg-[#2d1f3d] text-gray-800 dark:text-white border dark:border-pink-500/20 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d1f3d] transition-colors">Back</button>
  </div>
      </div>
    </div>
  );

  // Map fields from analysis document
  const overall = analysis.overallPerformance || analysis.overall_performance || {};
  const skillAnalysis = analysis.skillAnalysis || analysis.skill_analysis || analysis.skill_performance || [];

  const scorePercentage = overall.scorePercentage || overall.score_percentage || overall.score || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl p-8 mb-6 text-center">
          <h2 className="text-3xl font-bold text-amber-900 dark:text-white">Test Analysis Report</h2>
          <p className="text-gray-600 dark:text-gray-300">Detailed skill-level analysis generated by our AI workflows</p>
        </div>

        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-amber-600 dark:text-pink-400">{scorePercentage}%</div>
            <div className="text-sm text-amber-700 dark:text-gray-300 mt-2">Overall Score</div>
            {analysis.summary && <p className="text-gray-500 dark:text-gray-400 mt-3">{analysis.summary}</p>}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-amber-900 dark:text-white">Skill-wise Analysis</h3>
            <div className="space-y-4">
              {skillAnalysis.map((s, i) => (
                <div key={i} className="p-4 border dark:border-pink-500/20 rounded-lg bg-amber-50 dark:bg-[#2d1f3d]/50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-amber-900 dark:text-white">{s.skill || s.name || s.topic || 'General'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{s.score || s.percentage || s.percentageScore || ''}%</div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-pink-500/20 rounded-full h-3 mb-2">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full" style={{ width: `${s.score || s.percentage || s.percentageScore || 0}%` }}></div>
                  </div>
                  {s.missingTopics && s.missingTopics.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-amber-900 dark:text-white">Missing Topics</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {s.missingTopics.map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                  {s.feedback && (
                    <div className="mt-2 text-sm">
                      <div className="font-semibold text-amber-900 dark:text-white">Feedback</div>
                      <div className="text-gray-600 dark:text-gray-300">{s.feedback}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={() => navigate('/dashboard?section=skilltest')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Back to Dashboard</button>
            <button onClick={() => window.print()} className="px-6 py-3 bg-white dark:bg-[#2d1f3d] border dark:border-pink-500/20 text-gray-800 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-[#2d1f3d] transition-colors">Print Report</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAnalysisReport;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const StudentTestPage = () => {
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    const sessionData = sessionStorage.getItem('studentTestSession');
    if (!sessionData) {
      navigate('/student-test');
      return;
    }
    
    const data = JSON.parse(sessionData);
    setTestData(data);
    setTimeLeft(data.test.durationMinutes * 60);
    
    // Load any saved answers
    if (data.studentTest.answers) {
      setAnswers(data.studentTest.answers);
    }
    
    // Prevent back navigation
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, [navigate]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Sync time with server periodically
  useEffect(() => {
    if (!testData) return;
    
    const syncTime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/placement-test/student/check-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: testData.studentTest.sessionToken })
        });
        const data = await response.json();
        if (data.success && data.remainingSeconds !== undefined) {
          setTimeLeft(data.remainingSeconds);
          if (data.expired) {
            handleSubmit(true);
          }
        }
      } catch (err) {
        console.error('Time sync error:', err);
      }
    };
    
    const interval = setInterval(syncTime, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, [testData]);

  const saveAnswer = async (questionNumber, option) => {
    if (!testData) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/placement-test/student/save-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: testData.studentTest.sessionToken,
          questionNumber,
          selectedOption: option
        })
      });
    } catch (err) {
      console.error('Save answer error:', err);
    }
  };

  const handleAnswerSelect = (option) => {
    const questionNum = testData.test.questions[currentQuestion].questionNumber;
    const newAnswers = { ...answers, [questionNum]: option };
    setAnswers(newAnswers);
    saveAnswer(questionNum, option);
  };

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (submitting) return;
    
    setSubmitting(true);
    setShowSubmitDialog(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/placement-test/student/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: testData.studentTest.sessionToken,
          answers
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store result and navigate
        sessionStorage.setItem('testResult', JSON.stringify({
          ...data.result,
          resultHidden: !!data.resultHidden,
          name: testData.studentTest.name,
          rollNumber: testData.studentTest.rollNumber,
          testCode: testData.studentTest.testCode,
          autoSubmitted: isAutoSubmit
        }));
        sessionStorage.removeItem('studentTestSession');
        navigate('/student-test/submitted');
      } else {
        alert(data.message || 'Submission failed');
        setSubmitting(false);
      }
    } catch (err) {
      alert('Network error. Your answers are saved. Please try again.');
      setSubmitting(false);
    }
  }, [answers, testData, submitting, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const questions = testData.test.questions;
  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const isTimeWarning = timeLeft <= 300; // 5 minutes
  const isTimeCritical = timeLeft <= 60; // 1 minute

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Timer */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-800">{testData.test.testType || 'Test'}</h1>
            <p className="text-sm text-gray-500">{testData.studentTest.name}</p>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            isTimeCritical ? 'bg-red-100 text-red-700 animate-pulse' :
            isTimeWarning ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
          
          <button
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Question Panel */}
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              {/* Question Header */}
              <div className="flex justify-between items-center mb-6">
                <span className="bg-blue-100 text-blue-700 font-medium px-4 py-2 rounded-full">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-gray-500 text-sm">
                  {question.marks || 1} mark{(question.marks || 1) > 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Question Text */}
              <h2 className="text-xl text-gray-800 font-medium mb-8">
                {question.questionText}
              </h2>
              
              {/* Options */}
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-4 ${
                      answers[question.questionNumber] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      answers[question.questionNumber] === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className={answers[question.questionNumber] === index ? 'text-blue-800' : 'text-gray-700'}>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitDialog(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Finish & Submit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="w-72 bg-white shadow-sm p-4 hidden lg:block">
          <div className="sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Questions</h3>
              <span className="text-sm text-gray-500">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    currentQuestion === index
                      ? 'bg-blue-600 text-white'
                      : answers[q.questionNumber] !== undefined
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <span className="w-4 h-4 rounded bg-green-100 border border-green-300"></span>
                Answered
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <span className="w-4 h-4 rounded bg-gray-100"></span>
                Not Answered
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-4 h-4 rounded bg-blue-600"></span>
                Current
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Submit Test?</h2>
              <p className="text-gray-500 mt-2">Are you sure you want to submit your test?</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">
                  {answeredCount} / {questions.length}
                </div>
                <div className="text-sm text-gray-500">Questions Answered</div>
              </div>
              {answeredCount < questions.length && (
                <p className="text-yellow-700 text-sm text-center mt-2">
                  You have {questions.length - answeredCount} unanswered question(s)
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Review Answers
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestPage;

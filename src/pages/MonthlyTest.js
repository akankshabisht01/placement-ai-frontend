import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingWithFacts from '../components/LoadingWithFacts';

const MonthlyTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const questionRef = useRef(null);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Tab switch detection
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const testContainerRef = useRef(null);

  // Camera and microphone for proctoring
  const [cameraStream, setCameraStream] = useState(null);
  const [microphoneStream, setMicrophoneStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [microphoneError, setMicrophoneError] = useState(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [microphonePermissionGranted, setMicrophonePermissionGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState('');
  const [requestingPermissions, setRequestingPermissions] = useState(false);
  const videoRef = useRef(null);

  // Toggle question expansion
  const toggleQuestion = (questionNumber) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionNumber]: !prev[questionNumber]
    }));
  };

  // Expand all questions
  const expandAll = () => {
    const allExpanded = {};
    (finalScore?.details || finalScore?.detailedResults)?.forEach((_, index) => {
      allExpanded[index + 1] = true;
    });
    setExpandedQuestions(allExpanded);
  };

  // Collapse all questions
  const collapseAll = () => {
    setExpandedQuestions({});
  };

  // Get month from location state
  const monthNumber = location.state?.month || 1;

  // Function to request permissions before starting test
  const requestPermissionsAndStart = async () => {
    setRequestingPermissions(true);
    setPermissionDeniedMessage('');
    
    let cameraGranted = false;
    let micGranted = false;
    let videoStream = null;
    let audioStream = null;
    
    // Request camera permission
    try {
      console.log('📷 Requesting camera permission...');
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      cameraGranted = true;
      setCameraStream(videoStream);
      setCameraPermissionGranted(true);
      setCameraError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      console.log('✅ Camera permission granted');
    } catch (err) {
      console.error('❌ Camera permission denied:', err);
      setCameraError(err.message);
      setCameraPermissionGranted(false);
    }
    
    // Request microphone permission
    try {
      console.log('🎤 Requesting microphone permission...');
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      micGranted = true;
      setMicrophoneStream(audioStream);
      setMicrophonePermissionGranted(true);
      setMicrophoneError(null);
      console.log('✅ Microphone permission granted');
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setMicrophoneError(err.message);
      setMicrophonePermissionGranted(false);
    }
    
    setRequestingPermissions(false);
    
    // Check if both permissions are granted
    if (cameraGranted && micGranted) {
      // Enter fullscreen mode
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
        console.log('✅ Entered fullscreen mode');
        
        // Lock keyboard
        if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
          try {
            await navigator.keyboard.lock(['Escape']);
            console.log('✅ Keyboard locked');
          } catch (err) {
            console.log('⚠️ Keyboard lock failed:', err);
          }
        }
      } catch (err) {
        console.error('❌ Failed to enter fullscreen:', err);
      }
      setStarted(true);
    } else {
      // Stop any streams that were started
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setMicrophoneStream(null);
      }
      
      // Show permission denied modal
      let message = '';
      if (!cameraGranted && !micGranted) {
        message = 'Both camera and microphone permissions are required to start the test. Please allow access and try again.';
      } else if (!cameraGranted) {
        message = 'Camera permission is required to start the test. Please allow camera access and try again.';
      } else {
        message = 'Microphone permission is required to start the test. Please allow microphone access and try again.';
      }
      setPermissionDeniedMessage(message);
      setShowPermissionModal(true);
    }
  };

  // Get user mobile
  const getUserMobile = () => {
    const linkedData = localStorage.getItem('linkedResumeData');
    const userData = localStorage.getItem('userData');
    const predictionData = localStorage.getItem('predictionFormData');

    if (linkedData) {
      try {
        const data = JSON.parse(linkedData);
        return data.mobile || data.phone;
      } catch (e) {
        console.error('Error parsing linkedResumeData:', e);
      }
    }

    if (userData) {
      try {
        const data = JSON.parse(userData);
        return data.mobile || data.phone;
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }

    if (predictionData) {
      try {
        const data = JSON.parse(predictionData);
        return data.mobile || data.phone;
      } catch (e) {
        console.error('Error parsing predictionFormData:', e);
      }
    }

    return null;
  };

  // Update resume skills after completing monthly test
  // Monthly test = proof of mastery (all 4 weeks completed)
  const updateResumeSkills = async () => {
    try {
      if (!testData || !testData.questions) {
        console.log('⚠️ No test data available for skill update');
        return;
      }

      const mobile = getUserMobile();
      if (!mobile) {
        console.log('⚠️ No mobile number found for skill update');
        return;
      }

      // Extract unique skills from all questions in the monthly test
      const testSkills = testData.questions
        .map(q => q.skill)
        .filter(skill => skill && skill.trim() !== '')
        .filter((skill, index, self) => self.indexOf(skill) === index); // unique skills only

      if (testSkills.length === 0) {
        console.log('ℹ️ No skills found in monthly test questions');
        return;
      }

      console.log(`📤 Updating resume with Month ${monthNumber} test skills:`, testSkills);

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/update-resume-skills-from-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          testSkills: testSkills
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.skillsAdded.length > 0) {
          console.log(`✅ Added ${result.skillsAdded.length} new skill(s) to resume:`, result.skillsAdded);
          console.log('🎓 Skills now proven through Month ${monthNumber} completion!');
        } else {
          console.log('ℹ️ All Month ${monthNumber} skills already present in resume');
        }
      } else {
        console.error('❌ Failed to update resume skills:', response.status);
      }
    } catch (error) {
      console.error('❌ Error updating resume skills:', error);
      // Don't throw - this is a background operation that shouldn't fail the test completion
    }
  };

  // Load test data
  useEffect(() => {
    const loadMonthlyTest = async () => {
      try {
        const mobile = getUserMobile();
        
        if (!mobile) {
          throw new Error('Mobile number not found. Please complete your profile first.');
        }

        console.log(`📱 Loading monthly test for: ${mobile}, Month: ${monthNumber}`);

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/api/monthly-test-fetcher`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: mobile,
            month: monthNumber
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.message || errorData.error || `Server error: ${response.status}`;
          console.error('❌ API Error Response:', errorData);
          throw new Error(errorMsg);
        }

        const result = await response.json();
        console.log('✅ Monthly test response:', result);

        if (result.success && result.data) {
          setTestData(result.data);
          setUserAnswers(new Array(result.data.totalQuestions).fill(null));
          setLoading(false);
        } else {
          throw new Error(result.message || result.error || 'Failed to load monthly test');
        }

      } catch (error) {
        console.error('❌ Monthly test load error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          mobile: getUserMobile(),
          month: monthNumber,
          backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'
        });
        setError(error.message || 'Failed to load monthly test. Please try again.');
        setLoading(false);
      }
    };

    loadMonthlyTest();
  }, [monthNumber]);

  // Tab switch detection - prevent cheating
  useEffect(() => {
    if (!started || testCompleted) return;
    
    let focusRecoveryInterval = null;
    let rapidFocusInterval = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          console.log(`⚠️ Tab/App switch detected! Count: ${newCount}`);
          return newCount;
        });
        setShowTabWarning(true);
        
        // ULTRA AGGRESSIVE: Try to regain focus every 10ms
        rapidFocusInterval = setInterval(() => {
          window.focus();
          document.body.focus();
        }, 10);
        
        // Also try at 100ms intervals
        focusRecoveryInterval = setInterval(() => {
          if (!document.hidden) {
            clearInterval(focusRecoveryInterval);
            clearInterval(rapidFocusInterval);
            // Re-enter fullscreen immediately
            const elem = document.documentElement;
            if (!document.fullscreenElement && started && !testCompleted) {
              elem.requestFullscreen?.().catch(() => {});
            }
          }
          window.focus();
        }, 100);
        
        // Immediate focus attempt
        window.focus();
        document.body.focus();
      } else {
        // User came back - clear intervals and re-enter fullscreen immediately
        if (focusRecoveryInterval) clearInterval(focusRecoveryInterval);
        if (rapidFocusInterval) clearInterval(rapidFocusInterval);
        
        // Re-enter fullscreen within 50ms
        setTimeout(async () => {
          const elem = document.documentElement;
          if (!document.fullscreenElement && started && !testCompleted) {
            try {
              await elem.requestFullscreen?.();
              if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
                await navigator.keyboard.lock?.(['Escape']).catch(() => {});
              }
            } catch (e) {}
          }
        }, 50);
      }
    };

    const handleBlur = () => {
      if (started && !testCompleted) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          console.log(`⚠️ Window blur (app switch) detected! Count: ${newCount}`);
          return newCount;
        });
        setShowTabWarning(true);
        
        // IMMEDIATE focus recovery - try multiple times rapidly
        window.focus();
        setTimeout(() => window.focus(), 10);
        setTimeout(() => window.focus(), 20);
        setTimeout(() => window.focus(), 50);
        setTimeout(() => window.focus(), 100);
        setTimeout(() => {
          window.focus();
          document.body.focus();
          // Also try to re-enter fullscreen
          if (!document.fullscreenElement && started && !testCompleted) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          }
        }, 100);
      }
    };
    
    const handleFocus = () => {
      // When focus returns, immediately re-enter fullscreen
      if (started && !testCompleted && !document.fullscreenElement) {
        setTimeout(async () => {
          try {
            await document.documentElement.requestFullscreen?.();
          } catch (e) {}
        }, 100);
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block ALL keyboard input during test - COMPLETE LOCKDOWN
    const blockAllKeys = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log(`🔒 Key blocked: ${e.key} (${e.type})`);
        return false;
      }
    };
    
    const handleKeyDown = blockAllKeys;
    const handleKeyUp = blockAllKeys;
    const handleKeyPress = blockAllKeys;
    
    // Additional: Block beforeinput events (for text input)
    const handleBeforeInput = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    // Block horizontal swipe gestures (3-finger trackpad swipe for app switching)
    const handleWheel = (e) => {
      if (started && !testCompleted) {
        // Block horizontal scrolling (often used for gesture navigation)
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 50) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔒 Horizontal swipe gesture blocked');
          return false;
        }
      }
    };
    
    // Block multi-touch gestures (3+ fingers)
    const handleTouchStart = (e) => {
      if (started && !testCompleted) {
        if (e.touches.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          console.log(`🔒 Multi-touch blocked: ${e.touches.length} fingers detected`);
          return false;
        }
      }
    };
    
    const handleTouchMove = (e) => {
      if (started && !testCompleted) {
        if (e.touches.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          console.log(`🔒 Multi-touch move blocked: ${e.touches.length} fingers`);
          return false;
        }
      }
    };
    
    // Block pointer events that might be gestures
    const handlePointerDown = (e) => {
      if (started && !testCompleted) {
        // Block if it looks like a gesture (non-primary pointer or touch)
        if (!e.isPrimary && e.pointerType === 'touch') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };
    
    // Block gesture events (Safari)
    const handleGestureStart = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔒 Gesture blocked');
        return false;
      }
    };
    
    const handleGestureChange = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    const handleGestureEnd = (e) => {
      if (started && !testCompleted) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', handleContextMenu, true);
    // Block keyboard at BOTH document and window level with capture phase
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('keypress', handleKeyPress, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keypress', handleKeyPress, true);
    document.addEventListener('beforeinput', handleBeforeInput, true);
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('gesturestart', handleGestureStart, true);
    document.addEventListener('gesturechange', handleGestureChange, true);
    document.addEventListener('gestureend', handleGestureEnd, true);

    return () => {
      if (focusRecoveryInterval) clearInterval(focusRecoveryInterval);
      if (rapidFocusInterval) clearInterval(rapidFocusInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('keypress', handleKeyPress, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keypress', handleKeyPress, true);
      document.removeEventListener('beforeinput', handleBeforeInput, true);
      document.removeEventListener('wheel', handleWheel, { passive: false, capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('gesturestart', handleGestureStart, true);
      document.removeEventListener('gesturechange', handleGestureChange, true);
      document.removeEventListener('gestureend', handleGestureEnd, true);
    };
  }, [started, testCompleted]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!started || testCompleted) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If exited fullscreen during test, automatically re-enter immediately
      if (!isCurrentlyFullscreen && started && !testCompleted) {
        setFullscreenExitCount(prev => {
          const newCount = prev + 1;
          console.log(`⚠️ Fullscreen exit detected! Count: ${newCount}`);
          return newCount;
        });
        setShowFullscreenWarning(true);
        
        // Immediately try to re-enter fullscreen (within 100ms)
        setTimeout(async () => {
          try {
            const elem = document.documentElement;
            await elem.requestFullscreen?.();
            console.log('✅ Re-entered fullscreen automatically');
            
            // Re-lock keyboard
            if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
              await navigator.keyboard.lock?.(['Escape']).catch(() => {});
            }
          } catch (err) {
            console.error('❌ Failed to re-enter fullscreen:', err);
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [started, testCompleted]);

  // Exit fullscreen when test completes
  useEffect(() => {
    if (testCompleted && isFullscreen) {
      // Unlock keyboard first
      if ('keyboard' in navigator && 'unlock' in navigator.keyboard) {
        navigator.keyboard.unlock?.();
      }
      
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [testCompleted, isFullscreen]);

  // Attach camera stream to video element when both are available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      console.log('📹 Video stream attached to video element');
    }
  }, [cameraStream, started]);

  // Cleanup camera and microphone when test completes
  // Cleanup function to stop camera and microphone
  const stopMediaStreams = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped camera track:', track.kind);
      });
      setCameraStream(null);
    }
    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped microphone track:', track.kind);
      });
      setMicrophoneStream(null);
    }
  };

  // Timer effect - Start timer when question changes
  useEffect(() => {
    if (!started || testCompleted || submitting || autoSubmitting) {
      return;
    }

    // Reset timer to 20 seconds for new question
    setSecondsLeft(20);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Start countdown
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or question change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, started, testCompleted, submitting, autoSubmitting]);

  // Auto-submit when timer expires
  const handleAutoSubmit = () => {
    if (autoSubmitting || submitting) return;
    
    setAutoSubmitting(true);
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Store current answer (or null if no selection)
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    // Move to next question or complete test
    setTimeout(() => {
      if (currentQuestionIndex < testData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAutoSubmitting(false);
        
        // Scroll to top of next question
        if (questionRef.current) {
          questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Test completed
        setAutoSubmitting(false);
        submitTest(newAnswers);
      }
    }, 500);
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (!showFeedback && !submitting) {
      setSelectedAnswer(answerIndex);
    }
  };

  // Handle submit answer
  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      alert('Please select an answer before proceeding.');
      return;
    }

    // Clear timer when manually submitting
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSubmitting(true);

    // Store user answer
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    // Move to next question after a brief delay
    setTimeout(() => {
      if (currentQuestionIndex < testData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setSubmitting(false);
        
        // Scroll to top of next question
        if (questionRef.current) {
          questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Test completed
        setShowFeedback(false);
        setSubmitting(false);
        submitTest(newAnswers);
      }
    }, 500);
  };

  // Submit test
  const submitTest = async (answers) => {
    setSubmittingTest(true);
    try {
      const mobile = getUserMobile();
      
      if (!mobile) {
        throw new Error('Mobile number not found');
      }

      console.log('📤 Submitting monthly test:', {
        mobile,
        month: monthNumber,
        answersCount: answers.length
      });

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      console.log('🔗 Backend URL:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/submit-monthly-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          month: monthNumber,
          answers: answers
        })
      }).catch(err => {
        console.error('❌ Fetch error:', err);
        throw new Error('Cannot connect to backend. Please make sure the backend server is running.');
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Test submitted successfully:', result);

      if (result.success && result.score) {
        setFinalScore(result.score);
        setTestCompleted(true);
        
        // Stop camera and microphone after successful submission
        stopMediaStreams();
        
        // Update resume with mastered skills (monthly test = 4 weeks of learning complete)
        await updateResumeSkills();
        
        // Dispatch event to notify Dashboard to refresh monthly test status
        console.log('📢 Dispatching monthlyTestSubmitted event for month:', monthNumber);
        window.dispatchEvent(new CustomEvent('monthlyTestSubmitted', { 
          detail: { month: monthNumber } 
        }));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      alert('Error submitting test: ' + error.message + '\n\nPlease make sure the backend server is running and try again.');
    } finally {
      setSubmittingTest(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingWithFacts message={`Loading Month ${monthNumber} Test...`} />;
  }

  // Submitting test state
  if (submittingTest) {
    return <LoadingWithFacts message="Submitting your test... Please wait." />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Test</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard?section=weeklytest')}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Test completed state
  if (testCompleted && finalScore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {!showDetailedResults ? (
            // Summary View
            <>
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                  <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test Completed!</h2>
                <p className="text-gray-600 dark:text-gray-400">{testData?.testTitle || `Month ${monthNumber} Test`}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-xl p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {finalScore.percentage}%
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Your Score</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{finalScore.totalQuestions}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Questions</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{finalScore.correctAnswers}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Correct</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{finalScore.wrongAnswers}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Wrong</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{finalScore.scoredMarks}/{finalScore.totalMarks}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Marks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowDetailedResults(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  View Detailed Results
                </button>
              </div>
            </>
          ) : (
            // Detailed Results View
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detailed Results</h2>
                <button
                  onClick={() => setShowDetailedResults(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back to Summary
                </button>
              </div>

              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{finalScore.scoredMarks ?? finalScore.totalScore ?? 0}/{finalScore.totalMarks ?? finalScore.maxPossibleScore ?? 0} ({finalScore.percentage ?? finalScore.scorePercentage ?? 0}%)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{finalScore.correctAnswers}/{finalScore.totalQuestions}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={expandAll}
                  className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Collapse All
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto space-y-3 mb-6">
                {(finalScore.details || finalScore.detailedResults)?.map((detail, index) => {
                  const isExpanded = expandedQuestions[detail.questionNumber];
                  
                  return (
                    <div
                      key={index}
                      className={`rounded-lg border-2 overflow-hidden ${
                        detail.isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                      }`}
                    >
                      {/* Question Header - Always Visible */}
                      <button
                        onClick={() => toggleQuestion(detail.questionNumber)}
                        className="w-full p-4 flex items-start justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 text-left">
                          <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            detail.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {detail.questionNumber}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">{detail.question}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span className={`px-2 py-1 rounded ${
                                detail.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              }`}>
                                {detail.difficulty}
                              </span>
                              <span>{detail.marks} marks</span>
                              <span className={detail.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                                {detail.isCorrect ? `+${detail.scoredMarks ?? detail.marksEarned ?? detail.marks}` : '0'} marks
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {detail.isCorrect ? (
                            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <svg
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="ml-11 space-y-2">
                            {['A', 'B', 'C', 'D'].map((letter, idx) => {
                              // Handle both old (letter string like 'A') and new (index number like 0) userAnswer formats
                              const userAnswerIdx = typeof detail.userAnswer === 'number' ? detail.userAnswer : {'A': 0, 'B': 1, 'C': 2, 'D': 3}[detail.userAnswer];
                              const isUserAnswer = userAnswerIdx === idx;
                              const isCorrectAnswer = (detail.correctAnswerLetter || detail.correctAnswer) === letter;
                              
                              return (
                                <div
                                  key={letter}
                                  className={`p-2 rounded ${
                                    isCorrectAnswer
                                      ? 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-600'
                                      : isUserAnswer
                                      ? 'bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-600'
                                      : 'bg-white dark:bg-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{letter}.</span>
                                    <span className="text-gray-900 dark:text-white">{detail.options && (typeof detail.options === 'object' && !Array.isArray(detail.options) ? detail.options[letter] : (detail.optionsArray || detail.options)?.[idx])}</span>
                                    {isCorrectAnswer && (
                                      <span className="ml-auto text-xs font-semibold text-green-700 dark:text-green-300">✓ Correct</span>
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <span className="ml-auto text-xs font-semibold text-red-700 dark:text-red-300">✗ Your Answer</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {detail.explanation && (
                            <div className="ml-11 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Explanation:</span> {detail.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => navigate('/dashboard?section=weeklytest')}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-xl"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Test interface
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 mb-4 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{testData?.testTitle || `Month ${monthNumber} Test`}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Month {monthNumber} • Comprehensive Assessment
            </p>
            
            <div className="flex items-center gap-6 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{testData?.totalQuestions || 0} Questions</span>
              </div>
            </div>

            <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Instructions
              </h4>
              <ul className="text-left text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li>• Camera and microphone will be enabled for proctoring</li>
                <li>• Test will run in fullscreen mode with keyboard locked</li>
                <li>• Answer all {testData?.totalQuestions || 0} questions to complete the test</li>
                <li>• Each question has a 20-second timer</li>
                <li>• Select your answer and click "Next Question" to proceed</li>
                <li>• You cannot go back to previous questions</li>
                <li>• Make sure you have a stable internet connection</li>
              </ul>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={requestPermissionsAndStart}
                disabled={requestingPermissions}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingPermissions ? 'Requesting Permissions...' : 'Start Test'}
              </button>
              <button
                onClick={() => navigate('/dashboard?section=weeklytest')}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface
  const currentQuestion = testData?.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData?.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {testData?.testTitle || `Month ${monthNumber} Test`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Month {monthNumber} • Question {currentQuestionIndex + 1} of {testData?.totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {currentQuestionIndex + 1}/{testData?.totalQuestions}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div ref={questionRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          {/* Timer and Difficulty Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentQuestion?.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              currentQuestion?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {currentQuestion?.difficulty?.charAt(0).toUpperCase() + currentQuestion?.difficulty?.slice(1)}
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
              secondsLeft > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              secondsLeft > 5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg">{secondsLeft}s</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {currentQuestionIndex + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                {currentQuestion?.question}
              </h3>
            </div>
            
            {currentQuestion?.skill && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 ml-11">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{currentQuestion.skill}</span>
                {currentQuestion.difficulty && (
                  <>
                    <span>•</span>
                    <span className={`capitalize ${
                      currentQuestion.difficulty === 'hard' ? 'text-red-600 dark:text-red-400' :
                      currentQuestion.difficulty === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                  </>
                )}
                {currentQuestion.marks && (
                  <>
                    <span>•</span>
                    <span>{currentQuestion.marks} marks</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={submitting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedAnswer === index && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitting}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                selectedAnswer === null || submitting
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? 'Processing...' : 
               currentQuestionIndex < testData.questions.length - 1 ? 'Next Question' : 'Submit Test'}
            </button>
          </div>
        </div>

        {/* Camera Feed - fixed in corner */}
        {cameraStream && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-purple-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-32 h-24 object-cover"
              />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                REC
              </div>
            </div>
          </div>
        )}

        {/* Tab Switch Warning */}
        {showTabWarning && (
          <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-pulse">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Warning: Tab/App Switch Detected!</p>
              <p className="text-sm">Switch count: {tabSwitchCount}</p>
            </div>
            <button
              onClick={() => setShowTabWarning(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Fullscreen Warning */}
        {showFullscreenWarning && (
          <div className="fixed top-20 right-4 z-50 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-pulse">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">Warning: Fullscreen Exit Detected!</p>
              <p className="text-sm">Exit count: {fullscreenExitCount}</p>
            </div>
            <button
              onClick={() => setShowFullscreenWarning(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Permission Denied Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Permissions Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                {permissionDeniedMessage}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    requestPermissionsAndStart();
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    navigate('/dashboard?section=weeklytest');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyTest;

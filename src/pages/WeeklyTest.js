import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';
import LoadingWithFacts, { LoadingFactsInline } from '../components/LoadingWithFacts';

const WeeklyTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
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
  
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  
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
      console.log('ðŸ“· Requesting camera permission...');
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
      console.log('œ… Camera permission granted');
    } catch (err) {
      console.error('Œ Camera permission denied:', err);
      setCameraError(err.message);
      setCameraPermissionGranted(false);
    }
    
    // Request microphone permission
    try {
      console.log('¤ Requesting microphone permission...');
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      micGranted = true;
      setMicrophoneStream(audioStream);
      setMicrophonePermissionGranted(true);
      setMicrophoneError(null);
      console.log('œ… Microphone permission granted');
    } catch (err) {
      console.error('Œ Microphone permission denied:', err);
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
        console.log('œ… Entered fullscreen mode');
      } catch (err) {
        console.error('Œ Failed to enter fullscreen:', err);
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
  
  // New states for test generation flow
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);

  // Get user mobile
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



  // Progress messages for generation
  const getProgressMessage = (pollCount) => {
    if (pollCount < 6) return 'Generating your personalized test...';
    if (pollCount < 12) return 'AI is crafting questions for you...';
    if (pollCount < 18) return 'Almost there, finalizing your test...';
    if (pollCount < 24) return 'Taking a bit longer, please wait...';
    if (pollCount < 30) return 'Just a moment more...';
    return 'Still working on it...';
  };

  // Poll for test readiness
  const pollForTest = useCallback(async (mobile) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${backendUrl}/api/check-weekly-test/${encodeURIComponent(mobile)}`);
      const data = await response.json();
      
      if (data.success && data.status === 'ready') {
        // Test is ready!
        console.log('œ… Test ready from polling');
        setTestData(data.data);
        setIsGenerating(false);
        setLoading(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return true;
      }
      
      // Still pending - update progress
      pollCountRef.current += 1;
      setGenerationProgress(Math.min(95, (pollCountRef.current / 36) * 100));
      setGenerationMessage(getProgressMessage(pollCountRef.current));
      
      // Timeout after 3 minutes (36 polls Ã— 5 seconds)
      if (pollCountRef.current >= 36) {
        console.log('±ï¸ Polling timeout reached');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setError('Test generation is taking longer than expected. Please try again later or check back in a few minutes.');
        setIsGenerating(false);
        setLoading(false);
        return false;
      }
      
      return false;
    } catch (err) {
      console.error('Polling error:', err);
      return false;
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Countdown per-question timer (20s)
  useEffect(() => {
    // reset countdown whenever question changes
    setSecondsLeft(20);
    setAutoSubmitting(false);
  }, [currentQuestionIndex, testData]);

  useEffect(() => {
    if (!started) return; // don't start countdown until test started
    if (testCompleted) return;
    if (showFeedback) return; // pause while showing feedback
    if (autoSubmitting) return;

    const t = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [started, showFeedback, testCompleted, autoSubmitting]);

  // Tab switch detection - prevent cheating
  useEffect(() => {
    if (!started || testCompleted) return;
    
    let focusRecoveryInterval = null;
    let rapidFocusInterval = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          console.log(`⚠️ Tab/App switch detected! Count: ${newCount}`);
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
          console.log(`⚠️ Window blur (app switch) detected! Count: ${newCount}`);
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
        console.log(`ðŸ”’ Key blocked: ${e.key} (${e.type})`);
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
          console.log('ðŸ”’ Horizontal swipe gesture blocked');
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
          console.log(`ðŸ”’ Multi-touch blocked: ${e.touches.length} fingers detected`);
          return false;
        }
      }
    };
    
    const handleTouchMove = (e) => {
      if (started && !testCompleted) {
        if (e.touches.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          console.log(`ðŸ”’ Multi-touch move blocked: ${e.touches.length} fingers`);
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
        console.log('ðŸ”’ Gesture blocked');
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
          console.log(`⚠️ Fullscreen exit detected! Count: ${newCount}`);
          return newCount;
        });
        
        // Automatically re-enter fullscreen after a tiny delay
        setTimeout(async () => {
          const elem = document.documentElement;
          try {
            if (elem.requestFullscreen) {
              await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
              await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
              await elem.msRequestFullscreen();
            }
            console.log('ðŸ”’ Auto re-entered fullscreen');
            
            // Re-lock keyboard
            if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
              try {
                await navigator.keyboard.lock(['Escape']);
              } catch (lockErr) {
                // Ignore lock errors
              }
            }
          } catch (err) {
            // If auto re-enter fails, show warning modal
            console.error('Failed to auto re-enter fullscreen:', err);
            setShowFullscreenWarning(true);
          }
        }, 50);
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

  // Function to re-enter fullscreen with keyboard lock
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      
      // Try to lock the keyboard (including Escape key) - supported in Chrome/Edge
      if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
        try {
          await navigator.keyboard.lock(['Escape']);
          console.log('ðŸ”’ Keyboard locked - Escape key is disabled');
        } catch (lockErr) {
          console.log('Keyboard lock not available:', lockErr.message);
        }
      }
      
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  // Exit fullscreen when test completes
  useEffect(() => {
    if (testCompleted && isFullscreen) {
      // Release keyboard lock first
      if ('keyboard' in navigator && 'unlock' in navigator.keyboard) {
        navigator.keyboard.unlock();
        console.log('ðŸ”“ Keyboard unlocked');
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
      console.log('ðŸ“¹ Video stream attached to video element');
    }
  }, [cameraStream, started]);

  // Cleanup camera and microphone when test completes
  useEffect(() => {
    // Cleanup: stop camera and microphone when test completes or component unmounts
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
          track.stop();
          console.log('ðŸ›‘ Stopped camera track:', track.kind);
        });
      }
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => {
          track.stop();
          console.log('ðŸ›‘ Stopped microphone track:', track.kind);
        });
      }
    };
  }, [testCompleted]);

  // Scroll to questions when test starts
  useEffect(() => {
    if (started && questionRef.current) {
      questionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [started]);

  // Fetch weekly test on mount
  useEffect(() => {
    const fetchWeeklyTest = async () => {
      try {
        const mobile = getUserMobile();
        if (!mobile) {
          throw new Error('Mobile number not found. Please complete your profile first.');
        }

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        console.log('ðŸ“ž Fetching weekly test for mobile:', mobile);
        
        const response = await fetch(`${backendUrl}/api/weekly-test-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mobile: mobile
          })
        });

        const data = await response.json();
        
        console.log('📋 Weekly test API response:', response.status, data);
        
        // Handle different response statuses
        if (data.status === 'generating') {
          // Test is being generated - start polling
          console.log('ðŸ”„ Test generation started, beginning polling...');
          setIsGenerating(true);
          setLoading(false);
          setGenerationMessage('Generating your personalized test...');
          setGenerationProgress(5);
          pollCountRef.current = 0;
          
          // Start polling every 5 seconds
          pollingRef.current = setInterval(() => {
            pollForTest(mobile);
          }, 5000);
          
          return;
        }
        
        if (data.status === 'ready' && data.success) {
          // Test exists and is ready
          console.log('œ… Weekly test loaded:', data.data);
          setTestData(data.data);
          setLoading(false);
          return;
        }

        // Only check response.ok AFTER checking for valid statuses
        // This handles the case where backend returns 202 Accepted
        if (!response.ok && response.status !== 202) {
          if (data.error_type === 'config_error') {
            throw new Error('Test generation service is not configured. Please contact support.');
          }
          if (data.error_type === 'n8n_error' || data.error_type === 'webhook_error') {
            throw new Error('Failed to start test generation. Please try again later.');
          }
          throw new Error(data.error || `Server error: ${response.status}`);
        }

        if (!data.success && data.status !== 'generating') {
          throw new Error(data.error || 'Failed to load weekly test');
        }
        
      } catch (err) {
        console.error('Œ Weekly test error:', err);
        setError(err.message);
        setLoading(false);
        setIsGenerating(false);
      }
    };

    fetchWeeklyTest();
  }, [pollForTest]);

  // AI-powered skill completion check based on pre-analyzed roadmap
  const checkSkillCompletionWithAI = useCallback(async () => {
    const mobile = getUserMobile();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    if (!mobile || !testData) {
      console.warn('Missing mobile or testData for skill completion check');
      return;
    }
    
    const weekNumber = testData?.week || 1;
    const monthNumber = testData?.month || 1;
    
    try {
      console.log(`🎯 Checking skill completion for Month ${monthNumber}, Week ${weekNumber}...`);
      
      const response = await fetch(`${backendUrl}/api/check-skill-completion-with-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          weekNumber: weekNumber,
          monthNumber: monthNumber
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Skill Completion Result:', result);
        
        if (result.skillsMoved && result.skillsMoved.length > 0) {
          // Skills were moved to Skills & Expertise - update localStorage
          const linkedDataRaw = localStorage.getItem('linkedResumeData');
          try {
            let linkedData = linkedDataRaw ? JSON.parse(linkedDataRaw) : {};
            
            // Add the new skills to the skills array
            if (!linkedData.skills) {
              linkedData.skills = [];
            }
            
            // Add skills that aren't already there
            result.skillsMoved.forEach(skill => {
              if (!linkedData.skills.includes(skill)) {
                linkedData.skills.push(skill);
              }
            });
            
            // Save back to localStorage
            localStorage.setItem('linkedResumeData', JSON.stringify(linkedData));
            console.log('📝 Updated localStorage with new skills:', result.skillsMoved);
            
            // Dispatch custom event to notify Dashboard of skill updates
            window.dispatchEvent(new Event('skillsUpdated'));
          } catch (err) {
            console.error('Error updating localStorage:', err);
          }
          
          const skillsList = result.skillsMoved.join(', ');
          alert(`🎉 Congratulations! You've completed Week ${weekNumber}!\n\n✅ Skills Mastered:\n${skillsList}\n\nThese skills have been added to your "Skills & Expertise" section in your resume.`);
        } else if (result.skillsCompleted && result.skillsCompleted.length > 0) {
          // Skills completed but already in resume
          const skillsList = result.skillsCompleted.join(', ');
          alert(`✅ Week ${weekNumber} Completed!\n\nSkills: ${skillsList}\n(Already in your Skills & Expertise)`);
        } else {
          // No skills scheduled to complete this week
          console.log(`ℹ️ No skills scheduled to complete at Week ${weekNumber}`);
        }
      } else {
        console.warn('Skill completion check failed:', result.error);
      }
    } catch (err) {
      console.error('Error checking skill completion:', err);
      // Don't block test completion if check fails
    }
  }, [testData]);

  // Generic submit used by manual submit and auto-skip
  const submitAnswer = useCallback(async (answerValue, timeSpentValue) => {
    setSubmitting(true);
    
    const mobile = getUserMobile();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const questions = testData?.questions || [];
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    // For last question, await the API call to ensure answer is saved before navigation
    // For other questions, fire in background for faster UX
    const submitPromise = fetch(`${backendUrl}/api/submit-single-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile: mobile,
        testId: testData.testId,
        questionIndex: currentQuestionIndex,
        answer: answerValue,
        timeSpent: timeSpentValue
      })
    });

    if (isLastQuestion) {
      // Wait for last answer to be saved before marking test complete
      try {
        await submitPromise;
        console.log('✅ Last answer saved successfully');
        
        // Check with AI if skill should be moved to "Skills & Expertise"
        await checkSkillCompletionWithAI();
        
        // Dispatch event to notify Dashboard that weekly test is completed
        console.log('📢 Dispatching weeklyTestCompleted event');
        window.dispatchEvent(new CustomEvent('weeklyTestCompleted', { 
          detail: { week: testData.week, month: testData.month } 
        }));
      } catch (err) {
        console.error('Failed to save last answer:', err);
      }
      setTestCompleted(true);
    } else {
      // Fire and forget for non-last questions
      submitPromise.catch(err => {
        console.error('Background submit error:', err);
      });
      setCurrentQuestionIndex(ci => ci + 1);
      setSelectedAnswer(null);
      setSecondsLeft(20);
    }
    
    setSubmitting(false);
    setAutoSubmitting(false);
  }, [testData, currentQuestionIndex, checkSkillCompletionWithAI]);

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      alert('Please select an answer');
      return;
    }
    const timeSpent = 20 - secondsLeft;
    // Send option text to backend instead of index for clearer semantics
    const answerText = currentQuestion?.options?.[selectedAnswer];
    submitAnswer(answerText, timeSpent);
  };

  // View results: call backend proxy which forwards mobile to n8n, then navigate
  const handleViewResults = async () => {
    const mobile = getUserMobile();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    if (!mobile) {
      console.warn('No mobile number found for webhook call');
      navigate('/test-results');
      return;
    }

    // Small delay to ensure all pending answer submissions have completed
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const resp = await fetch(`${backendUrl}/api/notify-answer-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });

      const resJson = await resp.json().catch(() => null);
      if (!resp.ok) console.warn('Backend webhook proxy returned non-OK', resp.status, resJson);
    } catch (err) {
      console.error('Failed to call backend webhook proxy:', err);
    } finally {
      navigate('/test-results');
    }
  };

  // Auto-skip when countdown reaches 0
  useEffect(() => {
    if (!started) return;
    if (secondsLeft !== 0) return;
    if (showFeedback) return;
    if (autoSubmitting) return;

    // mark as auto-submitted incorrect answer
    setAutoSubmitting(true);
    // send empty string as timeout marker (backend will treat as incorrect)
    submitAnswer('', 20);
  }, [secondsLeft, started, showFeedback, autoSubmitting, submitAnswer]);

  // Show generation progress screen
  if (isGenerating) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.pageBackground} p-4`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 max-w-lg w-full border-2 ${themeClasses.cardBorder}`}>
          <div className="text-center">
            {/* Animated Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className={`absolute inset-0 rounded-full border-4 ${themeClasses.cardBorder}`}></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-current animate-spin"
                style={{ animationDuration: '1.5s', color: themeClasses.accent.split('-').pop() }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className={`w-10 h-10 ${themeClasses.accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            
            <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>
              Creating Your Test
            </h3>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              {generationMessage}
            </p>
            
            {/* Progress Bar */}
            <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-3 mb-4 overflow-hidden border ${themeClasses.cardBorder}`}>
              <div
                className={`${themeClasses.gradient} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            
            <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
              This may take 1-2 minutes. Please don't close this page.
            </p>
            
            {/* Interactive Facts/Questions Section */}
            <LoadingFactsInline minDisplayTime={10000} />
            
            {/* Options */}
            <div className={`${themeClasses.sectionBackground} rounded-xl p-4 mb-6 mt-6 border ${themeClasses.cardBorder}`}>
              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                You can also:
              </p>
              <button
                onClick={() => {
                  if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                  }
                  navigate('/dashboard?section=weeklytest');
                }}
                className={`w-full px-4 py-2 ${themeClasses.buttonSecondary} ${themeClasses.buttonHover} rounded-lg transition-colors text-sm`}
              >
                Check Back Later †’
              </button>
            </div>
            
            {/* Animated dots */}
            <div className="flex items-center justify-center space-x-1">
              <div className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.accent.replace('text-', 'bg-')}`} style={{ animationDelay: '0ms' }}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.accent.replace('text-', 'bg-')}`} style={{ animationDelay: '150ms' }}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${themeClasses.accent.replace('text-', 'bg-')}`} style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingWithFacts
        title="Loading Assessment"
        subtitle="Preparing your personalized test..."
        showAfterDelay={2000}
      />
    );
  }


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl dark:shadow-pink-500/10 p-8 max-w-md w-full border border-amber-100 dark:border-pink-500/20">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard?section=weeklytest')}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-tech-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-tech-gray-600 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] p-4">
        <div className="bg-white dark:bg-[#1e1a2e] rounded-2xl shadow-xl dark:shadow-pink-500/10 p-8 max-w-md w-full border border-amber-100 dark:border-pink-500/20">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment Completed!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Great job! Your performance has been recorded. View your detailed results and insights below.</p>
            <div className="space-y-3">
              <button
                onClick={handleViewResults}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-pink-500 dark:to-purple-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = testData?.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / testData?.totalQuestions) * 100;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1625] dark:via-[#1e1a2e] dark:to-[#1a1625] ${started ? 'fixed inset-0 z-50 overflow-auto flex flex-col justify-center py-4 px-4' : 'py-8 px-4'}`}>
      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-red-500">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Tab Switch Detected!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have switched tabs <span className="font-bold text-red-600 dark:text-red-400">{tabSwitchCount}</span> time(s).
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Switching tabs during the test is not allowed. This activity has been recorded and may affect your assessment.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
            >
              Continue Test
            </button>
          </div>
        </div>
      )}
      
      {/* Permission Denied Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-amber-500">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
              <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">ðŸ“· Permission Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {permissionDeniedMessage}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              This is a Proctored Test. Camera and microphone access are mandatory to ensure test integrity.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  requestPermissionsAndStart();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-pink-500 dark:to-purple-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Exit Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-500">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <svg className="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">ðŸ–🎥ï¸ Fullscreen Required!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have exited fullscreen mode <span className="font-bold text-orange-600 dark:text-orange-400">{fullscreenExitCount}</span> time(s).
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              This test must be taken in fullscreen mode to prevent cheating. Please click below to re-enter fullscreen and continue.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
            >
              ðŸ”² Re-enter Fullscreen
            </button>
          </div>
        </div>
      )}
      
      {/* Camera Preview - WhatsApp video call style in bottom-right corner */}
      {started && !testCompleted && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <div className="relative">
            {/* Main video container */}
            <div className="w-48 h-36 md:w-56 md:h-44 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 dark:ring-gray-700">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {/* Camera error overlay */}
              {cameraError && (
                <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center p-3">
                  <svg className="w-10 h-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white text-xs text-center">Camera access denied</p>
                </div>
              )}
              {/* No camera stream yet */}
              {!cameraStream && !cameraError && (
                <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-xs">Starting camera...</p>
                </div>
              )}
            </div>
            {/* Recording indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full ${cameraStream ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-white text-xs font-semibold">LIVE</span>
            </div>
            {/* Microphone indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg className={`w-3.5 h-3.5 ${microphoneStream ? 'text-green-400' : microphoneError ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {microphoneStream && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>}
            </div>
            {/* Proctoring badge */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-white text-xs">Proctored</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={`mx-auto ${started ? 'max-w-4xl' : 'max-w-3xl'}`}>
        {/* Test Ready banner with comprehensive warnings */}
        {!started && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-pink-400 dark:to-purple-500 mb-4 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{testData?.testTitle || 'Weekly Assessment'}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {testData?.week && testData?.month ? `Month ${testData.month} • Week ${testData.week}` : 'Test your skills and track your progress'}
              </p>
              
              {/* Test Info */}
              <div className="flex items-center gap-6 mb-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500 dark:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{testData?.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500 dark:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>20s per question</span>
                </div>
              </div>
              
              {/* CRITICAL WARNING BOX */}
              <div className="w-full max-w-lg mb-6 p-5 bg-red-50 dark:bg-red-900/30 rounded-xl border-2 border-red-300 dark:border-red-600">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">⚠️ IMPORTANT WARNINGS</p>
                </div>
                <ul className="text-left text-sm text-red-700 dark:text-red-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>DO NOT switch tabs or windows</strong> - Test will be auto-submitted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>DO NOT exit fullscreen</strong> - Violations will be recorded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>Keyboard is disabled</strong> - Only mouse clicks allowed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>Camera & Mic required</strong> - You'll be monitored throughout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span><strong>No going back</strong> - Once answered, you cannot change</span>
                  </li>
                </ul>
              </div>
              
              {/* Test Rules */}
              <div className="w-full max-w-lg mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">📋 Test Rules:</p>
                <ul className="text-left text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
                  <li>✓ Test will run in fullscreen mode</li>
                  <li>✓ 20 seconds per question - auto-submits when time runs out</li>
                  <li>✓ All tab switches and fullscreen exits are tracked</li>
                  <li>✓ Your camera feed is visible in the corner</li>
                  <li>✓ Complete all questions to see your results</li>
                </ul>
              </div>
              
              {/* Proctoring Notice */}
              <div className="w-full max-w-lg mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">🎥 Proctored Test</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Camera & microphone will be enabled. Please allow access when prompted. Ensure you're in a quiet, well-lit environment.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Acknowledgment */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                By clicking "Begin Assessment", you acknowledge that you have read and understood all the rules above.
              </p>
              
              <div className="space-y-3 w-full">
                <button
                  onClick={requestPermissionsAndStart}
                  disabled={requestingPermissions}
                  className="w-full px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-pink-500 dark:to-purple-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {requestingPermissions ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Requesting Permissions...
                    </span>
                  ) : (
                    'I Understand - Begin Assessment'
                  )}
                </button>
                <button
                  onClick={() => navigate('/dashboard?section=weeklytest')}
                  className="w-full px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        {started && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {testData?.testTitle || 'Weekly Assessment'}
                </h2>
                {testData?.week && testData?.month ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Month {testData.month} • Week {testData.week}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Focus and answer each question carefully</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Question</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentQuestionIndex + 1} <span className="text-gray-400 font-normal">/ {testData?.totalQuestions}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-mono text-lg font-bold ${
                  secondsLeft <= 10 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                    : 'bg-amber-100 dark:bg-pink-900/30 text-amber-700 dark:text-pink-300'
                }`}>
                  {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="absolute -top-1 transition-all duration-500" style={{ left: `calc(${progress}% - 8px)` }}>
                <div className="w-4 h-4 bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        {started && (
          <div ref={questionRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-gray-700">
          {/* Skill & Difficulty Badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-amber-700 dark:text-pink-300 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {currentQuestion?.skill || 'General Knowledge'}
            </span>
            {currentQuestion?.difficulty && (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                currentQuestion.difficulty === 'hard' 
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : currentQuestion.difficulty === 'medium'
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
                {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
              </span>
            )}
          </div>

          {/* Question */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-8 leading-relaxed">
            {currentQuestion?.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showFeedback && setSelectedAnswer(index)}
                disabled={showFeedback || submitting}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } ${showFeedback || submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg border-2 mr-4 flex items-center justify-center font-semibold text-sm transition-all ${
                    selectedAnswer === index 
                      ? 'border-purple-500 bg-purple-500 text-white' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 flex-1">
                    {option.replace(/^[A-D]\)\s*/, '')}
                  </span>
                  {selectedAnswer === index && (
                    <svg className="w-5 h-5 text-amber-500 dark:text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || submitting || showFeedback}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                selectedAnswer === null || submitting || showFeedback
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 dark:from-pink-500 dark:to-purple-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Submit Answer
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WeeklyTest;



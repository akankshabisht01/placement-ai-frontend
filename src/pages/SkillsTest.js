import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';
import LoadingWithFacts from '../components/LoadingWithFacts';

const SkillsTest = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [loading, setLoading] = useState(true);
  const [testReady, setTestReady] = useState(false);
  const [started, setStarted] = useState(false);
  const questionRef = useRef(null);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [retrying, setRetrying] = useState(false);
  
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
            console.log('🔒 Auto re-entered fullscreen');
            
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
          console.log('🔒 Keyboard locked - Escape key is disabled');
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
        console.log('🔓 Keyboard unlocked');
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
  useEffect(() => {
    // Cleanup: stop camera and microphone when test completes or component unmounts
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped camera track:', track.kind);
        });
      }
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped microphone track:', track.kind);
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

  // Polling logic extracted as reusable function
  const startTestPolling = useCallback(() => {
    let pollInterval = null;
    let isMounted = true;
    let pollStartTime = Date.now();
    const MAX_POLL_TIME = 120000; // 2 minutes timeout
    
    const fetchTest = async () => {
      try {
        const mobile = getUserMobile();
        if (!mobile) {
          throw new Error('Mobile number not found. Please complete your profile first.');
        }

        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        const pollForTest = async () => {
          try {
            // Check if polling has exceeded timeout
            const elapsed = Date.now() - pollStartTime;
            if (elapsed > MAX_POLL_TIME) {
              if (isMounted) {
                setError('Test generation timeout. N8N service may be down or the workflow failed. Please check N8N status and try again.');
                setLoading(false);
                setRetrying(false);
              }
              return 'timeout';
            }
            
            // First check if N8N reported any errors
            const statusResponse = await fetch(`${backendUrl}/api/test-generation-status/${encodeURIComponent(mobile)}`);
            if (statusResponse.status === 500) {
              const statusData = await statusResponse.json().catch(() => ({}));
              if (statusData.error_type === 'n8n_error') {
                if (isMounted) {
                  setError(statusData.error || 'Test generation failed. N8N service may be down. Please try again.');
                  setLoading(false);
                  setRetrying(false);
                }
                return 'error';
              }
            }
            
            // Then try to get test questions
            const response = await fetch(`${backendUrl}/api/get-test-questions/${encodeURIComponent(mobile)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data && data.data.questions && data.data.questions.length > 0) {
                if (isMounted) {
                  setTestData(data.data);
                  setLoading(false);
                  setTestReady(true);
                  setRetrying(false);
                  setError(null);
                }
                return true;
              }
            }
          } catch (err) {
            console.log('Poll attempt failed:', err);
          }
          return false;
        };
        
        // Try to fetch immediately first
        const foundImmediately = await pollForTest();
        
        if (foundImmediately === 'error' || foundImmediately === 'timeout') {
          return; // Error already handled
        }
        
        if (!foundImmediately && isMounted) {
          // Poll every 2 seconds
          pollInterval = setInterval(async () => {
            const found = await pollForTest();
            if (found === 'error' || found === true || found === 'timeout') {
              if (pollInterval) clearInterval(pollInterval);
            }
          }, 2000);
        }
        
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
          setRetrying(false);
        }
      }
    };

    fetchTest();
    
    // Return cleanup function
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // Retry function - triggers test generation webhook again and starts polling
  const handleRetry = async () => {
    try {
      setRetrying(true);
      setError(null);
      setLoading(true);

      const mobile = getUserMobile();
      if (!mobile) {
        setError('Mobile number not found. Please complete your profile first.');
        setRetrying(false);
        setLoading(false);
        return;
      }

      // Get user's selected skills
      const getSelectedSkills = () => {
        const linkedData = localStorage.getItem('linkedResumeData');
        const predictionData = localStorage.getItem('predictionFormData');
        
        if (linkedData) {
          const parsed = JSON.parse(linkedData);
          return parsed.jobSelection?.selectedSkills || [];
        }
        if (predictionData) {
          const parsed = JSON.parse(predictionData);
          return parsed.selectedSkills || [];
        }
        return [];
      };

      const selectedSkills = getSelectedSkills();
      
      if (selectedSkills.length === 0) {
        setError('No skills selected. Please complete your profile first.');
        setRetrying(false);
        setLoading(false);
        return;
      }

      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      console.log('🔄 Retrying test generation for:', mobile);
      console.log('📝 Skills:', selectedSkills);
      
      // Trigger the test generation webhook (N8N_TEST_GENERATION_WEBHOOK)
      const response = await fetch(`${backendUrl}/api/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: mobile,
          skills: selectedSkills,
          testType: 'quick'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        // Show N8N connection error immediately
        let errorMsg = result.error || 'Failed to trigger test webhook';
        if (errorMsg.includes('timeout')) {
          errorMsg = 'N8N service timeout. Service may be down. Please check N8N.';
        } else if (errorMsg.includes('connect') || errorMsg.includes('Cannot connect')) {
          errorMsg = 'Cannot connect to N8N. Please check if N8N service is running.';
        } else if (errorMsg.includes('n8n')) {
          errorMsg = 'N8N workflow error. Please check the workflow configuration.';
        }
        
        console.error('❌ N8N Error on retry:', errorMsg);
        setError(errorMsg);
        setRetrying(false);
        setLoading(false);
        return;
      }

      console.log('✅ Retry webhook triggered successfully');
      
      // Manually restart the polling logic with fresh timeout
      let pollInterval = null;
      let pollStartTime = Date.now();
      const MAX_POLL_TIME = 120000; // 2 minutes timeout
      
      const pollForTest = async () => {
        try {
          // Check if polling has exceeded timeout
          const elapsed = Date.now() - pollStartTime;
          if (elapsed > MAX_POLL_TIME) {
            setError('Test generation timeout. N8N service may be down or the workflow failed. Please check N8N status and try again.');
            setLoading(false);
            setRetrying(false);
            if (pollInterval) clearInterval(pollInterval);
            return 'timeout';
          }
          
          // First check if N8N reported any errors
          const statusResponse = await fetch(`${backendUrl}/api/test-generation-status/${encodeURIComponent(mobile)}`);
          if (statusResponse.status === 500) {
            const statusData = await statusResponse.json().catch(() => ({}));
            if (statusData.error_type === 'n8n_error') {
              setError(statusData.error || 'Test generation failed. N8N service may be down. Please try again.');
              setLoading(false);
              setRetrying(false);
              if (pollInterval) clearInterval(pollInterval);
              return 'error';
            }
          }
          
          // Then try to get test questions
          const response = await fetch(`${backendUrl}/api/get-test-questions/${encodeURIComponent(mobile)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.questions && data.data.questions.length > 0) {
              setTestData(data.data);
              setLoading(false);
              setTestReady(true);
              setRetrying(false);
              setError(null);
              if (pollInterval) clearInterval(pollInterval);
              return true;
            }
          }
        } catch (err) {
          console.log('Poll attempt failed:', err);
        }
        return false;
      };
      
      // Try to fetch immediately first
      const foundImmediately = await pollForTest();
      
      if (foundImmediately !== 'error' && foundImmediately !== 'timeout' && !foundImmediately) {
        // Start polling every 2 seconds
        pollInterval = setInterval(async () => {
          await pollForTest();
        }, 2000);
      }
      
    } catch (err) {
      console.error('❌ Retry error:', err);
      let errorMsg = err.message || 'Failed to retry. Please try again.';
      
      // Handle network errors
      if (err.message.includes('Failed to fetch')) {
        errorMsg = 'Network error. Cannot reach backend server.';
      }
      
      setError(errorMsg);
      setRetrying(false);
      setLoading(false);
    }
  };

  // Fetch test questions on mount with retry logic
  useEffect(() => {
    const cleanup = startTestPolling();
    return cleanup;
  }, [startTestPolling]);

  // Generic submit used by manual submit and auto-skip
  const submitAnswer = useCallback(async (answerValue, timeSpentValue) => {
    setSubmitting(true);
    
    const mobile = getUserMobile();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    const questions = testData?.questions || [];
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    // Fire API call in background (don't await) for faster UX
    fetch(`${backendUrl}/api/submit-single-answer`, {
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
    }).catch(err => {
      console.error('Background submit error:', err);
    });

    // Instantly move to next question without any feedback delay
    if (!isLastQuestion) {
      setCurrentQuestionIndex(ci => ci + 1);
      setSelectedAnswer(null);
      setSecondsLeft(20);
    } else {
      setTestCompleted(true);
    }
    setSubmitting(false);
    setAutoSubmitting(false);
  }, [testData, currentQuestionIndex]);

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
  }, [secondsLeft, started, showFeedback, autoSubmitting]);


  if (loading) {
    return (
      <LoadingWithFacts
        title="Generating Your Test"
        subtitle="Our AI is creating personalized questions based on your skills..."
        context="quiz_submission"
        showAfterDelay={3000}
        minDisplayTime={6000}
      />
    );
  }


  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.pageBackground} p-4`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 max-w-md w-full border-2 ${themeClasses.cardBorder}`}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold ${themeClasses.textPrimary} mb-2`}>Error</h3>
            <p className={`${themeClasses.textSecondary} mb-6`}>{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {retrying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/dashboard?section=skilltest')}
                className={`w-full px-6 py-3 ${themeClasses.buttonSecondary} rounded-lg transition-colors`}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading/generating state
  if (loading || retrying) {
    return (
      <LoadingWithFacts
        title={retrying ? 'Retrying Test Generation' : 'Generating Your Test'}
        subtitle="Our AI is creating personalized questions based on your skills..."
        context="quiz_submission"
        showAfterDelay={3000}
        minDisplayTime={6000}
      />
    );
  }

  if (testCompleted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.pageBackground} p-4`}>
        <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 max-w-md w-full border-2 ${themeClasses.cardBorder}`}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>Test Completed!</h3>
            <p className={`${themeClasses.textSecondary} mb-6`}>Your answers have been recorded. View your detailed results below.</p>
            <div className="space-y-3">
              <button
                onClick={handleViewResults}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
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
    <div className={`min-h-screen ${themeClasses.pageBackground} ${started ? 'fixed inset-0 z-50 overflow-auto flex flex-col justify-center py-4 px-4' : 'py-8 px-4'}`}>
      {/* Tab Switch Warning Modal */}
      {showTabWarning && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-red-500`}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Tab Switch Detected!</h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              You have switched tabs <span className="font-bold text-red-600 dark:text-red-400">{tabSwitchCount}</span> time(s).
            </p>
            <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
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
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-amber-500`}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
              <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">📷 Permission Required</h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              {permissionDeniedMessage}
            </p>
            <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
              This is a proctored test. Camera and microphone access are mandatory to ensure test integrity.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  requestPermissionsAndStart();
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/dashboard?section=skilltest')}
                className={`w-full px-6 py-3 ${themeClasses.buttonSecondary} rounded-xl font-medium transition-all`}
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
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-orange-500`}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <svg className="h-10 w-10 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">🖥️ Fullscreen Required!</h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              You have exited fullscreen mode <span className="font-bold text-orange-600 dark:text-orange-400">{fullscreenExitCount}</span> time(s).
            </p>
            <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
              This test must be taken in fullscreen mode to prevent cheating. Please click below to re-enter fullscreen and continue.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
            >
              🔲 Re-enter Fullscreen
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
        {testReady && !started && (
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 mb-6 border-2 ${themeClasses.cardBorder}`}>
            <div className="flex flex-col items-center text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4 shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-2`}>Your Test is Ready</h3>
              <p className={`${themeClasses.textSecondary} mb-4 max-w-md`}>
                A personalized assessment has been generated based on your skills.
              </p>
              
              {/* Test Info */}
              <div className={`flex items-center gap-6 mb-6 text-sm ${themeClasses.textSecondary}`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{testData?.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">⚠️ IMPORTANT WARNINGS</p>
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
              <p className={`text-xs ${themeClasses.textSecondary} mb-4 max-w-md`}>
                By clicking "Begin Assessment", you acknowledge that you have read and understood all the rules above.
              </p>
              
              <div className="space-y-3 w-full">
                <button
                  onClick={requestPermissionsAndStart}
                  disabled={requestingPermissions}
                  className="w-full px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 dark:hover:from-pink-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                  onClick={() => navigate('/dashboard?section=skilltest')}
                  className={`w-full px-8 py-3 ${themeClasses.buttonSecondary} rounded-xl font-medium transition-colors border-2 ${themeClasses.cardBorder}`}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        {(started || !testReady) && (
          <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-6 mb-6 border-2 ${themeClasses.cardBorder}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.textPrimary}`}>
                  {testData?.testTitle || 'Skills Assessment'}
                </h2>
                {testData?.week && testData?.month ? (
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Month {testData.month} • Week {testData.week}
                  </p>
                ) : (
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Answer each question within the time limit</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-xs ${themeClasses.textSecondary} uppercase tracking-wide`}>Question</div>
                  <div className={`text-lg font-bold ${themeClasses.textPrimary}`}>
                    {currentQuestionIndex + 1} <span className="text-gray-400 font-normal">/ {testData?.totalQuestions}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl font-mono text-lg font-bold ${
                  secondsLeft <= 10 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <div className={`w-full ${themeClasses.sectionBackground} rounded-full h-2`}>
                <div
                  className={`${themeClasses.gradient} h-2 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="absolute -top-1 transition-all duration-500" style={{ left: `calc(${progress}% - 8px)` }}>
                <div className={`w-4 h-4 ${themeClasses.cardBackground} border-2 ${themeClasses.cardBorder} ${themeClasses.accent} rounded-full shadow-sm`}></div>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        {(started || !testReady) && (
          <div ref={questionRef} className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 mb-6 border-2 ${themeClasses.cardBorder}`}>
          {/* Skill & Difficulty Badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium">
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
          <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-8 leading-relaxed`}>
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
                    ? 'border-amber-500 dark:border-pink-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                    : `border-2 ${themeClasses.cardBorder} hover:border-indigo-300 dark:hover:border-indigo-600 ${themeClasses.cardHover}`
                } ${showFeedback || submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg border-2 mr-4 flex items-center justify-center font-semibold text-sm transition-all ${
                    selectedAnswer === index 
                      ? 'border-amber-500 dark:border-pink-500 bg-indigo-500 text-white' 
                      : `${themeClasses.cardBorder} ${themeClasses.textSecondary}`
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`${themeClasses.textPrimary} flex-1`}>{option}</span>
                  {selectedAnswer === index && (
                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
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
                  ? `${themeClasses.buttonSecondary} cursor-not-allowed opacity-50`
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
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

export default SkillsTest;

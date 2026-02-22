import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Send, StopCircle, Play, MessageCircle, AlertCircle, Loader2, Clock, ChevronRight, Award, Target, TrendingUp, BookOpen, Star, Users, Briefcase, Zap, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// ============ 3D Animated Avatar Component ============
function AnimatedAvatar({ isSpeaking }) {
  const headRef = useRef();
  const mouthRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const bodyRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      headRef.current.position.y = 1.0 + Math.sin(time * 0.8) * 0.02;
    }
    if (mouthRef.current) {
      const mouthScale = isSpeaking ? 1 + Math.sin(time * 8) * 0.4 + Math.sin(time * 12) * 0.2 : 1;
      mouthRef.current.scale.y = Math.max(0.3, mouthScale);
      mouthRef.current.scale.x = isSpeaking ? 1 + Math.sin(time * 6) * 0.15 : 1;
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    }
  });

  return (
    <group>
      {/* Body - torso */}
      <mesh ref={bodyRef} position={[0, -0.3, 0]}>
        <boxGeometry args={[1.0, 1.2, 0.5]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      {/* Shoulders */}
      <mesh position={[-0.65, 0.15, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      <mesh position={[0.65, 0.15, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.25, 16]} />
        <meshStandardMaterial color="#a78bfa" />
      </mesh>
      {/* Head */}
      <group ref={headRef} position={[0, 1.0, 0]}>
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color="#818cf8" />
        </mesh>
        {/* Left Eye */}
        <group position={[-0.14, 0.06, 0.36]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh ref={leftEyeRef} position={[0, 0, 0.04]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#1e1b4b" />
          </mesh>
        </group>
        {/* Right Eye */}
        <group position={[0.14, 0.06, 0.36]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0, 0, 0.04]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="#1e1b4b" />
          </mesh>
        </group>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.13, 0.38]}>
          <boxGeometry args={[0.16, 0.05, 0.04]} />
          <meshStandardMaterial color="#ec4899" />
        </mesh>
      </group>
      {/* Speaking indicator rings */}
      {isSpeaking && (
        <>
          <mesh position={[0, 1.0, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.52, 0.55, 32]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, 1.0, 0]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.62, 0.64, 32]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0.25} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============ Score Helper Functions ============
const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-green-500/20 border-green-500/30';
  if (score >= 60) return 'bg-blue-500/20 border-blue-500/30';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-red-500/20 border-red-500/30';
};

const getScoreGradient = (score) => {
  if (score >= 80) return { stroke: '#22c55e', bg: 'from-green-500/20 to-emerald-500/20' };
  if (score >= 60) return { stroke: '#3b82f6', bg: 'from-blue-500/20 to-indigo-500/20' };
  if (score >= 40) return { stroke: '#eab308', bg: 'from-yellow-500/20 to-orange-500/20' };
  return { stroke: '#ef4444', bg: 'from-red-500/20 to-pink-500/20' };
};

const getRecommendationStyle = (rec) => {
  const r = (rec || '').toLowerCase();
  if (r.includes('strong hire')) return { bg: 'bg-green-500/20 border-green-500/40', text: 'text-green-400', icon: '🌟' };
  if (r.includes('hire')) return { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-400', icon: '✅' };
  if (r.includes('maybe')) return { bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'text-yellow-400', icon: '🤔' };
  return { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', icon: '❌' };
};

const AIInterview = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const { isAuthenticated } = useAuth();

  // Interview state
  const [sessionId, setSessionId] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 min
  const [feedback, setFeedback] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [feedbackTab, setFeedbackTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);

  // Setup form state
  const [setupName, setSetupName] = useState('');
  const [setupPosition, setSetupPosition] = useState('Software Developer');

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const sessionIdRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isAISpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const webcamStreamRef = useRef(null);
  const lastSubmittedTextRef = useRef('');

  // === Clean transcript: remove consecutive duplicate words/phrases ===
  const cleanTranscript = useCallback((text) => {
    if (!text) return '';
    // Split into words
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return '';
    
    // Remove consecutive duplicate words (e.g., "I am I am" -> "I am")
    const cleaned = [words[0]];
    for (let i = 1; i < words.length; i++) {
      if (words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
        cleaned.push(words[i]);
      }
    }
    
    // Also detect repeated phrases (2-3 word patterns)
    let result = cleaned.join(' ');
    // Remove repeated 2-word phrases like "I am I am"
    result = result.replace(/(\b\w+\s+\w+\b)\s+\1/gi, '$1');
    // Remove repeated 3-word phrases
    result = result.replace(/(\b\w+\s+\w+\s+\w+\b)\s+\1/gi, '$1');
    
    return result.trim();
  }, []);

  const useBrowserRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Keep refs in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isAISpeakingRef.current = isAISpeaking; }, [isAISpeaking]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { interviewStartedRef.current = interviewStarted; }, [interviewStarted]);

  // Load user data from localStorage
  useEffect(() => {
    try {
      const linkedRaw = localStorage.getItem('linkedResumeData');
      const userRaw = localStorage.getItem('userData');
      const predRaw = localStorage.getItem('predictionFormData');
      let name = '';
      if (linkedRaw) { const d = JSON.parse(linkedRaw); name = d.name || ''; }
      if (!name && userRaw) { const d = JSON.parse(userRaw); name = d.name || ''; }
      if (!name && predRaw) { const d = JSON.parse(predRaw); name = d.name || ''; }
      if (name) setSetupName(name);
    } catch (e) { /* ignore */ }
  }, []);

  // Preload voices
  useEffect(() => {
    const loadVoices = () => synthRef.current?.getVoices();
    loadVoices();
    if (synthRef.current) synthRef.current.onvoiceschanged = loadVoices;
  }, []);

  // Timer
  useEffect(() => {
    if (interviewStarted && !interviewEnded && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStarted, interviewEnded]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, currentMessage, interimTranscript]);

  // Webcam - attach stream to video element when available
  useEffect(() => {
    if (webcamStream && videoRef.current && cameraEnabled) {
      console.log('[Camera] Setting video srcObject, interviewStarted:', interviewStarted);
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play()
        .then(() => console.log('[Camera] Video playing'))
        .catch((e) => console.warn('[Camera] Video play error:', e));
    }
  }, [webcamStream, cameraEnabled, interviewStarted]); // Added interviewStarted to trigger when interview screen renders

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
      if (synthRef.current) synthRef.current.cancel();
      // Use ref for reliable cleanup on unmount
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
        webcamStreamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUserMobile = () => {
    try {
      const linkedData = localStorage.getItem('linkedResumeData');
      const userData = localStorage.getItem('userData');
      const predictionData = localStorage.getItem('predictionFormData');
      if (linkedData) { const p = JSON.parse(linkedData); if (p.mobile || p.phoneNumber) return p.mobile || p.phoneNumber; }
      if (userData) { const p = JSON.parse(userData); if (p.mobile || p.phoneNumber) return p.mobile || p.phoneNumber; }
      if (predictionData) { const p = JSON.parse(predictionData); if (p.mobile || p.phoneNumber) return p.mobile || p.phoneNumber; }
    } catch (e) {}
    return '';
  };

  // === Speech Recognition Setup ===
  const setupRecognition = useCallback(() => {
    if (!useBrowserRecognition) return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let silenceTimer = null;
    let accumulatedTranscript = '';
    const SILENCE_THRESHOLD = 2500; // Increased from 1500ms to give users more time to finish speaking

    recognition.onstart = () => { setIsListening(true); setError(null); accumulatedTranscript = ''; };

    recognition.onresult = (event) => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t; else interim += t;
      }
      if (final) { accumulatedTranscript += ' ' + final; accumulatedTranscript = accumulatedTranscript.trim(); }
      const displayText = (accumulatedTranscript + ' ' + interim).trim();
      setInterimTranscript(displayText || interim || '');

      if (final && accumulatedTranscript.trim().length > 2) {
        silenceTimer = setTimeout(() => {
          let text = accumulatedTranscript.trim();
          // Clean duplicate words/phrases
          text = cleanTranscript(text);
          const words = text.split(/\s+/).length;
          // Skip if identical to last submitted text (prevents resubmission)
          if (text.toLowerCase() === lastSubmittedTextRef.current.toLowerCase()) {
            console.log('[Speech] Skipping duplicate submission:', text);
            accumulatedTranscript = '';
            return;
          }
          if (text.length > 5 && words >= 2 && !isProcessingRef.current) {
            setIsProcessing(true); isProcessingRef.current = true;
            lastSubmittedTextRef.current = text;
            accumulatedTranscript = '';
            setInterimTranscript('');
            try { recognition.stop(); } catch (e) {}
            handleUserSpeech(text);
          }
        }, SILENCE_THRESHOLD);
      }
    };

    recognition.onerror = (event) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        setError('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
        setTimeout(() => {
          if (interviewStartedRef.current && !isAISpeakingRef.current && !isProcessingRef.current) {
            try { recognition.start(); } catch (e) {}
          }
        }, 300);
      }
    };

    recognition.onend = () => {
      setIsListening(false); setInterimTranscript('');
      if (isProcessingRef.current) { accumulatedTranscript = ''; return; }
      if (accumulatedTranscript.trim().length > 5) {
        let text = accumulatedTranscript.trim();
        text = cleanTranscript(text);
        // Skip if identical to last submitted
        if (text.toLowerCase() === lastSubmittedTextRef.current.toLowerCase()) {
          console.log('[Speech] Skipping duplicate on end:', text);
          accumulatedTranscript = '';
          return;
        }
        setIsProcessing(true); isProcessingRef.current = true;
        lastSubmittedTextRef.current = text;
        accumulatedTranscript = '';
        handleUserSpeech(text);
      } else {
        setTimeout(() => {
          if (interviewStartedRef.current && !isAISpeakingRef.current && !isProcessingRef.current) {
            try { recognition.start(); setIsListening(true); } catch (e) {}
          }
        }, 300);
      }
      accumulatedTranscript = '';
    };

    return recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === TTS ===
  const speakText = useCallback((text) => {
    if (!audioEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; utterance.pitch = 1.0; utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const preferred = ['Microsoft Zira', 'Microsoft David', 'Google US English', 'Samantha', 'Alex', 'Daniel'];
    let selectedVoice = null;
    for (const n of preferred) { const v = voices.find(v => v.name.includes(n)); if (v) { selectedVoice = v; break; } }
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => { setIsAISpeaking(true); };
    utterance.onend = () => {
      setIsAISpeaking(false); isAISpeakingRef.current = false;
      if (interviewStartedRef.current && !showTextInput) {
        setTimeout(() => { if (!isAISpeakingRef.current) startListening(); }, 200);
      }
    };
    utterance.onerror = () => {
      setIsAISpeaking(false); isAISpeakingRef.current = false;
      if (interviewStartedRef.current && !showTextInput) {
        setTimeout(() => startListening(), 200);
      }
    };
    synthRef.current.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioEnabled, showTextInput]);

  // === Start Listening ===
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = setupRecognition();
    }
    if (!recognitionRef.current) return;

    if (isAISpeakingRef.current) {
      synthRef.current?.cancel();
      setIsAISpeaking(false); isAISpeakingRef.current = false;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      if (e.message?.includes('already started')) setIsListening(true);
    }
  }, [setupRecognition]);

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  // === Handle user speech ===
  const handleUserSpeech = async (transcript) => {
    const currentSessionId = sessionIdRef.current || sessionId;
    if (!currentSessionId) {
      setIsProcessing(false); isProcessingRef.current = false;
      setError('No active session.');
      return;
    }
    setInterimTranscript('');
    if (recognitionRef.current && isListeningRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    if (!isProcessingRef.current) { setIsProcessing(true); isProcessingRef.current = true; }
    setConversationHistory(prev => [...prev, { role: 'user', content: transcript }]);

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, message: transcript })
      });
      const data = await response.json();

      setIsProcessing(false); isProcessingRef.current = false;

      if (data.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
        setCurrentMessage(data.message);
        if (data.state === 'closing') {
          setTimeout(() => endInterview(), 3000);
        }
        if (audioEnabled) speakText(data.message);
        else setTimeout(() => { if (interviewStartedRef.current) startListening(); }, 500);
      } else {
        // Check if session expired
        if (data.session_expired) {
          setError('Session expired. Please restart the interview.');
          // Remove the user message we optimistically added
          setConversationHistory(prev => prev.slice(0, -1));
        } else {
          setError(data.error || 'Failed to get response');
          setTimeout(() => { if (interviewStartedRef.current) startListening(); }, 2000);
        }
      }
    } catch (err) {
      setIsProcessing(false); isProcessingRef.current = false;
      setError('Connection error. Retrying...');
      // Remove the user message we optimistically added
      setConversationHistory(prev => prev.slice(0, -1));
      setTimeout(() => { setError(null); if (interviewStartedRef.current) startListening(); }, 2000);
    }
  };

  // === Start Interview ===
  const startInterview = async () => {
    if (!setupName.trim()) { setError('Please enter your name'); return; }
    setIsProcessing(true); setError(null);

    // Setup camera - store stream locally and in ref for reliable cleanup
    let cameraStream = null;
    if (cameraEnabled) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        webcamStreamRef.current = cameraStream;
        setWebcamStream(cameraStream);
      } catch (e) { console.warn('Camera not available:', e); setCameraEnabled(false); }
    }

    // Setup speech recognition
    recognitionRef.current = setupRecognition();

    try {
      const phone = getUserMobile();
      const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: setupName, phone_number: phone, position: setupPosition })
      });
      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id); sessionIdRef.current = data.session_id;
        lastSubmittedTextRef.current = ''; // Reset for new session
        setInterviewStarted(true);
        interviewStartedRef.current = true;
        setConversationHistory([{ role: 'assistant', content: data.message }]);
        setCurrentMessage(data.message);
        setIsProcessing(false);
        
        // Request fullscreen for immersive interview experience
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
          }
        } catch (e) { console.warn('[Fullscreen] Could not enter fullscreen:', e); }
        
        // Ensure video stream is attached after interview screen renders
        setTimeout(() => {
          if (videoRef.current && cameraStream) {
            console.log('[Camera] Attaching stream after interview start');
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch(e => console.warn('[Camera] Play error:', e));
          }
        }, 100);
        if (audioEnabled) speakText(data.message);
        else setTimeout(() => startListening(), 1000);
      } else {
        setError(data.error || 'Failed to start interview');
        setIsProcessing(false);
      }
    } catch (err) {
      setError('Could not connect to server. Make sure the backend is running.');
      setIsProcessing(false);
    }
  };

  // === End Interview ===
  const endInterview = async () => {
    setInterviewEnded(true); setInterviewStarted(false);
    interviewStartedRef.current = false;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
    if (synthRef.current) synthRef.current.cancel();
    setIsAISpeaking(false); setIsListening(false);

    // Exit fullscreen when interview ends
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
      }
    } catch (e) { console.warn('[Fullscreen] Could not exit fullscreen:', e); }

    // Stop camera and clear video element - use ref for reliable cleanup
    const streamToStop = webcamStreamRef.current || webcamStream;
    if (streamToStop) { 
      console.log('[Camera] Stopping camera tracks');
      streamToStop.getTracks().forEach(t => t.stop()); 
      webcamStreamRef.current = null;
      setWebcamStream(null); 
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);

    const currentSessionId = sessionIdRef.current || sessionId;
    if (currentSessionId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/interview/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: currentSessionId })
        });
        const data = await response.json();
        if (data.success) setFeedback(data.feedback);
      } catch (e) { console.error('Error ending interview:', e); }
    }
  };

  // === Text submit ===
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    handleUserSpeech(textInput.trim());
    setTextInput('');
  };

  // === Restart ===
  const restartInterview = () => {
    setSessionId(null); setInterviewStarted(false); setInterviewEnded(false);
    setConversationHistory([]); setCurrentMessage(''); setFeedback(null);
    setTimeRemaining(600); setError(null); setIsProcessing(false);
    setIsListening(false); setIsAISpeaking(false); setInterimTranscript('');
  };

  // ====== RENDER ======

  // Pre-interview setup screen
  if (!interviewStarted && !interviewEnded) {
    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} py-8 px-4 transition-colors duration-300`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${themeClasses.cardBackground} rounded-3xl shadow-2xl p-8 border ${themeClasses.cardBorder}`}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`mx-auto w-20 h-20 ${themeClasses.gradient} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                <MessageCircle className={`w-10 h-10 ${themeClasses.textPrimary}`} />
              </div>
              <h1 className={`text-3xl font-bold ${themeClasses.textPrimary} mb-2`}>AI Mock Interview</h1>
              <p className={`${themeClasses.textSecondary}`}>Practice with an AI interviewer and get instant feedback</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>Your Name</label>
                <input type="text" value={setupName} onChange={(e) => setSetupName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.cardBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your name" />
              </div>

              <div>
                <label className={`block text-sm font-semibold ${themeClasses.textPrimary} mb-2`}>Position</label>
                <select value={setupPosition} onChange={(e) => setSetupPosition(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.cardBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  <option value="Software Developer">Software Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Cloud Engineer">Cloud Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Mobile Developer">Mobile Developer</option>
                  <option value="QA Engineer">QA Engineer</option>
                </select>
              </div>

              {/* Audio Option */}
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${audioEnabled ? 'bg-green-500/20 border-green-500/50 text-green-400' : `${themeClasses.cardBackground} ${themeClasses.cardBorder} ${themeClasses.textSecondary}`}`}>
                  {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span className="text-sm font-medium">{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                </button>
              </div>

              {/* Browser support check */}
              {!useBrowserRecognition && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">Voice recognition not supported. Use Chrome or Edge for voice features. Text input will be available.</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button onClick={startInterview} disabled={isProcessing}
                className={`w-full ${themeClasses.buttonPrimary} font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl disabled:opacity-50`}>
                {isProcessing ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Starting...</>
                ) : (
                  <><Play className="w-6 h-6" /> Start Interview</>
                )}
              </button>

              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className={`w-full py-3 px-6 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.textSecondary} hover:${themeClasses.textPrimary} transition-all duration-200 flex items-center justify-center gap-2`}
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🎤', title: 'Voice Powered', desc: 'Speak naturally with AI' },
                { icon: '🧠', title: 'AI Questions', desc: 'Adaptive difficulty' },
                { icon: '📊', title: 'Instant Feedback', desc: 'Detailed analysis' }
              ].map((f, i) => (
                <div key={i} className={`text-center p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <h3 className={`text-sm font-semibold ${themeClasses.textPrimary}`}>{f.title}</h3>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Feedback screen ===
  if (interviewEnded) {
    const analysis = feedback?.analysis || {};
    const scores = analysis.scores || {};
    const scorecard = feedback?.scorecard || {};
    const perfLevel = analysis.performance_level || {};
    const overallScore = analysis.overall_score || feedback?.overall_score || 0;
    const gradient = getScoreGradient(overallScore);
    const activeTab = feedbackTab;

    const tabs = [
      { id: 'overview', label: 'Overview', icon: <Target size={16} /> },
      { id: 'scores', label: 'Scores', icon: <Award size={16} /> },
      { id: 'feedback', label: 'Feedback', icon: <BookOpen size={16} /> },
      { id: 'guidance', label: 'Guidance', icon: <Briefcase size={16} /> }
    ];

    return (
      <div className={`min-h-screen ${themeClasses.pageBackground} py-8 px-4 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto">
          <div className={`${themeClasses.cardBackground} rounded-3xl shadow-2xl p-8 border ${themeClasses.cardBorder}`}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{perfLevel.emoji || '🎉'}</div>
              <h1 className={`text-3xl font-bold ${themeClasses.textPrimary} mb-2`}>Interview Complete!</h1>
              <p className={`${themeClasses.textSecondary}`}>
                {perfLevel.level ? `${perfLevel.level} - ${perfLevel.description}` : `Great job, ${setupName}! Here's your performance summary.`}
              </p>
            </div>

            {/* Early termination warning */}
            {analysis.early_termination?.detected && (
              <div className={`mb-6 p-4 rounded-xl border ${analysis.early_termination.severity === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className={analysis.early_termination.severity === 'high' ? 'text-red-400' : 'text-yellow-400'} />
                  <span className={`text-sm font-medium ${analysis.early_termination.severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {analysis.early_termination.message}
                  </span>
                </div>
              </div>
            )}

            {feedback ? (
              <>
                {/* Overall Score Circle */}
                <div className={`text-center p-8 rounded-2xl bg-gradient-to-br ${gradient.bg} shadow-lg mb-6 border ${themeClasses.cardBorder}`}>
                  <div className="relative inline-block">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                      <circle cx="80" cy="80" r="68" fill="none" stroke={gradient.stroke} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${(overallScore / 100) * 427} 427`} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-5xl font-bold ${themeClasses.textPrimary}`}>{overallScore}</span>
                      <span className={`text-xs ${themeClasses.textSecondary} mt-1`}>out of 100</span>
                    </div>
                  </div>
                  <p className={`mt-3 text-sm font-medium ${themeClasses.textSecondary}`}>
                    {perfLevel.level || 'Overall Score'}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className={`p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} text-center`}>
                    <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{feedback.questions_answered || 0}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Questions</div>
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} text-center`}>
                    <div className={`text-2xl font-bold ${themeClasses.textPrimary}`}>{feedback.duration_minutes || 0}m</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Duration</div>
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} text-center`}>
                    <div className={`text-2xl font-bold ${getScoreColor(scores.technical_knowledge || 0)}`}>{scores.technical_knowledge || '-'}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Technical</div>
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} text-center`}>
                    <div className={`text-2xl font-bold ${getScoreColor(scores.communication || 0)}`}>{scores.communication || '-'}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Communication</div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-1 p-1 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} mb-6`}>
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setFeedbackTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? `${themeClasses.gradient} ${themeClasses.textPrimary} shadow`
                          : `${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`
                      }`}>
                      {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {/* ===== OVERVIEW TAB ===== */}
                  {activeTab === 'overview' && (
                    <>
                      {/* Strengths */}
                      {(analysis.strengths || feedback.strengths || []).length > 0 && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <span className="text-green-400">✓</span> Strengths
                          </h3>
                          <div className="space-y-3">
                            {(analysis.strengths || feedback.strengths || []).map((s, i) => (
                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10`}>
                                <Star size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                <span className={`text-sm ${themeClasses.textSecondary}`}>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {(analysis.improvements || feedback.areas_for_improvement || []).length > 0 && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <TrendingUp size={18} className="text-orange-400" /> Areas for Improvement
                          </h3>
                          <div className="space-y-3">
                            {(analysis.improvements || feedback.areas_for_improvement || []).map((s, i) => (
                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10`}>
                                <ChevronRight size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                <span className={`text-sm ${themeClasses.textSecondary}`}>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Feedback */}
                      {(analysis.detailed_feedback || feedback.detailed_analysis) && (
                        <div className={`p-6 rounded-xl bg-blue-500/10 border border-blue-500/20`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>📝 Overall Assessment</h3>
                          <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                            {analysis.detailed_feedback || feedback.detailed_analysis}
                          </p>
                        </div>
                      )}

                      {/* Tips */}
                      {feedback.tips && feedback.tips.length > 0 && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <Zap size={18} className="text-yellow-400" /> Personalized Tips
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {feedback.tips.map((tip, i) => (
                              <div key={i} className={`flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10`}>
                                <span className="text-yellow-400 text-sm mt-0.5">💡</span>
                                <span className={`text-sm ${themeClasses.textSecondary}`}>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ===== SCORES TAB ===== */}
                  {activeTab === 'scores' && (
                    <>
                      {/* Scorecard Categories */}
                      {scorecard.categories && scorecard.categories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {scorecard.categories.map((cat, i) => {
                            const catGrad = getScoreGradient(cat.score);
                            return (
                              <div key={i} className={`p-5 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.sectionBackground}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className={`font-semibold text-sm ${themeClasses.textPrimary}`}>{cat.name}</span>
                                  </div>
                                  <span className={`text-2xl font-bold ${getScoreColor(cat.score)}`}>{cat.score}</span>
                                </div>
                                <p className={`text-xs ${themeClasses.textSecondary} mb-3`}>{cat.description}</p>
                                {/* Progress bar */}
                                <div className="w-full bg-gray-700/30 rounded-full h-2">
                                  <div className="h-2 rounded-full transition-all duration-700" 
                                    style={{ width: `${cat.score}%`, backgroundColor: catGrad.stroke }} />
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getScoreBg(cat.score)} ${getScoreColor(cat.score)}`}>
                                    {cat.level}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Fallback: show scores directly if no scorecard */
                        Object.keys(scores).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(scores).map(([key, value]) => {
                              const catGrad = getScoreGradient(value);
                              return (
                                <div key={key} className={`p-5 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.sectionBackground}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className={`font-semibold text-sm ${themeClasses.textPrimary}`}>
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                    <span className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</span>
                                  </div>
                                  <div className="w-full bg-gray-700/30 rounded-full h-2">
                                    <div className="h-2 rounded-full transition-all duration-700"
                                      style={{ width: `${value}%`, backgroundColor: catGrad.stroke }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}

                      {/* Response Quality */}
                      {analysis.response_quality && (
                        <div className={`p-5 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-sm font-semibold ${themeClasses.textPrimary} mb-3`}>📊 Response Analytics</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center">
                              <div className={`text-lg font-bold ${themeClasses.textPrimary}`}>{analysis.response_quality.avg_length}</div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Avg Words</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${themeClasses.textPrimary}`}>{analysis.response_quality.detail_score}%</div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Detail Level</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold text-green-400`}>{analysis.response_quality.technical_keywords}</div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Tech Keywords</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-bold ${analysis.response_quality.casual_count > 3 ? 'text-red-400' : 'text-green-400'}`}>
                                {analysis.response_quality.casual_count}
                              </div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Casual Phrases</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ===== FEEDBACK TAB ===== */}
                  {activeTab === 'feedback' && (
                    <>
                      {/* Knowledge Assessment */}
                      {analysis.knowledge_assessment && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <BookOpen size={18} className="text-indigo-400" /> Knowledge Assessment
                          </h3>
                          
                          {/* Depth indicator */}
                          <div className={`mb-4 flex items-center gap-2`}>
                            <span className={`text-xs ${themeClasses.textSecondary}`}>Knowledge Depth:</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              analysis.knowledge_assessment.depth_of_knowledge === 'deep' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              analysis.knowledge_assessment.depth_of_knowledge === 'moderate' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {(analysis.knowledge_assessment.depth_of_knowledge || 'N/A').charAt(0).toUpperCase() + (analysis.knowledge_assessment.depth_of_knowledge || 'N/A').slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Demonstrated Skills */}
                            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                              <h4 className={`text-sm font-medium text-green-400 mb-2`}>✅ Demonstrated Skills</h4>
                              <div className="flex flex-wrap gap-2">
                                {(analysis.knowledge_assessment.demonstrated_skills || []).map((skill, i) => (
                                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                                    {skill}
                                  </span>
                                ))}
                                {(!analysis.knowledge_assessment.demonstrated_skills || analysis.knowledge_assessment.demonstrated_skills.length === 0) && (
                                  <span className={`text-xs ${themeClasses.textSecondary}`}>No specific skills identified</span>
                                )}
                              </div>
                            </div>

                            {/* Skill Gaps */}
                            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                              <h4 className={`text-sm font-medium text-red-400 mb-2`}>⚠️ Skill Gaps</h4>
                              <div className="flex flex-wrap gap-2">
                                {(analysis.knowledge_assessment.skill_gaps || []).map((gap, i) => (
                                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                                    {gap}
                                  </span>
                                ))}
                                {(!analysis.knowledge_assessment.skill_gaps || analysis.knowledge_assessment.skill_gaps.length === 0) && (
                                  <span className={`text-xs ${themeClasses.textSecondary}`}>No gaps identified</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Communication Feedback */}
                      {analysis.communication_feedback && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <Users size={18} className="text-purple-400" /> Communication Analysis
                          </h3>
                          <div className="space-y-3">
                            {Object.entries(analysis.communication_feedback).map(([key, value]) => (
                              <div key={key} className={`flex items-start gap-3 p-3 rounded-lg ${themeClasses.cardBackground} border ${themeClasses.cardBorder}`}>
                                <span className="text-purple-400 text-sm mt-0.5">
                                  {key === 'clarity' ? '🎯' : key === 'structure' ? '🏗️' : '📚'}
                                </span>
                                <div>
                                  <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </span>
                                  <p className={`text-xs ${themeClasses.textSecondary} mt-0.5`}>{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ===== GUIDANCE TAB ===== */}
                  {activeTab === 'guidance' && (
                    <>
                      {/* Hiring Recommendation */}
                      {analysis.interviewer_guidance && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <Briefcase size={18} className="text-blue-400" /> Interviewer's Assessment
                          </h3>
                          
                          {/* Recommendation badge */}
                          {(() => {
                            const recStyle = getRecommendationStyle(analysis.interviewer_guidance.hiring_recommendation);
                            return (
                              <div className={`p-4 rounded-xl ${recStyle.bg} border mb-4`}>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{recStyle.icon}</span>
                                  <div>
                                    <div className={`text-lg font-bold ${recStyle.text}`}>
                                      {analysis.interviewer_guidance.hiring_recommendation}
                                    </div>
                                    <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                                      {analysis.interviewer_guidance.reasoning}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Follow-up Areas */}
                          {analysis.interviewer_guidance.follow_up_areas && analysis.interviewer_guidance.follow_up_areas.length > 0 && (
                            <div>
                              <h4 className={`text-sm font-medium ${themeClasses.textPrimary} mb-2`}>Suggested Follow-up Areas:</h4>
                              <div className="space-y-2">
                                {analysis.interviewer_guidance.follow_up_areas.map((area, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-sm ${themeClasses.textSecondary}`}>
                                    <ChevronRight size={14} className="text-blue-400" />
                                    {area}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tips */}
                      {feedback.tips && feedback.tips.length > 0 && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <Zap size={18} className="text-yellow-400" /> Tips for Next Time
                          </h3>
                          <div className="space-y-3">
                            {feedback.tips.map((tip, i) => (
                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10`}>
                                <span className="text-yellow-400 flex-shrink-0">💡</span>
                                <span className={`text-sm ${themeClasses.textSecondary}`}>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance Level Summary */}
                      {perfLevel.level && (
                        <div className={`p-6 rounded-xl bg-gradient-to-br ${gradient.bg} border ${themeClasses.cardBorder}`}>
                          <div className="flex items-center gap-4">
                            <span className="text-4xl">{perfLevel.emoji}</span>
                            <div>
                              <h3 className={`text-lg font-bold ${themeClasses.textPrimary}`}>Performance: {perfLevel.level}</h3>
                              <p className={`text-sm ${themeClasses.textSecondary}`}>{perfLevel.description}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Loader2 className={`w-10 h-10 ${themeClasses.textSecondary} animate-spin mx-auto mb-4`} />
                <p className={`${themeClasses.textSecondary} text-lg`}>Analyzing your interview with AI...</p>
                <p className={`${themeClasses.textSecondary} text-sm mt-2`}>This may take a few seconds</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <button onClick={restartInterview}
                className={`${themeClasses.buttonPrimary} font-semibold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg`}>
                <Play className="w-5 h-5" /> New Interview
              </button>
              <button onClick={() => navigate('/dashboard?section=interview')}
                className={`${themeClasses.buttonSecondary} font-semibold py-3 px-6 rounded-xl flex items-center gap-2`}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === Active Interview Screen (Picture-in-Picture layout) ===
  return (
    <div className={`h-screen ${themeClasses.pageBackground} transition-colors duration-300 flex flex-col overflow-hidden`}>

      {/* ===== MAIN VIDEO AREA - User's camera fullscreen ===== */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* User's Camera - Full Screen Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950">
          {/* Always render video element */}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-200 -scale-x-100 ${cameraEnabled && webcamStream ? 'opacity-100' : 'opacity-0'}`} 
          />
          {/* Show placeholder when camera is off */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-500 transition-opacity duration-200 ${cameraEnabled && webcamStream ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <span className="text-6xl">👤</span>
            </div>
            <span className={`text-lg ${themeClasses.textSecondary}`}>{setupName || 'You'}</span>
            <span className="text-sm text-gray-600 mt-1">Camera is off</span>
          </div>
          {/* User name label - bottom left */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            <div className="flex items-center gap-2 bg-black/60 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
              <span className="font-medium text-base">👤 {setupName || 'You'}</span>
              {isListening && <Mic size={16} className="text-green-400 animate-pulse" />}
            </div>
          </div>
          {/* Listening indicator border */}
          {isListening && (
            <div className="absolute inset-0 border-4 border-green-500/40 pointer-events-none" />
          )}
        </div>

        {/* AI Avatar - Floating PiP in top-left */}
        <div className="absolute top-4 left-4 w-64 h-48 md:w-80 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/30 shadow-2xl z-20">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-4xl animate-pulse">🤖</div>
            </div>
          }>
            <Canvas camera={{ position: [0, 0.5, 3.2], fov: 50 }} style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[2, 3, 2]} intensity={0.8} />
              <pointLight position={[-2, 2, 1]} intensity={0.4} color="#818cf8" />
              <AnimatedAvatar isSpeaking={isAISpeaking} />
              <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
            </Canvas>
          </Suspense>
          {/* AI name label */}
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
              <span className="font-medium">🤖 Alex</span>
              {isAISpeaking && <Volume2 size={12} className="text-blue-400 animate-pulse" />}
            </div>
          </div>
          {/* Speaking glow */}
          {isAISpeaking && (
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/60 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* === SUBTITLE / CAPTION BAR (between video and controls) === */}
        {(currentMessage || (isListening && interimTranscript)) && (
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto px-4 pb-3 space-y-2">
              {/* AI message subtitle */}
              {currentMessage && (
                <div className="flex items-start gap-2 bg-black/70 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-lg">
                  <span className="text-blue-400 font-semibold text-sm flex-shrink-0">🤖 Alex:</span>
                  <p className="text-sm leading-relaxed">{currentMessage.slice(0, 300)}{currentMessage.length > 300 ? '...' : ''}</p>
                </div>
              )}
              {/* User speech subtitle */}
              {isListening && interimTranscript && (
                <div className="flex items-start gap-2 bg-black/60 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-lg">
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-semibold text-sm">You:</span>
                  </div>
                  <p className="text-sm leading-relaxed italic">{interimTranscript}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Sidebar (toggleable, like Zoom's chat panel) */}
        {showChat && (
          <div className={`w-full md:w-96 ${themeClasses.cardBackground} border-l ${themeClasses.cardBorder} flex flex-col absolute md:relative inset-0 md:inset-auto z-10`}>
            {/* Chat header */}
            <div className={`px-4 py-3 border-b ${themeClasses.cardBorder} flex items-center justify-between`}>
              <span className={`text-sm font-semibold ${themeClasses.textPrimary}`}>Chat</span>
              <button onClick={() => setShowChat(false)} className={`p-1 rounded-lg ${themeClasses.hover} ${themeClasses.textSecondary}`}>
                ✕
              </button>
            </div>
            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {conversationHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? `${themeClasses.gradient} ${themeClasses.textPrimary} shadow`
                      : `${themeClasses.sectionBackground} ${themeClasses.textPrimary} border ${themeClasses.cardBorder}`
                  }`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold opacity-60">{msg.role === 'user' ? setupName : '🤖 Alex'}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className={`${themeClasses.sectionBackground} border ${themeClasses.cardBorder} rounded-2xl px-3 py-2`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className={`w-3 h-3 animate-spin ${themeClasses.textSecondary}`} />
                      <span className={`text-xs ${themeClasses.textSecondary}`}>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Text input inside chat */}
            <div className={`p-2 border-t ${themeClasses.cardBorder}`}>
              <div className="flex gap-2">
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-2 rounded-lg border ${themeClasses.cardBorder} ${themeClasses.cardBackground} ${themeClasses.textPrimary} focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs`}
                  disabled={isProcessing} />
                <button onClick={handleTextSubmit} disabled={isProcessing || !textInput.trim()}
                  className={`${themeClasses.buttonPrimary} p-2 rounded-lg disabled:opacity-50`}>
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM CONTROL BAR (Enhanced Zoom-style) ===== */}
      <div className={`${themeClasses.cardBackground} border-t ${themeClasses.cardBorder} px-6 py-5`}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {/* Left: Meeting info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${timeRemaining <= 60 ? 'bg-red-500/20 text-red-400' : `${themeClasses.sectionBackground} ${themeClasses.textSecondary}`} font-mono text-base font-bold`}>
              <Clock size={18} />
              {formatTime(timeRemaining)}
            </div>
            <div className="hidden sm:block">
              <p className={`text-sm ${themeClasses.textSecondary} truncate`}>
                {isAISpeaking ? '🔊 Alex is speaking...' : isProcessing ? '🤔 Alex is thinking...' : isListening ? '👂 Listening...' : `Interview • ${setupPosition}`}
              </p>
            </div>
          </div>

          {/* Center: Main controls */}
          <div className="flex items-center gap-3">
            {/* Mic */}
            <button onClick={() => { if (isListening) stopListening(); else startListening(); }}
              title={isListening ? 'Mute' : 'Unmute'}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {isListening ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            {/* Camera */}
            <button onClick={async () => {
              console.log('[Camera] Toggle clicked, current state:', { cameraEnabled, hasStream: !!webcamStream });
              const streamToStop = webcamStreamRef.current || webcamStream;
              if (cameraEnabled && streamToStop) {
                console.log('[Camera] Stopping camera...');
                streamToStop.getTracks().forEach(t => t.stop());
                webcamStreamRef.current = null;
                setWebcamStream(null);
                setCameraEnabled(false);
                if (videoRef.current) videoRef.current.srcObject = null;
              } else {
                try {
                  console.log('[Camera] Requesting camera access...');
                  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
                  console.log('[Camera] Got stream:', stream.id);
                  webcamStreamRef.current = stream;
                  setWebcamStream(stream);
                  setCameraEnabled(true);
                  // Also directly set to video element in case effect doesn't fire immediately
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.warn('[Camera] Immediate play error:', e));
                  }
                } catch (e) { 
                  console.error('[Camera] Error getting camera:', e);
                  setError('Camera access denied or unavailable. Please check your browser permissions.');
                }
              }
            }}
              title={cameraEnabled ? 'Stop Video' : 'Start Video'}
              className={`p-4 rounded-full transition-all ${cameraEnabled ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {cameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
            {/* Audio/Speaker */}
            <button onClick={() => { setAudioEnabled(!audioEnabled); if (audioEnabled) { synthRef.current?.cancel(); setIsAISpeaking(false); } }}
              title={audioEnabled ? 'Mute Speaker' : 'Unmute Speaker'}
              className={`p-4 rounded-full transition-all ${audioEnabled ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            {/* Chat toggle */}
            <button onClick={() => setShowChat(!showChat)}
              title="Chat"
              className={`p-4 rounded-full transition-all relative ${showChat ? 'bg-blue-500/30 text-blue-400' : 'bg-gray-600/50 hover:bg-gray-600/70 text-white'}`}>
              <MessageCircle size={24} />
              {conversationHistory.length > 0 && !showChat && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">{conversationHistory.length}</span>
                </div>
              )}
            </button>
            {/* End call */}
            <button onClick={endInterview}
              title="End Interview"
              className="p-4 px-8 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold text-base flex items-center gap-2 transition-colors ml-3 shadow-lg">
              <StopCircle size={22} /> End
            </button>
          </div>

          {/* Right: Response count */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${themeClasses.textSecondary} hidden sm:block`}>
              {conversationHistory.filter(m => m.role === 'user').length} responses
            </span>
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-red-500/90 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <AlertCircle size={16} /> {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterview;

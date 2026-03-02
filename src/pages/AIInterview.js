import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Send, StopCircle, Play, MessageCircle, AlertCircle, Loader2, Clock, ChevronRight, Award, Target, TrendingUp, BookOpen, Star, Users, Briefcase, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import interviewAnalyzer from '../utils/interviewAnalyzer';

// ============ 3D Animated Avatar Component (GLB Model) ============
function AnimatedAvatar({ isSpeaking }) {
  const groupRef = useRef();
  const lipRef = useRef(null);
  const { scene } = useGLTF('/models/arnaud_from_mapado.glb');

  // Clone scene with DEEP geometry clone so we own the vertex buffers
  const clonedScene = React.useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // MUST clone geometry to get our own position buffer
        child.geometry = child.geometry.clone();
        if (child.material) {
          child.material = child.material.clone();
        }
      }
    });
    return cloned;
  }, [scene]);

  // Compute bounding box to auto-center & scale
  const { scale: modelScale, offset } = React.useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 2.4 / maxDim;
    return { scale: s, offset: new THREE.Vector3(-center.x * s, -center.y * s - 0.3, -center.z * s) };
  }, [clonedScene]);

  // Setup lip sync vertex data
  React.useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const pos = child.geometry.attributes.position;
        if (!pos || lipRef.current) return;

        // Convert all vertices to world space to detect mouth region accurately
        // Apply parent transforms to get world positions
        child.updateWorldMatrix(true, false);
        const worldMatrix = child.matrixWorld;

        const worldPositions = [];
        const tempVec = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          tempVec.set(pos.getX(i), pos.getY(i), pos.getZ(i));
          tempVec.applyMatrix4(worldMatrix);
          worldPositions.push({ x: tempVec.x, y: tempVec.y, z: tempVec.z });
        }

        // Find world-space bounding box
        let wMinY = Infinity, wMaxY = -Infinity, wMinZ = Infinity, wMaxZ = -Infinity;
        let wMinX = Infinity, wMaxX = -Infinity;
        worldPositions.forEach(p => {
          if (p.x < wMinX) wMinX = p.x;
          if (p.x > wMaxX) wMaxX = p.x;
          if (p.y < wMinY) wMinY = p.y;
          if (p.y > wMaxY) wMaxY = p.y;
          if (p.z < wMinZ) wMinZ = p.z;
          if (p.z > wMaxZ) wMaxZ = p.z;
        });

        const height = wMaxY - wMinY;
        const width = wMaxX - wMinX;
        const depth = wMaxZ - wMinZ;
        const centerX = (wMinX + wMaxX) / 2;

        console.log('[LipSync] World bounds - X:', wMinX.toFixed(3), wMaxX.toFixed(3),
          'Y:', wMinY.toFixed(3), wMaxY.toFixed(3), 'Z:', wMinZ.toFixed(3), wMaxZ.toFixed(3));
        console.log('[LipSync] Height:', height.toFixed(3), 'Width:', width.toFixed(3));

        // In THREE.js world: Y=up, Z=towards camera (front)
        // Mouth is at: lower 30-40% of height, front-most Z, center X
        const mouthYCenter = wMinY + height * 0.37; // mouth height
        const mouthYMin = wMinY + height * 0.28;
        const mouthYMax = wMinY + height * 0.46;
        const frontThreshold = wMaxZ - depth * 0.35; // front-facing vertices
        const lipXRange = width * 0.12;

        // Store originals (LOCAL space, which is what we modify)
        const origX = new Float32Array(pos.count);
        const origY = new Float32Array(pos.count);
        const origZ = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
          origX[i] = pos.getX(i);
          origY[i] = pos.getY(i);
          origZ[i] = pos.getZ(i);
        }

        // We also need the inverse world matrix to convert
        // world-space displacement directions back to local space
        const invMatrix = worldMatrix.clone().invert();
        const worldDown = new THREE.Vector3(0, -1, 0).transformDirection(invMatrix).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0).transformDirection(invMatrix).normalize();
        const worldForward = new THREE.Vector3(0, 0, 1).transformDirection(invMatrix).normalize();

        console.log('[LipSync] Local direction for world-DOWN:', worldDown.x.toFixed(3), worldDown.y.toFixed(3), worldDown.z.toFixed(3));
        console.log('[LipSync] Local direction for world-UP:', worldUp.x.toFixed(3), worldUp.y.toFixed(3), worldUp.z.toFixed(3));

        // Classify vertices by world-space position
        const lowerLip = [], upperLip = [], chin = [], jawArea = [];

        for (let i = 0; i < pos.count; i++) {
          const wp = worldPositions[i];
          const xDist = Math.abs(wp.x - centerX);

          // Must be front-facing
          if (wp.z < frontThreshold) continue;

          // Lower lip: below mouth center, above chin
          if (wp.y >= mouthYMin && wp.y < mouthYCenter && xDist < lipXRange) {
            lowerLip.push(i);
          }
          // Upper lip: above mouth center
          else if (wp.y >= mouthYCenter && wp.y < mouthYMax && xDist < lipXRange) {
            upperLip.push(i);
          }
          // Chin area: below mouth
          else if (wp.y >= wMinY + height * 0.10 && wp.y < mouthYMin && xDist < lipXRange * 1.5) {
            chin.push(i);
          }
          // Jaw area: wider chin
          if (wp.y >= wMinY + height * 0.15 && wp.y < mouthYCenter && xDist >= lipXRange && xDist < lipXRange * 2.5 && wp.z >= frontThreshold) {
            jawArea.push(i);
          }
        }

        console.log('[LipSync] Upper lip:', upperLip.length, 'Lower lip:', lowerLip.length,
          'Chin:', chin.length, 'Jaw:', jawArea.length);

        lipRef.current = {
          pos,
          origX, origY, origZ,
          lowerLip, upperLip, chin, jawArea,
          // Pre-calculated local-space displacement vectors
          downVec: worldDown,
          upVec: worldUp,
          fwdVec: worldForward,
          mouthYCenter
        };
      }
    });
  }, [clonedScene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Subtle idle breathing / sway
    groupRef.current.position.y = offset.y + Math.sin(time * 0.8) * 0.012;
    groupRef.current.rotation.y = Math.sin(time * 0.4) * 0.04;

    // Speaking: gentle scale pulse
    if (isSpeaking) {
      const pulse = 1 + Math.sin(time * 5) * 0.005;
      groupRef.current.scale.setScalar(modelScale * pulse);
    } else {
      groupRef.current.scale.setScalar(modelScale);
    }

    // Lip sync
    if (lipRef.current) {
      const { pos, origX, origY, origZ, lowerLip, upperLip, chin, jawArea, downVec, upVec, fwdVec } = lipRef.current;

      if (isSpeaking) {
        // Natural speech: multiple overlapping frequencies
        const jawOpen = Math.max(0, (Math.sin(time * 7) * 0.5 + 0.5) * (Math.sin(time * 11) * 0.3 + 0.7));
        const lipRound = Math.max(0, Math.sin(time * 15) * 0.5 + 0.5);
        const flutter = Math.sin(time * 19) * 0.15 + 0.85;
        const openAmt = jawOpen * flutter;

        // Displacement magnitude (aggressive so it's clearly visible)
        const D = 0.018;

        // LOWER LIP — move down in world space
        for (const idx of lowerLip) {
          pos.setX(idx, origX[idx] + downVec.x * D * openAmt);
          pos.setY(idx, origY[idx] + downVec.y * D * openAmt);
          pos.setZ(idx, origZ[idx] + downVec.z * D * openAmt);
        }

        // UPPER LIP — move up slightly in world space
        for (const idx of upperLip) {
          pos.setX(idx, origX[idx] + upVec.x * D * openAmt * 0.3);
          pos.setY(idx, origY[idx] + upVec.y * D * openAmt * 0.3);
          pos.setZ(idx, origZ[idx] + upVec.z * D * openAmt * 0.3);
        }

        // CHIN — follows lower lip with reduced motion
        for (const idx of chin) {
          pos.setX(idx, origX[idx] + downVec.x * D * openAmt * 0.5);
          pos.setY(idx, origY[idx] + downVec.y * D * openAmt * 0.5);
          pos.setZ(idx, origZ[idx] + downVec.z * D * openAmt * 0.5);
        }

        // JAW AREA — subtle follow
        for (const idx of jawArea) {
          pos.setX(idx, origX[idx] + downVec.x * D * openAmt * 0.15);
          pos.setY(idx, origY[idx] + downVec.y * D * openAmt * 0.15);
          pos.setZ(idx, origZ[idx] + downVec.z * D * openAmt * 0.15);
        }
      } else {
        // Reset everything to original
        for (const idx of lowerLip) {
          pos.setX(idx, origX[idx]);
          pos.setY(idx, origY[idx]);
          pos.setZ(idx, origZ[idx]);
        }
        for (const idx of upperLip) {
          pos.setX(idx, origX[idx]);
          pos.setY(idx, origY[idx]);
          pos.setZ(idx, origZ[idx]);
        }
        for (const idx of chin) {
          pos.setX(idx, origX[idx]);
          pos.setY(idx, origY[idx]);
          pos.setZ(idx, origZ[idx]);
        }
        for (const idx of jawArea) {
          pos.setX(idx, origX[idx]);
          pos.setY(idx, origY[idx]);
          pos.setZ(idx, origZ[idx]);
        }
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[offset.x, offset.y, offset.z]} scale={[modelScale, modelScale, modelScale]}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/arnaud_from_mapado.glb');

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
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);
  const [warningInfo, setWarningInfo] = useState(null); // { type, count, max }
  const [eyeContactScore, setEyeContactScore] = useState(null); // latest score 0-100
  const [difficultyLevel, setDifficultyLevel] = useState('easy'); // easy/medium/hard
  const [analyzerReady, setAnalyzerReady] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({ eyeContact: null, confidence: null, expression: null });
  const [cheatingWarning, setCheatingWarning] = useState(null);

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
  const liveMetricsIntervalRef = useRef(null);

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

  // Webcam
  useEffect(() => {
    if (webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(() => {});
    }
  }, [webcamStream]);

  // ===== Initialize face-api.js analyzer on mount =====
  useEffect(() => {
    interviewAnalyzer.initialize().then(ready => {
      setAnalyzerReady(ready);
      if (ready) console.log('[AI Interview] Face analyzer ready');
    });
  }, []);

  // ===== Start/stop face-api.js analysis with camera =====
  useEffect(() => {
    if (!interviewStarted || interviewEnded || !cameraEnabled || !webcamStream || !analyzerReady) {
      if (interviewAnalyzer.running) interviewAnalyzer.stopAnalysis();
      if (liveMetricsIntervalRef.current) {
        clearInterval(liveMetricsIntervalRef.current);
        liveMetricsIntervalRef.current = null;
      }
      return;
    }

    // Wait for video element to be ready
    const startWhenReady = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        interviewAnalyzer.startAnalysis(videoRef.current);
        // Poll live metrics every 1 second for UI
        liveMetricsIntervalRef.current = setInterval(() => {
          const snap = interviewAnalyzer.getLiveSnapshot();
          setEyeContactScore(snap.eye_contact);
          setLiveMetrics({
            eyeContact: snap.eye_contact,
            confidence: snap.facial_confidence,
            expression: snap.expression
          });
          // Cheating warnings
          if (snap.cheating_flag) {
            setCheatingWarning(snap.cheating_flag === 'looking_away' ? 'Please look at the camera' :
              snap.cheating_flag === 'head_turned' ? 'Please face the camera' : null);
            setTimeout(() => setCheatingWarning(null), 3000);
          }
          if (snap.multiple_faces_detected >= 3) {
            setCheatingWarning('Multiple faces detected');
            setTimeout(() => setCheatingWarning(null), 3000);
          }
          if (snap.tab_switches > 0 && snap.tab_switches !== window._lastTabWarned) {
            window._lastTabWarned = snap.tab_switches;
            setCheatingWarning('Tab switch detected');
            setTimeout(() => setCheatingWarning(null), 3000);
          }
        }, 1000);
      } else {
        setTimeout(startWhenReady, 500);
      }
    };
    startWhenReady();

    return () => {
      interviewAnalyzer.stopAnalysis();
      if (liveMetricsIntervalRef.current) {
        clearInterval(liveMetricsIntervalRef.current);
        liveMetricsIntervalRef.current = null;
      }
    };
  }, [interviewStarted, interviewEnded, cameraEnabled, webcamStream, analyzerReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (liveMetricsIntervalRef.current) clearInterval(liveMetricsIntervalRef.current);
      interviewAnalyzer.stopAnalysis();
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
      if (synthRef.current) synthRef.current.cancel();
      if (webcamStream) webcamStream.getTracks().forEach(t => t.stop());
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
    const SILENCE_THRESHOLD = 1500;

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
          const text = accumulatedTranscript.trim();
          const words = text.split(/\s+/).length;
          if (text.length > 5 && words >= 2 && !isProcessingRef.current) {
            setIsProcessing(true); isProcessingRef.current = true;
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
        const text = accumulatedTranscript.trim();
        setIsProcessing(true); isProcessingRef.current = true;
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
    utterance.rate = 1.0; utterance.pitch = 0.9; utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    // Prefer deep male voices for the AI interviewer
    const preferred = ['Microsoft David', 'Google UK English Male', 'Daniel', 'Alex', 'Microsoft Mark', 'Microsoft Guy Online', 'Google US English'];
    let selectedVoice = null;
    for (const n of preferred) { const v = voices.find(v => v.name.includes(n)); if (v) { selectedVoice = v; break; } }
    // Fallback: try to find any male English voice
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en') && (/male|david|mark|guy|daniel|james|john/i).test(v.name));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 0.9; // slightly deeper

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
      // Get live snapshot from face-api.js analyzer
      const analyzerSnap = interviewAnalyzer.running ? interviewAnalyzer.getLiveSnapshot() : null;
      const avgEyeContact = analyzerSnap?.eye_contact ?? null;

      // Analyze confidence from speech patterns
      const words = transcript.trim().split(/\s+/);
      const wordCount = words.length;
      const fillers = (transcript.match(/\b(um|uh|like|you know|basically|i guess|i think|maybe|sort of|kind of|i mean|actually|honestly|well)\b/gi) || []).length;
      const fillerRatio = wordCount > 0 ? fillers / wordCount : 0;
      const hasHedging = /\b(i'm not sure|i don't know|i can't remember|probably|perhaps)\b/i.test(transcript);
      const hasStrongStart = /^(I |Yes|Sure|Absolutely|Definitely|In my experience|When I)/i.test(transcript.trim());
      let speechConfidence = 70;
      if (wordCount < 5) speechConfidence -= 30;
      else if (wordCount < 10) speechConfidence -= 15;
      else if (wordCount > 30) speechConfidence += 10;
      speechConfidence -= Math.round(fillerRatio * 80);
      if (hasHedging) speechConfidence -= 15;
      if (hasStrongStart) speechConfidence += 10;
      speechConfidence = Math.max(5, Math.min(100, speechConfidence));

      // Blend speech + facial confidence (60% facial, 40% speech when available)
      const facialConf = analyzerSnap?.facial_confidence;
      const blendedConfidence = facialConf != null
        ? Math.round(facialConf * 0.6 + speechConfidence * 0.4)
        : speechConfidence;

      const confidenceSnapshot = {
        word_count: wordCount,
        filler_count: fillers,
        filler_ratio: Math.round(fillerRatio * 100) / 100,
        has_hedging: hasHedging,
        has_strong_start: hasStrongStart,
        score: blendedConfidence,
        speech_score: speechConfidence,
        facial_score: facialConf,
        expression: analyzerSnap?.expression || null
      };

      const response = await fetch(`${API_BASE_URL}/api/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          message: transcript,
          eye_contact_score: avgEyeContact,
          confidence_snapshot: confidenceSnapshot
        })
      });
      const data = await response.json();

      setIsProcessing(false); isProcessingRef.current = false;

      if (data.success) {
        setConversationHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
        setCurrentMessage(data.message);

        // Handle warning from backend
        if (data.warning) {
          setWarningInfo(data.warning);
          // Auto-clear warning display after 5 seconds
          setTimeout(() => setWarningInfo(null), 5000);
        }

        // Handle difficulty level update
        if (data.difficulty) {
          setDifficultyLevel(data.difficulty);
        }

        // Handle auto-end (3 warnings reached)
        if (data.auto_end) {
          if (audioEnabled) speakText(data.message);
          setTimeout(() => endInterview(), 4000);
          return;
        }

        if (data.state === 'closing') {
          setTimeout(() => endInterview(), 3000);
        }
        if (audioEnabled) speakText(data.message);
        else setTimeout(() => { if (interviewStartedRef.current) startListening(); }, 500);
      } else {
        setError(data.error || 'Failed to get response');
        setTimeout(() => { if (interviewStartedRef.current) startListening(); }, 2000);
      }
    } catch (err) {
      setIsProcessing(false); isProcessingRef.current = false;
      setError('Connection error. Retrying...');
      setTimeout(() => { setError(null); if (interviewStartedRef.current) startListening(); }, 2000);
    }
  };

  // === Start Interview ===
  const startInterview = async () => {
    if (!setupName.trim()) { setError('Please enter your name'); return; }
    setIsProcessing(true); setError(null);

    // Setup camera
    if (cameraEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        setWebcamStream(stream);
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
        setInterviewStarted(true);
        setConversationHistory([{ role: 'assistant', content: data.message }]);
        setCurrentMessage(data.message);
        setIsProcessing(false);
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
    // Collect analyzer results before stopping
    const analyzerResults = interviewAnalyzer.running ? interviewAnalyzer.getResults() : null;
    interviewAnalyzer.stopAnalysis();

    setInterviewEnded(true); setInterviewStarted(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
    if (synthRef.current) synthRef.current.cancel();
    setIsAISpeaking(false); setIsListening(false);

    if (webcamStream) { webcamStream.getTracks().forEach(t => t.stop()); setWebcamStream(null); }

    const currentSessionId = sessionIdRef.current || sessionId;
    if (currentSessionId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/interview/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: currentSessionId,
            analyzer_results: analyzerResults
          })
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

              {/* Options */}
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${audioEnabled ? 'bg-green-500/20 border-green-500/50 text-green-400' : `${themeClasses.cardBackground} ${themeClasses.cardBorder} ${themeClasses.textSecondary}`}`}>
                  {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  <span className="text-sm font-medium">{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
                </button>
                <button onClick={() => setCameraEnabled(!cameraEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${cameraEnabled ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : `${themeClasses.cardBackground} ${themeClasses.cardBorder} ${themeClasses.textSecondary}`}`}>
                  {cameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                  <span className="text-sm font-medium">{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
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
                    {analysis.eye_contact?.camera_used ? (
                      <>
                        <div className={`text-2xl font-bold ${getScoreColor(scores.eye_contact || 0)}`}>{scores.eye_contact ?? '-'}</div>
                        <div className={`text-xs ${themeClasses.textSecondary}`}>👁️ Eye Contact</div>
                      </>
                    ) : (
                      <>
                        <div className={`text-2xl font-bold ${themeClasses.textSecondary}`}>N/A</div>
                        <div className={`text-xs ${themeClasses.textSecondary}`}>👁️ Camera Off</div>
                      </>
                    )}
                  </div>
                  <div className={`p-4 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder} text-center`}>
                    <div className={`text-2xl font-bold ${getScoreColor(scores.confidence || 0)}`}>{scores.confidence || '-'}</div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      💪 Confidence{!analysis.confidence?.camera_used ? ' (Speech)' : ''}
                    </div>
                  </div>
                </div>

                {/* Warning Summary (if any warnings were issued) */}
                {analysis.warnings && analysis.warnings.total > 0 && (
                  <div className={`mb-6 p-4 rounded-xl border ${analysis.warnings.total >= 3 ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={18} className={analysis.warnings.total >= 3 ? 'text-red-400' : 'text-yellow-400'} />
                      <span className={`text-sm font-semibold ${analysis.warnings.total >= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {analysis.warnings.total} Warning{analysis.warnings.total > 1 ? 's' : ''} Issued
                        {analysis.warnings.auto_ended && ' — Interview Auto-Ended'}
                      </span>
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary} space-y-1`}>
                      {analysis.warnings.non_english_count > 0 && (
                        <p>• {analysis.warnings.non_english_count} non-English response{analysis.warnings.non_english_count > 1 ? 's' : ''}</p>
                      )}
                      {analysis.warnings.irrelevant_count > 0 && (
                        <p>• {analysis.warnings.irrelevant_count} irrelevant/off-topic response{analysis.warnings.irrelevant_count > 1 ? 's' : ''}</p>
                      )}
                      {analysis.difficulty_reached && (
                        <p>• Difficulty reached: <span className="font-semibold capitalize">{analysis.difficulty_reached}</span></p>
                      )}
                    </div>
                  </div>
                )}

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

                      {/* Head Stability */}
                      {analysis.head_stability != null && (
                        <div className={`p-5 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-3 flex items-center gap-2`}>
                            🧠 Head Stability
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm ${themeClasses.textSecondary}`}>Stability Score</span>
                                <span className={`text-3xl font-bold ${
                                  analysis.head_stability >= 75 ? 'text-green-400' :
                                  analysis.head_stability >= 50 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>{analysis.head_stability}%</span>
                              </div>
                              <div className="w-full bg-gray-700/30 rounded-full h-3">
                                <div className="h-3 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${analysis.head_stability}%`,
                                    backgroundColor: analysis.head_stability >= 75 ? '#4ade80' :
                                      analysis.head_stability >= 50 ? '#facc15' : '#f87171'
                                  }} />
                              </div>
                              <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>
                                {analysis.head_stability >= 75
                                  ? 'Excellent — you maintained a steady, professional head position throughout the interview.'
                                  : analysis.head_stability >= 50
                                  ? 'Moderate — some head movement was detected. Try to keep your head more still to appear composed and focused.'
                                  : 'Needs improvement — excessive head movement was detected. Practice maintaining a steady posture during video interviews.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Feedback */}
                      {(analysis.detailed_feedback || feedback.detailed_analysis) ? (
                        <div className={`p-6 rounded-xl bg-blue-500/10 border border-blue-500/20`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>📝 Overall Assessment</h3>
                          <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                            {analysis.detailed_feedback || feedback.detailed_analysis}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-6 rounded-xl bg-blue-500/10 border border-blue-500/20`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-2`}>📝 Overall Assessment</h3>
                          <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                            Interview completed. Your overall score is {overallScore}/100.
                            {analysis.response_quality ? ` You answered with an average of ${analysis.response_quality.avg_length} words per response and used ${analysis.response_quality.technical_keywords} technical keywords.` : ''}
                          </p>
                        </div>
                      )}

                      {/* Communication Analysis (on Overview for visibility) */}
                      {analysis.communication_feedback && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            💬 Communication Analysis
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
                                  <p className={`text-xs ${themeClasses.textSecondary} mt-0.5 leading-relaxed`}>{value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
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

                      {/* Head Stability */}
                      {analysis.head_stability !== null && analysis.head_stability !== undefined && (
                        <div className={`p-5 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-sm font-semibold ${themeClasses.textPrimary} mb-3`}>🧠 Head Stability</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs ${themeClasses.textSecondary}`}>Stability Score</span>
                                <span className={`text-2xl font-bold ${
                                  analysis.head_stability >= 75 ? 'text-green-400' :
                                  analysis.head_stability >= 50 ? 'text-yellow-400' :
                                  'text-red-400'
                                }`}>{analysis.head_stability}%</span>
                              </div>
                              <div className="w-full bg-gray-700/30 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${analysis.head_stability}%`,
                                    backgroundColor: analysis.head_stability >= 75 ? '#4ade80' :
                                      analysis.head_stability >= 50 ? '#facc15' : '#f87171'
                                  }} />
                              </div>
                              <p className={`text-xs ${themeClasses.textSecondary} mt-2`}>
                                {analysis.head_stability >= 75
                                  ? 'Excellent — you maintained a steady head position throughout the interview.'
                                  : analysis.head_stability >= 50
                                  ? 'Moderate — some head movement detected. Try to keep your head more still during interviews.'
                                  : 'Needs work — excessive head movement was detected. Practice maintaining a steady posture.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ===== FEEDBACK TAB ===== */}
                  {activeTab === 'feedback' && (
                    <>
                      {/* Per-Question Analysis */}
                      {analysis.question_analysis && analysis.question_analysis.length > 0 && (
                        <div className={`p-6 rounded-xl ${themeClasses.sectionBackground} border ${themeClasses.cardBorder}`}>
                          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary} mb-4 flex items-center gap-2`}>
                            <Target size={18} className="text-cyan-400" /> Question-by-Question Analysis
                          </h3>
                          <div className="space-y-4">
                            {analysis.question_analysis.map((qa, i) => (
                              <div key={i} className={`p-4 rounded-xl ${themeClasses.cardBackground} border ${themeClasses.cardBorder}`}>
                                <div className="flex items-start gap-3 mb-3">
                                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    qa.answer_quality === 'excellent' ? 'bg-green-500/20 text-green-400' :
                                    qa.answer_quality === 'good' ? 'bg-blue-500/20 text-blue-400' :
                                    qa.answer_quality === 'acceptable' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>Q{i + 1}</span>
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${themeClasses.textPrimary} mb-1`}>{qa.question}</p>
                                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                      qa.answer_quality === 'excellent' ? 'bg-green-500/20 text-green-400' :
                                      qa.answer_quality === 'good' ? 'bg-blue-500/20 text-blue-400' :
                                      qa.answer_quality === 'acceptable' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-red-500/20 text-red-400'
                                    }`}>{qa.answer_quality}</span>
                                  </div>
                                </div>
                                {qa.what_was_missing && (
                                  <div className="ml-10 mb-2">
                                    <p className={`text-xs ${themeClasses.textSecondary}`}>
                                      <span className="text-red-400 font-medium">What was missing: </span>{qa.what_was_missing}
                                    </p>
                                  </div>
                                )}
                                {qa.ideal_answer_should_include && (
                                  <div className="ml-10">
                                    <p className={`text-xs ${themeClasses.textSecondary}`}>
                                      <span className="text-green-400 font-medium">Ideal answer should include: </span>{qa.ideal_answer_should_include}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                              <h4 className={`text-sm font-medium text-green-400 mb-2`}>Demonstrated Skills</h4>
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
                              <h4 className={`text-sm font-medium text-red-400 mb-2`}>Skill Gaps</h4>
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

                          {/* Topics to Study */}
                          {analysis.topics_to_study && analysis.topics_to_study.length > 0 && (
                            <div className="mt-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                              <h4 className={`text-sm font-medium text-indigo-400 mb-2`}>📖 Topics to Study</h4>
                              <div className="flex flex-wrap gap-2">
                                {analysis.topics_to_study.map((topic, i) => (
                                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
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

  // === Active Interview Screen (Zoom-like layout) ===
  return (
    <div className={`h-screen ${themeClasses.pageBackground} transition-colors duration-300 flex flex-col overflow-hidden`}>

      {/* ===== VIDEO AREA (main focus) ===== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid - 2 equal tiles */}
        <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-3 ${showChat ? 'md:mr-0' : ''}`}>
          
          {/* AI Interviewer Tile */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col">
            <div className="flex-1 min-h-0">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl animate-pulse">🤖</div>
                </div>
              }>
                <Canvas camera={{ position: [0, 0.2, 2.5], fov: 40 }} style={{ width: '100%', height: '100%' }}>
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[2, 4, 3]} intensity={1.0} castShadow />
                  <pointLight position={[-2, 2, 1]} intensity={0.5} color="#818cf8" />
                  <pointLight position={[0, 0, 3]} intensity={0.3} color="#ffffff" />
                  <AnimatedAvatar isSpeaking={isAISpeaking} />
                  <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} />
                </Canvas>
              </Suspense>
            </div>
            {/* Name label - bottom left like Zoom */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="font-medium">🤖 Alex</span>
                {isAISpeaking && <Volume2 size={14} className="text-blue-400 animate-pulse" />}
              </div>
            </div>
            {/* Speaking indicator - subtle glow border */}
            {isAISpeaking && (
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/50 pointer-events-none animate-pulse" />
            )}
          </div>

          {/* User Webcam Tile */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700/30 shadow-xl">
            {cameraEnabled && webcamStream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                  <span className="text-4xl">👤</span>
                </div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>{setupName || 'You'}</span>
                <span className="text-xs text-gray-600 mt-1">Camera is off</span>
              </div>
            )}
            {/* Name label - bottom left like Zoom */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <span className="font-medium">👤 {setupName || 'You'}</span>
                {isListening && <Mic size={14} className="text-green-400 animate-pulse" />}
              </div>
            </div>
            {/* Speaking/Listening indicator */}
            {isListening && (
              <div className="absolute inset-0 rounded-2xl border-2 border-green-500/50 pointer-events-none" />
            )}
          </div>
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

      {/* ===== SUBTLE NOTICE (when backend detects an issue) ===== */}
      {warningInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            warningInfo.count >= 3 ? 'bg-red-500/80' : 'bg-slate-700/90'
          } text-white backdrop-blur-sm text-sm`}>
            {warningInfo.type === 'non_english' && 'Please respond in English'}
            {warningInfo.type === 'too_short' && 'Try to elaborate more'}
            {warningInfo.type === 'off_topic' && 'Stay on topic'}
            {warningInfo.type === 'gibberish' && 'Speak clearly'}
          </div>
        </div>
      )}

      {/* ===== CHEATING WARNING (face-api.js detection) ===== */}
      {cheatingWarning && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg shadow-lg bg-amber-500/80 text-white backdrop-blur-sm text-sm flex items-center gap-2">
            ⚠️ {cheatingWarning}
          </div>
        </div>
      )}

      {/* ===== BOTTOM CONTROL BAR (Zoom-style) ===== */}
      <div className={`${themeClasses.cardBackground} border-t ${themeClasses.cardBorder} px-4 py-3`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left: Meeting info + difficulty + eye contact */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${timeRemaining <= 60 ? 'bg-red-500/20 text-red-400' : `${themeClasses.sectionBackground} ${themeClasses.textSecondary}`} font-mono text-sm font-bold`}>
              <Clock size={14} />
              {formatTime(timeRemaining)}
            </div>
            {/* Difficulty badge */}
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
              difficultyLevel === 'easy' ? 'bg-green-500/20 text-green-400' :
              difficultyLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {difficultyLevel === 'easy' ? '🟢' : difficultyLevel === 'medium' ? '🟡' : '🔴'} {difficultyLevel}
            </div>
            {/* Eye contact indicator */}
            {cameraEnabled && eyeContactScore !== null && (
              <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${
                eyeContactScore >= 70 ? 'bg-green-500/15 text-green-400' :
                eyeContactScore >= 40 ? 'bg-yellow-500/15 text-yellow-400' :
                'bg-red-500/15 text-red-400'
              }`}>
                👁️ {eyeContactScore >= 70 ? 'Good' : eyeContactScore >= 40 ? 'Fair' : 'Low'}
              </div>
            )}
            {/* Confidence indicator (from face-api.js) */}
            {cameraEnabled && liveMetrics.confidence !== null && (
              <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold ${
                liveMetrics.confidence >= 65 ? 'bg-blue-500/15 text-blue-400' :
                liveMetrics.confidence >= 40 ? 'bg-yellow-500/15 text-yellow-400' :
                'bg-orange-500/15 text-orange-400'
              }`}>
                {liveMetrics.confidence >= 65 ? '😊' : liveMetrics.confidence >= 40 ? '😐' : '😟'} {liveMetrics.confidence}%
              </div>
            )}
            <div className="hidden md:block">
              <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                {isAISpeaking ? '🔊 Alex is speaking...' : isProcessing ? '🤔 Alex is thinking...' : isListening ? '👂 Listening...' : `Interview • ${setupPosition}`}
              </p>
            </div>
          </div>

          {/* Center: Main controls */}
          <div className="flex items-center gap-2">
            {/* Mic */}
            <button onClick={() => { if (isListening) stopListening(); else startListening(); }}
              title={isListening ? 'Mute' : 'Unmute'}
              className={`p-3 rounded-full transition-all ${isListening ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            {/* Camera */}
            <button onClick={async () => {
              if (cameraEnabled && webcamStream) {
                webcamStream.getTracks().forEach(t => t.stop());
                setWebcamStream(null);
                setCameraEnabled(false);
              } else {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                  setWebcamStream(stream);
                  setCameraEnabled(true);
                } catch (e) { console.warn('Camera error:', e); }
              }
            }}
              title={cameraEnabled ? 'Stop Video' : 'Start Video'}
              className={`p-3 rounded-full transition-all ${cameraEnabled ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            {/* Audio/Speaker */}
            <button onClick={() => { setAudioEnabled(!audioEnabled); if (audioEnabled) { synthRef.current?.cancel(); setIsAISpeaking(false); } }}
              title={audioEnabled ? 'Mute Speaker' : 'Unmute Speaker'}
              className={`p-3 rounded-full transition-all ${audioEnabled ? 'bg-gray-600/50 hover:bg-gray-600/70 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            {/* Chat toggle */}
            <button onClick={() => setShowChat(!showChat)}
              title="Chat"
              className={`p-3 rounded-full transition-all relative ${showChat ? 'bg-blue-500/30 text-blue-400' : 'bg-gray-600/50 hover:bg-gray-600/70 text-white'}`}>
              <MessageCircle size={20} />
              {conversationHistory.length > 0 && !showChat && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold">{conversationHistory.length}</span>
                </div>
              )}
            </button>
            {/* End call */}
            <button onClick={endInterview}
              title="End Interview"
              className="p-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium text-sm flex items-center gap-1.5 transition-colors ml-2">
              <StopCircle size={18} /> End
            </button>
          </div>

          {/* Right: Response count */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${themeClasses.textSecondary} hidden sm:block`}>
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

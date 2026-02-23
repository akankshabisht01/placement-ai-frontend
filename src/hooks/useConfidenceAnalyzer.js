/**
 * Client-Side Confidence Analyzer using MediaPipe Face Landmarker
 * 
 * This hook runs entirely in the browser - ZERO server impact!
 * Uses MediaPipe's Face Landmarker to detect facial landmarks and calculate:
 * - Eye contact score (based on gaze direction)
 * - Head stability score (based on head pose variance)
 * - Overall confidence score
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Configuration
const ANALYSIS_INTERVAL_MS = 200; // Analyze every 200ms (5 fps)
const BUFFER_SIZE = 30; // Keep last 30 samples for smoothing

export const useConfidenceAnalyzer = (videoRef, isActive = false) => {
  const [confidenceData, setConfidenceData] = useState({
    eyeContact: 0,
    headStability: 0,
    overall: 0,
    level: 'Not Started',
    isAnalyzing: false,
  });
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastAnalysisTimeRef = useRef(0);
  const eyeContactBufferRef = useRef([]);
  const headPoseBufferRef = useRef([]);
  const isAnalyzingRef = useRef(false);
  
  // Session stats (accumulated over entire interview)
  const sessionStatsRef = useRef({
    totalFrames: 0,
    eyeContactSum: 0,
    headStabilitySum: 0,
    startTime: null,
  });

  // Initialize MediaPipe Face Landmarker
  const initializeFaceLandmarker = useCallback(async () => {
    try {
      console.log('[ConfidenceAnalyzer] Initializing MediaPipe...');
      
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU' // Use GPU for better performance (falls back to CPU if unavailable)
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      
      faceLandmarkerRef.current = landmarker;
      setIsReady(true);
      setError(null);
      console.log('[ConfidenceAnalyzer] ✅ MediaPipe initialized successfully');
      
    } catch (err) {
      console.error('[ConfidenceAnalyzer] Failed to initialize:', err);
      setError('Failed to initialize face analysis. Please refresh the page.');
      setIsReady(false);
    }
  }, []);

  // Calculate eye contact score from face landmarks
  const calculateEyeContact = useCallback((faceLandmarks, blendshapes) => {
    if (!faceLandmarks || faceLandmarks.length === 0) return 50;
    
    const landmarks = faceLandmarks[0];
    if (!landmarks || landmarks.length < 468) return 50;
    
    // Get iris landmarks (468-477 are iris landmarks in MediaPipe)
    // Left iris center: 468, Right iris center: 473
    const leftIris = landmarks[468];
    const rightIris = landmarks[473];
    
    // Get eye corner landmarks for reference
    // Left eye: inner corner 133, outer corner 33
    // Right eye: inner corner 362, outer corner 263
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];
    
    // Calculate horizontal deviation of iris within eye
    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    
    const leftIrisDeviation = Math.abs(leftIris.x - (leftEyeInner.x + leftEyeOuter.x) / 2) / (leftEyeWidth / 2);
    const rightIrisDeviation = Math.abs(rightIris.x - (rightEyeInner.x + rightEyeOuter.x) / 2) / (rightEyeWidth / 2);
    
    // Average deviation (0 = looking straight, 1 = looking far to side)
    const avgDeviation = (leftIrisDeviation + rightIrisDeviation) / 2;
    
    // Use blendshapes for additional accuracy if available
    let lookAwayPenalty = 0;
    if (blendshapes && blendshapes[0]) {
      const shapes = blendshapes[0].categories;
      const eyeLookLeft = shapes.find(s => s.categoryName === 'eyeLookOutLeft')?.score || 0;
      const eyeLookRight = shapes.find(s => s.categoryName === 'eyeLookOutRight')?.score || 0;
      const eyeLookUp = shapes.find(s => s.categoryName === 'eyeLookUpLeft')?.score || 0;
      const eyeLookDown = shapes.find(s => s.categoryName === 'eyeLookDownLeft')?.score || 0;
      
      // High values mean looking away
      lookAwayPenalty = Math.max(eyeLookLeft, eyeLookRight, eyeLookUp * 0.5, eyeLookDown * 0.3) * 30;
    }
    
    // Convert to 0-100 score (higher = better eye contact)
    const baseScore = Math.max(0, 100 - avgDeviation * 100);
    const finalScore = Math.max(0, Math.min(100, baseScore - lookAwayPenalty));
    
    return finalScore;
  }, []);

  // Calculate head stability from facial transformation matrix
  const calculateHeadStability = useCallback((transformationMatrix, faceLandmarks) => {
    if (!faceLandmarks || faceLandmarks.length === 0) return 50;
    
    const landmarks = faceLandmarks[0];
    if (!landmarks || landmarks.length < 10) return 50;
    
    // Get nose tip and calculate its position
    const noseTip = landmarks[1]; // Nose tip landmark
    const leftEar = landmarks[234];
    const rightEar = landmarks[454];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    
    // Calculate head tilt (roll) from ear positions
    const earDiff = Math.abs(leftEar.y - rightEar.y);
    
    // Calculate head nod (pitch) from forehead-chin alignment
    const headTilt = Math.abs(forehead.x - chin.x);
    
    // Calculate head turn (yaw) from nose position relative to ears
    const earMidX = (leftEar.x + rightEar.x) / 2;
    const headTurn = Math.abs(noseTip.x - earMidX);
    
    // Store current pose for stability calculation
    const currentPose = { earDiff, headTilt, headTurn };
    headPoseBufferRef.current.push(currentPose);
    
    if (headPoseBufferRef.current.length > BUFFER_SIZE) {
      headPoseBufferRef.current.shift();
    }
    
    // Calculate variance (stability) from buffer
    if (headPoseBufferRef.current.length < 5) return 70; // Not enough data yet
    
    const poses = headPoseBufferRef.current;
    const avgEarDiff = poses.reduce((a, p) => a + p.earDiff, 0) / poses.length;
    const avgHeadTilt = poses.reduce((a, p) => a + p.headTilt, 0) / poses.length;
    const avgHeadTurn = poses.reduce((a, p) => a + p.headTurn, 0) / poses.length;
    
    // Calculate variance
    const earDiffVariance = poses.reduce((a, p) => a + Math.pow(p.earDiff - avgEarDiff, 2), 0) / poses.length;
    const headTiltVariance = poses.reduce((a, p) => a + Math.pow(p.headTilt - avgHeadTilt, 2), 0) / poses.length;
    const headTurnVariance = poses.reduce((a, p) => a + Math.pow(p.headTurn - avgHeadTurn, 2), 0) / poses.length;
    
    // Combine variances (lower variance = more stable = higher score)
    const totalVariance = (earDiffVariance + headTiltVariance + headTurnVariance) * 1000;
    const stabilityScore = Math.max(0, Math.min(100, 100 - totalVariance * 50));
    
    return stabilityScore;
  }, []);

  // Get confidence level label
  const getConfidenceLevel = useCallback((score) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }, []);

  // Analyze single frame
  const analyzeFrame = useCallback(async () => {
    if (!faceLandmarkerRef.current || !videoRef?.current || !isAnalyzingRef.current) {
      return;
    }
    
    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      return;
    }
    
    // Throttle analysis to ANALYSIS_INTERVAL_MS
    const now = performance.now();
    if (now - lastAnalysisTimeRef.current < ANALYSIS_INTERVAL_MS) {
      return;
    }
    lastAnalysisTimeRef.current = now;
    
    try {
      // Detect faces
      const results = faceLandmarkerRef.current.detectForVideo(video, now);
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        // Calculate scores
        const eyeContactScore = calculateEyeContact(
          results.faceLandmarks,
          results.faceBlendshapes
        );
        
        const headStabilityScore = calculateHeadStability(
          results.facialTransformationMatrixes,
          results.faceLandmarks
        );
        
        // Smooth eye contact score
        eyeContactBufferRef.current.push(eyeContactScore);
        if (eyeContactBufferRef.current.length > BUFFER_SIZE) {
          eyeContactBufferRef.current.shift();
        }
        
        const smoothedEyeContact = eyeContactBufferRef.current.reduce((a, b) => a + b, 0) / 
                                   eyeContactBufferRef.current.length;
        
        // Calculate overall confidence (60% eye contact, 40% stability)
        const overallScore = smoothedEyeContact * 0.6 + headStabilityScore * 0.4;
        
        // Update session stats
        sessionStatsRef.current.totalFrames++;
        sessionStatsRef.current.eyeContactSum += smoothedEyeContact;
        sessionStatsRef.current.headStabilitySum += headStabilityScore;
        
        // Update state
        setConfidenceData({
          eyeContact: Math.round(smoothedEyeContact),
          headStability: Math.round(headStabilityScore),
          overall: Math.round(overallScore),
          level: getConfidenceLevel(overallScore),
          isAnalyzing: true,
        });
      } else {
        // No face detected
        setConfidenceData(prev => ({
          ...prev,
          isAnalyzing: true,
          level: 'No Face Detected',
        }));
      }
    } catch (err) {
      console.error('[ConfidenceAnalyzer] Frame analysis error:', err);
    }
  }, [videoRef, calculateEyeContact, calculateHeadStability, getConfidenceLevel]);

  // Animation loop
  const analysisLoop = useCallback(() => {
    if (!isAnalyzingRef.current) return;
    
    analyzeFrame();
    animationFrameRef.current = requestAnimationFrame(analysisLoop);
  }, [analyzeFrame]);

  // Start analysis
  const startAnalysis = useCallback(() => {
    if (!isReady || !videoRef?.current) {
      console.warn('[ConfidenceAnalyzer] Not ready to start analysis');
      return;
    }
    
    console.log('[ConfidenceAnalyzer] Starting analysis...');
    isAnalyzingRef.current = true;
    sessionStatsRef.current = {
      totalFrames: 0,
      eyeContactSum: 0,
      headStabilitySum: 0,
      startTime: Date.now(),
    };
    eyeContactBufferRef.current = [];
    headPoseBufferRef.current = [];
    
    analysisLoop();
  }, [isReady, videoRef, analysisLoop]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    console.log('[ConfidenceAnalyzer] Stopping analysis...');
    isAnalyzingRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setConfidenceData(prev => ({
      ...prev,
      isAnalyzing: false,
    }));
  }, []);

  // Get session summary (call this when interview ends)
  const getSessionSummary = useCallback(() => {
    const stats = sessionStatsRef.current;
    
    if (stats.totalFrames === 0) {
      return {
        avgEyeContact: 0,
        avgHeadStability: 0,
        avgOverall: 0,
        level: 'No Data',
        duration: 0,
        framesAnalyzed: 0,
      };
    }
    
    const avgEyeContact = stats.eyeContactSum / stats.totalFrames;
    const avgHeadStability = stats.headStabilitySum / stats.totalFrames;
    const avgOverall = avgEyeContact * 0.6 + avgHeadStability * 0.4;
    const duration = stats.startTime ? Math.round((Date.now() - stats.startTime) / 1000) : 0;
    
    return {
      avgEyeContact: Math.round(avgEyeContact),
      avgHeadStability: Math.round(avgHeadStability),
      avgOverall: Math.round(avgOverall),
      level: getConfidenceLevel(avgOverall),
      duration,
      framesAnalyzed: stats.totalFrames,
    };
  }, [getConfidenceLevel]);

  // Reset analysis
  const resetAnalysis = useCallback(() => {
    stopAnalysis();
    eyeContactBufferRef.current = [];
    headPoseBufferRef.current = [];
    sessionStatsRef.current = {
      totalFrames: 0,
      eyeContactSum: 0,
      headStabilitySum: 0,
      startTime: null,
    };
    setConfidenceData({
      eyeContact: 0,
      headStability: 0,
      overall: 0,
      level: 'Not Started',
      isAnalyzing: false,
    });
  }, [stopAnalysis]);

  // Initialize on mount
  useEffect(() => {
    initializeFaceLandmarker();
    
    return () => {
      stopAnalysis();
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, [initializeFaceLandmarker, stopAnalysis]);

  // Auto start/stop based on isActive prop
  useEffect(() => {
    if (isActive && isReady) {
      startAnalysis();
    } else {
      stopAnalysis();
    }
  }, [isActive, isReady, startAnalysis, stopAnalysis]);

  return {
    confidenceData,
    isReady,
    error,
    startAnalysis,
    stopAnalysis,
    getSessionSummary,
    resetAnalysis,
  };
};

export default useConfidenceAnalyzer;

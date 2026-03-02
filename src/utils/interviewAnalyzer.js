/**
 * InterviewAnalyzer — Real-time facial analysis for AI interviews
 * Uses face-api.js for: eye contact (iris tracking), confidence (facial expressions),
 * cheating detection (head pose, multiple faces, tab switching)
 */
import * as faceapi from 'face-api.js';

class InterviewAnalyzer {
  constructor() {
    this.initialized = false;
    this.running = false;
    this.videoElement = null;
    this.analysisInterval = null;

    // Cumulative tracking
    this.eyeContactScores = [];
    this.confidenceScores = [];
    this.headPoseHistory = [];
    this.expressionHistory = [];

    // Cheating detection
    this.cheatingEvents = [];
    this.tabSwitchCount = 0;
    this.multipleFaceCount = 0;
    this.lookAwayStreak = 0;
    this.lookAwayThreshold = 4; // consecutive low-contact frames = suspicious
    this.prolongedLookAways = 0;

    // Latest frame results (live snapshot)
    this._latestSnapshot = {
      eyeContact: null,
      confidence: null,
      headPose: null,
      expression: null,
      cheatingFlag: null
    };

    // Tab visibility listener
    this._handleVisibility = this._handleVisibility.bind(this);
  }

  /**
   * Load face-api.js models from /models (served from public/)
   */
  async initialize() {
    if (this.initialized) return true;
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      this.initialized = true;
      console.log('[InterviewAnalyzer] Models loaded successfully');
      return true;
    } catch (err) {
      console.error('[InterviewAnalyzer] Failed to load models:', err);
      return false;
    }
  }

  /**
   * Start continuous analysis on a video element
   */
  startAnalysis(videoElement) {
    if (!this.initialized || this.running) return;
    this.videoElement = videoElement;
    this.running = true;

    // Reset tracking
    this.eyeContactScores = [];
    this.confidenceScores = [];
    this.headPoseHistory = [];
    this.expressionHistory = [];
    this.cheatingEvents = [];
    this.tabSwitchCount = 0;
    this.multipleFaceCount = 0;
    this.lookAwayStreak = 0;
    this.prolongedLookAways = 0;

    // Tab switch detection
    document.addEventListener('visibilitychange', this._handleVisibility);

    // Run analysis every 500ms
    this.analysisInterval = setInterval(() => this._analyzeFrame(), 500);
    // Run once immediately
    setTimeout(() => this._analyzeFrame(), 300);

    console.log('[InterviewAnalyzer] Analysis started');
  }

  /**
   * Stop analysis
   */
  stopAnalysis() {
    this.running = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    document.removeEventListener('visibilitychange', this._handleVisibility);
    console.log('[InterviewAnalyzer] Analysis stopped');
  }

  /**
   * Core: analyze a single video frame
   */
  async _analyzeFrame() {
    if (!this.running || !this.videoElement) return;
    const video = this.videoElement;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    try {
      // Detect all faces with landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceExpressions();

      // --- Multiple face check ---
      if (detections.length > 1) {
        this.multipleFaceCount++;
        if (this.multipleFaceCount >= 3) {
          this.cheatingEvents.push({
            type: 'multiple_faces',
            count: detections.length,
            time: Date.now()
          });
        }
      }

      if (detections.length === 0) {
        // No face detected — looking away or left
        this.lookAwayStreak++;
        if (this.lookAwayStreak >= this.lookAwayThreshold) {
          this.prolongedLookAways++;
          this.cheatingEvents.push({
            type: 'prolonged_look_away',
            duration: this.lookAwayStreak * 500,
            time: Date.now()
          });
        }
        this.eyeContactScores.push(5);
        this._latestSnapshot.eyeContact = 5;
        this._latestSnapshot.cheatingFlag = this.lookAwayStreak >= this.lookAwayThreshold ? 'looking_away' : null;
        return;
      }

      // Reset look-away streak
      this.lookAwayStreak = 0;

      const detection = detections[0];
      const landmarks = detection.landmarks;
      const expressions = detection.expressions;

      // 1. Eye contact analysis (from landmarks)
      const eyeScore = this._analyzeEyeContact(landmarks, video);
      this.eyeContactScores.push(eyeScore);
      this._latestSnapshot.eyeContact = eyeScore;

      // 2. Head pose estimation
      const headPose = this._estimateHeadPose(landmarks, video);
      this.headPoseHistory.push(headPose);
      this._latestSnapshot.headPose = headPose;

      // 3. Confidence from expressions
      const confScore = this._analyzeConfidenceFromExpression(expressions);
      this.confidenceScores.push(confScore);
      this._latestSnapshot.confidence = confScore;

      // 4. Store dominant expression
      const dominantExpr = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
      this.expressionHistory.push({ expression: dominantExpr[0], value: dominantExpr[1] });
      this._latestSnapshot.expression = dominantExpr[0];

      // 5. Head pose cheating check — large yaw = looking sideways
      if (Math.abs(headPose.yaw) > 35) {
        this.cheatingEvents.push({
          type: 'suspicious_head_turn',
          yaw: headPose.yaw,
          time: Date.now()
        });
        this._latestSnapshot.cheatingFlag = 'head_turned';
      } else {
        this._latestSnapshot.cheatingFlag = null;
      }

    } catch (err) {
      // Silently ignore frame errors
    }
  }

  /**
   * Analyze eye contact using iris/eye landmark positions
   * Returns 0-100 score
   */
  _analyzeEyeContact(landmarks, video) {
    try {
      const positions = landmarks.positions;

      // Left eye: landmarks 36-41, Right eye: 42-47
      const leftEye = positions.slice(36, 42);
      const rightEye = positions.slice(42, 48);

      // Eye center (average of all eye points)
      const leftCenter = {
        x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
        y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length
      };
      const rightCenter = {
        x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
        y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length
      };

      // Eye width (horizontal span)
      const leftWidth = Math.abs(leftEye[3].x - leftEye[0].x);
      const rightWidth = Math.abs(rightEye[3].x - rightEye[0].x);

      // Nose bridge reference (landmark 27-30)
      const noseBridge = positions[27];

      // Calculate gaze direction: how far the eye center is from the expected center
      // relative to the nose position
      const leftGazeX = (leftCenter.x - noseBridge.x) / (leftWidth || 1);
      const rightGazeX = (rightCenter.x - noseBridge.x) / (rightWidth || 1);
      const avgGazeX = (leftGazeX + rightGazeX) / 2;

      // Eye openness (vertical span / horizontal span)  
      const leftHeight = Math.abs(leftEye[1].y + leftEye[2].y - leftEye[4].y - leftEye[5].y) / 2;
      const rightHeight = Math.abs(rightEye[1].y + rightEye[2].y - rightEye[4].y - rightEye[5].y) / 2;
      const leftOpenness = leftHeight / (leftWidth || 1);
      const rightOpenness = rightHeight / (rightWidth || 1);
      const avgOpenness = (leftOpenness + rightOpenness) / 2;

      // Face centering in frame
      const faceCenter = positions[30]; // nose tip
      const frameCenterX = video.videoWidth / 2;
      const frameCenterY = video.videoHeight / 2;
      const centerDeviationX = Math.abs(faceCenter.x - frameCenterX) / frameCenterX;
      const centerDeviationY = Math.abs(faceCenter.y - frameCenterY) / frameCenterY;

      // Score components
      let score = 70; // base

      // Gaze direction penalty (looking sideways = low eye contact)
      // Normal range: -1.5 to 1.5
      const gazeDeviation = Math.abs(avgGazeX);
      if (gazeDeviation < 0.8) score += 15;       // looking straight
      else if (gazeDeviation < 1.5) score += 0;    // slightly off
      else if (gazeDeviation < 2.5) score -= 20;   // noticeably looking away
      else score -= 40;                             // looking far away

      // Eye openness bonus (open eyes = engaged)
      if (avgOpenness > 0.25) score += 10;  // eyes well open
      else if (avgOpenness < 0.15) score -= 15; // eyes squinting/closing

      // Frame centering penalty (face far from center = not looking at camera)
      const centerPenalty = (centerDeviationX + centerDeviationY) * 25;
      score -= Math.round(centerPenalty);

      return Math.max(0, Math.min(100, Math.round(score)));
    } catch {
      return 50; // fallback
    }
  }

  /**
   * Estimate head pose (yaw, pitch, roll) from landmarks
   */
  _estimateHeadPose(landmarks, video) {
    try {
      const positions = landmarks.positions;

      // Key landmarks for head pose
      const noseTip = positions[30];
      const chin = positions[8];
      const leftEyeOuter = positions[36];
      const rightEyeOuter = positions[45];
      const leftMouth = positions[48];
      const rightMouth = positions[54];

      // Yaw (left-right): asymmetry between nose and eyes
      const eyeWidth = rightEyeOuter.x - leftEyeOuter.x;
      const noseToLeftEye = noseTip.x - leftEyeOuter.x;
      const noseToRightEye = rightEyeOuter.x - noseTip.x;
      const yawRatio = eyeWidth > 0 ? (noseToLeftEye - noseToRightEye) / eyeWidth : 0;
      const yaw = yawRatio * 90; // rough degrees

      // Pitch (up-down): nose-to-chin vs eye-to-nose ratio
      const eyeToNose = noseTip.y - ((leftEyeOuter.y + rightEyeOuter.y) / 2);
      const noseToChin = chin.y - noseTip.y;
      const pitchRatio = noseToChin > 0 ? (eyeToNose / noseToChin) : 0.5;
      const pitch = (pitchRatio - 0.6) * 60; // centered around 0

      // Roll (tilt): eye line angle
      const eyeAngle = Math.atan2(
        rightEyeOuter.y - leftEyeOuter.y,
        rightEyeOuter.x - leftEyeOuter.x
      ) * (180 / Math.PI);

      return {
        yaw: Math.round(yaw),
        pitch: Math.round(pitch),
        roll: Math.round(eyeAngle)
      };
    } catch {
      return { yaw: 0, pitch: 0, roll: 0 };
    }
  }

  /**
   * Analyze confidence from facial expressions
   * Returns 0-100
   */
  _analyzeConfidenceFromExpression(expressions) {
    // Expression weights for confidence
    const weights = {
      neutral: 60,    // calm = moderately confident
      happy: 85,      // smiling = confident
      surprised: 50,  // could go either way
      angry: 40,      // tense
      disgusted: 35,  // uncomfortable
      fearful: 20,    // nervous
      sad: 25         // uncertain
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [expr, probability] of Object.entries(expressions)) {
      if (weights[expr] !== undefined) {
        totalScore += weights[expr] * probability;
        totalWeight += probability;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
  }

  /**
   * Track tab visibility changes (tab switching = potential cheating)
   */
  _handleVisibility() {
    if (document.hidden) {
      this.tabSwitchCount++;
      this.cheatingEvents.push({
        type: 'tab_switch',
        count: this.tabSwitchCount,
        time: Date.now()
      });
    }
  }

  /**
   * Get live snapshot for sending with each answer
   * (blends with speech-based confidence)
   */
  getLiveSnapshot() {
    const recent = this.eyeContactScores.slice(-10);
    const recentConf = this.confidenceScores.slice(-10);

    return {
      eye_contact: recent.length > 0
        ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
        : null,
      facial_confidence: recentConf.length > 0
        ? Math.round(recentConf.reduce((a, b) => a + b, 0) / recentConf.length)
        : null,
      head_pose: this._latestSnapshot.headPose,
      expression: this._latestSnapshot.expression,
      cheating_flag: this._latestSnapshot.cheatingFlag,
      tab_switches: this.tabSwitchCount,
      multiple_faces_detected: this.multipleFaceCount
    };
  }

  /**
   * Get comprehensive results for end-of-interview submission
   */
  getResults() {
    const avgEyeContact = this.eyeContactScores.length > 0
      ? Math.round(this.eyeContactScores.reduce((a, b) => a + b, 0) / this.eyeContactScores.length)
      : null;

    const avgConfidence = this.confidenceScores.length > 0
      ? Math.round(this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length)
      : null;

    // Expression distribution
    const exprCounts = {};
    this.expressionHistory.forEach(e => {
      exprCounts[e.expression] = (exprCounts[e.expression] || 0) + 1;
    });
    const totalExpressions = this.expressionHistory.length || 1;
    const expressionDistribution = {};
    for (const [expr, count] of Object.entries(exprCounts)) {
      expressionDistribution[expr] = Math.round((count / totalExpressions) * 100);
    }

    // Cheating severity (0-100)
    let cheatingSeverity = 0;
    cheatingSeverity += Math.min(30, this.tabSwitchCount * 10);
    cheatingSeverity += Math.min(25, this.multipleFaceCount * 8);
    cheatingSeverity += Math.min(25, this.prolongedLookAways * 5);
    const suspiciousTurns = this.cheatingEvents.filter(e => e.type === 'suspicious_head_turn').length;
    cheatingSeverity += Math.min(20, suspiciousTurns * 4);
    cheatingSeverity = Math.min(100, cheatingSeverity);

    return {
      eye_contact: {
        average: avgEyeContact,
        samples: this.eyeContactScores.length,
        trend: this._calculateTrend(this.eyeContactScores)
      },
      confidence: {
        average: avgConfidence,
        samples: this.confidenceScores.length,
        trend: this._calculateTrend(this.confidenceScores)
      },
      expressions: {
        distribution: expressionDistribution,
        dominant: Object.entries(exprCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
      },
      cheating: {
        severity: cheatingSeverity,
        tab_switches: this.tabSwitchCount,
        multiple_faces: this.multipleFaceCount,
        prolonged_look_aways: this.prolongedLookAways,
        suspicious_head_turns: suspiciousTurns,
        events: this.cheatingEvents.slice(-20) // last 20 events
      },
      head_pose: {
        avg_yaw: this.headPoseHistory.length > 0
          ? Math.round(this.headPoseHistory.reduce((s, p) => s + Math.abs(p.yaw), 0) / this.headPoseHistory.length)
          : 0,
        avg_pitch: this.headPoseHistory.length > 0
          ? Math.round(this.headPoseHistory.reduce((s, p) => s + Math.abs(p.pitch), 0) / this.headPoseHistory.length)
          : 0
      },
      head_stability: this._calculateHeadStability()
    };
  }

  /**
   * Calculate head stability as a percentage (0-100).
   * A frame is "stable" if yaw, pitch, and roll are all within acceptable thresholds.
   * Higher % = more stable head position during interview.
   */
  _calculateHeadStability() {
    if (this.headPoseHistory.length === 0) return null;

    const YAW_THRESHOLD = 15;   // degrees — looking left/right
    const PITCH_THRESHOLD = 12; // degrees — looking up/down
    const ROLL_THRESHOLD = 10;  // degrees — head tilt

    let stableFrames = 0;
    for (const pose of this.headPoseHistory) {
      if (
        Math.abs(pose.yaw) <= YAW_THRESHOLD &&
        Math.abs(pose.pitch) <= PITCH_THRESHOLD &&
        Math.abs(pose.roll) <= ROLL_THRESHOLD
      ) {
        stableFrames++;
      }
    }

    return Math.round((stableFrames / this.headPoseHistory.length) * 100);
  }

  /**
   * Calculate trend: 'improving', 'declining', or 'stable'
   */
  _calculateTrend(scores) {
    if (scores.length < 6) return 'stable';
    const half = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, half);
    const secondHalf = scores.slice(half);
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = avg2 - avg1;
    if (diff > 8) return 'improving';
    if (diff < -8) return 'declining';
    return 'stable';
  }
}

// Singleton instance
const interviewAnalyzer = new InterviewAnalyzer();
export default interviewAnalyzer;

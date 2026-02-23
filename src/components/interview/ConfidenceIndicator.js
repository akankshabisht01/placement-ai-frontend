/**
 * Confidence Indicator Component
 * 
 * Displays real-time confidence analysis metrics during AI Interview
 * Shows eye contact, head stability, and overall confidence scores
 */

import React from 'react';
import { Eye, Activity, Smile, AlertCircle } from 'lucide-react';

const ConfidenceIndicator = ({ 
  confidenceData, 
  isReady, 
  error, 
  compact = false,
  theme = 'dark' 
}) => {
  const { eyeContact, headStability, overall, level, isAnalyzing } = confidenceData;

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400', ring: 'ring-green-500/30' };
    if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/30' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/30' };
    return { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' };
  };

  // Get level badge style
  const getLevelStyle = (lvl) => {
    const l = (lvl || '').toLowerCase();
    if (l.includes('high')) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (l.includes('good')) return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (l.includes('moderate')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    if (l.includes('low')) return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  };

  // Circular progress indicator
  const CircularProgress = ({ value, size = 40, strokeWidth = 3, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-700/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400">{error}</span>
      </div>
    );
  }

  // Loading state
  if (!isReady) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 rounded-lg border border-gray-500/30 animate-pulse">
        <Activity className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">Loading face analysis...</span>
      </div>
    );
  }

  // Compact view (for overlay on video)
  if (compact) {
    const overallColor = getScoreColor(overall);
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
        <div className="relative">
          <CircularProgress 
            value={overall} 
            size={32} 
            strokeWidth={3} 
            color={overall >= 60 ? '#22c55e' : overall >= 40 ? '#eab308' : '#ef4444'} 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Smile className={`w-3 h-3 ${overallColor.text}`} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-semibold ${overallColor.text}`}>{overall}%</span>
          <span className="text-[10px] text-gray-400">{isAnalyzing ? level : 'Paused'}</span>
        </div>
      </div>
    );
  }

  // Full view
  const metrics = [
    { 
      label: 'Eye Contact', 
      value: eyeContact, 
      icon: Eye,
      description: 'Looking at camera'
    },
    { 
      label: 'Head Stability', 
      value: headStability, 
      icon: Activity,
      description: 'Minimal movement'
    },
    { 
      label: 'Overall', 
      value: overall, 
      icon: Smile,
      description: 'Confidence level'
    },
  ];

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium text-white">Confidence Analysis</span>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getLevelStyle(level)}`}>
          {level}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => {
          const colors = getScoreColor(metric.value);
          const Icon = metric.icon;
          
          return (
            <div 
              key={metric.label}
              className={`relative p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 ${colors.ring} ring-1`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${colors.text}`} />
                <span className="text-xs text-gray-400">{metric.label}</span>
              </div>
              
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-1">
                <div 
                  className={`h-full ${colors.bg} transition-all duration-300 rounded-full`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${colors.text}`}>{metric.value}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {isAnalyzing && overall < 60 && (
        <div className="mt-3 px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-xs text-yellow-400">
            💡 Tip: {eyeContact < headStability 
              ? 'Try to look directly at the camera to improve eye contact.' 
              : 'Keep your head steady and avoid excessive movement.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator;

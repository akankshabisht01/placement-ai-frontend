import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeHelpers';

/**
 * Timer component for Weekly Test
 * Shows a 5-minute countdown before the test can be started
 */
const WeeklyTestTimer = ({ onTimerComplete }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            if (onTimerComplete) {
              onTimerComplete();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, onTimerComplete]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className={`${themeClasses.cardBackground} rounded-2xl shadow-xl p-8 border ${themeClasses.cardBorder}`}>
      <div className="text-center">
        {/* Timer Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-pink-500 dark:to-purple-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} mb-3`}>
          {!isRunning && timeLeft === 5 * 60 ? 'Preparation Time' : timeLeft === 0 ? 'Ready to Begin!' : 'Get Ready...'}
        </h2>

        {/* Instructions or Timer Display */}
        {!isRunning && timeLeft === 5 * 60 ? (
          <div className="mb-6">
            <p className={`${themeClasses.textSecondary} mb-4`}>
              Take 5 minutes to prepare yourself before starting the test
            </p>
            <ul className={`text-left max-w-md mx-auto space-y-2 text-sm ${themeClasses.textSecondary}`}>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-pink-500">•</span>
                <span>Ensure you have a stable internet connection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-pink-500">•</span>
                <span>Find a quiet place without distractions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-pink-500">•</span>
                <span>Prepare your camera and microphone for proctoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-pink-500">•</span>
                <span>Review the topics covered this week</span>
              </li>
            </ul>
          </div>
        ) : timeLeft > 0 ? (
          <div className="mb-6">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                  className="text-amber-500 dark:text-pink-500 transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${themeClasses.accent}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                    remaining
                  </div>
                </div>
              </div>
            </div>

            <p className={`${themeClasses.textSecondary}`}>
              Use this time to prepare mentally and review your notes
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`text-lg ${themeClasses.textPrimary} font-semibold mb-2`}>
              Timer Complete!
            </p>
            <p className={`${themeClasses.textSecondary}`}>
              You can now start your test
            </p>
          </div>
        )}

        {/* Action Button */}
        {!isRunning && timeLeft === 5 * 60 ? (
          <button
            onClick={startTimer}
            className={`px-8 py-3 ${themeClasses.buttonPrimary} text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all`}
          >
            Start Timer
          </button>
        ) : timeLeft === 0 ? (
          <button
            onClick={() => window.location.href = '/weekly-test'}
            className={`px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all`}
          >
            Begin Test Now
          </button>
        ) : (
          <div className={`inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl ${themeClasses.textSecondary}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 dark:border-pink-500"></div>
            <span>Timer in progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyTestTimer;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if student is logged in
    const storedProfile = localStorage.getItem('linkedStudentProfile');
    if (!storedProfile) {
      navigate('/student-test', { replace: true });
      return;
    }

    try {
      const profile = JSON.parse(storedProfile);
      if (!profile || !profile.sessionToken) {
        localStorage.removeItem('linkedStudentProfile');
        navigate('/student-test', { replace: true });
        return;
      }
      setStudent(profile);
      setLoading(false);
    } catch (e) {
      localStorage.removeItem('linkedStudentProfile');
      navigate('/student-test', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('linkedStudentProfile');
    navigate('/student-test', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {student?.name}!</h1>
              <p className="text-gray-500">{student?.collegeName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Roll Number</p>
              <p className="font-medium text-gray-800">{student?.rollNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year</p>
              <p className="font-medium text-gray-800">{student?.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="font-medium text-gray-800">{student?.course}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mobile</p>
              <p className="font-medium text-gray-800">{student?.mobileNumber}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/student-test')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Take a Test</p>
                  <p className="text-sm text-gray-500">Enter test code to start</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/student-test/result')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">View Result</p>
                  <p className="text-sm text-gray-500">Check your test results</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800">
                Your account is linked with <strong>{student?.collegeName}</strong>. 
                Your placement cell can track your progress and test results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

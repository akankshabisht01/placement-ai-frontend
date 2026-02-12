import React, { useState, useRef, useEffect } from 'react';

const CustomDatePicker = ({ value, onChange, className, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('year'); // Start with 'year', then 'month', then 'date'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const dropdownRef = useRef(null);

  // Parse the current value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setSelectedDate(date.getDate());
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setView('year'); // Reset to year view when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (year, month, date) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select Date of Birth';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const newDate = formatDate(selectedYear, selectedMonth, date);
    onChange({ target: { name: 'dateOfBirth', value: newDate } });
    setIsOpen(false);
    setView('year'); // Reset to year view after selection
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setView('date'); // Navigate to date view after month selection
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setView('month'); // Navigate to month view after year selection
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1960; year--) {
      years.push(year);
    }
    return years;
  };

  const generateDates = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dates = [];
    for (let date = 1; date <= daysInMonth; date++) {
      dates.push(date);
    }
    return dates;
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const renderYearView = () => (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Select Year</h3>
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
        {generateYears().map(year => (
          <button
            key={year}
            onClick={() => handleYearSelect(year)}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
              year === selectedYear
                ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg dark:shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-300'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setView('year')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {selectedYear}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {months.map((month, index) => (
          <button
            key={month}
            onClick={() => handleMonthSelect(index)}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
              index === selectedMonth
                ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg dark:shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-300'
            }`}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDateView = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setView('month')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {months[selectedMonth]} {selectedYear}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">
            {day}
          </div>
        ))}
        {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }, (_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        {generateDates().map(date => (
          <button
            key={date}
            onClick={() => handleDateSelect(date)}
            className={`p-2 text-sm rounded-lg transition-all duration-200 hover:scale-110 ${
              date === selectedDate && value
                ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg dark:shadow-glow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-300'
            }`}
          >
            {date}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-600 transition-all duration-300 cursor-pointer bg-white dark:bg-tech-darker hover:bg-gray-50 dark:hover:bg-gray-700 ${
          error ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-tech-gray-700 hover:border-gray-300 dark:hover:border-tech-gray-600'
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-tech-gray-500'}>
            {formatDisplayDate(value)}
          </span>
          <svg className="w-5 h-5 text-gray-400 dark:text-tech-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1a2e] border border-gray-200 dark:border-pink-500/20 rounded-xl shadow-2xl dark:shadow-glow z-50 animate-fade-in">
          {view === 'year' && renderYearView()}
          {view === 'month' && renderMonthView()}
          {view === 'date' && renderDateView()}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;

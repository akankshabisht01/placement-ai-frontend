/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Tech-inspired color palette
        primary: {
          50: '#e6f1ff',
          100: '#b3d7ff',
          200: '#80bdff',
          300: '#4da3ff',
          400: '#1a89ff',
          500: '#0070f3',  // Main tech blue
          600: '#005dd1',
          700: '#004aaf',
          800: '#00378d',
          900: '#00246b',
          950: '#001749',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#b3c5ff',
          300: '#8ca8ff',
          400: '#668bff',
          500: '#5b6fff',  // Tech purple
          600: '#4d5ee6',
          700: '#3f4dcc',
          800: '#313cb3',
          900: '#232b99',
          950: '#151a80',
        },
        accent: {
          50: '#e5f9ff',
          100: '#b3efff',
          200: '#80e5ff',
          300: '#4ddbff',
          400: '#1ad1ff',
          500: '#00c7e6',  // Cyan accent
          600: '#00a8c4',
          700: '#0089a2',
          800: '#006a80',
          900: '#004b5e',
          950: '#002c3c',
        },
        // Neon gradient colors for dark mode
        neon: {
          pink: '#ff6b9d',
          orange: '#f7931a',
          purple: '#9d4edd',
          magenta: '#ff00ff',
          coral: '#ff7f50',
          yellow: '#ffd700',
        },
        tech: {
          dark: '#1a1625',      // Deep purple-black
          darker: '#0d0a12',     // Almost black with purple tint
          light: '#f8fafc',      // Clean white
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fff7ed',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 15px 30px -5px rgba(0, 0, 0, 0.08)',
        'large': '0 10px 40px -5px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(0, 112, 243, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 112, 243, 0.4)',
        'glow-cyan': '0 0 25px rgba(0, 199, 230, 0.3)',
        'glow-neon-pink': '0 0 30px rgba(255, 107, 157, 0.5)',
        'glow-neon-orange': '0 0 30px rgba(247, 147, 26, 0.5)',
        'glow-neon-purple': '0 0 30px rgba(157, 78, 221, 0.5)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundSize: {
        '200': '200%',
        '300': '300%',
      },
    },
  },
  plugins: [],
} 
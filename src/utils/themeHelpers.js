/**
 * Theme Utility Helpers
 * Centralized theme class generators for consistent styling across all pages
 */

export const getThemeClasses = (theme) => {
  // Default classes structure for reference (used as fallback)
  // eslint-disable-next-line no-unused-vars
  const defaultClasses = {
    pageBackground: '',
    cardBackground: '',
    cardBorder: '',
    cardHover: '',
    textPrimary: '',
    textSecondary: '',
    textAccent: '',
    buttonPrimary: '',
    buttonSecondary: '',
    buttonHover: '',
    inputBackground: '',
    inputBorder: '',
    inputFocus: '',
    inputText: '',
    badgeBackground: '',
    badgeText: '',
    gradientText: '',
    sectionBackground: '',
    sectionAlt: '',
    accent: '',
    gradient: '',
    border: '',
    hover: '',
  };

  switch (theme) {
    case 'aloof':
      return {
        pageBackground: 'bg-[#f7f9fb]',
        cardBackground: 'bg-[#ffffff]',
        cardBorder: 'border-[#d6e4f0]',
        cardHover: 'hover:border-[#b8d0e8] hover:shadow-md',
        textPrimary: 'text-[#0f172a]',
        textSecondary: 'text-[#475569]',
        textAccent: 'text-[#3b82f6]',
        buttonPrimary: 'bg-[#3b82f6] text-white border border-[#2563eb] shadow-sm',
        buttonSecondary: 'bg-white border border-[#cbd5e1] text-[#0f172a]',
        buttonHover: 'hover:shadow-lg',
        inputBackground: 'bg-white',
        inputBorder: 'border-[#cbd5e1]',
        inputFocus: 'focus:border-[#3b82f6] focus:ring-2 focus:ring-[rgba(59,130,246,0.2)]',
        inputText: 'text-[#0f172a] placeholder-[#94a3b8]',
        badgeBackground: 'bg-[#eff6ff] border border-[#bfdbfe]',
        badgeText: 'text-[#3b82f6]',
        gradientText: 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] bg-clip-text text-transparent',
        sectionBackground: 'bg-[rgba(247,249,251,0.9)]',
        sectionAlt: 'bg-[#eef2f7]',
        // Aliases
        accent: 'text-[#3b82f6]',
        gradient: 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb]',
        border: 'border-[#d6e4f0]',
        hover: 'hover:border-[#b8d0e8]',
      };

    case 'midnight':
      return {
        pageBackground: 'bg-[#0a0a14]',
        cardBackground: 'bg-[#14121e]',
        cardBorder: 'border-[#2a2635]',
        cardHover: 'hover:border-[#3d3548] hover:shadow-lg',
        textPrimary: 'text-[#e2e8f0]',
        textSecondary: 'text-[#94a3b8]',
        textAccent: 'text-[#818cf8]',
        buttonPrimary: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md',
        buttonSecondary: 'bg-[#1e1b29] border border-[#3d3548] text-[#e2e8f0]',
        buttonHover: 'hover:shadow-xl',
        inputBackground: 'bg-[#1e1b29]',
        inputBorder: 'border-[#3d3548]',
        inputFocus: 'focus:border-[#818cf8] focus:ring-2 focus:ring-[rgba(129,140,248,0.3)]',
        inputText: 'text-[#e2e8f0] placeholder-[#64748b]',
        badgeBackground: 'bg-[#312e44] border border-[#4c4760]',
        badgeText: 'text-[#a5b4fc]',
        gradientText: 'bg-gradient-to-r from-[#818cf8] to-[#a78bfa] bg-clip-text text-transparent',
        sectionBackground: 'bg-[rgba(20,18,30,0.95)]',
        sectionAlt: 'bg-[#0f0d18]',
        // Aliases
        accent: 'text-[#818cf8]',
        gradient: 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]',
        border: 'border-[#2a2635]',
        hover: 'hover:border-[#3d3548]',
      };

    case 'dark':
      return {
        pageBackground: 'bg-[#0f172a]',
        cardBackground: 'bg-[#1e1a2e]',
        cardBorder: 'border-pink-500/20',
        cardHover: 'hover:border-pink-500/40 hover:shadow-xl',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-300',
        textAccent: 'text-pink-400',
        buttonPrimary: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30',
        buttonSecondary: 'bg-[#1e1a2e]/60 backdrop-blur-md border-2 border-pink-500/20 text-white',
        buttonHover: 'hover:shadow-glow-lg',
        inputBackground: 'bg-[#1e1a2e]',
        inputBorder: 'border-pink-500/20',
        inputFocus: 'focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/20',
        inputText: 'text-white placeholder-gray-400',
        badgeBackground: 'bg-pink-950/30 border border-pink-500/30',
        badgeText: 'text-pink-400',
        gradientText: 'bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500 bg-clip-text text-transparent',
        sectionBackground: 'bg-[#1a1625]',
        sectionAlt: 'bg-[#2d1f3d]',
        // Aliases
        accent: 'text-pink-400',
        gradient: 'bg-gradient-to-r from-pink-500 via-orange-500 to-purple-500',
        border: 'border-pink-500/20',
        hover: 'hover:border-pink-500/40',
      };

    default: // light
      return {
        pageBackground: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
        cardBackground: 'bg-white',
        cardBorder: 'border-gray-200',
        cardHover: 'hover:border-amber-300 hover:shadow-lg',
        textPrimary: 'text-amber-900',
        textSecondary: 'text-amber-700',
        textAccent: 'text-amber-600',
        buttonPrimary: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg',
        buttonSecondary: 'bg-white border-2 border-amber-200/50 text-amber-800',
        buttonHover: 'hover:shadow-xl',
        inputBackground: 'bg-white',
        inputBorder: 'border-amber-200',
        inputFocus: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-200',
        inputText: 'text-amber-900 placeholder-amber-500',
        badgeBackground: 'bg-amber-100 border border-amber-200',
        badgeText: 'text-amber-600',
        gradientText: 'bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent',
        sectionBackground: 'bg-gradient-to-b from-amber-50 via-orange-50/30 to-amber-50',
        sectionAlt: 'bg-gray-50',
        // Aliases
        accent: 'text-amber-600',
        gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
        border: 'border-gray-200',
        hover: 'hover:border-amber-300',
      };
  }
};

// Helper to get a specific class type
export const getThemeClass = (theme, classType) => {
  const classes = getThemeClasses(theme);
  return classes[classType] || '';
};

// Combine base classes with theme classes
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

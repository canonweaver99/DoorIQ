/**
 * Design System Constants for DoorIQ
 * Premium SaaS aesthetic with modern color palette and animations
 */

export const colors = {
  // Primary - Indigo/Blue gradient
  primary: {
    50: '#f0f4ff',
    100: '#e0eafe',
    200: '#c7d9fd',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Success/Moderate - Emerald
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning/Hard - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger/Expert - Red-Purple
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral - Slate
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#0a0a0a',
  }
} as const

export const typography = {
  display: {
    fontSize: '3.5rem',
    lineHeight: '1.1',
    fontWeight: '800',
  },
  h1: {
    fontSize: '2.5rem',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  h2: {
    fontSize: '2rem',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  h3: {
    fontSize: '1.5rem',
    lineHeight: '1.3',
    fontWeight: '600',
  },
  h4: {
    fontSize: '1.25rem',
    lineHeight: '1.4',
    fontWeight: '600',
  },
  body: {
    fontSize: '1rem',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  small: {
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontWeight: '400',
  },
  tiny: {
    fontSize: '0.75rem',
    lineHeight: '1.5',
    fontWeight: '400',
  }
} as const

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem',   // 96px
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  glow: {
    primary: '0 0 20px rgb(99 102 241 / 0.3)',
    success: '0 0 20px rgb(34 197 94 / 0.3)',
    warning: '0 0 20px rgb(245 158 11 / 0.3)',
    danger: '0 0 20px rgb(239 68 68 / 0.3)',
  }
} as const

export const animations = {
  transitions: {
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 }
    },
    slideUp: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 }
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 }
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 }
    }
  }
} as const

export const difficultyThemes = {
  moderate: {
    gradient: 'from-emerald-500 to-green-600',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    hover: 'hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500',
  },
  hard: {
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    hover: 'hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
  },
  veryHard: {
    gradient: 'from-orange-500 to-red-500',
    border: 'border-orange-500/50',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    hover: 'hover:border-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    button: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500',
  },
  expert: {
    gradient: 'from-red-500 via-rose-500 to-purple-600',
    border: 'border-red-500/50',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    hover: 'hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    button: 'bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:via-rose-500 hover:to-purple-500',
  }
} as const

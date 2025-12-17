/**
 * DoorIQ Mobile Theme Constants
 * Design system for consistent styling across the app
 */

export const COLORS = {
  // Primary brand color (indigo)
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  
  // Background colors
  background: '#0a0a0a',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#2a2a2a',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#666666',
  
  // Status colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Difficulty colors
  difficultyEasy: '#22c55e',
  difficultyModerate: '#3b82f6',
  difficultyHard: '#f59e0b',
  difficultyExpert: '#ef4444',
  
  // Border colors
  border: '#2a2a2a',
  borderLight: '#1a1a1a',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 36,
} as const

export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

// Minimum touch target size (44x44pt per iOS/Android guidelines)
export const MIN_TOUCH_TARGET = 44

// Shadow presets
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const

// Grade colors
export const GRADE_COLORS = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
} as const

// Helper function to get grade from score
export const getGradeFromScore = (score: number | null | undefined): 'A' | 'B' | 'C' | 'D' | 'F' => {
  if (score === null || score === undefined) return 'F'
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

// Helper function to get difficulty color
export const getDifficultyColor = (difficulty: string): string => {
  const normalized = difficulty.toLowerCase()
  switch (normalized) {
    case 'easy':
      return COLORS.difficultyEasy
    case 'moderate':
      return COLORS.difficultyModerate
    case 'hard':
      return COLORS.difficultyHard
    case 'expert':
    case 'very hard':
      return COLORS.difficultyExpert
    default:
      return COLORS.textSecondary
  }
}


'use client'

/**
 * iOS-style haptic feedback hook
 * Provides different haptic feedback types matching iOS patterns
 */
export function useHaptic() {
  const trigger = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => {
    if (typeof window === 'undefined') return
    
    // Check if device supports haptics
    if (!('vibrate' in navigator)) return

    try {
      switch (type) {
        case 'light':
          // Light impact - for subtle interactions
          navigator.vibrate(10)
          break
        case 'medium':
          // Medium impact - for standard interactions
          navigator.vibrate(20)
          break
        case 'heavy':
          // Heavy impact - for important actions
          navigator.vibrate(30)
          break
        case 'success':
          // Success pattern - two quick vibrations
          navigator.vibrate([10, 50, 10])
          break
        case 'warning':
          // Warning pattern - medium vibration
          navigator.vibrate([20, 50, 20])
          break
        case 'error':
          // Error pattern - three vibrations
          navigator.vibrate([30, 50, 30, 50, 30])
          break
        case 'selection':
          // Selection feedback - very light
          navigator.vibrate(5)
          break
        default:
          navigator.vibrate(10)
      }
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
    }
  }

  return { trigger }
}


'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useHaptic } from './useHaptic'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true
}: SwipeGestureOptions) {
  const startX = useRef<number>(0)
  const startY = useRef<number>(0)
  const isSwiping = useRef<boolean>(false)
  const { trigger } = useHaptic()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isSwiping.current = true
  }, [enabled])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !isSwiping.current) return

    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = endX - startX.current
    const deltaY = endY - startY.current

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Determine if horizontal or vertical swipe
    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        trigger('light')
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        trigger('light')
        onSwipeLeft()
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        trigger('light')
        onSwipeDown()
      } else if (deltaY < 0 && onSwipeUp) {
        trigger('light')
        onSwipeUp()
      }
    }

    isSwiping.current = false
  }, [enabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, trigger])

  const attachListeners = useCallback((element: HTMLElement | null) => {
    if (!element || !enabled) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchEnd])

  return { attachListeners }
}


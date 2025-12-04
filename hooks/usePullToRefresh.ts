'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useHaptic } from '@/hooks/useHaptic'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 80, enabled = true }: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isPulling = useRef<boolean>(false)
  const { trigger } = useHaptic()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return
    
    // Only trigger if at the top of the scrollable container
    const target = e.target as HTMLElement
    const scrollContainer = target.closest('[data-scroll-container]')
    
    if (scrollContainer) {
      const container = scrollContainer as HTMLElement
      if (container.scrollTop > 0) return
    } else {
      // Check window scroll
      if (window.scrollY > 0) return
    }

    startY.current = e.touches[0].clientY
    isPulling.current = true
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isPulling.current) return

    currentY.current = e.touches[0].clientY
    const distance = currentY.current - startY.current

    if (distance > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault()
      
      // Calculate pull distance with resistance
      const resistance = 0.5
      const newDistance = Math.min(distance * resistance, threshold * 1.5)
      setPullDistance(newDistance)

      // Haptic feedback when crossing threshold
      if (newDistance >= threshold && pullDistance < threshold) {
        trigger('light')
      }
    }
  }, [enabled, threshold, pullDistance, trigger])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPulling.current) return

    isPulling.current = false

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      trigger('medium')
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [enabled, pullDistance, threshold, onRefresh, trigger])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  }
}


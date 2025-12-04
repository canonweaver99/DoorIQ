'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  enabled?: boolean
  threshold?: number
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  enabled = true,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const { isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
    threshold,
    enabled
  })

  const shouldShowIndicator = pullDistance > 0 || isRefreshing
  const rotation = pullProgress * 360

  return (
    <div className={cn('relative', className)} data-scroll-container>
      {/* Pull Indicator */}
      {shouldShowIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ 
            opacity: shouldShowIndicator ? 1 : 0,
            y: shouldShowIndicator ? 0 : -50
          }}
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
          style={{
            height: `${Math.min(pullDistance, threshold * 1.5)}px`,
            paddingTop: 'env(safe-area-inset-top)'
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isRefreshing ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 0.2 }}
                className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white"
              />
            )}
            {pullDistance >= threshold && !isRefreshing && (
              <p className="text-xs text-white/60">Release to refresh</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        animate={{
          y: shouldShowIndicator ? Math.min(pullDistance, threshold * 1.5) : 0
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ willChange: shouldShowIndicator ? 'transform' : 'auto' }}
      >
        {children}
      </motion.div>
    </div>
  )
}


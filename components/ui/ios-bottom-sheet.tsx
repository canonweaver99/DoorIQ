'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useIsMobile'
import { useHaptic } from '@/hooks/useHaptic'

interface IOSBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showCloseButton?: boolean
  maxHeight?: string
  snapPoints?: number[]
  className?: string
}

export function IOSBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  maxHeight = '85vh',
  snapPoints,
  className
}: IOSBottomSheetProps) {
  const prefersReducedMotion = useReducedMotion()
  const { trigger } = useHaptic()
  const y = useMotionValue(0)
  const sheetRef = React.useRef<HTMLDivElement>(null)

  const handleDragEnd = React.useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    if (info.offset.y > threshold || info.velocity.y > 500) {
      trigger('light')
      onClose()
      y.set(0)
    } else {
      y.set(0)
    }
  }, [onClose, y, trigger])

  const handleBackdropClick = React.useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      trigger('light')
      onClose()
    }
  }, [onClose, trigger])

  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.25 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[60]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={prefersReducedMotion ? false : { y: '100%' }}
            animate={prefersReducedMotion ? false : { y: 0 }}
            exit={prefersReducedMotion ? false : { y: '100%' }}
            transition={prefersReducedMotion ? { duration: 0.2 } : { type: 'spring', damping: 35, stiffness: 400 }}
            className={cn(
              'fixed left-0 right-0 bottom-0 z-[70]',
              'overflow-y-auto',
              'rounded-t-3xl',
              'shadow-2xl',
              className
            )}
            style={{
              y,
              maxHeight,
              paddingBottom: `max(env(safe-area-inset-bottom), 16px)`,
              background: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 pb-4">
                {title && (
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={() => {
                      trigger('light')
                      onClose()
                    }}
                    className={cn(
                      'p-2 rounded-lg',
                      'min-w-[44px] min-h-[44px]',
                      'flex items-center justify-center',
                      'hover:bg-gray-800 active:bg-gray-700',
                      'transition-colors duration-200',
                      'touch-manipulation'
                    )}
                    aria-label="Close"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}


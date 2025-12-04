'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface IOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat'
  interactive?: boolean
  haptic?: boolean
}

const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ className, variant = 'default', interactive = false, haptic = false, children, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false)

    const handlePressStart = () => {
      setIsPressed(true)
      if (haptic && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(5)
        } catch {}
      }
    }

    const handlePressEnd = () => {
      setIsPressed(false)
    }

    const baseStyles = cn(
      'rounded-2xl',
      'transition-all duration-200',
      variant === 'default' && 'bg-white/5 border border-white/10 backdrop-blur-xl',
      variant === 'elevated' && 'bg-white/10 border border-white/20 backdrop-blur-xl shadow-lg',
      variant === 'flat' && 'bg-white/5 border border-white/5',
      interactive && 'cursor-pointer active:scale-[0.98]',
      isPressed && interactive && 'scale-[0.98] opacity-90',
      className
    )

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          className={baseStyles}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          whileTap={interactive ? { scale: 0.98 } : undefined}
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    )
  }
)
IOSCard.displayName = 'IOSCard'

const IOSCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4', className)}
    {...props}
  />
))
IOSCardHeader.displayName = 'IOSCardHeader'

const IOSCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-white',
      className
    )}
    {...props}
  />
))
IOSCardTitle.displayName = 'IOSCardTitle'

const IOSCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-white/60', className)}
    {...props}
  />
))
IOSCardDescription.displayName = 'IOSCardDescription'

const IOSCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
))
IOSCardContent.displayName = 'IOSCardContent'

const IOSCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
))
IOSCardFooter.displayName = 'IOSCardFooter'

export { IOSCard, IOSCardHeader, IOSCardFooter, IOSCardTitle, IOSCardDescription, IOSCardContent }


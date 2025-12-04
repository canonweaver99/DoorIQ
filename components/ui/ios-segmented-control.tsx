'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/useHaptic'

interface IOSSegmentedControlOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface IOSSegmentedControlProps {
  options: IOSSegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function IOSSegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'md'
}: IOSSegmentedControlProps) {
  const { trigger } = useHaptic()
  const activeIndex = options.findIndex(opt => opt.value === value)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleChange = (newValue: string) => {
    trigger('selection')
    onChange(newValue)
  }

  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    md: 'h-10 text-sm px-3',
    lg: 'h-12 text-base px-4'
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'inline-flex items-center rounded-xl p-1',
        'bg-white/5 border border-white/10',
        'backdrop-blur-xl',
        sizeClasses[size],
        className
      )}
    >
      {options.map((option, index) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(
              'relative flex items-center justify-center gap-2',
              'px-4 py-2 rounded-lg',
              'text-sm font-medium',
              'transition-all duration-200',
              'min-w-[44px] min-h-[44px]',
              'touch-manipulation',
              isActive ? 'text-white' : 'text-white/60'
            )}
          >
            {option.icon && (
              <span className={cn('flex-shrink-0', isActive ? 'opacity-100' : 'opacity-60')}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            
            {isActive && (
              <motion.div
                layoutId="activeSegment"
                className="absolute inset-0 bg-white/10 rounded-lg border border-white/20"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}


'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StrikeCounterProps {
  strikes: number
  maxStrikes?: number
  className?: string
}

export function StrikeCounter({ strikes, maxStrikes = 3, className }: StrikeCounterProps) {
  const strikePercentage = (strikes / maxStrikes) * 100
  
  // Color scheme based on strike count
  const getColorClasses = () => {
    if (strikes === 0) {
      return {
        bg: 'bg-slate-700/50',
        border: 'border-slate-600/50',
        text: 'text-slate-300',
        icon: 'text-slate-400'
      }
    } else if (strikes === 1) {
      return {
        bg: 'bg-amber-500/20',
        border: 'border-amber-500/60',
        text: 'text-amber-300',
        icon: 'text-amber-400'
      }
    } else if (strikes === 2) {
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/60',
        text: 'text-orange-300',
        icon: 'text-orange-400'
      }
    } else {
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/60',
        text: 'text-red-300',
        icon: 'text-red-400'
      }
    }
  }

  const colors = getColorClasses()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border-2 backdrop-blur-sm shadow-lg",
          colors.bg,
          colors.border,
          className
        )}
      >
        <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", colors.icon)} />
        <div className="flex flex-col min-w-[80px]">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-sm font-bold font-space", colors.text)}>
              Strikes: {strikes}/{maxStrikes}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-1 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strikePercentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "h-full rounded-full",
                strikes === 0 ? 'bg-slate-600' :
                strikes === 1 ? 'bg-amber-500' :
                strikes === 2 ? 'bg-orange-500' :
                'bg-red-500'
              )}
            />
          </div>
        </div>
        {strikes >= maxStrikes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-1"
          >
            <span className={cn("text-xs font-semibold", colors.text)}>
              ⚠️
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

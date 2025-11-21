'use client'

import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

interface SessionProgressBarProps {
  duration: number // in seconds
  maxDuration?: number // in seconds, default 15 minutes
}

export function SessionProgressBar({ duration, maxDuration = 600 }: SessionProgressBarProps) {
  const progress = Math.min((duration / maxDuration) * 100, 100)
  const minutesRemaining = Math.max(0, Math.floor((maxDuration - duration) / 60))
  const secondsRemaining = Math.max(0, (maxDuration - duration) % 60)
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400 font-medium">Session Progress</span>
        <span className="text-xs text-slate-400 font-mono">
          {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')} remaining
        </span>
      </div>
      <div className="relative h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {progress >= 90 && (
          <motion.div
            className="absolute inset-0 bg-amber-500/40"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  )
}


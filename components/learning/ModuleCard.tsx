'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'
import { ProgressIndicator } from './ProgressIndicator'
import { ModuleWithProgress } from '@/lib/learning/types'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  module: ModuleWithProgress
  delay?: number
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  approach: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  },
  pitch: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400'
  },
  overcome: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400'
  },
  close: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400'
  },
  objections: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400'
  }
}

const categoryLabels: Record<string, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections'
}

export function ModuleCard({ module, delay = 0 }: ModuleCardProps) {
  const categoryStyle = categoryColors[module.category] || categoryColors.approach
  const isCompleted = module.progress?.completed_at !== null
  const timeSpent = module.progress?.time_spent_seconds || 0

  return (
    <Link href={`/learning/modules/${module.slug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6',
          'hover:border-purple-500/50 transition-all duration-300 cursor-pointer',
          'flex flex-col gap-4',
          'shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-semibold border',
                  categoryStyle.bg,
                  categoryStyle.border,
                  categoryStyle.text
                )}
              >
                {categoryLabels[module.category]}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-space line-clamp-2">
              {module.title}
            </h3>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </div>

        {/* Progress and Time */}
        <div className="flex items-center justify-between">
          <ProgressIndicator
            completed={isCompleted}
            timeSpent={timeSpent}
            estimatedMinutes={module.estimated_minutes}
          />
          <div className="flex items-center gap-1 text-xs text-slate-400 font-sans">
            <Clock className="w-4 h-4" />
            <span>{module.estimated_minutes} min</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}


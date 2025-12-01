'use client'

import { CheckCircle2, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  completed: boolean
  timeSpent?: number
  estimatedMinutes?: number
  className?: string
}

export function ProgressIndicator({
  completed,
  timeSpent = 0,
  estimatedMinutes = 5,
  className
}: ProgressIndicatorProps) {
  const getStatusIcon = () => {
    if (completed) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />
    }
    if (timeSpent > 0) {
      return <Clock className="w-5 h-5 text-yellow-400" />
    }
    return <Circle className="w-5 h-5 text-slate-500" />
  }

  const getStatusText = () => {
    if (completed) {
      return 'Completed'
    }
    if (timeSpent > 0) {
      return 'In Progress'
    }
    return 'Not Started'
  }

  const getStatusColor = () => {
    if (completed) {
      return 'text-green-400 bg-green-500/10 border-green-500/30'
    }
    if (timeSpent > 0) {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    }
    return 'text-slate-500 bg-slate-800/50 border-slate-700/50'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getStatusIcon()}
      <span className={cn('text-sm font-medium px-2 py-1 rounded border', getStatusColor())}>
        {getStatusText()}
      </span>
      {estimatedMinutes > 0 && (
        <span className="text-xs text-slate-400 font-sans">
          {estimatedMinutes} min read
        </span>
      )}
    </div>
  )
}



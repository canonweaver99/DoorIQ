'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ModuleWithProgress } from '@/lib/learning/types'
import { MarkdownContent } from './MarkdownContent'
import { ProgressIndicator } from './ProgressIndicator'
import { ModuleNavigation } from './ModuleNavigation'
import { PracticeChallenge } from './PracticeChallenge'
import { useModuleProgress } from '@/hooks/learning/useModuleProgress'
import { useModules } from '@/hooks/learning/useModules'
import { cn } from '@/lib/utils'

// Map categories to colors (matching learning center category cards)
const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
    'approach': {
      bg: '#0a2a1a',
      border: '#1a4a2a',
      glow: 'rgba(16, 185, 129, 0.1)',
    },
    'pitch': {
      bg: '#1a2a3a',
      border: '#2a4a6a',
      glow: 'rgba(59, 130, 246, 0.1)',
    },
    'overcome': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
    },
    'close': {
      bg: '#3a1a2a',
      border: '#6a2a4a',
      glow: 'rgba(236, 72, 153, 0.1)',
    },
    'objections': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
    },
    'communication': {
      bg: '#1a1a1a',
      border: '#3a3a3a',
      glow: 'rgba(148, 163, 184, 0.1)',
    }
  }
  return colorMap[category] || colorMap['approach']
}

interface ModuleDetailProps {
  module: ModuleWithProgress
  allModules?: ModuleWithProgress[]
}

export function ModuleDetail({ module, allModules: providedModules }: ModuleDetailProps) {
  const [timeSpent, setTimeSpent] = useState(0)
  // Use same logic as ModuleCard: only completed if progress exists AND completed_at is not null
  const [isCompleted, setIsCompleted] = useState(
    module.progress !== null && module.progress !== undefined && module.progress.completed_at !== null
  )
  const { markComplete, loading: progressLoading } = useModuleProgress()
  const { modules: fetchedModules } = useModules()
  
  const allModules = providedModules || fetchedModules

  // Update completion status when module prop changes
  useEffect(() => {
    setIsCompleted(
      module.progress !== null && module.progress !== undefined && module.progress.completed_at !== null
    )
  }, [module.progress?.completed_at])

  // Track time spent reading
  useEffect(() => {
    if (isCompleted) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setTimeSpent(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isCompleted])

  const handleMarkComplete = async () => {
    try {
      await markComplete(module.id, timeSpent)
      setIsCompleted(true)
      // Refresh the page to update progress everywhere
      window.location.reload()
    } catch (error) {
      console.error('Failed to mark module as complete:', error)
    }
  }

  const categoryColors = getCategoryColors(module.category)

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Content Card with Title and Progress */}
      <div 
        className="rounded-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6"
        style={{
          backgroundColor: categoryColors.bg,
          border: `2px solid ${categoryColors.border}`,
          boxShadow: `inset 0 0 20px ${categoryColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
        }}
      >
        {/* Title and Progress Bar */}
        <div 
          className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b"
          style={{ borderColor: categoryColors.border }}
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-space leading-tight pr-2">
              {module.title}
            </h1>
          </div>
          <ProgressIndicator
            completed={isCompleted}
            timeSpent={timeSpent}
            estimatedMinutes={module.estimated_minutes}
          />
        </div>

        {/* Content */}
        {module.content ? (
          <MarkdownContent content={module.content} moduleTitle={module.title} />
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 font-sans">Content coming soon...</p>
          </div>
        )}
      </div>

      {/* Practice Challenge */}
      <PracticeChallenge moduleSlug={module.slug} moduleTitle={module.title} moduleCategory={module.category} />

      {/* Completed Button at Bottom */}
      <div className="flex justify-center mt-6 sm:mt-8 mb-4 sm:mb-6">
        <button
          onClick={handleMarkComplete}
          disabled={progressLoading}
          className={cn(
            'flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-semibold text-base sm:text-lg min-h-[48px] sm:min-h-[56px] touch-manipulation active:scale-95',
            isCompleted 
              ? 'bg-green-600 active:bg-green-700 text-white' 
              : 'bg-purple-600 active:bg-purple-700 text-white',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'font-space'
          )}
        >
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="whitespace-nowrap">{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
        </button>
      </div>

      {/* Navigation */}
      {allModules && allModules.length > 0 && (
        <ModuleNavigation currentModule={module} allModules={allModules} />
      )}
    </div>
  )
}


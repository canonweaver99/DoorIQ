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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Content Card with Title and Progress */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 sm:p-8 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        {/* Title and Progress Bar */}
        <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-space">
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
      <div className="flex justify-center mt-8 mb-6">
        <button
          onClick={handleMarkComplete}
          disabled={progressLoading}
          className={cn(
            'flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg',
            isCompleted 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'font-space'
          )}
        >
          <CheckCircle2 className="w-6 h-6" />
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      </div>

      {/* Navigation */}
      {allModules && allModules.length > 0 && (
        <ModuleNavigation currentModule={module} allModules={allModules} />
      )}
    </div>
  )
}


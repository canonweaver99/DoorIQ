'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { LearningObjection } from '@/lib/learning/types'
import { useObjectionProgress } from '@/hooks/learning/useObjectionProgress'
import { cn } from '@/lib/utils'

interface ObjectionDetailProps {
  objection: LearningObjection & { progress?: { completed_at: string | null } | null }
}

export function ObjectionDetail({ objection }: ObjectionDetailProps) {
  // The description field contains the full markdown content
  const markdownContent = objection.description || ''
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(objection.progress?.completed_at !== null)
  const { markComplete, loading: progressLoading } = useObjectionProgress()

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
      await markComplete(objection.id, timeSpent)
      setIsCompleted(true)
      // Refresh the page to update progress everywhere
      window.location.reload()
    } catch (error) {
      console.error('Failed to mark objection as complete:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded text-sm font-semibold border bg-red-500/10 border-red-500/30 text-red-400">
            Objection Handling
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-space">
          {objection.name}
        </h1>
      </div>

      {/* Content - Full markdown from description field */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 sm:p-8 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        {markdownContent ? (
          <MarkdownContent content={markdownContent} />
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 font-sans">Content coming soon...</p>
          </div>
        )}
      </div>

      {/* Example Scripts from JSONB scripts field */}
      {objection.scripts && objection.scripts.length > 0 && (
        <div className="space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-white font-space">Additional Example Scripts</h2>
          {objection.scripts.map((script, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            >
              {script.title && (
                <h3 className="text-xl font-semibold text-white mb-4 font-space">
                  {script.title}
                </h3>
              )}
              <div className="space-y-3">
                {script.script && (
                  <div className="prose prose-invert max-w-none">
                    <MarkdownContent content={script.script} />
                  </div>
                )}
                {script.tips && script.tips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2 font-space">Tips:</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm font-sans">
                      {script.tips.map((tip, tipIndex) => (
                        <li key={tipIndex}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  )
}


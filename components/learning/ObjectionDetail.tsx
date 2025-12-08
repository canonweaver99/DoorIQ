'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { LearningObjection } from '@/lib/learning/types'
import { useObjectionProgress } from '@/hooks/learning/useObjectionProgress'
import { cn } from '@/lib/utils'

// Objections category colors (matching objections module category)
const objectionsColors = {
  bg: '#3a2a1a',
  border: '#6a4a2a',
  glow: 'rgba(245, 158, 11, 0.1)',
}

interface ObjectionDetailProps {
  objection: LearningObjection & { progress?: { completed_at: string | null } | null }
}

export function ObjectionDetail({ objection }: ObjectionDetailProps) {
  const router = useRouter()
  // The description field contains the full markdown content
  const markdownContent = objection.description || ''
  const [timeSpent, setTimeSpent] = useState(0)
  const [currentObjection, setCurrentObjection] = useState(objection)
  const [isCompleted, setIsCompleted] = useState(objection.progress?.completed_at !== null)
  const { markComplete, loading: progressLoading } = useObjectionProgress()

  // Update when objection prop changes
  useEffect(() => {
    setCurrentObjection(objection)
    setIsCompleted(objection.progress?.completed_at !== null)
  }, [objection.progress?.completed_at, objection])

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
      const completedAt = new Date().toISOString()
      
      // Update local state immediately for instant UI feedback
      setIsCompleted(true)
      setCurrentObjection({
        ...currentObjection,
        progress: {
          ...currentObjection.progress,
          completed_at: completedAt,
          time_spent_seconds: timeSpent,
        } as any
      })
      
      // Refresh Next.js router cache to update data everywhere
      router.refresh()
      
      // Also refetch the objection to ensure we have the latest data
      try {
        const response = await fetch(`/api/learning/objections/${objection.slug}?_t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentObjection(data.objection)
        }
      } catch (fetchError) {
        console.error('Failed to refetch objection:', fetchError)
      }
    } catch (error) {
      console.error('Failed to mark objection as complete:', error)
      // Revert on error
      setIsCompleted(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Content Card with Title */}
      <div 
        className="rounded-lg p-6 sm:p-8 mb-6"
        style={{
          backgroundColor: objectionsColors.bg,
          border: `2px solid ${objectionsColors.border}`,
          boxShadow: `inset 0 0 20px ${objectionsColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
        }}
      >
        {/* Title */}
        <div 
          className="mb-6 pb-6 border-b"
          style={{ borderColor: objectionsColors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-space">
              {currentObjection.name}
            </h1>
          </div>
        </div>

        {/* Content - Full markdown from description field */}
        {markdownContent ? (
          <MarkdownContent content={markdownContent} />
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 font-sans">Content coming soon...</p>
          </div>
        )}
      </div>

      {/* Example Scripts from JSONB scripts field */}
      {currentObjection.scripts && currentObjection.scripts.length > 0 && (
        <div className="space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-white font-space">Additional Example Scripts</h2>
          {currentObjection.scripts.map((script, index) => (
            <div
              key={index}
              className="rounded-lg p-6"
              style={{
                backgroundColor: objectionsColors.bg,
                border: `2px solid ${objectionsColors.border}`,
                boxShadow: `inset 0 0 20px ${objectionsColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
              }}
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
          disabled={progressLoading || isCompleted}
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
          {isCompleted ? 'Completed' : progressLoading ? 'Marking...' : 'Mark as Completed'}
        </button>
      </div>
    </div>
  )
}


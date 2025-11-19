'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, TrendingUp, MessageSquare, Target, Lightbulb, Zap } from 'lucide-react'

interface StreamingSection {
  session_summary?: any
  scores?: any
  feedback?: any
  objection_analysis?: any
  coaching_plan?: any
  line_ratings?: any[]
}

interface StreamingGradingDisplayProps {
  sessionId: string
  onComplete: () => void
}

const SECTION_ICONS: { [key: string]: any } = {
  session_summary: TrendingUp,
  scores: Target,
  feedback: MessageSquare,
  objection_analysis: Zap,
  coaching_plan: Lightbulb,
  line_ratings: CheckCircle2,
}

const SECTION_LABELS: { [key: string]: string } = {
  session_summary: 'Session Analysis',
  scores: 'Performance Scores',
  feedback: 'Detailed Feedback',
  objection_analysis: 'Objection Handling',
  coaching_plan: 'Personalized Coaching',
}

export default function StreamingGradingDisplay({ sessionId, onComplete }: StreamingGradingDisplayProps) {
  const [sections, setSections] = useState<StreamingSection>({})
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [currentSection, setCurrentSection] = useState<string>('')
  const [status, setStatus] = useState('Initializing AI analysis...')
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    const connectToStream = async () => {
      try {
        setStatus('Saving session data...')
        
        // Reduced delay since we now wait for save to complete before redirecting
        // This is just a safety buffer in case of any timing edge cases
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setStatus('Connecting to AI...')
        
        const response = await fetch('/api/grade/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`Failed to start streaming: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No reader available - response body is null')
        }

        setStatus('AI is analyzing your conversation...')

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6)
              try {
                const data = JSON.parse(jsonStr)

                switch (data.type) {
                  case 'status':
                    setStatus(data.message)
                    break

                  case 'section':
                    setCurrentSection(data.section)
                    setSections(prev => ({
                      ...prev,
                      [data.section]: data.data
                    }))
                    setCompletedSections(prev => new Set(prev).add(data.section))
                    // Convert underscore-separated strings to readable text
                    const readableSection = SECTION_LABELS[data.section] || 
                      data.section
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                    setStatus(`Analyzing: ${readableSection}`)
                    break

                  case 'complete':
                    setIsComplete(true)
                    setStatus('Grading complete!')
                    setTimeout(() => {
                      onComplete()
                    }, 1500)
                    break

                  case 'error':
                    setError(data.message)
                    setStatus('Error occurred')
                    break
                }
              } catch (e) {
                console.error('Failed to parse streaming data:', e)
              }
            }
          }
        }

      } catch (err: any) {
        console.error('Streaming error:', err)
        const errorMessage = err?.message || 'Unknown error occurred'
        setError(errorMessage)
        setStatus('Error connecting to AI')
        
        // Log detailed error for debugging
        console.error('Streaming error details:', {
          message: errorMessage,
          stack: err?.stack,
          sessionId
        })
      }
    }

    connectToStream()
  }, [sessionId, onComplete])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  const getSectionProgress = () => {
    const total = Object.keys(SECTION_LABELS).length
    // Only count sections that are in SECTION_LABELS
    const completed = Array.from(completedSections).filter(section => 
      SECTION_LABELS.hasOwnProperty(section)
    ).length
    const percentage = Math.round((completed / total) * 100)
    // Cap at 100% to prevent showing more than 100%
    return Math.min(percentage, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          {/* Main Status */}
          <motion.div
            animate={isComplete ? {} : { rotate: 360 }}
            transition={isComplete ? {} : { duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6"
          >
            {isComplete ? (
              <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            ) : (
              <Loader2 className="w-20 h-20 text-purple-500" />
            )}
          </motion.div>

          <h1 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-3">
            {status}
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
            <span>{formatTime(elapsedTime)} elapsed</span>
            <span>•</span>
            <span>{getSectionProgress()}% complete</span>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Progress Sections */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {Object.entries(SECTION_LABELS).map(([key, label]) => {
              const Icon = SECTION_ICONS[key]
              const isCompleted = completedSections.has(key)
              const isCurrent = currentSection === key
              const sectionData = sections[key as keyof StreamingSection]

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    relative overflow-hidden rounded-xl border transition-all duration-300
                    ${isCompleted 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : isCurrent
                      ? 'bg-purple-500/5 border-purple-500/30'
                      : 'bg-slate-900/50 border-slate-700/50'
                    }
                  `}
                >
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <div className="relative p-4 flex items-center gap-4">
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : isCurrent
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-700/50 text-slate-500'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className={`
                        font-medium
                        ${isCompleted 
                          ? 'text-emerald-300' 
                          : isCurrent
                          ? 'text-purple-300'
                          : 'text-slate-400'
                        }
                      `}>
                        {label}
                      </div>
                      
                      {/* Show preview data if available */}
                      {isCompleted && sectionData && (
                        <div className="mt-1 text-xs text-slate-500">
                          {key === 'scores' && sectionData.overall && (
                            <span>Overall Score: {sectionData.overall}/100</span>
                          )}
                          {key === 'session_summary' && sectionData.total_lines && (
                            <span>{sectionData.total_lines} conversation lines analyzed</span>
                          )}
                          {key === 'feedback' && sectionData.strengths && (
                            <span>{sectionData.strengths.length} strengths identified</span>
                          )}
                          {key === 'objection_analysis' && sectionData.total_objections !== undefined && (
                            <span>{sectionData.total_objections} objections handled</span>
                          )}
                          {key === 'line_ratings' && Array.isArray(sectionData) && (
                            <span>{sectionData.length} lines rated</span>
                          )}
                        </div>
                      )}
                    </div>

                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <div className="text-xs font-semibold text-emerald-400">✓</div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Fun fact while waiting */}
        {!isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="mt-8 text-center"
          >
            <div className="inline-block px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <span className="text-sm text-purple-300">
                💡 Our AI is analyzing {sections.session_summary?.total_lines || 'hundreds of'} lines in real-time
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect, useCallback } from 'react'
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
  session_summary: 'AI-Powered Analysis',
  scores: 'Performance Scores',
  feedback: 'Detailed Feedback',
  objection_analysis: 'Objection Handling',
  coaching_plan: 'Personalized Coaching',
}

export default function StreamingGradingDisplay({ sessionId, onComplete }: StreamingGradingDisplayProps) {
  const [sections, setSections] = useState<StreamingSection>({})
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [currentSection, setCurrentSection] = useState<string>('')
  const [status, setStatus] = useState('AI is analyzing your conversation...')
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

  // Check if transcript is available before starting grading
  const waitForTranscript = useCallback(async (maxRetries = 15, retryDelay = 500): Promise<boolean> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`/api/session?id=${sessionId}`)
        if (response.ok) {
          const session = await response.json()
          const transcript = session.full_transcript
          
          console.log(`🔍 Attempt ${attempt + 1}/${maxRetries}: Checking transcript...`, {
            hasTranscript: !!transcript,
            transcriptType: Array.isArray(transcript) ? 'array' : typeof transcript,
            transcriptLength: Array.isArray(transcript) ? transcript.length : 'N/A',
            sessionEndedAt: session.ended_at,
            sessionDuration: session.duration_seconds
          })
          
          if (transcript && Array.isArray(transcript) && transcript.length > 0) {
            console.log(`✅ Transcript available after ${attempt + 1} attempt(s), ${transcript.length} lines`)
            return true
          } else if (transcript && !Array.isArray(transcript)) {
            console.warn(`⚠️ Transcript exists but is not an array. Type: ${typeof transcript}`)
          }
        } else {
          console.warn(`⚠️ Failed to fetch session (attempt ${attempt + 1}):`, response.status, response.statusText)
        }
      } catch (error) {
        console.warn(`⚠️ Error checking transcript (attempt ${attempt + 1}):`, error)
      }
      
      if (attempt < maxRetries - 1) {
        setStatus(`Waiting for transcript... (${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        // Exponential backoff: increase delay with each retry
        retryDelay = Math.min(retryDelay * 1.5, 2000)
      }
    }
    
    // Final check - log detailed info about what we found
    try {
      const finalCheck = await fetch(`/api/session?id=${sessionId}`)
      if (finalCheck.ok) {
        const session = await finalCheck.json()
        console.error(`❌ Transcript not available after ${maxRetries} attempts. Final session state:`, {
          sessionId,
          hasTranscript: !!session.full_transcript,
          transcriptType: typeof session.full_transcript,
          transcriptLength: Array.isArray(session.full_transcript) ? session.full_transcript.length : 'N/A',
          endedAt: session.ended_at,
          duration: session.duration_seconds,
          endReason: session.end_reason
        })
      }
    } catch (e) {
      console.error('❌ Failed to fetch final session state:', e)
    }
    
    return false
  }, [sessionId])

  const connectToStream = useCallback(async () => {
    try {
      setStatus('Preparing AI analysis...')
      setError(null)
      
      // Wait for transcript to be available before starting grading
      const transcriptReady = await waitForTranscript()
      if (!transcriptReady) {
        throw new Error('Transcript not available. The session may not have been saved properly.')
      }
      
      setStatus('AI is analyzing your conversation...')
      
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
                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
        
        // Check if it's a "No transcript" error - provide helpful retry
        if (errorMessage.includes('No transcript to grade')) {
          setError('Transcript not ready yet. This usually means the session is still being saved. Click retry to check again.')
        } else {
          setError(errorMessage)
        }
        setStatus('Error connecting to AI')
      }
  }, [sessionId, waitForTranscript, onComplete])

  useEffect(() => {
    connectToStream()
  }, [connectToStream])
  
  const handleRetry = useCallback(() => {
    setError(null)
    setSections({})
    setCompletedSections(new Set())
    setCurrentSection('')
    setIsComplete(false)
    connectToStream()
  }, [connectToStream])

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
            <div className="mt-4 space-y-3">
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors"
              >
                Retry Connection
              </button>
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


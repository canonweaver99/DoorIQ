'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, TrendingUp, MessageSquare, Target, Lightbulb, Zap, Wifi, WifiOff } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'retrying' | 'failed'
type ErrorType = 'network' | 'timeout' | 'parse' | 'server' | 'unknown'

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
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [retryCount, setRetryCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RETRIES = 3
  const INITIAL_RETRY_DELAY = 1000 // 1 second

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

  const connectToStream = useCallback(async (isRetry = false) => {
    // Store current sessionId to validate against
    const currentSessionId = sessionId
    
    // Cleanup previous stream if exists
    if (readerRef.current) {
      try {
        await readerRef.current.cancel()
      } catch (e) {
        // Ignore cleanup errors
      }
      readerRef.current = null
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    // Reset state for new session (but preserve retry count on retry)
    if (!isRetry) {
      setSections({})
      setCompletedSections(new Set())
      setCurrentSection('')
      setRetryCount(0)
    }
    
    setError(null)
    setErrorType(null)
    setIsComplete(false)
    
    try {
      if (isRetry) {
        setConnectionState('retrying')
        setStatus(`Reconnecting... (Attempt ${retryCount + 1}/${MAX_RETRIES})`)
      } else {
        setConnectionState('connecting')
        setStatus('Preparing AI analysis...')
      }
      
      // Wait for transcript to be available before starting grading
      const transcriptReady = await waitForTranscript()
      if (!transcriptReady) {
        throw new Error('Transcript not available. The session may not have been saved properly.')
      }
      
      // Validate sessionId hasn't changed
      if (currentSessionId !== sessionId) {
        console.log('⚠️ SessionId changed during transcript wait, aborting')
        return
      }
      
      setConnectionState('connecting')
      setStatus('AI is analyzing your conversation...')
      
      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      
      // Use new orchestration endpoint
      const response = await fetch('/api/grade/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId }),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        let errorType: ErrorType = 'server'
        if (response.status >= 500) {
          errorType = 'server'
        } else if (response.status === 408 || response.status === 504) {
          errorType = 'timeout'
        } else if (response.status >= 400 && response.status < 500) {
          errorType = 'server'
        }
        throw { message: `Failed to start grading: ${response.status} ${response.statusText} - ${errorText}`, errorType }
      }
      
      setConnectionState('connected')
      const orchestrationData = await response.json()
      
      // Handle orchestration response phases
      if (orchestrationData.phases) {
        // Phase 1: Instant Metrics - marks session_summary as complete
        if (orchestrationData.phases.instant?.status === 'complete') {
          setStatus('Instant metrics calculated')
          setCurrentSection('session_summary')
          setCompletedSections(prev => {
            const newSet = new Set(prev)
            newSet.add('session_summary')
            return newSet
          })
          setSections(prev => ({
            ...prev,
            session_summary: {
              total_lines: orchestrationData.phases.instant?.metrics?.totalLines || 0
            }
          }))
          
          // If we have instant scores, mark scores section as complete too
          if (orchestrationData.phases.instant?.scores) {
            setCompletedSections(prev => {
              const newSet = new Set(prev)
              newSet.add('scores')
              return newSet
            })
            setSections(prev => ({
              ...prev,
              scores: orchestrationData.phases.instant.scores
            }))
          }
        }
        
        // Phase 2: Key Moments - marks progress and can mark feedback/objection sections
        if (orchestrationData.phases.keyMoments?.status === 'complete') {
          setStatus('Key moments detected, analyzing performance...')
          setCurrentSection('feedback')
          setCompletedSections(prev => {
            const newSet = new Set(prev)
            newSet.add('objection_analysis') // Key moments include objection analysis
            return newSet
          })
          setSections(prev => ({
            ...prev,
            key_moments: orchestrationData.phases.keyMoments.keyMoments,
            objection_analysis: {
              total_objections: orchestrationData.phases.keyMoments.keyMoments?.filter((m: any) => m.type === 'objection').length || 0
            }
          }))
        }
        
        // Phase 3: Deep Analysis (polling) - but don't wait for it
        setStatus('Running deep analysis...')
        setCurrentSection('coaching_plan')
        
        // Poll for completion and track section progress
        const pollForCompletion = async () => {
          const maxPolls = 90 // 1.5 minutes max (90 polls * 1s = 90s)
          let pollCount = 0
          
          while (pollCount < maxPolls && currentSessionId === sessionId) {
            if (abortController.signal.aborted) break
            
            try {
              const sessionResponse = await fetch(`/api/session?id=${currentSessionId}`)
              if (sessionResponse.ok) {
                const session = await sessionResponse.json()
                
                // Track section completion based on available data - batch updates
                const newCompletedSections = new Set(completedSections)
                const newSections = { ...sections }
                let updated = false
                
                // Session Summary - available when instant metrics exist
                if (session.instant_metrics && !newCompletedSections.has('session_summary')) {
                  newCompletedSections.add('session_summary')
                  newSections.session_summary = {
                    total_lines: session.full_transcript?.length || 0,
                    rep_lines: session.full_transcript?.filter((t: any) => t.speaker === 'rep' || t.speaker === 'user').length || 0
                  }
                  updated = true
                }
                
                // Performance Scores - available when overall_score exists OR instant_metrics has scores
                if ((session.overall_score !== null && session.overall_score !== undefined) || session.instant_metrics?.estimatedScores) {
                  if (!newCompletedSections.has('scores')) {
                    newCompletedSections.add('scores')
                    newSections.scores = {
                      overall: session.overall_score || session.instant_metrics?.estimatedScore || 0,
                      rapport: session.rapport_score || session.instant_metrics?.estimatedScores?.rapport || 0,
                      discovery: session.discovery_score || session.instant_metrics?.estimatedScores?.discovery || 0,
                      objection_handling: session.objection_handling_score || session.instant_metrics?.estimatedScores?.objectionHandling || 0,
                      closing: session.close_score || session.instant_metrics?.estimatedScores?.closing || 0
                    }
                    updated = true
                  }
                }
                
                // Objection Handling - available when key_moments exist OR analytics.objection_analysis exists
                if ((session.key_moments?.length > 0 || session.analytics?.objection_analysis) && !newCompletedSections.has('objection_analysis')) {
                  newCompletedSections.add('objection_analysis')
                  newSections.objection_analysis = session.analytics?.objection_analysis || {
                    total_objections: session.key_moments?.filter((m: any) => m.type === 'objection').length || session.instant_metrics?.objectionCount || 0
                  }
                  updated = true
                }
                
                // Detailed Feedback - available when analytics.feedback exists OR key_moments feedback exists
                if ((session.analytics?.feedback || session.key_moments?.some((m: any) => m.feedback)) && !newCompletedSections.has('feedback')) {
                  newCompletedSections.add('feedback')
                  newSections.feedback = session.analytics?.feedback || {
                    strengths: [],
                    improvements: [],
                    specific_tips: []
                  }
                  updated = true
                }
                
                // Personalized Coaching - available when analytics.coaching_plan exists
                if (session.analytics?.coaching_plan && !newCompletedSections.has('coaching_plan')) {
                  newCompletedSections.add('coaching_plan')
                  newSections.coaching_plan = session.analytics.coaching_plan
                  updated = true
                }
                
                // Batch update state if anything changed
                if (updated) {
                  setCompletedSections(newCompletedSections)
                  setSections(newSections)
                }
                
                // Check if grading is complete (check both 'complete' and 'completed' for compatibility)
                if (session.grading_status === 'complete' || session.grading_status === 'completed' || (session.overall_score && newCompletedSections.size >= 3)) {
                  setIsComplete(true)
                  setStatus('Grading complete!')
                  setCompletedSections(newCompletedSections)
                  setSections(prev => ({
                    ...prev,
                    scores: session.analytics?.scores || {
                      overall: session.overall_score,
                      rapport: session.rapport_score,
                      discovery: session.discovery_score,
                      objection_handling: session.objection_handling_score,
                      closing: session.close_score
                    },
                    feedback: session.analytics?.feedback || {},
                    coaching_plan: session.analytics?.coaching_plan || {}
                  }))
                  
                  setTimeout(() => {
                    if (currentSessionId === sessionId) {
                      onComplete()
                    }
                  }, 1500)
                  return
                }
                
                // Update status based on grading_status and section progress
                if (session.grading_status === 'instant_complete' || newCompletedSections.has('session_summary')) {
                  setStatus('Instant metrics ready, detecting key moments...')
                } else if (session.grading_status === 'moments_complete' || session.key_moments?.length > 0) {
                  setStatus('Key moments detected, running deep analysis...')
                } else if (newCompletedSections.size > 0) {
                  setStatus(`Analyzing ${newCompletedSections.size} of ${Object.keys(SECTION_LABELS).length} sections...`)
                }
              }
            } catch (pollError) {
              console.warn('Polling error:', pollError)
            }
            
            pollCount++
            // Poll more frequently at the start (every 500ms for first 10 polls), then every 1s
            const pollDelay = pollCount < 10 ? 500 : 1000
            await new Promise(resolve => setTimeout(resolve, pollDelay))
          }
          
          // Timeout - check one more time
          if (currentSessionId === sessionId) {
            const finalCheck = await fetch(`/api/session?id=${currentSessionId}`)
            if (finalCheck.ok) {
              const session = await finalCheck.json()
              if (session.grading_status === 'complete' || session.overall_score) {
                setIsComplete(true)
                setStatus('Grading complete!')
                setTimeout(() => {
                  if (currentSessionId === sessionId) {
                    onComplete()
                  }
                }, 1500)
              } else {
                setError('Grading is taking longer than expected. Please check back in a moment.')
                setErrorType('timeout')
                setConnectionState('failed')
              }
            }
          }
        }
        
        pollForCompletion()
      } else {
        // No phases - assume complete
        setIsComplete(true)
        setStatus('Grading complete!')
        setTimeout(() => {
          if (currentSessionId === sessionId) {
            onComplete()
          }
        }, 1500)
      }

      } catch (err: any) {
        // Ignore abort errors
        if (err.name === 'AbortError' || currentSessionId !== sessionId) {
          console.log('Stream aborted due to session change')
          return
        }
        
        console.error('Streaming error:', err)
        const errorMessage = err?.message || 'Unknown error occurred'
        const detectedErrorType: ErrorType = err?.errorType || 
          (errorMessage.includes('timeout') || errorMessage.includes('Timeout') ? 'timeout' :
          errorMessage.includes('network') || errorMessage.includes('Network') || err?.code === 'ECONNRESET' ? 'network' :
          errorMessage.includes('parse') || err?.name === 'SyntaxError' ? 'parse' :
          err?.status || err?.response ? 'server' : 'unknown')
        
        setErrorType(detectedErrorType)
        setConnectionState('disconnected')
        
        // Only set error if sessionId hasn't changed
        if (currentSessionId === sessionId) {
          // Auto-retry logic with exponential backoff
          if ((detectedErrorType === 'network' || detectedErrorType === 'timeout') && retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
            setStatus(`Connection error. Retrying in ${delay / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`)
            setConnectionState('retrying')
            
            retryTimeoutRef.current = setTimeout(() => {
              setRetryCount(prev => prev + 1)
              connectToStream(true)
            }, delay)
            return
          }
          
          // If retries exhausted or non-retryable error, try fallback or show error
          if (detectedErrorType === 'timeout' && retryCount >= MAX_RETRIES) {
            console.log('⏱️ Streaming timed out after retries, falling back to non-streaming grading...')
            setStatus('Switching to standard grading mode...')
            
            // Fallback to non-streaming grading
            try {
            // Retry orchestration
            console.error('Orchestration failed, will retry')
            const retryResponse = await fetch('/api/grade/orchestrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId }),
                signal: abortController.signal
              })
              
              if (retryResponse.ok) {
                const result = await retryResponse.json()
                console.log('✅ Retry grading completed')
                setIsComplete(true)
                setStatus('Grading complete!')
                setTimeout(() => {
                  if (currentSessionId === sessionId) {
                    onComplete()
                  }
                }, 1500)
                return
              } else {
                throw new Error(`Retry grading failed: ${retryResponse.statusText}`)
              }
            } catch (retryError: any) {
              if (retryError.name === 'AbortError') {
                return
              }
              setError('Grading timed out. Please try again or check back later.')
              setErrorType('timeout')
              setStatus('Grading timeout')
              setConnectionState('failed')
            }
          } else if (errorMessage.includes('No transcript to grade')) {
            setError('Transcript not ready yet. This usually means the session is still being saved. Click retry to check again.')
            setErrorType('server')
            setConnectionState('failed')
          } else {
            setError(errorMessage)
            setConnectionState('failed')
          }
        }
      } finally {
        // Cleanup
        if (readerRef.current) {
          readerRef.current = null
        }
        if (abortControllerRef.current && abortControllerRef.current.signal.aborted === false) {
          abortControllerRef.current = null
        }
      }
  }, [sessionId, waitForTranscript, onComplete, retryCount])

  useEffect(() => {
    connectToStream()
    
    // Cleanup on unmount or sessionId change
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {})
        readerRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [connectToStream])
  
  const handleRetry = useCallback(() => {
    setError(null)
    setErrorType(null)
    setSections({})
    setCompletedSections(new Set())
    setCurrentSection('')
    setIsComplete(false)
    setRetryCount(0)
    setConnectionState('idle')
    connectToStream(false)
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
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('StreamingGradingDisplay error:', error, errorInfo)
      }}
    >
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

          <h1 className="text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-3 font-space">
            {status}
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400 font-sans">
            <span>{formatTime(elapsedTime)} elapsed</span>
            <span>•</span>
            <span>{getSectionProgress()}% complete</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              {connectionState === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Connected</span>
                </>
              ) : connectionState === 'connecting' || connectionState === 'retrying' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  <span className="text-purple-400">
                    {connectionState === 'retrying' ? 'Retrying...' : 'Connecting...'}
                  </span>
                </>
              ) : connectionState === 'disconnected' ? (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Disconnected</span>
                </>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="mt-4 space-y-3">
              <div className={`px-4 py-3 rounded-xl text-sm font-sans border ${
                errorType === 'timeout' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                errorType === 'network' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="font-medium mb-1">
                  {errorType === 'timeout' ? '⏱️ Connection Timeout' :
                   errorType === 'network' ? '🌐 Network Error' :
                   errorType === 'parse' ? '📄 Parse Error' :
                   errorType === 'server' ? '🔧 Server Error' :
                   '❌ Error'}
                </div>
                <div>{error}</div>
                {retryCount > 0 && (
                  <div className="mt-2 text-xs opacity-75">
                    Retry attempts: {retryCount}/{MAX_RETRIES}
                  </div>
                )}
              </div>
              {connectionState === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-300 font-medium transition-colors font-space"
                >
                  Retry Connection
                </button>
              )}
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
                        font-medium font-space
                        ${isCompleted 
                          ? 'text-emerald-300' 
                          : isCurrent
                          ? 'text-purple-300'
                          : 'text-slate-400'
                        }
                      `}>
                        {label}
                      </div>
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
              <span className="text-sm text-purple-300 font-sans">
                Our AI is analyzing {sections.session_summary?.total_lines || 'hundreds of'} lines in real-time
              </span>
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </ErrorBoundary>
  )
}


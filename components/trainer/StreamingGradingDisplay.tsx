'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, TrendingUp, MessageSquare, Target, Lightbulb, Zap, Wifi, WifiOff } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import SessionFeedbackForm from './SessionFeedbackForm'

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

// Define sequential order for sections - must complete in this order
const SECTION_ORDER: string[] = [
  'session_summary',
  'scores',
  'feedback',
  'objection_analysis',
  'coaching_plan'
]

// Helper function to get the next section that should be processing
const getNextSection = (completedSections: Set<string>): string => {
  for (const section of SECTION_ORDER) {
    if (!completedSections.has(section)) {
      return section
    }
  }
  return '' // All sections complete
}

// Helper function to check if a section can be marked complete (all previous sections must be complete)
const canCompleteSection = (section: string, completedSections: Set<string>): boolean => {
  const sectionIndex = SECTION_ORDER.indexOf(section)
  if (sectionIndex === -1) return false
  
  // Check if all previous sections are complete
  for (let i = 0; i < sectionIndex; i++) {
    if (!completedSections.has(SECTION_ORDER[i])) {
      return false
    }
  }
  
  return true
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
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean | null>(null)
  const [checkingFeedback, setCheckingFeedback] = useState(false)
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
  const waitForTranscript = useCallback(async (maxRetries = 8, retryDelay = 300): Promise<boolean> => {
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
        // Linear backoff: slight increase but capped at 800ms
        retryDelay = Math.min(retryDelay + 100, 800)
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
        // Treat timeout errors as network errors (retryable) instead of showing timeout message
        let errorType: ErrorType = 'server'
        if (response.status >= 500 || response.status === 408 || response.status === 504) {
          errorType = 'network' // Treat as network error so it retries
        } else if (response.status >= 400 && response.status < 500) {
          errorType = 'server'
        }
        throw { message: `Failed to start grading: ${response.status} ${response.statusText} - ${errorText}`, errorType }
      }
      
      setConnectionState('connected')
      const orchestrationData = await response.json()
      
      // Handle orchestration response phases
      // IMPORTANT: Sections must complete in sequential order
      if (orchestrationData.phases) {
        const initialCompletedSections = new Set<string>()
        
        // Phase 1: Instant Metrics - marks session_summary as complete (first in order)
        if (orchestrationData.phases.instant?.status === 'complete') {
          setStatus('Instant metrics calculated')
          initialCompletedSections.add('session_summary')
          setSections(prev => ({
            ...prev,
            session_summary: {
              total_lines: orchestrationData.phases.instant?.metrics?.totalLines || 0
            }
          }))
          
          // If we have instant scores, mark scores section as complete too (second in order)
          if (orchestrationData.phases.instant?.scores) {
            initialCompletedSections.add('scores')
            setSections(prev => ({
              ...prev,
              scores: orchestrationData.phases.instant.scores
            }))
          }
        }
        
        // Phase 2: Key Moments - prepare data but don't mark complete yet (must wait for sequential order)
        if (orchestrationData.phases.keyMoments?.status === 'complete') {
          setStatus('Key moments detected, analyzing performance...')
          setSections(prev => ({
            ...prev,
            key_moments: orchestrationData.phases.keyMoments.keyMoments,
            objection_analysis: {
              total_objections: orchestrationData.phases.keyMoments.keyMoments?.filter((m: any) => m.type === 'objection').length || 0
            }
          }))
        }
        
        // Update completed sections and current section based on sequential order
        setCompletedSections(initialCompletedSections)
        const nextSection = getNextSection(initialCompletedSections)
        setCurrentSection(nextSection)
        
        // Phase 3: Deep Analysis (polling) - but don't wait for it
        setStatus('Running deep analysis...')
        
        // Poll for completion and track section progress
        const pollForCompletion = async () => {
          // Add timeout to prevent infinite polling
          const MAX_POLL_TIME = 5 * 60 * 1000 // 5 minutes maximum
          const startPollTime = Date.now()
          let pollCount = 0
          
          while (currentSessionId === sessionId) {
            if (abortController.signal.aborted) break
            
            // Check if we've exceeded maximum polling time
            const elapsedPollTime = Date.now() - startPollTime
            if (elapsedPollTime > MAX_POLL_TIME) {
              console.warn('⚠️ Polling timeout reached, checking final status...')
              
              // Final check - if we have partial results, show them
              try {
                const finalCheck = await fetch(`/api/session?id=${currentSessionId}`)
                if (finalCheck.ok) {
                  const finalSession = await finalCheck.json()
                  
                  // If we have scores but grading isn't marked complete, mark it as complete anyway
                  if (finalSession.overall_score !== null && finalSession.overall_score !== undefined) {
                    console.log('✅ Found scores despite timeout, proceeding to completion')
                    setIsComplete(true)
                    setStatus('Grading complete!')
                    setCompletedSections(new Set(['session_summary', 'scores', 'feedback', 'objection_analysis', 'coaching_plan']))
                    setSections(prev => ({
                      ...prev,
                      scores: {
                        overall: finalSession.overall_score,
                        rapport: finalSession.rapport_score || 0,
                        discovery: finalSession.discovery_score || 0,
                        objection_handling: finalSession.objection_handling_score || 0,
                        closing: finalSession.close_score || 0
                      },
                      feedback: finalSession.analytics?.feedback || {},
                      coaching_plan: finalSession.analytics?.coaching_plan || {}
                    }))
                    
                    // Check if feedback submitted
                    const hasFeedback = !!(finalSession.user_feedback_submitted_at)
                    setFeedbackSubmitted(hasFeedback)
                    
                    if (hasFeedback) {
                      setTimeout(() => {
                        if (currentSessionId === sessionId) {
                          onComplete()
                        }
                      }, 1500)
                    }
                    return
                  }
                }
              } catch (finalError) {
                console.error('Error in final status check:', finalError)
              }
              
              // If no scores found, show error
              setError('Grading is taking longer than expected. Please try refreshing or contact support if this persists.')
              setErrorType('timeout')
              setConnectionState('error')
              setStatus('Grading timeout - please refresh the page')
              return
            }
            
            try {
              const sessionResponse = await fetch(`/api/session?id=${currentSessionId}`)
              if (sessionResponse.ok) {
                const session = await sessionResponse.json()
                
                // Check if feedback has been submitted (if grading is complete)
                if ((session.grading_status === 'complete' || session.grading_status === 'completed' || 
                     (session.overall_score && session.instant_metrics)) && 
                    feedbackSubmitted === null && !checkingFeedback) {
                  const hasFeedback = !!(session.user_feedback_submitted_at)
                  setFeedbackSubmitted(hasFeedback)
                }
                
                // Track section completion based on available data - batch updates
                // IMPORTANT: Sections must complete in sequential order
                const newCompletedSections = new Set(completedSections)
                const newSections = { ...sections }
                let updated = false
                
                // Session Summary - available when instant metrics exist
                if (session.instant_metrics && !newCompletedSections.has('session_summary')) {
                  if (canCompleteSection('session_summary', newCompletedSections)) {
                    newCompletedSections.add('session_summary')
                    newSections.session_summary = {
                      total_lines: session.full_transcript?.length || 0,
                      rep_lines: session.full_transcript?.filter((t: any) => t.speaker === 'rep' || t.speaker === 'user').length || 0
                    }
                    updated = true
                  }
                }
                
                // Performance Scores - available when overall_score exists OR instant_metrics has scores
                if ((session.overall_score !== null && session.overall_score !== undefined) || session.instant_metrics?.estimatedScores) {
                  if (!newCompletedSections.has('scores') && canCompleteSection('scores', newCompletedSections)) {
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
                
                // Detailed Feedback - available when analytics.feedback exists OR key_moments feedback exists
                // NOTE: Feedback comes before objection_analysis in the order
                if ((session.analytics?.feedback || session.key_moments?.some((m: any) => m.feedback)) && !newCompletedSections.has('feedback')) {
                  if (canCompleteSection('feedback', newCompletedSections)) {
                    newCompletedSections.add('feedback')
                    newSections.feedback = session.analytics?.feedback || {
                      strengths: [],
                      improvements: [],
                      specific_tips: []
                    }
                    updated = true
                  }
                }
                
                // Objection Handling - available when key_moments exist OR analytics.objection_analysis exists
                if ((session.key_moments?.length > 0 || session.analytics?.objection_analysis) && !newCompletedSections.has('objection_analysis')) {
                  if (canCompleteSection('objection_analysis', newCompletedSections)) {
                    newCompletedSections.add('objection_analysis')
                    newSections.objection_analysis = session.analytics?.objection_analysis || {
                      total_objections: session.key_moments?.filter((m: any) => m.type === 'objection').length || session.instant_metrics?.objectionCount || 0
                    }
                    updated = true
                  }
                }
                
                // Personalized Coaching - available when analytics.coaching_plan exists
                if (session.analytics?.coaching_plan && !newCompletedSections.has('coaching_plan')) {
                  if (canCompleteSection('coaching_plan', newCompletedSections)) {
                    newCompletedSections.add('coaching_plan')
                    newSections.coaching_plan = session.analytics.coaching_plan
                    updated = true
                  }
                }
                
                // Batch update state if anything changed
                if (updated) {
                  setCompletedSections(newCompletedSections)
                  setSections(newSections)
                  
                  // Update currentSection to show which section should be processing next
                  const nextSection = getNextSection(newCompletedSections)
                  if (nextSection !== currentSection) {
                    setCurrentSection(nextSection)
                  }
                } else {
                  // Even if no sections completed, update currentSection based on what's available
                  const nextSection = getNextSection(newCompletedSections)
                  if (nextSection !== currentSection && nextSection) {
                    setCurrentSection(nextSection)
                  }
                }
                
                // CRITICAL: Check if deep analysis is complete AND sale status is determined
                // Deep analysis is complete when:
                // 1. grading_status === 'complete' (Phase 3 finished)
                // 2. sale_closed is not null (sale status has been determined)
                // OR if deep analysis failed, show partial results
                const gradingStatus = session.grading_status
                const saleClosed = session.sale_closed
                const deepAnalysisError = session.analytics?.deep_analysis_error
                const deepAnalysisComplete = gradingStatus === 'complete' && saleClosed !== null && saleClosed !== undefined
                
                // If deep analysis failed but we have scores, show partial results
                if (deepAnalysisError && session.overall_score !== null && session.overall_score !== undefined) {
                  console.warn('⚠️ Deep analysis failed, but showing partial results', {
                    sessionId,
                    overallScore: session.overall_score,
                    error: session.analytics?.deep_analysis_error_message
                  })
                  setIsComplete(true)
                  setStatus('Grading complete (partial results - deep analysis failed)')
                  setCompletedSections(newCompletedSections)
                  setSections(prev => ({
                    ...prev,
                    scores: {
                      overall: session.overall_score || 0,
                      rapport: session.rapport_score || 0,
                      discovery: session.discovery_score || 0,
                      objection_handling: session.objection_handling_score || 0,
                      closing: session.close_score || 0
                    },
                    feedback: session.analytics?.feedback || {},
                    coaching_plan: session.analytics?.coaching_plan || {}
                  }))
                  
                  // Check if feedback submitted
                  const hasFeedback = !!(session.user_feedback_submitted_at)
                  setFeedbackSubmitted(hasFeedback)
                  
                  if (hasFeedback) {
                    setTimeout(() => {
                      if (currentSessionId === sessionId) {
                        onComplete()
                      }
                    }, 1500)
                    return
                  }
                  // Continue to show feedback form if no feedback
                  return
                }
                
                // Fallback: Check if Phase 1+2 are done (for backwards compatibility)
                const hasPhase1And2 = session.overall_score && (
                  (newCompletedSections.has('session_summary') && newCompletedSections.has('scores')) ||
                  session.grading_status === 'moments_complete' ||
                  session.key_moments?.length > 0
                )
                
                // Only mark complete if deep analysis is done AND sale status is determined
                if (deepAnalysisComplete || (session.grading_status === 'completed' && saleClosed !== null && saleClosed !== undefined)) {
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
                  
                  // Check if feedback has been submitted (only check once)
                  if (!checkingFeedback && feedbackSubmitted === null) {
                    setCheckingFeedback(true)
                    const hasFeedback = !!(session.user_feedback_submitted_at)
                    setFeedbackSubmitted(hasFeedback)
                    setCheckingFeedback(false)
                    
                    // If feedback already submitted, proceed to analytics after a delay
                    if (hasFeedback) {
                      setTimeout(() => {
                        if (currentSessionId === sessionId) {
                          onComplete()
                        }
                      }, 1500)
                      return
                    }
                    // If no feedback, show feedback form (handled in render) - don't return here
                  }
                  
                  // Continue polling if feedback not submitted yet
                  if (feedbackSubmitted === false) {
                    return // Stop polling, form will be shown
                  }
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
              // If we get multiple consecutive errors, show error state
              if (pollCount > 10 && pollCount % 10 === 0) {
                console.error('Multiple polling errors detected, checking if we should continue...')
                // Continue polling but log the issue
              }
            }
            
            pollCount++
            // Poll more frequently: every 300ms for first 20 polls, then every 500ms, then every 1000ms after 60 polls
            // After 2 minutes, slow down to every 2 seconds
            let pollDelay = 500
            if (pollCount < 20) {
              pollDelay = 300
            } else if (pollCount < 60) {
              pollDelay = 500
            } else if (pollCount < 120) {
              pollDelay = 1000
            } else {
              pollDelay = 2000 // Slow down significantly after 2 minutes
            }
            await new Promise(resolve => setTimeout(resolve, pollDelay))
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
        // Treat timeout errors as network errors (retryable) instead of showing timeout message
        const detectedErrorType: ErrorType = err?.errorType || 
          (errorMessage.includes('timeout') || errorMessage.includes('Timeout') ? 'network' :
          errorMessage.includes('network') || errorMessage.includes('Network') || err?.code === 'ECONNRESET' ? 'network' :
          errorMessage.includes('parse') || err?.name === 'SyntaxError' ? 'parse' :
          err?.status || err?.response ? 'server' : 'unknown')
        
        setErrorType(detectedErrorType)
        setConnectionState('disconnected')
        
        // Only set error if sessionId hasn't changed
        if (currentSessionId === sessionId) {
          // Auto-retry logic with exponential backoff (timeouts treated as network errors)
          if (detectedErrorType === 'network' && retryCount < MAX_RETRIES) {
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
          // Removed timeout error - just keep retrying or show generic error
          if (errorMessage.includes('No transcript to grade')) {
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

  // Show feedback form if grading is complete and feedback hasn't been submitted
  if (isComplete && feedbackSubmitted === false) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('StreamingGradingDisplay error:', error, errorInfo)
        }}
      >
        <div 
          className="min-h-screen bg-black flex items-start justify-center p-3 sm:p-4 lg:p-6 pt-16 sm:pt-20 lg:pt-24"
          style={{ 
            paddingTop: `calc(env(safe-area-inset-top) + 4rem)`,
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <SessionFeedbackForm 
            sessionId={sessionId} 
            onFeedbackComplete={() => {
              setFeedbackSubmitted(true)
              // Small delay before redirecting
              setTimeout(() => {
                onComplete()
              }, 500)
            }}
          />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('StreamingGradingDisplay error:', error, errorInfo)
      }}
    >
      <div 
        className="min-h-screen bg-black flex items-start justify-center p-3 sm:p-4 lg:p-6 pt-16 sm:pt-20 lg:pt-24"
        style={{ 
          paddingTop: `calc(env(safe-area-inset-top) + 4rem)`,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
      <div className="max-w-2xl w-full">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          {/* Main Status */}
          <motion.div
            animate={isComplete ? {} : { rotate: 360 }}
            transition={isComplete ? {} : { duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4 sm:mb-6"
          >
            {isComplete ? (
              <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-500" />
            ) : (
              <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-purple-500" />
            )}
          </motion.div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-2 sm:mb-3 font-space px-2 leading-tight">
            {status}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-slate-400 font-sans px-2">
            <span>{formatTime(elapsedTime)} elapsed</span>
            <span className="hidden sm:inline">•</span>
            <span>{getSectionProgress()}% complete</span>
            <span className="hidden sm:inline">•</span>
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
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-sans border leading-relaxed ${
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
                  <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs opacity-75">
                    Retry attempts: {retryCount}/{MAX_RETRIES}
                  </div>
                )}
              </div>
              {connectionState === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 border border-purple-500/30 rounded-lg sm:rounded-xl text-purple-300 font-medium transition-colors font-space touch-manipulation text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Retry Connection
                </button>
              )}
              {errorType === 'timeout' && (
                <button
                  onClick={async () => {
                    // Try to fetch final session state and proceed
                    try {
                      const response = await fetch(`/api/session?id=${sessionId}`)
                      if (response.ok) {
                        const session = await response.json()
                        // If we have any scores, proceed to analytics
                        if (session.overall_score !== null && session.overall_score !== undefined) {
                          console.log('✅ Proceeding with partial results')
                          onComplete()
                        } else {
                          // No scores yet - retry grading
                          console.log('🔄 Retrying grading...')
                          handleRetry()
                        }
                      } else {
                        // On error, just proceed to analytics anyway
                        console.warn('⚠️ Proceeding to analytics despite timeout')
                        onComplete()
                      }
                    } catch (err) {
                      console.error('Error checking final state:', err)
                      // Proceed anyway
                      onComplete()
                    }
                  }}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/40 border border-yellow-500/30 rounded-lg sm:rounded-xl text-yellow-300 font-medium transition-colors font-space touch-manipulation text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Continue to Results
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Sections */}
        <div className="space-y-2 sm:space-y-2.5 lg:space-y-3">
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
                    relative overflow-hidden rounded-lg sm:rounded-xl border transition-all duration-300
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
                  
                  <div className="relative p-3 sm:p-3.5 lg:p-4 flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                    <div className={`
                      flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : isCurrent
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-700/50 text-slate-500'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className={`
                        text-sm sm:text-base font-medium font-space leading-snug
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
                        <div className="text-xs sm:text-sm font-semibold text-emerald-400">✓</div>
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
            className="mt-4 sm:mt-6 lg:mt-8 text-center px-2"
          >
            <div className="inline-block px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <span className="text-xs sm:text-sm text-purple-300 font-sans leading-relaxed">
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


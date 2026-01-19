'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import StreamingGradingDisplay from '@/components/trainer/StreamingGradingDisplay'
import { createClient } from '@/lib/supabase/client'

const TIPS = [
  'Great sales reps ask 3-5 discovery questions before presenting solutions',
  'Always mention safety for pets and children - it builds trust',
  'Use assumptive closes: "Which day works better for you?"',
  'Mirror the homeowner\'s energy level to build rapport',
  'Practice handling the "already have service" objection',
  'The best time to close is right on the doorstep',
]

export default function LoadingPage() {
  const params = useParams()
  const router = useRouter()
  const [useStreaming, setUseStreaming] = useState(true) // Enable streaming grading
  const [currentTip, setCurrentTip] = useState(0)
  const [status, setStatus] = useState('Saving your session...')
  const [gradingStatus, setGradingStatus] = useState<'idle' | 'in-progress' | 'completed' | 'error'>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [showSkip, setShowSkip] = useState(false)
  const [checkedFirstSession, setCheckedFirstSession] = useState(false)
  const sessionId = params.sessionId as string
  
  const handleSkip = () => {
    console.warn('⏭️ User skipped waiting - grading may not be complete')
    try {
      router.push(`/analytics/${sessionId}`)
    } catch (error) {
      console.error('Error redirecting to analytics:', error)
      // Fallback to home if redirect fails
      router.push('/home')
    }
  }

  const handleStreamingComplete = async () => {
    console.log('✅ Streaming grading complete, checking if first session...')
    
    // Check if this is first completed session before redirecting
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, onboarding_steps_completed, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (userData) {
          const isManager = userData.role === 'manager' || userData.role === 'admin'
          const stepsCompleted = userData.onboarding_steps_completed || {}
          const hasInvitedTeam = stepsCompleted.invite_team === true
          const onboardingCompleted = userData.onboarding_completed === true

          // Check if this is their first completed session (excluding current session)
          const { count: completedSessionsCount } = await supabase
            .from('live_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .neq('id', sessionId)
            .not('grading_status', 'is', null)
            .in('grading_status', ['complete', 'completed'])

          const isFirstCompletedSession = (completedSessionsCount || 0) === 0

          // Mark first_session as complete if needed (for first session)
          if (isFirstCompletedSession && !stepsCompleted.first_session) {
            try {
              console.log('👋 First completed session - marking step complete')
              await fetch('/api/onboarding/complete-step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'first_session' }),
              })
            } catch (stepError) {
              console.error('Error marking first_session step:', stepError)
              // Continue to analytics even if step marking fails
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking first session in handleStreamingComplete:', error)
      // If anything goes wrong, redirect to home page
      router.push('/home')
      return
    }
    
    // Always redirect to analytics after grading completes
    try {
      console.log('✅ Redirecting to analytics...')
      router.push(`/analytics/${sessionId}`)
    } catch (error) {
      console.error('Error redirecting to analytics:', error)
      // Fallback to home if analytics redirect fails
      router.push('/home')
    }
  }

  // Check if grading is already complete and handle first session redirects
  useEffect(() => {
    const checkGradingAndFirstSession = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setCheckedFirstSession(true)
          return
        }

        // First, check if grading is already complete
        const { data: session } = await supabase
          .from('live_sessions')
          .select('grading_status, sale_closed')
          .eq('id', sessionId)
          .single()

        // If grading is complete, redirect to analytics (or onboarding) immediately
        if (session && session.grading_status === 'complete' && 
            session.sale_closed !== null && session.sale_closed !== undefined) {
          console.log('✅ Grading already complete, checking first session redirect...')
          
          // Get user role and check if they have completed any other sessions
          const { data: userData } = await supabase
            .from('users')
            .select('role, onboarding_steps_completed, onboarding_completed')
            .eq('id', user.id)
            .single()

          if (userData) {
            const isManager = userData.role === 'manager' || userData.role === 'admin'
            const stepsCompleted = userData.onboarding_steps_completed || {}
            const hasInvitedTeam = stepsCompleted.invite_team === true

            // Check if this is their first completed session (excluding current session)
            const { count: completedSessionsCount } = await supabase
              .from('live_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .neq('id', sessionId)
              .not('grading_status', 'is', null)
              .in('grading_status', ['complete', 'completed'])

            const isFirstCompletedSession = (completedSessionsCount || 0) === 0

            // Mark first session as complete if needed
            if (isFirstCompletedSession && !stepsCompleted.first_session) {
              console.log('👋 First completed session - marking step complete')
              await fetch('/api/onboarding/complete-step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step: 'first_session' }),
              })
            }
          }

          // Always redirect to analytics after session
          try {
            console.log('✅ Grading complete, redirecting to analytics...')
            router.push(`/analytics/${sessionId}`)
            return
          } catch (redirectError) {
            console.error('Error redirecting to analytics:', redirectError)
            // Fallback to home if redirect fails
            router.push('/home')
            return
          }
        }

        // Grading not complete yet - check first session for manager redirect logic
        // Get user role and check if they have completed any other sessions
        const { data: userData } = await supabase
          .from('users')
          .select('role, onboarding_steps_completed, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!userData) {
          setCheckedFirstSession(true)
          return
        }

        const isManager = userData.role === 'manager' || userData.role === 'admin'
        const stepsCompleted = userData.onboarding_steps_completed || {}
        const hasInvitedTeam = stepsCompleted.invite_team === true

        // Check if this is their first completed session (excluding current session)
        const { count: completedSessionsCount } = await supabase
          .from('live_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('id', sessionId)
          .not('grading_status', 'is', null)
          .in('grading_status', ['complete', 'completed'])

        const isFirstCompletedSession = (completedSessionsCount || 0) === 0


        // Don't redirect here - wait for grading to complete
        // The redirect will happen in handleStreamingComplete after grading finishes
        setCheckedFirstSession(true)
      } catch (error) {
        console.error('Error checking grading and first session:', error)
        // If anything goes wrong, redirect to home page
        try {
          router.push('/home')
        } catch (redirectError) {
          console.error('Error redirecting to home:', redirectError)
          // Last resort - just set checked flag
          setCheckedFirstSession(true)
        }
      }
    }

    checkGradingAndFirstSession()
  }, [router, sessionId])

  // If streaming mode is enabled and we've checked first session, show the streaming display
  if (useStreaming && checkedFirstSession) {
    return (
      <StreamingGradingDisplay 
        sessionId={sessionId} 
        onComplete={handleStreamingComplete}
      />
    )
  }

  // Show loading while checking first session
  if (!checkedFirstSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-4"
          >
            <Loader2 className="w-16 h-16 text-purple-500" />
          </motion.div>
          <p className="text-slate-400">Preparing your session...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 3000)
    
    // Show skip button after 5 minutes (only if grading is taking very long)
    const skipTimeout = setTimeout(() => {
      setShowSkip(true)
    }, 300000) // 5 minutes
    
    // Set grading status to in-progress immediately (backend already started it)
    setGradingStatus('in-progress')
    setStatus('AI is analyzing your conversation...')

    // Poll for session grading completion
    const checkSession = async () => {
      try {
        const resp = await fetch(`/api/session?id=${sessionId}`)
        
        if (resp.ok) {
          const session = await resp.json()
          
          console.log('🔍 Loading page: Session check', {
            has_transcript: !!session.full_transcript,
            transcript_length: session.full_transcript?.length || 0,
            has_analytics: !!session.analytics,
            has_line_ratings: !!session.analytics?.line_ratings,
            overall_score: session.overall_score
          })
          
          // Check if deep analysis is complete (Phase 3) AND sale status is determined
          // CRITICAL: Must wait for deep analysis to complete before showing results
          const gradingStatus = session.grading_status
          const saleClosed = session.sale_closed
          const hasOverallScore = session.overall_score !== null && session.overall_score !== undefined
          const hasInstantMetrics = session.instant_metrics !== null && session.instant_metrics !== undefined
          
          // Deep analysis is complete when:
          // 1. grading_status === 'complete' (Phase 3 finished)
          // 2. sale_closed is not null (sale status has been determined)
          const deepAnalysisComplete = gradingStatus === 'complete' && saleClosed !== null && saleClosed !== undefined
          
          // Fallback: If deep analysis hasn't completed but we have scores, still check sale status
          const hasBasicGrading = Boolean(hasOverallScore && hasInstantMetrics)
          const saleStatusDetermined = saleClosed !== null && saleClosed !== undefined
          
          if (deepAnalysisComplete) {
            console.log('✅ Deep analysis complete and sale status determined! Redirecting to analytics...')
            setGradingStatus('completed')
            setStatus('Analysis complete! Loading your performance insights...')
            
            // Small delay for UI smoothness
            setTimeout(() => {
              try {
                router.push(`/analytics/${sessionId}`)
              } catch (error) {
                console.error('Error redirecting to analytics:', error)
                // Fallback to home if redirect fails
                router.push('/home')
              }
            }, 1000)
            
            return true
          } else if (hasBasicGrading && !saleStatusDetermined) {
            // Basic grading done but sale status not determined yet - still processing
            setStatus('Analyzing sale outcome...')
            setGradingStatus('in-progress')
          } else if (hasBasicGrading && saleStatusDetermined && gradingStatus !== 'complete') {
            // Sale status determined but deep analysis still running
            setStatus('Finalizing analysis...')
            setGradingStatus('in-progress')
          }
          
          // Check if transcript exists (if not, there's a problem)
          if (!session.full_transcript || session.full_transcript.length === 0) {
            setStatus('Waiting for transcript...')
            setGradingStatus('idle')
          } else {
            // Transcript exists but no grading yet - backend is processing
            setStatus('AI is analyzing your conversation...')
            setGradingStatus('in-progress')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setLastError('Failed to check session status')
        // Error is logged, continue polling - the skip button will be available after 5 minutes
      }
      return false
    }

    // Start checking immediately
    checkSession()

    // Then poll every 2 seconds
    const pollInterval = setInterval(async () => {
      const ready = await checkSession()
      if (ready) {
        clearInterval(pollInterval)
      }
    }, 2000)

    // No timeout - wait for grading to complete (but show skip button after 5 minutes)
    // This ensures users always see complete data

    return () => {
      clearInterval(tipInterval)
      clearInterval(pollInterval)
      clearTimeout(skipTimeout)
    }
  }, [params.sessionId, router, gradingStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center">
          {/* Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-8"
          >
            <Loader2 className="w-16 h-16 text-purple-500" />
          </motion.div>

          {/* Status */}
          <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-2 drop-shadow-lg">{status}</h1>
          <p className="text-slate-400 mb-10">This will only take a moment...</p>

          {/* Tip */}
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-2xl"
          >
            <div className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 uppercase tracking-wide">Pro Tip</div>
            <div className="text-slate-200 leading-relaxed">{TIPS[currentTip]}</div>

            <div className="mt-5 pt-4 border-t border-slate-700 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <div
                  className={`h-2 w-2 rounded-full ${
                    gradingStatus === 'completed'
                      ? 'bg-emerald-400'
                      : gradingStatus === 'in-progress'
                      ? 'bg-purple-400 animate-pulse'
                      : gradingStatus === 'error'
                      ? 'bg-rose-400'
                      : 'bg-slate-600'
                  }`}
                />
                <span>
                  AI Analysis:{' '}
                  {gradingStatus === 'idle'
                    ? 'Waiting'
                    : gradingStatus === 'in-progress'
                    ? 'Analyzing conversation...'
                    : gradingStatus === 'completed'
                    ? 'Complete'
                    : 'Retrying'}
                </span>
              </div>
              {lastError && <div className="text-rose-300 pl-4">{lastError}</div>}
            </div>
          </motion.div>

          {/* Skip Button - Only shown if grading is taking very long */}
          {showSkip && gradingStatus !== 'completed' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSkip}
              className="mt-6 px-6 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-300 hover:text-yellow-200 transition-all text-sm font-medium"
            >
              View Results Now (Grading may still be in progress)
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

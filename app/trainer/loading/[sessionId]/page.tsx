'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import StreamingGradingDisplay from '@/components/trainer/StreamingGradingDisplay'

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
  const [useStreaming, setUseStreaming] = useState(false) // Disable streaming for now, fallback to polling
  const [currentTip, setCurrentTip] = useState(0)
  const [status, setStatus] = useState('Saving your session...')
  const [gradingStatus, setGradingStatus] = useState<'idle' | 'in-progress' | 'completed' | 'error'>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [showSkip, setShowSkip] = useState(false)
  const sessionId = params.sessionId as string
  
  const handleSkip = () => {
    console.log('⏭️ User skipped waiting, redirecting to analytics...')
    router.push(`/analytics/${sessionId}`)
  }

  const handleStreamingComplete = () => {
    console.log('✅ Streaming grading complete, redirecting to analytics...')
    router.push(`/analytics/${sessionId}`)
  }

  // If streaming mode is enabled, show the streaming display
  if (useStreaming) {
    return (
      <StreamingGradingDisplay 
        sessionId={sessionId} 
        onComplete={handleStreamingComplete}
      />
    )
  }

  useEffect(() => {
    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 3000)
    
    // Show skip button after 10 seconds
    const skipTimeout = setTimeout(() => {
      setShowSkip(true)
    }, 10000)
    
    // Set grading status to in-progress immediately (backend already started it)
    setGradingStatus('in-progress')
    setStatus('Analyzing your conversation with AI...')

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
          
          // Check if grading is complete
          if (session.analytics?.line_ratings && session.analytics.line_ratings.length > 0) {
            console.log('✅ Grading complete! Redirecting to analytics...')
            setGradingStatus('completed')
            setStatus('Grading complete! Loading your results...')
            
            // Small delay for UI smoothness
            setTimeout(() => {
              router.push(`/analytics/${sessionId}`)
            }, 1000)
            
            return true
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

    // Timeout after 30 seconds - redirect anyway (grading continues in background)
    const timeout = setTimeout(() => {
      console.warn('⚠️ Grading taking longer than expected, redirecting to analytics...')
      console.warn('⚠️ Results will appear when grading completes')
      setStatus('Taking longer than expected... Showing results')
      router.push(`/analytics/${params.sessionId}`)
    }, 30000) // Reduced from 2 minutes to 30 seconds

    return () => {
      clearInterval(tipInterval)
      clearInterval(pollInterval)
      clearTimeout(timeout)
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
                  Grading:{' '}
                  {gradingStatus === 'idle'
                    ? 'Waiting'
                    : gradingStatus === 'in-progress'
                    ? 'Analyzing...'
                    : gradingStatus === 'completed'
                    ? 'Complete'
                    : 'Retrying'}
                </span>
              </div>
              {lastError && <div className="text-rose-300 pl-4">{lastError}</div>}
            </div>
          </motion.div>

          {/* Skip Button */}
          {showSkip && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSkip}
              className="mt-6 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-slate-300 hover:text-white transition-all text-sm font-medium"
            >
              View Results Now
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

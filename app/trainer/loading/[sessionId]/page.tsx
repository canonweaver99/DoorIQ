'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

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
  const [currentTip, setCurrentTip] = useState(0)
  const [status, setStatus] = useState('Saving your session...')
  const [gradingStatus, setGradingStatus] = useState<'idle' | 'in-progress' | 'completed' | 'error'>('idle')
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 3000)

    const sessionId = params.sessionId as string
    let gradingTriggered = false

    const triggerGrading = async () => {
      if (!sessionId) return

      try {
        setGradingStatus('in-progress')
        setStatus('Sending transcript for grading...')
        setLastError(null)

        const resp = await fetch('/api/grade/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })

        if (!resp.ok) {
          const body = await resp.json().catch(() => null)
          const message = body?.error || `Grading failed with status ${resp.status}`
          throw new Error(message)
        }

        setGradingStatus('completed')
        setStatus('Grading complete! Finalizing your results...')
      } catch (error: any) {
        console.error('Error triggering grading:', error)
        setLastError(error?.message || 'Unable to start grading')
        setGradingStatus('error')
        setStatus('We hit a snag while grading. Retrying shortly...')
      }
    }

    // Poll for session readiness
    const checkSession = async () => {
      try {
        const resp = await fetch(`/api/session?id=${sessionId}`)
        
        if (resp.ok) {
          const session = await resp.json()
          
          // Check if session has been updated with transcript and score
          if (session.full_transcript && session.full_transcript.length > 0) {
            if (!gradingTriggered && (!session.analytics || !session.analytics.line_ratings)) {
              gradingTriggered = true
              await triggerGrading()
            }

            if (session.analytics?.line_ratings) {
              console.log('✅ Session is ready! Redirecting...')
              router.push(`/analytics/${sessionId}`)
              return true
            }

            setStatus(gradingStatus === 'in-progress' ? 'Analyzing your conversation...' : 'Processing your conversation...')
          } else {
            setStatus('Capturing your conversation details...')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
      return false
    }

    // Start checking after 1 second
    const initialCheck = setTimeout(() => {
      checkSession()
    }, 1000)

    // Then poll every 2 seconds
    const pollInterval = setInterval(async () => {
      const ready = await checkSession()
      if (ready) {
        clearInterval(pollInterval)
      }
    }, 2000)

    // Timeout after 15 seconds - redirect anyway
    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout waiting for session, redirecting anyway...')
      router.push(`/analytics/${params.sessionId}`)
    }, 15000)

    return () => {
      clearInterval(tipInterval)
      clearInterval(pollInterval)
      clearTimeout(initialCheck)
      clearTimeout(timeout)
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
            <Loader2 className="w-16 h-16 text-purple-500" style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.6))' }} />
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
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                      : gradingStatus === 'in-progress'
                      ? 'bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                      : gradingStatus === 'error'
                      ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]'
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
        </div>
      </div>
    </div>
  )
}

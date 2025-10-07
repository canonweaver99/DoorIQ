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
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length)
    }, 3000)

    // Poll for session readiness
    const checkSession = async () => {
      try {
        const sessionId = params.sessionId
        const resp = await fetch(`/api/session?id=${sessionId}`)
        
        if (resp.ok) {
          const session = await resp.json()
          
          // Check if session has been updated with transcript and score
          if (session.full_transcript && session.full_transcript.length > 0) {
            console.log('✅ Session is ready! Redirecting...')
            router.push(`/trainer/results/${sessionId}`)
            return true
          } else {
            setStatus('Processing your conversation...')
            setAttempts(prev => prev + 1)
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setAttempts(prev => prev + 1)
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
      router.push(`/trainer/results/${params.sessionId}`)
    }, 15000)

    return () => {
      clearInterval(tipInterval)
      clearInterval(pollInterval)
      clearTimeout(initialCheck)
      clearTimeout(timeout)
    }
  }, [params.sessionId, router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center">
          {/* Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-8"
          >
            <Loader2 className="w-16 h-16 text-blue-500" />
          </motion.div>

          {/* Status */}
          <h1 className="text-2xl font-bold text-slate-100 mb-2">{status}</h1>
          <p className="text-slate-400 mb-8">This will only take a moment...</p>

          {/* Tip */}
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-800 rounded-lg p-6 border border-slate-700"
          >
            <div className="text-sm font-semibold text-blue-400 mb-2">Pro Tip</div>
            <div className="text-slate-200">{TIPS[currentTip]}</div>
          </motion.div>

          {/* Debug info */}
          <div className="mt-4 text-xs text-slate-500">
            Check attempt: {attempts}
          </div>
        </div>
      </div>
    </div>
  )
}

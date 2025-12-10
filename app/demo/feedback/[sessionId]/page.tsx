'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DemoFeedbackView } from '@/components/landing/DemoFeedbackView'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function DemoFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Wait for grading to complete
        let attempts = 0
        const maxAttempts = 30 // Wait up to 30 seconds
        
        while (attempts < maxAttempts) {
          const response = await fetch(`/api/session?id=${sessionId}`)
          if (response.ok) {
            const data = await response.json()
            
            // Check if grading is complete
            if (data.grading_status === 'complete' && data.overall_score !== null) {
              setSessionData(data)
              setLoading(false)
              
              // Track demo completion
              fetch('/api/analytics/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'completed', sessionId })
              }).catch(() => {})
              
              return
            }
          }
          
          attempts++
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // If we get here, grading might still be in progress or failed
        // Show what we have anyway
        const response = await fetch(`/api/session?id=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setSessionData(data)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load session data')
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    } else {
      setError('Invalid session ID')
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your demo results...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <p className="text-red-400 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => router.push('/landing')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DemoFeedbackView
      overallScore={sessionData.overall_score || 0}
      saleClosed={sessionData.sale_closed || false}
      virtualEarnings={sessionData.virtual_earnings || 0}
      earningsData={sessionData.earnings_data}
      dealDetails={sessionData.deal_details}
    />
  )
}

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SessionFeedbackForm from '@/components/trainer/SessionFeedbackForm'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifySession = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Verify session exists and belongs to user
        const { data: session, error: sessionError } = await supabase
          .from('live_sessions')
          .select('id, user_id')
          .eq('id', sessionId)
          .single()

        if (sessionError || !session) {
          setError('Session not found')
          setLoading(false)
          return
        }

        if (session.user_id !== user.id) {
          setError('Unauthorized access')
          setLoading(false)
          return
        }

        setLoading(false)
      } catch (err) {
        console.error('Error verifying session:', err)
        setError('Failed to load session')
        setLoading(false)
      }
    }

    if (sessionId) {
      verifySession()
    } else {
      setError('Invalid session ID')
      setLoading(false)
    }
  }, [sessionId, router])

  const handleFeedbackComplete = () => {
    // After feedback is submitted, redirect to analytics page
    router.push(`/analytics/${sessionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading feedback form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-start justify-center pt-16 sm:pt-20 lg:pt-24 px-3 sm:px-4 lg:px-6 pb-6">
      <SessionFeedbackForm 
        sessionId={sessionId} 
        onFeedbackComplete={handleFeedbackComplete}
      />
    </div>
  )
}


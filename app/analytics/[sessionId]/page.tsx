'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Trophy, Loader2 } from 'lucide-react'
import TranscriptView from '@/components/analytics/TranscriptView'
import ScoresView from '@/components/analytics/ScoresView'

interface SessionData {
  id: string
  created_at: string
  agent_name: string | null
  full_transcript: any[] | null
  overall_score: number | null
  rapport_score: number | null
  discovery_score: number | null
  objection_handling_score: number | null
  close_score: number | null
  safety_score: number | null
  introduction_score: number | null
  listening_score: number | null
  virtual_earnings: number | null
  analytics: {
    line_ratings?: Array<{
      line_number: number
      effectiveness: 'excellent' | 'good' | 'average' | 'poor'
      score: number
      alternative_lines?: string[]
      improvement_notes?: string
      category?: string
    }>
    feedback?: {
      strengths: string[]
      improvements: string[]
      specific_tips: string[]
    }
    scores?: Record<string, number>
  } | null
  what_worked: string[] | null
  what_failed: string[] | null
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [activeView, setActiveView] = useState<'transcript' | 'scores'>('transcript')

  const insightsByCategory = useMemo(() => {
    if (!session?.analytics?.line_ratings || !session.full_transcript) return {}

    const categoryMap: Record<string, Array<{ quote: string; impact: string }>> = {}

    session.analytics.line_ratings.forEach((rating) => {
      const transcriptLine = session.full_transcript?.[rating.line_number]
      const quote = transcriptLine?.text || transcriptLine?.message
      const category = rating.category || 'general'

      if (!quote) return

      if (!categoryMap[category]) {
        categoryMap[category] = []
      }

      categoryMap[category].push({
        quote,
        impact: rating.improvement_notes || `Rated ${rating.effectiveness}`
      })
    })

    return categoryMap
  }, [session])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session?id=${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }
      
      const data = await response.json()
      console.log('Session data:', data)
      console.log('Transcript:', data.full_transcript)
      console.log('Transcript length:', data.full_transcript?.length)
      console.log('First transcript item:', data.full_transcript?.[0])
      setSession(data)
      
      // If transcript exists but no grading, trigger grading
      if (data.full_transcript && data.full_transcript.length > 0 && !data.analytics?.line_ratings) {
        triggerGrading()
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerGrading = async () => {
    console.log('🎯 Triggering grading for session:', sessionId)
    setGrading(true)
    try {
      const response = await fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      console.log('📊 Grading response status:', response.status)
      const result = await response.json()
      console.log('📊 Grading result:', result)
      
      if (!response.ok) {
        console.error('❌ Grading failed:', result)
      }
    } catch (error) {
      console.error('Error grading session:', error)
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading session data...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
          <p className="text-gray-400 mb-4">Session not found</p>
          <Link
            href="/sessions"
            className="text-white hover:text-gray-300 font-medium"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/sessions"
            className="inline-flex items-center text-gray-500 hover:text-gray-300 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                Session Analysis
              </h1>
              <p className="text-gray-500 text-base">
                {session.agent_name || 'Training Session'} • {new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            {grading && (
              <div className="flex items-center text-gray-400 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm">Analyzing transcript...</span>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-[#1a1a1a] rounded-lg border border-gray-800 max-w-md mx-auto mb-8">
          <button
            onClick={() => setActiveView('transcript')}
            className={`flex-1 px-4 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center justify-center text-sm ${
              activeView === 'transcript'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Transcript
          </button>
          <button
            onClick={() => setActiveView('scores')}
            className={`flex-1 px-4 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center justify-center text-sm ${
              activeView === 'scores'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Performance
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
          {activeView === 'transcript' ? (
            <TranscriptView 
              transcript={session.full_transcript || []}
              lineRatings={session.analytics?.line_ratings || []}
            />
          ) : (
            <ScoresView
              overallScore={session.overall_score || 0}
              scores={{
                rapport: session.rapport_score ?? 0,
                discovery: session.discovery_score ?? 0,
                objection_handling: session.objection_handling_score ?? 0,
                closing: session.close_score ?? 0,
                safety: session.analytics?.scores?.safety ?? 0,
                introduction: session.analytics?.scores?.introduction ?? 0,
                listening: session.analytics?.scores?.listening ?? 0
              }}
              feedback={session.analytics?.feedback || {
                strengths: session.what_worked || [],
                improvements: session.what_failed || [],
                specific_tips: []
              }}
              virtualEarnings={session.virtual_earnings || 0}
              insightsByCategory={insightsByCategory}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={() => router.push('/trainer')}
            className="px-6 py-3 rounded-lg font-medium bg-white text-black hover:bg-gray-100 transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg font-medium bg-[#1a1a1a] border border-gray-800 text-white hover:bg-[#252525] transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  )
}

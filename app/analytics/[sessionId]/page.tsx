'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading session data...</p>
        </div>
      )
    }

    if (!session) {
      return (
        <div className="bg-[#101010] border border-gray-800 rounded-2xl p-10 text-center">
          <p className="text-gray-400 mb-4">Session not found</p>
          <Link href="/sessions" className="text-white hover:text-gray-300 font-medium">
            Back to Sessions
          </Link>
        </div>
      )
    }

    return (
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
        grading={grading}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div className="space-y-3">
            <Link
              href="/sessions"
              className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
            <h1 className="text-3xl font-semibold text-white">Session Analysis</h1>
            <p className="text-gray-500 text-sm">
              {session?.agent_name || 'Training Session'}
            </p>
          </div>

          {grading && (
            <div className="flex items-center gap-3 bg-[#111] border border-gray-800 rounded-full px-5 py-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing conversation...</span>
            </div>
          )}
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

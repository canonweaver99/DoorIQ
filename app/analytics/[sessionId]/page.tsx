'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ScoresView from '@/components/analytics/ScoresView'
import ScoresViewV2 from '@/components/analytics/ScoresViewV2'
import TranscriptView from '@/components/analytics/TranscriptView'
import TranscriptViewV2 from '@/components/analytics/TranscriptViewV2'

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
  sale_closed: boolean | null
  // Dynamic earnings data
  earnings_data: any | null
  deal_details: any | null
  // New enhanced metric scores
  speaking_pace_score: number | null
  filler_words_score: number | null
  question_ratio_score: number | null
  active_listening_score: number | null
  assumptive_language_score: number | null
  // New enhanced metric data
  speaking_pace_data: any | null
  filler_words_data: any | null
  question_ratio_data: any | null
  active_listening_data: any | null
  assumptive_language_data: any | null
  analytics: {
    line_ratings?: Array<{
      line_number: number
      speaker?: 'rep' | 'customer'
      timestamp?: string
      effectiveness: 'excellent' | 'good' | 'average' | 'poor'
      score: number
      sentiment?: 'positive' | 'neutral' | 'negative'
      customer_engagement?: 'high' | 'medium' | 'low'
      missed_opportunities?: string[]
      techniques_used?: string[]
      alternative_lines?: string[]
      improvement_notes?: string
      category?: string
      words_per_minute?: number
      filler_words?: string[]
      is_question?: boolean
    }>
    feedback?: {
      strengths: string[]
      improvements: string[]
      specific_tips: string[]
    }
    scores?: Record<string, number>
    enhanced_metrics?: Record<string, any>
    earnings_data?: any
    deal_details?: any
    objection_analysis?: {
      total_objections?: number
      objections_detail?: Array<{
        type: string
        customer_statement: string
        rep_response: string
        technique_used: string
        resolution: 'resolved' | 'partial' | 'unresolved' | 'ignored'
        time_to_resolve: string
        effectiveness_score: number
      }>
      unresolved_concerns?: string[]
      objection_patterns?: string
    }
    coaching_plan?: {
      immediate_fixes?: Array<{
        issue: string
        practice_scenario: string
        resource_link: string
      }>
      skill_development?: Array<{
        skill: string
        current_level: 'beginner' | 'intermediate' | 'advanced'
        target_level: 'intermediate' | 'advanced'
        recommended_exercises: string[]
      }>
      role_play_scenarios?: string[]
    }
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
  const [activeView, setActiveView] = useState<'scores' | 'transcript'>('scores')

  const insightsByCategory = useMemo(() => {
    if (!session?.analytics?.line_ratings || !session.full_transcript) return {}

    const normalizeCategory = (value?: string) => {
      const slug = (value || '').toLowerCase()
      if (slug.includes('rapport')) return 'rapport'
      if (slug.includes('discovery') || slug.includes('needs')) return 'discovery'
      if (slug.includes('objection')) return 'objection_handling'
      if (slug.includes('close')) return 'closing'
      return slug.replace(/[^a-z0-9]+/g, '_') || 'general'
    }

    const categoryMap: Record<string, Array<{ quote: string; impact: string }>> = {}

    session.analytics.line_ratings.forEach((rating) => {
      const transcriptLine = session.full_transcript?.[rating.line_number]
      const quote = transcriptLine?.text || transcriptLine?.message
      const category = normalizeCategory(rating.category)

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

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-36">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading session data...</p>
        </div>
      )
    }

    if (!session) {
      return (
        <div className="bg-[#101010] border border-gray-800 rounded-3xl p-12 text-center">
          <p className="text-gray-400 mb-4">Session not found</p>
          <Link href="/sessions" className="text-white hover:text-gray-300 font-medium">
            Back to Sessions
          </Link>
        </div>
      )
    }

    if (activeView === 'transcript') {
      return (
        <TranscriptViewV2
          transcript={session.full_transcript || []}
          lineRatings={session.analytics?.line_ratings || []}
          duration={session.duration_seconds || 600}
          wordCount={session.full_transcript?.reduce((sum, line) => sum + (line.text || line.message || '').split(' ').length, 0)}
        />
      )
    }

    return (
      <ScoresViewV2
        sessionId={session.id}
        overallScore={session.overall_score || 0}
        scores={{
          rapport: session.rapport_score ?? 0,
          discovery: session.discovery_score ?? 0,
          objection_handling: session.objection_handling_score ?? 0,
          closing: session.close_score ?? 0,
          safety: session.analytics?.scores?.safety ?? 0,
          introduction: session.analytics?.scores?.introduction ?? 0,
          listening: session.analytics?.scores?.listening ?? 0,
          speaking_pace: session.speaking_pace_score ?? session.analytics?.scores?.speaking_pace,
          filler_words: session.filler_words_score ?? session.analytics?.scores?.filler_words,
          question_ratio: session.question_ratio_score ?? session.analytics?.scores?.question_ratio,
          active_listening: session.active_listening_score ?? session.analytics?.scores?.active_listening,
          assumptive_language: session.assumptive_language_score ?? session.analytics?.scores?.assumptive_language
        }}
        feedback={session.analytics?.feedback || {
          strengths: session.what_worked || [],
          improvements: session.what_failed || [],
          specific_tips: []
        }}
        virtualEarnings={session.virtual_earnings || 0}
        earningsData={session.earnings_data || session.analytics?.earnings_data || {}}
        dealDetails={session.deal_details || session.analytics?.deal_details || {}}
        conversationDynamics={session.analytics?.conversation_dynamics || {}}
        failureAnalysis={session.analytics?.failure_analysis || {}}
        saleClosed={session.sale_closed || false}
        lineRatings={session.analytics?.line_ratings || []}
        fullTranscript={session.full_transcript || []}
        agentName={session.agent_name || 'AI Agent'}
        durationSeconds={session.duration_seconds || 600}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/sessions"
              className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
            <h1 className="text-3xl font-semibold text-white">Session Analysis</h1>
            {session && (
              <p className="text-gray-500 text-sm">
                {session.agent_name || 'Training Session'}
              </p>
            )}
          </div>

          {grading && (
            <div className="inline-flex items-center gap-3 bg-[#111111] border border-gray-800 rounded-full px-5 py-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing conversation...</span>
            </div>
          )}
        </div>

        {!loading && session && (
          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 text-sm text-gray-300">
            {(['scores', 'transcript'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeView === view
                    ? 'bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                    : 'hover:text-white'
                }`}
              >
                {view === 'scores' ? 'Scores & Feedback' : 'Transcript'}
              </button>
            ))}
          </div>
        )}

        {renderBody()}
      </div>
    </div>
  )
}

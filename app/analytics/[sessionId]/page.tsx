'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MessageSquare, Trophy, Target, Users, HandshakeIcon, Loader2 } from 'lucide-react'
import TranscriptView from '@/components/analytics/TranscriptView'
import ScoresView from '@/components/analytics/ScoresView'

interface SessionData {
  id: string
  user_id: string
  created_at: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  agent_name: string | null
  overall_score: number | null
  rapport_score: number | null
  objection_handling_score: number | null
  close_effectiveness_score: number | null
  safety_score: number | null
  introduction_score: number | null
  listening_score: number | null
  needs_discovery_score: number | null
  full_transcript: any[] | null
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
  } | null
  what_worked: string[] | null
  what_failed: string[] | null
  virtual_earnings: number | null
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [activeView, setActiveView] = useState<'transcript' | 'scores'>('transcript')

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
    setGrading(true)
    try {
      const response = await fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      if (response.ok) {
        // Refresh session data to get grading results
        await fetchSession()
      }
    } catch (error) {
      console.error('Error grading session:', error)
    } finally {
      setGrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading session data...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">Session not found</p>
          <Link
            href="/sessions"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/sessions"
            className="inline-flex items-center text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2">
                Session Analysis
              </h1>
              <p className="text-slate-500 text-sm">
                {session.agent_name || 'Training Session'} • {new Date(session.created_at).toLocaleDateString()}
              </p>
            </div>
            
            {grading && (
              <div className="flex items-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Analyzing transcript...</span>
              </div>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveView('transcript')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center ${
              activeView === 'transcript'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Full Transcript
          </button>
          <button
            onClick={() => setActiveView('scores')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center ${
              activeView === 'scores'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Scores & Feedback
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
          {activeView === 'transcript' ? (
            <TranscriptView 
              transcript={session.full_transcript || []}
              lineRatings={session.analytics?.line_ratings || []}
            />
          ) : (
            <ScoresView
              overallScore={session.overall_score || 0}
              scores={{
                rapport: session.rapport_score || 0,
                discovery: session.needs_discovery_score || 0,
                objection_handling: session.objection_handling_score || 0,
                closing: session.close_effectiveness_score || 0,
                safety: session.safety_score || 0,
                introduction: session.introduction_score || 0,
                listening: session.listening_score || 0
              }}
              feedback={session.analytics?.feedback || {
                strengths: session.what_worked || [],
                improvements: session.what_failed || [],
                specific_tips: []
              }}
              virtualEarnings={session.virtual_earnings || 0}
            />
          )}
        </div>
      </div>
    </div>
  )
}

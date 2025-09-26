'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, Target, ChevronRight, Download, Share2, FileText, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedScore from '@/components/analytics/AnimatedScore'
import TranscriptView from '@/components/analytics/TranscriptView'
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics'
import AICoach from '@/components/analytics/AICoach'

interface SessionData {
  id: string
  started_at: string
  ended_at: string
  duration_seconds: number
  overall_score: number
  rapport_score: number
  objection_handling_score: number
  safety_score: number
  close_effectiveness_score: number
  transcript: any[]
  analytics: any
  sentiment_data: any
}

export default function AnalyticsPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('transcript')
  const supabase = createClient()

  useEffect(() => {
    fetchSessionData()
  }, [params.sessionId])

  // Auto-grade if transcript exists but no AI feedback yet
  useEffect(() => {
    const run = async () => {
      if (!session?.id) return
      const hasTranscript = Array.isArray(session.transcript) && session.transcript.length > 0
      const hasAIFeedback = Boolean(session.analytics?.feedback)
      if (hasTranscript && !hasAIFeedback) {
        try {
          await fetch('/api/grade/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id })
          })
          fetchSessionData()
        } catch (e) {
          console.error('AI grading failed:', e)
        }
      }
    }
    run()
  }, [session?.id, Array.isArray(session?.transcript) ? session?.transcript?.length : 0, Boolean(session?.analytics?.feedback)])

  const fetchSessionData = async () => {
    try {
      const sessionId = Array.isArray(params.sessionId)
        ? params.sessionId[0]
        : params.sessionId
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId as string)
        .single()

      if (error) throw error
      setSession(data)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 w-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Session not found</h2>
          <button
            onClick={() => router.push('/trainer')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to training
          </button>
        </div>
      </div>
    )
  }

  const [selectedTranscriptLine, setSelectedTranscriptLine] = useState<number | null>(null)

  const scrollToTranscriptLine = (lineNumber: number) => {
    setActiveTab('transcript')
    setSelectedTranscriptLine(lineNumber)
    // Scroll to transcript section
    setTimeout(() => {
      const transcriptSection = document.getElementById('transcript-section')
      transcriptSection?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const metricsData = [
    {
      label: 'Rapport Building',
      score: session.rapport_score || 0,
      color: 'blue' as const,
      feedback: (session.rapport_score || 0) >= 85 ? "Outstanding rapport building - genuine connection established" :
                (session.rapport_score || 0) >= 70 ? "Good rapport foundation, but use more personalized language" :
                "Focus on building trust through active listening and empathy"
    },
    {
      label: 'Objection Handling',
      score: session.objection_handling_score || 0,
      color: 'green' as const,
      feedback: (session.objection_handling_score || 0) >= 85 ? "Professional objection handling with empathy and expertise" :
                (session.objection_handling_score || 0) >= 70 ? "Good objection handling, but use more empathetic responses" :
                "Learn to acknowledge concerns before addressing them"
    },
    {
      label: 'Safety Discussion',
      score: session.safety_score || 0,
      color: 'yellow' as const,
      feedback: (session.safety_score || 0) >= 85 ? "Excellent safety discussion - builds trust and confidence" :
                (session.safety_score || 0) >= 70 ? "Good safety mention, but be more comprehensive" :
                "Always address safety concerns - essential for pest control"
    },
    {
      label: 'Close Effectiveness',
      score: session.close_effectiveness_score || 0,
      color: 'purple' as const,
      feedback: (session.close_effectiveness_score || 0) >= 85 ? "Excellent closing technique - assumptive and confident" :
                (session.close_effectiveness_score || 0) >= 70 ? "Good closing attempt, but be more assumptive" :
                "Practice assumptive closes and create urgency"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Analysis</h1>
              <p className="text-gray-600 mt-1">
                {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Animated Score Display */}
          <AnimatedScore 
            score={session.overall_score || 0}
            className="py-8"
          />
          
          {/* Session Duration */}
          <div className="text-center text-lg text-gray-500 -mt-4 mb-6">
            Session Duration: {formatDuration(session.duration_seconds || 0)}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'transcript' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Transcript Analysis
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Performance Metrics
            </button>
          </div>
        </div>

        {activeTab === 'transcript' ? (
          <div id="transcript-section">
            <TranscriptView 
              transcript={session.transcript || []}
              analytics={session.analytics}
              className="mb-6"
            />
          </div>
        ) : (
          <>
            {/* Performance Breakdown */}
            <PerformanceMetrics 
              metrics={metricsData}
              transcript={session.transcript}
              onLineClick={scrollToTranscriptLine}
              className="mb-6"
            />

            {/* Simplified Expert Feedback */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Expert Feedback</h2>
              
              {session.analytics?.feedback ? (
                <div className="space-y-6">
                  {/* What You Did Well */}
                  {session.analytics.feedback.strengths && session.analytics.feedback.strengths.length > 0 && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                        <Trophy className="w-5 h-5 mr-2" />
                        What You Did Well
                      </h3>
                      <ul className="space-y-3">
                        {session.analytics.feedback.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="text-green-700 flex items-start">
                            <span className="text-green-500 mr-3 text-lg">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Areas for Improvement */}
                  {session.analytics?.feedback?.improvements && session.analytics.feedback.improvements.length > 0 && (
                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {session.analytics.feedback.improvements.map((improvement: string, idx: number) => (
                          <li key={idx} className="text-amber-700 flex items-start">
                            <span className="text-amber-500 mr-3 text-lg">⚠</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Time, Try This */}
                  {session.analytics?.feedback?.specificTips && session.analytics.feedback.specificTips.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Next Time, Try This:
                      </h3>
                      <div className="space-y-4">
                        {session.analytics.feedback.specificTips.map((tip: string, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                            <p className="text-blue-800 italic font-medium">&ldquo;{tip}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>AI feedback will appear here once the session is processed.</p>
                </div>
              )}
            </div>

          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={() => router.push('/trainer')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            Practice Again
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/trainer/history')}
            className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            View All Sessions
          </button>
        </div>

        {/* AI Coach */}
        <AICoach sessionData={session} />
      </div>
    </div>
  )
}


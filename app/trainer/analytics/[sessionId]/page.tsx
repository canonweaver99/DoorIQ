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
import AdvancedMetrics from '@/components/analytics/AdvancedMetrics'

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
  full_transcript?: any[]
  transcript: any[]
  analytics: any
  sentiment_data: any
}

export default function AnalyticsPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('transcript')
  const [selectedTranscriptLine, setSelectedTranscriptLine] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSessionData()
  }, [params.sessionId])

  // Auto-grade if transcript exists but no AI feedback yet
  // Also poll for updates if grading is in progress
  useEffect(() => {
    const run = async () => {
      if (!session?.id) return
      const transcriptArr = (session as any).full_transcript || session.transcript
      const hasTranscript = Array.isArray(transcriptArr) && transcriptArr.length > 0
      const hasScore = session.overall_score && session.overall_score > 0
      const hasAIFeedback = Boolean(session.analytics?.feedback)
      
      if (hasTranscript && (!hasScore || !hasAIFeedback)) {
        setGrading(true)
        
        // Poll every 2 seconds until grading completes
        const pollInterval = setInterval(async () => {
          await fetchSessionData()
          const freshSession = session
          if (freshSession?.overall_score && freshSession?.overall_score > 0) {
            clearInterval(pollInterval)
            setGrading(false)
          }
        }, 2000)
        
        // Clear interval after 30 seconds max
        setTimeout(() => {
          clearInterval(pollInterval)
          setGrading(false)
        }, 30000)
        
        return () => clearInterval(pollInterval)
      }
    }
    run()
  }, [
    session?.id,
    Array.isArray((session as any)?.full_transcript)
      ? (session as any)?.full_transcript?.length
      : (Array.isArray(session?.transcript) ? session?.transcript?.length : 0),
    Boolean(session?.analytics?.feedback)
  ])

  const fetchSessionData = async () => {
    try {
      const sessionId = Array.isArray(params.sessionId)
        ? params.sessionId[0]
        : params.sessionId

      // Always use API route for now to avoid auth issues
      // The API uses service role so it bypasses RLS
      const resp = await fetch(`/api/sessions/${sessionId}`)
      if (!resp.ok) {
        console.error('Failed to fetch session:', resp.status, resp.statusText)
        throw new Error(`API fetch failed: ${resp.status}`)
      }
      const json = await resp.json()
      setSession(json)
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-slate-700 rounded mb-4"></div>
          <div className="h-64 w-96 bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Session not found</h2>
          <button
            onClick={() => router.push('/trainer')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to training
          </button>
        </div>
      </div>
    )
  }

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
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Session Analysis</h1>
              <p className="text-slate-400 mt-1">
                {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Animated Score Display */}
          {grading || (!session.overall_score && (session as any).full_transcript && (session as any).full_transcript.length > 0) ? (
            <div className="py-16 text-center">
              <motion.div
                className="w-16 h-16 mx-auto rounded-full border-4 border-slate-600 border-t-blue-500 mb-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
              />
              <p className="text-slate-300 text-lg">Calculating your score...</p>
              <p className="text-slate-400 text-sm mt-2">This may take a few moments</p>
            </div>
          ) : (
            <AnimatedScore 
              score={session.overall_score || 0}
              className="py-8"
            />
          )}
          
          {/* Session Duration */}
          <div className="text-center text-lg text-slate-400 -mt-4 mb-6">
            Session Duration: {formatDuration(session.duration_seconds || 0)}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 rounded-lg p-1 inline-flex border border-slate-700">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'transcript' 
                  ? 'bg-slate-700 text-slate-100 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Transcript Analysis
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'overview' 
                  ? 'bg-slate-700 text-slate-100 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
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
              transcript={(session as any).full_transcript || []}
              analytics={session.analytics}
              className="mb-6"
            />
            {/* Advanced Metrics Section */}
            {session.analytics && (
              <AdvancedMetrics 
                advancedMetrics={session.analytics.advancedMetrics}
                patterns={session.analytics.patterns}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI-Generated Feedback */}
            <div className="bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                AI Performance Analysis
              </h2>
              
              {/* Strengths */}
              {(session as any).what_worked && (session as any).what_worked.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    What Worked Well
                  </h3>
                  <ul className="space-y-2">
                    {(session as any).what_worked.map((item: string, idx: number) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start p-3 bg-green-900/20 border border-green-700/30 rounded-lg"
                      >
                        <span className="text-green-400 mr-3 text-xl">✓</span>
                        <span className="text-slate-200">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Areas for Improvement */}
              {(session as any).what_failed && (session as any).what_failed.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {(session as any).what_failed.map((item: string, idx: number) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg"
                      >
                        <span className="text-yellow-400 mr-3 text-xl">⚠</span>
                        <span className="text-slate-200">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Specific Tips */}
              {(session as any).key_learnings && (session as any).key_learnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Specific Tips & Techniques
                  </h3>
                  <ul className="space-y-2">
                    {(session as any).key_learnings.map((item: string, idx: number) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg"
                      >
                        <span className="text-blue-400 mr-3 text-xl">💡</span>
                        <span className="text-slate-200">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Show message if no feedback yet */}
              {(!session.what_worked || session.what_worked.length === 0) && 
               (!session.what_failed || (session as any).what_failed.length === 0) && 
               (!(session as any).key_learnings || (session as any).key_learnings.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p>No AI feedback available yet. Complete the grading process to see detailed analysis.</p>
                </div>
              )}
            </div>
            
            {/* Performance Metrics */}
            <PerformanceMetrics 
              metrics={metricsData}
              transcript={(session as any).full_transcript || []}
              onLineClick={scrollToTranscriptLine}
            />
          </div>
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
            onClick={() => router.push('/sessions')}
            className="px-6 py-3 bg-slate-700 text-slate-100 font-semibold rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
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


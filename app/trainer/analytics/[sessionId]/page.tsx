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
  discovery_score: number
  objection_handling_score: number
  closing_score: number
  full_transcript: any[]
  transcript: any[]
  what_worked?: string[]
  what_failed?: string[]
  virtual_earnings: number
  analytics?: any
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
      const transcriptArr = session.full_transcript || session.transcript || []
      const hasTranscript = Array.isArray(transcriptArr) && transcriptArr.length > 0
      const hasScore = session.overall_score && session.overall_score > 0
      const hasAIFeedback = Boolean(session.analytics?.feedback)
      
      if (hasTranscript && (!hasScore || !hasAIFeedback)) {
        setGrading(true)
        
        // Trigger grading immediately
        console.log('🎯 Triggering grading for session:', session.id)
        fetch(`/api/training-sessions/${session.id}/grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => {
          console.error('Error triggering grading:', error)
        })
        
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
    Array.isArray(session?.transcript) ? session?.transcript?.length : 0,
    Boolean(session?.analytics?.feedback)
  ])

  const fetchSessionData = async () => {
    try {
      const sessionId = Array.isArray(params.sessionId)
        ? params.sessionId[0]
        : params.sessionId

      console.log('📊 SIMPLE: Fetching session:', sessionId)

      const resp = await fetch(`/api/simple-sessions/${sessionId}`)
      if (!resp.ok) {
        throw new Error(`Training session not found: ${resp.status}`)
      }
      
      const json = await resp.json()
      setSession(json)
    } catch (error) {
      console.error('❌ Error fetching training session:', error)
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
      label: 'Rapport',
      score: session.rapport_score || 0,
      color: 'blue' as const,
      feedback: (session.rapport_score || 0) >= 85 ? "Outstanding introduction and trust building - genuine connection established" :
                (session.rapport_score || 0) >= 70 ? "Good rapport foundation, but make your introduction more personalized" :
                "Focus on a warmer introduction and building authentic trust"
    },
    {
      label: 'Discovery',
      score: session.discovery_score || 0,
      color: 'green' as const,
      feedback: (session.discovery_score || 0) >= 85 ? "Excellent discovery - asked great questions and truly listened" :
                (session.discovery_score || 0) >= 70 ? "Good questioning, but listen more actively to their responses" :
                "Ask more open-ended questions and demonstrate you're listening"
    },
    {
      label: 'Objection Handling',
      score: session.objection_handling_score || 0,
      color: 'yellow' as const,
      feedback: (session.objection_handling_score || 0) >= 85 ? "Masterful objection handling - turned concerns into opportunities" :
                (session.objection_handling_score || 0) >= 70 ? "Good responses, but provide more thoughtful solutions" :
                "Acknowledge concerns first, then provide clear solutions"
    },
    {
      label: 'Close',
      score: session.closing_score || 0,
      color: 'purple' as const,
      feedback: (session.closing_score || 0) >= 85 ? "Excellent closing - confident ask and got the commitment!" :
                (session.closing_score || 0) >= 70 ? "Good closing attempt, but be more assumptive and create urgency" :
                "Practice confident closes - ask for the sale on the doorstep"
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
          {grading || (!session.overall_score && session.transcript && session.transcript.length > 0) ? (
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
              transcript={session.full_transcript || session.transcript || []}
              analytics={session.analytics}
              className="mb-6"
            />
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
              {session.what_worked && session.what_worked.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    What Worked Well
                  </h3>
                  <ul className="space-y-2">
                    {session.what_worked.map((item: string, idx: number) => (
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
              {session.what_failed && session.what_failed.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {session.what_failed.map((item: string, idx: number) => (
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
              
              
              {/* Show message if no feedback yet */}
              {(!session.what_worked || session.what_worked.length === 0) && 
               (!session.what_failed || session.what_failed.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <p>No AI feedback available yet. Complete the grading process to see detailed analysis.</p>
                </div>
              )}
            </div>

            {/* 4-Category Scoring Grid */}
            <div className="bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
              <h2 className="text-2xl font-semibold text-slate-100 mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Performance Breakdown
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metricsData.map((metric, idx) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-900/50 rounded-xl p-6 border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-100">{metric.label}</h3>
                      <div className={`text-2xl font-bold ${
                        metric.score >= 85 ? 'text-green-400' :
                        metric.score >= 70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {metric.score}/100
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-slate-700 rounded-full h-3 mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.score}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={`h-3 rounded-full ${
                          metric.score >= 85 ? 'bg-green-500' :
                          metric.score >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                      />
                    </div>
                    
                    <p className="text-sm text-slate-300">{metric.feedback}</p>
                  </motion.div>
                ))}
              </div>
            </div>
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


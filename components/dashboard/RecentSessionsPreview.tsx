'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle2, XCircle, AlertTriangle, Eye, RotateCcw, Share2, ArrowRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { createClient } from '@/lib/supabase/client'

interface RecentSession {
  id: string
  agentName: string
  score: number
  grade: string
  startedAt: string
  durationSeconds: number | null
  voiceScore?: number
  conversationScore?: number
  closingScore?: number
  keyIssues?: string[]
  strengths?: string[]
}

export default function RecentSessionsPreview() {
  const router = useRouter()
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentSessions()
  }, [])

  const fetchRecentSessions = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data: sessionsData, error } = await supabase
        .from('live_sessions')
        .select('id, agent_name, overall_score, started_at, created_at, duration_seconds, analytics, opening_introduction_score, objection_handling_score, closing_score, rapport_score')
        .eq('user_id', user.id)
        .not('overall_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        // Don't log 400 errors as they're likely RLS/permission issues
        if (error.code !== 'PGRST116' && error.status !== 400) {
          console.error('Error fetching sessions:', error)
        }
        setLoading(false)
        setSessions([])
        return
      }

      const formattedSessions: RecentSession[] = (sessionsData || []).map((session: any) => {
        const analytics = session.analytics || {}
        const feedback = analytics.feedback || {}
        const improvements = feedback.improvements || []
        const strengths = feedback.strengths || []

        // Calculate grade
        const score = session.overall_score || 0
        const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

        // Generate strengths from high scores
        const generatedStrengths: string[] = []
        if (session.opening_introduction_score >= 80) {
          generatedStrengths.push('Strong opening')
        }
        if (session.objection_handling_score >= 80) {
          generatedStrengths.push('Great objection handling')
        }
        if (session.closing_score >= 80) {
          generatedStrengths.push('Effective closing')
        }
        if (session.rapport_score >= 80) {
          generatedStrengths.push('Excellent rapport')
        }

        // Generate improvements from low scores
        const generatedImprovements: string[] = []
        if (session.opening_introduction_score < 60) {
          generatedImprovements.push('Work on opening')
        }
        if (session.objection_handling_score < 60) {
          generatedImprovements.push('Improve objection handling')
        }
        if (session.closing_score < 60) {
          generatedImprovements.push('Strengthen closing')
        }

        // Calculate average scores for categories
        const voiceAnalysis = analytics.voice_analysis || {}
        const voiceConfidence = voiceAnalysis.confidence || 0
        const voiceEnergy = voiceAnalysis.energy || 0
        const voiceClarity = voiceAnalysis.clarity || 0
        
        const voiceScore = voiceConfidence && voiceEnergy && voiceClarity
          ? Math.round((voiceConfidence + voiceEnergy + voiceClarity) / 3)
          : Math.round((session.opening_introduction_score || 0 + session.rapport_score || 0) / 2)

        const conversationScore = Math.round(
          ((session.opening_introduction_score || 0) + 
           (session.objection_handling_score || 0) + 
           (session.rapport_score || 0)) / 3
        )

        const closingScore = session.closing_score || 0

        return {
          id: session.id,
          agentName: session.agent_name || 'Unknown',
          score,
          grade,
          startedAt: session.started_at || session.created_at,
          durationSeconds: session.duration_seconds,
          voiceScore,
          conversationScore,
          closingScore,
          keyIssues: (improvements.length > 0 ? improvements : generatedImprovements).slice(0, 3),
          strengths: (strengths.length > 0 ? strengths : generatedStrengths).slice(0, 2)
        }
      })

      setSessions(formattedSessions)
    } catch (error) {
      console.error('Error fetching recent sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-400'
    if (grade === 'B') return 'text-blue-400'
    if (grade === 'C') return 'text-yellow-400'
    if (grade === 'D') return 'text-orange-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded w-1/3 animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-space text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-purple-400" />
          RECENT SESSIONS
        </h2>
        <button
          onClick={() => router.push('/sessions')}
          className="font-space text-purple-400 hover:text-purple-300 text-sm md:text-base font-bold flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {sessions.map((session, index) => {
          const sessionDate = new Date(session.startedAt)
          const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          const isYesterday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
          
          let dateLabel = ''
          if (isToday) {
            dateLabel = `Today, ${format(sessionDate, 'h:mm a')}`
          } else if (isYesterday) {
            dateLabel = `Yesterday, ${format(sessionDate, 'h:mm a')}`
          } else {
            dateLabel = format(sessionDate, 'MMM d, h:mm a')
          }

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Score Circle */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className={`font-space text-5xl md:text-6xl font-bold tracking-tight ${getScoreColor(session.score)}`}>
                            {session.score}
                          </span>
                          <span className="font-space text-lg md:text-xl font-bold text-white/80">/100</span>
                        </div>
                        <div className={`font-space text-4xl md:text-5xl font-bold tracking-tight ${getGradeColor(session.grade)} mt-1`}>
                          {session.grade}
                        </div>
                      </div>
                  </div>
                </div>

                {/* Middle: Session Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        <Image
                          src={PERSONA_METADATA[session.agentName as AllowedAgentName]?.bubble?.image || '/agents/default.png'}
                          alt={session.agentName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <p className="font-space text-white text-xl md:text-2xl font-bold tracking-tight">{session.agentName}</p>
                        <p className="font-space text-white/80 text-base md:text-lg font-bold flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {dateLabel} • {formatDuration(session.durationSeconds)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strengths and Issues */}
                  <div className="space-y-2">
                    {session.strengths && session.strengths.length > 0 && (
                      <div className="flex flex-wrap gap-2 md:gap-4">
                        {session.strengths.map((strength, i) => (
                          <div key={i} className="flex items-center gap-2 font-space text-xs md:text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                            {strength}
                          </div>
                        ))}
                      </div>
                    )}
                    {session.keyIssues && session.keyIssues.length > 0 && (
                      <div className="flex flex-wrap gap-2 md:gap-4">
                        {session.keyIssues.map((issue, i) => (
                          <div key={i} className="flex items-center gap-2 font-space text-xs md:text-sm font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">
                            <XCircle className="w-3 h-3 md:w-4 md:h-4" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Metrics */}
                  <div className="flex flex-wrap gap-4 md:gap-6 font-space text-sm md:text-base">
                    {session.voiceScore !== undefined && (
                      <div>
                        <span className="font-space text-white/80 text-base md:text-lg font-bold">Voice: </span>
                        <span className={`font-bold ${getScoreColor(session.voiceScore)}`}>
                          {session.voiceScore}%
                        </span>
                      </div>
                    )}
                    {session.conversationScore !== undefined && (
                      <div>
                        <span className="font-space text-white/80 text-base md:text-lg font-bold">Conversation: </span>
                        <span className={`font-bold ${getScoreColor(session.conversationScore)}`}>
                          {session.conversationScore}%
                        </span>
                      </div>
                    )}
                    {session.closingScore !== undefined && (
                      <div>
                        <span className="font-space text-white/80 text-base md:text-lg font-bold">Close: </span>
                        <span className={`font-bold ${getScoreColor(session.closingScore)}`}>
                          {session.closingScore}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/analytics/${session.id}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 font-space font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-gray-300 transition-all"
                  >
                    View Details
                    <Eye className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => router.push('/trainer')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-space font-bold rounded-md text-base md:text-lg tracking-tight transition-all shadow-md shadow-purple-500/15"
                  >
                    Practice Again
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}


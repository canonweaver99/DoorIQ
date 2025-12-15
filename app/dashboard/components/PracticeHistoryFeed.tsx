'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Calendar, FileText, RotateCcw, Share2, CheckCircle2, AlertCircle, ArrowRight, Target } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PracticeSession {
  id: string
  agentName: string
  score: number
  startedAt: string
  durationSeconds: number | null
  improvements?: string[]
  strengths?: string[]
}

interface PracticeHistoryFeedProps {
  initialSessions?: PracticeSession[]
}

export default function PracticeHistoryFeed({ initialSessions = [] }: PracticeHistoryFeedProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<PracticeSession[]>(initialSessions)
  const [loading, setLoading] = useState(!initialSessions.length)

  useEffect(() => {
    if (!initialSessions.length) {
      fetchRecentSessions()
    }
  }, [])

  const fetchRecentSessions = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: sessionsData, error } = await supabase
        .from('live_sessions')
        .select('id, agent_name, overall_score, started_at, duration_seconds, analytics, opening_introduction_score, objection_handling_score, closing_score, rapport_score')
        .eq('user_id', user.id)
        .not('overall_score', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching sessions:', error)
        return
      }

      const formattedSessions: PracticeSession[] = (sessionsData || []).map((session: any) => {
        const analytics = session.analytics || {}
        const feedback = analytics.feedback || {}
        const improvements = feedback.improvements || []
        const strengths = feedback.strengths || []

        // Generate strengths from high scores if not in feedback
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

        // Generate improvements from low scores if not in feedback
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

        return {
          id: session.id,
          agentName: session.agent_name || 'Unknown',
          score: session.overall_score || 0,
          startedAt: session.started_at,
          durationSeconds: session.duration_seconds,
          improvements: (improvements.length > 0 ? improvements : generatedImprovements).slice(0, 2),
          strengths: (strengths.length > 0 ? strengths : generatedStrengths).slice(0, 2),
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
    return `${minutes}m`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-purple-400'
    if (score >= 60) return 'text-white/80'
    return 'text-white/60'
  }

  const getPersonalityType = (personaName: string) => {
    // Map personas to personality types based on difficulty
    const personaMeta = PERSONA_METADATA[personaName as AllowedAgentName]
    const difficulty = personaMeta?.bubble?.difficulty || 'Moderate'
    
    if (difficulty === 'Easy') return { emoji: '🐑', type: 'Sheep' }
    if (difficulty === 'Moderate') return { emoji: '🐯', type: 'Tiger' }
    if (difficulty === 'Hard') return { emoji: '🐂', type: 'Bull' }
    return { emoji: '🦉', type: 'Owl' }
  }

  const handlePracticeAgain = (personaName: string) => {
    const personaMeta = PERSONA_METADATA[personaName as AllowedAgentName]
    const agentId = personaMeta?.card?.elevenAgentId
    if (agentId) {
      router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
    } else {
      router.push('/trainer')
    }
  }

  const handleShare = async (sessionId: string) => {
    // Copy session URL to clipboard
    const url = `${window.location.origin}/sessions?id=${sessionId}`
    try {
      await navigator.clipboard.writeText(url)
      // Could add a toast notification here
      alert('Session link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-4">
          PRACTICE HISTORY
        </h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-8 md:p-12 text-center transition-all"
          >
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center border-2 border-white/10">
              <Target className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">
              Your First Victory Starts Here
            </h3>
          </div>
          
          <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">
            After your first session, you'll see:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-w-lg mx-auto text-left">
            <div className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span className="text-white/70 text-sm">Detailed performance scores</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span className="text-white/70 text-sm">AI coaching feedback</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span className="text-white/70 text-sm">Improvement trends</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <span className="text-white/70 text-sm">Session transcripts</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/trainer')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 hover:bg-gray-300 font-bold rounded-lg transition-all mx-auto"
          >
            Start Your First Session →
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide">
          RECENT PRACTICE SESSIONS
        </h3>
      </div>
      {sessions.map((session, index) => {
        const personaName = session.agentName as AllowedAgentName
        const personaMeta = PERSONA_METADATA[personaName]
        const agentImage = personaMeta?.bubble?.image || '/agents/default.png'
        const personalityType = getPersonalityType(personaName)

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-5 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Session Thumbnail */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20 flex-shrink-0">
                <Image
                  src={agentImage}
                  alt={session.agentName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="64px"
                />
              </div>

              {/* Session Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-base group-hover:text-purple-300 transition-colors">
                        {session.agentName}
                      </h4>
                      <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300">
                        {personalityType.type}
                      </span>
                      <span className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                        • Score: {session.score}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-white/60 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(session.startedAt), 'MMM d, yyyy')} • {format(new Date(session.startedAt), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Duration: {formatDuration(session.durationSeconds)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback Highlights */}
                <div className="mt-3 space-y-2">
                  {session.strengths && session.strengths.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white/90 text-sm">
                          <span className="font-medium">Strong:</span> {session.strengths[0]}
                          {session.strengths.length > 1 && ` (${session.strengths[1]})`}
                        </p>
                      </div>
                    </div>
                  )}
                  {session.improvements && session.improvements.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white/90 text-sm">
                          <span className="font-medium">Focus:</span> {session.improvements[0]}
                          {session.improvements.length > 1 && ` (${session.improvements[1]})`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <Link
                    href={`/sessions?id=${session.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/80 hover:text-white text-xs font-medium transition-all"
                  >
                    <FileText className="w-3 h-3" />
                    View Full Transcript
                  </Link>
                  <button
                    onClick={() => handlePracticeAgain(personaName)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white rounded-md text-xs font-medium transition-all shadow-md shadow-purple-500/15 hover:opacity-90"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Practice Again
                  </button>
                  <button
                    onClick={() => handleShare(session.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/80 hover:text-white text-xs font-medium transition-all"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}


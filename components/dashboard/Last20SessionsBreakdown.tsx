'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, ArrowRight, Award, XCircle, Clock, Eye, RotateCcw, CheckCircle2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

interface SessionBreakdown {
  id: string
  agentName: string
  overallScore: number | null
  rapportScore: number | null
  discoveryScore: number | null
  objectionHandlingScore: number | null
  closeScore: number | null
  virtualEarnings: number
  saleClosed: boolean
  returnAppointment: boolean
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
}

export default function Last20SessionsBreakdown() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [closedDeals, setClosedDeals] = useState(0)
  const [avgDuration, setAvgDuration] = useState<number | null>(null)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [highestEarnings, setHighestEarnings] = useState(0)
  const [topSessions, setTopSessions] = useState<SessionBreakdown[]>([])

  useEffect(() => {
    fetchSessionsData()
  }, [])

  const generateFakeData = (): SessionBreakdown[] => {
    // Use Average Austin for all fake sessions
    const fakeSessions: SessionBreakdown[] = []
    
    for (let i = 0; i < 20; i++) {
      const daysAgo = i
      const startedAt = new Date()
      startedAt.setDate(startedAt.getDate() - daysAgo)
      startedAt.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60))
      
      const duration = 300 + Math.floor(Math.random() * 600) // 5-15 minutes
      const endedAt = new Date(startedAt.getTime() + duration * 1000)
      
      const overallScore = 50 + Math.floor(Math.random() * 50) // 50-100
      const rapportScore = overallScore + Math.floor(Math.random() * 20) - 10
      const discoveryScore = overallScore + Math.floor(Math.random() * 20) - 10
      const objectionScore = overallScore + Math.floor(Math.random() * 20) - 10
      const closeScore = overallScore + Math.floor(Math.random() * 20) - 10
      
      const saleClosed = Math.random() > 0.6
      const virtualEarnings = saleClosed ? Math.floor(Math.random() * 5000) + 1000 : 0
      
      fakeSessions.push({
        id: `fake-${i}`,
        agentName: 'Average Austin', // Always use Average Austin for fake data
        overallScore: Math.max(0, Math.min(100, overallScore)),
        rapportScore: Math.max(0, Math.min(100, rapportScore)),
        discoveryScore: Math.max(0, Math.min(100, discoveryScore)),
        objectionHandlingScore: Math.max(0, Math.min(100, objectionScore)),
        closeScore: Math.max(0, Math.min(100, closeScore)),
        virtualEarnings,
        saleClosed,
        returnAppointment: !saleClosed && Math.random() > 0.7,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationSeconds: duration
      })
    }
    
    return fakeSessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }

  const fetchSessionsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Use fake data for guests/local development
      if (!user) {
        const fakeSessions = generateFakeData()
        setSessions(fakeSessions)
        
        // Calculate averages and totals
        const scores = fakeSessions.map(s => s.overallScore).filter((s): s is number => s !== null)
        const avg = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
        setAvgScore(avg)
        
        const total = fakeSessions.reduce((sum, s) => sum + s.virtualEarnings, 0)
        setTotalEarnings(total)
        
        const highest = fakeSessions.length > 0 
          ? Math.max(...fakeSessions.map(s => s.virtualEarnings))
          : 0
        setHighestEarnings(highest)
        
        const closed = fakeSessions.filter(s => s.saleClosed).length
        setClosedDeals(closed)
        
        const durations = fakeSessions.map(s => s.durationSeconds).filter((d): d is number => d !== null)
        const avgDur = durations.length > 0 ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) : null
        setAvgDuration(avgDur)
        
        // Get top 2 sessions (or all available if less than 2)
        const sessionsWithScores = fakeSessions.filter(s => s.overallScore !== null)
        const topTwo = sessionsWithScores.length >= 2
          ? [...sessionsWithScores]
              .sort((a, b) => {
                const scoreDiff = (b.overallScore || 0) - (a.overallScore || 0)
                if (scoreDiff !== 0) return scoreDiff
                return b.virtualEarnings - a.virtualEarnings
              })
              .slice(0, 2)
          : sessionsWithScores.length === 1
          ? [sessionsWithScores[0]]
          : []
        setTopSessions(topTwo)
        
        setLoading(false)
        return
      }

      // Fetch all sessions (up to 20) - if user has less than 20, we'll use all available
      const { data: sessionsData, error } = await supabase
        .from('live_sessions')
        .select('id, agent_name, overall_score, rapport_score, discovery_score, objection_handling_score, close_score, virtual_earnings, sale_closed, return_appointment, started_at, ended_at, duration_seconds')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching sessions data:', error)
        setLoading(false)
        return
      }

      const formattedSessions: SessionBreakdown[] = (sessionsData || []).map((session: any) => ({
        id: session.id,
        agentName: session.agent_name || 'Unknown',
        overallScore: session.overall_score,
        rapportScore: session.rapport_score,
        discoveryScore: session.discovery_score,
        objectionHandlingScore: session.objection_handling_score,
        closeScore: session.close_score,
        virtualEarnings: parseFloat(session.virtual_earnings) || 0,
        saleClosed: session.sale_closed || false,
        returnAppointment: session.return_appointment || false,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        durationSeconds: session.duration_seconds
      }))

      setSessions(formattedSessions)
      
      // Calculate averages and totals
      const scores = formattedSessions.map(s => s.overallScore).filter((s): s is number => s !== null)
      const avg = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
      setAvgScore(avg)
      
      const best = scores.length > 0 ? Math.max(...scores) : null
      setBestScore(best)
      
      const total = formattedSessions.reduce((sum, s) => sum + s.virtualEarnings, 0)
      setTotalEarnings(total)
      
      const highest = formattedSessions.length > 0 
        ? Math.max(...formattedSessions.map(s => s.virtualEarnings))
        : 0
      setHighestEarnings(highest)
      
      const closed = formattedSessions.filter(s => s.saleClosed).length
      setClosedDeals(closed)
      
      const durations = formattedSessions.map(s => s.durationSeconds).filter((d): d is number => d !== null)
      const avgDur = durations.length > 0 ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length) : null
      setAvgDuration(avgDur)
      
      // Get top 2 sessions (by score, then by earnings if tied)
      // Only show top sessions if we have sessions with scores
      const sessionsWithScores = formattedSessions.filter(s => s.overallScore !== null)
      const topTwo = sessionsWithScores.length >= 2
        ? [...sessionsWithScores]
            .sort((a, b) => {
              const scoreDiff = (b.overallScore || 0) - (a.overallScore || 0)
              if (scoreDiff !== 0) return scoreDiff
              return b.virtualEarnings - a.virtualEarnings
            })
            .slice(0, 2)
        : sessionsWithScores.length === 1
        ? [sessionsWithScores[0]]
        : []
      setTopSessions(topTwo)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-white/40'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreGrade = (score: number | null) => {
    if (score === null) return 'N/A'
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-400'
    if (grade === 'B') return 'text-blue-400'
    if (grade === 'C') return 'text-yellow-400'
    if (grade === 'D') return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return 'bg-white/10 border-white/20'
    if (score >= 80) return 'bg-green-500/20 border-green-500/30 text-green-300'
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
    return 'bg-red-500/20 border-red-500/30 text-red-300'
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-12 bg-white/10 rounded w-1/2"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2 font-space">No Sessions Yet</h3>
          <p className="text-slate-400 font-sans text-sm">Complete practice sessions to see your breakdown</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="font-space text-white text-lg sm:text-xl md:text-2xl font-bold tracking-tight mb-1">
            {sessions.length >= 20 ? 'Last 20 Sessions Breakdown' : `Last ${sessions.length} Session${sessions.length !== 1 ? 's' : ''} Breakdown`}
          </h2>
          <p className="font-space text-white/60 text-xs sm:text-sm font-semibold">
            Scores, Earnings & Performance Metrics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Avg Score</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-xl sm:text-2xl md:text-3xl font-bold font-space", getScoreColor(avgScore))}>
              {avgScore !== null ? Math.round(avgScore) : 'N/A'}
            </p>
            {avgScore !== null && (
              <span className={cn("px-2 py-0.5 text-xs font-bold rounded border", getScoreBadgeColor(avgScore))}>
                {getScoreGrade(avgScore)}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Best Score</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-xl sm:text-2xl md:text-3xl font-bold font-space", getScoreColor(bestScore))}>
              {bestScore !== null ? bestScore : 'N/A'}
            </p>
            {bestScore !== null && (
              <span className={cn("px-2 py-0.5 text-xs font-bold rounded border", getScoreBadgeColor(bestScore))}>
                {getScoreGrade(bestScore)}
              </span>
            )}
          </div>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Total Earnings</p>
          <p className="text-green-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Highest Earnings</p>
          <p className="text-green-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {formatCurrency(highestEarnings)}
          </p>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Deals Closed</p>
          <p className="text-purple-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {closedDeals}
          </p>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Avg Duration</p>
          <p className="text-blue-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {avgDuration !== null ? formatDuration(avgDuration) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Top Sessions */}
      {topSessions.length > 0 && (
        <>
          <div className="mb-5">
            <h3 className="text-white font-semibold text-base sm:text-lg font-space">Top Sessions</h3>
            <p className="text-white/60 text-xs font-sans">Your best performing sessions from the last 20</p>
          </div>
          <div className="space-y-5">
            {topSessions.map((session, index) => {
              const hasScore = session.overallScore !== null
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

              const grade = hasScore ? getScoreGrade(session.overallScore) : 'N/A'
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-5 md:p-6 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Left: Session Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          {/* Agent Avatar */}
                          {PERSONA_METADATA[session.agentName as AllowedAgentName]?.bubble?.image ? (
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                              <Image
                                src={PERSONA_METADATA[session.agentName as AllowedAgentName]!.bubble!.image}
                                alt={session.agentName}
                                fill
                                className="object-cover"
                                sizes="96px"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/agents/default.png'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-white font-bold text-lg md:text-xl rounded-full border border-white/20 flex-shrink-0">
                              {session.agentName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-space text-white text-lg md:text-xl font-bold tracking-tight">{session.agentName}</p>
                            <p className="font-space text-white/80 text-sm md:text-base font-bold flex items-center gap-2 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {dateLabel} • {formatDuration(session.durationSeconds)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {session.saleClosed && (
                          <div className="flex items-center gap-1.5 font-space text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Sale Closed
                          </div>
                        )}
                        {!session.saleClosed && session.returnAppointment && (
                          <div className="flex items-center gap-1.5 font-space text-xs font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Return Scheduled
                          </div>
                        )}
                        {session.virtualEarnings > 0 && (
                          <div className="flex items-center gap-1.5 font-space text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(session.virtualEarnings)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Score + Actions */}
                    <div className="flex flex-col md:flex-row items-center md:items-center gap-5 flex-shrink-0">
                      {/* Score Display */}
                      {hasScore && (
                        <div className="flex items-baseline gap-2.5 justify-center md:justify-start">
                          <div className="flex items-baseline gap-1.5">
                            <span className={cn("font-space text-4xl md:text-5xl font-bold tracking-tight", getScoreColor(session.overallScore))}>
                              {session.overallScore}
                            </span>
                            <span className="font-space text-base md:text-lg font-bold text-white/80">/100</span>
                          </div>
                          <span className={cn("font-space text-3xl md:text-4xl font-bold tracking-tight", getGradeColor(grade))}>
                            {grade}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2.5">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (!session.id.startsWith('fake-')) {
                              router.push(`/analytics/${session.id}`)
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black font-space font-bold rounded-md text-sm md:text-base tracking-tight hover:bg-white/95 transition-all"
                        >
                          View Details
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => router.push('/trainer')}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-space font-bold rounded-md text-sm md:text-base tracking-tight transition-all shadow-md shadow-purple-500/15"
                        >
                          Practice Again
                          <RotateCcw className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* View All Link */}
      {sessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => router.push('/sessions')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white text-sm font-semibold transition-all font-space"
          >
            View All Sessions ({sessions.length})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

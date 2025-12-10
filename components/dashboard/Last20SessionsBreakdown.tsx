'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, ArrowRight, Award, XCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    fetchSessionsData()
  }, [])

  const fetchSessionsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

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
      
      const total = formattedSessions.reduce((sum, s) => sum + s.virtualEarnings, 0)
      setTotalEarnings(total)
      
      const closed = formattedSessions.filter(s => s.saleClosed).length
      setClosedDeals(closed)
      
      const durations = formattedSessions.map(s => s.durationSeconds).filter((d): d is number => d !== null)
      const avgDur = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : null
      setAvgDuration(avgDur)
      
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
            Last 20 Sessions Breakdown
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Total Earnings</p>
          <p className="text-green-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {formatCurrency(totalEarnings)}
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

      {/* Sessions List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {sessions.map((session, index) => {
          const hasScore = session.overallScore !== null
          
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
              onClick={() => router.push(`/analytics/${session.id}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Left side - Session info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-white font-semibold text-sm sm:text-base font-space truncate">
                      {session.agentName}
                    </p>
                    {session.saleClosed && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-semibold rounded border border-green-500/30 flex-shrink-0 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Closed
                      </span>
                    )}
                    {!session.saleClosed && session.returnAppointment && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded border border-blue-500/30 flex-shrink-0">
                        Return Scheduled
                      </span>
                    )}
                  </div>
                  
                  {/* Score breakdown */}
                  {hasScore && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-white/60 text-xs font-space">Overall:</span>
                        <span className={cn("text-xs font-bold font-space", getScoreColor(session.overallScore))}>
                          {session.overallScore}/100
                        </span>
                      </div>
                      {session.rapportScore !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-white/60 text-xs font-space">Rapport:</span>
                          <span className={cn("text-xs font-bold font-space", getScoreColor(session.rapportScore))}>
                            {session.rapportScore}
                          </span>
                        </div>
                      )}
                      {session.discoveryScore !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-white/60 text-xs font-space">Discovery:</span>
                          <span className={cn("text-xs font-bold font-space", getScoreColor(session.discoveryScore))}>
                            {session.discoveryScore}
                          </span>
                        </div>
                      )}
                      {session.objectionHandlingScore !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-white/60 text-xs font-space">Objection:</span>
                          <span className={cn("text-xs font-bold font-space", getScoreColor(session.objectionHandlingScore))}>
                            {session.objectionHandlingScore}
                          </span>
                        </div>
                      )}
                      {session.closeScore !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-white/60 text-xs font-space">Close:</span>
                          <span className={cn("text-xs font-bold font-space", getScoreColor(session.closeScore))}>
                            {session.closeScore}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Time and duration */}
                  <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-sans">
                        {session.endedAt 
                          ? formatDistanceToNow(new Date(session.endedAt), { addSuffix: true })
                          : formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })
                        }
                      </span>
                    </div>
                    {session.durationSeconds !== null && (
                      <span className="font-sans">
                        Duration: {formatDuration(session.durationSeconds)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Right side - Earnings and score badge */}
                <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                  {session.virtualEarnings > 0 && (
                    <p className="text-green-400 text-lg sm:text-xl font-bold font-space">
                      {formatCurrency(session.virtualEarnings)}
                    </p>
                  )}
                  {hasScore && (
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-1 text-sm font-bold rounded border", getScoreBadgeColor(session.overallScore))}>
                        {session.overallScore}/100 ({getScoreGrade(session.overallScore)})
                      </span>
                    </div>
                  )}
                  {!hasScore && (
                    <span className="px-2 py-1 text-sm font-bold rounded border bg-white/10 border-white/20 text-white/60">
                      No Score
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* View All Link */}
      {sessions.length >= 20 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => router.push('/sessions')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white text-sm font-semibold transition-all font-space"
          >
            View All Sessions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

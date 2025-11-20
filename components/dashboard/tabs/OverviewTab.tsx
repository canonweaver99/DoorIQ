'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, Users, ArrowRight, Calendar, Clock, ChevronRight, AlertCircle, Zap, Crown } from 'lucide-react'
import Link from 'next/link'
import EnhancedMetricCard from '../overview/EnhancedMetricCard'
import CircularProgress from '@/components/ui/CircularProgress'
import { MetricCardSkeleton, EmptyState } from '../overview/SkeletonLoader'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useSessionLimit } from '@/hooks/useSubscription'

type LiveSession = Database['public']['Tables']['live_sessions']['Row']

interface OverviewTabProps {
  metrics: {
    sessionsToday: { value: number; trend: number; trendUp: boolean }
    avgScore: { value: number; trend: number; trendUp: boolean }
    teamRanking: { value: number; total: number; trend: number; trendUp: boolean }
  }
  recentSessions: any[]
  insights: Array<{ id: number; text: string; type: string }>
}

export default function OverviewTab({ metrics, recentSessions, insights }: OverviewTabProps) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [realMetrics, setRealMetrics] = useState(metrics)
  const sessionLimit = useSessionLimit()

  useEffect(() => {
    fetchRealData()
  }, [])
  
  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRealData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  const fetchRealData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }
    
    // Fetch recent sessions (last 4)
    const { data: sessionsData } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
    
    // Calculate real metrics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: allSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, created_at')
      .eq('user_id', user.id)
    
    const todaySessions = allSessions?.filter(s => 
      new Date(s.created_at) >= today
    ).length || 0
    
    const avgScore = allSessions && allSessions.length > 0
      ? Math.round(allSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / allSessions.length)
      : 0
    
    setRealMetrics({
      sessionsToday: { value: todaySessions, trend: 0, trendUp: true },
      avgScore: { value: avgScore, trend: 0, trendUp: true },
      teamRanking: { value: 1, total: 1, trend: 0, trendUp: true }
    })
    
    setSessions(sessionsData || [])
    setLoading(false)
  }
  
  const getKeyInsight = (session: LiveSession): string => {
    const feedback = session.analytics?.feedback
    if (feedback?.strengths?.[0]) {
      return feedback.strengths[0]
    }
    if (feedback?.improvements?.[0]) {
      return feedback.improvements[0]
    }
    return 'Session completed'
  }

  // Generate sparkline data (7 days)
  const generateSparkline = (baseValue: number) => 
    Array.from({ length: 7 }, () => baseValue + (Math.random() - 0.5) * 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-24"
    >
      {/* Credits Banner */}
      {!sessionLimit.loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {sessionLimit.sessionsRemaining} Practice Credits Remaining
                </h3>
                <p className="text-sm text-slate-300">
                  {sessionLimit.sessionsUsed} of {sessionLimit.sessionsLimit} used this month • Resets monthly
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Crown className="w-4 h-4" />
              Upgrade for Unlimited
            </Link>
          </div>
          {sessionLimit.sessionsRemaining <= 3 && sessionLimit.sessionsRemaining > 0 && (
            <div className="mt-4 flex items-center gap-2 text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Running low on credits! Upgrade now to keep practicing.</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Enhanced Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EnhancedMetricCard
            title="Sessions Today"
            value={realMetrics.sessionsToday.value}
            trend={realMetrics.sessionsToday.trend}
            trendUp={realMetrics.sessionsToday.trendUp}
            icon={Target}
            sparklineData={generateSparkline(realMetrics.sessionsToday.value)}
            historicalData={{
              sevenDay: realMetrics.sessionsToday.value,
              thirtyDay: realMetrics.sessionsToday.value,
              allTime: sessions.length,
            }}
            delay={0}
          />
          <EnhancedMetricCard
            title="Average Score"
            value={`${realMetrics.avgScore.value}%`}
            trend={realMetrics.avgScore.trend}
            trendUp={realMetrics.avgScore.trendUp}
            icon={TrendingUp}
            sparklineData={generateSparkline(realMetrics.avgScore.value)}
            historicalData={{
              sevenDay: realMetrics.avgScore.value,
              thirtyDay: realMetrics.avgScore.value,
              allTime: realMetrics.avgScore.value,
            }}
            delay={0.05}
          />
          <EnhancedMetricCard
            title="Total Earnings"
            value={`$${sessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0).toFixed(0)}`}
            trend={0}
            trendUp={true}
            icon={Target}
            sparklineData={generateSparkline(100)}
            historicalData={{
              sevenDay: 0,
              thirtyDay: 0,
              allTime: sessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0),
            }}
            delay={0.1}
          />
        </div>
      )}

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
          <Link
            href="/sessions"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => {
              const insight = getKeyInsight(session)
              const isSuccess = session.analytics?.feedback?.strengths?.[0] === insight
              
              return (
                <div
                  key={session.id}
                  className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-xl p-5 border border-slate-700/60 hover:border-purple-500/40 transition-all shadow-lg hover:shadow-purple-500/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white mb-1">
                        {session.agent_name || 'Training Session'}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : 'N/A'}
                        </span>
                      </div>
                      {/* Key Insight */}
                      {insight && (
                        <div className={`flex items-start gap-2 text-xs ${
                          isSuccess ? 'text-green-400/80' : 'text-yellow-400/80'
                        }`}>
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>"{insight}"</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Earnings */}
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-1">Earned</p>
                        <p className={`text-2xl font-bold ${
                          session.virtual_earnings && session.virtual_earnings > 0 
                            ? 'text-emerald-400' 
                            : 'text-slate-500'
                        }`}>
                          ${session.virtual_earnings ? session.virtual_earnings.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      
                      {/* Score */}
                      <CircularProgress 
                        percentage={session.overall_score || 0}
                        size={70}
                        strokeWidth={5}
                      />
                      
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 text-sm rounded-lg hover:from-purple-600/30 hover:to-indigo-600/30 transition-all border border-purple-500/20"
                      >
                        View
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState message="No sessions yet. Start your first training!" />
        )}
      </motion.div>
    </motion.div>
  )
}


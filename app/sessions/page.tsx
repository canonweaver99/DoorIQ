'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { Calendar, Clock, TrendingUp, AlertCircle, ChevronRight, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

type Session = Database['public']['Tables']['live_sessions']['Row']

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    console.log('📊 Fetching sessions...')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.warn('⚠️ No authenticated user found')
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)

      let query = supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
        console.log('📅 Filtering: Past week')
      } else if (filter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('created_at', monthAgo.toISOString())
        console.log('📅 Filtering: Past month')
      } else {
        console.log('📅 Filtering: All time')
      }

      const { data, error, status } = await query

      if (error && status !== 406) {
        throw error
      }

      const rows = (data ?? []) as Session[]
      console.log('✅ Loaded', rows.length, 'sessions')
      setSessions(rows)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching sessions:', error)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400'
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'Not graded'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs improvement'
  }

  const getKeyInsights = (session: Session) => {
    const insights = []
    
    // Check for low scores
    if (session.rapport_score && session.rapport_score < 70) {
      insights.push({ type: 'warning', text: 'Work on building rapport early in the conversation' })
    }
    if (session.objection_handling_score && session.objection_handling_score < 70) {
      insights.push({ type: 'warning', text: 'Practice handling common objections more confidently' })
    }
    const closing = session.close_effectiveness_score ?? (session as any).close_score ?? null
    if (closing && closing < 70) {
      insights.push({ type: 'warning', text: 'Focus on closing techniques and asking for the sale' })
    }
    
    // Check for high scores
    const safety = session.safety_score ?? null
    if (safety && safety >= 80) {
      insights.push({ type: 'success', text: 'Great job addressing safety concerns!' })
    }
    if (session.overall_score && session.overall_score >= 80) {
      insights.push({ type: 'success', text: 'Excellent overall performance!' })
    }
    
    return insights
  }

  const calculateStats = () => {
    if (sessions.length === 0) return { avgScore: 0, totalEarnings: 0, sessionsCount: 0 }
    
    const scores = sessions
      .filter(s => s.overall_score !== null)
      .map(s => s.overall_score as number)
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
      
    const totalEarnings = sessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0)
    
    return {
      avgScore,
      totalEarnings,
      sessionsCount: sessions.length
    }
  }

  const stats = calculateStats()

  // Show sign-in prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 text-center shadow-2xl">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Sign In Required</h2>
            <p className="text-slate-400">
              You need to be signed in to view your training sessions
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg transition-all"
            >
              Create Account
            </Link>
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-slate-300 mt-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">Your Training Sessions</h1>
          <p className="text-xl text-slate-400 drop-shadow-md">Review your past sessions and track your improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Average Score</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
            <p className="text-sm text-slate-400 mt-1">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Earnings</h3>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">Virtual cash earned</p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Sessions</h3>
              <Calendar className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.sessionsCount}</p>
            <p className="text-sm text-slate-400 mt-1">Completed this {filter}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilter(period)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                filter === period
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'Past Week' : period === 'month' ? 'Past Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 text-center border border-slate-700 shadow-xl">
              <p className="text-white/70">No sessions found for this period</p>
              <Link
                href="/trainer/select-homeowner"
                className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
              >
                Start Training
                <ChevronRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ) : (
            sessions.map((session) => {
              const insights = getKeyInsights(session)
              
              return (
                <div
                  key={session.id}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-colors shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {session.agent_name || 'Training Session'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : 'N/A'}
                        </span>
                        {session.virtual_earnings !== null && session.virtual_earnings > 0 && (
                          <span className="flex items-center text-green-500">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${session.virtual_earnings.toFixed(2)} earned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-400">Overall Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                          {session.overall_score || '--'}%
                        </p>
                        <p className={`text-xs ${getScoreColor(session.overall_score)}`}>
                          {getScoreLabel(session.overall_score)}
                        </p>
                      </div>
                      
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all border border-purple-500/20"
                      >
                        View Details
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Rapport</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.rapport_score)}`}>
                        {session.rapport_score || '--'}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Objection Handling</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.objection_handling_score)}`}>
                        {session.objection_handling_score || '--'}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Safety</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.safety_score ?? null)}`}>
                        {(session.safety_score ?? '--') as any}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Closing</p>
                      <p className={`text-lg font-semibold ${getScoreColor((session.close_effectiveness_score ?? (session as any).close_score ?? null))}`}>
                        {(session.close_effectiveness_score ?? (session as any).close_score ?? '--') as any}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Key Insights */}
                  {insights.length > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Key Insights</h4>
                      <div className="space-y-2">
                        {insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start space-x-2 text-sm ${
                              insight.type === 'success' ? 'text-green-400' : 'text-yellow-400'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

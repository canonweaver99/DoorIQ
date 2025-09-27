'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { Calendar, Clock, TrendingUp, AlertCircle, ChevronRight, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

type Session = Database['public']['Tables']['training_sessions']['Row'] & {
  users: {
    full_name: string
    email: string
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    let query = supabase
      .from('training_sessions')
      .select(`
        *,
        users!inner(full_name, email)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply date filter
    if (filter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    } else if (filter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      query = query.gte('created_at', monthAgo.toISOString())
    }

    const { data, error } = await query

    if (!error && data) {
      setSessions(data as Session[])
    }
    setLoading(false)
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
    if (session.close_effectiveness_score && session.close_effectiveness_score < 70) {
      insights.push({ type: 'warning', text: 'Focus on closing techniques and asking for the sale' })
    }
    
    // Check for high scores
    if (session.safety_score && session.safety_score >= 80) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Training Sessions</h1>
          <p className="text-slate-400">Review your past sessions and track your improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Average Score</h3>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
            <p className="text-sm text-slate-400 mt-1">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Earnings</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">Virtual cash earned</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Sessions</h3>
              <Calendar className="w-5 h-5 text-indigo-500" />
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
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {period === 'week' ? 'Past Week' : period === 'month' ? 'Past Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 text-center border border-slate-700">
              <p className="text-slate-400">No sessions found for this period</p>
              <Link
                href="/trainer"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Training Session
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
                        href={`/trainer/analytics/${session.id}`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
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
                      <p className={`text-lg font-semibold ${getScoreColor(session.safety_score)}`}>
                        {session.safety_score || '--'}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Closing</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.close_effectiveness_score)}`}>
                        {session.close_effectiveness_score || '--'}%
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

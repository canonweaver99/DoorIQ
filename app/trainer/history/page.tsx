'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, Clock, Trophy, Play, FileText, Filter,
  TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'

interface Session {
  id: string
  started_at: string
  ended_at: string
  duration_seconds: number
  overall_score: number
  scenario_type: string
}

export default function SessionHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [filter, setFilter] = useState({
    dateRange: 'all',
    scoreRange: 'all',
    scenario: 'all'
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const router = useRouter()
  const supabase = createClient()
  const itemsPerPage = 10

  useEffect(() => {
    fetchSessions()
  }, [page, filter])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }
      
      setIsAuthenticated(true)

      let query = supabase
        .from('training_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

      // Apply filters
      if (filter.dateRange === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('started_at', weekAgo.toISOString())
      } else if (filter.dateRange === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('started_at', monthAgo.toISOString())
      }

      if (filter.scoreRange === 'high') {
        query = query.gte('overall_score', 80)
      } else if (filter.scoreRange === 'medium') {
        query = query.gte('overall_score', 60).lt('overall_score', 80)
      } else if (filter.scoreRange === 'low') {
        query = query.lt('overall_score', 60)
      }

      if (filter.scenario !== 'all') {
        query = query.eq('scenario_type', filter.scenario)
      }

      // Pagination
      const start = (page - 1) * itemsPerPage
      const end = start + itemsPerPage - 1
      query = query.range(start, end)

      const { data, error, count } = await query

      if (error) throw error

      setSessions(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const calculateAverageScore = () => {
    if (sessions.length === 0) return 0
    const total = sessions.reduce((sum, session) => sum + (session.overall_score || 0), 0)
    return Math.round(total / sessions.length)
  }

  const calculateImprovementTrend = () => {
    if (sessions.length < 2) return 0
    const recent = sessions.slice(0, 5).reduce((sum, s) => sum + (s.overall_score || 0), 0) / Math.min(5, sessions.length)
    const older = sessions.slice(-5).reduce((sum, s) => sum + (s.overall_score || 0), 0) / Math.min(5, sessions.length)
    return Math.round(recent - older)
  }

  // Show sign-in prompt if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
            <p className="text-slate-400">
              You need to be signed in to view your training history
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-400 hover:text-slate-300 mt-2"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/trainer')}
            className="flex items-center text-slate-400 hover:text-slate-100 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Training
          </button>
          <h1 className="text-3xl font-bold text-slate-100">Session History</h1>
          <p className="text-slate-300 mt-2">Track your progress over time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Sessions</span>
              <Trophy className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{sessions.length}</p>
          </div>
          
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Average Score</span>
              <Trophy className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{calculateAverageScore()}%</p>
          </div>
          
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Practice Time</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60)} min
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm">Improvement</span>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <p className={`text-2xl font-bold ${calculateImprovementTrend() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {calculateImprovementTrend() > 0 ? '+' : ''}{calculateImprovementTrend()}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-4 mb-6 border border-slate-700">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-400" />
            
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>
            
            <select
              value={filter.scoreRange}
              onChange={(e) => setFilter({ ...filter, scoreRange: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scores</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (60-79)</option>
              <option value="low">Low (&lt;60)</option>
            </select>
            
            <select
              value={filter.scenario}
              onChange={(e) => setFilter({ ...filter, scenario: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scenarios</option>
              <option value="standard">Standard</option>
              <option value="difficult">Difficult</option>
              <option value="price_sensitive">Price Sensitive</option>
            </select>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No sessions found</p>
              <button
                onClick={() => router.push('/trainer')}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Start your first session
              </button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Scenario
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {format(new Date(session.started_at), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-slate-400">
                            {format(new Date(session.started_at), 'h:mm a')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-100">
                          <Clock className="w-4 h-4 mr-1 text-slate-400" />
                          {formatDuration(session.duration_seconds || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(session.overall_score || 0)}`}>
                          {session.overall_score || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                        {session.scenario_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/trainer/analytics/${session.id}`)}
                            className="text-blue-400 hover:text-blue-300"
                            title="View Analytics"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <button
                            className="text-slate-400 hover:text-slate-300"
                            title="Play Recording"
                            disabled
                          >
                            <Play className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

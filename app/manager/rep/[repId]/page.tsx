'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, TrendingUp, Calendar, Target, Award, BarChart3, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface RepProfile {
  id: string
  full_name: string
  email: string
  role: string
  virtual_earnings: number
  created_at: string
  rep_id: string
  avatar_url?: string
}

interface SessionData {
  id: string
  overall_score: number
  virtual_earnings: number
  created_at: string
  agent_name: string
  duration_seconds: number
  sale_closed: boolean
}

interface RepStats {
  totalSessions: number
  averageScore: number
  totalEarnings: number
  bestScore: number
  recentTrend: number
  activeDays: number
  totalCallTime: number
}

export default function RepProfilePage({ params }: { params: { repId: string } }) {
  const [rep, setRep] = useState<RepProfile | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [stats, setStats] = useState<RepStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const supabase = createClient()

  useEffect(() => {
    loadRepData()
  }, [params.repId])

  const loadRepData = async () => {
    if (!supabase) return
    
    try {
      // Use API endpoint for secure, server-side verification
      const response = await fetch(`/api/manager/rep/${params.repId}`)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        
        if (response.status === 403) {
          // Access denied - redirect to manager panel
          window.location.href = '/manager?error=access_denied'
          return
        } else if (response.status === 404) {
          // Rep not found
          console.error('Rep not found')
          return
        }
        throw new Error(error.error || 'Failed to load rep data')
      }

      const data = await response.json()
      
      setRep(data.rep)
      setSessions(data.sessions || [])
      setStats(data.stats)

    } catch (error) {
      console.error('Error loading rep data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (!score || isNaN(score)) return 'text-slate-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!rep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Rep Not Found</h1>
          <Link 
            href="/manager"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Manager Panel
          </Link>
        </div>
      </div>
    )
  }

  // Prepare chart data for recent sessions
  const chartData = sessions && sessions.length > 0 
    ? sessions.slice(0, 10).reverse().map((session, index) => ({
        session: `#${sessions.length - index}`,
        score: session.overall_score || 0,
        earnings: session.virtual_earnings || 0,
        date: new Date(session.created_at).toLocaleDateString()
      }))
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/manager"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Manager Panel
            </Link>
          </div>
        </div>

        {/* Rep Profile Header - READ-ONLY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {rep.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{rep.full_name || 'Unknown Rep'}</h1>
                <p className="text-slate-400">{rep.email || 'No email'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                    <User className="w-4 h-4" />
                    {rep.role || 'rep'}
                  </span>
                  {rep.rep_id && (
                    <span className="text-sm text-slate-400">
                      Rep ID: {rep.rep_id}
                    </span>
                  )}
                  {rep.created_at && (
                    <span className="text-sm text-slate-400">
                      Joined {new Date(rep.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
              {/* View-only badge */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-blue-300">Manager View</p>
              </div>
              <p className="text-xs text-slate-400">View-only dashboard • No editing permissions</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <DollarSign className="w-8 h-8 text-green-400 mb-3" />
              <p className="text-2xl font-bold text-white">${(stats.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-sm text-slate-400">Total Earnings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Target className="w-8 h-8 text-purple-400 mb-3" />
              <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore || 0)}`}>
                {stats.averageScore || 0}%
              </p>
              <p className="text-sm text-slate-400">Average Score</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Award className="w-8 h-8 text-yellow-400 mb-3" />
              <p className={`text-2xl font-bold ${getScoreColor(stats.bestScore || 0)}`}>
                {stats.bestScore || 0}%
              </p>
              <p className="text-sm text-slate-400">Best Score</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Calendar className="w-8 h-8 text-blue-400 mb-3" />
              <p className="text-2xl font-bold text-white">{stats.totalSessions || 0}</p>
              <p className="text-sm text-slate-400">Total Sessions</p>
            </motion.div>
          </div>
        )}

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Recent Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="session" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e1e30',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recent Sessions - READ-ONLY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
            <div className="text-xs text-slate-400 px-3 py-1 bg-slate-700/50 rounded-lg">
              View-only • {sessions.length} total sessions
            </div>
          </div>
          
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session, index) => (
                <Link
                  key={session.id}
                  href={`/analytics/${session.id}`}
                  className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                          {session.agent_name || `Session ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(session.created_at).toLocaleDateString()} • {formatDuration(session.duration_seconds || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getScoreColor(session.overall_score || 0)}`}>
                          {session.overall_score || 0}%
                        </p>
                        {session.sale_closed && (
                          <p className="text-xs text-green-400">✓ Sale Closed</p>
                        )}
                      </div>
                      {session.virtual_earnings && session.virtual_earnings > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-400">
                            +${session.virtual_earnings.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No sessions yet</p>
              <p className="text-xs text-slate-500 mt-1">This rep hasn't completed any training sessions</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
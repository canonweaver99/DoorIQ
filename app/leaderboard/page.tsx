'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award } from 'lucide-react'

type LeaderboardUser = Database['public']['Tables']['users']['Row'] & {
  rank: number
  previousRank?: number
  sessionsCount: number
  avgScore: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setCurrentUserId(user.id)
    }

    // Fetch all users with their earnings
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'rep')
      .order('virtual_earnings', { ascending: false })

    if (error || !users) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
      return
    }

    const usersList = (users ?? []) as any[]

    // Fetch session stats for each user
    const leaderboardData = await Promise.all(
      usersList.map(async (u: any, index: number) => {
        let sessionsQuery = supabase
          .from('live_sessions')
          .select('overall_score')
          .eq('user_id', u.id as string)
          .not('overall_score', 'is', null)

        // Apply timeframe filter
        if (timeframe === 'week') {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          sessionsQuery = sessionsQuery.gte('created_at', weekAgo.toISOString())
        } else if (timeframe === 'month') {
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          sessionsQuery = sessionsQuery.gte('created_at', monthAgo.toISOString())
        }

        const { data: sessions } = await sessionsQuery

        const sessionRows = (sessions ?? []) as { overall_score: number | null }[]
        const sessionsCount = sessionRows.length || 0
        const avgScore = sessionsCount > 0
          ? Math.round(
              sessionRows.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / sessionsCount
            )
          : 0

        return {
          ...(u as any),
          rank: index + 1,
          sessionsCount,
          avgScore
        } as LeaderboardUser
      })
    )

    setLeaderboard(leaderboardData as LeaderboardUser[])
    setLoading(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">
            {rank}
          </div>
        )
    }
  }

  const getRankChange = (user: LeaderboardUser) => {
    // For now, we'll just show static indicators
    // In a real app, you'd compare with previous period's rankings
    if (user.rank <= 3) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (user.rank > 5) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-slate-500" />
  }

  const getRowStyles = (rank: number, userId: string) => {
    if (userId === currentUserId) {
      return 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50'
    }
    if (rank === 1) {
      return 'bg-yellow-600/10 border-yellow-600/30'
    }
    if (rank === 2) {
      return 'bg-slate-600/10 border-slate-600/30'
    }
    if (rank === 3) {
      return 'bg-orange-600/10 border-orange-600/30'
    }
    return 'bg-slate-800/50 border-slate-700'
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
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">Leaderboard</h1>
          <p className="text-xl text-slate-400 drop-shadow-md">See how you rank against your team</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center space-x-4 mb-12">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                timeframe === period
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            {/* 2nd Place */}
            <div className="order-1 md:order-1">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-slate-600 text-center transform translate-y-8 shadow-2xl">
                <Medal className="w-12 h-12 text-slate-400 mx-auto mb-3 drop-shadow-lg" />
                <h3 className="font-bold text-white mb-1 drop-shadow">{leaderboard[1].full_name}</h3>
                <p className="text-2xl font-bold text-slate-300 mb-1 drop-shadow">
                  ${leaderboard[1].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-sm text-slate-400 drop-shadow">2nd Place</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-2 md:order-2">
              <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 backdrop-blur-xl rounded-2xl p-6 border-2 border-yellow-500/70 text-center transform scale-110 shadow-2xl shadow-yellow-500/20">
                <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-3 drop-shadow-lg" />
                <h3 className="font-bold text-white text-lg mb-1 drop-shadow">{leaderboard[0].full_name}</h3>
                <p className="text-3xl font-bold text-yellow-400 mb-1 drop-shadow-lg">
                  ${leaderboard[0].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-sm text-yellow-400 drop-shadow">1st Place</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 md:order-3">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border-2 border-orange-600/70 text-center transform translate-y-8 shadow-2xl shadow-orange-600/10">
                <Award className="w-12 h-12 text-orange-500 mx-auto mb-3 drop-shadow-lg" />
                <h3 className="font-bold text-white mb-1 drop-shadow">{leaderboard[2].full_name}</h3>
                <p className="text-2xl font-bold text-orange-400 mb-1 drop-shadow">
                  ${leaderboard[2].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-sm text-orange-400 drop-shadow">3rd Place</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {leaderboard.map((user) => (
                  <tr
                    key={user.id}
                    className={`${getRowStyles(user.rank, user.id)} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.full_name}
                          {user.id === currentUserId && (
                            <span className="ml-2 text-xs text-purple-400">(You)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-400">
                        ${user.virtual_earnings.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{user.sessionsCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {user.avgScore > 0 ? `${user.avgScore}%` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRankChange(user)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-8 py-6 shadow-xl">
            <p className="text-white/80 drop-shadow">
              Keep practicing to climb the ranks and earn more virtual cash! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

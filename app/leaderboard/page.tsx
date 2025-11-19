'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, RefreshCw } from 'lucide-react'

type LeaderboardUser = Database['public']['Tables']['users']['Row'] & {
  rank: number
  previousRank?: number
  sessionsCount: number
  avgScore: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    fetchLeaderboard()
    
    // Set up real-time subscription to listen for changes in users table
    const supabase = supabaseRef.current
    let channel: any = null
    let handleVisibilityChange: (() => void) | null = null
    
    // Get user's team_id for filtering real-time updates
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single()
      
      const userTeamId = userProfile?.team_id
      
      if (!userTeamId) return
      
      // Listen for changes to users - we'll filter by team in the callback
      channel = supabase
        .channel('leaderboard-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: 'role=eq.rep'
          },
          (payload) => {
            // Only refresh if the updated user is in the same team
            const updatedUser = payload.new as any
            if (updatedUser?.team_id === userTeamId) {
              console.log('💰 Team member earnings updated:', payload)
              fetchLeaderboard(true)
            }
          }
        )
        .subscribe()

      // Refresh when page gains focus (user returns to tab)
      handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('👀 Page visible again, refreshing leaderboard...')
          fetchLeaderboard(true)
        }
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
      if (handleVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [timeframe])

  const fetchLeaderboard = async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setCurrentUserId(user.id)
    }

    // Get current user's team_id
    let userTeamId: string | null = null
    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single()
      
      userTeamId = userProfile?.team_id || null
    }

    // Build query - filter by team if user has a team
    let usersQuery = supabase
      .from('users')
      .select('*')
      .eq('role', 'rep')
      .order('virtual_earnings', { ascending: false })

    // Only show users from the same team
    if (userTeamId) {
      usersQuery = usersQuery.eq('team_id', userTeamId)
    } else {
      // If user has no team, show empty leaderboard
      setLeaderboard([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const { data: users, error } = await usersQuery

    if (error || !users) {
      console.error('Error fetching leaderboard:', error)
      setLoading(false)
      setRefreshing(false)
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
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }

  const handleManualRefresh = () => {
    fetchLeaderboard(true)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-slate-400" />
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center text-slate-400 text-xs font-bold">
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
      return 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/50'
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-4 pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow-lg font-space">Leaderboard</h1>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 disabled:opacity-50 shadow-lg hover:scale-105 disabled:hover:scale-100"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-base text-slate-400 drop-shadow-md font-sans">See how you rank against your team</p>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Last updated: {lastUpdated.toLocaleTimeString()}
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs">Live</span>
            </span>
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center space-x-2 mb-4">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                timeframe === period
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-4 max-w-3xl mx-auto">
            {/* 2nd Place */}
            <div className="order-1 md:order-1">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-3 border-2 border-slate-600 text-center transform translate-y-4 shadow-2xl">
                <Medal className="w-8 h-8 text-slate-400 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-xs font-bold text-white mb-0.5 drop-shadow truncate font-space">{leaderboard[1].full_name}</h3>
                <p className="text-lg font-bold text-slate-300 mb-0.5 drop-shadow">
                  ${leaderboard[1].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400 drop-shadow">2nd Place</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-2 md:order-2">
              <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 backdrop-blur-xl rounded-xl p-3 border-2 border-yellow-500/70 text-center transform scale-105 shadow-2xl shadow-yellow-500/20">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-sm font-bold text-white mb-0.5 drop-shadow truncate">{leaderboard[0].full_name}</h3>
                <p className="text-xl font-bold text-yellow-400 mb-0.5 drop-shadow-lg">
                  ${leaderboard[0].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-[10px] text-yellow-400 drop-shadow">1st Place</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 md:order-3">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-3 border-2 border-orange-600/70 text-center transform translate-y-4 shadow-2xl shadow-orange-600/10">
                <Award className="w-8 h-8 text-orange-500 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-xs font-bold text-white mb-0.5 drop-shadow truncate">{leaderboard[2].full_name}</h3>
                <p className="text-lg font-bold text-orange-400 mb-0.5 drop-shadow">
                  ${leaderboard[2].virtual_earnings.toFixed(2)}
                </p>
                <p className="text-[10px] text-orange-400 drop-shadow">3rd Place</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/70">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase tracking-wider">
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
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-white">
                          {user.full_name}
                          {user.id === currentUserId && (
                            <span className="ml-1 text-[10px] text-purple-400">(You)</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-400">
                        ${user.virtual_earnings.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-slate-300">{user.sessionsCount}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-slate-300">
                        {user.avgScore > 0 ? `${user.avgScore}%` : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {getRankChange(user)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-4 text-center">
          <div className="inline-block bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl">
            <p className="text-sm text-white/80 drop-shadow">
              Keep practicing to climb the ranks and earn more virtual cash! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

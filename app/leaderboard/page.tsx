'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, RefreshCw, ArrowRight, User, DollarSign, Target, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type LeaderboardUser = Database['public']['Tables']['users']['Row'] & {
  rank: number
  previousRank?: number
  sessionsCount: number
  avgScore: number
}

// NOTE: These fake data functions are ONLY for potential future demo/marketing pages.
// They are NEVER used for authenticated users - real users always see their actual data from the database.
// Fake data for guest/demo purposes (unused in production for authenticated users)
const generateFakeLeaderboardData = (): LeaderboardUser[] => {
  const fakeUsers = [
    { name: 'Sarah Martinez', email: 'sarah.martinez@example.com', earnings: 12450.75, sessions: 47, avgScore: 92, previousRank: 2, avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Michael Chen', email: 'michael.chen@example.com', earnings: 11890.50, sessions: 43, avgScore: 89, previousRank: 1, avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Emily Johnson', email: 'emily.johnson@example.com', earnings: 11230.25, sessions: 41, avgScore: 87, previousRank: 3, avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'David Rodriguez', email: 'david.rodriguez@example.com', earnings: 10560.00, sessions: 38, avgScore: 85, previousRank: 4, avatar: 'https://i.pravatar.cc/150?img=13' },
    { name: 'Jessica Williams', email: 'jessica.williams@example.com', earnings: 9870.50, sessions: 35, avgScore: 83, previousRank: 7, avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'James Anderson', email: 'james.anderson@example.com', earnings: 9230.75, sessions: 33, avgScore: 81, previousRank: 6, avatar: 'https://i.pravatar.cc/150?img=14' },
    { name: 'Amanda Taylor', email: 'amanda.taylor@example.com', earnings: 8650.25, sessions: 31, avgScore: 79, previousRank: 5, avatar: 'https://i.pravatar.cc/150?img=10' },
    { name: 'Robert Brown', email: 'robert.brown@example.com', earnings: 8120.00, sessions: 29, avgScore: 77, previousRank: 8, avatar: 'https://i.pravatar.cc/150?img=15' },
    { name: 'Lisa Garcia', email: 'lisa.garcia@example.com', earnings: 7650.50, sessions: 27, avgScore: 75, previousRank: 9, avatar: 'https://i.pravatar.cc/150?img=11' },
    { name: 'Christopher Lee', email: 'christopher.lee@example.com', earnings: 7230.25, sessions: 26, avgScore: 73, previousRank: 10, avatar: 'https://i.pravatar.cc/150?img=16' },
    { name: 'Michelle White', email: 'michelle.white@example.com', earnings: 6850.00, sessions: 24, avgScore: 71, previousRank: 12, avatar: 'https://i.pravatar.cc/150?img=20' },
    { name: 'Daniel Harris', email: 'daniel.harris@example.com', earnings: 6520.75, sessions: 23, avgScore: 69, previousRank: 11, avatar: 'https://i.pravatar.cc/150?img=17' },
  ]

  return fakeUsers.map((user, index) => ({
    id: `fake-user-${index + 1}`,
    full_name: user.name,
    email: user.email,
    virtual_earnings: user.earnings,
    rank: index + 1,
    sessionsCount: user.sessions,
    avgScore: user.avgScore,
    role: 'rep' as const,
    rep_id: `REP-${String(index + 1).padStart(6, '0')}`,
    team_id: 'demo-team',
    organization_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    previousRank: user.previousRank,
    avatar_url: user.avatar,
  } as LeaderboardUser & { previousRank?: number }))
}

const generateFakePreviousLeaderboard = (): LeaderboardUser[] => {
  const fakeUsers = [
    { name: 'Sarah Martinez', email: 'sarah.martinez@example.com', earnings: 12450.75, sessions: 47, avgScore: 92, rank: 2, avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Michael Chen', email: 'michael.chen@example.com', earnings: 11890.50, sessions: 43, avgScore: 89, rank: 1, avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Emily Johnson', email: 'emily.johnson@example.com', earnings: 11230.25, sessions: 41, avgScore: 87, rank: 3, avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'David Rodriguez', email: 'david.rodriguez@example.com', earnings: 10560.00, sessions: 38, avgScore: 85, rank: 4, avatar: 'https://i.pravatar.cc/150?img=13' },
    { name: 'Jessica Williams', email: 'jessica.williams@example.com', earnings: 9870.50, sessions: 35, avgScore: 83, rank: 7, avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'James Anderson', email: 'james.anderson@example.com', earnings: 9230.75, sessions: 33, avgScore: 81, rank: 6, avatar: 'https://i.pravatar.cc/150?img=14' },
    { name: 'Amanda Taylor', email: 'amanda.taylor@example.com', earnings: 8650.25, sessions: 31, avgScore: 79, rank: 5, avatar: 'https://i.pravatar.cc/150?img=10' },
    { name: 'Robert Brown', email: 'robert.brown@example.com', earnings: 8120.00, sessions: 29, avgScore: 77, rank: 8, avatar: 'https://i.pravatar.cc/150?img=15' },
    { name: 'Lisa Garcia', email: 'lisa.garcia@example.com', earnings: 7650.50, sessions: 27, avgScore: 75, rank: 9, avatar: 'https://i.pravatar.cc/150?img=11' },
    { name: 'Christopher Lee', email: 'christopher.lee@example.com', earnings: 7230.25, sessions: 26, avgScore: 73, rank: 10, avatar: 'https://i.pravatar.cc/150?img=16' },
    { name: 'Michelle White', email: 'michelle.white@example.com', earnings: 6850.00, sessions: 24, avgScore: 71, rank: 12, avatar: 'https://i.pravatar.cc/150?img=20' },
    { name: 'Daniel Harris', email: 'daniel.harris@example.com', earnings: 6520.75, sessions: 23, avgScore: 69, rank: 11, avatar: 'https://i.pravatar.cc/150?img=17' },
  ]

  return fakeUsers.map((user, index) => ({
    id: `fake-user-${index + 1}`,
    full_name: user.name,
    email: user.email,
    virtual_earnings: user.earnings,
    rank: user.rank,
    sessionsCount: user.sessions,
    avgScore: user.avgScore,
    role: 'rep' as const,
    rep_id: `REP-${String(index + 1).padStart(6, '0')}`,
    team_id: 'demo-team',
    organization_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: user.avatar,
  } as LeaderboardUser))
}

type Category = 'earnings' | 'sessions' | 'avgScore' | 'overall'

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [category, setCategory] = useState<Category>('earnings')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [userRole, setUserRole] = useState<string>('')
  const [previousLeaderboard, setPreviousLeaderboard] = useState<LeaderboardUser[]>([])
  const leaderboardRef = useRef<LeaderboardUser[]>([])
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    fetchLeaderboard()
    
    // Set up real-time subscription to listen for changes in users table
    const supabase = supabaseRef.current
    let channel: any = null
    let handleVisibilityChange: (() => void) | null = null
    
    // Get user's team_id for filtering real-time updates
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: any } }) => {
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
          (payload: any) => {
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
    
    // For guest/demo: set a fake current user ID to highlight in the leaderboard
    if (!user) {
      setCurrentUserId('fake-user-5') // Highlight 5th place user as "current user" for demo
    } else {
      setCurrentUserId(user.id)
    }

    // Get current user's team_id, role, and organization_id
    let userTeamId: string | null = null
    let userOrgId: string | null = null
    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('team_id, organization_id, role')
        .eq('id', user.id)
        .single()
      
      userTeamId = userProfile?.team_id || null
      userOrgId = userProfile?.organization_id || null
      setUserRole(userProfile?.role || '')
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
      // Real user without team - show empty state (no fake data)
      setPreviousLeaderboard([])
      setLeaderboard([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const { data: users, error } = await usersQuery

    if (error) {
      console.error('Error fetching leaderboard:', error)
      // Database error - show empty state, don't show fake data
      setPreviousLeaderboard([])
      setLeaderboard([])
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
      return
    }

    if (!users || users.length === 0) {
      // No users found - show empty state (real data, just empty)
      setPreviousLeaderboard([])
      setLeaderboard([])
      setLastUpdated(new Date())
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

    // Sort by selected category
    const sortedData = [...leaderboardData].sort((a, b) => {
      switch (category) {
        case 'earnings':
          return (b.virtual_earnings || 0) - (a.virtual_earnings || 0)
        case 'sessions':
          return b.sessionsCount - a.sessionsCount
        case 'avgScore':
          return b.avgScore - a.avgScore
        case 'overall':
          return (b.avgScore || 0) - (a.avgScore || 0)
        default:
          return (b.virtual_earnings || 0) - (a.virtual_earnings || 0)
      }
    })

    // Update ranks based on sorted order
    const rankedData = sortedData.map((user, index) => ({
      ...user,
      rank: index + 1
    }))

    // Store previous leaderboard before updating
    setPreviousLeaderboard([...leaderboardRef.current])
    
    // Update ref and state
    leaderboardRef.current = rankedData as LeaderboardUser[]
    setLeaderboard(rankedData as LeaderboardUser[])
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }

  // Re-sort when category changes
  useEffect(() => {
    if (leaderboardRef.current.length > 0) {
      const sortedData = [...leaderboardRef.current].sort((a, b) => {
        switch (category) {
          case 'earnings':
            return (b.virtual_earnings || 0) - (a.virtual_earnings || 0)
          case 'sessions':
            return b.sessionsCount - a.sessionsCount
          case 'avgScore':
            return b.avgScore - a.avgScore
          case 'overall':
            return (b.avgScore || 0) - (a.avgScore || 0)
          default:
            return (b.virtual_earnings || 0) - (a.virtual_earnings || 0)
        }
      })

      const rankedData = sortedData.map((user, index) => ({
        ...user,
        rank: index + 1
      }))

      leaderboardRef.current = rankedData as LeaderboardUser[]
      setLeaderboard(rankedData)
    }
  }, [category])

  const handleManualRefresh = () => {
    fetchLeaderboard(true)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-7 h-7 text-yellow-500" />
      case 2:
        return <Medal className="w-7 h-7 text-slate-400" />
      case 3:
        return <Award className="w-7 h-7 text-orange-600" />
      default:
        return (
          <div className="w-7 h-7 flex items-center justify-center text-slate-300 text-xl font-space font-bold">
            {rank}
          </div>
        )
    }
  }

  const getRankChange = (user: LeaderboardUser) => {
    // Calculate rank change by comparing with previous leaderboard
    const previousUser = previousLeaderboard.find(u => u.id === user.id)
    if (!previousUser) {
      // New user or no previous data - show neutral
      return (
        <div className="flex items-center justify-center gap-1">
          <Minus className="w-6 h-6 text-slate-500" />
          <span className="text-lg font-bold text-slate-500 font-space">-</span>
        </div>
      )
    }
    
    const rankChange = previousUser.rank - user.rank // Positive means moved up, negative means moved down
    
    if (rankChange > 0) {
      // Moved up
      return (
        <div className="flex items-center gap-1">
          <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0" />
          <span className="text-lg font-bold text-green-500 font-space ml-1">{rankChange}</span>
        </div>
      )
    } else if (rankChange < 0) {
      // Moved down
      return (
        <div className="flex items-center">
          <TrendingDown className="w-6 h-6 text-red-500 flex-shrink-0" />
          <span className="text-lg font-bold text-red-500 font-space ml-1">{Math.abs(rankChange)}</span>
        </div>
      )
    } else {
      // No change
      return (
        <div className="flex items-center gap-1">
          <Minus className="w-6 h-6 text-slate-500" />
          <span className="text-lg font-bold text-slate-500 font-space">-</span>
        </div>
      )
    }
  }

  const getRowStyles = (rank: number, userId: string) => {
    if (userId === currentUserId) {
      return 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/50'
    }
    if (rank === 1) {
      return 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border-yellow-500/50'
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 border-gray-400/50'
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-amber-700/20 to-orange-800/20 border-amber-600/50'
    }
    return 'bg-black border-slate-800'
  }

  const getCategoryValue = (user: LeaderboardUser) => {
    switch (category) {
      case 'earnings':
        return `$${Math.round(user.virtual_earnings || 0).toLocaleString()}`
      case 'sessions':
        return user.sessionsCount.toString()
      case 'avgScore':
        return user.avgScore > 0 ? `${user.avgScore}%` : '-'
      default:
        return `$${Math.round(user.virtual_earnings || 0).toLocaleString()}`
    }
  }

  const getCategoryLabel = () => {
    switch (category) {
      case 'earnings':
        return 'Earnings'
      case 'sessions':
        return 'Sessions'
      case 'avgScore':
        return 'Avg Score'
      default:
        return 'Earnings'
    }
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
            <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-bold leading-[1.3] uppercase">
              Leaderboard
            </h1>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 disabled:opacity-50 shadow-lg hover:scale-105 disabled:hover:scale-100"
              title="Refresh leaderboard"
            >
              <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-lg md:text-xl font-bold text-slate-300 drop-shadow-md font-space">See how you rank against your team</p>
          <p className="text-sm md:text-base font-semibold text-slate-400 mt-2 font-space">
            Last updated: {lastUpdated.toLocaleTimeString()}
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm md:text-base font-semibold">Live</span>
            </span>
          </p>
        </div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide md:justify-center">
            {[
              { id: 'earnings' as Category, label: 'Earnings', icon: DollarSign },
              { id: 'sessions' as Category, label: 'Sessions', icon: Target },
              { id: 'avgScore' as Category, label: 'Avg Score', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = category === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-space font-semibold text-sm sm:text-base
                    whitespace-nowrap transition-all duration-200
                    ${isActive
                      ? 'bg-white/10 text-white border-2 border-white/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 md:gap-6 mb-6 max-w-4xl mx-auto"
          >
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="order-1 md:order-1"
            >
              <div className="bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-xl rounded-xl p-3 border-2 border-gray-400/70 text-center transform translate-y-4 shadow-2xl shadow-gray-400/20">
                <Medal className="w-8 h-8 text-gray-300 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-sm font-bold text-white mb-0.5 drop-shadow truncate font-space">{leaderboard[1].full_name}</h3>
                <p className="text-lg font-bold text-gray-200 mb-0.5 drop-shadow font-space">
                  {getCategoryValue(leaderboard[1])}
                </p>
                <p className="text-sm text-gray-300 drop-shadow font-space font-bold">2nd Place</p>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="order-2 md:order-2"
            >
              <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 backdrop-blur-xl rounded-xl p-3 border-2 border-yellow-500/70 text-center transform scale-105 shadow-2xl shadow-yellow-500/20">
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-base font-bold text-white mb-0.5 drop-shadow truncate font-space">{leaderboard[0].full_name}</h3>
                <p className="text-xl font-bold text-yellow-400 mb-0.5 drop-shadow-lg font-space">
                  {getCategoryValue(leaderboard[0])}
                </p>
                <p className="text-base text-yellow-400 drop-shadow font-space font-bold">1st Place</p>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="order-3 md:order-3"
            >
              <div className="bg-gradient-to-br from-amber-700/30 to-orange-800/30 backdrop-blur-xl rounded-xl p-3 border-2 border-amber-600/70 text-center transform translate-y-4 shadow-2xl shadow-amber-600/20">
                <Award className="w-8 h-8 text-amber-500 mx-auto mb-2 drop-shadow-lg" />
                <h3 className="text-sm font-bold text-white mb-0.5 drop-shadow truncate font-space">{leaderboard[2].full_name}</h3>
                <p className="text-lg font-bold text-amber-400 mb-0.5 drop-shadow font-space">
                  {getCategoryValue(leaderboard[2])}
                </p>
                <p className="text-sm text-amber-400 drop-shadow font-space font-bold">3rd Place</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Leaderboard - Mobile Cards / Desktop Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-700 overflow-hidden shadow-2xl"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-slate-950/70">
                <tr>
                  <th className="w-[10%] px-6 py-6 text-left text-base font-bold text-slate-300 uppercase tracking-wider font-space">
                    Rank
                  </th>
                  <th className="w-[25%] px-6 py-6 text-left text-base font-bold text-slate-300 uppercase tracking-wider font-space">
                    Sales Rep
                  </th>
                  <th className="w-[18%] px-6 py-6 text-left text-base font-bold uppercase tracking-wider font-space text-slate-300">
                    Earnings
                  </th>
                  <th className="w-[15.67%] pl-6 pr-6 py-6 text-left text-base font-bold uppercase tracking-wider font-space text-slate-300">
                    Sessions
                  </th>
                  <th className="w-[15.67%] pl-6 pr-6 py-6 text-left text-base font-bold uppercase tracking-wider font-space text-slate-300">
                    Avg Score
                  </th>
                  <th className="w-[15.66%] pl-6 pr-6 py-6 text-left text-base font-bold text-slate-300 uppercase tracking-wider font-space">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {leaderboard.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    className={`${getRowStyles(user.rank, user.id)} transition-all duration-300`}
                  >
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                            <img 
                              src={user.avatar_url} 
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-lg font-bold">
                                      ${user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  `
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="text-xl font-bold text-white font-space">
                            {user.full_name}
                            {user.id === currentUserId && (
                              <span className="ml-2 text-lg font-bold text-purple-400 font-space">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="text-2xl font-bold font-space text-green-400">
                        ${Math.round(user.virtual_earnings).toLocaleString()}
                      </div>
                    </td>
                    <td className="pl-6 pr-6 py-6 whitespace-nowrap text-left">
                      <div className="text-2xl font-bold font-space pl-5 text-slate-200">{user.sessionsCount}</div>
                    </td>
                    <td className="pl-6 pr-6 py-6 whitespace-nowrap text-left">
                      <div className="text-2xl font-bold font-space pl-5 text-slate-200">
                        {user.avgScore > 0 ? `${user.avgScore}%` : '-'}
                      </div>
                    </td>
                    <td className="pl-6 pr-6 py-6 whitespace-nowrap text-left">
                      <div className="flex items-center ml-3">
                        {getRankChange(user)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-700">
            {leaderboard.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                className={`p-4 ${getRowStyles(user.rank, user.id)} transition-all duration-300`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Rank and Avatar */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(user.rank)}
                    </div>
                    {user.avatar_url ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-lg font-bold">
                                  ${user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-white font-space truncate">
                        {user.full_name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-sm font-bold text-purple-400 font-space">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Category Value and Trend */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-xl font-bold font-space ${category === 'earnings' ? 'text-green-400' : category === 'sessions' ? 'text-blue-400' : 'text-purple-400'}`}>
                        {getCategoryValue(user)}
                      </div>
                      <div className="text-xs text-slate-400 font-space mt-0.5">{getCategoryLabel()}</div>
                    </div>
                    <div className="flex items-center">
                      {getRankChange(user)}
                    </div>
                  </div>
                </div>

                {/* Additional Stats Row */}
                <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-slate-300 font-space">${Math.round(user.virtual_earnings || 0).toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-space">Earnings</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-slate-300 font-space">{user.sessionsCount}</div>
                    <div className="text-xs text-slate-500 font-space">Sessions</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-slate-300 font-space">{user.avgScore > 0 ? `${user.avgScore}%` : '-'}</div>
                    <div className="text-xs text-slate-500 font-space">Avg Score</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Practice CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <div className="relative bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-purple-500/20 backdrop-blur-xl border-2 border-purple-500/30 rounded-xl p-6 md:p-8 shadow-xl overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-pulse" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 font-space">
                  Ready to Climb the Ranks? 🚀
                </h3>
                <p className="text-white/80 text-sm md:text-base font-sans">
                  Keep practicing to improve your skills and earn more virtual cash!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push('/trainer')}
                className="group flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-lg px-6 py-3 md:px-8 md:py-4 transition-all font-space text-sm md:text-base shadow-md shadow-purple-500/15"
              >
                Start Practice Session
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

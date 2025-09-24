'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Medal, Award, TrendingUp, Flame, Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface LeaderboardEntry {
  id: string
  full_name: string
  rep_id: string
  total_score: number
  sessions_count: number
  average_score: number
  best_score: number
  current_streak: number
  rank: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  earned_count: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboardData()
    fetchAchievements()
  }, [timeRange])

  const fetchLeaderboardData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch leaderboard data (this would be a custom RPC function in production)
      // For now, we'll simulate it
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          id: '1',
          full_name: 'Sarah Johnson',
          rep_id: 'REP-001',
          total_score: 4250,
          sessions_count: 52,
          average_score: 82,
          best_score: 95,
          current_streak: 7,
          rank: 1
        },
        {
          id: '2',
          full_name: 'Mike Chen',
          rep_id: 'REP-002',
          total_score: 4100,
          sessions_count: 48,
          average_score: 85,
          best_score: 92,
          current_streak: 5,
          rank: 2
        },
        {
          id: '3',
          full_name: 'Alex Rivera',
          rep_id: 'REP-003',
          total_score: 3950,
          sessions_count: 45,
          average_score: 88,
          best_score: 94,
          current_streak: 3,
          rank: 3
        },
      ]
      
      setLeaderboard(mockLeaderboard)
      
      // Find current user's rank
      const currentUserRank = mockLeaderboard.findIndex(entry => entry.id === user?.id) + 1
      setUserRank(currentUserRank || null)
      
      // Fetch user's personal stats
      if (user) {
        const { data: sessions } = await supabase
          .from('training_sessions')
          .select('overall_score')
          .eq('user_id', user.id)

        const safeSessions = (sessions as Array<{ overall_score: number | null }> | null) || []
        const scores = safeSessions.map(s => s.overall_score || 0)
        const totalScore = scores.reduce((sum, score) => sum + score, 0)
        const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0
        const bestScore = Math.max(...scores, 0)
        
        setUserStats({
          totalScore,
          avgScore,
          bestScore,
          sessionsCount: scores.length
        })
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAchievements = async () => {
    try {
      const { data } = await supabase
        .from('achievements')
        .select('id, name, description, icon, points, user_achievements(count)')

      const achievementsWithCount: Achievement[] = (data as any[] | null)?.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
        points: a.points,
        earned_count: a.user_achievements?.[0]?.count || 0,
      })) || []

      setAchievements(achievementsWithCount)
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />
      default:
        return <span className="text-gray-600 font-bold">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
      default:
        return 'bg-white hover:bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-2">Compete with your team and earn achievements</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-2 mb-6">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h2 className="text-2xl font-bold">Top Performers</h2>
                <p className="text-blue-100 mt-1">Based on total score and consistency</p>
              </div>
              
              {loading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-3">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${getRankColor(entry.rank)} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 flex justify-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{entry.full_name}</h3>
                            <p className="text-sm text-gray-500">{entry.rep_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-gray-900">{entry.total_score}</p>
                            <p className="text-gray-500">Points</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-gray-900">{entry.average_score}%</p>
                            <p className="text-gray-500">Avg Score</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center">
                              <Flame className="w-4 h-4 text-orange-500 mr-1" />
                              <p className="font-bold text-gray-900">{entry.current_streak}</p>
                            </div>
                            <p className="text-gray-500">Streak</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Stats */}
            {userStats && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Performance</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{userRank || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Your Rank</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{userStats.avgScore}%</p>
                    <p className="text-sm text-gray-600">Avg Score</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{userStats.bestScore}%</p>
                    <p className="text-sm text-gray-600">Best Score</p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <p className="text-2xl font-bold text-indigo-600">{userStats.sessionsCount}</p>
                    <p className="text-sm text-gray-600">Sessions</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h2 className="text-2xl font-bold">Achievements</h2>
                <p className="text-purple-100 mt-1">Unlock badges as you improve</p>
              </div>
              
              <div className="p-6 space-y-4">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {achievement.earned_count} earned
                          </span>
                          <span className="text-xs font-semibold text-purple-600">
                            +{achievement.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Daily Challenge */}
            <div className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center mb-3">
                <Star className="w-6 h-6 mr-2" />
                <h3 className="text-xl font-bold">Daily Challenge</h3>
              </div>
              <p className="font-medium mb-2">Speed Demon</p>
              <p className="text-sm text-orange-100">
                Complete a successful close in under 3 minutes
              </p>
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2 w-1/3"></div>
              </div>
              <p className="text-xs mt-2 text-orange-100">1/3 completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

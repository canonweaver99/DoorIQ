'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  avatar?: string
  isYou: boolean
}

export default function MiniLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Get user's team_id
      const { data: userProfile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.team_id) {
        setLoading(false)
        return
      }

      // Get all team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, full_name, virtual_earnings, email')
        .eq('team_id', userProfile.team_id)
        .order('virtual_earnings', { ascending: false })
        .limit(6)

      if (!teamMembers || teamMembers.length === 0) {
        setLoading(false)
        return
      }

      // Build leaderboard data
      const leaderboardData: LeaderboardEntry[] = teamMembers.map((member: any, index: number) => {
        const isYou = member.id === user.id
        const firstName = member.full_name?.split(' ')[0] || member.email?.split('@')[0] || 'User'
        const displayName = isYou ? `${firstName} (You)` : member.full_name || firstName
        
        return {
          rank: index + 1,
          name: displayName,
          score: member.virtual_earnings || 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.email || 'User')}&background=random&color=fff`,
          isYou
        }
      })

      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-6 md:p-8 animate-pulse overflow-hidden">
        <div className="h-5 sm:h-6 bg-white/10 rounded w-1/3 mb-4 sm:mb-6" />
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 sm:h-28 md:h-32 bg-white/10 rounded-lg sm:rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 sm:h-18 md:h-20 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return null
  }

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3, 6)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />
    return null
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-white/60'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-6 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
    >
      {/* Subtle purple glow at bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <h3 className="text-white font-space font-bold text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
          TEAM LEADERBOARD
        </h3>

      {/* Top 3 Podium - Matching Leaderboard Page Style */}
      {topThree.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6"
        >
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="order-1"
          >
            <div className={`bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-xl rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-gray-400/70 text-center transform translate-y-2 sm:translate-y-3 md:translate-y-4 shadow-2xl shadow-gray-400/20 ${topThree[1].isYou ? 'ring-2 ring-purple-400/50' : ''}`}>
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-300 mx-auto mb-1 sm:mb-1.5 md:mb-2 drop-shadow-lg" />
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 drop-shadow truncate font-space px-0.5">{topThree[1].name}</h3>
              <p className="text-sm sm:text-base md:text-lg font-bold text-gray-200 mb-0.5 drop-shadow font-space">
                ${topThree[1].score.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-300 drop-shadow font-space font-bold">2nd Place</p>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="order-2"
          >
            <div className={`bg-gradient-to-br from-yellow-600/30 to-yellow-700/30 backdrop-blur-xl rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-yellow-500/70 text-center transform scale-105 shadow-2xl shadow-yellow-500/20 ${topThree[0].isYou ? 'ring-2 ring-purple-400/50' : ''}`}>
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400 mx-auto mb-1 sm:mb-1.5 md:mb-2 drop-shadow-lg" />
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-white mb-0.5 drop-shadow truncate font-space px-0.5">{topThree[0].name}</h3>
              <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-400 mb-0.5 drop-shadow-lg font-space">
                ${topThree[0].score.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-yellow-400 drop-shadow font-space font-bold">1st Place</p>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="order-3"
          >
            <div className={`bg-gradient-to-br from-amber-700/30 to-orange-800/30 backdrop-blur-xl rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-amber-600/70 text-center transform translate-y-2 sm:translate-y-3 md:translate-y-4 shadow-2xl shadow-amber-600/20 ${topThree[2].isYou ? 'ring-2 ring-purple-400/50' : ''}`}>
              <Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-amber-500 mx-auto mb-1 sm:mb-1.5 md:mb-2 drop-shadow-lg" />
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 drop-shadow truncate font-space px-0.5">{topThree[2].name}</h3>
              <p className="text-sm sm:text-base md:text-lg font-bold text-amber-400 mb-0.5 drop-shadow font-space">
                ${topThree[2].score.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-amber-400 drop-shadow font-space font-bold">3rd Place</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 4th, 5th, 6th - Cards Below */}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {rest.map((entry) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (entry.rank - 4) * 0.1 }}
              className={`bg-white/[0.05] border-2 border-white/10 rounded-lg p-2 sm:p-2.5 md:p-3 ${
                entry.isYou ? 'ring-2 ring-purple-400/50' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                {/* Rank */}
                <div className="text-sm sm:text-base md:text-lg font-space font-bold text-white/60 flex-shrink-0">
                  {entry.rank}
                </div>
                
                {/* Avatar */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                  {entry.avatar ? (
                    <img 
                      src={entry.avatar} 
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-xs font-space font-bold">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name and Score */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-xs md:text-xs font-space font-bold truncate ${entry.isYou ? 'text-purple-400' : 'text-white'}`}>
                    {entry.name}
                  </p>
                  <p className="text-xs sm:text-xs md:text-xs font-space text-white/60 truncate">
                    ${entry.score.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </motion.div>
  )
}


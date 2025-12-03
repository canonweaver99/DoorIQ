'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award } from 'lucide-react'
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
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/10 rounded" />
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
      className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-6 transition-all"
    >
      <h3 className="text-white font-bold text-lg mb-6">
        TEAM LEADERBOARD
      </h3>

      {/* Top 3 - Prominently Displayed */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {topThree.map((entry, index) => {
          const isFirst = entry.rank === 1
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col items-center p-4 rounded-lg border-2 ${
                isFirst 
                  ? 'border-yellow-400/50 bg-yellow-400/10' 
                  : entry.rank === 2
                  ? 'border-gray-300/50 bg-gray-300/10'
                  : 'border-orange-400/50 bg-orange-400/10'
              } ${entry.isYou ? 'ring-2 ring-purple-400/50' : ''}`}
            >
              {/* Rank Badge */}
              <div className={`text-3xl font-bold mb-2 ${getRankColor(entry.rank)}`}>
                {entry.rank}
              </div>
              
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mb-2">
                {entry.avatar ? (
                  <img 
                    src={entry.avatar} 
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white font-bold">
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="text-center">
                <p className={`text-sm font-medium ${entry.isYou ? 'text-purple-400' : 'text-white'}`}>
                  {entry.name}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  ${entry.score.toLocaleString()}
                </p>
              </div>

              {/* Rank Icon */}
              <div className="absolute top-2 right-2">
                {getRankIcon(entry.rank)}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 4th, 5th, 6th - Cards Below */}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {rest.map((entry) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (entry.rank - 4) * 0.1 }}
              className={`bg-white/[0.05] border border-white/10 rounded-lg p-3 ${
                entry.isYou ? 'ring-2 ring-purple-400/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="text-lg font-bold text-white/60">
                  {entry.rank}
                </div>
                
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                  {entry.avatar ? (
                    <img 
                      src={entry.avatar} 
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name and Score */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${entry.isYou ? 'text-purple-400' : 'text-white'}`}>
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/60">
                    ${entry.score.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}


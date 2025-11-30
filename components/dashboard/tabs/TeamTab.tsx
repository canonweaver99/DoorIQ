'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Users, Award, Target, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeaderboardEntry } from './types'
import Link from 'next/link'

interface TeamTabProps {
  leaderboard: LeaderboardEntry[]
  userRank: number
  teamStats: {
    teamSize: number
    avgTeamScore: number
    yourScore: number
  }
}

export default function TeamTab({ leaderboard, userRank, teamStats }: TeamTabProps) {
  const [realTeamData, setRealTeamData] = useState({
    users: leaderboard,
    currentUserRank: userRank,
    stats: teamStats
  })
  
  useEffect(() => {
    fetchRealTeamData()
  }, [])
  
  const fetchRealTeamData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    // Fetch all users with their session data
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
    
    if (!usersData || usersData.length === 0) return
    
    // Fetch last week's sessions for all users
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { data: allSessions } = await supabase
      .from('live_sessions')
      .select('user_id, overall_score')
      .gte('created_at', oneWeekAgo.toISOString())
    
    // Calculate scores per user
    const userScores = usersData.map(u => {
      const userSessions = allSessions?.filter(s => s.user_id === u.id) || []
      const avgScore = userSessions.length > 0
        ? Math.round(userSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / userSessions.length)
        : 0
      
      return {
        id: u.id,
        name: u.full_name || u.email?.split('@')[0] || 'User',
        score: avgScore,
        avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=6366f1&color=fff`,
        isCurrentUser: u.id === user.id
      }
    }).sort((a, b) => b.score - a.score)
    
    const currentUserRank = userScores.findIndex(u => u.isCurrentUser) + 1
    const avgTeamScore = userScores.length > 0
      ? Math.round(userScores.reduce((sum, u) => sum + u.score, 0) / userScores.length)
      : 0
    const yourScore = userScores.find(u => u.isCurrentUser)?.score || 0
    
    setRealTeamData({
      users: userScores,
      currentUserRank,
      stats: {
        teamSize: userScores.length,
        avgTeamScore,
        yourScore
      }
    })
  }
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-slate-300" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Team Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Team Size</p>
              <p className="text-2xl font-bold text-white">{realTeamData.stats.teamSize}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Active members</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Award className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Team Average</p>
              <p className="text-2xl font-bold text-white">{realTeamData.stats.avgTeamScore}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Average score this week</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Your Performance</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">{realTeamData.stats.yourScore}%</p>
                {realTeamData.stats.yourScore > realTeamData.stats.avgTeamScore ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {realTeamData.stats.yourScore > realTeamData.stats.avgTeamScore
              ? `${realTeamData.stats.yourScore - realTeamData.stats.avgTeamScore}% above team average`
              : `${realTeamData.stats.avgTeamScore - realTeamData.stats.yourScore}% below team average`}
          </p>
        </motion.div>
      </div>

      {/* Your Ranking Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Your Current Ranking</h3>
              <div className="flex items-center gap-3">
                <div className="text-5xl font-bold text-purple-400">#{realTeamData.currentUserRank}</div>
                <div>
                  <p className="text-sm text-slate-300">of {realTeamData.stats.teamSize} members</p>
                </div>
              </div>
            </div>
          <div className="hidden md:block">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <Trophy className="w-16 h-16 text-purple-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full Team Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Full Team Leaderboard</h3>
              <p className="text-xs text-slate-400">This week's rankings</p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-indigo-600/30 transition-all border border-purple-500/20 font-semibold text-sm"
          >
            View Full Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {realTeamData.users.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.03 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={`group relative ${
                entry.isCurrentUser ? 'ring-2 ring-purple-500/50' : ''
              }`}
            >
              {entry.isCurrentUser && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-xl blur-lg" />
              )}
              
              <div className={`relative bg-white/5 hover:bg-white/10 border ${
                entry.isCurrentUser ? 'border-purple-500/50' : 'border-white/5'
              } rounded-xl p-4 transition-all duration-300`}>
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(index)}
                  </div>

                  {/* Avatar */}
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                  />

                  {/* Name & Score */}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      entry.isCurrentUser ? 'text-purple-300' : 'text-white'
                    }`}>
                      {entry.name}
                    </p>
                    <p className="text-xs text-slate-400">{entry.score}% avg score</p>
                  </div>

                  {/* Performance Indicator */}
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                      index <= 2
                        ? 'bg-green-500/20 border border-green-500/30'
                        : index >= realTeamData.users.length - 3
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        index <= 2
                          ? 'text-green-400'
                          : index >= realTeamData.users.length - 3
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        {index <= 2 ? 'Top Tier' : index >= realTeamData.users.length - 3 ? 'Growth' : 'Mid Tier'}
                      </span>
                    </div>
                  </div>

                  {/* Badge for current user */}
                  {entry.isCurrentUser && (
                    <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                      <span className="text-xs font-medium text-purple-300">You</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}


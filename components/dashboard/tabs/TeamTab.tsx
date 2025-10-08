'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Users, Award, Target } from 'lucide-react'
import { LeaderboardEntry } from './types'

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

  // Extended leaderboard - show all members
  const extendedLeaderboard = [
    ...leaderboard,
    { id: 6, name: 'John Smith', score: 795, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    { id: 7, name: 'Lisa Anderson', score: 780, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
    { id: 8, name: 'Michael Brown', score: 765, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
    { id: 9, name: 'Rachel Green', score: 750, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
    { id: 10, name: 'Tom Wilson', score: 735, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  ]

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
              <p className="text-2xl font-bold text-white">{teamStats.teamSize}</p>
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
              <p className="text-2xl font-bold text-white">{teamStats.avgTeamScore}%</p>
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
                <p className="text-2xl font-bold text-white">{teamStats.yourScore}%</p>
                {teamStats.yourScore > teamStats.avgTeamScore ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {teamStats.yourScore > teamStats.avgTeamScore
              ? `${teamStats.yourScore - teamStats.avgTeamScore}% above team average`
              : `${teamStats.avgTeamScore - teamStats.yourScore}% below team average`}
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
              <div className="text-5xl font-bold text-purple-400">#{userRank}</div>
              <div>
                <p className="text-sm text-slate-300">of {teamStats.teamSize} members</p>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400 font-semibold">Up 2 spots this week</span>
                </div>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Full Team Leaderboard</h3>
            <p className="text-xs text-slate-400">This week's rankings</p>
          </div>
        </div>

        <div className="space-y-3">
          {extendedLeaderboard.map((entry, index) => (
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
                    <p className="text-xs text-slate-400">{entry.score} points</p>
                  </div>

                  {/* Performance Indicator */}
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                      index <= 2
                        ? 'bg-green-500/20 border border-green-500/30'
                        : index >= extendedLeaderboard.length - 3
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        index <= 2
                          ? 'text-green-400'
                          : index >= extendedLeaderboard.length - 3
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        {index <= 2 ? 'Top Tier' : index >= extendedLeaderboard.length - 3 ? 'Growth' : 'Mid Tier'}
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

      {/* Recent Team Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Team Achievements</h3>
            <p className="text-xs text-slate-400">Celebrating our wins together</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { user: 'Sarah Chen', achievement: 'Hit 900 points milestone', time: '2 hours ago', icon: '🎯' },
            { user: 'Marcus Johnson', achievement: '5-day perfect score streak', time: '5 hours ago', icon: '🔥' },
            { user: 'You', achievement: 'Moved up 2 spots in rankings', time: '1 day ago', icon: '📈' },
            { user: 'Team', achievement: 'Average score above 80% for the week', time: '2 days ago', icon: '🏆' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
              className="bg-white/5 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium mb-1">
                    <span className="text-purple-400">{item.user}</span> {item.achievement}
                  </p>
                  <p className="text-xs text-slate-400">{item.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}


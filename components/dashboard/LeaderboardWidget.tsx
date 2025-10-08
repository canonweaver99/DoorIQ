'use client'

import { motion } from 'framer-motion'
import { Trophy, Crown, Medal, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface LeaderboardEntry {
  id: number
  name: string
  score: number
  avatar: string
  isCurrentUser?: boolean
}

interface LeaderboardWidgetProps {
  leaderboard: LeaderboardEntry[]
}

export default function LeaderboardWidget({ leaderboard }: LeaderboardWidgetProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 1:
        return <Medal className="w-5 h-5 text-slate-300" />
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-semibold text-slate-400">#{index + 1}</span>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Team Leaderboard</h3>
            <p className="text-xs text-slate-400">This week's top performers</p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3 mb-4">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
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
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatar}
                  alt={entry.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
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

                {/* Badge for current user */}
                {entry.isCurrentUser && (
                  <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                    <span className="text-xs font-medium text-purple-300">You</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Full Button */}
      <Link
        href="/leaderboard"
        className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl py-3 text-sm font-medium text-white transition-all duration-200 group"
      >
        View Full Leaderboard
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  )
}


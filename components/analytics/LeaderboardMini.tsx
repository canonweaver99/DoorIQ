'use client'

import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
  change: number // position change from last period
  avatar?: string
}

interface LeaderboardMiniProps {
  entries: LeaderboardEntry[]
  title?: string
}

export default function LeaderboardMini({ entries, title = 'Top Performers' }: LeaderboardMiniProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400'
    if (rank === 2) return 'text-slate-300'
    if (rank === 3) return 'text-amber-600'
    return 'text-white/50'
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30'
    if (rank === 2) return 'bg-gradient-to-br from-slate-400/20 to-slate-500/20 border-slate-400/30'
    if (rank === 3) return 'bg-gradient-to-br from-amber-700/20 to-amber-800/20 border-amber-700/30'
    return 'bg-white/[0.02] border-white/[0.08]'
  }

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-white/50 mb-3 px-1">
        {title}
      </h3>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${getRankBg(entry.rank)}
              hover:border-white/[0.15] transition-all duration-200
            `}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8 h-8">
              {entry.rank <= 3 ? (
                <Trophy className={`w-5 h-5 ${getRankColor(entry.rank)}`} />
              ) : (
                <span className={`text-sm font-bold ${getRankColor(entry.rank)}`}>
                  {entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            {entry.avatar ? (
              <img
                src={entry.avatar}
                alt={entry.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                            flex items-center justify-center text-white text-xs font-medium">
                {entry.name.charAt(0)}
              </div>
            )}

            {/* Name and score */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {entry.name}
              </p>
              <p className="text-xs text-white/50">
                Score: {entry.score}
              </p>
            </div>

            {/* Change indicator */}
            {entry.change !== 0 && (
              <div className={`
                flex items-center gap-1 text-xs font-medium
                ${entry.change > 0 ? 'text-green-400' : 'text-red-400'}
              `}>
                {entry.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(entry.change)}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}


'use client'

import { motion } from 'framer-motion'
import { Target, Check, Star, Play } from 'lucide-react'

const challenges = [
  { id: 1, title: 'Complete 5 training sessions', current: 3, total: 5, completed: false },
  { id: 2, title: 'Score 80+ on 3 sessions', current: 2, total: 3, completed: false },
  { id: 3, title: 'Practice with all homeowner types', current: 4, total: 6, completed: false },
]

const badges = [
  { id: 1, name: 'First Close', earned: true, icon: '🎯' },
  { id: 2, name: 'Perfect Score', earned: true, icon: '⭐' },
  { id: 3, name: '7-Day Streak', earned: true, icon: '🔥' },
  { id: 4, name: 'Objection Master', earned: false, icon: '🛡️' },
]

export default function UpcomingChallenges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Daily Challenges</h3>
          <p className="text-xs text-slate-400">Complete to earn rewards</p>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3 mb-6">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
            className="bg-white/5 border border-white/5 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-200">{challenge.title}</p>
              {challenge.completed && (
                <div className="p-1 bg-green-500/20 rounded-full">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(challenge.current / challenge.total) * 100}%` }}
                  transition={{ duration: 1, delay: 1 + index * 0.05 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {challenge.current}/{challenge.total}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggested Training */}
      <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Play className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Suggested Training</p>
            <p className="text-xs text-slate-300">Practice with "Too Expensive Tim"</p>
          </div>
        </div>
        
        <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg py-2 text-sm font-medium text-purple-300 transition-colors">
          Start Practice
        </button>
      </div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-semibold text-white">Badges Earned</p>
          </div>
          <span className="text-xs text-slate-400">
            {badges.filter(b => b.earned).length}/{badges.length}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.1 + index * 0.05 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`aspect-square flex items-center justify-center rounded-xl text-2xl ${
                badge.earned
                  ? 'bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-2 border-purple-500/50'
                  : 'bg-white/5 border border-white/5 grayscale opacity-50'
              }`}
              title={badge.name}
            >
              {badge.icon}
            </motion.div>
          ))}
        </div>
        
        <p className="text-xs text-slate-400 text-center mt-3">
          Next unlock: Objection Master (3 more sessions)
        </p>
      </div>
    </motion.div>
  )
}


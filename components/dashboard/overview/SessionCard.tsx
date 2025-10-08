'use client'

import { motion } from 'framer-motion'
import RadarMiniChart from './RadarMiniChart'

interface SessionCardProps {
  session: {
    id: number
    homeowner: string
    time: string
    score: number
    skills: {
      rapport: number
      discovery: number
      objections: number
      closing: number
    }
    insight: string
  }
  delay?: number
}

export default function SessionCard({ session, delay = 0 }: SessionCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTimeAgo = (timeStr: string) => {
    // Simple time ago formatter
    return timeStr
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="flex-shrink-0 w-[280px] sm:w-[300px] h-[120px] bg-[#1e1e30] border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1">{session.homeowner}</h4>
          <p className="text-xs text-slate-400">{getTimeAgo(session.time)}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(session.score)}`}>
            {session.score}
          </span>
          <RadarMiniChart data={session.skills} size={40} />
        </div>
      </div>

      <p className="text-xs text-slate-300 italic line-clamp-2 mt-2">
        "{session.insight}"
      </p>
    </motion.div>
  )
}


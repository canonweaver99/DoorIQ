'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

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
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    return 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  const getTimeAgo = (timeStr: string) => {
    // Simple time ago formatter
    return timeStr
  }

  return (
    <Link href={`/analytics/${session.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ scale: 1.02, y: -2 }}
        className="w-full h-[80px] bg-[#1e1e30] border border-white/10 rounded-xl px-4 py-3 hover:border-purple-500/50 transition-all duration-300 cursor-pointer flex items-center justify-between gap-3"
      >
        {/* Left: Name and Time */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{session.homeowner}</h4>
          <p className="text-xs text-slate-400">{getTimeAgo(session.time)}</p>
        </div>
        
        {/* Center: Insight */}
        <div className="flex-1 min-w-0 hidden md:block">
          <p className="text-xs text-slate-400 italic line-clamp-2">
            "{session.insight}"
          </p>
        </div>

        {/* Right: Score */}
        <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border font-semibold text-lg ${getScoreColor(session.score)}`}>
          {session.score}
        </div>
      </motion.div>
    </Link>
  )
}


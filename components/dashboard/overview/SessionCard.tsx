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
        className="group relative w-full h-[80px] bg-white/[0.02] border-2 border-white/5 rounded-lg px-4 py-3 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 overflow-hidden"
      >
        {/* Subtle purple glow at bottom for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex items-center justify-between gap-3 w-full">
          {/* Left: Name and Time */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-space font-bold text-white truncate">{session.homeowner}</h4>
            <p className="text-xs font-space text-white/60">{getTimeAgo(session.time)}</p>
          </div>
          
          {/* Center: Insight */}
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-xs font-space text-white/60 italic line-clamp-2">
              "{session.insight}"
            </p>
          </div>

          {/* Right: Score */}
          <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 font-space font-bold text-lg ${getScoreColor(session.score)}`}>
            {session.score}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}


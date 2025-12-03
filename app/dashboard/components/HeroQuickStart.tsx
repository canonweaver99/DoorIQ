'use client'

import { motion } from 'framer-motion'
import { Play, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import DailyStreakCounter from './DailyStreakCounter'
import RecommendedPractice from './RecommendedPractice'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import Image from 'next/image'

interface LastSession {
  agentName: string
  score: number
  startedAt: string
  durationSeconds: number | null
}

interface HeroQuickStartProps {
  lastSession: LastSession | null
}

export default function HeroQuickStart({ lastSession }: HeroQuickStartProps) {
  const router = useRouter()

  const handleStartPractice = () => {
    router.push('/trainer')
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Daily Streak and Quick Start CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DailyStreakCounter />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartPractice}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-lg text-base transition-all shadow-lg shadow-purple-500/20"
        >
          <Play className="w-5 h-5" />
          Start Practice Session
        </motion.button>
      </div>

      {/* Last Practice Recap */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                <Image
                  src={PERSONA_METADATA[lastSession.agentName as AllowedAgentName]?.bubble?.image || '/agents/default.png'}
                  alt={lastSession.agentName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-white/80 text-sm">Your last session</p>
                <p className="text-white font-semibold">
                  {lastSession.agentName} - Score: {lastSession.score}/100
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-white/60 text-xs">
                    {formatDistanceToNow(new Date(lastSession.startedAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDuration(lastSession.durationSeconds)}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${lastSession.score >= 80 ? 'text-purple-400' : lastSession.score >= 60 ? 'text-white/80' : 'text-white/60'}`}>
                {lastSession.score}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Practice */}
      <RecommendedPractice />
    </div>
  )
}


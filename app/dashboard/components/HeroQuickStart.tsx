'use client'

import { motion } from 'framer-motion'
import { Clock, RotateCcw, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${remainingSeconds}s`
    return `${minutes}m ${remainingSeconds}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20'
    if (score >= 60) return 'from-yellow-500/20 to-amber-500/20'
    return 'from-orange-500/20 to-red-500/20'
  }

  const handleRetryLastSession = () => {
    if (lastSession) {
      const personaMeta = PERSONA_METADATA[lastSession.agentName as AllowedAgentName]
      const agentId = personaMeta?.card?.elevenAgentId
      if (agentId) {
        router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
      } else {
        router.push('/trainer')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Last Practice Recap - Enhanced Card */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-5 md:p-6 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 overflow-hidden"
        >
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-sm font-medium">Last Practice Session</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Agent Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                <Image
                  src={PERSONA_METADATA[lastSession.agentName as AllowedAgentName]?.bubble?.image || '/agents/default.png'}
                  alt={lastSession.agentName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-base md:text-lg truncate">
                  {lastSession.agentName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-white/60 text-sm">
                    {formatDistanceToNow(new Date(lastSession.startedAt), { addSuffix: true })}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60 text-sm">
                    Duration: {formatDuration(lastSession.durationSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Score & Actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Score */}
              <div className={`bg-gradient-to-br ${getScoreBgColor(lastSession.score)} rounded-xl px-4 py-3 text-center min-w-[80px]`}>
                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(lastSession.score)}`}>
                  {lastSession.score}
                </div>
                <div className="text-white/60 text-xs font-medium mt-0.5">SCORE</div>
              </div>

              {/* Retry Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetryLastSession}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Try Again</span>
              </motion.button>
            </div>
          </div>

          {/* Quick insight */}
          {lastSession.score < 80 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>
                  {lastSession.score < 60 
                    ? 'Keep practicing! Focus on building rapport and handling objections.'
                    : 'Good progress! Work on your closing technique to push past 80.'}
                </span>
              </div>
            </div>
          )}
          </div>
        </motion.div>
      )}

    </div>
  )
}

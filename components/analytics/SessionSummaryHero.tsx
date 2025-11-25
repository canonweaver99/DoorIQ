'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionSummaryHeroProps {
  overallScore: number
  saleClosed: boolean
  objectionHandlingScore?: number
  closeScore?: number
  objectionCount?: number
  closeAttempts?: number
  feedback?: {
    strengths?: string[]
    improvements?: string[]
  }
}

export function SessionSummaryHero({
  overallScore,
  saleClosed,
  objectionHandlingScore = 0,
  closeScore = 0,
  objectionCount = 0,
  closeAttempts = 0,
  feedback
}: SessionSummaryHeroProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getSummaryColor = () => {
    if (overallScore >= 80) return {
      bg: 'from-emerald-900/30 to-green-800/30',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300'
    }
    if (overallScore >= 60) return {
      bg: 'from-blue-900/30 to-indigo-800/30',
      border: 'border-blue-500/40',
      text: 'text-blue-300'
    }
    return {
      bg: 'from-amber-900/30 to-orange-800/30',
      border: 'border-amber-500/40',
      text: 'text-amber-300'
    }
  }

  const colors = getSummaryColor()
  const objectionSuccessRate = objectionCount > 0 ? Math.round((objectionHandlingScore / 100) * objectionCount) : 0
  const closeAttemptRate = closeAttempts > 0 ? `${closeAttempts} attempts` : '0 attempts'

  // Determine bottom line message
  const getBottomLine = () => {
    if (saleClosed) {
      return "You successfully closed the deal! Great work converting rapport into sales."
    }
    if (objectionHandlingScore >= 80 && closeScore < 50) {
      return "You're building great rapport but not converting it to sales."
    }
    if (objectionHandlingScore < 50) {
      return "Focus on handling objections better to build trust and move forward."
    }
    return "Solid foundation with room to grow. Keep refining your approach."
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-3xl bg-gradient-to-br backdrop-blur-xl border-2 p-6 mb-8 overflow-hidden",
        colors.bg,
        colors.border
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white mb-4 font-space">Session Summary</h2>
        
        <div className="space-y-3">
          {/* Successes */}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {objectionHandlingScore >= 80 ? (
                <span className="text-base text-white font-sans">
                  Handled objections perfectly ({objectionHandlingScore}% success rate)
                </span>
              ) : objectionCount > 0 ? (
                <span className="text-base text-white font-sans">
                  Handled {objectionSuccessRate} of {objectionCount} objections
                </span>
              ) : (
                <span className="text-base text-white font-sans">
                  No objections encountered
                </span>
              )}
            </div>
          </div>

          {/* Comparison */}
          {overallScore >= 60 && (
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-base text-white font-sans">
                Above team average (+{Math.max(0, overallScore - 60)}pts)
              </span>
            </div>
          )}

          {/* Failures */}
          {!saleClosed && (
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-base text-white font-sans">
                Didn't attempt a close ({closeAttemptRate})
              </span>
            </div>
          )}
        </div>

        {/* Bottom Line */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-base font-medium text-white leading-relaxed font-sans">
            {getBottomLine()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}


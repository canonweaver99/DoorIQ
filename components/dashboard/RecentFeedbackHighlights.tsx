'use client'

import { motion } from 'framer-motion'
import { MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'

interface FeedbackHighlight {
  id: string
  type: 'positive' | 'improvement' | 'insight'
  title: string
  message: string
  score?: number
}

interface RecentFeedbackHighlightsProps {
  feedback?: FeedbackHighlight[]
  lastSessionScore?: number
}

export default function RecentFeedbackHighlights({ feedback, lastSessionScore }: RecentFeedbackHighlightsProps) {
  if (!feedback || feedback.length === 0) {
    return null
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'positive':
        return {
          icon: TrendingUp,
          bgColor: 'from-green-500/10 to-emerald-500/10',
          borderColor: 'border-green-500/20',
          iconColor: 'text-green-400',
          titleColor: 'text-green-400'
        }
      case 'improvement':
        return {
          icon: AlertCircle,
          bgColor: 'from-orange-500/10 to-amber-500/10',
          borderColor: 'border-orange-500/20',
          iconColor: 'text-orange-400',
          titleColor: 'text-orange-400'
        }
      default:
        return {
          icon: MessageSquare,
          bgColor: 'from-blue-500/10 to-cyan-500/10',
          borderColor: 'border-blue-500/20',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-400'
        }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
        <h2 className="text-white font-space font-medium text-lg md:text-xl tracking-tight">
          Recent Feedback Highlights
        </h2>
      </div>

      <div className="space-y-4">
        {feedback.slice(0, 3).map((item, index) => {
          const config = getTypeConfig(item.type)
          const Icon = config.icon

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 md:p-5`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${config.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${config.titleColor} font-medium text-sm md:text-base mb-1`}>
                    {item.title}
                  </h3>
                  <p className="text-white/80 text-sm md:text-base leading-relaxed">
                    {item.message}
                  </p>
                  {item.score !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-white/60 text-xs">Score Impact:</span>
                      <span className={`font-medium text-sm ${item.score >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                        {item.score >= 0 ? '+' : ''}{item.score}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {lastSessionScore !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-white/5"
        >
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Last Session Score</span>
            <span className={`text-2xl font-bold ${lastSessionScore >= 80 ? 'text-green-400' : lastSessionScore >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {lastSessionScore}/100
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}


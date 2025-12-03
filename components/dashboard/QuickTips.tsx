'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb, TrendingUp, Target, MessageSquare } from 'lucide-react'

interface QuickTip {
  id: string
  title: string
  message: string
  category: 'performance' | 'technique' | 'motivation'
  icon: typeof Lightbulb
}

interface QuickTipsProps {
  skillGaps?: Array<{ skill: string; score: number }>
  recentFeedback?: string[]
  overallScore?: number
}

export default function QuickTips({ skillGaps, recentFeedback, overallScore }: QuickTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([])
  const [tips, setTips] = useState<QuickTip[]>([])

  useEffect(() => {
    const generatedTips: QuickTip[] = []

    // Generate tips based on skill gaps
    if (skillGaps && skillGaps.length > 0) {
      const topGap = skillGaps[0]
      if (topGap.score < 70) {
        generatedTips.push({
          id: 'skill-gap-1',
          title: `Focus on ${topGap.skill}`,
          message: `Your ${topGap.skill.toLowerCase()} score is ${topGap.score}%. Try practicing with agents that challenge this area.`,
          category: 'technique',
          icon: Target
        })
      }
    }

    // Generate tips based on overall score
    if (overallScore !== undefined) {
      if (overallScore >= 80) {
        generatedTips.push({
          id: 'performance-2',
          title: 'Push Your Limits',
          message: 'You\'re doing great! Try practicing with more challenging agents to level up.',
          category: 'motivation',
          icon: TrendingUp
        })
      }
    }

    // Generate tips from recent feedback
    if (recentFeedback && recentFeedback.length > 0) {
      const feedbackTip = recentFeedback[0]
      if (feedbackTip.length < 100) {
        generatedTips.push({
          id: 'feedback-1',
          title: 'Recent Insight',
          message: feedbackTip,
          category: 'technique',
          icon: MessageSquare
        })
      }
    }

    setTips(generatedTips.slice(0, 2)) // Show max 2 tips
  }, [skillGaps, recentFeedback, overallScore])

  const visibleTips = tips.filter(tip => !dismissedTips.includes(tip.id))

  if (visibleTips.length === 0) {
    return null
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'from-blue-500/10 to-cyan-500/10 border-blue-500/20'
      case 'technique':
        return 'from-purple-500/10 to-pink-500/10 border-purple-500/20'
      case 'motivation':
        return 'from-orange-500/10 to-yellow-500/10 border-orange-500/20'
      default:
        return 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20'
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visibleTips.map((tip, index) => {
          const Icon = tip.icon
          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative bg-gradient-to-r ${getCategoryColor(tip.category)} border rounded-xl p-4 md:p-5`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white/80" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm md:text-base mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed">
                    {tip.message}
                  </p>
                </div>
                <button
                  onClick={() => setDismissedTips([...dismissedTips, tip.id])}
                  className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors p-1"
                  aria-label="Dismiss tip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Target, CheckCircle2, TrendingUp } from 'lucide-react'

interface ActionableStepsProps {
  overallScore: number
  saleClosed: boolean | null
  sessionHighlight?: string
  strengths?: string[]
  improvements?: string[]
  scores?: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
}

export function ActionableSteps({
  overallScore,
  saleClosed,
  sessionHighlight,
  strengths = [],
  improvements = [],
  scores
}: ActionableStepsProps) {
  // Generate session summary paragraph
  const generateSummary = (): string => {
    const scoreRanges = {
      excellent: overallScore >= 90,
      good: overallScore >= 80 && overallScore < 90,
      average: overallScore >= 70 && overallScore < 80,
      needsWork: overallScore < 70
    }

    let summary = ''

    // Start with overall performance assessment
    if (scoreRanges.excellent) {
      summary = 'You delivered an outstanding performance in this session. '
    } else if (scoreRanges.good) {
      summary = 'You had a strong performance overall. '
    } else if (scoreRanges.average) {
      summary = 'You showed solid fundamentals in this session. '
    } else {
      summary = 'This session provided valuable learning opportunities. '
    }

    // Add sale status
    if (saleClosed) {
      summary += 'You successfully closed the sale, demonstrating effective sales techniques and strong execution. '
    } else {
      summary += 'While the sale wasn\'t closed, you gained valuable experience and insights. '
    }

    // Add highlight if available
    if (sessionHighlight) {
      summary += sessionHighlight
      if (!sessionHighlight.endsWith('.') && !sessionHighlight.endsWith('!')) {
        summary += '.'
      }
    } else if (strengths.length > 0) {
      // Use first strength as highlight
      summary += strengths[0]
      if (!strengths[0].endsWith('.') && !strengths[0].endsWith('!')) {
        summary += '.'
      }
    } else {
      // Generic closing based on score
      if (scoreRanges.excellent || scoreRanges.good) {
        summary += 'Your communication skills and approach were effective throughout the conversation.'
      } else {
        summary += 'There are clear areas where you can refine your technique for even better results.'
      }
    }

    return summary
  }

  // Generate 3 actionable tips
  const generateTips = (): string[] => {
    const tips: string[] = []
    const usedAreas = new Set<string>()

    // First, use improvements if available (up to 2, save room for score-based tips)
    if (improvements.length > 0) {
      tips.push(...improvements.slice(0, 2))
    }

    // Fill remaining slots based on low scores (prioritize areas that need work)
    if (tips.length < 3 && scores) {
      const scoreAreas = [
        { name: 'rapport', label: 'rapport building', threshold: 70 },
        { name: 'discovery', label: 'discovery questions', threshold: 70 },
        { name: 'objection_handling', label: 'objection handling', threshold: 70 },
        { name: 'closing', label: 'closing techniques', threshold: 70 }
      ]

      // Sort by score (lowest first) to prioritize areas needing most improvement
      const sortedAreas = [...scoreAreas].sort((a, b) => {
        const scoreA = scores[a.name as keyof typeof scores]
        const scoreB = scores[b.name as keyof typeof scores]
        return scoreA - scoreB
      })

      for (const area of sortedAreas) {
        if (tips.length >= 3) break

        const score = scores[area.name as keyof typeof scores]
        if (score < area.threshold && !usedAreas.has(area.name)) {
          usedAreas.add(area.name)
          const tip = `Focus on improving your ${area.label}. `
          
          if (area.name === 'rapport') {
            tips.push(tip + 'Ask more personal questions and find common ground to build stronger connections.')
          } else if (area.name === 'discovery') {
            tips.push(tip + 'Use more open-ended questions starting with "what," "how," or "why" to uncover deeper needs.')
          } else if (area.name === 'objection_handling') {
            tips.push(tip + 'Acknowledge concerns first, then ask clarifying questions before addressing the objection.')
          } else if (area.name === 'closing') {
            tips.push(tip + 'Use assumptive language like "when we get started" instead of "if you\'re interested" to create forward momentum.')
          }
        }
      }
    }

    // Fill remaining slots with generic tips if needed
    const genericTips = [
      'Practice maintaining consistent energy throughout the conversation, especially during the closing phase.',
      'Focus on active listening and responding to what the homeowner is actually saying, not just waiting for your turn to speak.',
      'Review your session transcript to identify patterns and refine your approach for next time.'
    ]

    let genericIndex = 0
    while (tips.length < 3 && genericIndex < genericTips.length) {
      tips.push(genericTips[genericIndex])
      genericIndex++
    }

    return tips.slice(0, 3)
  }

  const summary = generateSummary()
  const tips = generateTips()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-8 h-8 text-purple-400" />
        <h2 className="text-3xl font-bold text-white">Actionable Steps</h2>
      </div>

      {/* Session Summary Paragraph */}
      <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">How Your Session Went</h3>
            <p className="text-base text-gray-300 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Three Tips */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">3 Tips to Work On for Next Time</h3>
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-semibold text-sm mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-base text-gray-200 leading-relaxed flex-1">
                    {tip}
                  </p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


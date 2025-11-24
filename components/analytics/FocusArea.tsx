'use client'

import { motion } from 'framer-motion'
import { Target, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FocusAreaProps {
  currentScores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  userName?: string
}

// Map of skill areas to suggested drills/personas
const skillRecommendations: Record<string, { drill: string; persona?: string }> = {
  rapport: {
    drill: 'Practice building rapport in the first 2 minutes',
    persona: 'Friendly Neighbor'
  },
  discovery: {
    drill: 'Focus on asking open-ended questions',
    persona: 'Curious Customer'
  },
  objection_handling: {
    drill: 'Practice the Feel-Felt-Found technique',
    persona: 'Price-Conscious Buyer'
  },
  closing: {
    drill: 'Work on assumptive closing language',
    persona: 'Hesitant Decision Maker'
  }
}

export function FocusArea({ currentScores, userName = 'You' }: FocusAreaProps) {
  // Calculate average of other skills for each skill
  const calculateOtherAverage = (excludeKey: string) => {
    const otherScores = Object.entries(currentScores)
      .filter(([key]) => key !== excludeKey)
      .map(([, score]) => score)
    return otherScores.reduce((sum, score) => sum + score, 0) / otherScores.length
  }

  // Find the skill with the biggest gap
  const skillGaps = Object.entries(currentScores).map(([key, score]) => {
    const otherAvg = calculateOtherAverage(key)
    const gap = otherAvg - score
    return {
      skill: key,
      score,
      gap,
      otherAvg
    }
  })

  // Sort by gap (biggest gap first)
  skillGaps.sort((a, b) => b.gap - a.gap)
  const focusSkill = skillGaps[0]

  // Only show if gap is significant (at least 10 points)
  if (!focusSkill || focusSkill.gap < 10) {
    return null
  }

  const skillLabels: Record<string, string> = {
    rapport: 'Rapport Building',
    discovery: 'Discovery',
    objection_handling: 'Objection Handling',
    closing: 'Closing Technique'
  }

  const recommendation = skillRecommendations[focusSkill.skill] || {
    drill: 'Practice this skill area',
    persona: undefined
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl p-6 mb-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/40">
            <Target className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 font-space flex items-center gap-2">
            <span>🎯</span>
            <span>Your Opportunity</span>
          </h3>
          
          <p className="text-gray-300 mb-4 font-sans">
            <span className="font-semibold text-white">{skillLabels[focusSkill.skill]}</span> is{' '}
            <span className="font-bold text-amber-400">{Math.round(focusSkill.gap)} points</span> below your other skills
            ({Math.round(focusSkill.score)}% vs {Math.round(focusSkill.otherAvg)}% average).
          </p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400 font-sans">Current Score</span>
              <span className={`text-lg font-bold font-space ${getScoreColor(focusSkill.score)}`}>
                {Math.round(focusSkill.score)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400 font-sans">Other Skills Avg</span>
              <span className="text-lg font-bold text-white font-space">
                {Math.round(focusSkill.otherAvg)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">→</span>
              <span className="text-gray-200 font-sans">
                <span className="font-semibold">Try:</span> {recommendation.drill}
              </span>
            </div>
            {recommendation.persona && (
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">→</span>
                <span className="text-gray-200 font-sans">
                  <span className="font-semibold">Practice with:</span> {recommendation.persona} persona
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Link
              href="/trainer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 font-medium transition-colors text-sm font-sans"
            >
              Start Practice Session
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


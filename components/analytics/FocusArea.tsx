'use client'

import { motion } from 'framer-motion'
import { Target, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface FocusAreaProps {
  currentScores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  userName?: string
}

// Map of skill areas to suggested drills/personas (using actual agent names)
const skillRecommendations: Record<string, { drill: string; persona?: string }> = {
  rapport: {
    drill: 'Practice building rapport in the first 2 minutes',
    persona: 'No Problem Nancy'
  },
  discovery: {
    drill: 'Focus on asking open-ended questions',
    persona: 'Spouse Check Susan'
  },
  objection_handling: {
    drill: 'Practice the Feel-Felt-Found technique',
    persona: 'Too Expensive Tim'
  },
  closing: {
    drill: 'Work on assumptive closing language',
    persona: 'Think About It Tina'
  }
}

// Agent image mapping
const agentImageMap: Record<string, string> = {
  'Average Austin': '/Austin Boss.png',
  'No Problem Nancy': '/No Problem Nancy Black.png',
  'Already Got It Alan': '/Already got it Alan landscape.png',
  'Not Interested Nick': '/Not Interested Nick.png',
  'DIY Dave': '/DIY DAVE.png',
  'Too Expensive Tim': '/Too Expensive Tim.png',
  'Spouse Check Susan': '/Spouse Check Susan.png',
  'Busy Beth': '/Busy Beth.png',
  'Renter Randy': '/Renter Randy.png',
  'Skeptical Sam': '/Skeptical Sam.png',
  'Just Treated Jerry': '/Just Treated Jerry.png',
  'Think About It Tina': '/Think About It Tina.png',
  'Veteran Victor': '/Veteran Victor Landcape.png',
  'Tag Team Tanya & Tom': '/tanya and tom.png'
}

function getAgentImage(agentName: string): string {
  return agentImageMap[agentName] || '/agents/default.png'
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
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">→</span>
                <span className="text-gray-200 font-sans flex items-center gap-2">
                  <span className="font-semibold">Practice with:</span>
                  <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-amber-500/40 flex-shrink-0">
                      <Image
                        src={getAgentImage(recommendation.persona)}
                        alt={recommendation.persona}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <span>{recommendation.persona}</span>
                  </div>
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/trainer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 font-medium transition-colors text-sm font-sans"
            >
              Start Practice Session
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/learning"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg text-gray-300 font-medium transition-colors text-sm font-sans"
            >
              <BookOpen className="w-4 h-4" />
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


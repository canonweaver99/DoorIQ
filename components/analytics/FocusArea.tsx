'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useModules } from '@/hooks/learning/useModules'
import { ModuleCategory } from '@/lib/learning/types'

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
  'Switchover Steve': '/Already got it Alan landscape.png',
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

// Map skill areas to module categories
const skillToCategoryMap: Record<string, ModuleCategory> = {
  rapport: 'approach',
  discovery: 'pitch',
  objection_handling: 'objections',
  closing: 'close'
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

  // Get the module category for the focus skill
  const moduleCategory = skillToCategoryMap[focusSkill.skill]
  
  // Fetch modules for the relevant category (only if category exists)
  const { modules, loading: modulesLoading } = useModules({ 
    category: moduleCategory || undefined
  })
  
  // Get the first module (lowest display_order) as the recommended lesson
  const recommendedModule = modules.length > 0 
    ? modules.sort((a, b) => a.display_order - b.display_order)[0]
    : null

  const recommendation = skillRecommendations[focusSkill.skill] || {
    drill: 'Practice this skill area',
    persona: undefined
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 backdrop-blur-xl border-2 border-amber-500/40 rounded-3xl p-6 mb-8"
    >
      <h3 className="text-xl font-bold text-white mb-6 font-space flex items-center gap-2">
        <span>🎯</span>
        <span>Your Opportunity</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lesson Recommendation Card */}
        {recommendedModule ? (
          <Link
            href={`/learning/modules/${recommendedModule.slug}`}
            className="group bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 hover:border-amber-500/40 rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-amber-400 mb-1 font-space uppercase tracking-wide">Recommended Lesson</h4>
                <p className="text-base font-bold text-white font-space line-clamp-2">{recommendedModule.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 font-sans">
              <span>Review lesson</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ) : modulesLoading ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-400 mb-1 font-space uppercase tracking-wide">Recommended Lesson</h4>
                <p className="text-sm text-gray-400 font-sans">Loading...</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Practice Agent Card */}
        {recommendation.persona && (
          <Link
            href="/trainer"
            className="group bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 hover:border-amber-500/40 rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/40 flex-shrink-0 group-hover:border-amber-500/60 transition-colors">
                <Image
                  src={getAgentImage(recommendation.persona)}
                  alt={recommendation.persona}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-amber-400 mb-1 font-space uppercase tracking-wide">Practice Next</h4>
                <p className="text-base font-bold text-white font-space">{recommendation.persona}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300 font-sans">
              <span>Start practice session</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  )
}


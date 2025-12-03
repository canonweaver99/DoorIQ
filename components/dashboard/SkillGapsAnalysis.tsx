'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Target } from 'lucide-react'

interface SkillGap {
  skill: string
  score: number
  improvement?: number
}

interface SkillGapsAnalysisProps {
  skillGaps?: SkillGap[]
  skillBreakdown?: {
    opening: number
    objectionHandling: number
    closing: number
    tonality: number
    pace: number
  }
}

export default function SkillGapsAnalysis({ skillGaps, skillBreakdown }: SkillGapsAnalysisProps) {
  const gaps = skillGaps || generateGapsFromBreakdown(skillBreakdown)

  if (!gaps || gaps.length === 0) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPriorityLabel = (score: number) => {
    if (score < 40) return { text: 'Critical', color: 'text-red-400' }
    if (score < 60) return { text: 'Needs Work', color: 'text-orange-400' }
    if (score < 80) return { text: 'Good', color: 'text-yellow-400' }
    return { text: 'Strong', color: 'text-green-400' }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.02] border border-white/10 rounded-xl p-6 md:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-white font-space font-medium text-lg md:text-xl tracking-tight">
            Areas to Improve
          </h2>
          <p className="text-white/60 text-sm md:text-base">
            Focus on these skills to level up
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {gaps.map((gap, index) => {
          const priority = getPriorityLabel(gap.score)
          return (
            <motion.div
              key={gap.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/[0.02] border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {gap.score < 60 && (
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  )}
                  <span className="text-white font-medium text-sm md:text-base">
                    {gap.skill}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${priority.color}`}>
                    {priority.text}
                  </span>
                  <span className={`font-bold text-lg ${getScoreColor(gap.score)}`}>
                    {gap.score}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gap.score}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={`h-full ${getProgressColor(gap.score)} rounded-full`}
                />
              </div>

              {gap.improvement !== undefined && gap.improvement !== 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${gap.improvement > 0 ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
                  <span className={`text-xs ${gap.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gap.improvement > 0 ? '+' : ''}{gap.improvement}% from last week
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

function generateGapsFromBreakdown(breakdown?: {
  opening: number
  objectionHandling: number
  closing: number
  tonality: number
  pace: number
}): SkillGap[] {
  if (!breakdown) return []

  const skills: SkillGap[] = [
    { skill: 'Opening', score: breakdown.opening },
    { skill: 'Objection Handling', score: breakdown.objectionHandling },
    { skill: 'Closing', score: breakdown.closing },
    { skill: 'Tonality', score: breakdown.tonality },
    { skill: 'Pace', score: breakdown.pace },
  ]

  return skills.sort((a, b) => a.score - b.score)
}


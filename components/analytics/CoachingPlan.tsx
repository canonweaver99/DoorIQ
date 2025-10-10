'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, Users, ExternalLink, Award, Zap, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface ImmediateFix {
  issue: string
  practice_scenario: string
  resource_link: string
}

interface SkillDevelopment {
  skill: string
  current_level: 'beginner' | 'intermediate' | 'advanced'
  target_level: 'intermediate' | 'advanced'
  recommended_exercises: string[]
}

interface CoachingPlan {
  immediate_fixes?: ImmediateFix[]
  skill_development?: SkillDevelopment[]
  role_play_scenarios?: string[]
}

interface CoachingPlanProps {
  coachingPlan: CoachingPlan
}

export default function CoachingPlan({ coachingPlan }: CoachingPlanProps) {
  if (!coachingPlan || 
      (!coachingPlan.immediate_fixes?.length && 
       !coachingPlan.skill_development?.length && 
       !coachingPlan.role_play_scenarios?.length)) {
    return null
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'advanced':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner':
        return '🌱'
      case 'intermediate':
        return '🌿'
      case 'advanced':
        return '🌳'
      default:
        return '📍'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-indigo-500/30"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Target className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Your Personalized Coaching Plan</h3>
            <p className="text-sm text-gray-400">AI-generated recommendations based on this session</p>
          </div>
        </div>
      </motion.div>

      {/* Immediate Fixes */}
      {coachingPlan.immediate_fixes && coachingPlan.immediate_fixes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">Immediate Fixes</h4>
            <span className="text-xs text-gray-500">Quick wins for next session</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {coachingPlan.immediate_fixes.map((fix, index) => (
              <div
                key={index}
                className="bg-gray-800/30 rounded-xl p-5 border border-orange-500/30 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-lg">
                        ⚡
                      </div>
                      <h5 className="font-semibold text-white">{fix.issue}</h5>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3 ml-10">
                      Practice: <span className="text-orange-300 font-medium">{fix.practice_scenario}</span>
                    </p>

                    <Link
                      href={fix.resource_link}
                      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors ml-10"
                    >
                      <BookOpen className="w-4 h-4" />
                      Training Resources
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skill Development */}
      {coachingPlan.skill_development && coachingPlan.skill_development.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Skill Development Path</h4>
            <span className="text-xs text-gray-500">Long-term improvement goals</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {coachingPlan.skill_development.map((skill, index) => (
              <div
                key={index}
                className="bg-gray-800/30 rounded-xl p-5 border border-blue-500/30"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="text-lg font-semibold text-white mb-2">{skill.skill}</h5>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Current:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getLevelColor(skill.current_level)}`}>
                          {getLevelIcon(skill.current_level)} {skill.current_level}
                        </span>
                      </div>
                      <span className="text-gray-600">→</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Target:</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getLevelColor(skill.target_level)}`}>
                          {getLevelIcon(skill.target_level)} {skill.target_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Award className="w-6 h-6 text-blue-400 opacity-50" />
                </div>

                <div className="border-t border-gray-700/50 pt-4">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Recommended Exercises:</p>
                  <div className="flex flex-wrap gap-2">
                    {skill.recommended_exercises.map((exercise, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300"
                      >
                        {exercise}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Role-Play Scenarios */}
      {coachingPlan.role_play_scenarios && coachingPlan.role_play_scenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Recommended Role-Play Scenarios</h4>
            <span className="text-xs text-gray-500">Practice these situations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coachingPlan.role_play_scenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/30 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white leading-relaxed">{scenario}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/30 text-center"
      >
        <p className="text-white font-medium mb-3">Ready to improve?</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/trainer"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Start New Session
          </Link>
          <Link
            href="/training"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 border border-gray-700"
          >
            <BookOpen className="w-4 h-4" />
            View Training Library
          </Link>
        </div>
      </motion.div>
    </div>
  )
}


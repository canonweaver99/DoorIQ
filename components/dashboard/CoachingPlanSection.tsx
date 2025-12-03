'use client'

import { motion } from 'framer-motion'
import { Target, BookOpen, Users, ArrowRight, AlertCircle } from 'lucide-react'

interface CoachingPlanSectionProps {
  immediateFixes?: string[]
  skillDevelopment?: string[]
  rolePlayScenarios?: string[]
}

export default function CoachingPlanSection({ 
  immediateFixes = [], 
  skillDevelopment = [],
  rolePlayScenarios = []
}: CoachingPlanSectionProps) {
  if (immediateFixes.length === 0 && skillDevelopment.length === 0 && rolePlayScenarios.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-indigo-500/30 p-6 shadow-2xl mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-space">Coaching Plan</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Immediate Fixes */}
        {immediateFixes.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white font-space">Immediate Fixes</h3>
            </div>
            <ul className="space-y-3">
              {immediateFixes.slice(0, 5).map((fix, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/90 text-sm leading-relaxed">{fix}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Skill Development */}
        {skillDevelopment.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white font-space">Skill Development</h3>
            </div>
            <ul className="space-y-3">
              {skillDevelopment.slice(0, 5).map((skill, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/90 text-sm leading-relaxed">{skill}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Role Play Scenarios */}
        {rolePlayScenarios.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white font-space">Role Play Scenarios</h3>
            </div>
            <ul className="space-y-3">
              {rolePlayScenarios.slice(0, 5).map((scenario, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2"
                >
                  <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-white/90 text-sm leading-relaxed">{scenario}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}


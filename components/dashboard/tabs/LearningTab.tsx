'use client'

import { motion } from 'framer-motion'
import { Award, CheckCircle, Lock, TrendingUp } from 'lucide-react'
import PlaybookSection from '../PlaybookSection'
import UpcomingChallenges from '../UpcomingChallenges'

interface LearningTabProps {
  skillsMastered: { value: number; total: number; percentage: number }
}

const skillsData = [
  { id: 1, name: 'Rapport Building', mastered: true, progress: 100, level: 'Expert' },
  { id: 2, name: 'Discovery Questions', mastered: true, progress: 100, level: 'Expert' },
  { id: 3, name: 'Value Proposition', mastered: true, progress: 100, level: 'Expert' },
  { id: 4, name: 'Objection Handling', mastered: true, progress: 95, level: 'Advanced' },
  { id: 5, name: 'Assumptive Closing', mastered: true, progress: 90, level: 'Advanced' },
  { id: 6, name: 'Urgency Creation', mastered: true, progress: 88, level: 'Advanced' },
  { id: 7, name: 'Social Proof', mastered: true, progress: 85, level: 'Advanced' },
  { id: 8, name: 'Price Anchoring', mastered: true, progress: 82, level: 'Advanced' },
  { id: 9, name: 'Multi-Decision Maker', mastered: false, progress: 65, level: 'Intermediate' },
  { id: 10, name: 'Competitor Comparison', mastered: false, progress: 55, level: 'Intermediate' },
  { id: 11, name: 'Technical Objections', mastered: false, progress: 40, level: 'Beginner' },
  { id: 12, name: 'Contract Negotiations', mastered: false, progress: 30, level: 'Beginner' },
]

export default function LearningTab({ skillsMastered }: LearningTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Skills Mastered - Detailed Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Skills Progress</h3>
            <p className="text-xs text-slate-400">
              {skillsMastered.value} of {skillsMastered.total} skills mastered
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="text-sm font-bold text-purple-400">{skillsMastered.percentage}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skillsMastered.percentage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
            />
          </div>
        </div>

        {/* Individual Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillsData.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                skill.mastered
                  ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {skill.mastered ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-400" />
                    )}
                    <h4 className="text-sm font-semibold text-white">{skill.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{skill.level}</p>
                </div>
                <span className={`text-xs font-bold ${
                  skill.progress >= 80 ? 'text-green-400' : skill.progress >= 60 ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {skill.progress}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                  className={`h-full rounded-full ${
                    skill.mastered
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Playbooks Section - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <PlaybookSection />
        <UpcomingChallenges />
      </motion.div>

      {/* Suggested Next Modules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recommended Training</h3>
            <p className="text-xs text-slate-400">Based on your performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Multi-Decision Maker Scenarios', progress: 65, difficulty: 'Intermediate' },
            { title: 'Advanced Price Objections', progress: 55, difficulty: 'Intermediate' },
            { title: 'Technical Product Questions', progress: 40, difficulty: 'Advanced' },
          ].map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl p-4 cursor-pointer"
            >
              <h4 className="text-sm font-semibold text-white mb-2">{module.title}</h4>
              <p className="text-xs text-slate-400 mb-3">{module.difficulty}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden mr-3">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
                <span className="text-xs text-purple-400 font-semibold">{module.progress}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}


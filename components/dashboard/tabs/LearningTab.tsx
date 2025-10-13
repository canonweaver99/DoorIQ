'use client'

import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import PlaybookSection from '../PlaybookSection'

interface LearningTabProps {
}

export default function LearningTab({}: LearningTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Playbooks Section - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full"
      >
        <PlaybookSection />
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


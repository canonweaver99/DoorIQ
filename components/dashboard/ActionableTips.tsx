'use client'

import { motion } from 'framer-motion'
import { Lightbulb, ArrowRight } from 'lucide-react'

interface ActionableTipsProps {
  tips?: string[]
  lowestScoringMetrics?: Array<{ id: string; title: string; value: number }>
}

export default function ActionableTips({ tips = [], lowestScoringMetrics = [] }: ActionableTipsProps) {
  // Prioritize tips based on lowest scoring metrics
  const prioritizedTips = tips.length > 0 
    ? tips.slice(0, 6)
    : []

  if (prioritizedTips.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-yellow-500/30 p-6 shadow-2xl mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-space">Actionable Tips</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prioritizedTips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/90 text-sm leading-relaxed">{tip}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}










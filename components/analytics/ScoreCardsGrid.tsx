'use client'

import { motion } from 'framer-motion'
import { Users, Target, Shield, Handshake } from 'lucide-react'

interface ScoreCardsGridProps {
  scores: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
}

export function ScoreCardsGrid({ scores }: ScoreCardsGridProps) {
  const coreMetrics = [
    { name: 'Rapport', score: scores.rapport, icon: Users, color: '#10b981' },
    { name: 'Discovery', score: scores.discovery, icon: Target, color: '#3b82f6' },
    { name: 'Objection Handling', score: scores.objection_handling, icon: Shield, color: '#f59e0b' },
    { name: 'Closing', score: scores.closing, icon: Handshake, color: '#8b5cf6' }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {coreMetrics.map((metric, i) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all"
          >
            <div 
              className="absolute top-0 left-0 h-1 rounded-t-2xl"
              style={{ 
                width: `${metric.score}%`,
                background: metric.color
              }}
            />
            <Icon className="w-6 h-6 mb-3" style={{ color: metric.color }} />
            <div className="text-3xl font-bold text-white mb-2 font-space">{metric.score}%</div>
            <div className="text-sm text-slate-300 font-medium font-sans">{metric.name}</div>
          </motion.div>
        )
      })}
    </div>
  )
}

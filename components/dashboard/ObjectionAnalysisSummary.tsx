'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'

interface ObjectionAnalysisSummaryProps {
  totalObjections?: number
  handlingEffectiveness?: number
  commonTypes?: Array<{ type: string; count: number }>
}

export default function ObjectionAnalysisSummary({ 
  totalObjections = 0, 
  handlingEffectiveness = 0,
  commonTypes = []
}: ObjectionAnalysisSummaryProps) {
  if (totalObjections === 0 && commonTypes.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-amber-500/30 p-6 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-space">Objection Analysis</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Objections */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm font-space">Total Objections</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white font-space">{totalObjections}</p>
          <p className="text-xs text-white/60 mt-1">Across recent sessions</p>
        </div>

        {/* Handling Effectiveness */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm font-space">Handling Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white font-space">{handlingEffectiveness}%</p>
          <p className="text-xs text-white/60 mt-1">Effectively handled</p>
        </div>
      </div>

      {/* Common Objection Types */}
      {commonTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white/80 mb-3 font-space">Most Common Types</h3>
          <div className="space-y-2">
            {commonTypes.slice(0, 5).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
              >
                <span className="text-white/90 text-sm capitalize font-space">{item.type.replace(/_/g, ' ')}</span>
                <span className="text-amber-400 font-bold text-sm font-space">{item.count}x</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}





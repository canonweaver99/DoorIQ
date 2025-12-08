'use client'

import { motion } from 'framer-motion'
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface FeedbackSummaryCardsProps {
  strengths?: string[]
  improvements?: string[]
}

export default function FeedbackSummaryCards({ strengths = [], improvements = [] }: FeedbackSummaryCardsProps) {
  if (strengths.length === 0 && improvements.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Strengths Card */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-space">Top Strengths</h2>
          </div>
          <ul className="space-y-3">
            {strengths.slice(0, 5).map((strength, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                <p className="text-white/90 text-sm leading-relaxed">{strength}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Improvements Card */}
      {improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-orange-500/30 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-space">Areas to Improve</h2>
          </div>
          <ul className="space-y-3">
            {improvements.slice(0, 5).map((improvement, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                <p className="text-white/90 text-sm leading-relaxed">{improvement}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}






'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Clock, TrendingDown, Award } from 'lucide-react'
import { useState } from 'react'

interface FunnelStage {
  name: string
  percentage: number
  avgTime: string
  dropoffReasons?: string[]
  bestPerformer?: string
  isDropoff?: boolean
}

interface ConversionFunnelProps {
  stages: FunnelStage[]
}

export default function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null)

  const getStageColor = (percentage: number) => {
    if (percentage >= 80) return 'from-purple-600 to-purple-500'
    if (percentage >= 60) return 'from-purple-500 to-pink-500'
    if (percentage >= 40) return 'from-pink-500 to-rose-500'
    return 'from-rose-500 to-red-500'
  }

  const getBiggestDropoff = () => {
    let maxDrop = 0
    let dropoffIndex = -1

    for (let i = 1; i < stages.length; i++) {
      const drop = stages[i - 1].percentage - stages[i].percentage
      if (drop > maxDrop) {
        maxDrop = drop
        dropoffIndex = i
      }
    }

    return dropoffIndex
  }

  const biggestDropoffIndex = getBiggestDropoff()

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => {
        const isExpanded = expandedStage === index
        const isBiggestDropoff = index === biggestDropoffIndex && stage.isDropoff

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <button
              onClick={() => setExpandedStage(isExpanded ? null : index)}
              className="w-full text-left transition-all duration-300 hover:translate-x-1 group"
            >
              <div className="relative">
                {/* Dropoff alert indicator */}
                {isBiggestDropoff && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}

                {/* Main bar */}
                <div
                  className={`
                    relative rounded-xl overflow-hidden border border-white/10
                    ${isBiggestDropoff ? 'ring-2 ring-red-500/50' : ''}
                  `}
                  style={{ width: `${stage.percentage}%`, minWidth: '120px' }}
                >
                  <motion.div
                    className={`
                      h-14 bg-gradient-to-r ${getStageColor(stage.percentage)}
                      flex items-center justify-between px-4
                    `}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-white font-medium text-sm truncate">
                        {stage.name}
                      </span>
                      {stage.dropoffReasons && (
                        <ChevronRight
                          className={`w-4 h-4 text-white/60 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-white font-bold text-lg whitespace-nowrap ml-2">
                      {stage.percentage}%
                    </span>
                  </motion.div>

                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>

                {/* Stage metadata below bar */}
                <div className="flex items-center gap-4 mt-2 ml-4 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{stage.avgTime}</span>
                  </div>
                  {stage.bestPerformer && (
                    <div className="flex items-center gap-1 text-purple-300">
                      <Award className="w-3 h-3" />
                      <span>{stage.bestPerformer}</span>
                    </div>
                  )}
                  {isBiggestDropoff && (
                    <div className="flex items-center gap-1 text-red-400 font-medium">
                      <TrendingDown className="w-3 h-3" />
                      <span>Biggest Drop</span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExpanded && stage.dropoffReasons && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 ml-8 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                    <h4 className="text-xs uppercase tracking-wider text-white/50 mb-2">
                      Common Drop-off Reasons
                    </h4>
                    <ul className="space-y-1.5">
                      {stage.dropoffReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-white/70 flex items-start gap-2"
                        >
                          <span className="text-purple-400 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}


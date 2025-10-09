'use client'

import { motion } from 'framer-motion'
import { TrendingUp, AlertTriangle, Target, BookOpen, Zap, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export type InsightType = 'pattern' | 'anomaly' | 'opportunity' | 'coaching' | 'predictor'

interface Insight {
  type: InsightType
  title: string
  description: string
  confidence: number
  priority: 'high' | 'medium' | 'low'
}

interface AIInsightsPanelProps {
  insights: Insight[]
  onRefresh?: () => void
  refreshing?: boolean
}

const insightIcons = {
  pattern: TrendingUp,
  anomaly: AlertTriangle,
  opportunity: Target,
  coaching: BookOpen,
  predictor: Zap
}

const insightColors = {
  pattern: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/5',
    icon: 'text-purple-400',
    glow: 'shadow-purple-500/10'
  },
  anomaly: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    icon: 'text-red-400',
    glow: 'shadow-red-500/10'
  },
  opportunity: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/5',
    icon: 'text-green-400',
    glow: 'shadow-green-500/10'
  },
  coaching: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/10'
  },
  predictor: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/10'
  }
}

export default function AIInsightsPanel({ insights, onRefresh, refreshing = false }: AIInsightsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => {
        const Icon = insightIcons[insight.type]
        const colors = insightColors[insight.type]
        const isExpanded = expandedIndex === index

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              bg-white/[0.02] border border-white/[0.08] rounded-xl
              ${colors.border} border-l-4 overflow-hidden
              hover:border-white/[0.12] transition-all duration-200
              ${colors.glow} shadow-lg
            `}
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg} mt-0.5`}>
                  <Icon className={`w-4 h-4 ${colors.icon}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white truncate">
                      {insight.title}
                    </h3>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full border uppercase tracking-wider
                      ${getPriorityBadge(insight.priority)}
                    `}>
                      {insight.priority}
                    </span>
                  </div>
                  
                  <p className={`
                    text-xs text-white/60 leading-relaxed
                    ${!isExpanded && 'line-clamp-2'}
                  `}>
                    {insight.description}
                  </p>

                  {/* Confidence bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/40">Confidence</span>
                      <span className="text-xs text-white/60 font-medium">
                        {insight.confidence}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${
                          insight.confidence >= 80
                            ? 'from-green-500 to-emerald-500'
                            : insight.confidence >= 60
                            ? 'from-blue-500 to-cyan-500'
                            : 'from-amber-500 to-yellow-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )
      })}

      {/* Refresh button */}
      {onRefresh && (
        <motion.button
          onClick={onRefresh}
          disabled={refreshing}
          className={`
            w-full py-3 px-4 rounded-xl border border-white/[0.08]
            bg-white/[0.02] hover:bg-white/[0.04]
            text-white/70 hover:text-white
            flex items-center justify-center gap-2
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          whileHover={{ scale: refreshing ? 1 : 1.02 }}
          whileTap={{ scale: refreshing ? 1 : 0.98 }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">
            {refreshing ? 'Generating...' : 'Generate New Insights'}
          </span>
        </motion.button>
      )}
    </div>
  )
}


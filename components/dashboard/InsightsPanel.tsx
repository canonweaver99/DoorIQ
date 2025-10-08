'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react'

interface Insight {
  id: number
  text: string
  action: string
  type: 'success' | 'suggestion' | 'insight' | 'warning'
}

interface InsightsPanelProps {
  insights: Insight[]
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return TrendingUp
      case 'suggestion':
        return Lightbulb
      case 'warning':
        return AlertCircle
      default:
        return Sparkles
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: 'from-green-600/20 to-emerald-600/20', border: 'border-green-500/30', text: 'text-green-400', icon: 'bg-green-500/10' }
      case 'suggestion':
        return { bg: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'bg-blue-500/10' }
      case 'warning':
        return { bg: 'from-amber-600/20 to-orange-600/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'bg-amber-500/10' }
      default:
        return { bg: 'from-purple-600/20 to-indigo-600/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'bg-purple-500/10' }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI Performance Insights</h3>
          <p className="text-xs text-slate-400">Personalized recommendations</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = getIcon(insight.type)
          const colors = getColors(insight.type)

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className={`relative bg-white/5 border ${colors.border} rounded-xl p-4 transition-all duration-300`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 ${colors.icon} rounded-lg border ${colors.border}`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-relaxed mb-3">{insight.text}</p>
                    
                    <button className={`inline-flex items-center gap-2 text-xs font-medium ${colors.text} hover:gap-3 transition-all duration-200`}>
                      {insight.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}


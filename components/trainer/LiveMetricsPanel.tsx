'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, AlertTriangle, Sparkles } from 'lucide-react'
import { LiveSessionMetrics } from '@/lib/trainer/types'

interface LiveMetricsPanelProps {
  metrics: LiveSessionMetrics
}

export function LiveMetricsPanel({ metrics }: LiveMetricsPanelProps) {
  const { talkTimeRatio, objectionCount, techniquesUsed } = metrics

  // Determine talk time status
  const getTalkTimeStatus = () => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return { color: 'text-emerald-400', badge: 'Great balance!', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
    } else if ((talkTimeRatio >= 35 && talkTimeRatio < 40) || (talkTimeRatio > 60 && talkTimeRatio <= 70)) {
      return { color: 'text-amber-400', badge: 'OK', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
    } else if (talkTimeRatio < 35) {
      return { color: 'text-rose-400', badge: 'Try to listen more', bg: 'bg-rose-500/10', border: 'border-rose-500/30' }
    } else {
      return { color: 'text-rose-400', badge: 'Engage more', bg: 'bg-rose-500/10', border: 'border-rose-500/30' }
    }
  }

  const talkTimeStatus = getTalkTimeStatus()

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Talk Time Ratio */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="px-6 py-5 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="mb-3"
            >
              <Mic className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div className="text-4xl font-bold text-white mb-2">{talkTimeRatio}%</div>
            <div className="text-sm font-medium text-gray-400 text-center mb-2">Talk Time Ratio</div>
            <div className={`text-xs px-2 py-1 rounded-full ${talkTimeStatus.bg} ${talkTimeStatus.border} border ${talkTimeStatus.color} font-medium`}>
              {talkTimeStatus.badge}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Objections Detected */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="h-full bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="px-6 py-5 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: objectionCount > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: objectionCount > 0 ? Infinity : 0, repeatDelay: 2 }}
              className="mb-3"
            >
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </motion.div>
            <div className="text-4xl font-bold text-white mb-2">{objectionCount}</div>
            <div className="text-sm font-medium text-gray-400 text-center">Objections Detected</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Techniques Used */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="h-full bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="px-6 py-5 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: techniquesUsed.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: techniquesUsed.length > 0 ? Infinity : 0, repeatDelay: 2 }}
              className="mb-3"
            >
              <Sparkles className="w-8 h-8 text-green-400" />
            </motion.div>
            <div className="text-4xl font-bold text-white mb-2">{techniquesUsed.length}</div>
            <div className="text-sm font-medium text-gray-400 text-center mb-1">Techniques Used</div>
            {techniquesUsed.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-center line-clamp-1">
                {techniquesUsed[0]}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}


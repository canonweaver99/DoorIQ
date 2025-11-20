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

  return (
    <div className="grid grid-cols-3 gap-3 h-full">
      {/* Talk Time Ratio */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 transition-colors">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="mb-2"
            >
              <Mic className="w-6 h-6 text-blue-400" />
            </motion.div>
            <div className="text-2xl font-bold text-white mb-1">{talkTimeRatio}%</div>
            <div className="text-xs text-slate-400 text-center">Talk Time Ratio</div>
            <div className="text-xs text-slate-500 mt-1">
              {talkTimeRatio > 60 ? 'Too High' : talkTimeRatio < 40 ? 'Too Low' : 'Ideal'}
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
        <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-yellow-500/50 transition-colors">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: objectionCount > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: objectionCount > 0 ? Infinity : 0, repeatDelay: 2 }}
              className="mb-2"
            >
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <div className="text-2xl font-bold text-white mb-1">{objectionCount}</div>
            <div className="text-xs text-slate-400 text-center">Objections Detected</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Techniques Used */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="h-full bg-slate-800/50 border-slate-700/50 hover:border-green-500/50 transition-colors">
          <CardContent className="p-4 flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ scale: techniquesUsed.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5, repeat: techniquesUsed.length > 0 ? Infinity : 0, repeatDelay: 2 }}
              className="mb-2"
            >
              <Sparkles className="w-6 h-6 text-green-400" />
            </motion.div>
            <div className="text-2xl font-bold text-white mb-1">{techniquesUsed.length}</div>
            <div className="text-xs text-slate-400 text-center">Techniques Used</div>
            {techniquesUsed.length > 0 && (
              <div className="text-xs text-slate-500 mt-1 text-center line-clamp-1">
                {techniquesUsed[0]}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}


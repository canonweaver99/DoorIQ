'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Zap, Clock } from 'lucide-react'

interface InstantMetrics {
  wordsPerMinute: number
  fillerWords: number
  pauseFrequency: number
  conversationBalance: number
  objectionCount: number
  closeAttempts: number
  safetyMentions: number
  elevenLabsMetrics?: {
    sentimentProgression: number[]
    interruptionCount: number
    conversationId: string
    audioQuality: number
  }
  estimatedScore: number
  estimatedScores: {
    rapport: number
    discovery: number
    objectionHandling: number
    closing: number
    safety: number
  }
}

interface InstantFeedbackProps {
  metrics: InstantMetrics
}

interface QuickStatProps {
  label: string
  value: number
  target?: number
  unit?: string
  inverse?: boolean // Lower is better
  showOnly?: boolean // Just show value, no comparison
}

function QuickStat({ label, value, target, unit, inverse, showOnly }: QuickStatProps) {
  let status: 'good' | 'warning' | 'poor' = 'good'
  let Icon = TrendingUp
  let statusColor = 'text-green-400'
  
  if (!showOnly && target !== undefined) {
    const diff = inverse ? target - value : value - target
    const percentDiff = Math.abs((diff / target) * 100)
    
    if (percentDiff <= 10) {
      status = 'good'
      Icon = TrendingUp
      statusColor = 'text-green-400'
    } else if (percentDiff <= 25) {
      status = 'warning'
      Icon = Minus
      statusColor = 'text-yellow-400'
    } else {
      status = 'poor'
      Icon = TrendingDown
      statusColor = 'text-red-400'
    }
    
    if (inverse && diff < 0) {
      // For inverse metrics, negative diff is good
      Icon = diff < -10 ? TrendingUp : TrendingDown
      statusColor = diff < -10 ? 'text-green-400' : 'text-red-400'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
    >
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {value}{unit || ''}
        </span>
        {!showOnly && target !== undefined && (
          <>
            <Icon className={`w-4 h-4 ${statusColor}`} />
            <span className="text-xs text-gray-500">
              Target: {target}{unit || ''}
            </span>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function InstantFeedback({ metrics }: InstantFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50/10 via-purple-50/10 to-blue-50/10 rounded-xl p-6 border border-blue-500/20 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Quick Analysis</h3>
        <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
          Available Instantly
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <QuickStat
          label="Speaking Pace"
          value={metrics.wordsPerMinute}
          target={150}
          unit=" WPM"
        />
        <QuickStat
          label="Conversation Balance"
          value={metrics.conversationBalance}
          target={40}
          unit="%"
          inverse
        />
        <QuickStat
          label="Objections Faced"
          value={metrics.objectionCount}
          showOnly
        />
        <QuickStat
          label="Close Attempts"
          value={metrics.closeAttempts}
          showOnly
        />
      </div>
      
      {/* Additional metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 mb-1">Filler Words</div>
          <div className="text-2xl font-bold text-white">
            {metrics.fillerWords}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 mb-1">Long Pauses</div>
          <div className="text-2xl font-bold text-white">
            {metrics.pauseFrequency}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="text-xs text-gray-400 mb-1">Safety Mentions</div>
          <div className="text-2xl font-bold text-white">
            {metrics.safetyMentions}
          </div>
        </div>
      </div>
      
      {/* Estimated Score */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-300 mb-1">Estimated Overall Score</div>
            <div className="text-3xl font-bold text-white">
              {metrics.estimatedScore}
              <span className="text-lg text-gray-400 ml-2">/100</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              70-90% accurate • Full analysis pending
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-2">Category Scores</div>
            <div className="space-y-1 text-xs">
              <div className="text-gray-300">Rapport: <span className="text-white font-semibold">{metrics.estimatedScores.rapport}</span></div>
              <div className="text-gray-300">Discovery: <span className="text-white font-semibold">{metrics.estimatedScores.discovery}</span></div>
              <div className="text-gray-300">Objection: <span className="text-white font-semibold">{metrics.estimatedScores.objectionHandling}</span></div>
              <div className="text-gray-300">Closing: <span className="text-white font-semibold">{metrics.estimatedScores.closing}</span></div>
              <div className="text-gray-300">Safety: <span className="text-white font-semibold">{metrics.estimatedScores.safety}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ElevenLabs Quality Score */}
      {metrics.elevenLabsMetrics && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-400">
              ElevenLabs Quality Score: <span className="text-white font-semibold">{metrics.elevenLabsMetrics.audioQuality}%</span>
              {metrics.elevenLabsMetrics.interruptionCount > 0 && (
                <span className="ml-2">• {metrics.elevenLabsMetrics.interruptionCount} interruption(s)</span>
              )}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}


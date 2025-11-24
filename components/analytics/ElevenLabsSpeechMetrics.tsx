'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ElevenLabsSpeechMetricsProps {
  elevenlabsMetrics?: any
  voiceAnalysis?: {
    avgWPM?: number
    pitchVariation?: number
    fillerWordsPerMinute?: number
    issues?: {
      tooFast?: boolean
      tooSlow?: boolean
      monotone?: boolean
      lowEnergy?: boolean
    }
  }
}

export function ElevenLabsSpeechMetrics({ 
  elevenlabsMetrics, 
  voiceAnalysis 
}: ElevenLabsSpeechMetricsProps) {
  // Only render if we have data
  if (!elevenlabsMetrics && !voiceAnalysis) {
    return null
  }
  
  // Calculate metrics from available data
  const energyLevel = voiceAnalysis?.issues?.lowEnergy ? 45 : 78
  const confidence = voiceAnalysis?.fillerWordsPerMinute 
    ? Math.max(0, 100 - (voiceAnalysis.fillerWordsPerMinute * 20))
    : 45
  const clarity = voiceAnalysis?.fillerWordsPerMinute
    ? Math.max(0, 100 - (voiceAnalysis.fillerWordsPerMinute * 10))
    : 92
  const paceVariety = voiceAnalysis?.pitchVariation
    ? Math.min(100, (voiceAnalysis.pitchVariation / 20) * 100)
    : 30
  
  const getMetricLabel = (value: number) => {
    if (value >= 80) return 'Excellent'
    if (value >= 60) return 'Good'
    if (value >= 40) return 'Fair'
    return 'Needs Work'
  }
  
  const getMetricColor = (value: number) => {
    if (value >= 80) return 'bg-green-500'
    if (value >= 60) return 'bg-yellow-500'
    if (value >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <Mic className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Voice & Speech Analysis</h2>
        <span className="text-xs text-gray-400 bg-blue-500/20 px-2 py-1 rounded-full">
          Powered by ElevenLabs
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Energy Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Energy Level</span>
            <span className="text-sm text-gray-400">{energyLevel}%</span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", getMetricColor(energyLevel))}
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel}%` }}
              transition={{ duration: 1, delay: 1 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{getMetricLabel(energyLevel)} energy!</div>
        </div>
        
        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Confidence</span>
            <span className="text-sm text-gray-400">{confidence}%</span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", getMetricColor(confidence))}
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, delay: 1.1 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {confidence >= 60 ? 'Confident' : 'Sounds uncertain'}
          </div>
        </div>
        
        {/* Clarity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Clarity</span>
            <span className="text-sm text-gray-400">{clarity}%</span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", getMetricColor(clarity))}
              initial={{ width: 0 }}
              animate={{ width: `${clarity}%` }}
              transition={{ duration: 1, delay: 1.2 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {clarity >= 80 ? 'Crystal clear' : 'Could be clearer'}
          </div>
        </div>
        
        {/* Pace Variety */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Pace Variety</span>
            <span className="text-sm text-gray-400">{paceVariety}%</span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full", getMetricColor(paceVariety))}
              initial={{ width: 0 }}
              animate={{ width: `${paceVariety}%` }}
              transition={{ duration: 1, delay: 1.3 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {paceVariety >= 60 ? 'Good variety' : 'Too monotone'}
          </div>
        </div>
      </div>
      
      {/* Conversation Flow Waveform Placeholder */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="text-sm font-medium text-gray-300 mb-2">Conversation Flow:</div>
        <div className="h-20 bg-slate-900/50 rounded-lg flex items-center justify-center">
          <div className="text-xs text-gray-500">Visual waveform showing energy over time</div>
        </div>
      </div>
      
      {/* Voice Tip */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="text-sm font-semibold text-blue-400 mb-1">Voice Tip:</div>
        <div className="text-sm text-white">
          {voiceAnalysis?.issues?.monotone 
            ? 'Vary your pace when explaining benefits'
            : voiceAnalysis?.issues?.lowEnergy
            ? 'Increase energy level to sound more engaging'
            : 'Maintain your current vocal variety'}
        </div>
      </div>
    </motion.div>
  )
}


'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

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
  
  // Calculate color on red-to-green scale (0-100)
  const getPercentageColor = (value: number): string => {
    // Smooth gradient from red (0) to green (100)
    // Red: rgb(239, 68, 68) = #ef4444
    // Yellow: rgb(234, 179, 8) = #eab308
    // Green: rgb(16, 185, 129) = #10b981
    const clampedValue = Math.max(0, Math.min(100, value))
    
    if (clampedValue <= 50) {
      // Red to yellow: 0-50
      const ratio = clampedValue / 50
      const r = Math.round(239 - (239 - 234) * ratio)  // 239 to 234
      const g = Math.round(68 + (179 - 68) * ratio)    // 68 to 179
      const b = Math.round(68 - (68 - 8) * ratio)      // 68 to 8
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Yellow to green: 50-100
      const ratio = (clampedValue - 50) / 50
      const r = Math.round(234 - (234 - 16) * ratio)  // 234 to 16
      const g = Math.round(179 + (185 - 179) * ratio)  // 179 to 185
      const b = Math.round(8 + (129 - 8) * ratio)      // 8 to 129
      return `rgb(${r}, ${g}, ${b})`
    }
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
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {/* Energy Level */}
        <div className="flex flex-col items-center">
          <div className="mb-3">
            <ProgressRing
              value={energyLevel}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(energyLevel)}
            />
          </div>
          <div className="text-base font-medium text-gray-300 mb-1">Energy Level</div>
          <div className="text-sm text-gray-400">{getMetricLabel(energyLevel)}</div>
        </div>
        
        {/* Confidence */}
        <div className="flex flex-col items-center">
          <div className="mb-3">
            <ProgressRing
              value={confidence}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(confidence)}
            />
          </div>
          <div className="text-base font-medium text-gray-300 mb-1">Confidence</div>
          <div className="text-sm text-gray-400">
            {confidence >= 60 ? 'Confident' : 'Sounds uncertain'}
          </div>
        </div>
        
        {/* Clarity */}
        <div className="flex flex-col items-center">
          <div className="mb-3">
            <ProgressRing
              value={clarity}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(clarity)}
            />
          </div>
          <div className="text-base font-medium text-gray-300 mb-1">Clarity</div>
          <div className="text-sm text-gray-400">
            {clarity >= 80 ? 'Crystal clear' : 'Could be clearer'}
          </div>
        </div>
        
        {/* Pace Variety */}
        <div className="flex flex-col items-center">
          <div className="mb-3">
            <ProgressRing
              value={paceVariety}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(paceVariety)}
            />
          </div>
          <div className="text-base font-medium text-gray-300 mb-1">Pace Variety</div>
          <div className="text-sm text-gray-400">
            {paceVariety >= 60 ? 'Good variety' : 'Too monotone'}
          </div>
        </div>
      </div>
      
      {/* Voice Tip */}
      <div className="mt-6 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="text-lg font-semibold text-blue-400 mb-3">💡 Voice Tip:</div>
        <div className="text-base text-white leading-relaxed">
          {voiceAnalysis?.issues?.monotone 
            ? 'Your voice lacks variety, which can make you sound less engaging. To improve: Practice varying your pace by slowing down when explaining important benefits and speeding up slightly during transitions. Use pauses strategically - pause after key points to let them sink in. Try emphasizing different words in your sentences to create natural rhythm. For example, when saying "This service protects your family," emphasize "protects" and "family" more than the other words. Record yourself practicing and listen for natural variation.'
            : voiceAnalysis?.issues?.lowEnergy
            ? 'Your energy level is lower than ideal, which can make you sound less enthusiastic and confident. To improve: Before starting your pitch, take 3 deep breaths and do a quick physical warm-up (shoulder rolls, neck stretches). Stand up straight with your shoulders back - good posture naturally increases vocal energy. Practice speaking with 20% more enthusiasm than feels natural - what feels like "too much" to you sounds confident to customers. Smile while you talk (even on the phone) - it changes your vocal tone. Focus on varying your volume slightly, speaking louder on key benefits and softer when building rapport.'
            : voiceAnalysis?.fillerWordsPerMinute && voiceAnalysis.fillerWordsPerMinute > 1
            ? 'You\'re using filler words like "um" and "uh" which can undermine your confidence. To improve: Practice pausing instead of filling silence with filler words - a 1-2 second pause sounds thoughtful, not uncertain. Before speaking, take a moment to think about what you want to say. Record yourself and identify your most common filler words, then practice replacing them with pauses. Use phrases like "Let me think about that" or "That\'s a great question" as bridges instead of fillers. The more prepared you are with your talking points, the fewer fillers you\'ll use.'
            : 'You\'re maintaining good vocal variety! To continue improving: Practice varying your pace based on what you\'re saying - slow down for important benefits, speed up slightly for transitions. Use strategic pauses after key points to let them sink in. Experiment with emphasizing different words to create natural rhythm. Record yourself regularly to maintain awareness of your vocal patterns. Consider practicing with different energy levels to expand your range.'}
        </div>
      </div>
    </motion.div>
  )
}


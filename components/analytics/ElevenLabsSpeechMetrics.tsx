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
    totalFillerWords?: number
    volumeConsistency?: number
    avgPitch?: number
    minPitch?: number
    maxPitch?: number
    issues?: {
      tooFast?: boolean
      tooSlow?: boolean
      monotone?: boolean
      lowEnergy?: boolean
    }
  }
  instantMetrics?: any
  transcript?: any[]
  durationSeconds?: number
  speechGradingError?: boolean | string // Track if ElevenLabs speech grading failed
}

export function ElevenLabsSpeechMetrics({ 
  elevenlabsMetrics, 
  voiceAnalysis,
  instantMetrics,
  transcript,
  durationSeconds,
  speechGradingError
}: ElevenLabsSpeechMetricsProps) {
  // Calculate metrics from available data sources (voice_analysis, instant_metrics, or transcript)
  
  // Calculate WPM from transcript if not available in voice_analysis
  const calculateWPM = () => {
    if (voiceAnalysis?.avgWPM) return voiceAnalysis.avgWPM
    if (instantMetrics?.wordsPerMinute) return instantMetrics.wordsPerMinute
    if (transcript && durationSeconds) {
      const repLines = transcript.filter((t: any) => t.speaker === 'rep' || t.speaker === 'user')
      const totalWords = repLines.reduce((sum: number, line: any) => {
        const text = line.text || line.message || ''
        return sum + text.split(/\s+/).filter((w: string) => w.length > 0).length
      }, 0)
      return Math.round((totalWords / durationSeconds) * 60)
    }
    return 0
  }
  
  // Calculate filler words per minute from transcript if not available
  const calculateFillerWordsPerMinute = () => {
    if (voiceAnalysis?.fillerWordsPerMinute !== undefined) return voiceAnalysis.fillerWordsPerMinute
    if (transcript && durationSeconds) {
      const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm)\b/gi
      const repLines = transcript.filter((t: any) => t.speaker === 'rep' || t.speaker === 'user')
      const totalFillers = repLines.reduce((sum: number, line: any) => {
        const text = line.text || line.message || ''
        const matches = text.match(fillerPattern)
        return sum + (matches ? matches.length : 0)
      }, 0)
      return durationSeconds > 0 ? (totalFillers / durationSeconds) * 60 : 0
    }
    return 0
  }
  
  const wpm = calculateWPM()
  const fillerWordsPerMinute = calculateFillerWordsPerMinute()
  
  // Calculate total filler words
  const totalFillerWords = voiceAnalysis?.totalFillerWords !== undefined
    ? voiceAnalysis.totalFillerWords
    : transcript && durationSeconds
      ? Math.round(fillerWordsPerMinute * (durationSeconds / 60))
      : 0
  
  // Get pitch variation (upspeak indicator)
  const pitchVariation = voiceAnalysis?.pitchVariation || 0
  
  // Get volume consistency
  const volumeConsistency = voiceAnalysis?.volumeConsistency !== undefined
    ? voiceAnalysis.volumeConsistency
    : null
  
  // Calculate metrics with fallbacks
  const energyLevel = voiceAnalysis?.issues?.lowEnergy ? 45 : (wpm > 0 ? 75 : 70)
  const confidence = fillerWordsPerMinute > 0
    ? Math.max(0, 100 - (fillerWordsPerMinute * 20))
    : (wpm > 0 ? 75 : 70)
  const clarity = fillerWordsPerMinute > 0
    ? Math.max(0, 100 - (fillerWordsPerMinute * 10))
    : (wpm > 0 ? 85 : 80)
  const paceVariety = voiceAnalysis?.pitchVariation
    ? Math.min(100, (voiceAnalysis.pitchVariation / 20) * 100)
    : (wpm > 0 && wpm >= 140 && wpm <= 160 ? 65 : 50)
  
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
  
  // Check if ElevenLabs speech grading failed
  const hasGradingError = speechGradingError === true || typeof speechGradingError === 'string'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-space">Voice & Speech Analysis</h2>
        <span className="text-xs sm:text-sm text-white font-sans font-medium bg-blue-500/20 px-2 py-1 rounded-full self-start sm:self-auto">
          Powered by ElevenLabs
        </span>
      </div>
      
      {/* Error message if ElevenLabs speech grading failed */}
      {hasGradingError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-1 font-space">Speech Analysis Unavailable</h3>
              <p className="text-sm text-red-300/90 font-sans">
                {typeof speechGradingError === 'string' 
                  ? speechGradingError 
                  : 'ElevenLabs speech grading failed to process this session. Basic metrics are shown below using transcript analysis.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
        {/* Energy Level */}
        <div className="flex flex-col items-center">
          <div className="mb-2 sm:mb-3 scale-75 sm:scale-90 md:scale-100">
            <ProgressRing
              value={energyLevel}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(energyLevel)}
            />
          </div>
          <div className="text-xs sm:text-sm md:text-lg font-semibold text-white mb-0.5 sm:mb-1 font-sans text-center px-1 break-words">Energy Level</div>
          <div className="text-xs sm:text-sm md:text-base text-white font-sans font-medium text-center px-1">{getMetricLabel(energyLevel)}</div>
        </div>
        
        {/* Confidence */}
        <div className="flex flex-col items-center">
          <div className="mb-2 sm:mb-3 scale-75 sm:scale-90 md:scale-100">
            <ProgressRing
              value={confidence}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(confidence)}
            />
          </div>
          <div className="text-xs sm:text-sm md:text-lg font-semibold text-white mb-0.5 sm:mb-1 font-sans text-center px-1 break-words">Confidence</div>
          <div className="text-xs sm:text-sm md:text-base text-white font-sans font-medium text-center px-1">
            {confidence >= 60 ? 'Confident' : 'Sounds uncertain'}
          </div>
        </div>
        
        {/* Clarity */}
        <div className="flex flex-col items-center">
          <div className="mb-2 sm:mb-3 scale-75 sm:scale-90 md:scale-100">
            <ProgressRing
              value={clarity}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(clarity)}
            />
          </div>
          <div className="text-xs sm:text-sm md:text-lg font-semibold text-white mb-0.5 sm:mb-1 font-sans text-center px-1 break-words">Clarity</div>
          <div className="text-xs sm:text-sm md:text-base text-white font-sans font-medium text-center px-1">
            {clarity >= 80 ? 'Crystal clear' : 'Could be clearer'}
          </div>
        </div>
        
        {/* Pace Variety */}
        <div className="flex flex-col items-center">
          <div className="mb-2 sm:mb-3 scale-75 sm:scale-90 md:scale-100">
            <ProgressRing
              value={paceVariety}
              max={100}
              size={120}
              strokeWidth={10}
              color={getPercentageColor(paceVariety)}
            />
          </div>
          <div className="text-xs sm:text-sm md:text-lg font-semibold text-white mb-0.5 sm:mb-1 font-sans text-center px-1 break-words">Pace Variety</div>
          <div className="text-xs sm:text-sm md:text-base text-white font-sans font-medium text-center px-1">
            {paceVariety >= 60 ? 'Good variety' : 'Too monotone'}
          </div>
        </div>
      </div>
      
      {/* Voice Tip */}
      <div className="mt-6 p-4 sm:p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="text-lg sm:text-xl font-bold text-blue-400 mb-2 sm:mb-3 font-space">💡 Voice Tip:</div>
        <div className="text-sm sm:text-base md:text-lg text-white leading-relaxed font-sans font-medium">
          {voiceAnalysis?.issues?.monotone || (paceVariety < 50 && wpm > 0)
            ? 'Your voice lacks variety. Practice varying your pace by slowing down for important benefits and speeding up during transitions. Use strategic pauses after key points and emphasize different words to create natural rhythm.'
            : voiceAnalysis?.issues?.lowEnergy || energyLevel < 60
            ? 'Your energy level is lower than ideal. Before starting, take 3 deep breaths and stand up straight. Good posture increases vocal energy. Practice speaking with 20% more enthusiasm and smile while you talk.'
            : fillerWordsPerMinute > 1
            ? 'You\'re using filler words like "um" and "uh" which can undermine confidence. Practice pausing instead. A 1-2 second pause sounds thoughtful, not uncertain. Record yourself to identify your most common filler words.'
            : 'You\'re maintaining good vocal variety! Continue improving by varying your pace. Slow down for important benefits, speed up for transitions. Use strategic pauses after key points.'}
        </div>
      </div>
    </motion.div>
  )
}


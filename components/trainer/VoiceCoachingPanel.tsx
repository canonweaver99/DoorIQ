'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Volume2, Gauge, TrendingUp } from 'lucide-react'
import { VoiceMetrics } from '@/lib/trainer/types'

interface VoiceCoachingPanelProps {
  metrics: VoiceMetrics
}

// Get status color based on metric value
function getPitchStatus(pitch: number): { color: string; status: string } {
  if (pitch === 0) return { color: 'text-slate-500', status: 'No signal' }
  if (pitch >= 85 && pitch <= 180) return { color: 'text-green-400', status: 'Good (Male)' }
  if (pitch >= 165 && pitch <= 255) return { color: 'text-green-400', status: 'Good (Female)' }
  if (pitch > 255) return { color: 'text-yellow-400', status: 'High' }
  if (pitch < 85) return { color: 'text-yellow-400', status: 'Low' }
  return { color: 'text-slate-400', status: 'Out of range' }
}

function getVolumeStatus(volume: number): { color: string; status: string } {
  if (volume < -50) return { color: 'text-slate-500', status: 'No signal' }
  if (volume < -30) return { color: 'text-red-400', status: 'Too soft' }
  if (volume > -10) return { color: 'text-yellow-400', status: 'Too loud' }
  return { color: 'text-green-400', status: 'Good' }
}

function getSpeechRateStatus(wpm: number): { color: string; status: string } {
  if (wpm === 0) return { color: 'text-slate-500', status: 'No speech' }
  if (wpm > 180) return { color: 'text-red-400', status: 'Too fast' }
  if (wpm < 120) return { color: 'text-yellow-400', status: 'Too slow' }
  if (wpm >= 140 && wpm <= 160) return { color: 'text-green-400', status: 'Ideal' }
  return { color: 'text-yellow-400', status: 'OK' }
}

function getPitchVariationStatus(variation: number): { color: string; status: string } {
  if (variation === 0) return { color: 'text-slate-500', status: 'No data' }
  if (variation < 15) return { color: 'text-red-400', status: 'Monotone' }
  if (variation >= 15 && variation <= 30) return { color: 'text-green-400', status: 'Good' }
  return { color: 'text-yellow-400', status: 'High variation' }
}

export function VoiceCoachingPanel({ metrics }: VoiceCoachingPanelProps) {
  const { currentPitch, averagePitch, volume, speechRate, pitchVariation } = metrics
  
  const pitchStatus = getPitchStatus(currentPitch)
  const volumeStatus = getVolumeStatus(volume)
  const speechRateStatus = getSpeechRateStatus(speechRate)
  const variationStatus = getPitchVariationStatus(pitchVariation)
  
  // Calculate volume bar percentage (0-100%)
  const volumePercentage = Math.max(0, Math.min(100, ((volume + 60) / 60) * 100))
  
  return (
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Mic className="w-4 h-4 text-purple-400" />
          Voice Coaching
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Pitch Display */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">Pitch</span>
              </div>
              <span className={`text-xs font-medium ${pitchStatus.color}`}>
                {pitchStatus.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {currentPitch > 0 ? `${currentPitch}` : '--'}
              </span>
              <span className="text-xs text-slate-500">Hz</span>
            </div>
            {averagePitch > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                Avg: {averagePitch} Hz
              </div>
            )}
            <div className="text-xs text-slate-600 mt-2">
              Ideal: 85-180 Hz (M) / 165-255 Hz (F)
            </div>
          </CardContent>
        </Card>
        
        {/* Volume Meter */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">Volume</span>
              </div>
              <span className={`text-xs font-medium ${volumeStatus.color}`}>
                {volumeStatus.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    volumePercentage < 33 ? 'bg-red-500' :
                    volumePercentage < 66 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${volumePercentage}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <span className="text-xs text-slate-400 min-w-[3rem] text-right">
                {volume > -60 ? `${volume} dB` : '--'}
              </span>
            </div>
            <div className="text-xs text-slate-600">
              Ideal: -30 to -10 dB
            </div>
          </CardContent>
        </Card>
        
        {/* Speech Rate */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">Speech Rate</span>
              </div>
              <span className={`text-xs font-medium ${speechRateStatus.color}`}>
                {speechRateStatus.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {speechRate > 0 ? `${speechRate}` : '--'}
              </span>
              <span className="text-xs text-slate-500">WPM</span>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Ideal: 140-160 WPM
            </div>
          </CardContent>
        </Card>
        
        {/* Pitch Variation */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Pitch Variation</span>
              </div>
              <span className={`text-xs font-medium ${variationStatus.color}`}>
                {variationStatus.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {pitchVariation > 0 ? `${pitchVariation}` : '--'}
              </span>
              <span className="text-xs text-slate-500">%</span>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Ideal: 15-30% variation
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


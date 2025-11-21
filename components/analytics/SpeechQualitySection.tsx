'use client'

import { useMemo } from 'react'
import { VoiceAnalysisData } from '@/lib/trainer/types'
import { motion } from 'framer-motion'
import { Mic, Volume2, Sparkles, Clock, Waves } from 'lucide-react'

interface SpeechQualitySectionProps {
  voiceAnalysis: VoiceAnalysisData
  durationSeconds: number
}

// Calculate overall speech score
function calculateSpeechScore(data: VoiceAnalysisData): number {
  // Pace (25%): 100 if 140-160 WPM, deduct 2 points per WPM outside range
  let paceScore = 100
  if (data.avgWPM < 140) {
    paceScore = Math.max(0, 100 - (140 - data.avgWPM) * 2)
  } else if (data.avgWPM > 160) {
    paceScore = Math.max(0, 100 - (data.avgWPM - 160) * 2)
  }
  
  // Variety (25%): 100 if >20% pitch variation, scale down linearly
  const varietyScore = Math.min(100, (data.pitchVariation / 20) * 100)
  
  // Energy (25%): Based on avg volume (-30 to -10 dB ideal) and consistency
  let energyScore = 100
  if (data.avgVolume < -35) {
    energyScore = Math.max(0, 100 + (data.avgVolume + 35) * 2) // Too quiet
  } else if (data.avgVolume > -10) {
    energyScore = Math.max(0, 100 - (data.avgVolume + 10) * 2) // Too loud
  }
  // Deduct for inconsistency
  const consistencyPenalty = Math.min(30, data.volumeConsistency / 2)
  energyScore = Math.max(0, energyScore - consistencyPenalty)
  
  // Clarity (25%): Deduct 5 points per filler word per minute, 3 points per long pause
  let clarityScore = 100
  clarityScore -= data.fillerWordsPerMinute * 5
  const pausePenalty = data.longPausesCount * 3
  clarityScore -= pausePenalty
  clarityScore = Math.max(0, clarityScore)
  
  // Weighted average
  const overallScore = (paceScore * 0.25) + (varietyScore * 0.25) + (energyScore * 0.25) + (clarityScore * 0.25)
  
  return Math.round(overallScore)
}

// Get score color hex for inline styles
function getScoreColorHex(score: number): string {
  if (score >= 85) return '#10b981' // emerald-500
  if (score >= 70) return '#3b82f6' // blue-500
  return '#f59e0b' // amber-500
}

// Get score message
function getScoreMessage(score: number): string {
  if (score >= 85) return 'Excellent vocal delivery!'
  if (score >= 70) return 'Good foundation with room for improvement'
  return 'Focus on vocal clarity and energy'
}

// Metric Card Component
function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  feedback,
  colorHex = '#3b82f6',
  delay = 0 
}: {
  icon: any
  title: string
  value: string | number
  description: string
  feedback?: string
  colorHex?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" style={{ color: colorHex }} />
        <h3 className="text-base font-medium text-white">{title}</h3>
      </div>
      <div className="text-2xl font-bold mb-2" style={{ color: colorHex }}>{value}</div>
      <p className="text-sm text-gray-400 mb-2">{description}</p>
      {feedback && (
        <p className="text-sm text-gray-300">{feedback}</p>
      )}
    </motion.div>
  )
}

export default function SpeechQualitySection({ voiceAnalysis, durationSeconds }: SpeechQualitySectionProps) {
  // Check if we have pitch/volume data (audio analysis) or just transcript-based data
  const hasPitchData = voiceAnalysis.avgPitch > 0 && voiceAnalysis.pitchVariation > 0
  const hasVolumeData = voiceAnalysis.avgVolume > -50 // -60 is default/empty
  
  const overallScore = useMemo(() => {
    // Only calculate full score if we have pitch/volume data
    if (hasPitchData && hasVolumeData) {
      return calculateSpeechScore(voiceAnalysis)
    }
    // Otherwise calculate simplified score based on WPM and fillers only
    let paceScore = 100
    if (voiceAnalysis.avgWPM < 140) {
      paceScore = Math.max(0, 100 - (140 - voiceAnalysis.avgWPM) * 2)
    } else if (voiceAnalysis.avgWPM > 160) {
      paceScore = Math.max(0, 100 - (voiceAnalysis.avgWPM - 160) * 2)
    }
    
    let clarityScore = 100
    clarityScore -= voiceAnalysis.fillerWordsPerMinute * 5
    clarityScore = Math.max(0, clarityScore)
    
    // Weighted average (pace 50%, clarity 50% since we don't have variety/energy)
    return Math.round((paceScore * 0.5) + (clarityScore * 0.5))
  }, [voiceAnalysis, hasPitchData, hasVolumeData])
  
  const scoreColorHex = useMemo(() => getScoreColorHex(overallScore), [overallScore])
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Mic className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Speech Quality Analysis</h2>
          <p className="text-sm text-gray-400">
            {hasPitchData && hasVolumeData 
              ? 'How you sounded during this pitch' 
              : 'Analysis based on transcript (audio analysis not available)'}
          </p>
        </div>
      </div>

      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Overall Speech Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-6"
        >
          <div className="text-base font-medium text-gray-400 mb-2">Overall Speech Score</div>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-2xl font-bold" style={{ color: scoreColorHex }}>
              {overallScore}
            </div>
            <div className="flex-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full transition-all"
                  style={{ backgroundColor: scoreColorHex }}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-4">{getScoreMessage(overallScore)}</p>
          <div className="text-sm text-gray-400">
            {hasPitchData && hasVolumeData 
              ? 'Based on Pace • Variety • Energy • Clarity'
              : 'Based on Pace • Clarity (limited data)'}
          </div>
        </motion.div>

        {/* Right Column - Individual Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pace & Rhythm */}
          <MetricCard
            icon={Clock}
            title="Pace & Rhythm"
            value={`${voiceAnalysis.avgWPM} WPM`}
            description={`Ideal: 140-160 WPM`}
            feedback={
              voiceAnalysis.avgWPM >= 140 && voiceAnalysis.avgWPM <= 160
                ? 'Perfect pace for sales conversations'
                : voiceAnalysis.avgWPM < 140
                ? 'Consider speaking slightly faster'
                : 'Slow down to improve clarity'
            }
            colorHex="#3b82f6"
            delay={0.2}
          />

          {/* Vocal Variety - only show if we have pitch data */}
          {hasPitchData ? (
            <MetricCard
              icon={Waves}
              title="Vocal Variety"
              value={`${voiceAnalysis.pitchVariation.toFixed(1)}%`}
              description={`Range: ${voiceAnalysis.minPitch}-${voiceAnalysis.maxPitch} Hz`}
              feedback={
                voiceAnalysis.pitchVariation >= 20
                  ? 'Great pitch variation'
                  : 'Increase pitch variation to sound more engaging'
              }
              colorHex="#8b5cf6"
              delay={0.3}
            />
          ) : (
            <MetricCard
              icon={Waves}
              title="Vocal Variety"
              value="N/A"
              description="Audio analysis not available"
              feedback="Enable microphone access for pitch analysis"
              colorHex="#6b7280"
              delay={0.3}
            />
          )}

          {/* Energy & Volume - only show if we have volume data */}
          {hasVolumeData ? (
            <MetricCard
              icon={Volume2}
              title="Energy & Volume"
              value={`${voiceAnalysis.avgVolume} dB`}
              description={`Consistency: ${voiceAnalysis.volumeConsistency.toFixed(1)}% variation`}
              feedback={
                voiceAnalysis.avgVolume >= -30 && voiceAnalysis.avgVolume <= -10
                  ? 'Great energy throughout'
                  : voiceAnalysis.avgVolume < -30
                  ? 'Speak up for better presence'
                  : 'Consider speaking slightly softer'
              }
              colorHex="#10b981"
              delay={0.4}
            />
          ) : (
            <MetricCard
              icon={Volume2}
              title="Energy & Volume"
              value="N/A"
              description="Audio analysis not available"
              feedback="Enable microphone access for volume analysis"
              colorHex="#6b7280"
              delay={0.4}
            />
          )}

          {/* Clarity & Confidence */}
          <MetricCard
            icon={Sparkles}
            title="Clarity & Confidence"
            value={`${voiceAnalysis.totalFillerWords} fillers`}
            description={`${voiceAnalysis.fillerWordsPerMinute.toFixed(1)}/min • ${voiceAnalysis.longPausesCount} long pauses`}
            feedback={
              voiceAnalysis.fillerWordsPerMinute < 1
                ? 'Crystal clear communication'
                : voiceAnalysis.fillerWordsPerMinute < 2
                ? 'Good clarity, minor improvements possible'
                : 'Reduce filler words for better confidence'
            }
            colorHex="#eab308"
            delay={0.5}
          />
        </div>
      </div>
    </motion.section>
  )
}

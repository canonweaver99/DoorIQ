'use client'

import { useMemo } from 'react'
import { VoiceAnalysisData } from '@/lib/trainer/types'
import { motion } from 'framer-motion'
import { Mic, TrendingUp, Volume2, Sparkles, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts'

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

// Generate improvement areas
function generateImprovementAreas(data: VoiceAnalysisData): string[] {
  const areas: string[] = []
  
  if (data.issues.tooFast) {
    areas.push(`Slow down when explaining key points - you averaged ${data.avgWPM} WPM (ideal: 140-160)`)
  }
  if (data.issues.tooSlow) {
    areas.push(`Increase your pace slightly - you averaged ${data.avgWPM} WPM (ideal: 140-160)`)
  }
  if (data.issues.monotone) {
    areas.push(`Vary your pitch more to sound engaging - current variation: ${data.pitchVariation}% (target: >20%)`)
  }
  if (data.issues.lowEnergy) {
    areas.push(`Speak with more energy and confidence - your average volume was ${data.avgVolume} dB`)
  }
  if (data.issues.excessiveFillers) {
    areas.push(`Reduce filler words - you used ${data.totalFillerWords} fillers (${data.fillerWordsPerMinute.toFixed(1)}/min). Aim for <1/min`)
  }
  if (data.longPausesCount > 0) {
    areas.push(`Reduce long pauses - you had ${data.longPausesCount} pause${data.longPausesCount > 1 ? 's' : ''} longer than 2 seconds`)
  }
  
  // If no major issues, provide positive reinforcement
  if (areas.length === 0) {
    areas.push('Great vocal delivery! Maintain this energy and clarity in future sessions.')
  }
  
  return areas.slice(0, 5) // Max 5 items
}

export default function SpeechQualitySection({ voiceAnalysis, durationSeconds }: SpeechQualitySectionProps) {
  const overallScore = useMemo(() => calculateSpeechScore(voiceAnalysis), [voiceAnalysis])
  const improvementAreas = useMemo(() => generateImprovementAreas(voiceAnalysis), [voiceAnalysis])
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981' // green
    if (score >= 70) return '#f59e0b' // yellow
    return '#ef4444' // red
  }
  
  const getScoreMessage = (score: number) => {
    if (score >= 85) return 'Excellent vocal delivery!'
    if (score >= 70) return 'Good foundation with room for improvement'
    return 'Focus on vocal clarity and energy'
  }
  
  // Prepare timeline data for visualization (sample every 5 seconds to avoid clutter)
  const timelineData = useMemo(() => {
    const sampled: any[] = []
    const sampleInterval = 5 // seconds
    
    for (let i = 0; i <= durationSeconds; i += sampleInterval) {
      // Find closest pitch value
      const pitchPoint = voiceAnalysis.pitchTimeline.find(p => Math.abs(p.time - i) < sampleInterval / 2)
      const volumePoint = voiceAnalysis.volumeTimeline.find(p => Math.abs(p.time - i) < sampleInterval / 2)
      const wpmPoint = voiceAnalysis.wpmTimeline.find(p => Math.abs(p.time - i) < sampleInterval / 2)
      
      if (pitchPoint || volumePoint || wpmPoint) {
        sampled.push({
          time: i,
          pitch: pitchPoint?.value || 0,
          volume: volumePoint?.value || -60,
          wpm: wpmPoint?.value || 0,
        })
      }
    }
    
    return sampled
  }, [voiceAnalysis, durationSeconds])
  
  // Normalize values for combined chart (0-100 scale)
  const normalizedTimelineData = useMemo(() => {
    if (timelineData.length === 0) return []
    
    const maxPitch = Math.max(...timelineData.map(d => d.pitch).filter(p => p > 0), 200)
    const minVolume = Math.min(...timelineData.map(d => d.volume), -60)
    const maxWPM = Math.max(...timelineData.map(d => d.wpm), 200)
    
    return timelineData.map(d => ({
      time: d.time,
      pitch: d.pitch > 0 ? (d.pitch / maxPitch) * 100 : 0,
      volume: ((d.volume - minVolume) / (0 - minVolume)) * 100,
      wpm: d.wpm > 0 ? (d.wpm / maxWPM) * 100 : 0,
    }))
  }, [timelineData])
  
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Mic className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Speech Quality</h2>
          <p className="text-sm text-gray-400">Vocal delivery analysis and coaching</p>
        </div>
      </div>
      
      {/* Overall Speech Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Overall Speech Score</div>
            <div className="text-4xl font-bold mb-2" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </div>
            <div className="text-sm text-gray-300">{getScoreMessage(overallScore)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Based on</div>
            <div className="text-sm text-gray-300">Pace • Variety • Energy • Clarity</div>
          </div>
        </div>
      </motion.div>
      
      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pace & Rhythm */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white">Pace & Rhythm</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{voiceAnalysis.avgWPM} WPM</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(100, (voiceAnalysis.avgWPM / 200) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">Ideal: 140-160</span>
          </div>
          <div className="text-xs text-gray-400">
            {voiceAnalysis.avgWPM >= 140 && voiceAnalysis.avgWPM <= 160 ? (
              <span className="text-green-400">✓ Perfect pace for sales conversations</span>
            ) : voiceAnalysis.avgWPM < 140 ? (
              <span className="text-yellow-400">Consider speaking slightly faster</span>
            ) : (
              <span className="text-red-400">Slow down to improve clarity</span>
            )}
          </div>
        </motion.div>
        
        {/* Vocal Variety */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white">Vocal Variety</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{voiceAnalysis.pitchVariation}%</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, (voiceAnalysis.pitchVariation / 30) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">Target: >20%</span>
          </div>
          <div className="text-xs text-gray-400">
            {voiceAnalysis.pitchVariation >= 20 ? (
              <span className="text-green-400">✓ Great pitch variation</span>
            ) : (
              <span className="text-yellow-400">Increase pitch variation to sound more engaging</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Range: {voiceAnalysis.minPitch}-{voiceAnalysis.maxPitch} Hz
          </div>
        </motion.div>
        
        {/* Energy & Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-white">Energy & Volume</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{voiceAnalysis.avgVolume} dB</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, ((voiceAnalysis.avgVolume + 60) / 60) * 100))}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">Ideal: -30 to -10 dB</span>
          </div>
          <div className="text-xs text-gray-400">
            {voiceAnalysis.avgVolume >= -30 && voiceAnalysis.avgVolume <= -10 ? (
              <span className="text-green-400">✓ Great energy throughout</span>
            ) : voiceAnalysis.avgVolume < -30 ? (
              <span className="text-yellow-400">Speak up for better presence</span>
            ) : (
              <span className="text-yellow-400">Consider speaking slightly softer</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Consistency: {voiceAnalysis.volumeConsistency.toFixed(1)}% variation
          </div>
        </motion.div>
        
        {/* Clarity & Confidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-white">Clarity & Confidence</h3>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-bold text-white">{voiceAnalysis.totalFillerWords}</div>
              <div className="text-xs text-gray-400">
                filler words ({voiceAnalysis.fillerWordsPerMinute.toFixed(1)}/min)
              </div>
            </div>
            {voiceAnalysis.longPausesCount > 0 && (
              <div>
                <div className="text-lg font-bold text-white">{voiceAnalysis.longPausesCount}</div>
                <div className="text-xs text-gray-400">long pauses (>2s)</div>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-400">
            {voiceAnalysis.fillerWordsPerMinute < 1 ? (
              <span className="text-green-400">✓ Crystal clear communication</span>
            ) : voiceAnalysis.fillerWordsPerMinute < 2 ? (
              <span className="text-yellow-400">Good clarity, minor improvements possible</span>
            ) : (
              <span className="text-red-400">Reduce filler words for better confidence</span>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Timeline Visualization */}
      {normalizedTimelineData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
        >
          <h3 className="font-semibold text-white mb-4">Voice Metrics Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={normalizedTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                label={{ value: 'Normalized Value (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area
                type="monotone"
                dataKey="pitch"
                fill="#8B5CF6"
                fillOpacity={0.3}
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Pitch"
              />
              <Area
                type="monotone"
                dataKey="volume"
                fill="#10B981"
                fillOpacity={0.3}
                stroke="#10B981"
                strokeWidth={2}
                name="Volume"
              />
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="WPM"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Pitch</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Volume</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>WPM</span>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Improvement Areas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Areas to Improve</h3>
        </div>
        <ul className="space-y-2">
          {improvementAreas.map((area, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
              <span>{area}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  )
}


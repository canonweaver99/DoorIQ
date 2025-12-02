'use client'

import { motion } from 'framer-motion'
import { Mic, AlertTriangle, Book, Flame, Info, CheckCircle2, Circle } from 'lucide-react'
import { LiveSessionMetrics, TranscriptEntry, VoiceAnalysisData } from '@/lib/trainer/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { detectObjection, assessObjectionHandling, getObjectionApproach } from '@/lib/trainer/enhancedPatternAnalyzer'

interface LiveMetricsPanelProps {
  metrics: LiveSessionMetrics
  getVoiceAnalysisData?: () => VoiceAnalysisData | null
  transcript?: TranscriptEntry[]
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'amber' | 'emerald' | 'purple'
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive'
  progress?: number
  progressLabel?: string
  verticalLayout?: boolean
  className?: string
}

function MetricCard({ icon, label, value, color, subtitle, badge, badgeVariant = 'default', progress, progressLabel, verticalLayout = false, className, wpmValue }: MetricCardProps & { wpmValue?: number }) {
  const colorClasses = {
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/20',
      hover: 'group-hover:bg-blue-500/30',
      progress: 'from-blue-500 to-blue-400',
      border: 'border-blue-500/60',
      accent: 'bg-blue-500/30'
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/20',
      hover: 'group-hover:bg-amber-500/30',
      progress: 'from-amber-500 to-amber-400',
      border: 'border-amber-500/60',
      accent: 'bg-amber-500/30'
    },
    emerald: {
      icon: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      hover: 'group-hover:bg-emerald-500/30',
      progress: 'from-emerald-500 to-emerald-400',
      border: 'border-emerald-500/60',
      accent: 'bg-emerald-500/30'
    },
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-500/20',
      hover: 'group-hover:bg-purple-500/30',
      progress: 'from-purple-500 to-purple-400',
      border: 'border-purple-500/60',
      accent: 'bg-purple-500/30'
    }
  }

  const classes = colorClasses[color]

  if (verticalLayout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group flex flex-col h-full",
          classes.border,
          className
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className={cn("p-2 sm:p-2.5 rounded-md transition-colors", classes.bg, classes.hover)}>
            <div className={classes.icon}>
              {icon}
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-semibold text-white font-space">{label}</div>
            {subtitle && <div className="text-xs sm:text-sm text-slate-300 font-space font-medium">{subtitle}</div>}
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-white font-space">{value}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-lg pt-3 px-4 pb-2 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group h-full flex flex-col",
          classes.border,
          className
        )}
    >
      <div className="flex items-start gap-1.5 sm:gap-2 mb-1.5">
        <div className={cn("p-1.5 sm:p-2 rounded-md transition-colors flex-shrink-0", classes.bg, classes.hover)}>
          <div className={classes.icon}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-semibold text-white font-space mb-0.5">{label}</div>
          {subtitle && <div className="text-xs sm:text-sm text-slate-300 font-space font-medium mb-0.5">{subtitle}</div>}
          <div className="flex items-center gap-2">
            <div className="text-xl sm:text-2xl font-bold text-white font-space">{value}</div>
            {badge && (
              <Badge variant={badgeVariant} className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-slate-800 border-slate-600 text-white font-semibold">
                {badge}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="mt-auto mb-10 pt-1">
          <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden mb-1">
            <motion.div
              className={cn("absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500", classes.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            {progress > 0 && progress < 100 && (
              <div className={cn("absolute left-[50%] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-500/60")} />
            )}
          </div>
          {progressLabel && (
            <div className="flex justify-between text-xs sm:text-sm text-slate-300 font-space font-medium">
              {progressLabel.includes('Target') ? (
                <>
                  <span className="truncate">Current: {wpmValue || Math.round((progress / 100) * 200)} WPM</span>
                  <span className="hidden sm:inline">{progressLabel}</span>
                </>
              ) : (
                <>
                  <span className="truncate">Them: {progress}%</span>
                  <span className="hidden sm:inline">Ideal: 60%</span>
                  <span className="truncate">You: {100 - progress}%</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Energy calculation helper functions
interface EnergyBreakdown {
  wpm: number // 0-100 normalized
  pitchVariation: number // 0-100 normalized
  volumeLevel: number // 0-100 normalized (changed from volumeConsistency)
  speakingRatio: number // 0-100 normalized (new metric)
  pausePattern: number // 0-100 normalized (deprecated, kept for compatibility)
  vocalFry: number // 0-100 normalized (deprecated, kept for compatibility)
}

interface EnergyScore {
  score: number // 0-100
  breakdown: EnergyBreakdown
  status: 'Low Energy' | 'Balanced' | 'High Energy'
}

// Normalize WPM to 0-100 scale (ideal: 140-160 WPM)
function normalizeWPM(wpm: number): number {
  if (wpm >= 140 && wpm <= 160) return 100 // Ideal range
  if (wpm < 140) {
    // Too slow - linear scale from 0-100
    return Math.max(0, Math.min(100, (wpm / 140) * 100))
  } else {
    // Too fast - penalize but not as harshly
    return Math.max(60, Math.min(100, 100 - ((wpm - 160) / 40) * 20))
  }
}

// Normalize pitch variation to 0-100 scale (higher variation = better, ideal: >20%)
function normalizePitchVariation(pitchVariation: number): number {
  // Ideal is >20% variation
  return Math.min(100, (pitchVariation / 20) * 100)
}

// Calculate volume level (actual RMS volume) - matches useEnergyScore hook
// This measures how loud they're speaking, not consistency
function calculateVolumeLevel(voiceAnalysisData: VoiceAnalysisData | null): number {
  if (!voiceAnalysisData || voiceAnalysisData.avgVolume === undefined) {
    return 50 // Default middle value if no data
  }
  
  // Normalize volume dB to 0-100 scale
  // Typical range: -60dB (silence) to 0dB (loud)
  // Map: -60dB = 0, -30dB = 50, 0dB = 100
  const volumeDb = voiceAnalysisData.avgVolume
  const normalized = Math.max(0, Math.min(100, ((volumeDb + 60) / 60) * 100))
  return normalized
}

// Calculate speaking ratio (% of time speaking vs silent) - matches useEnergyScore hook
function calculateSpeakingRatio(voiceAnalysisData: VoiceAnalysisData | null, transcript: TranscriptEntry[]): number {
  // If we have transcript data, estimate from pauses
  if (transcript.length > 0) {
    // Simple heuristic: count user entries vs total time
    const userEntries = transcript.filter(e => e.speaker === 'user')
    if (userEntries.length === 0) return 0
    
    // Estimate speaking time from transcript entries
    // This is a rough estimate - actual implementation uses VAD
    return Math.min(100, (userEntries.length / transcript.length) * 100)
  }
  
  // Default to 50% if no data
  return 50
}

// Calculate pause pattern score - fewer pauses = higher score
// Now calculates dynamically from transcript only (always updates)
function calculatePausePattern(
  voiceAnalysisData: VoiceAnalysisData | null,
  transcript: TranscriptEntry[],
  sessionDurationSeconds: number
): number {
  // Always use transcript-based calculation for real-time updates
  if (transcript.length < 2) return 75 // Neutral default
  
  const userEntries = transcript.filter(entry => entry.speaker === 'user')
  if (userEntries.length < 2) return 75
  
  // Use last 8 entries for recent pause pattern (dynamic calculation)
  const recentEntries = userEntries.slice(-8)
  if (recentEntries.length < 2) return 75
  
  let pauseCount = 0
  let totalGapTime = 0
  
  for (let i = 1; i < recentEntries.length; i++) {
    const prev = recentEntries[i - 1]
    const curr = recentEntries[i]
    
    try {
      const prevTime = prev.timestamp instanceof Date 
        ? prev.timestamp.getTime() 
        : typeof prev.timestamp === 'string' 
          ? new Date(prev.timestamp).getTime()
          : Date.now()
      const currTime = curr.timestamp instanceof Date 
        ? curr.timestamp.getTime() 
        : typeof curr.timestamp === 'string'
          ? new Date(curr.timestamp).getTime()
          : Date.now()
      const pauseDuration = currTime - prevTime
      
      // Count pauses > 1.5 seconds
      if (pauseDuration > 1500) {
        pauseCount++
        totalGapTime += pauseDuration
      }
    } catch (e) {
      continue
    }
  }
  
  // Calculate score based on pause frequency and duration
  // Fewer pauses = higher score
  const pausesPerEntry = pauseCount / recentEntries.length
  const avgPauseDuration = pauseCount > 0 ? totalGapTime / pauseCount : 0
  
  // Score starts at 100, decreases with more pauses
  // 0 pauses = 100, 0.2 pauses/entry = 80, 0.5 pauses/entry = 50, 1 pause/entry = 0
  let score = 100 - (pausesPerEntry * 200)
  
  // Also penalize very long pauses (>5 seconds)
  if (avgPauseDuration > 5000) {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

// Detect vocal fry and upspeak - simplified to calculate from speech patterns
// Since pitch data may not be available, use speech rate and consistency as proxy
function detectVocalFryUpspeak(voiceAnalysisData: VoiceAnalysisData | null): number {
  // Try to use pitch data if available
  if (voiceAnalysisData && voiceAnalysisData.pitchTimeline && voiceAnalysisData.pitchTimeline.length >= 5) {
    const allPitches = voiceAnalysisData.pitchTimeline.map(p => p.value).filter(p => p > 0)
    const recentPitches = allPitches.slice(-20)
    
    if (recentPitches.length >= 5) {
      const pitches = recentPitches.length >= 5 ? recentPitches : allPitches
      
      let vocalFryScore = 100
      let upspeakScore = 100
      
      // Detect vocal fry: very low pitch (<80Hz)
      const lowPitchCount = pitches.filter(p => p < 80).length
      const lowPitchRatio = lowPitchCount / pitches.length
      
      if (lowPitchRatio > 0.15) {
        vocalFryScore = Math.max(0, 100 - ((lowPitchRatio - 0.15) / 0.85) * 100)
      }
      
      // Detect upspeak: unusually high pitch (>200Hz)
      const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length
      
      if (avgPitch > 200) {
        upspeakScore = Math.max(0, 100 - ((avgPitch - 200) / 200) * 100)
      } else if (avgPitch < 80) {
        upspeakScore = Math.max(0, (avgPitch / 80) * 100)
      }
      
      return Math.max(0, Math.min(100, Math.min(vocalFryScore, upspeakScore)))
    }
  }
  
  // Fallback: Calculate from speech patterns (always available, always updates)
  // Use volume consistency and pitch variation as proxies
  // If we have voice analysis data, use those metrics
  if (voiceAnalysisData) {
    const volumeConsistency = voiceAnalysisData.volumeConsistency || 0
    const pitchVariation = voiceAnalysisData.pitchVariation || 0
    
    // Good vocal quality = consistent volume + varied pitch
    // Score based on these factors (both should be good)
    const volumeScore = Math.min(100, volumeConsistency * 1.2) // Scale up volume consistency
    const pitchScore = Math.min(100, pitchVariation * 1.5) // Scale up pitch variation
    
    // Average the two for overall vocal quality score
    return Math.round((volumeScore + pitchScore) / 2)
  }
  
  // Default: return neutral score that will update as data comes in
  return 75
}

// Calculate overall energy score - matches useEnergyScore hook implementation
function calculateEnergyScore(
  wpm: number,
  pitchVariation: number,
  volumeLevel: number,  // Changed from volumeConsistency
  speakingRatio: number = 0  // New parameter, default to 0 if not provided
): EnergyScore {
  // Ensure all values are valid numbers
  const safeWPM = isNaN(wpm) || wpm < 0 ? 0 : wpm
  const safePitchVariation = isNaN(pitchVariation) || pitchVariation < 0 ? 0 : pitchVariation
  const safeVolumeLevel = isNaN(volumeLevel) || volumeLevel < 0 ? 0 : Math.max(0, Math.min(100, volumeLevel))
  const safeSpeakingRatio = isNaN(speakingRatio) || speakingRatio < 0 ? 0 : Math.max(0, Math.min(100, speakingRatio))
  
  const normalizedWPM = normalizeWPM(safeWPM)
  const normalizedPitch = normalizePitchVariation(safePitchVariation)
  
  const breakdown: EnergyBreakdown = {
    wpm: normalizedWPM,
    pitchVariation: normalizedPitch,
    volumeLevel: safeVolumeLevel,
    speakingRatio: safeSpeakingRatio,
    pausePattern: 75, // Deprecated (not used in calculation)
    vocalFry: 75 // Deprecated (not used in calculation)
  }
  
  // Weighted combination matching useEnergyScore hook weights
  // WPM: 35%, Pitch Variation: 30%, Volume Level: 20%, Speaking Ratio: 15%
  const score = Math.round(
    (normalizedWPM * 0.35) +
    (normalizedPitch * 0.30) +
    (safeVolumeLevel * 0.20) +
    (safeSpeakingRatio * 0.15)
  )
  
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score))
  
  let status: 'Low Energy' | 'Balanced' | 'High Energy'
  if (clampedScore < 40) {
    status = 'Low Energy'
  } else if (clampedScore >= 40 && clampedScore < 70) {
    status = 'Balanced'
  } else {
    status = 'High Energy'
  }
  
  return { score: clampedScore, breakdown, status }
}

// Energy Card Component
interface EnergyCardProps {
  energyScore: EnergyScore
  className?: string
}

function EnergyCard({ energyScore, className }: EnergyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const { score, breakdown, status } = energyScore
  
  // Determine color based on score
  const getColorClasses = () => {
    if (score < 40) {
      return {
        progress: 'from-orange-500 to-red-500',
        border: 'border-orange-500/60',
        icon: 'text-orange-400',
        bg: 'bg-orange-500/20',
        hover: 'group-hover:bg-orange-500/30'
      }
    } else if (score >= 40 && score < 70) {
      return {
        progress: 'from-emerald-500 to-green-500',
        border: 'border-emerald-500/60',
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        hover: 'group-hover:bg-emerald-500/30'
      }
    } else {
      return {
        progress: 'from-blue-500 to-indigo-500',
        border: 'border-blue-500/60',
        icon: 'text-blue-400',
        bg: 'bg-blue-500/20',
        hover: 'group-hover:bg-blue-500/30'
      }
    }
  }
  
  const colors = getColorClasses()
  
  // Convert score to dots (5 dots max)
  const scoreToDots = (value: number) => {
    const filled = Math.round((value / 100) * 5)
    return '●'.repeat(filled) + '○'.repeat(5 - filled)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-900 rounded-md sm:rounded-lg pt-3 sm:pt-4 px-2.5 sm:px-4 pb-3 sm:pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group h-full flex flex-col cursor-pointer relative touch-manipulation",
        colors.border,
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header: Icon + Title + Percentage */}
      <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-shrink-0">
        <div className={cn("p-1 sm:p-1.5 rounded-md transition-colors flex-shrink-0", colors.bg, colors.hover)}>
          <Flame className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5", colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="text-xs sm:text-sm lg:text-base font-semibold text-white font-space leading-tight">
                Vocal Energy
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowInfo(!showInfo)
                }}
                className="p-0.5 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0 touch-manipulation"
                aria-label="Show energy calculation info"
              >
                <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 hover:text-slate-200" />
              </button>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-space leading-tight">
                {score}%
              </div>
            </div>
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-slate-400 font-space mt-0.5">
            {status}
          </div>
        </div>
      </div>
      
      {/* Progress Bar - Centered */}
      <div className="-mt-1 sm:-mt-2 pt-5 sm:pt-7 flex-shrink-0 min-h-0">
        <div className="relative h-1.5 sm:h-2 bg-slate-800/80 rounded-full overflow-hidden mb-0.5 sm:mb-1">
          {/* Background zones */}
          <div className="absolute inset-0 flex">
            <div className="w-[40%] bg-orange-500/20" />
            <div className="w-[30%] bg-emerald-500/20" />
            <div className="flex-1 bg-blue-500/20" />
          </div>
          
          {/* Progress fill */}
          <motion.div
            className={cn("absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500", colors.progress)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Zone markers */}
          <div className="absolute inset-0 flex items-center">
            <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-slate-500/60" />
            <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-slate-500/60" />
          </div>
          
          {/* Current position indicator */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white rounded-full shadow-lg"
            style={{ left: `calc(${score}% - 1px)` }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-space font-medium mb-0.5 leading-tight">
          <span>Low</span>
          <span className="hidden xs:inline">Balanced</span>
          <span className="xs:hidden">Bal.</span>
          <span>High</span>
        </div>
        
        {/* Percentage markers */}
        <div className="flex justify-between text-[9px] sm:text-xs text-slate-500 font-space font-medium mb-0.5 leading-tight">
          <span>0%</span>
          <span className="hidden sm:inline">40%</span>
          <span className="hidden sm:inline">70%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Current and ideal range - Bottom corners */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-300 font-space font-medium">
        <span className="truncate">Current: {status}</span>
        <span className="truncate ml-1 sm:ml-2">Ideal: 60-75%</span>
      </div>
      
      {/* Expanded breakdown */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 pt-2 border-t border-slate-700/50"
        >
          <div className="text-xs text-slate-400 font-space font-medium mb-2">What feeds into Energy:</div>
          <div className="space-y-1.5 text-xs text-slate-300 font-space">
            <div className="flex justify-between items-center">
              <span>Speed (WPM):</span>
              <span className="font-mono">{scoreToDots(breakdown.wpm)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Pitch Variation:</span>
              <span className="font-mono">{scoreToDots(breakdown.pitchVariation)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Volume Level:</span>
              <span className="font-mono">{scoreToDots(breakdown.volumeLevel)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Speaking Ratio:</span>
              <span className="font-mono">{scoreToDots(breakdown.speakingRatio)}</span>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Info Modal */}
      {showInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation()
            setShowInfo(false)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-lg border border-slate-700 shadow-xl max-w-md w-full mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white font-space">Energy Score Calculation</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-300 font-space">
              <div className="text-slate-400 mb-3">The Energy score is calculated from 3 weighted factors:</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Words Per Minute (WPM)</span>
                  <span className="font-semibold text-white">35%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Speed/pace of speech (calculated from actual speaking time)</div>
                
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Pitch Variation</span>
                  <span className="font-semibold text-white">30%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Monotone vs dynamic/enthusiastic</div>
                
                <div className="flex justify-between items-center py-1">
                  <span>Volume Level</span>
                  <span className="font-semibold text-white">20%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">How loud you're speaking</div>
                
                <div className="flex justify-between items-center py-1">
                  <span>Speaking Ratio</span>
                  <span className="font-semibold text-white">15%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">% of time speaking vs silent</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
                Formula: (WPM × 0.4) + (Pitch × 0.35) + (Volume × 0.25)
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// Objection Data Structure
interface ObjectionData {
  id: string
  text: string
  type: string
  quality: 'poor' | 'adequate' | 'good' | 'excellent' | null
  responseText?: string
  timestamp: Date
}

// Extract objections from transcript
function extractObjectionsFromTranscript(transcript: TranscriptEntry[]): ObjectionData[] {
  const objections: ObjectionData[] = []
  const processedIds = new Set<string>()
  
  transcript.forEach((entry, index) => {
    if (entry.speaker === 'homeowner') {
      const objection = detectObjection(entry.text)
      if (objection && !processedIds.has(entry.id)) {
        processedIds.add(entry.id)
        
        // Assess handling quality
        const handling = assessObjectionHandling(index, transcript)
        
        objections.push({
          id: entry.id,
          text: entry.text,
          type: objection.type,
          quality: handling.quality,
          responseText: handling.responseText,
          timestamp: entry.timestamp
        })
      }
    }
  })
  
  return objections
}

// Convert quality to dots (1-5)
function qualityToDots(quality: 'poor' | 'adequate' | 'good' | 'excellent' | null): string {
  if (!quality) return '○○○○○'
  switch (quality) {
    case 'excellent': return '●●●●●'
    case 'good': return '●●●●○'
    case 'adequate': return '●●●○○'
    case 'poor': return '●●○○○'
    default: return '○○○○○'
  }
}

// Get quality label
function getQualityLabel(quality: 'poor' | 'adequate' | 'good' | 'excellent' | null): string {
  if (!quality) return 'Not Handled'
  switch (quality) {
    case 'excellent': return 'Excellent'
    case 'good': return 'Good'
    case 'adequate': return 'Adequate'
    case 'poor': return 'Weak'
    default: return 'Unknown'
  }
}

// Get coaching tips for objection type
function getObjectionCoachingTips(type: string): string {
  const tips: Record<string, string> = {
    price: 'Tie to value, not features',
    timing: 'Create urgency, what specific concerns?',
    trust: 'Build credibility with social proof',
    need: 'Discover hidden pain points',
    authority: 'Get commitment for follow-up',
    comparison: 'Highlight unique value',
    skepticism: 'Share success stories'
  }
  return tips[type] || 'Address the concern directly'
}

// Format objection type for display
function formatObjectionType(type: string): string {
  const typeMap: Record<string, string> = {
    price: 'Price Concern',
    timing: 'Timing Concern',
    trust: 'Trust Concern',
    need: 'Need Concern',
    authority: 'Authority Concern',
    comparison: 'Comparison',
    skepticism: 'Skepticism'
  }
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// Enhanced Objections Card Component
interface EnhancedObjectionsCardProps {
  objections: ObjectionData[]
  className?: string
}

// Energy Metrics Cards - Showing all metrics that determine energy score
interface EnergyMetricsCard1Props {
  energyScore: EnergyScore
  rawValues: {
    wpm: number
    pitchVariation: number
    volumeLevel: number  // Changed from volumeConsistency
    speakingRatio: number  // New metric
  }
  className?: string
}

function EnergyMetricsCard1({ energyScore, rawValues, className }: EnergyMetricsCard1Props) {
  const { breakdown } = energyScore
  // Updated weights to match useEnergyScore hook implementation
  const weights = { 
    wpm: 0.35,              // 35% - Speaking pace
    pitchVariation: 0.30,   // 30% - Vocal dynamics
    volumeLevel: 0.20,      // 20% - How loud (RMS)
    speakingRatio: 0.15     // 15% - % of time speaking vs silent
  }
  
  const contributions = {
    wpm: breakdown.wpm * weights.wpm,
    pitchVariation: breakdown.pitchVariation * weights.pitchVariation,
    volumeLevel: breakdown.volumeLevel * weights.volumeLevel,
    speakingRatio: breakdown.speakingRatio * weights.speakingRatio
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] border-blue-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 flex flex-col h-full",
        className
      )}
    >
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        <div className="p-1.5 rounded-md transition-colors bg-blue-500/20 flex-shrink-0">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
            Energy Metrics
          </div>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {/* WPM */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">WPM</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.wpm * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.wpm.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400 font-space">{breakdown.wpm.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.wpm.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Pitch Variation */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">Pitch Variation</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.pitchVariation * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.pitchVariation.toFixed(1)}%</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400 font-space">{breakdown.pitchVariation.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.pitchVariation.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Volume Level */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">Volume Level</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.volumeLevel * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.volumeLevel.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400 font-space">{breakdown.volumeLevel.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.volumeLevel.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Speaking Ratio */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">Speaking Ratio</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.speakingRatio * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.speakingRatio.toFixed(0)}%</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400 font-space">{breakdown.speakingRatio.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.speakingRatio.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Total Contribution */}
        <div className="bg-emerald-500/10 rounded-md p-2.5 border border-emerald-500/30 mt-4">
          <div className="text-xs text-slate-400 font-space mb-1">Total Contribution</div>
          <div className="text-2xl font-bold text-emerald-400 font-space">
            {(contributions.wpm + contributions.pitchVariation + contributions.volumeLevel + contributions.speakingRatio).toFixed(1)}
          </div>
          <div className="text-xs text-slate-500 font-space mt-1">
            Out of {energyScore.score.toFixed(0)} total energy score
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface EnergyMetricsCard2Props {
  energyScore: EnergyScore
  rawValues: {
    pausePattern: number
    vocalFry: number
  }
  className?: string
}

function EnergyMetricsCard2({ energyScore, rawValues, className }: EnergyMetricsCard2Props) {
  const { breakdown } = energyScore
  const weights = { pausePattern: 0.15, vocalFry: 0.1 }
  
  const contributions = {
    pausePattern: breakdown.pausePattern * weights.pausePattern,
    vocalFry: breakdown.vocalFry * weights.vocalFry
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] border-purple-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 flex flex-col h-full",
        className
      )}
    >
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        <div className="p-1.5 rounded-md transition-colors bg-purple-500/20 flex-shrink-0">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
            Energy Metrics (2/2)
          </div>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {/* Pause Pattern */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">Pause Pattern</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.pausePattern * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.pausePattern.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400 font-space">{breakdown.pausePattern.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.pausePattern.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Vocal Fry */}
        <div className="bg-slate-800/50 rounded-md p-2.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-space">Vocal Fry</span>
            <span className="text-xs text-slate-500 font-mono">{(weights.vocalFry * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold text-white font-space">{rawValues.vocalFry.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Raw</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400 font-space">{breakdown.vocalFry.toFixed(0)}</div>
              <div className="text-xs text-slate-400 font-space">Normalized</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400 font-space">{contributions.vocalFry.toFixed(1)}</div>
              <div className="text-xs text-slate-400 font-space">Contribution</div>
            </div>
          </div>
        </div>
        
        {/* Total Contribution */}
        <div className="bg-emerald-500/10 rounded-md p-2.5 border border-emerald-500/30 mt-4">
          <div className="text-xs text-slate-400 font-space mb-1">Total Contribution</div>
          <div className="text-2xl font-bold text-emerald-400 font-space">
            {(contributions.pausePattern + contributions.vocalFry).toFixed(1)}
          </div>
          <div className="text-xs text-slate-500 font-space mt-1">
            Out of {energyScore.score.toFixed(0)} total energy score
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function EnhancedObjectionsCard({ objections, className }: EnhancedObjectionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] border-amber-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group flex flex-col h-full cursor-pointer",
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header: Icon + Title + Counter */}
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        <div className="p-1.5 rounded-md transition-colors bg-amber-500/20 group-hover:bg-amber-500/30 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
              Objections
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-white font-space leading-tight">{objections.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content - Fixed height with scroll */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {objections.length === 0 ? (
          <div className="text-sm sm:text-base text-slate-400 font-space leading-tight">No objections detected</div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <div className="space-y-2">
              {objections.slice(0, isExpanded ? undefined : 2).map((objection) => {
              const qualityColor = objection.quality === 'excellent' || objection.quality === 'good' 
                ? 'text-emerald-400' 
                : objection.quality === 'poor' 
                  ? 'text-red-400' 
                  : 'text-amber-400'
              
              return (
                <div key={objection.id} className="mb-2 last:mb-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
                        {formatObjectionType(objection.type)}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 font-space italic mt-0.5 leading-tight line-clamp-2">
                        "{objection.text.length > 50 ? objection.text.substring(0, 50) + '...' : objection.text}"
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <div className={cn("text-xs font-mono leading-tight", qualityColor)}>
                        {qualityToDots(objection.quality)}
                      </div>
                      <div className={cn("text-xs font-space leading-tight", qualityColor)}>
                        {getQualityLabel(objection.quality)}
                      </div>
                    </div>
                  </div>
                </div>
              )
              })}
              
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 pt-2 border-t border-slate-700/50"
                >
                  <div className="text-xs sm:text-sm text-slate-400 font-space font-medium mb-1.5 leading-tight">Quick Tips:</div>
                  {Array.from(new Set(objections.map(o => o.type))).map((type) => (
                    <div key={type} className="text-xs sm:text-sm text-slate-300 font-space mb-1 leading-tight">
                      ↳ {formatObjectionType(type)}: {getObjectionCoachingTips(type)}
                    </div>
                  ))}
                </motion.div>
              )}
              
              {objections.length > 2 && !isExpanded && (
                <div className="text-xs sm:text-sm text-slate-400 font-space mt-1.5 leading-tight">
                  Click to see all {objections.length} objections...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Enhanced Techniques Card Component
interface EnhancedTechniquesCardProps {
  techniquesUsed: string[]
  className?: string
}

function EnhancedTechniquesCard({ techniquesUsed, className }: EnhancedTechniquesCardProps) {
  // Only show techniques that have been used
  const displayedTechniques = useMemo(() => {
    if (techniquesUsed.length === 0) return []
    
    // Return unique techniques from the used list
    return Array.from(new Set(techniquesUsed))
  }, [techniquesUsed])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] border-emerald-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group flex flex-col h-full",
        className
      )}
    >
      {/* Header: Icon + Title + Counter */}
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        <div className="p-1.5 rounded-md transition-colors bg-emerald-500/20 group-hover:bg-emerald-500/30 flex-shrink-0">
          <Book className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
              Techniques
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-white font-space leading-tight">{displayedTechniques.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content - Right under title */}
      <div className="space-y-1.5 flex-shrink-0 min-h-0 overflow-hidden">
        {displayedTechniques.length > 0 ? (
          displayedTechniques.map((tech) => (
            <div key={tech} className="flex items-center gap-1.5 text-sm sm:text-base text-slate-300 font-space leading-tight">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-white truncate">{tech}</span>
            </div>
          ))
        ) : (
          <div className="text-sm sm:text-base text-slate-400 font-space leading-tight">No techniques detected yet</div>
        )}
      </div>
    </motion.div>
  )
}

export function LiveMetricsPanel({ metrics, getVoiceAnalysisData, transcript = [] }: LiveMetricsPanelProps) {
  const { talkTimeRatio, wordsPerMinute, objectionCount, techniquesUsed, voiceMetrics } = metrics
  
  // Extract objections from transcript
  const objections = extractObjectionsFromTranscript(transcript)

  // Determine talk time status
  const getTalkTimeStatus = () => {
    if (talkTimeRatio >= 55 && talkTimeRatio <= 65) {
      return { badge: 'Balanced', variant: 'default' as const }
    } else if ((talkTimeRatio >= 50 && talkTimeRatio < 55) || (talkTimeRatio > 65 && talkTimeRatio <= 75)) {
      return { badge: 'OK', variant: 'secondary' as const }
    } else if (talkTimeRatio < 50) {
      return { badge: 'Talk More', variant: 'destructive' as const }
    } else {
      return { badge: 'Talk Less', variant: 'destructive' as const }
    }
  }

  const talkTimeStatus = getTalkTimeStatus()

  // Calculate energy score
  const voiceAnalysisData = getVoiceAnalysisData?.() || null
  const pitchVariation = voiceMetrics?.pitchVariation || voiceAnalysisData?.pitchVariation || 0
  const volumeLevel = calculateVolumeLevel(voiceAnalysisData)
  const speakingRatio = calculateSpeakingRatio(voiceAnalysisData, transcript)
  
  // Estimate session duration from transcript or use a default
  let sessionDurationSeconds = 60 // Default 1 minute if no transcript
  if (transcript.length > 1) {
    try {
      const firstTime = transcript[0].timestamp instanceof Date 
        ? transcript[0].timestamp.getTime()
        : typeof transcript[0].timestamp === 'string'
          ? new Date(transcript[0].timestamp).getTime()
          : Date.now()
      const lastTime = transcript[transcript.length - 1].timestamp instanceof Date
        ? transcript[transcript.length - 1].timestamp.getTime()
        : typeof transcript[transcript.length - 1].timestamp === 'string'
          ? new Date(transcript[transcript.length - 1].timestamp).getTime()
          : Date.now()
      const duration = (lastTime - firstTime) / 1000
      sessionDurationSeconds = Math.max(1, duration) // Ensure at least 1 second
    } catch (e) {
      // Fallback to default
      sessionDurationSeconds = 60
    }
  }
  
  // Calculate energy score - matches useEnergyScore hook implementation
  const energyScore = calculateEnergyScore(
    wordsPerMinute,
    pitchVariation,
    volumeLevel,
    speakingRatio
  )

  // Determine talk time color based on ratio
  const getTalkTimeColor = () => {
    if (talkTimeRatio >= 55 && talkTimeRatio <= 65) {
      return {
        progress: 'from-emerald-500 to-green-500',
        border: 'border-emerald-500/60',
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        hover: 'group-hover:bg-emerald-500/30'
      }
    } else if (talkTimeRatio < 55) {
      return {
        progress: 'from-orange-500 to-amber-500',
        border: 'border-orange-500/60',
        icon: 'text-orange-400',
        bg: 'bg-orange-500/20',
        hover: 'group-hover:bg-orange-500/30'
      }
    } else {
      return {
        progress: 'from-blue-500 to-indigo-500',
        border: 'border-blue-500/60',
        icon: 'text-blue-400',
        bg: 'bg-blue-500/20',
        hover: 'group-hover:bg-blue-500/30'
      }
    }
  }

  const talkTimeColors = getTalkTimeColor()

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 h-full items-stretch">
      {/* Talk Time Card - With Dynamic Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-md sm:rounded-lg pt-3 sm:pt-4 px-2.5 sm:px-4 pb-3 sm:pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group h-full flex flex-col relative",
          talkTimeColors.border
        )}
      >
        {/* Header: Icon + Title + Percentage */}
        <div className="flex items-start gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-shrink-0">
          <div className={cn("p-1 sm:p-1.5 rounded-md transition-colors flex-shrink-0", talkTimeColors.bg, talkTimeColors.hover)}>
            <Mic className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5", talkTimeColors.icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="text-xs sm:text-sm lg:text-base font-semibold text-white font-space leading-tight">Talk Time Ratio</div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-space leading-tight">{talkTimeRatio}%</div>
                {talkTimeStatus.badge && (
                  <Badge variant={talkTimeStatus.variant} className="text-[10px] sm:text-xs lg:text-sm px-1 sm:px-1.5 lg:px-2 py-0.5 bg-slate-800 border-slate-600 text-white font-semibold mt-0.5">
                    {talkTimeStatus.badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dynamic Progress Bar - Centered */}
        <div className="-mt-1 sm:-mt-2 pt-5 sm:pt-7 flex-shrink-0 min-h-0">
          <div className="relative h-1.5 sm:h-2 bg-slate-800/80 rounded-full overflow-hidden mb-0.5 sm:mb-1">
            {/* Background zones */}
            <div className="absolute inset-0 flex">
              <div className="w-[40%] bg-orange-500/20" />
              <div className="w-[20%] bg-emerald-500/20" />
              <div className="flex-1 bg-blue-500/20" />
            </div>
            
            {/* Progress fill */}
            <motion.div
              className={cn("absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500", talkTimeColors.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${talkTimeRatio}%` }}
              transition={{ duration: 0.5 }}
            />
            
            {/* Zone markers */}
            <div className="absolute inset-0 flex items-center">
              <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-slate-500/60" />
              <div className="absolute left-[60%] top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-slate-500/60" />
            </div>
            
            {/* Current position indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${talkTimeRatio}% - 1px)` }}
            />
          </div>
          
          {/* Scale labels */}
          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 font-space font-medium mb-0.5 leading-tight">
            <span>Listen</span>
            <span className="hidden xs:inline">Balanced</span>
            <span className="xs:hidden">Bal.</span>
            <span>Talk</span>
          </div>
          
          {/* Percentage markers */}
          <div className="flex justify-between text-[9px] sm:text-xs text-slate-500 font-space font-medium mb-0.5 leading-tight">
            <span className="flex-shrink-0">0%</span>
            <span className="flex-shrink-0 hidden sm:inline">40%</span>
            <span className="flex-shrink-0 hidden sm:inline">60%</span>
            <span className="flex-shrink-0">100%</span>
          </div>
        </div>
        
        {/* Current and ideal range - Bottom corners */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-between items-center gap-1 text-[10px] sm:text-xs lg:text-sm text-slate-300 font-space font-medium">
          <span className="whitespace-nowrap truncate">Current: {talkTimeRatio}%</span>
          <span className="whitespace-nowrap truncate">Ideal: 40-60%</span>
        </div>
      </motion.div>
      
      {/* Energy Card */}
      <EnergyCard energyScore={energyScore} />
      
      {/* Objections Card */}
      <EnhancedObjectionsCard objections={objections} />
      
      {/* Techniques Card */}
      <EnhancedTechniquesCard techniquesUsed={techniquesUsed} />
    </div>
  )
}



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
  volumeConsistency: number // 0-100 normalized
  pausePattern: number // 0-100 normalized
  vocalFry: number // 0-100 normalized
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

// Calculate volume consistency (coefficient of variation) - lower CV = more consistent = better
function calculateVolumeConsistency(voiceAnalysisData: VoiceAnalysisData | null): number {
  if (!voiceAnalysisData || voiceAnalysisData.volumeConsistency === undefined) {
    return 50 // Default middle value if no data
  }
  
  // Lower volume consistency (CV) = more consistent = higher score
  // Typical CV range: 0-50%, we want lower values to score higher
  const cv = voiceAnalysisData.volumeConsistency
  // Invert: CV of 0 = 100, CV of 50+ = 0
  return Math.max(0, Math.min(100, 100 - (cv * 2)))
}

// Calculate pause pattern score - fewer pauses = higher score
function calculatePausePattern(
  voiceAnalysisData: VoiceAnalysisData | null,
  transcript: TranscriptEntry[],
  sessionDurationSeconds: number
): number {
  // Try audio analysis first
  if (voiceAnalysisData && voiceAnalysisData.longPausesCount !== undefined && sessionDurationSeconds > 0) {
    const pausesPerMinute = (voiceAnalysisData.longPausesCount / sessionDurationSeconds) * 60
    // Ideal: <1 pause per minute = 100, >3 pauses per minute = 0
    const score = Math.max(0, Math.min(100, 100 - (pausesPerMinute * 33.33)))
    return score
  }
  
  // Fallback to transcript timestamps
  if (transcript.length < 2) return 50 // Default
  
  let pauseCount = 0
  const userEntries = transcript.filter(entry => entry.speaker === 'user')
  
  for (let i = 1; i < userEntries.length; i++) {
    const prev = userEntries[i - 1]
    const curr = userEntries[i]
    
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
      
      if (pauseDuration > 2000) { // >2 seconds
        pauseCount++
      }
    } catch (e) {
      continue
    }
  }
  
  // Normalize based on number of user entries
  if (userEntries.length === 0) return 50
  
  const pausesPerEntry = pauseCount / userEntries.length
  // Ideal: <0.1 pauses per entry = 100, >0.5 pauses per entry = 0
  return Math.max(0, Math.min(100, 100 - (pausesPerEntry * 200)))
}

// Detect vocal fry and upspeak from pitch patterns
function detectVocalFryUpspeak(voiceAnalysisData: VoiceAnalysisData | null): number {
  if (!voiceAnalysisData || !voiceAnalysisData.pitchTimeline || voiceAnalysisData.pitchTimeline.length < 10) {
    return 50 // Default if no pitch data
  }
  
  const pitches = voiceAnalysisData.pitchTimeline.map(p => p.value).filter(p => p > 0)
  if (pitches.length < 10) return 50
  
  let vocalFryScore = 100
  let upspeakScore = 100
  
  // Detect vocal fry: very low pitch (<80Hz) or irregular low patterns
  const lowPitchCount = pitches.filter(p => p < 80).length
  const lowPitchRatio = lowPitchCount / pitches.length
  if (lowPitchRatio > 0.2) {
    // More than 20% of speech is very low pitch = vocal fry
    vocalFryScore = Math.max(0, 100 - (lowPitchRatio * 200))
  }
  
  // Detect upspeak: analyze pitch trends at sentence endings
  // Simplified: check if pitch is generally rising (would need sentence boundaries for accurate detection)
  // For now, check if average pitch is unusually high (>200Hz) which can indicate upspeak
  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length
  if (avgPitch > 200) {
    // Unusually high average pitch might indicate upspeak
    upspeakScore = Math.max(0, 100 - ((avgPitch - 200) / 50) * 20)
  }
  
  // Combine scores (take the lower one as the limiting factor)
  return Math.min(vocalFryScore, upspeakScore)
}

// Calculate overall energy score
function calculateEnergyScore(
  wpm: number,
  pitchVariation: number,
  volumeConsistency: number,
  pausePattern: number,
  vocalFry: number
): EnergyScore {
  // Ensure all values are valid numbers
  const safeWPM = isNaN(wpm) || wpm < 0 ? 0 : wpm
  const safePitchVariation = isNaN(pitchVariation) || pitchVariation < 0 ? 0 : pitchVariation
  const safeVolumeConsistency = isNaN(volumeConsistency) || volumeConsistency < 0 ? 50 : Math.max(0, Math.min(100, volumeConsistency))
  const safePausePattern = isNaN(pausePattern) || pausePattern < 0 ? 50 : Math.max(0, Math.min(100, pausePattern))
  const safeVocalFry = isNaN(vocalFry) || vocalFry < 0 ? 50 : Math.max(0, Math.min(100, vocalFry))
  
  const normalizedWPM = normalizeWPM(safeWPM)
  const normalizedPitch = normalizePitchVariation(safePitchVariation)
  
  const breakdown: EnergyBreakdown = {
    wpm: normalizedWPM,
    pitchVariation: normalizedPitch,
    volumeConsistency: safeVolumeConsistency,
    pausePattern: safePausePattern,
    vocalFry: safeVocalFry
  }
  
  // Weighted combination
  const score = Math.round(
    (normalizedWPM * 0.3) +
    (normalizedPitch * 0.25) +
    (safeVolumeConsistency * 0.2) +
    (safePausePattern * 0.15) +
    (safeVocalFry * 0.1)
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
        "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group h-full flex flex-col cursor-pointer",
        colors.border,
        className
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header: Icon + Title + Percentage */}
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        <div className={cn("p-1.5 rounded-md transition-colors flex-shrink-0", colors.bg, colors.hover)}>
          <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5", colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">
                Vocal Energy
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowInfo(!showInfo)
                }}
                className="p-0.5 hover:bg-slate-700/50 rounded transition-colors flex-shrink-0"
                aria-label="Show energy calculation info"
              >
                <Info className="w-3 h-3 text-slate-400 hover:text-slate-200" />
              </button>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-white font-space leading-tight">
                {score}%
              </div>
            </div>
          </div>
          <div className="text-sm sm:text-base text-slate-400 font-space mt-0.5">
            {status}
          </div>
        </div>
      </div>
      
      {/* Progress Bar - Pushed to bottom */}
      <div className="mt-auto pt-1 flex-shrink-0 min-h-0">
        <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden mb-1">
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
        <div className="flex justify-between text-xs text-slate-400 font-space font-medium mb-0.5 leading-tight">
          <span>Low</span>
          <span>Balanced</span>
          <span>High</span>
        </div>
        
        {/* Percentage markers */}
        <div className="flex justify-between text-xs text-slate-500 font-space font-medium mb-1 leading-tight">
          <span>0%</span>
          <span>40%</span>
          <span>70%</span>
          <span>100%</span>
        </div>
        
        {/* Current and ideal range */}
        <div className="flex justify-between items-center text-xs sm:text-sm text-slate-300 font-space font-medium mt-1">
          <span className="truncate">Current: {status}</span>
          <span className="truncate ml-2">Ideal: 60-75%</span>
        </div>
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
              <span>Volume Consistency:</span>
              <span className="font-mono">{scoreToDots(breakdown.volumeConsistency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cadence (Pauses):</span>
              <span className="font-mono">{scoreToDots(breakdown.pausePattern)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tone (Vocal Fry):</span>
              <span className="font-mono">{scoreToDots(breakdown.vocalFry)}</span>
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
              <div className="text-slate-400 mb-3">The Energy score is calculated from 5 weighted factors:</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Words Per Minute (WPM)</span>
                  <span className="font-semibold text-white">30%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Speed/pace of speech</div>
                
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Pitch Variation</span>
                  <span className="font-semibold text-white">25%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Monotone vs dynamic/enthusiastic</div>
                
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Volume Consistency</span>
                  <span className="font-semibold text-white">20%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Confidence indicator</div>
                
                <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                  <span>Pause Pattern</span>
                  <span className="font-semibold text-white">15%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Strategic vs rushed</div>
                
                <div className="flex justify-between items-center py-1">
                  <span>Vocal Fry/Upspeak</span>
                  <span className="font-semibold text-white">10%</span>
                </div>
                <div className="text-xs text-slate-400 pl-2">Professional tone</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400">
                Formula: (WPM × 0.3) + (Pitch × 0.25) + (Volume × 0.2) + (Pause × 0.15) + (Tone × 0.1)
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
      
      {/* Content - Pushed to bottom */}
      <div className="mt-auto pt-1 flex-shrink-0 min-h-0 overflow-hidden">
        {objections.length === 0 ? (
          <div className="text-sm sm:text-base text-slate-400 font-space leading-tight">No objections detected</div>
        ) : (
          <>
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
          </>
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
      
      {/* Content - Pushed to bottom */}
      <div className="mt-auto pt-1 space-y-1.5 flex-shrink-0 min-h-0 overflow-hidden">
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

  // Determine talk time status
  const getTalkTimeStatus = () => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return { badge: 'Balanced', variant: 'default' as const }
    } else if ((talkTimeRatio >= 35 && talkTimeRatio < 40) || (talkTimeRatio > 60 && talkTimeRatio <= 70)) {
      return { badge: 'OK', variant: 'secondary' as const }
    } else if (talkTimeRatio < 35) {
      return { badge: 'Listen', variant: 'destructive' as const }
    } else {
      return { badge: 'Talk', variant: 'destructive' as const }
    }
  }

  const talkTimeStatus = getTalkTimeStatus()

  // Calculate energy score
  const voiceAnalysisData = getVoiceAnalysisData?.() || null
  const pitchVariation = voiceMetrics?.pitchVariation || voiceAnalysisData?.pitchVariation || 0
  const volumeConsistency = calculateVolumeConsistency(voiceAnalysisData)
  
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
  
  const pausePattern = calculatePausePattern(voiceAnalysisData, transcript, sessionDurationSeconds)
  const vocalFry = detectVocalFryUpspeak(voiceAnalysisData)
  
  const energyScore = calculateEnergyScore(
    wordsPerMinute,
    pitchVariation,
    volumeConsistency,
    pausePattern,
    vocalFry
  )

  // Determine talk time color based on ratio
  const getTalkTimeColor = () => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return {
        progress: 'from-emerald-500 to-green-500',
        border: 'border-emerald-500/60',
        icon: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        hover: 'group-hover:bg-emerald-500/30'
      }
    } else if (talkTimeRatio < 40) {
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
    <div className="grid grid-cols-2 gap-2 h-full items-stretch" style={{ gridTemplateRows: '1.15fr 1fr' }}>
      {/* Talk Time Card - With Dynamic Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group h-full flex flex-col",
          talkTimeColors.border
        )}
      >
        {/* Header: Icon + Title + Percentage */}
        <div className="flex items-start gap-2 mb-3 flex-shrink-0">
          <div className={cn("p-1.5 rounded-md transition-colors flex-shrink-0", talkTimeColors.bg, talkTimeColors.hover)}>
            <Mic className={cn("w-4 h-4 sm:w-5 sm:h-5", talkTimeColors.icon)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm sm:text-base font-semibold text-white font-space leading-tight">Talk Time Ratio</div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-white font-space leading-tight">{talkTimeRatio}%</div>
                {talkTimeStatus.badge && (
                  <Badge variant={talkTimeStatus.variant} className="text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 bg-slate-800 border-slate-600 text-white font-semibold mt-0.5">
                    {talkTimeStatus.badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dynamic Progress Bar - Pushed to bottom */}
        <div className="mt-auto pt-1 flex-shrink-0 min-h-0">
          <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden mb-1">
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
          <div className="flex justify-between text-xs text-slate-400 font-space font-medium mb-0.5 leading-tight">
            <span>Listen</span>
            <span>Balanced</span>
            <span>Talk</span>
          </div>
          
          {/* Percentage markers */}
          <div className="flex justify-between text-xs text-slate-500 font-space font-medium mb-1 leading-tight">
            <span className="flex-shrink-0">0%</span>
            <span className="flex-shrink-0">40%</span>
            <span className="flex-shrink-0">60%</span>
            <span className="flex-shrink-0">100%</span>
          </div>
          
          {/* Current and ideal range */}
          <div className="flex justify-between items-center gap-2 text-xs sm:text-sm text-slate-300 font-space font-medium mt-1">
            <span className="whitespace-nowrap">Current: {talkTimeRatio}%</span>
            <span className="whitespace-nowrap">Ideal: 40-60%</span>
          </div>
        </div>
      </motion.div>
      
      {/* Energy Card - Replaces WPM Card */}
      <EnergyCard energyScore={energyScore} />
      
      {/* Enhanced Objections Card */}
      <EnhancedObjectionsCard 
        objections={extractObjectionsFromTranscript(transcript)}
        className="hidden sm:flex"
      />
      
      {/* Enhanced Techniques Card */}
      <EnhancedTechniquesCard 
        techniquesUsed={techniquesUsed}
        className="hidden sm:flex"
      />
    </div>
  )
}



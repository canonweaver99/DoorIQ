'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Target, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Phase {
  name: string
  timeRange: string
  score: number
  passed: boolean
}

interface ConversationFlowProps {
  phases: Phase[]
  energyData: number[] // normalized 0-10
  focusArea?: {
    phase: string
    timeRange: string
    issues: string[]
  }
  voiceTip?: string
  durationSeconds?: number
}

// Format time in MM:SS format
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

// Get energy color based on value (0-10)
function getEnergyColor(value: number): string {
  const normalized = Math.max(0, Math.min(10, value))
  if (normalized >= 7) return '#10b981' // green
  if (normalized >= 4) return '#eab308' // yellow
  return '#ef4444' // red
}

// Generate gradient stops for energy chart
function generateEnergyGradient(energyData: number[]): string {
  if (energyData.length === 0) return ''
  
  const stops = energyData.map((value, index) => {
    const percent = (index / (energyData.length - 1)) * 100
    const color = getEnergyColor(value)
    return `${color} ${percent}%`
  }).join(', ')
  
  return `linear-gradient(to right, ${stops})`
}

export function ConversationFlow({
  phases,
  energyData,
  focusArea,
  voiceTip,
  durationSeconds = 0
}: ConversationFlowProps) {
  if (!phases || phases.length === 0) {
    return null
  }

  const chartWidth = 800
  const chartHeight = 120
  const padding = 20
  const innerWidth = chartWidth - padding * 2
  const innerHeight = chartHeight - padding * 2

  // Ensure we have valid energy data
  const validEnergyData = energyData && energyData.length > 0 ? energyData : []

  // Generate SVG path for energy chart
  const generateEnergyPath = () => {
    if (validEnergyData.length === 0) return ''
    
    const points = validEnergyData.map((value, index) => {
      const x = padding + (index / (validEnergyData.length - 1)) * innerWidth
      const y = padding + innerHeight - (value / 10) * innerHeight
      return `${x},${y}`
    })
    
    return `M ${points.join(' L ')}`
  }

  // Generate area path (closed path for fill)
  const generateAreaPath = () => {
    if (validEnergyData.length === 0) return ''
    
    const linePath = generateEnergyPath()
    const firstX = padding
    const lastX = padding + innerWidth
    const bottomY = padding + innerHeight
    
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  // Calculate phase divider positions
  const phaseDividers = phases.map((phase, index) => {
    if (index === 0) return 0
    const phaseWidth = innerWidth / phases.length
    return padding + phaseWidth * index
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Conversation Flow</h2>
        <p className="text-gray-400 text-lg">Performance across conversation stages</p>
      </div>

      {/* Phase Timeline */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 md:gap-0">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className={cn(
                "flex-1 p-6 rounded-xl border-2 transition-all",
                index < phases.length - 1 && "md:border-r-0 md:rounded-r-none",
                index > 0 && "md:rounded-l-none",
                phase.passed
                  ? "bg-green-500/10 border-green-500/40"
                  : "bg-red-500/10 border-red-500/40"
              )}
            >
              {/* Phase Name */}
              <div className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
                {phase.name}
              </div>
              
              {/* Time Range */}
              <div className="text-xs text-gray-400 mb-4">
                {phase.timeRange}
              </div>
              
              {/* Score */}
              <div className="mb-3">
                <div className={cn(
                  "text-3xl font-bold",
                  phase.passed ? "text-green-400" : "text-red-400"
                )}>
                  {phase.score}%
                </div>
              </div>
              
              {/* Status Icon */}
              <div className="flex items-center gap-2">
                {phase.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  phase.passed ? "text-green-400" : "text-red-400"
                )}>
                  {phase.passed ? 'Passed' : 'Needs Work'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Energy Visualization */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-300 mb-4">Energy Levels</div>
        <div className="relative bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Gradient definition */}
            {validEnergyData.length > 0 && (
              <defs>
                <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {validEnergyData.map((value, index) => {
                    const percent = (index / (validEnergyData.length - 1)) * 100
                    const color = getEnergyColor(value)
                    return (
                      <stop key={index} offset={`${percent}%`} stopColor={color} />
                    )
                  })}
                </linearGradient>
              </defs>
            )}
            
            {/* Area fill */}
            {validEnergyData.length > 0 && (
              <>
                <path
                  d={generateAreaPath()}
                  fill="url(#energyGradient)"
                  fillOpacity="0.3"
                />
                
                {/* Line */}
                <path
                  d={generateEnergyPath()}
                  stroke="url(#energyGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            
            {/* Phase dividers */}
            {phaseDividers.map((x, index) => (
              index > 0 && (
                <line
                  key={index}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + innerHeight}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              )
            ))}
          </svg>
          
          {/* Energy bar visualization below chart */}
          {validEnergyData.length > 0 && (
            <div className="flex items-end gap-0.5 mt-4 h-8">
              {validEnergyData.map((value, index) => {
                const height = (value / 10) * 100
                return (
                  <div
                    key={index}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor: getEnergyColor(value),
                      minHeight: '2px'
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Focus Area Callout */}
      {focusArea && focusArea.issues && focusArea.issues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-900/40 to-navy-900/60 backdrop-blur-xl border-2 border-blue-500/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border-2 border-yellow-500/40">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span>🎯</span>
                <span>Focus Area: {focusArea.phase} phase ({focusArea.timeRange})</span>
              </h3>
              <ul className="space-y-2">
                {focusArea.issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-200">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Voice Tip */}
      {voiceTip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-blue-500/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-blue-300 mb-1">💡 Try This:</div>
              <p className="text-gray-200 text-sm leading-relaxed">{voiceTip}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}


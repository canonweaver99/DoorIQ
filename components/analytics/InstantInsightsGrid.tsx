'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquare, AlertTriangle, Book, Info, Lightbulb, ExternalLink, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import { detectObjection as detectEnhancedObjection, detectTechnique as detectEnhancedTechnique } from '@/lib/trainer/enhancedPatternAnalyzer'

interface InstantInsightsGridProps {
  instantMetrics?: {
    wordsPerMinute?: number
    conversationBalance?: number
    objectionCount?: number
    closeAttempts?: number
    closeSuccessRate?: number
    techniquesUsed?: string[]
  }
  userName?: string
  transcript?: Array<{ speaker: string; text: string }>
  voiceAnalysis?: {
    avgWPM?: number
    wpmTimeline?: Array<{ time: number; value: number }>
    volumeTimeline?: Array<{ time: number; value: number }>
  }
}

// Tooltip Component
function MetricTooltip({ children, content }: { children: React.ReactNode, content: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-gray-200 font-sans leading-relaxed"
          >
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Technique detection - uses enhanced analyzer first, falls back to legacy
function detectTechnique(text: string): string | null {
  // Try enhanced technique detection first
  const enhancedTechnique = detectEnhancedTechnique(text)
  if (enhancedTechnique) {
    return enhancedTechnique
  }
  
  const lowerText = text.toLowerCase()
  
  // Check for open-ended questions
  if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
    return 'Open-Ended Question'
  }
  
  // Legacy technique patterns (fallback)
  const TECHNIQUE_PATTERNS = {
    feelFeltFound: [
      'i understand how you feel', 'i felt the same way', 'others have felt',
      'i know how you feel', 'i felt that', 'others felt', 'i\'ve felt'
    ],
    socialProof: [
      'other customers', 'neighbors', 'other homeowners', 'many customers',
      'lots of people', 'others have', 'most people', 'customers say',
      'neighbors love', 'everyone says'
    ],
    urgency: [
      'limited time', 'today only', 'special offer', 'act now',
      'don\'t wait', 'limited availability', 'while supplies last',
      'expires soon', 'ending soon', 'last chance'
    ],
    activeListening: [
      'i hear you', 'i understand', 'that makes sense', 'i see',
      'got it', 'i get that', 'absolutely', 'you\'re right',
      'i can see why', 'that\'s understandable'
    ]
  }
  
  for (const [technique, patterns] of Object.entries(TECHNIQUE_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        const formattedName = technique
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim()
        return formattedName === 'Feel Felt Found' ? 'Feel-Felt-Found' : formattedName
      }
    }
  }
  
  return null
}

// Objection detection - uses enhanced analyzer first, falls back to legacy
function detectObjection(text: string): { type: string; text: string } | null {
  // Try enhanced objection detection first
  const enhancedObjection = detectEnhancedObjection(text)
  if (enhancedObjection) {
    // Map enhanced types to display names
    const typeMap: Record<string, string> = {
      price: 'price',
      timing: 'time',
      trust: 'trust',
      need: 'need',
      authority: 'authority',
      comparison: 'comparison',
      skepticism: 'skepticism',
      renter_ownership: 'renter_ownership',
      existing_service: 'existing_service',
      no_problem: 'no_problem',
      contract_fear: 'contract_fear',
      door_policy: 'door_policy',
      brush_off: 'brush_off',
      bad_experience: 'bad_experience',
      just_moved: 'just_moved'
    }
    return { type: typeMap[enhancedObjection.type] || enhancedObjection.type, text }
  }
  
  // Legacy objection patterns (fallback)
  const OBJECTION_PATTERNS = {
    price: ['too expensive', 'can\'t afford', 'price is high', 'costs too much', 'too much money', 'expensive', 'cheaper', 'lower price', 'budget'],
    time: ['not right now', 'maybe later', 'need to think', 'think about it', 'not ready', 'later', 'some other time', 'not now'],
    authority: ['talk to spouse', 'need to discuss', 'not my decision', 'spouse', 'partner', 'wife', 'husband', 'check with'],
    need: ['don\'t need it', 'already have', 'not interested', 'don\'t want', 'not needed', 'no need', 'already got']
  }
  
  const lowerText = text.toLowerCase()
  for (const [type, patterns] of Object.entries(OBJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return { type, text }
      }
    }
  }
  return null
}

export function InstantInsightsGrid({ instantMetrics, userName = 'You', transcript, voiceAnalysis }: InstantInsightsGridProps) {
  const metrics = instantMetrics || {}
  
  // Calculate average WPM - prioritize voiceAnalysis.avgWPM, then calculate from transcript
  let wpm = metrics.wordsPerMinute || 0
  
  // Use voiceAnalysis avgWPM if available
  if (voiceAnalysis?.avgWPM) {
    wpm = voiceAnalysis.avgWPM
  } else if (transcript && Array.isArray(transcript) && transcript.length > 0) {
    // Calculate average WPM from transcript
    const userEntries = transcript.filter((entry: any) => 
      entry.speaker === 'user' || entry.speaker === 'rep'
    )
    
    if (userEntries.length > 0) {
      // Count total words
      const totalWords = userEntries.reduce((sum: number, entry: any) => {
        const text = entry.text || ''
        return sum + text.split(/\s+/).filter((w: string) => w.length > 0).length
      }, 0)
      
      // Calculate duration from first to last entry
      try {
        const firstEntry = userEntries[0]
        const lastEntry = userEntries[userEntries.length - 1]
        
        const firstTime = firstEntry.timestamp instanceof Date 
          ? firstEntry.timestamp.getTime()
          : typeof firstEntry.timestamp === 'string'
            ? new Date(firstEntry.timestamp).getTime()
            : Date.now()
        
        const lastTime = lastEntry.timestamp instanceof Date
          ? lastEntry.timestamp.getTime()
          : typeof lastEntry.timestamp === 'string'
            ? new Date(lastEntry.timestamp).getTime()
            : Date.now()
        
        const durationMs = lastTime - firstTime
        const durationMinutes = Math.max(0.1, durationMs / 60000) // At least 0.1 minutes (6 seconds) to avoid division issues
        wpm = Math.round(totalWords / durationMinutes)
      } catch (e) {
        // Fallback: estimate based on average speaking rate if timestamp parsing fails
        console.warn('Failed to calculate WPM from transcript timestamps:', e)
      }
    }
  }
  
  const balance = metrics.conversationBalance || 0
  
  // Calculate objections from transcript if not in metrics
  let objections = metrics.objectionCount || 0
  let objectionsHandled = 0
  const objectionTypes: Record<string, number> = {}
  
  if (transcript && Array.isArray(transcript) && objections === 0) {
    const homeownerEntries = transcript.filter((entry: any) => entry.speaker === 'homeowner' || entry.speaker === 'agent')
    homeownerEntries.forEach((entry: any) => {
      const objection = detectObjection(entry.text || '')
      if (objection) {
        objections++
        objectionTypes[objection.type] = (objectionTypes[objection.type] || 0) + 1
      }
    })
    
    // Count handled objections (user responds after homeowner objection)
    homeownerEntries.forEach((entry: any, index: number) => {
      const objection = detectObjection(entry.text || '')
      if (objection && index < homeownerEntries.length - 1) {
        const nextEntry = homeownerEntries[index + 1]
        if (nextEntry && (nextEntry.speaker === 'user' || nextEntry.speaker === 'rep')) {
          objectionsHandled++
        }
      }
    })
  } else {
    objectionsHandled = objections // Assume all were handled if we don't have transcript
  }
  
  // Calculate techniques used from transcript or use provided data
  let techniquesUsed: string[] = []
  if (metrics.techniquesUsed && Array.isArray(metrics.techniquesUsed)) {
    techniquesUsed = metrics.techniquesUsed
  } else if (transcript && Array.isArray(transcript)) {
    const techniquesSet = new Set<string>()
    transcript.forEach((entry: any) => {
      if (entry.speaker === 'user' || entry.speaker === 'rep') {
        const technique = detectTechnique(entry.text || '')
        if (technique) {
          techniquesSet.add(technique)
        }
      }
    })
    techniquesUsed = Array.from(techniquesSet)
  }
  
  const getWPMStatus = () => {
    if (wpm >= 140 && wpm <= 160) return { label: 'GOOD', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/40' }
    if (wpm < 140) return { label: 'SLOW', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/40' }
    return { label: 'FAST', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/40' }
  }
  
  const getBalanceStatus = () => {
    if (balance >= 35 && balance <= 45) return { label: 'BALANCED', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/40' }
    if (balance < 35) return { label: 'LISTEN MORE', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/40' }
    return { label: 'TALK LESS', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/40' }
  }
  
  const wpmStatus = getWPMStatus()
  const balanceStatus = getBalanceStatus()
  const objectionRate = objections > 0 ? Math.round((objectionsHandled / objections) * 100) : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 mb-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white font-space">Performance Metrics</h2>
        <p className="text-sm text-gray-400 font-sans mt-1">Real-time insights from your session</p>
      </div>
      
      <div className="space-y-4">
        {/* Speaking Pace - Horizontal Card */}
        <div className={cn("rounded-xl p-5 border-2", wpmStatus.borderColor, wpmStatus.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3">
                <Mic className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white font-space">Speaking Pace</span>
                    <MetricTooltip content="Words Per Minute (WPM) measures your speaking pace. The target of 150 WPM ensures you maintain engagement while allowing customers to process information.">
                      <Info className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
                    </MetricTooltip>
                  </div>
                  <div className="text-xs text-gray-400 font-sans">Current pace vs. target</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1 font-space">{wpm}</div>
                <div className="text-sm text-gray-300 font-sans">WPM</div>
              </div>
              
              <div className="w-20 h-20">
                <ProgressRing
                  value={wpm}
                  max={200}
                  size={80}
                  strokeWidth={8}
                  showValue={false}
                />
              </div>
              
              <div className="text-right min-w-[120px]">
                <div className={cn("text-lg font-bold mb-1 font-space", wpmStatus.color)}>{wpmStatus.label}</div>
                <div className="text-lg font-bold text-white font-space">Target 150 WPM</div>
                <div className="text-xs text-gray-500 font-sans mt-1">
                  {wpm < 140 ? 'Try speaking faster' : wpm > 160 ? 'Slow down slightly' : 'Optimal pace'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time-Talk Ratio - Horizontal Card */}
        <div className={cn("rounded-xl p-5 border-2", balanceStatus.borderColor, balanceStatus.bgColor)}>
          <div className="flex items-center justify-between gap-6">
            {/* Left Side: Icon + Title + Description */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-purple-400 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-white font-space">Time-Talk Ratio</span>
                  <MetricTooltip content="Time-Talk Ratio measures the percentage of conversation time you spoke vs. the customer. Target is 40% to maintain engagement while allowing discovery.">
                    <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
                  </MetricTooltip>
                </div>
                <div className="text-xs text-gray-400 font-sans">Your speaking time vs. customer</div>
              </div>
            </div>
            
            {/* Center: Progress Bar */}
            <div className="flex-1 max-w-[350px] flex items-center">
              <div className="w-full">
                <div className="relative h-4 bg-slate-800/80 rounded-full overflow-hidden mb-2">
                  {/* Background zones */}
                  <div className="absolute inset-0 flex">
                    <div className="w-[30%] bg-red-500/20" />
                    <div className="w-[20%] bg-green-500/20" />
                    <div className="flex-1 bg-red-500/20" />
                  </div>
                  
                  {/* Progress fill */}
                  <motion.div
                    className={cn(
                      "absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500",
                      balance >= 30 && balance <= 50
                        ? "from-green-500 to-green-400"
                        : "from-red-500 to-red-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${balance}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  {/* Zone markers */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-500/60" />
                    <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-600/80 font-bold" />
                    <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-500/60" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-sans">
                  <span>0%</span>
                  <span className="text-slate-500">Target 40%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            
            {/* Right Side: Metric + Target + Sparkline + Coaching */}
            <div className="text-right min-w-[140px] flex-shrink-0">
              {/* Primary Metric */}
              <div className="text-4xl font-bold text-white mb-2 font-space">
                <span className={balanceStatus.color}>{balance}%</span>
              </div>
              
              {/* Target Info */}
              <div className="text-sm text-gray-400 font-sans mb-3">Target: 40%</div>
              
              {/* Coaching Tip */}
              <div className={cn("text-sm font-bold font-space", balanceStatus.color)}>
                {balanceStatus.label}
              </div>
            </div>
          </div>
        </div>
        
        {/* Objections - Horizontal Card */}
        <div className="rounded-xl p-5 border-2 border-amber-500/40 bg-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white font-space">Objections</span>
                    <MetricTooltip content="Objections are customer concerns or hesitations. Facing objections is normal and shows you're pushing for the sale. Handling them effectively demonstrates your ability to address concerns.">
                      <Info className="w-4 h-4 text-gray-400 hover:text-amber-400 transition-colors" />
                    </MetricTooltip>
                  </div>
                  <div className="text-xs text-gray-400 font-sans">Customer concerns and your responses</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 font-space">{objections}</div>
                <div className="text-sm text-gray-300 font-sans">Faced</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1 font-space">{objectionsHandled}</div>
                <div className="text-sm text-gray-300 font-sans">Handled</div>
              </div>
              
              <div className="text-center min-w-[120px]">
                <div className="text-2xl font-bold text-white mb-1 font-space">
                  {objections > 0 ? `${objectionRate}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-300 font-sans">Success Rate</div>
                {Object.keys(objectionTypes).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {Object.entries(objectionTypes).slice(0, 3).map(([type, count]) => (
                      <span key={type} className="px-2 py-0.5 text-xs bg-amber-500/30 text-amber-300 rounded-full border border-amber-500/40">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Techniques Used - Horizontal Card */}
        <div className="rounded-xl p-5 border-2 border-emerald-500/40 bg-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3">
                <Book className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white font-space">Sales Techniques</span>
                    <MetricTooltip content="Techniques Used shows the sales techniques you applied during the conversation. Using multiple techniques demonstrates versatility and helps build rapport, handle objections, and close deals effectively.">
                      <Info className="w-4 h-4 text-gray-400 hover:text-emerald-400 transition-colors" />
                    </MetricTooltip>
                  </div>
                  <div className="text-xs text-gray-400 font-sans">Techniques applied during conversation</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1 font-space">{techniquesUsed.length}</div>
                <div className="text-sm text-gray-300 font-sans">Total Used</div>
              </div>
              
              <div className="flex flex-wrap gap-2 max-w-[400px]">
                {techniquesUsed.length > 0 ? (
                  techniquesUsed.map((technique, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-sm font-medium bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {technique}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1.5 text-sm text-gray-400 font-sans italic">No techniques detected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

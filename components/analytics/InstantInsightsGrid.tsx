'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquare, AlertTriangle, Book, Info, Lightbulb, ExternalLink, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import { Sparkline } from './Sparkline'

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

// Technique detection patterns (same as live session)
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

function detectTechnique(text: string): string | null {
  const lowerText = text.toLowerCase()
  
  // Check for open-ended questions
  if (/^(what|how|why|when|where|tell me|can you explain)/i.test(text.trim())) {
    return 'Open-Ended Question'
  }
  
  // Check other techniques
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

// Objection detection patterns
const OBJECTION_PATTERNS = {
  price: ['too expensive', 'can\'t afford', 'price is high', 'costs too much', 'too much money', 'expensive', 'cheaper', 'lower price', 'budget'],
  time: ['not right now', 'maybe later', 'need to think', 'think about it', 'not ready', 'later', 'some other time', 'not now'],
  authority: ['talk to spouse', 'need to discuss', 'not my decision', 'spouse', 'partner', 'wife', 'husband', 'check with'],
  need: ['don\'t need it', 'already have', 'not interested', 'don\'t want', 'not needed', 'no need', 'already got']
}

function detectObjection(text: string): { type: string; text: string } | null {
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
  const wpm = metrics.wordsPerMinute || 0
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
                {voiceAnalysis?.wpmTimeline && voiceAnalysis.wpmTimeline.length > 0 && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400 font-sans">Throughout call:</span>
                    <Sparkline 
                      data={voiceAnalysis.wpmTimeline} 
                      width={60} 
                      height={16} 
                      color={wpm < 140 ? '#f59e0b' : wpm > 160 ? '#ef4444' : '#10b981'} 
                    />
                  </div>
                )}
                <div className="text-xs text-gray-500 font-sans mt-1">
                  {wpm < 140 ? 'Try speaking faster' : wpm > 160 ? 'Slow down slightly' : 'Optimal pace'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time-Talk Ratio - Horizontal Card */}
        <div className={cn("rounded-xl p-5 border-2", balanceStatus.borderColor, balanceStatus.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-400" />
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
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1 max-w-[300px]">
                <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={cn(
                      "absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500",
                      balance >= 35 && balance <= 45
                        ? "from-green-500 to-green-400"
                        : balance < 35
                        ? "from-yellow-500 to-yellow-400"
                        : "from-red-500 to-red-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${balance}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  <div className="absolute left-[40%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-500/60" />
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-sans">
                  <span>0%</span>
                  <span className="text-lg font-bold text-white font-space">Target 40%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="text-right min-w-[120px]">
                <div className="text-3xl font-bold text-white mb-1 font-space">
                  <span className={balanceStatus.color}>{balance}%</span>
                </div>
                <div className="text-lg font-bold text-white font-space mb-1">Target 40%</div>
                {voiceAnalysis?.volumeTimeline && voiceAnalysis.volumeTimeline.length > 0 && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400 font-sans">Throughout call:</span>
                    <Sparkline 
                      data={voiceAnalysis.volumeTimeline} 
                      width={60} 
                      height={16} 
                      color={balance >= 35 && balance <= 45 ? '#10b981' : balance < 35 ? '#f59e0b' : '#ef4444'} 
                    />
                  </div>
                )}
                <div className="text-sm text-gray-300 font-sans mb-1">{userName}</div>
                <div className={cn("text-sm font-bold font-space", balanceStatus.color)}>{balanceStatus.label}</div>
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

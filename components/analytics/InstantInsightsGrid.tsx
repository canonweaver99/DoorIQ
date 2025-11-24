'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquare, AlertTriangle, Book, Info, Lightbulb, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

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

/**
 * InstantInsightsGrid - Displays speaking and time-talk ratio metrics
 * 
 * NOTE: Speaking and Time-Talk Ratio cards require ElevenLabs webhook to be configured:
 * 1. Set up webhook endpoint at /api/elevenlabs/webhook
 * 2. Configure ElevenLabs to send conversation.analyzed events
 * 3. Ensure conversation includes transcript with speaker labels (user/agent)
 * 4. Metrics are calculated from transcript analysis and stored in instant_metrics
 * 
 * If cards show empty data, verify:
 * - ElevenLabs webhook is receiving events
 * - Session has elevenlabs_conversation_id set
 * - Transcript includes speaker information
 * - instant_metrics contains wordsPerMinute and conversationBalance
 */
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

export function InstantInsightsGrid({ instantMetrics, userName = 'You', transcript }: InstantInsightsGridProps) {
  const metrics = instantMetrics || {}
  const wpm = metrics.wordsPerMinute || 0
  const balance = metrics.conversationBalance || 0
  const objections = metrics.objectionCount || 0
  
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
    if (wpm >= 140 && wpm <= 160) return { label: 'GOOD', color: 'text-green-400' }
    if (wpm < 140) return { label: 'SLOW', color: 'text-yellow-400' }
    return { label: 'FAST', color: 'text-red-400' }
  }
  
  const getBalanceStatus = () => {
    if (balance >= 35 && balance <= 45) return { label: 'BALANCED', color: 'text-green-400' }
    if (balance < 35) return { label: 'LISTEN MORE', color: 'text-yellow-400' }
    return { label: 'TALK LESS', color: 'text-red-400' }
  }
  
  
  const getWPMRecommendation = () => {
    if (wpm < 140) {
      return "Try practicing with our voice coach to build muscle memory for 150 WPM pacing. Focus on speaking clearly without rushing."
    }
    if (wpm > 160) {
      return "Slow down slightly to ensure clarity. Aim for 150 WPM to maintain engagement while allowing customers to process information."
    }
    return "Great pace! You're maintaining optimal speaking speed for customer engagement."
  }
  
  const getBalanceRecommendation = () => {
    if (balance < 35) {
      return "Ask more open-ended questions to encourage customer dialogue. The 40% target ensures you maintain control while allowing discovery."
    }
    if (balance > 45) {
      return "Give customers more space to speak. Listening more helps uncover needs and build rapport."
    }
    return "Excellent time-talk ratio! You're maintaining engagement while allowing customers to share their needs."
  }
  
  const getObjectionRecommendation = () => {
    if (objections === 0) {
      return "No objections detected. Consider asking more probing questions to uncover concerns. Objections are opportunities to address real needs."
    }
    return "You handled objections well! Continue practicing objection handling scenarios to improve your response rate."
  }
  
  const wpmStatus = getWPMStatus()
  const balanceStatus = getBalanceStatus()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {/* Speaking Pace */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white font-space">Speaking</span>
            <MetricTooltip content="Words Per Minute (WPM) measures your speaking pace. The target of 150 WPM ensures you maintain engagement while allowing customers to process information. Too slow can bore customers, too fast can overwhelm them.">
              <Info className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors" />
            </MetricTooltip>
          </div>
          <ProgressRing
            value={wpm}
            max={200}
            size={60}
            strokeWidth={6}
            showValue={false}
          />
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">
            Pace: <span className={wpmStatus.color}>{wpmStatus.label}</span>
          </div>
          <div className="text-lg text-gray-300 font-sans">{wpm} WPM</div>
        </div>
        <div className="text-xs text-gray-400 font-sans mb-3">Target: 150 WPM</div>
      </div>
      
      {/* Time-Talk Ratio */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white font-space">Time-Talk Ratio</span>
          <MetricTooltip content="Time-Talk Ratio measures the percentage of conversation time you spoke vs. the customer, calculated by character count. Target is 60% to maintain engagement while allowing discovery. Too low means you're not guiding the conversation, too high means you're talking too much.">
            <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
          </MetricTooltip>
        </div>
        
        {/* Horizontal Progress Bar */}
        <div className="mb-3">
          <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden mb-2">
            <motion.div
              className={cn(
                "absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500",
                balance >= 35 && balance <= 45
                  ? "from-green-500 to-green-400"
                  : balance < 35 || balance > 45
                  ? balance < 35 
                    ? "from-yellow-500 to-yellow-400"
                    : "from-red-500 to-red-400"
                  : "from-purple-500 to-purple-400"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${balance}%` }}
              transition={{ duration: 0.5 }}
            />
            {/* Target indicator at 60% */}
            {balance !== 60 && (
              <div className="absolute left-[60%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-500/60" />
            )}
          </div>
        </div>
        
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">
            <span className={balanceStatus.color}>{balance}%</span> <span className="text-gray-300">({userName})</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 font-sans">Target: 60% {userName}</div>
      </div>
      
      {/* Objections */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-white font-space">Objections</span>
          <MetricTooltip content="Objections are customer concerns or hesitations. Facing objections is normal and shows you're pushing for the sale. Handling them effectively demonstrates your ability to address concerns and move conversations forward.">
            <Info className="w-4 h-4 text-gray-400 hover:text-amber-400 transition-colors" />
          </MetricTooltip>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">Faced: {objections}</div>
          <div className="text-sm text-gray-300 font-sans">Handled: {objections}</div>
        </div>
        <div className="text-xs text-gray-400 font-sans mb-3">
          {objections > 0 ? `Rate: ${Math.round((objections / objections) * 100)}%` : 'Rate: N/A'}
        </div>
      </div>
      
      {/* Techniques Used */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Book className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white font-space">Techniques</span>
          <MetricTooltip content="Techniques Used shows the sales techniques you applied during the conversation. Using multiple techniques demonstrates versatility and helps build rapport, handle objections, and close deals effectively.">
            <Info className="w-4 h-4 text-gray-400 hover:text-emerald-400 transition-colors" />
          </MetricTooltip>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">{techniquesUsed.length}</div>
          <div className="text-sm text-gray-300 font-sans">Used</div>
        </div>
        {techniquesUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {techniquesUsed.slice(0, 3).map((technique, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30"
              >
                {technique}
              </span>
            ))}
            {techniquesUsed.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium text-gray-400">
                +{techniquesUsed.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}


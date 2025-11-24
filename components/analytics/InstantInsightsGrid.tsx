'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MessageSquare, AlertTriangle, Target, Info, Lightbulb, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'

interface InstantInsightsGridProps {
  instantMetrics?: {
    wordsPerMinute?: number
    conversationBalance?: number
    objectionCount?: number
    closeAttempts?: number
    closeSuccessRate?: number
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

/**
 * InstantInsightsGrid - Displays speaking and dialogue metrics
 * 
 * NOTE: Speaking and Dialogue cards require ElevenLabs webhook to be configured:
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
export function InstantInsightsGrid({ instantMetrics }: InstantInsightsGridProps) {
  const metrics = instantMetrics || {}
  const wpm = metrics.wordsPerMinute || 0
  const balance = metrics.conversationBalance || 0
  const objections = metrics.objectionCount || 0
  const closeAttempts = metrics.closeAttempts || 0
  const closeSuccess = metrics.closeSuccessRate || 0
  
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
  
  const getCloseStatus = () => {
    if (closeAttempts === 0) return { label: 'WEAK CLOSE', color: 'text-red-400' }
    if (closeSuccess >= 50) return { label: 'STRONG CLOSE', color: 'text-green-400' }
    return { label: 'NEEDS WORK', color: 'text-yellow-400' }
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
    return "Excellent balance! You're maintaining engagement while allowing customers to share their needs."
  }
  
  const getObjectionRecommendation = () => {
    if (objections === 0) {
      return "No objections detected. Consider asking more probing questions to uncover concerns. Objections are opportunities to address real needs."
    }
    return "You handled objections well! Continue practicing objection handling scenarios to improve your response rate."
  }
  
  const getCloseRecommendation = () => {
    if (closeAttempts === 0) {
      return "Practice closing techniques! Try assumptive closes like 'When would you like to get started?' to move conversations forward."
    }
    if (closeSuccess < 50) {
      return "Work on your closing approach. Practice different closing techniques and learn to read buying signals."
    }
    return "Strong closing performance! Keep refining your techniques to maintain this success rate."
  }
  
  const wpmStatus = getWPMStatus()
  const balanceStatus = getBalanceStatus()
  const closeStatus = getCloseStatus()
  
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
      
      {/* Dialogue Balance */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-white font-space">Dialogue</span>
            <MetricTooltip content="Conversation Balance measures the percentage of conversation you led vs. the customer. Target is 40% to maintain engagement while allowing discovery. Too low means you're not guiding the conversation, too high means you're talking too much.">
              <Info className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
            </MetricTooltip>
          </div>
          <ProgressRing
            value={balance}
            max={100}
            size={60}
            strokeWidth={6}
            showValue={false}
          />
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">
            Balance: <span className={balanceStatus.color}>{balance}%</span>
          </div>
          <div className="text-sm text-gray-300 font-sans">({balance}% You)</div>
        </div>
        <div className="text-xs text-gray-400 font-sans mb-3">Target: 40%</div>
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
      
      {/* Closing */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white font-space">Closing</span>
          <MetricTooltip content="Closing attempts measure how many times you tried to close the sale. Success rate shows how effective your closing techniques were. Multiple attempts with high success rate indicate strong closing skills.">
            <Info className="w-4 h-4 text-gray-400 hover:text-emerald-400 transition-colors" />
          </MetricTooltip>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1 font-space">Attempts: {closeAttempts}</div>
          <div className="text-sm text-gray-300 font-sans">
            Success: <span className={closeStatus.color}>{closeSuccess}%</span>
          </div>
        </div>
        <div className={cn("text-xs font-sans mb-3", closeStatus.color)}>{closeStatus.label}</div>
      </div>
    </motion.div>
  )
}


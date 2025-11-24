'use client'

import { motion } from 'framer-motion'
import { Mic, MessageSquare, AlertTriangle, Target } from 'lucide-react'
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
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">Speaking</span>
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
          <div className="text-2xl font-bold text-white mb-1">
            Pace: <span className={wpmStatus.color}>{wpmStatus.label}</span>
          </div>
          <div className="text-lg text-gray-300">{wpm} WPM</div>
        </div>
        <div className="text-xs text-gray-400">Target: 150 WPM</div>
      </div>
      
      {/* Dialogue Balance */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-white">Dialogue</span>
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
          <div className="text-2xl font-bold text-white mb-1">
            Balance: <span className={balanceStatus.color}>{balance}%</span>
          </div>
          <div className="text-sm text-gray-300">({balance}% You)</div>
        </div>
        <div className="text-xs text-gray-400">Target: 40%</div>
      </div>
      
      {/* Objections */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-white">Objections</span>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1">Faced: {objections}</div>
          <div className="text-sm text-gray-300">Handled: {objections}</div>
        </div>
        <div className="text-xs text-gray-400">
          {objections > 0 ? `Rate: ${Math.round((objections / objections) * 100)}%` : 'Rate: N/A'}
        </div>
      </div>
      
      {/* Closing */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Closing</span>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-white mb-1">Attempts: {closeAttempts}</div>
          <div className="text-sm text-gray-300">
            Success: <span className={closeStatus.color}>{closeSuccess}%</span>
          </div>
        </div>
        <div className={cn("text-xs", closeStatus.color)}>{closeStatus.label}</div>
      </div>
    </motion.div>
  )
}


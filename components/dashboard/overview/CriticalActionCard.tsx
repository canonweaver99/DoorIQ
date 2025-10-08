'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CriticalAction {
  id: number
  text: string
  severity: 'high' | 'medium' | 'low'
  timestamp: Date
}

interface CriticalActionCardProps {
  actions: CriticalAction[]
}

export default function CriticalActionCard({ actions }: CriticalActionCardProps) {
  const [dismissedIds, setDismissedIds] = useState<number[]>([])
  const [snoozedIds, setSnoozedIds] = useState<number[]>([])
  const [collapsed, setCollapsed] = useState(false)

  // Load dismissed/snoozed from localStorage
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedActions') || '[]')
    const snoozed = JSON.parse(localStorage.getItem('snoozedActions') || '[]')
    setDismissedIds(dismissed)
    setSnoozedIds(snoozed)
    
    const viewed = localStorage.getItem('criticalActionsViewed')
    if (viewed) setCollapsed(true)
  }, [])

  const activeActions = actions.filter(a => 
    !dismissedIds.includes(a.id) && !snoozedIds.includes(a.id)
  )

  const handleDismiss = (id: number) => {
    const newDismissed = [...dismissedIds, id]
    setDismissedIds(newDismissed)
    localStorage.setItem('dismissedActions', JSON.stringify(newDismissed))
  }

  const handleSnooze = (id: number) => {
    const newSnoozed = [...snoozedIds, id]
    setSnoozedIds(newSnoozed)
    localStorage.setItem('snoozedActions', JSON.stringify(newSnoozed))
    
    // Auto-unsnooze after 24 hours
    setTimeout(() => {
      const updated = newSnoozed.filter(sid => sid !== id)
      setSnoozedIds(updated)
      localStorage.setItem('snoozedActions', JSON.stringify(updated))
    }, 24 * 60 * 60 * 1000)
  }

  const handleView = () => {
    setCollapsed(!collapsed)
    localStorage.setItem('criticalActionsViewed', 'true')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500/50 bg-red-500/5'
      case 'medium': return 'border-amber-500/50 bg-amber-500/5'
      case 'low': return 'border-green-500/50 bg-green-500/5'
      default: return 'border-purple-500/50 bg-purple-500/5'
    }
  }

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-amber-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-purple-500'
    }
  }

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (activeActions.length === 0) return null

  return (
    <AnimatePresence mode="wait">
      {collapsed ? (
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleView}
          className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl px-4 py-2 backdrop-blur-sm hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">{activeActions.length} Critical Action{activeActions.length > 1 ? 's' : ''}</span>
          </div>
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {activeActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`relative bg-[#1e1e30]/60 backdrop-blur-xl border ${getBorderColor(action.severity)} border-l-4 rounded-xl p-4 ${getSeverityColor(action.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={`w-4 h-4 ${
                      action.severity === 'high' ? 'text-red-400' :
                      action.severity === 'medium' ? 'text-amber-400' :
                      'text-green-400'
                    }`} />
                    <span className="text-sm font-medium text-white">{action.text}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Detected {getTimeAgo(action.timestamp)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDismiss(action.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors">
                  Review
                </button>
                <button 
                  onClick={() => handleDismiss(action.id)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => handleSnooze(action.id)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium text-slate-400 transition-colors"
                >
                  Snooze 24h
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}


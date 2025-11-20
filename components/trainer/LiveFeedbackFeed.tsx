'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { FeedbackItem } from '@/lib/trainer/types'
import { AlertCircle, CheckCircle2, Lightbulb, AlertTriangle, Mic } from 'lucide-react'

interface LiveFeedbackFeedProps {
  feedbackItems: FeedbackItem[]
}

const getFeedbackConfig = (item: FeedbackItem) => {
  switch (item.type) {
    case 'objection_detected':
      return {
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        badgeText: 'Objection',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-300'
      }
    case 'technique_used':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'Technique',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-300'
      }
    case 'coaching_tip':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'Tip',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-300'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeVariant: 'destructive' as const,
        badgeText: 'Warning',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-300'
      }
    case 'voice_coaching':
      return {
        icon: Mic,
        badgeVariant: 'secondary' as const,
        badgeText: 'Voice',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-300'
      }
    default:
      return {
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        badgeText: 'Info',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-300'
      }
  }
}

function FeedbackItemComponent({ item }: { item: FeedbackItem }) {
  const config = getFeedbackConfig(item)
  const Icon = config.icon
  
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mb-2`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 mt-0.5 ${config.textColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.badgeVariant} className="text-xs">
              {config.badgeText}
            </Badge>
            <span className="text-xs text-slate-400">{formatTime(item.timestamp)}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{item.message}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function LiveFeedbackFeed({ feedbackItems }: LiveFeedbackFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [feedbackItems])

  return (
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Feedback
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {feedbackItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for feedback...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {feedbackItems.map((item) => (
              <FeedbackItemComponent key={item.id} item={item} />
            ))}
          </AnimatePresence>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  )
}


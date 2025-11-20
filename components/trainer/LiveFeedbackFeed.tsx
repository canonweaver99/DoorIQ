'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
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
        borderColor: 'border-l-yellow-500',
        textColor: 'text-yellow-300'
      }
    case 'technique_used':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'Technique',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-l-green-500',
        textColor: 'text-green-300'
      }
    case 'coaching_tip':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'Tip',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-l-blue-500',
        textColor: 'text-blue-300'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeVariant: 'destructive' as const,
        badgeText: 'Warning',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-l-red-500',
        textColor: 'text-red-300'
      }
    case 'voice_coaching':
      return {
        icon: Mic,
        badgeVariant: 'secondary' as const,
        badgeText: 'Voice',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-l-purple-500',
        textColor: 'text-purple-300'
      }
    default:
      return {
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        badgeText: 'Info',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-l-slate-500',
        textColor: 'text-slate-300'
      }
  }
}

function FeedbackItemComponent({ item, onDismiss }: { item: FeedbackItem; onDismiss?: (id: string) => void }) {
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

  // Auto-dismiss low-priority tips after 15 seconds
  useEffect(() => {
    if (item.type === 'coaching_tip' && item.severity !== 'needs_improvement' && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss(item.id)
      }, 15000)
      return () => clearTimeout(timer)
    }
  }, [item.id, item.type, item.severity, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`p-4 rounded-lg border-l-4 ${config.bgColor} ${config.borderColor} mb-3 animate-fade-in`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${config.textColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={config.badgeVariant} className="text-xs font-medium">
              {config.badgeText}
            </Badge>
            <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{item.message}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function LiveFeedbackFeed({ feedbackItems }: LiveFeedbackFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null)
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set())
  const lastMessageRef = useRef<Map<string, number>>(new Map())

  // Deduplication: prevent same message within 30 seconds
  const deduplicatedItems = useMemo(() => {
    const now = Date.now()
    const filtered: FeedbackItem[] = []
    
    for (const item of feedbackItems) {
      // Skip dismissed items
      if (dismissedItems.has(item.id)) continue
      
      // Check for duplicate messages within 30 seconds
      const messageKey = item.message.toLowerCase().trim()
      const lastTime = lastMessageRef.current.get(messageKey)
      
      if (lastTime && now - lastTime < 30000) {
        continue // Skip duplicate
      }
      
      lastMessageRef.current.set(messageKey, now)
      filtered.push(item)
    }
    
    return filtered
  }, [feedbackItems, dismissedItems])

  const handleDismiss = (id: string) => {
    setDismissedItems(prev => new Set(prev).add(id))
  }

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [deduplicatedItems])

  return (
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Feedback
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {deduplicatedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Waiting for feedback...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {deduplicatedItems.map((item) => (
              <FeedbackItemComponent key={item.id} item={item} onDismiss={handleDismiss} />
            ))}
          </AnimatePresence>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  )
}


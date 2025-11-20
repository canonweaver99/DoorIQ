'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { FeedbackItem } from '@/lib/trainer/types'
import { AlertCircle, CheckCircle2, Lightbulb, AlertTriangle, Mic, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveFeedbackFeedProps {
  feedbackItems: FeedbackItem[]
}

const getFeedbackConfig = (item: FeedbackItem) => {
  switch (item.type) {
    case 'objection_detected':
      return {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        badgeText: 'OBJECTION',
        gradientFrom: 'from-amber-500/10',
        gradientTo: 'to-amber-600/5',
        borderColor: 'border-amber-500/30',
        accentGradient: 'from-amber-500 to-amber-600',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400'
      }
    case 'technique_used':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'TECHNIQUE',
        gradientFrom: 'from-emerald-500/10',
        gradientTo: 'to-emerald-600/5',
        borderColor: 'border-emerald-500/30',
        accentGradient: 'from-emerald-500 to-emerald-600',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400'
      }
    case 'coaching_tip':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'TIP',
        gradientFrom: 'from-blue-500/10',
        gradientTo: 'to-blue-600/5',
        borderColor: 'border-blue-500/30',
        accentGradient: 'from-blue-500 to-blue-600',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeVariant: 'destructive' as const,
        badgeText: 'WARNING',
        gradientFrom: 'from-rose-500/10',
        gradientTo: 'to-rose-600/5',
        borderColor: 'border-rose-500/30',
        accentGradient: 'from-rose-500 to-rose-600',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400'
      }
    case 'voice_coaching':
      return {
        icon: Mic,
        badgeVariant: 'secondary' as const,
        badgeText: 'VOICE',
        gradientFrom: 'from-purple-500/10',
        gradientTo: 'to-purple-600/5',
        borderColor: 'border-purple-500/30',
        accentGradient: 'from-purple-500 to-purple-600',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400'
      }
    case 'objection_handling':
      return {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        badgeText: 'OBJECTION HANDLING',
        gradientFrom: 'from-orange-500/10',
        gradientTo: 'to-orange-600/5',
        borderColor: 'border-orange-500/30',
        accentGradient: 'from-orange-500 to-orange-600',
        iconBg: 'bg-orange-500/20',
        iconColor: 'text-orange-400'
      }
    case 'closing_behavior':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'CLOSING',
        gradientFrom: 'from-emerald-500/10',
        gradientTo: 'to-emerald-600/5',
        borderColor: 'border-emerald-500/30',
        accentGradient: 'from-emerald-500 to-emerald-600',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400'
      }
    case 'momentum_shift':
      return {
        icon: TrendingUp,
        badgeVariant: 'secondary' as const,
        badgeText: 'MOMENTUM',
        gradientFrom: 'from-teal-500/10',
        gradientTo: 'to-teal-600/5',
        borderColor: 'border-teal-500/30',
        accentGradient: 'from-teal-500 to-teal-600',
        iconBg: 'bg-teal-500/20',
        iconColor: 'text-teal-400'
      }
    case 'question_quality':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'QUESTION',
        gradientFrom: 'from-sky-500/10',
        gradientTo: 'to-sky-600/5',
        borderColor: 'border-sky-500/30',
        accentGradient: 'from-sky-500 to-sky-600',
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-400'
      }
    case 'price_handling':
      return {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        badgeText: 'PRICE',
        gradientFrom: 'from-violet-500/10',
        gradientTo: 'to-violet-600/5',
        borderColor: 'border-violet-500/30',
        accentGradient: 'from-violet-500 to-violet-600',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400'
      }
    default:
      return {
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        badgeText: 'INFO',
        gradientFrom: 'from-slate-500/10',
        gradientTo: 'to-slate-600/5',
        borderColor: 'border-slate-500/30',
        accentGradient: 'from-slate-500 to-slate-600',
        iconBg: 'bg-slate-500/20',
        iconColor: 'text-slate-400'
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
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative bg-gradient-to-br rounded-lg p-3 border shadow-xl w-full",
        "transform transition-all duration-300",
        config.gradientFrom,
        config.gradientTo,
        config.borderColor
      )}
    >
      {/* Accent line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-gradient-to-b",
        config.accentGradient
      )} />
      
      <div className="flex items-start gap-2 ml-0.5">
        {/* Icon */}
        <div className={cn(
          "p-1.5 rounded-md flex-shrink-0",
          config.iconBg
        )}>
          <Icon className={cn("w-4 h-4", config.iconColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge 
              variant={config.badgeVariant}
              className="text-[10px] font-medium px-1.5 py-0.5"
            >
              {config.badgeText}
            </Badge>
            <span className="text-[10px] text-white/80 font-space">{formatTime(item.timestamp)}</span>
          </div>
          <p className="text-sm text-white leading-relaxed font-space font-medium">
            {item.message}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function LiveFeedbackFeed({ feedbackItems }: LiveFeedbackFeedProps) {
  const lastMessageRef = useRef<Map<string, number>>(new Map())
  const [currentItem, setCurrentItem] = useState<FeedbackItem | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get the most recent feedback item (one at a time, no scrolling)
  const latestItem = useMemo(() => {
    if (feedbackItems.length === 0) return null
    
    const now = Date.now()
    // Get the most recent item that hasn't been shown recently
    const sortedItems = [...feedbackItems].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    )
    
    for (const item of sortedItems) {
      // Check for duplicate messages within 30 seconds
      const messageKey = item.message.toLowerCase().trim()
      const lastTime = lastMessageRef.current.get(messageKey)
      
      if (lastTime && now - lastTime < 30000) {
        continue // Skip duplicate
      }
      
      lastMessageRef.current.set(messageKey, now)
      return item
    }
    
    // If all are duplicates, return the most recent one anyway
    return sortedItems[0] || null
  }, [feedbackItems])

  // Update current item when a new one arrives
  useEffect(() => {
    if (latestItem && latestItem.id !== currentItem?.id) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Set the new item
      setCurrentItem(latestItem)
      
      // Auto-dismiss after 8 seconds (or keep showing until new one arrives)
      timeoutRef.current = setTimeout(() => {
        setCurrentItem(null)
      }, 8000)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [latestItem, currentItem])

  return (
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-space">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Feedback
        </h3>
      </div>
      
      <div className="flex-1 overflow-hidden p-3 flex items-center justify-center min-h-0">
        <AnimatePresence mode="wait">
          {currentItem ? (
            <FeedbackItemComponent key={currentItem.id} item={currentItem} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full text-white/60 text-sm font-space"
            >
              <div className="text-center">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for feedback...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

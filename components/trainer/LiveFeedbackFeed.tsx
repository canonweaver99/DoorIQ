'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
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
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        accentColor: 'bg-red-500/40',
        bgColor: 'bg-red-900/20'
      }
    case 'technique_used':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'TECHNIQUE',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        accentColor: 'bg-emerald-500/40',
        bgColor: 'bg-emerald-900/20'
      }
    case 'coaching_tip':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'TIP',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        accentColor: 'bg-amber-500/40',
        bgColor: 'bg-amber-900/20'
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        badgeVariant: 'destructive' as const,
        badgeText: 'WARNING',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        accentColor: 'bg-red-500/40',
        bgColor: 'bg-red-900/20'
      }
    case 'voice_coaching':
      return {
        icon: Mic,
        badgeVariant: 'secondary' as const,
        badgeText: 'VOICE',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        accentColor: 'bg-blue-500/40',
        bgColor: 'bg-blue-900/20'
      }
    case 'objection_handling':
      return {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        badgeText: 'OBJECTION HANDLING',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        accentColor: 'bg-red-500/40',
        bgColor: 'bg-red-900/20'
      }
    case 'closing_behavior':
      return {
        icon: CheckCircle2,
        badgeVariant: 'default' as const,
        badgeText: 'CLOSING',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        accentColor: 'bg-emerald-500/40',
        bgColor: 'bg-emerald-900/20'
      }
    case 'momentum_shift':
      return {
        icon: TrendingUp,
        badgeVariant: 'secondary' as const,
        badgeText: 'MOMENTUM',
        iconBg: 'bg-purple-500/20',
        iconColor: 'text-purple-400',
        borderColor: 'border-purple-500/30',
        accentColor: 'bg-purple-500/40',
        bgColor: 'bg-purple-900/20'
      }
    case 'question_quality':
      return {
        icon: Lightbulb,
        badgeVariant: 'secondary' as const,
        badgeText: 'QUESTION',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        accentColor: 'bg-amber-500/40',
        bgColor: 'bg-amber-900/20'
      }
    case 'price_handling':
      return {
        icon: AlertCircle,
        badgeVariant: 'destructive' as const,
        badgeText: 'PRICE',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        borderColor: 'border-red-500/30',
        accentColor: 'bg-red-500/40',
        bgColor: 'bg-red-900/20'
      }
    default:
      return {
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        badgeText: 'INFO',
        iconBg: 'bg-slate-700/50',
        iconColor: 'text-slate-300',
        borderColor: 'border-slate-600/40',
        accentColor: 'bg-slate-600/40',
        bgColor: 'bg-slate-800/70'
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-lg p-2.5 sm:p-3 transition-all group",
        "w-full min-h-[60px] sm:h-[70px] flex-shrink-0",
        config.bgColor,
        "border shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
        config.borderColor
      )}
    >
      {/* Accent line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
        config.accentColor
      )} />
      
      <div className="flex items-start gap-2 sm:gap-2.5 ml-1">
        {/* Icon */}
        <div className={cn(
          "p-1.5 sm:p-2 rounded-md flex-shrink-0",
          config.iconBg
        )}>
          <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", config.iconColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-shrink-0">
            <Badge 
              variant={config.badgeVariant}
              className="text-[8px] sm:text-[9px] font-medium px-1.5 sm:px-2 py-0.5 bg-slate-800 border-slate-600 text-slate-300"
            >
              {config.badgeText}
            </Badge>
            <span className="text-[10px] sm:text-xs text-slate-400 font-space">{formatTime(item.timestamp)}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words font-space line-clamp-2 overflow-hidden">
            {item.message}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function LiveFeedbackFeed({ feedbackItems }: LiveFeedbackFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set())

  // Simple deduplication: only filter out dismissed items
  // Items stay visible and scroll up like transcript (no disappearing)
  const deduplicatedItems = useMemo(() => {
    // Just filter out dismissed items - all others stay visible
    return feedbackItems.filter(item => !dismissedItems.has(item.id))
  }, [feedbackItems, dismissedItems])

  const handleDismiss = (id: string) => {
    setDismissedItems(prev => new Set(prev).add(id))
  }

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (scrollContainerRef.current && feedEndRef.current) {
      const container = scrollContainerRef.current
      // Always scroll to bottom when new feedback items are added
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }, [deduplicatedItems.length])

  return (
    <div className="h-full flex flex-col bg-slate-900/98 rounded-lg overflow-hidden border border-slate-700/90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-700/80 flex-shrink-0 bg-slate-900/50">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5 sm:gap-2 font-space">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-500 animate-pulse" />
          Live Feedback
        </h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 sm:px-3 pt-2.5 sm:pt-3 pb-0 custom-scrollbar space-y-2 sm:space-y-2.5 min-h-0 max-h-full"
        style={{ maxHeight: '100%' }}
      >
        {deduplicatedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm font-space">
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
              <p>Waiting for feedback...</p>
            </div>
          </div>
        ) : (
          <>
            {deduplicatedItems.map((item) => (
              <FeedbackItemComponent key={item.id} item={item} />
            ))}
          </>
        )}
        <div ref={feedEndRef} />
      </div>
    </div>
  )
}

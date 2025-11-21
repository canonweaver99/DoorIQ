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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-lg sm:rounded-xl p-2 sm:p-2.5 transition-colors group",
        "w-full min-h-[60px] sm:h-[70px] flex-shrink-0", // Responsive height
        config.gradientFrom,
        config.gradientTo,
        config.borderColor,
        "border"
      )}
    >
      {/* Accent line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg sm:rounded-l-xl bg-gradient-to-b",
        config.accentGradient
      )} />
      
      <div className="flex items-start gap-1.5 sm:gap-2 ml-0.5">
        {/* Icon */}
        <div className={cn(
          "p-0.5 sm:p-1 rounded-md flex-shrink-0",
          config.iconBg
        )}>
          <Icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", config.iconColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 flex-shrink-0">
            <Badge 
              variant={config.badgeVariant}
              className="text-[8px] sm:text-[9px] font-medium px-0.5 sm:px-1 py-0.5"
            >
              {config.badgeText}
            </Badge>
            <span className="text-[10px] sm:text-xs text-white/70 font-space">{formatTime(item.timestamp)}</span>
          </div>
          <p className="text-xs sm:text-sm text-white leading-relaxed break-words font-space line-clamp-2 overflow-hidden">
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
    <div className="h-full flex flex-col bg-slate-900/30 rounded-lg overflow-hidden">
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5 sm:gap-2 font-space">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
          Live Feedback
        </h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 pt-2 sm:pt-3 pb-0 custom-scrollbar space-y-1.5 sm:space-y-2 min-h-0 max-h-full"
        style={{ maxHeight: '100%' }}
      >
        {deduplicatedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60 text-sm font-space">
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
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

'use client'

import { motion } from 'framer-motion'
import { Mic, AlertTriangle, Book } from 'lucide-react'
import { LiveSessionMetrics } from '@/lib/trainer/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LiveMetricsPanelProps {
  metrics: LiveSessionMetrics
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'blue' | 'amber' | 'emerald' | 'purple'
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive'
  progress?: number
  progressLabel?: string
  verticalLayout?: boolean
  className?: string
}

function MetricCard({ icon, label, value, color, subtitle, badge, badgeVariant = 'default', progress, progressLabel, verticalLayout = false, className, wpmValue }: MetricCardProps & { wpmValue?: number }) {
  const colorClasses = {
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/20',
      hover: 'group-hover:bg-blue-500/30',
      progress: 'from-blue-500 to-blue-400',
      border: 'border-blue-500/60',
      accent: 'bg-blue-500/30'
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/20',
      hover: 'group-hover:bg-amber-500/30',
      progress: 'from-amber-500 to-amber-400',
      border: 'border-amber-500/60',
      accent: 'bg-amber-500/30'
    },
    emerald: {
      icon: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      hover: 'group-hover:bg-emerald-500/30',
      progress: 'from-emerald-500 to-emerald-400',
      border: 'border-emerald-500/60',
      accent: 'bg-emerald-500/30'
    },
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-500/20',
      hover: 'group-hover:bg-purple-500/30',
      progress: 'from-purple-500 to-purple-400',
      border: 'border-purple-500/60',
      accent: 'bg-purple-500/30'
    }
  }

  const classes = colorClasses[color]

  if (verticalLayout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-lg pt-4 px-4 pb-4 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group flex flex-col",
          classes.border,
          className
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className={cn("p-1.5 sm:p-2 rounded-md transition-colors", classes.bg, classes.hover)}>
            <div className={classes.icon}>
              {icon}
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-semibold text-white font-space">{label}</div>
            {subtitle && <div className="text-[10px] sm:text-xs text-slate-300 font-space font-medium">{subtitle}</div>}
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-white font-space">{value}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
        className={cn(
          "bg-slate-900 rounded-lg pt-4 px-4 pb-2 border-[2px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300 group",
          classes.border,
          className
        )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn("p-1.5 sm:p-2 rounded-md transition-colors", classes.bg, classes.hover)}>
            <div className={classes.icon}>
              {icon}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white font-space">{label}</div>
            {subtitle && <div className="text-[10px] sm:text-xs text-slate-300 font-space font-medium">{subtitle}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold text-white mb-0.5 font-space">{value}</div>
          {badge && (
            <Badge variant={badgeVariant} className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-slate-800 border-slate-600 text-white font-semibold">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <>
          <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden mb-1.5">
            <motion.div
              className={cn("absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500", classes.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            {progress > 0 && progress < 100 && (
              <div className={cn("absolute left-[50%] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-slate-500/60")} />
            )}
          </div>
          {progressLabel && (
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-300 font-space font-medium">
              {progressLabel.includes('Target') ? (
                <>
                  <span className="truncate">Current: {wpmValue || Math.round((progress / 100) * 200)} WPM</span>
                  <span className="hidden sm:inline">{progressLabel}</span>
                </>
              ) : (
                <>
                  <span className="truncate">Them: {progress}%</span>
                  <span className="hidden sm:inline">Ideal: 60%</span>
                  <span className="truncate">You: {100 - progress}%</span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export function LiveMetricsPanel({ metrics }: LiveMetricsPanelProps) {
  const { talkTimeRatio, wordsPerMinute, objectionCount, techniquesUsed } = metrics

  // Determine talk time status
  const getTalkTimeStatus = () => {
    if (talkTimeRatio >= 40 && talkTimeRatio <= 60) {
      return { badge: 'Balanced', variant: 'default' as const }
    } else if ((talkTimeRatio >= 35 && talkTimeRatio < 40) || (talkTimeRatio > 60 && talkTimeRatio <= 70)) {
      return { badge: 'OK', variant: 'secondary' as const }
    } else if (talkTimeRatio < 35) {
      return { badge: 'Listen', variant: 'destructive' as const }
    } else {
      return { badge: 'Talk', variant: 'destructive' as const }
    }
  }

  // Determine WPM status
  const getWPMStatus = () => {
    if (wordsPerMinute >= 140 && wordsPerMinute <= 160) {
      return { badge: 'Good', variant: 'default' as const }
    } else if (wordsPerMinute < 140) {
      return { badge: 'Slow', variant: 'secondary' as const }
    } else {
      return { badge: 'Fast', variant: 'destructive' as const }
    }
  }

  const talkTimeStatus = getTalkTimeStatus()
  const wpmStatus = getWPMStatus()

  // Calculate WPM progress (0-200 scale, with 150 as target)
  const wpmProgress = Math.min(100, (wordsPerMinute / 200) * 100)

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 h-auto">
      {/* Talk Time Card - Wider */}
      <MetricCard
        icon={<Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Talk Time Ratio"
        value={`${talkTimeRatio}%`}
        color="blue"
        badge={talkTimeStatus.badge}
        badgeVariant={talkTimeStatus.variant}
        progress={talkTimeRatio}
        progressLabel="Talk time breakdown"
      />
      
      {/* WPM Card - Wider, styled like talk ratio */}
      <MetricCard
        icon={<Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Words Per Minute"
        value={`${wordsPerMinute}`}
        color="purple"
        badge={wpmStatus.badge}
        badgeVariant={wpmStatus.variant}
        progress={wpmProgress}
        progressLabel={`Target: 150 WPM`}
        wpmValue={wordsPerMinute}
      />
      
      {/* Objections Card - Hidden on mobile */}
      <MetricCard
        icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Objections"
        subtitle="Detected"
        value={objectionCount}
        color="amber"
        verticalLayout={true}
        className="hidden sm:flex"
      />
      
      {/* Techniques Card - Hidden on mobile */}
      <MetricCard
        icon={<Book className="w-4 h-4 sm:w-5 sm:h-5" />}
        label="Techniques"
        subtitle="Used"
        value={techniquesUsed.length}
        color="emerald"
        verticalLayout={true}
        className="hidden sm:flex"
      />
    </div>
  )
}

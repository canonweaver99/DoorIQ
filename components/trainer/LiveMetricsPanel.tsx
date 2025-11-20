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
  color: 'blue' | 'amber' | 'emerald'
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive'
  progress?: number
  progressLabel?: string
}

function MetricCard({ icon, label, value, color, subtitle, badge, badgeVariant = 'default', progress, progressLabel }: MetricCardProps) {
  const colorClasses = {
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-500/10',
      hover: 'group-hover:bg-blue-500/20',
      progress: 'from-blue-500 to-blue-400',
      border: 'border-blue-500/30'
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/10',
      hover: 'group-hover:bg-amber-500/20',
      progress: 'from-amber-500 to-amber-400',
      border: 'border-amber-500/30'
    },
    emerald: {
      icon: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      hover: 'group-hover:bg-emerald-500/20',
      progress: 'from-emerald-500 to-emerald-400',
      border: 'border-emerald-500/30'
    }
  }

  const classes = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl pt-4 px-4 pb-2 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 group"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg transition-colors", classes.bg, classes.hover)}>
            <div className={classes.icon}>
              {icon}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-white">{label}</div>
            {subtitle && <div className="text-xs text-white/80">{subtitle}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs px-1.5 py-0.5">
              {badge}
            </Badge>
          )}
        </div>
      </div>
      
      {progress !== undefined && (
        <>
          <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mb-1.5">
            <motion.div
              className={cn("absolute left-0 top-0 h-full bg-gradient-to-r rounded-full transition-all duration-500", classes.progress)}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
            {progress > 0 && progress < 100 && (
              <div className={cn("absolute left-[50%] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/50")} />
            )}
          </div>
          {progressLabel && (
            <div className="flex justify-between text-xs text-white/80">
              <span>You: {progress}%</span>
              <span>Ideal: 50-60%</span>
              <span>Them: {100 - progress}%</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

export function LiveMetricsPanel({ metrics }: LiveMetricsPanelProps) {
  const { talkTimeRatio, objectionCount, techniquesUsed } = metrics

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

  const talkTimeStatus = getTalkTimeStatus()

  return (
    <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-4 h-auto">
      {/* Talk Time Card - Wider */}
      <MetricCard
        icon={<Mic className="w-5 h-5" />}
        label="Talk Time Ratio"
        subtitle="You vs. Homeowner"
        value={`${talkTimeRatio}%`}
        color="blue"
        badge={talkTimeStatus.badge}
        badgeVariant={talkTimeStatus.variant}
        progress={talkTimeRatio}
        progressLabel="Talk time breakdown"
      />
      
      {/* Objections Card */}
      <MetricCard
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Objections"
        subtitle="Detected"
        value={objectionCount}
        color="amber"
      />
      
      {/* Techniques Card */}
      <MetricCard
        icon={<Book className="w-5 h-5" />}
        label="Techniques"
        subtitle="Used"
        value={techniquesUsed.length}
        color="emerald"
      />
    </div>
  )
}

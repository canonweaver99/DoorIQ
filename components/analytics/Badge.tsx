'use client'

import { motion } from 'framer-motion'
import { Trophy, Award, Star, Zap, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  type: 'top_performer' | 'closer' | 'improver' | 'consistent' | 'rapport_master' | 'discovery_pro'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const badgeConfig = {
  top_performer: {
    icon: Trophy,
    label: 'Top Performer',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400'
  },
  closer: {
    icon: Target,
    label: 'Closer',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400'
  },
  improver: {
    icon: TrendingUp,
    label: 'Improver',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400'
  },
  consistent: {
    icon: Star,
    label: 'Consistent',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400'
  },
  rapport_master: {
    icon: Zap,
    label: 'Rapport Master',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400'
  },
  discovery_pro: {
    icon: Award,
    label: 'Discovery Pro',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    textColor: 'text-teal-400'
  }
}

export function Badge({ type, size = 'md', className }: BadgeProps) {
  const config = badgeConfig[type]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold",
        config.bgColor,
        config.borderColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </motion.div>
  )
}

export function getBadgesForSession(
  overallScore: number,
  vsUserAverage: number,
  vsTeamAverage: number,
  saleClosed: boolean,
  trends: { rapport: number; discovery: number; objection_handling: number; closing: number }
): BadgeProps['type'][] {
  const badges: BadgeProps['type'][] = []
  
  // Top Performer - Score above 80 and better than team average
  if (overallScore >= 80 && vsTeamAverage > 0) {
    badges.push('top_performer')
  }
  
  // Closer - Sale closed
  if (saleClosed) {
    badges.push('closer')
  }
  
  // Improver - Positive trend
  const avgTrend = (trends.rapport + trends.discovery + trends.objection_handling + trends.closing) / 4
  if (avgTrend > 5) {
    badges.push('improver')
  }
  
  // Consistent - Within 5 points of average
  if (Math.abs(vsUserAverage) <= 5 && overallScore >= 60) {
    badges.push('consistent')
  }
  
  // Rapport Master - Rapport score high and improving
  if (trends.rapport > 5) {
    badges.push('rapport_master')
  }
  
  // Discovery Pro - Discovery score high and improving
  if (trends.discovery > 5) {
    badges.push('discovery_pro')
  }
  
  return badges.slice(0, 3) // Max 3 badges
}


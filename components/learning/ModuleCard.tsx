'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ArrowRight, Footprints, Zap, Eye, MessageSquare, X, ArrowRightCircle, CheckCircle2, PlayCircle } from 'lucide-react'
import { ProgressIndicator } from './ProgressIndicator'
import { ModuleWithProgress } from '@/lib/learning/types'
import { cn } from '@/lib/utils'

interface ModuleCardProps {
  module: ModuleWithProgress
  delay?: number
  isLast?: boolean
  displayNumber?: number
}

// Map categories to dashboard colors (matching learning center category cards)
const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; border: string; glow: string; textColor: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
    'approach': {
      bg: '#0a2a1a',
      border: '#1a4a2a',
      glow: 'rgba(16, 185, 129, 0.1)',
      textColor: 'text-emerald-200',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-400'
    },
    'pitch': {
      bg: '#1a2a3a',
      border: '#2a4a6a',
      glow: 'rgba(59, 130, 246, 0.1)',
      textColor: 'text-blue-200',
      badgeBg: 'bg-blue-500/10',
      badgeBorder: 'border-blue-500/30',
      badgeText: 'text-blue-400'
    },
    'overcome': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
      textColor: 'text-amber-200',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400'
    },
    'close': {
      bg: '#3a1a2a',
      border: '#6a2a4a',
      glow: 'rgba(236, 72, 153, 0.1)',
      textColor: 'text-pink-200',
      badgeBg: 'bg-pink-500/10',
      badgeBorder: 'border-pink-500/30',
      badgeText: 'text-pink-400'
    },
    'objections': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
      textColor: 'text-amber-200',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400'
    },
    'communication': {
      bg: '#1a1a1a',
      border: '#3a3a3a',
      glow: 'rgba(148, 163, 184, 0.1)',
      textColor: 'text-slate-200',
      badgeBg: 'bg-slate-500/10',
      badgeBorder: 'border-slate-500/30',
      badgeText: 'text-slate-400'
    }
  }
  return colorMap[category] || colorMap['approach']
}

const categoryLabels: Record<string, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
  communication: 'Communication'
}

// Hook lines for each module
const hookLines: Record<string, string> = {
  'positioning': 'The 45-degree angle that changes everything',
  'pattern-interrupt': 'Why you should never mention your product first',
  'reading-signs': 'How to spot the perfect moment before you knock',
  'icebreaker': 'The opener that gets doors to open wider',
  'what-not-to-do': 'The mistakes that get doors slammed',
  'transition': 'How to move from approach to pitch seamlessly',
  'establishing-legitimacy': 'Make them trust you in 30 seconds',
  'value-before-price': 'Build desire before revealing cost',
  'features-vs-benefits': 'Sell outcomes, not features',
  'painting-the-picture': 'Help them visualize their ideal outcome',
  'keep-ammo': 'Save your best points for when they matter',
  'reading-and-adjusting': 'Adapt your pitch in real-time',
  'overcoming-objections-rac': 'The framework that turns no into yes',
  'why-reps-fear-closing': 'Understanding the psychology of closing',
  'soft-closes-vs-hard-closes': 'When to push and when to pull',
  'types-of-soft-closes': 'The gentle closes that work',
  'the-3-close-rule': 'Never give up before three attempts',
  'assumptive-language': 'Speak as if the sale is done',
  'the-hard-close-sequence': 'When it\'s time to ask directly',
  'mirroring': 'Get into their world',
  'eye-contact': 'Look, don\'t stare',
  'paraverbals': 'It\'s not what you say, it\'s how you say it',
  'body-language': 'What you\'re saying without words',
  'reading-their-body-language': 'Decode their signals',
  'energy-management': 'Yours and theirs'
}

// Icons for each module
const moduleIcons: Record<string, typeof Footprints> = {
  'positioning': Footprints,
  'pattern-interrupt': Zap,
  'reading-signs': Eye,
  'icebreaker': MessageSquare,
  'what-not-to-do': X,
  'transition': ArrowRightCircle,
  'establishing-legitimacy': CheckCircle2,
  'value-before-price': Zap,
  'features-vs-benefits': MessageSquare,
  'painting-the-picture': Eye,
  'keep-ammo': X,
  'reading-and-adjusting': Eye,
  'overcoming-objections-rac': Zap,
  'why-reps-fear-closing': X,
  'soft-closes-vs-hard-closes': MessageSquare,
  'types-of-soft-closes': MessageSquare,
  'the-3-close-rule': CheckCircle2,
  'assumptive-language': MessageSquare,
  'the-hard-close-sequence': Zap,
  'mirroring': Eye,
  'eye-contact': Eye,
  'paraverbals': MessageSquare,
  'body-language': Footprints,
  'reading-their-body-language': Eye,
  'energy-management': Zap
}

export function ModuleCard({ module, delay = 0, isLast = false, displayNumber }: ModuleCardProps) {
  const categoryColors = getCategoryColors(module.category)
  // Only completed if progress exists AND completed_at is not null
  const isCompleted = module.progress !== null && module.progress !== undefined && module.progress.completed_at !== null
  const timeSpent = module.progress?.time_spent_seconds || 0
  const isInProgress = timeSpent > 0 && !isCompleted
  
  const hookLine = hookLines[module.slug] || ''
  const IconComponent = moduleIcons[module.slug] || MessageSquare
  
  // Progress state styling - grey when uncompleted, category color when finished
  const getCardColors = () => {
    if (isCompleted) {
      // Use category color when completed
      return {
        bg: categoryColors.bg,
        border: categoryColors.border,
        glow: categoryColors.glow,
        numberBg: categoryColors.border,
        iconBg: `${categoryColors.border}40`
      }
    }
    if (isInProgress) {
      // Slightly tinted with category color when in progress
      return {
        bg: '#1a1a1a',
        border: `${categoryColors.border}80`,
        glow: `${categoryColors.glow}50`,
        numberBg: `${categoryColors.border}80`,
        iconBg: `${categoryColors.border}30`
      }
    }
    // Grey when uncompleted
    return {
      bg: '#1a1a1a',
      border: '#3a3a3a',
      glow: 'rgba(148, 163, 184, 0.05)',
      numberBg: '#3a3a3a',
      iconBg: '#3a3a3a40'
    }
  }

  const cardColors = getCardColors()

  const buttonText = isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'

  return (
    <>
      <Link href={`/learning/modules/${module.slug}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay }}
          className="w-full rounded-lg p-4 sm:p-6 lg:p-7 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative overflow-hidden group touch-manipulation"
          style={{
            backgroundColor: cardColors.bg,
            border: `2px solid ${cardColors.border}`,
            boxShadow: `inset 0 0 20px ${cardColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
          }}
        >
          {/* Top Row: Number, Icon, Content */}
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {/* Lesson Number */}
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl text-white"
              style={{ backgroundColor: cardColors.numberBg }}>
              {displayNumber !== undefined ? displayNumber : module.display_order}
            </div>

            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cardColors.iconBg }}>
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 font-space line-clamp-2 sm:line-clamp-1 leading-tight">
                {module.title}
              </h3>
              {hookLine && (
                <p className="text-sm sm:text-base text-white/85 font-sans line-clamp-1 hidden sm:block">
                  {hookLine}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Row: Progress, Time, Button (Mobile) / Right Side (Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto sm:flex-shrink-0">
            {/* Progress Indicator - Show on mobile too */}
            <div className="sm:hidden">
              <ProgressIndicator
                completed={isCompleted}
                timeSpent={timeSpent}
                estimatedMinutes={module.estimated_minutes}
              />
            </div>
            <div className="hidden sm:block">
              <ProgressIndicator
                completed={isCompleted}
                timeSpent={timeSpent}
                estimatedMinutes={module.estimated_minutes}
              />
            </div>

            {/* Time and Button Row */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              {/* Time */}
              <div className="flex items-center gap-1.5 text-sm sm:text-base text-white/80 font-sans font-bold">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{module.estimated_minutes} min</span>
              </div>

              {/* Button */}
              <button
                className={cn(
                  'px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 text-white min-h-[44px] sm:min-h-auto touch-manipulation active:scale-95',
                  'group-hover:scale-105'
                )}
                style={isCompleted ? {
                  backgroundColor: cardColors.numberBg,
                } : isInProgress ? {
                  backgroundColor: cardColors.numberBg,
                } : {
                  backgroundColor: '#3a3a3a',
                }}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `/learning/modules/${module.slug}`
                }}
              >
                {buttonText}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Completion Overlay */}
          {isCompleted && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
            </div>
          )}
        </motion.div>
      </Link>
      
      {/* Connecting Line */}
      {!isLast && (
        <div className="flex justify-center py-2 sm:py-3">
          <div className="w-1 h-6 sm:h-8" style={{ backgroundColor: isCompleted ? cardColors.border : '#3a3a3a' }} />
        </div>
      )}
    </>
  )
}



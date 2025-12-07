'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Footprints, TrendingUp, ShieldCheck, Trophy, Radio, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FEATURES } from '@/lib/subscription/feature-keys'
import { useRouter } from 'next/navigation'
import { useModules } from '@/hooks/learning/useModules'

interface CategoryCard {
  id: string
  title: string
  subtitle: string
  icon: typeof Rocket
  href: string
  gradient: string
  accentColor: string
  badge?: string
}

const categoryCards: CategoryCard[] = [
  {
    id: 'getting-started',
    title: 'New to DoorIQ?',
    subtitle: 'Your journey starts here',
    icon: Rocket,
    href: '/learning/getting-started',
    gradient: 'from-purple-900 via-purple-950 to-black',
    accentColor: 'purple',
    badge: 'Start'
  },
  {
    id: 'approach',
    title: 'Approach',
    subtitle: 'Own the first 5 seconds',
    icon: Footprints,
    href: '/learning/modules?category=approach',
    gradient: 'from-teal-900 via-slate-900 to-slate-950',
    accentColor: 'teal'
  },
  {
    id: 'pitch',
    title: 'Pitch',
    subtitle: 'Build value, win trust',
    icon: TrendingUp,
    href: '/learning/modules?category=pitch',
    gradient: 'from-amber-900 via-orange-950 to-black',
    accentColor: 'orange'
  },
  {
    id: 'objections',
    title: 'Objection Handling',
    subtitle: 'Turn no into yes',
    icon: ShieldCheck,
    href: '/learning/objections',
    gradient: 'from-red-900 via-slate-900 to-slate-950',
    accentColor: 'red',
    badge: 'Most Popular'
  },
  {
    id: 'close',
    title: 'Closing',
    subtitle: 'Seal the deal',
    icon: Trophy,
    href: '/learning/modules?category=close',
    gradient: 'from-green-900 via-emerald-950 to-black',
    accentColor: 'green'
  },
  {
    id: 'communication',
    title: 'Communication',
    subtitle: 'Master the unspoken',
    icon: Radio,
    href: '/learning/modules?category=communication',
    gradient: 'from-blue-900 via-purple-950 to-black',
    accentColor: 'blue'
  }
]

// Map card IDs to dashboard colors
const getCardColors = (cardId: string) => {
  const colorMap: Record<string, { bg: string; border: string; glow: string; textColor: string }> = {
    'getting-started': {
      bg: '#2a1a3a',
      border: '#4a2a6a',
      glow: 'rgba(138, 43, 226, 0.1)',
      textColor: 'text-purple-200'
    },
    'approach': {
      bg: '#1a3a2a',
      border: '#2a6a4a',
      glow: 'rgba(16, 185, 129, 0.1)',
      textColor: 'text-emerald-200'
    },
    'pitch': {
      bg: '#1a2a3a',
      border: '#2a4a6a',
      glow: 'rgba(59, 130, 246, 0.1)',
      textColor: 'text-blue-200'
    },
    'objections': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
      textColor: 'text-amber-200'
    },
    'close': {
      bg: '#3a1a2a',
      border: '#6a2a4a',
      glow: 'rgba(236, 72, 153, 0.1)',
      textColor: 'text-pink-200'
    },
    'communication': {
      bg: '#1a1a1a',
      border: '#3a3a3a',
      glow: 'rgba(148, 163, 184, 0.1)',
      textColor: 'text-slate-200'
    }
  }
  return colorMap[cardId] || colorMap['getting-started']
}

export default function LearningPage() {
  const router = useRouter()
  const { hasAccess, loading: accessLoading } = useFeatureAccess(FEATURES.LEARNING_PAGE)
  const { modules } = useModules()
  
  // Find in-progress modules for "Continue where you left off" banner
  const inProgressModules = modules.filter(
    (m) => (m.progress?.time_spent_seconds || 0) > 0 && !m.progress?.completed_at
  )
  const nextModule = inProgressModules.length > 0 ? inProgressModules[0] : null

  // TEMPORARILY DISABLED FOR LOCAL EDITING - Re-enable before pushing to production
  const ENABLE_ACCESS_CHECK = false

  if (accessLoading && ENABLE_ACCESS_CHECK) {
    return (
      <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  // ARCHIVED: All paywalls removed - software is now free for signed-in users
  // Access check disabled - all authenticated users have access
  if (false) { // Keep structure but never execute
    return null
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
      <div className="max-w-[1800px] mx-auto pt-4 sm:pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-12 text-center px-2"
        >
          <h1 className="font-space text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-1 sm:mb-2">
            Learning Center
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-slate-300 drop-shadow-md font-space leading-tight">
            Master D2D sales{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              fundamentals
            </span>
          </p>
        </motion.div>

        {/* Continue Learning Banner */}
        {nextModule && (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 sm:mb-6"
          >
            <Link
              href={`/learning/modules/${nextModule.slug}`}
              className="block bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-lg p-3 sm:p-4 active:border-purple-500/50 transition-all duration-300 touch-manipulation"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-purple-400 font-semibold font-space">Continue where you left off</p>
                    <p className="text-white font-medium font-sans text-sm sm:text-base truncate">{nextModule.title}</p>
                </div>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Category Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        >
          {categoryCards.map((card, index) => {
            const Icon = card.icon
            
            // Calculate progress for category cards (except getting-started)
            let progress = null
            let isCompleted = false
            let progressPercentage = 0
            
            if (card.id !== 'getting-started' && card.id !== 'objections') {
              const categoryModules = modules.filter(m => m.category === card.id)
              // Only count as completed if progress exists AND completed_at is not null
              const completed = categoryModules.filter(m => {
                const hasProgress = m.progress !== null && m.progress !== undefined
                const isCompleted = m.progress?.completed_at !== null && m.progress?.completed_at !== undefined
                return hasProgress && isCompleted
              }).length
              const total = categoryModules.length
              if (total > 0) {
                progress = { completed, total }
                isCompleted = completed === total && total > 0
                progressPercentage = (completed / total) * 100
              }
              // Debug logging
              if (card.id === 'approach') {
                console.log('🔍 APPROACH card debug:', {
                  totalModules: total,
                  completedModules: completed,
                  modules: categoryModules.map(m => ({
                    title: m.title,
                    hasProgress: m.progress !== null,
                    completedAt: m.progress?.completed_at
                  }))
                })
              }
            } else {
              // For getting-started and objections, default to 0%
              progressPercentage = 0
            }
            
            const cardColors = getCardColors(card.id)
            const hasProgress = progress && progress.completed > 0
            const buttonText = isCompleted ? 'Review' : hasProgress ? 'Continue' : 'Get Started'
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Link href={card.href} className="touch-manipulation active:scale-[0.98] transition-transform">
                  <div 
                    className="relative rounded-xl p-4 sm:p-5 lg:p-6 h-full flex flex-col min-h-[200px] sm:min-h-[240px] lg:min-h-[256px] overflow-hidden"
                    style={{
                      backgroundColor: cardColors.bg,
                      border: `2px solid ${cardColors.border}`,
                      boxShadow: `inset 0 0 20px ${cardColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
                    }}
                  >
                    {/* Progress Bar at Top */}
                    <div className="mb-4 relative">
                      <div className="w-full bg-slate-900/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-1.5 rounded-full bg-emerald-400"
                        />
                      </div>
                      {/* Completion Badge at end of progress bar */}
                      {isCompleted && (
                        <div className="absolute -right-1 -top-2.5 z-10">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg border-2 border-slate-900">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Badge */}
                    {card.badge && (
                      <div className="absolute top-8 sm:top-10 lg:top-12 right-2 sm:right-3 lg:right-4 z-10">
                        <span className={`
                          px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold
                          ${card.badge === 'Start' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}
                          text-white shadow-lg
                          flex items-center gap-1
                        `}>
                          {card.badge === 'Start' && <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {card.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* Large Icon */}
                    <div className="mb-3 sm:mb-4 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1.5 sm:mb-2 font-space leading-tight uppercase">
                      {card.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-white text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 font-space flex-1 leading-tight uppercase">
                      {card.subtitle}
                    </p>

                    {/* Get Started/Continue Button */}
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-white/10">
                      <div
                        className="w-full py-2.5 sm:py-2.5 px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] sm:min-h-auto"
                        style={{
                          backgroundColor: cardColors.border,
                          color: 'white'
                        }}
                      >
                        {buttonText}
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

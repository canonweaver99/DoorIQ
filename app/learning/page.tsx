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

  if (!hasAccess && ENABLE_ACCESS_CHECK) {
    return (
      <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Lock className="w-16 h-16 text-purple-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 font-space">Sales Playbook Unavailable</h2>
            <p className="text-slate-400 text-center max-w-md mb-8 font-sans">
              The Learning page with Sales Playbook is only available for Starter, Team, and Enterprise plans. 
              Please ensure you have an active subscription.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-sans"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-space">Learning Center</h1>
          <p className="text-white text-lg sm:text-xl font-sans">Master D2D sales fundamentals</p>
        </motion.div>

        {/* Continue Learning Banner */}
        {nextModule && (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <Link
              href={`/learning/modules/${nextModule.slug}`}
              className="block bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-purple-400" />
                  </div>
                <div>
                    <p className="text-sm text-purple-400 font-semibold font-space">Continue where you left off</p>
                    <p className="text-white font-medium font-sans">{nextModule.title}</p>
                </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-400" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Category Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                <Link href={card.href}>
                  <div 
                    className="relative rounded-xl p-6 h-full flex flex-col min-h-[256px] overflow-hidden"
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
                      <div className="absolute top-12 right-4 z-10">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-bold
                          ${card.badge === 'Start' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}
                          text-white shadow-lg
                          flex items-center gap-1
                        `}>
                          {card.badge === 'Start' && <Sparkles className="w-3 h-3" />}
                          {card.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* Large Icon */}
                    <div className="mb-4 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Icon className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-2 font-space leading-tight uppercase">
                      {card.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-white text-xl font-bold mb-4 font-space flex-1 leading-tight uppercase">
                      {card.subtitle}
                    </p>

                    {/* Get Started/Continue Button */}
                    <div className="mt-auto pt-3 border-t border-white/10">
                      <div
                        className="w-full py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        style={{
                          backgroundColor: cardColors.border,
                          color: 'white'
                        }}
                      >
                        {buttonText}
                        <ArrowRight className="w-4 h-4" />
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

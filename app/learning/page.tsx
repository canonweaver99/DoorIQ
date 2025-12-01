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

export default function LearningPage() {
  const router = useRouter()
  const { hasAccess, loading: accessLoading } = useFeatureAccess(FEATURES.LEARNING_PAGE)
  const { modules } = useModules()
  
  // Find in-progress modules for "Continue where you left off" banner
  const inProgressModules = modules.filter(
    (m) => (m.progress?.time_spent_seconds || 0) > 0 && !m.progress?.completed_at
  )
  const nextModule = inProgressModules.length > 0 ? inProgressModules[0] : null

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Lock className="w-16 h-16 text-purple-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 font-space">Custom Sales Playbook Unavailable</h2>
            <p className="text-slate-400 text-center max-w-md mb-8 font-sans">
              The Learning page with Custom Sales Playbook is only available for Team and Enterprise plans. 
              Upgrade to Team plan to access this feature.
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
          <p className="text-slate-400 font-sans">Master D2D sales fundamentals</p>
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
            if (card.id !== 'getting-started' && card.id !== 'objections') {
              const categoryModules = modules.filter(m => m.category === card.id)
              const completed = categoryModules.filter(m => m.progress?.completed_at !== null).length
              const total = categoryModules.length
              if (total > 0) {
                progress = { completed, total }
                isCompleted = completed === total && total > 0
              }
            }
            
            // Get accent color classes and hover styles
            const getHoverBorderClass = (color: string) => {
              const map: Record<string, string> = {
                purple: 'hover:border-purple-500/50',
                teal: 'hover:border-teal-500/50',
                orange: 'hover:border-orange-500/50',
                red: 'hover:border-red-500/50',
                green: 'hover:border-green-500/50',
                blue: 'hover:border-blue-500/50'
              }
              return map[color] || 'hover:border-purple-500/50'
            }
            
            const getProgressGradient = (color: string) => {
              const map: Record<string, string> = {
                purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
                teal: 'bg-gradient-to-r from-teal-500 to-teal-600',
                orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
                red: 'bg-gradient-to-r from-red-500 to-red-600',
                green: 'bg-gradient-to-r from-green-500 to-green-600',
                blue: 'bg-gradient-to-r from-blue-500 to-blue-600'
              }
              return map[color] || 'bg-gradient-to-r from-purple-500 to-purple-600'
            }
            
            const getHoverGlowStyle = (color: string) => {
              const map: Record<string, string> = {
                purple: 'bg-gradient-to-br from-purple-500/5 to-transparent',
                teal: 'bg-gradient-to-br from-teal-500/5 to-transparent',
                orange: 'bg-gradient-to-br from-orange-500/5 to-transparent',
                red: 'bg-gradient-to-br from-red-500/5 to-transparent',
                green: 'bg-gradient-to-br from-green-500/5 to-transparent',
                blue: 'bg-gradient-to-br from-blue-500/5 to-transparent'
              }
              return map[color] || 'bg-gradient-to-br from-purple-500/5 to-transparent'
            }
            
            const getProgressGlowStyle = (color: string) => {
              const map: Record<string, string> = {
                purple: 'shadow-[0_0_12px_rgba(139,92,246,0.5)]',
                teal: 'shadow-[0_0_12px_rgba(20,184,166,0.5)]',
                orange: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]',
                red: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
                green: 'shadow-[0_0_12px_rgba(34,197,94,0.5)]',
                blue: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]'
              }
              return map[color] || 'shadow-[0_0_12px_rgba(139,92,246,0.5)]'
            }
                
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.03, y: -6 }}
                className="group"
              >
                <Link href={card.href}>
                  <div className={`
                    relative bg-gradient-to-br ${card.gradient}
                    border border-[#2a2a2a] rounded-xl p-8
                    transition-all duration-300 cursor-pointer
                    h-full flex flex-col min-h-[320px]
                    shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                    ${getHoverBorderClass(card.accentColor)}
                    hover:shadow-[0_12px_48px_rgba(0,0,0,0.8)]
                    overflow-hidden
                  `}>
                    {/* Badge */}
                    {card.badge && (
                      <div className="absolute top-4 right-4 z-10">
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
                    
                    {/* Completion Badge */}
                    {isCompleted && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Large Icon */}
                    <div className="mb-6 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-3 font-space leading-tight">
                      {card.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-[#888] text-sm mb-6 font-sans flex-1 leading-relaxed">
                      {card.subtitle}
                    </p>

                    {/* Progress Indicator */}
                    {progress && (
                      <div className="mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#888] font-sans font-medium">
                            {progress.completed}/{progress.total} completed
                          </span>
                          {isCompleted && (
                            <span className="text-xs text-green-400 font-semibold font-sans">
                              Complete
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-900/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={`
                              ${getProgressGradient(card.accentColor)} h-2 rounded-full
                              ${progress.completed > 0 ? getProgressGlowStyle(card.accentColor) : ''}
                              transition-all duration-500
                            `}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Arrow for cards without progress */}
                    {!progress && (
                      <div className="flex items-center justify-end mt-auto pt-6 border-t border-white/10">
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ArrowRight className="w-5 h-5 text-[#888] group-hover:text-white transition-colors" />
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Hover Glow Effect */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${getHoverGlowStyle(card.accentColor)}`} />
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

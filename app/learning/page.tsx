'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, DoorOpen, Megaphone, Shield, Handshake, MessageSquare, Lock, ArrowRight } from 'lucide-react'
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
  color: string
}

const categoryCards: CategoryCard[] = [
  {
    id: 'getting-started',
    title: 'New to DoorIQ?',
    subtitle: 'Start here — learn how to use the platform',
    icon: Rocket,
    href: '/learning/getting-started',
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 'approach',
    title: 'Approach',
    subtitle: 'Make a great first impression',
    icon: DoorOpen,
    href: '/learning/modules?category=approach',
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 'pitch',
    title: 'Pitch',
    subtitle: 'Build value before price',
    icon: Megaphone,
    href: '/learning/modules?category=pitch',
    color: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    id: 'objections',
    title: 'Objection Handling',
    subtitle: 'Turn "no" into "yes"',
    icon: Shield,
    href: '/learning/objections',
    color: 'from-red-500/20 to-orange-500/20'
  },
  {
    id: 'close',
    title: 'Closing',
    subtitle: 'Ask for the commitment',
    icon: Handshake,
    href: '/learning/modules?category=close',
    color: 'from-green-500/20 to-emerald-500/20'
  },
  {
    id: 'communication',
    title: 'Communication',
    subtitle: 'Master verbal and non-verbal skills',
    icon: MessageSquare,
    href: '/learning/modules?category=communication',
    color: 'from-indigo-500/20 to-purple-500/20'
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categoryCards.map((card, index) => {
            const Icon = card.icon
            
            // Calculate progress for category cards (except getting-started)
            let progress = null
            if (card.id !== 'getting-started' && card.id !== 'objections') {
              const categoryModules = modules.filter(m => m.category === card.id)
              const completed = categoryModules.filter(m => m.progress?.completed_at !== null).length
              const total = categoryModules.length
              if (total > 0) {
                progress = { completed, total }
              }
            }
                
                return (
                  <motion.div
                key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Link href={card.href}>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 font-space">
                      {card.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-slate-400 text-sm mb-4 font-sans flex-1">
                      {card.subtitle}
                    </p>

                    {/* Progress Indicator */}
                    {progress && (
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#2a2a2a]">
                        <span className="text-xs text-slate-500 font-sans">
                          {progress.completed}/{progress.total} completed
                        </span>
                        <div className="w-24 bg-slate-800 rounded-full h-1.5">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Arrow for cards without progress */}
                    {!progress && (
                      <div className="flex items-center justify-end mt-auto pt-4 border-t border-[#2a2a2a]">
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </div>
                      )}
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

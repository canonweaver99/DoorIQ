'use client'

import { useModules } from '@/hooks/learning/useModules'
import { ModuleCard } from './ModuleCard'
import { BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function ContinueLearning() {
  const { modules, loading } = useModules()

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-slate-800 rounded"></div>
        </div>
      </div>
    )
  }

  // Find the next module to complete
  // Priority: 1) In progress, 2) Not started (by display order)
  const inProgressModules = modules.filter(
    (m) => (m.progress?.time_spent_seconds || 0) > 0 && !m.progress?.completed_at
  )
  
  const notStartedModules = modules.filter(
    (m) => !m.progress?.completed_at && (!m.progress?.time_spent_seconds || m.progress.time_spent_seconds === 0)
  )

  const nextModule = inProgressModules.length > 0
    ? inProgressModules[0] // Return first in-progress module
    : notStartedModules.sort((a, b) => {
        // Sort by category order, then display_order
        const categoryOrder: Record<string, number> = {
          approach: 1,
          pitch: 2,
          overcome: 3,
          close: 4,
          objections: 5,
          communication: 6,
        }
        const categoryDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
        if (categoryDiff !== 0) return categoryDiff
        return a.display_order - b.display_order
      })[0]

  if (!nextModule) {
    // All modules completed
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 font-space">All Caught Up!</h3>
          <p className="text-slate-400 font-sans mb-4">
            You've completed all available modules. Great work!
          </p>
          <Link
            href="/learning/modules"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-space"
          >
            Review Modules
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white font-space">Continue Learning</h2>
        </div>
        <Link
          href="/learning/modules"
          className="text-sm text-purple-400 hover:text-purple-300 font-sans"
        >
          View All →
        </Link>
      </div>
      <ModuleCard module={nextModule} />
    </motion.div>
  )
}


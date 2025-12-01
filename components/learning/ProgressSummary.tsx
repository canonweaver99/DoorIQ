'use client'

import { useModules } from '@/hooks/learning/useModules'
import { ModuleCategory } from '@/lib/learning/types'
import { BookOpen, CheckCircle2, Clock, Circle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const categoryLabels: Record<ModuleCategory, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
  communication: 'Communication',
}

export function ProgressSummary() {
  const { modules, loading } = useModules()

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const totalModules = modules.length
  const completedModules = modules.filter(m => m.progress?.completed_at !== null).length
  const inProgressModules = modules.filter(
    m => m.progress?.time_spent_seconds > 0 && !m.progress?.completed_at
  ).length
  const notStartedModules = totalModules - completedModules - inProgressModules

  const completionPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  // Group by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = { total: 0, completed: 0 }
    }
    acc[module.category].total++
    if (module.progress?.completed_at) {
      acc[module.category].completed++
    }
    return acc
  }, {} as Record<ModuleCategory, { total: number; completed: number }>)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white font-space">Your Progress</h2>
        </div>
        <Link
          href="/learning/modules"
          className="text-sm text-purple-400 hover:text-purple-300 font-sans"
        >
          View All →
        </Link>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400 font-sans">Overall Completion</span>
          <span className="text-sm font-semibold text-white font-space">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">{completedModules} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">{inProgressModules} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300">{notStartedModules} Not Started</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 font-space">By Category</h3>
        {Object.entries(modulesByCategory).map(([category, stats]) => {
          const categoryProgress = stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0
          return (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-sans">
                {categoryLabels[category as ModuleCategory]}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${categoryProgress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-sans w-12 text-right">
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}



'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles } from 'lucide-react'
import { ModuleCard } from '@/components/learning/ModuleCard'
import { useModules } from '@/hooks/learning/useModules'
import { ModuleCategory } from '@/lib/learning/types'

const categoryOrder: ModuleCategory[] = ['approach', 'pitch', 'overcome', 'close', 'objections']

const categoryLabels: Record<ModuleCategory, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
}

const categoryDescriptions: Record<ModuleCategory, string> = {
  approach: 'Learn how to make a great first impression at the door',
  pitch: 'Master your sales presentation and value proposition',
  overcome: 'Handle objections and turn "no" into "yes"',
  close: 'Perfect your closing techniques and seal the deal',
  objections: 'Specific strategies for common objections',
}

export default function ModulesPage() {
  const { modules, loading, error } = useModules()
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all')

  // Group modules by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = []
    }
    acc[module.category].push(module)
    return acc
  }, {} as Record<ModuleCategory, typeof modules>)

  // Filter modules by selected category
  const filteredCategories = selectedCategory === 'all'
    ? categoryOrder.filter(cat => modulesByCategory[cat]?.length > 0)
    : [selectedCategory]

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-400 font-sans">Error loading modules: {error.message}</p>
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
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-space">Learning Modules</h1>
          </div>
          <p className="text-slate-400 font-sans">Master the fundamentals of D2D sales</p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors font-space ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Modules
            </button>
            {categoryOrder.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors font-space ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Modules by Category */}
        <div className="space-y-12">
          {filteredCategories.map((category, categoryIdx) => {
            const categoryModules = modulesByCategory[category] || []
            if (categoryModules.length === 0) return null

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + categoryIdx * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white font-space">
                    {categoryLabels[category]}
                  </h2>
                </div>
                <p className="text-slate-400 mb-6 font-sans">
                  {categoryDescriptions[category]}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryModules.map((module, idx) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      delay={0.1 * idx}
                    />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-sans">No modules available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}


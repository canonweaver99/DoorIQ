'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ModuleCard } from '@/components/learning/ModuleCard'
import { useModules } from '@/hooks/learning/useModules'
import { ModuleCategory } from '@/lib/learning/types'

const categoryOrder: ModuleCategory[] = ['approach', 'pitch', 'overcome', 'close', 'objections', 'communication']

const categoryLabels: Record<ModuleCategory, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
  communication: 'Communication',
}

const categoryDescriptions: Record<ModuleCategory, string> = {
  approach: 'Learn how to make a great first impression at the door',
  pitch: 'Master your sales presentation and value proposition',
  overcome: 'Handle objections and turn "no" into "yes"',
  close: 'Perfect your closing techniques and seal the deal',
  objections: 'Specific strategies for common objections',
  communication: 'Master verbal and non-verbal communication skills',
}

function ModulesPageContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as ModuleCategory | null
  const selectedCategory = categoryParam && categoryOrder.includes(categoryParam) ? categoryParam : null
  
  const { modules, loading, error } = useModules(
    selectedCategory ? { category: selectedCategory } : {}
  )

  // Filter modules by category if selected
  const filteredModules = selectedCategory
    ? modules.filter(m => m.category === selectedCategory)
    : modules

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 pt-32">
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
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 rounded-lg text-white mb-4 transition-all duration-200 font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Center
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-space uppercase">
              {selectedCategory ? categoryLabels[selectedCategory] : 'Learning Modules'}
            </h1>
          </div>
          <p className="text-white text-lg font-sans mb-4 text-center">
            {selectedCategory ? categoryDescriptions[selectedCategory] : 'Master the fundamentals of D2D sales'}
          </p>
        </motion.div>

        {/* Modules List */}
        {filteredModules.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-6xl mx-auto space-y-0"
          >
            {filteredModules.map((module, idx) => (
              <ModuleCard
                key={module.id}
                module={module}
                delay={0.05 * idx}
                isLast={idx === filteredModules.length - 1}
                displayNumber={idx + 1}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-sans">
              {selectedCategory
                ? `No ${categoryLabels[selectedCategory]} modules available yet.`
                : 'No modules available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModulesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    }>
      <ModulesPageContent />
    </Suspense>
  )
}


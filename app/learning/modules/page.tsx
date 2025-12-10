'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useModules } from '@/hooks/learning/useModules'

// Lazy load module cards for better performance
const ModuleCard = dynamic(() => import('@/components/learning/ModuleCard').then(mod => ({ default: mod.ModuleCard })), {
  loading: () => <div className="h-32 bg-slate-900/50 rounded-2xl animate-pulse" />,
  ssr: false
})
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

// Map categories to background colors
const getCategoryBackground = (category: ModuleCategory | null) => {
  if (!category) return 'bg-black'
  
  const colorMap: Record<ModuleCategory, string> = {
    approach: 'bg-[#0a1a12]', // Dark green
    pitch: 'bg-[#0f1419]', // Dark blue
    overcome: 'bg-[#1a1410]', // Dark amber
    close: 'bg-[#1a0f14]', // Dark pink
    objections: 'bg-[#1a1410]', // Dark amber
    communication: 'bg-[#0f0f0f]', // Dark slate
  }
  return colorMap[category] || 'bg-black'
}

// Map categories to icon colors
const getCategoryIconColor = (category: ModuleCategory | null) => {
  if (!category) return 'text-purple-400'
  
  const colorMap: Record<ModuleCategory, string> = {
    approach: 'text-emerald-400', // Green
    pitch: 'text-blue-400', // Blue
    overcome: 'text-amber-400', // Amber
    close: 'text-pink-400', // Pink
    objections: 'text-amber-400', // Amber
    communication: 'text-slate-400', // Slate
  }
  return colorMap[category] || 'text-purple-400'
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
      <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
        <div className="max-w-[1800px] mx-auto pt-4 sm:pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
        <div className="max-w-[1800px] mx-auto pt-4 sm:pt-6">
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <p className="text-red-400 font-sans text-sm sm:text-base text-center">Error loading modules: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const backgroundClass = getCategoryBackground(selectedCategory)
  const iconColorClass = getCategoryIconColor(selectedCategory)

  return (
    <div className={`min-h-screen ${backgroundClass} py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32 transition-colors duration-500`} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
      <div className="max-w-[1800px] mx-auto pt-4 sm:pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 active:bg-slate-700/50 border border-slate-700/50 active:border-slate-600/50 rounded-lg text-white mb-3 sm:mb-4 transition-all duration-200 font-sans text-sm sm:text-base min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Learning Center</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 px-2">
            <BookOpen className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 ${iconColorClass} flex-shrink-0 transition-colors duration-500`} />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white font-space uppercase leading-tight text-center">
              {selectedCategory ? categoryLabels[selectedCategory] : 'Learning Modules'}
            </h1>
          </div>
          <p className="text-white text-sm sm:text-base lg:text-lg font-sans mb-3 sm:mb-4 text-center px-2 leading-relaxed">
            {selectedCategory ? categoryDescriptions[selectedCategory] : 'Master the fundamentals of D2D sales'}
          </p>
        </motion.div>

        {/* Modules List */}
        {filteredModules.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-6xl mx-auto space-y-0 px-1 sm:px-0"
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
          <div className="text-center py-12 sm:py-20 px-4">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-3 sm:mb-4" />
            <p className="text-slate-400 font-sans text-sm sm:text-base">
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
      <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    }>
      <ModulesPageContent />
    </Suspense>
  )
}


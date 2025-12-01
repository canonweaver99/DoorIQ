'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ModuleWithProgress } from '@/lib/learning/types'
import { cn } from '@/lib/utils'

interface ModuleNavigationProps {
  currentModule: ModuleWithProgress
  allModules: ModuleWithProgress[]
}

export function ModuleNavigation({ currentModule, allModules }: ModuleNavigationProps) {
  // Sort modules by category and display_order
  const sortedModules = [...allModules].sort((a, b) => {
    const categoryOrder: Record<string, number> = {
      approach: 1,
      pitch: 2,
      overcome: 3,
      close: 4,
      objections: 5,
    }
    const categoryDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
    if (categoryDiff !== 0) return categoryDiff
    return a.display_order - b.display_order
  })

  const currentIndex = sortedModules.findIndex((m) => m.id === currentModule.id)
  const previousModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null
  const nextModule = currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null

  if (!previousModule && !nextModule) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-800">
      {previousModule ? (
        <Link
          href={`/learning/modules/${previousModule.slug}`}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white',
            'transition-colors duration-200',
            'group'
          )}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-slate-400 font-sans">Previous</span>
            <span className="text-sm font-medium font-space">{previousModule.title}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {nextModule && (
        <Link
          href={`/learning/modules/${nextModule.slug}`}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white',
            'transition-colors duration-200',
            'group ml-auto'
          )}
        >
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-sans">Next</span>
            <span className="text-sm font-medium font-space">{nextModule.title}</span>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  )
}


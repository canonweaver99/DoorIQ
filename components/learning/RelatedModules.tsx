'use client'

import { ModuleWithProgress } from '@/lib/learning/types'
import { ModuleCard } from './ModuleCard'

interface RelatedModulesProps {
  currentModule: ModuleWithProgress
  allModules: ModuleWithProgress[]
  limit?: number
}

export function RelatedModules({ currentModule, allModules, limit = 3 }: RelatedModulesProps) {
  // Get modules in the same category, excluding current module
  const relatedModules = allModules
    .filter(
      (m) =>
        m.id !== currentModule.id &&
        m.category === currentModule.category &&
        m.is_published
    )
    .slice(0, limit)

  // If not enough in same category, add from other categories
  if (relatedModules.length < limit) {
    const otherModules = allModules
      .filter(
        (m) =>
          m.id !== currentModule.id &&
          m.category !== currentModule.category &&
          m.is_published &&
          !relatedModules.some((rm) => rm.id === m.id)
      )
      .slice(0, limit - relatedModules.length)
    relatedModules.push(...otherModules)
  }

  if (relatedModules.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6 font-space">Related Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedModules.map((module, idx) => (
          <ModuleCard key={module.id} module={module} delay={0.1 * idx} />
        ))}
      </div>
    </div>
  )
}


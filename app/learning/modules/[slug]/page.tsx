'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { ModuleDetail } from '@/components/learning/ModuleDetail'
import { ModuleWithProgress, ModuleCategory } from '@/lib/learning/types'
import { useModules } from '@/hooks/learning/useModules'

const categoryLabels: Record<ModuleCategory, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
  communication: 'Communication',
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const [module, setModule] = useState<ModuleWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { modules: allModules } = useModules()

  useEffect(() => {
    async function fetchModule() {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/learning/modules/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Module not found')
          }
          throw new Error('Failed to fetch module')
        }

        const data = await response.json()
        setModule(data.module)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [slug])

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

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-red-400 font-sans mb-4">
              {error?.message || 'Module not found'}
            </p>
            <Link
              href="/learning/modules"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-space"
            >
              Back to Modules
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="max-w-[1800px] mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link
            href={module.category ? `/learning/modules?category=${module.category}` : '/learning'}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {module.category ? categoryLabels[module.category] : 'Learning Center'}</span>
          </Link>
        </motion.div>

        {/* Module Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ModuleDetail module={module} allModules={allModules} />
        </motion.div>
      </div>
    </div>
  )
}



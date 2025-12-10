'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Lazy load heavy component
const ModuleDetail = dynamic(() => import('@/components/learning/ModuleDetail').then(mod => ({ default: mod.ModuleDetail })), {
  loading: () => <div className="h-96 bg-slate-900/50 rounded-3xl animate-pulse" />,
  ssr: false
})
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

  const fetchModule = async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)

      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/learning/modules/${slug}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
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

  useEffect(() => {
    fetchModule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Refetch when router refreshes (e.g., after marking complete)
  useEffect(() => {
    const handleFocus = () => {
      // Refetch when window regains focus (user might have completed module in another tab)
      fetchModule()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mb-3 sm:mb-4" />
            <p className="text-red-400 font-sans mb-3 sm:mb-4 text-sm sm:text-base text-center">
              {error?.message || 'Module not found'}
            </p>
            <Link
              href="/learning/modules"
              className="px-4 py-2.5 sm:py-2 bg-purple-600 active:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-space text-sm sm:text-base min-h-[44px] flex items-center touch-manipulation"
            >
              Back to Modules
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-32" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 6rem)' }}>
      <div className="max-w-[1800px] mx-auto pt-4 sm:pt-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 sm:mb-6"
        >
          <Link
            href={module.category ? `/learning/modules?category=${module.category}` : '/learning'}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 active:bg-slate-700/50 border border-slate-700/50 active:border-slate-600/50 rounded-lg text-white transition-all duration-200 font-sans text-sm sm:text-base min-h-[44px] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to {module.category ? categoryLabels[module.category] : 'Learning Center'}</span>
            <span className="sm:hidden">Back</span>
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



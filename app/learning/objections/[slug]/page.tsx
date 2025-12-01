'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ObjectionDetail } from '@/components/learning/ObjectionDetail'
import { LearningObjection } from '@/lib/learning/types'

export default function ObjectionDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [objection, setObjection] = useState<LearningObjection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchObjection() {
      if (!slug) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/learning/objections/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Objection not found')
          }
          throw new Error('Failed to fetch objection')
        }

        const data = await response.json()
        setObjection(data.objection)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchObjection()
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

  if (error || !objection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
            <p className="text-red-400 font-sans mb-4">
              {error?.message || 'Objection not found'}
            </p>
            <Link
              href="/learning/objections"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-space"
            >
              Back to Objections
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
            href="/learning/objections"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Objections</span>
          </Link>
        </motion.div>

        {/* Objection Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ObjectionDetail objection={objection} />
        </motion.div>
      </div>
    </div>
  )
}



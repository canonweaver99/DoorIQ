'use client'

import { useState, useEffect } from 'react'
import { LearningObjection } from '@/lib/learning/types'

export function useObjections() {
  const [objections, setObjections] = useState<LearningObjection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchObjections() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/learning/objections?_t=${Date.now()}`, {
          cache: 'no-store', // Bypass cache to get fresh data
        })
        if (!response.ok) {
          throw new Error('Failed to fetch objections')
        }

        const data = await response.json()
        setObjections(data.objections || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchObjections()
  }, [])

  return { objections, loading, error, refetch: () => {
    setObjections([])
    setLoading(true)
  } }
}



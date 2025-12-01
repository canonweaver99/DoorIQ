'use client'

import { useState, useEffect } from 'react'
import { ModuleWithProgress } from '@/lib/learning/types'

interface UseModulesOptions {
  category?: string
}

export function useModules(options: UseModulesOptions = {}) {
  const [modules, setModules] = useState<ModuleWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchModules() {
      try {
        setLoading(true)
        setError(null)

        const url = options.category
          ? `/api/learning/modules?category=${options.category}`
          : '/api/learning/modules'

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch modules')
        }

        const data = await response.json()
        setModules(data.modules || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [options.category])

  return { modules, loading, error, refetch: () => {
    // Trigger refetch by updating dependency
    setModules([])
    setLoading(true)
  } }
}



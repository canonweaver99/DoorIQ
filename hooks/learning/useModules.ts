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

        // Force fresh fetch with multiple cache-busting strategies
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const url = options.category
          ? `/api/learning/modules?category=${options.category}&_t=${timestamp}&_r=${random}`
          : `/api/learning/modules?_t=${timestamp}&_r=${random}`

        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch modules')
        }

        const data = await response.json()
        // Log for debugging
        console.log('📚 Fetched modules:', data.modules?.length, 'modules')
        console.log('📊 Modules with progress:', data.modules?.filter(m => m.progress?.completed_at).length)
        
        setModules(data.modules || [])
      } catch (err) {
        console.error('❌ Error fetching modules:', err)
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



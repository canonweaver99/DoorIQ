'use client'

import { useState, useCallback } from 'react'
import { UserModuleProgress, ModuleProgressUpdate } from '@/lib/learning/types'

interface UseModuleProgressReturn {
  markComplete: (moduleId: string, timeSpent?: number) => Promise<void>
  updateProgress: (update: ModuleProgressUpdate) => Promise<void>
  loading: boolean
  error: Error | null
}

export function useModuleProgress(): UseModuleProgressReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const markComplete = useCallback(async (moduleId: string, timeSpent: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module_id: moduleId,
          completed_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark module as complete')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProgress = useCallback(async (update: ModuleProgressUpdate) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update progress')
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    markComplete,
    updateProgress,
    loading,
    error,
  }
}



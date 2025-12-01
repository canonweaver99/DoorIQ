import { useState, useCallback } from 'react'

interface UseObjectionProgressReturn {
  markComplete: (objectionId: string, timeSpent?: number) => Promise<void>
  loading: boolean
  error: Error | null
}

export function useObjectionProgress(): UseObjectionProgressReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const markComplete = useCallback(async (objectionId: string, timeSpent: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/learning/objection-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objection_id: objectionId,
          completed_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark objection as complete')
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
    loading,
    error,
  }
}


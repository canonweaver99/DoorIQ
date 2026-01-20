'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * Content Creator Page for Nick Fuentes Agent
 * This page pre-selects the "Nick Fuentes" agent and skips feedback questions
 * Users go straight from session to grading and analytics
 */
export default function NickFuentesCreatorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Check if user is authenticated first
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Not authenticated - redirect to login with next parameter to return here
          const currentPath = '/creator/nick-fuentes'
          router.push(`/auth/login?next=${encodeURIComponent(currentPath)}`)
          return
        }

        // Fetch the Nick Fuentes agent
        const { data: agents, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('name', 'Nick Fuentes')
          .eq('is_active', true)
          .single()

        if (agentError || !agents) {
          setError('Nick Fuentes agent not found. Please ensure the agent is configured in the database.')
          setLoading(false)
          return
        }

        // Redirect to trainer page with Nick Fuentes pre-selected
        // The agent parameter will pre-select the agent
        router.push(`/trainer?agent=${agents.eleven_agent_id}&name=${encodeURIComponent(agents.name)}&skipFeedback=true`)
      } catch (err: any) {
        console.error('Error initializing Nick Fuentes agent:', err)
        setError(err.message || 'Failed to load agent')
        setLoading(false)
      }
    }

    initializeAgent()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Nick Fuentes session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-xl font-bold mb-4">Error</div>
          <p className="text-slate-300">{error}</p>
        </div>
      </div>
    )
  }

  return null // Will redirect immediately
}

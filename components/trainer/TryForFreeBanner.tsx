'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function TryForFreeBanner() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [usedFreeDemo, setUsedFreeDemo] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, used_free_demo')
          .eq('id', user.id)
          .single()

        // ARCHIVED: All paywalls removed - software is now free for signed-in users
        // Banner no longer needed - all authenticated users have free access
        setShow(false)
        setUsedFreeDemo(false)
      } catch (error) {
        console.error('Error checking user status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [])

  const handleTryForFree = () => {
    router.push('/trainer')
  }

  const handleDismiss = () => {
    setShow(false)
  }

  if (loading || !show) {
    return null
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  Try DoorIQ for Free!
                </h3>
                <p className="text-sm text-gray-300">
                  Get 1 free practice session to experience our AI-powered sales training. No credit card required.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleTryForFree}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold"
              >
                Try for Free
              </Button>
              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AnalyticsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to sessions page as the main analytics landing
    router.push('/sessions')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center pt-32">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white/70">Redirecting to sessions...</p>
      </div>
    </div>
  )
}



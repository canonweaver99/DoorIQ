'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Target, MessageSquare, Shield, Timer } from 'lucide-react'

interface CoachingTip {
  id: string
  category: string
  tip: string
  order_index: number
}

export default function PreSessionPage() {
  const router = useRouter()
  // Immediately redirect to rotating Preparing screen (trainer autostart)
  useEffect(() => {
    router.replace('/trainer?autostart=true')
  }, [router])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'opening':
        return <MessageSquare className="w-5 h-5" />
      case 'rapport':
        return <Target className="w-5 h-5" />
      case 'safety':
        return <Shield className="w-5 h-5" />
      case 'closing':
        return <Timer className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'opening':
        return 'bg-blue-100 text-blue-800'
      case 'rapport':
        return 'bg-green-100 text-green-800'
      case 'safety':
        return 'bg-yellow-100 text-yellow-800'
      case 'closing':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
          Preparing your session...
        </div>
        <p className="text-sm text-slate-400 mt-4">Redirecting</p>
      </div>
    </div>
  )
}

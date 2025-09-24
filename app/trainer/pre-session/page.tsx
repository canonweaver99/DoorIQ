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
  const [tips, setTips] = useState<CoachingTip[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCoachingTips()
  }, [])

  const fetchCoachingTips = async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_tips')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(6)

      if (error) throw error
      setTips(data || [])
    } catch (error) {
      console.error('Error fetching tips:', error)
    } finally {
      setLoading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Practice?
            </h1>
            <p className="text-xl text-gray-600">
              You&apos;ll be speaking with Amanda, a skeptical suburban mom who needs pest control services.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Today&apos;s Coaching Tips
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3">
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-start space-x-3 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`p-2 rounded-full ${getCategoryColor(tip.category)}`}>
                      {getCategoryIcon(tip.category)}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{tip.tip}</p>
                      <span className="text-xs text-gray-500 mt-1 inline-block capitalize">
                        {tip.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-amber-900 mb-2">
              Remember: Amanda is Skeptical
            </h3>
            <ul className="space-y-2 text-amber-800">
              <li>• She&apos;s had bad experiences with door-to-door sales before</li>
              <li>• She&apos;s concerned about safety for her kids and pets</li>
              <li>• She&apos;s price-conscious but values quality service</li>
              <li>• She will interrupt if you&apos;re not clear or take too long</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/trainer')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105"
            >
              Start Practice Session
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Goal: Get Amanda to agree to a pest control service consultation
          </p>
        </div>
      </div>
    </div>
  )
}

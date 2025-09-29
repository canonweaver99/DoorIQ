'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Target, MessageSquare, Shield, Timer, TrendingUp, Lightbulb, Users } from 'lucide-react'

interface CoachingTip {
  id: string
  category: string
  tip: string
  order_index: number
}

export default function PreSessionPage() {
  const router = useRouter()
  const [tips, setTips] = useState<CoachingTip[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTips()
  }, [])

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('coaching_tips')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

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
        return <Users className="w-5 h-5" />
      case 'objections':
        return <Target className="w-5 h-5" />
      case 'safety':
        return <Shield className="w-5 h-5" />
      case 'closing':
        return <Timer className="w-5 h-5" />
      case 'discovery':
        return <Lightbulb className="w-5 h-5" />
      case 'presentation':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'opening':
        return 'from-blue-500 to-blue-600'
      case 'rapport':
        return 'from-green-500 to-green-600'
      case 'objections':
        return 'from-orange-500 to-orange-600'
      case 'safety':
        return 'from-yellow-500 to-yellow-600'
      case 'closing':
        return 'from-purple-500 to-purple-600'
      case 'discovery':
        return 'from-indigo-500 to-indigo-600'
      case 'presentation':
        return 'from-pink-500 to-pink-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  // Group tips by category
  const tipsByCategory = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) {
      acc[tip.category] = []
    }
    acc[tip.category].push(tip)
    return acc
  }, {} as Record<string, CoachingTip[]>)

  const handleStartSession = () => {
    router.push('/trainer?autostart=true')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            Ready to Practice? 🎯
          </h1>
          <p className="text-lg text-slate-300 mb-2">
            Review these coaching tips before your session
          </p>
          <p className="text-sm text-slate-400">
            These strategies will help you close more deals with Austin
          </p>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Object.entries(tipsByCategory).map(([category, categoryTips]) => (
            <div
              key={category}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(category)}`}>
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {category}
                  </h3>
                  <p className="text-xs text-slate-400">{categoryTips.length} tips</p>
                </div>
              </div>

              {/* Tips List */}
              <ul className="space-y-2.5">
                {categoryTips.map((tip) => (
                  <li key={tip.id} className="flex items-start gap-2.5">
                    <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
                    <span className="text-sm text-slate-300 leading-relaxed">
                      {tip.tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tips.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No coaching tips available yet.</p>
            <p className="text-sm text-slate-500">Check back soon for expert advice!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleStartSession}
            className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            I'm Ready to Practice
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Stats or Motivational Banner */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <span className="text-blue-400 text-sm">💡 Tip:</span>
            <span className="text-slate-300 text-sm">
              The more you practice, the more confident you'll become!
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

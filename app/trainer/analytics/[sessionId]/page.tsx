'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, TrendingUp, Clock, MessageSquare, Shield, 
  Target, ChevronRight, Download, Share2
} from 'lucide-react'
import { motion } from 'framer-motion'

interface SessionData {
  id: string
  started_at: string
  ended_at: string
  duration_seconds: number
  overall_score: number
  rapport_score: number
  objection_handling_score: number
  safety_score: number
  close_effectiveness_score: number
  transcript: any[]
  analytics: any
  sentiment_data: any
}

export default function AnalyticsPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSessionData()
  }, [params.sessionId])

  const fetchSessionData = async () => {
    try {
      const sessionId = Array.isArray(params.sessionId)
        ? params.sessionId[0]
        : params.sessionId
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId as string)
        .single()

      if (error) throw error
      setSession(data)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟'
    if (score >= 60) return '👍'
    return '💪'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 w-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Session not found</h2>
          <button
            onClick={() => router.push('/trainer')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to training
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Analysis</h1>
              <p className="text-gray-600 mt-1">
                {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Overall Score */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            <div className={`text-6xl font-bold ${getScoreColor(session.overall_score || 0)}`}>
              {session.overall_score || 0}
            </div>
            <div className="text-xl text-gray-600 mt-2">Overall Score</div>
            <div className="text-3xl mt-2">{getScoreEmoji(session.overall_score || 0)}</div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">{formatDuration(session.duration_seconds || 0)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">{session.sentiment_data?.objection_count || 0}</div>
              <div className="text-sm text-gray-600">Objections Handled</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Shield className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">{session.safety_score || 0}%</div>
              <div className="text-sm text-gray-600">Safety Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-semibold">{session.close_effectiveness_score || 0}%</div>
              <div className="text-sm text-gray-600">Close Effectiveness</div>
            </div>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Breakdown</h2>
          
          <div className="space-y-6">
            <ScoreBar 
              label="Rapport Building" 
              score={session.rapport_score || 0} 
              color="blue"
              feedback="Focus on mirroring Amanda's energy level and finding common ground early in the conversation."
            />
            <ScoreBar 
              label="Objection Handling" 
              score={session.objection_handling_score || 0} 
              color="green"
              feedback="Remember to acknowledge concerns before addressing them. Use 'I understand' more frequently."
            />
            <ScoreBar 
              label="Safety Concerns" 
              score={session.safety_score || 0} 
              color="yellow"
              feedback={session.safety_score >= 70 ? "Good job addressing safety!" : "Mention pet and child safety earlier in the conversation."}
            />
            <ScoreBar 
              label="Close Effectiveness" 
              score={session.close_effectiveness_score || 0} 
              color="purple"
              feedback="Create urgency without being pushy. Offer multiple service options to give choice."
            />
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Insights</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <InsightCard
              title="Time to Value"
              icon={<Clock className="w-5 h-5" />}
              content={`You mentioned pricing at ${session.analytics?.time_to_price ? formatDuration(session.analytics.time_to_price) : 'N/A'}`}
              status={session.analytics?.time_to_price && session.analytics.time_to_price < 120 ? 'good' : 'improve'}
            />
            <InsightCard
              title="Interruption Management"
              icon={<MessageSquare className="w-5 h-5" />}
              content={`Amanda interrupted ${session.sentiment_data?.interruption_count || 0} times`}
              status={(session.sentiment_data?.interruption_count || 0) <= 2 ? 'good' : 'improve'}
            />
            <InsightCard
              title="Safety Discussion"
              icon={<Shield className="w-5 h-5" />}
              content={session.analytics?.key_moments?.safetyAddressed ? 'Safety concerns addressed' : 'Safety not discussed'}
              status={session.analytics?.key_moments?.safetyAddressed ? 'good' : 'improve'}
            />
            <InsightCard
              title="Close Attempt"
              icon={<Target className="w-5 h-5" />}
              content={session.analytics?.key_moments?.closeAttempted ? 'Close attempted successfully' : 'No clear close attempt'}
              status={session.analytics?.key_moments?.closeAttempted ? 'good' : 'improve'}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/trainer')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            Practice Again
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/trainer/history')}
            className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            View All Sessions
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, color, feedback }: { label: string; score: number; color: string; feedback: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`font-semibold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
        />
      </div>
      <p className="text-sm text-gray-600">{feedback}</p>
    </div>
  )
}

function InsightCard({ title, icon, content, status }: { 
  title: string; 
  icon: React.ReactNode; 
  content: string; 
  status: 'good' | 'improve' 
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${status === 'good' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-full ${status === 'good' ? 'bg-green-200' : 'bg-yellow-200'} mr-3`}>
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className={`text-sm ${status === 'good' ? 'text-green-700' : 'text-yellow-700'}`}>{content}</p>
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, TrendingUp, Clock, MessageSquare, Shield, 
  Target, ChevronRight, Download, Share2, FileText, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('transcript')
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

  // Harsh grading system - 100 requires perfection
  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 95) return '🌟'
    if (score >= 80) return '👍'
    return '💪'
  }

  // Convert score to star rating (1-5 stars)
  const getStarRating = (score: number) => {
    if (score >= 95) return 5
    if (score >= 85) return 4
    if (score >= 70) return 3
    if (score >= 55) return 2
    return 1
  }

  // Line effectiveness analysis for intelligent highlighting
  const analyzeLineEffectiveness = (entry: any, idx: number, transcript: any[]) => {
    if (entry.speaker !== 'user' && entry.speaker !== 'rep') return 'neutral'
    
    const text = entry.text.toLowerCase()
    const prevEntry = idx > 0 ? transcript[idx - 1] : null
    const nextEntry = idx < transcript.length - 1 ? transcript[idx + 1] : null
    
    // Excellent moves (green)
    if (
      text.includes('understand how you feel') ||
      text.includes('many homeowners have told me') ||
      text.includes('what if i could show you') ||
      text.includes('safe for pets and children') ||
      text.includes('i have two appointments available') ||
      text.includes('which works better for you') ||
      text.includes('let me ask you this') ||
      (text.includes('?') && (text.includes('pest') || text.includes('concern') || text.includes('issue')))
    ) return 'excellent'
    
    // Good moves (yellow)
    if (
      text.includes('great question') ||
      text.includes('i appreciate') ||
      text.includes('let me explain') ||
      text.includes('what we do is') ||
      text.includes('our service includes') ||
      text.includes('schedule') ||
      text.includes('appointment')
    ) return 'good'
    
    // Poor moves (red) 
    if (
      text.includes('um') || text.includes('uh') ||
      text.includes('i think') || text.includes('maybe') ||
      text.includes('probably') || text.includes('i guess') ||
      text.length < 10 || // Too short responses
      (prevEntry?.speaker === 'austin' && text.includes('price') && !text.includes('value')) ||
      (text.includes('sorry') && text.length < 20)
    ) return 'poor'
    
    return 'average'
  }

  const getLineHighlightColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'bg-green-50'
      case 'good': return 'bg-yellow-50'  
      case 'poor': return 'bg-red-50'
      default: return 'bg-blue-50'
    }
  }

  const getLineHighlightBorder = (score: string) => {
    switch (score) {
      case 'excellent': return 'border-green-400'
      case 'good': return 'border-yellow-400'
      case 'poor': return 'border-red-400'
      default: return 'border-blue-400'
    }
  }

  const getLineScoreColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  const getLineScoreText = (score: string) => {
    switch (score) {
      case 'excellent': return 'Excellent - Advanced the sale'
      case 'good': return 'Good - Adequate response'
      case 'poor': return 'Poor - Missed opportunity'
      default: return 'Average response'
    }
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
      <div className="max-w-7xl mx-auto px-4">
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

          {/* Overall Score with Star Rating */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            {/* Star Rating */}
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 mx-1 ${
                    i < getStarRating(session.overall_score || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className={`text-6xl font-bold ${getScoreColor(session.overall_score || 0)}`}>
              {session.overall_score || 0}<span className="text-2xl text-gray-400">/100</span>
            </div>
            <div className="text-xl text-gray-600 mt-2">
              {session.overall_score >= 95 ? 'Perfect Pitch!' : 
               session.overall_score >= 80 ? 'Good Job!' :
               'Needs Improvement'}
            </div>
            <div className="text-lg text-gray-500 mt-1">Session Duration: {formatDuration(session.duration_seconds || 0)}</div>
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

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'transcript' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Transcript Analysis
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Performance Metrics
            </button>
          </div>
        </div>

        {activeTab === 'transcript' ? (
          <>
            {/* Full Transcript Display */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Conversation Transcript</h2>
              {session.transcript && Array.isArray(session.transcript) && session.transcript.length > 0 ? (
                <div className="max-w-4xl mx-auto space-y-3 max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {session.transcript.map((entry: any, idx: number) => {
                    const isUser = entry.speaker === 'user' || entry.speaker === 'rep';
                    const lineScore = analyzeLineEffectiveness(entry, idx, session.transcript);
                    
                    return (
                      <div
                        key={idx}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div className={`max-w-[85%] px-4 py-3 rounded-lg shadow-sm ${
                          isUser 
                            ? `${getLineHighlightColor(lineScore)} text-gray-900 border-l-4 ${getLineHighlightBorder(lineScore)}`
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}>
                          <div className="text-sm font-medium">
                            {isUser ? 'Sales Rep' : 'Austin Rodriguez'}
                          </div>
                          <div className="mt-1">{entry.text}</div>
                          {entry.timestamp && (
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                          {isUser && (
                            <div className={`text-xs mt-2 font-medium ${getLineScoreColor(lineScore)}`}>
                              {getLineScoreText(lineScore)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transcript captured for this session.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Detailed Scores */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Breakdown</h2>
          
          <div className="space-y-6">
            <ScoreBar 
              label="Rapport Building" 
              score={session.rapport_score || 0} 
              color="blue"
              feedback={
                (session.rapport_score || 0) >= 85 ? "Outstanding rapport building - genuine connection established" :
                (session.rapport_score || 0) >= 70 ? "Good rapport foundation, but use more personalized language over generic responses" :
                "CRITICAL: Poor rapport building - customers buy from people they trust"
              }
            />
            <ScoreBar 
              label="Objection Handling" 
              score={session.objection_handling_score || 0} 
              color="green"
              feedback={
                (session.objection_handling_score || 0) >= 85 ? "Professional objection handling with empathy and expertise" :
                (session.objection_handling_score || 0) >= 70 ? "Good objection handling, but work on more empathetic responses" :
                "CRITICAL: Poor objection handling - learn to acknowledge and address concerns properly"
              }
            />
            <ScoreBar 
              label="Safety Concerns" 
              score={session.safety_score || 0} 
              color="yellow"
              feedback={
                (session.safety_score || 0) >= 85 ? "Excellent safety discussion - builds trust and confidence" :
                (session.safety_score || 0) >= 70 ? "Good safety mention, but be more comprehensive about pet and child protection" :
                "CRITICAL: Must address safety concerns - this is essential for pest control sales"
              }
            />
            <ScoreBar 
              label="Close Effectiveness" 
              score={session.close_effectiveness_score || 0} 
              color="purple"
              feedback={
                (session.close_effectiveness_score || 0) >= 85 ? "Excellent closing technique - assumptive and confident" :
                (session.close_effectiveness_score || 0) >= 70 ? "Good closing attempt, but be more assumptive and create urgency" :
                "CRITICAL: Weak or no closing attempt - you cannot make sales without asking for them"
              }
            />
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Expert Feedback</h2>
          
          {session.analytics?.feedback && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Strengths */}
              {session.analytics.feedback.strengths && session.analytics.feedback.strengths.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    What You Did Well
                  </h3>
                  <ul className="space-y-2">
                    {session.analytics.feedback.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="text-green-700 text-sm flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Areas for Improvement */}
              {session.analytics?.feedback?.improvements && session.analytics.feedback.improvements.length > 0 && (
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {session.analytics.feedback.improvements.map((improvement: string, idx: number) => (
                      <li key={idx} className="text-red-700 text-sm flex items-start">
                        <span className="text-red-500 mr-2">!</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Specific Tips */}
          {session.analytics?.feedback?.specificTips && session.analytics.feedback.specificTips.length > 0 && (
            <div className="mt-6 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Next Time, Try This:
              </h3>
              <div className="space-y-3">
                {session.analytics.feedback.specificTips.map((tip: string, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded border border-blue-100">
                    <p className="text-blue-800 text-sm italic">&ldquo;{tip}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              content={`Austin interrupted ${session.sentiment_data?.interruption_count || 0} times`}
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
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
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
        <span className={`font-semibold ${score >= 95 ? 'text-green-600' : score >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
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

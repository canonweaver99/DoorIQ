'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy analytics components
const ScoresView = dynamic(() => import('@/components/analytics/ScoresView'), { ssr: false })
const ScoresViewV2 = dynamic(() => import('@/components/analytics/ScoresViewV2'), { ssr: false })
const TranscriptView = dynamic(() => import('@/components/analytics/TranscriptView'), { ssr: false })
const TranscriptViewV2 = dynamic(() => import('@/components/analytics/TranscriptViewV2'), { ssr: false })
const AudioPlayer = dynamic(() => import('@/components/analytics/AudioPlayer'), { ssr: false })
const SpeechQualitySection = dynamic(() => import('@/components/analytics/SpeechQualitySection'), { ssr: false })

interface SessionData {
  id: string
  created_at: string
  agent_name: string | null
  full_transcript: any[] | null
  overall_score: number | null
  rapport_score: number | null
  discovery_score: number | null
  objection_handling_score: number | null
  close_score: number | null
  safety_score: number | null
  introduction_score: number | null
  listening_score: number | null
  virtual_earnings: number | null
  sale_closed: boolean | null
  // Dynamic earnings data
  earnings_data: any | null
  deal_details: any | null
  // New enhanced metric scores
  speaking_pace_score: number | null
  filler_words_score: number | null
  question_ratio_score: number | null
  active_listening_score: number | null
  assumptive_language_score: number | null
  // New enhanced metric data
  speaking_pace_data: any | null
  filler_words_data: any | null
  question_ratio_data: any | null
  active_listening_data: any | null
  assumptive_language_data: any | null
  analytics: {
    line_ratings?: Array<{
      line_number: number
      speaker?: 'rep' | 'customer'
      timestamp?: string
      effectiveness: 'excellent' | 'good' | 'average' | 'poor'
      score: number
      sentiment?: 'positive' | 'neutral' | 'negative'
      customer_engagement?: 'high' | 'medium' | 'low'
      missed_opportunities?: string[]
      techniques_used?: string[]
      alternative_lines?: string[]
      improvement_notes?: string
      category?: string
      words_per_minute?: number
      filler_words?: string[]
      is_question?: boolean
    }>
    feedback?: {
      strengths: string[]
      improvements: string[]
      specific_tips: string[]
    }
    scores?: Record<string, number>
    enhanced_metrics?: Record<string, any>
    earnings_data?: any
    deal_details?: any
    voice_analysis?: {
      sessionId?: string
      timestamp?: Date | string
      avgPitch?: number
      minPitch?: number
      maxPitch?: number
      pitchVariation?: number
      avgVolume?: number
      volumeConsistency?: number
      avgWPM?: number
      totalFillerWords?: number
      fillerWordsPerMinute?: number
      longPausesCount?: number
      monotonePeriods?: number
      pitchTimeline?: Array<{ time: number; value: number }>
      volumeTimeline?: Array<{ time: number; value: number }>
      wpmTimeline?: Array<{ time: number; value: number }>
      issues?: {
        tooFast?: boolean
        tooSlow?: boolean
        monotone?: boolean
        lowEnergy?: boolean
        excessiveFillers?: boolean
        poorEndings?: boolean
      }
    }
    objection_analysis?: {
      total_objections?: number
      objections_detail?: Array<{
        type: string
        customer_statement: string
        rep_response: string
        technique_used: string
        resolution: 'resolved' | 'partial' | 'unresolved' | 'ignored'
        time_to_resolve: string
        effectiveness_score: number
      }>
      unresolved_concerns?: string[]
      objection_patterns?: string
    }
    coaching_plan?: {
      immediate_fixes?: Array<{
        issue: string
        practice_scenario: string
        resource_link: string
      }>
      skill_development?: Array<{
        skill: string
        current_level: 'beginner' | 'intermediate' | 'advanced'
        target_level: 'intermediate' | 'advanced'
        recommended_exercises: string[]
      }>
      role_play_scenarios?: string[]
    }
  } | null
  what_worked: string[] | null
  what_failed: string[] | null
  audio_url: string | null
  video_url: string | null
  has_video: boolean | null
  duration_seconds: number | null
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [activeView, setActiveView] = useState<'scores' | 'transcript' | 'speech'>('scores')

  const insightsByCategory = useMemo(() => {
    if (!session?.analytics?.line_ratings || !session.full_transcript) return {}

    const normalizeCategory = (value?: string) => {
      const slug = (value || '').toLowerCase()
      if (slug.includes('rapport')) return 'rapport'
      if (slug.includes('discovery') || slug.includes('needs')) return 'discovery'
      if (slug.includes('objection')) return 'objection_handling'
      if (slug.includes('close')) return 'closing'
      return slug.replace(/[^a-z0-9]+/g, '_') || 'general'
    }

    const categoryMap: Record<string, Array<{ quote: string; impact: string }>> = {}

    session.analytics.line_ratings.forEach((rating) => {
      const transcriptLine = session.full_transcript?.[rating.line_number]
      const quote = transcriptLine?.text || transcriptLine?.message
      const category = normalizeCategory(rating.category)

      if (!quote) return

      if (!categoryMap[category]) {
        categoryMap[category] = []
      }

      categoryMap[category].push({
        quote,
        impact: rating.improvement_notes || `Rated ${rating.effectiveness}`
      })
    })

    return categoryMap
  }, [session])

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])
  
  // Debug effect to track session changes
  useEffect(() => {
    if (session) {
      console.log('📊 Session state updated:', {
        hasAnalytics: !!session.analytics,
        analyticsKeys: session.analytics ? Object.keys(session.analytics) : [],
        hasVoiceAnalysis: !!session.analytics?.voice_analysis,
        voiceAnalysisKeys: session.analytics?.voice_analysis ? Object.keys(session.analytics.voice_analysis) : [],
        voiceAnalysisData: session.analytics?.voice_analysis
      })
    }
  }, [session])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session?id=${sessionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }
      
      const data = await response.json()
      
      // === ANALYTICS PAGE DEBUG ===
      console.log('=== ANALYTICS PAGE DEBUG ===')
      console.log('Full session data:', data)
      console.log('Has analytics?', !!data.analytics)
      console.log('Analytics type:', typeof data.analytics)
      console.log('Analytics keys:', data.analytics ? Object.keys(data.analytics) : 'none')
      console.log('Has voice_analysis in analytics?', !!data.analytics?.voice_analysis)
      console.log('Voice analysis data:', data.analytics?.voice_analysis)
      console.log('Voice analysis keys:', data.analytics?.voice_analysis ? Object.keys(data.analytics.voice_analysis) : 'none')
      console.log('Full analytics object:', JSON.stringify(data.analytics, null, 2))
      console.log('===========================')
      
      console.log('Session data:', data)
      console.log('Agent name:', data.agent_name)
      console.log('User ID:', data.user_id)
      console.log('Transcript:', data.full_transcript)
      console.log('Transcript length:', data.full_transcript?.length)
      console.log('First transcript item:', data.full_transcript?.[0])
      console.log('Has grading:', !!data.analytics?.line_ratings)
      console.log('🎵 Audio URL:', data.audio_url)
      console.log('🎥 Video URL:', data.video_url)
      console.log('📹 Has video:', data.has_video)
      console.log('⏱️ Duration:', data.duration_seconds)
      console.log('📦 Upload type:', data.upload_type)
      setSession(data)
      
      // If transcript exists but no grading, trigger grading and poll for completion
      // Check if grading is needed: no overall_score or analytics object
      const needsGrading = data.full_transcript && data.full_transcript.length > 0 && 
                          (!data.overall_score && !data.analytics?.scores?.overall)
      
      if (needsGrading) {
        console.log('🎯 No grading found, triggering grading and setting up polling...')
        const gradingStarted = await triggerGrading()
        
        if (!gradingStarted) {
          console.warn('⚠️ Failed to start grading after retries, will continue polling anyway')
        }
        
        // Poll every 3 seconds for grading completion (up to 2 minutes)
        let pollCount = 0
        const pollInterval = setInterval(async () => {
          pollCount++
          console.log(`🔄 Polling for grading completion (${pollCount * 3}s)...`)
          
          try {
            const pollResponse = await fetch(`/api/session?id=${sessionId}`)
            if (pollResponse.ok) {
              const pollData = await pollResponse.json()
              
              // Debug logging for polling
              console.log('🔄 Poll: Session data retrieved', {
                hasAnalytics: !!pollData.analytics,
                hasVoiceAnalysis: !!pollData.analytics?.voice_analysis,
                analyticsKeys: pollData.analytics ? Object.keys(pollData.analytics) : []
              })
              
              // Check if grading is complete by looking for overall_score or analytics.scores
              const isGraded = pollData.overall_score || pollData.analytics?.scores?.overall
              if (isGraded) {
                console.log('✅ Grading completed! Refreshing page...')
                console.log('🔄 Poll: Final session data before update', {
                  hasVoiceAnalysis: !!pollData.analytics?.voice_analysis,
                  voiceAnalysisKeys: pollData.analytics?.voice_analysis ? Object.keys(pollData.analytics.voice_analysis) : []
                })
                clearInterval(pollInterval)
                setSession(pollData)
                setGrading(false)
              }
            } else {
              console.warn(`⚠️ Failed to fetch session during polling: ${pollResponse.status}`)
            }
          } catch (error) {
            console.error('Error polling for grading:', error)
          }
          
          // Stop polling after 40 attempts (2 minutes)
          if (pollCount >= 40) {
            console.log('⏰ Polling timeout - grading may still be in progress')
            clearInterval(pollInterval)
            setGrading(false)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerGrading = async (retryCount = 0): Promise<boolean> => {
    const maxRetries = 3
    console.log('🎯 Triggering grading for session:', sessionId, retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : '')
    setGrading(true)
    try {
      const response = await fetch('/api/grade/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      console.log('📊 Grading response status:', response.status)
      const result = await response.json()
      console.log('📊 Grading result:', result)
      
      if (!response.ok) {
        // Retry on 503 (service unavailable) or 504 (timeout) errors
        if ((response.status === 503 || response.status === 504) && retryCount < maxRetries) {
          console.log(`⏳ Grading service unavailable, retrying in ${(retryCount + 1) * 2}s...`)
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000))
          return triggerGrading(retryCount + 1)
        }
        console.error('❌ Grading failed:', result)
        return false
      }
      return true
    } catch (error) {
      console.error('Error grading session:', error)
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.log(`⏳ Network error, retrying in ${(retryCount + 1) * 2}s...`)
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000))
        return triggerGrading(retryCount + 1)
      }
      return false
    } finally {
      setGrading(false)
    }
  }

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-36">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-500">Loading session data...</p>
        </div>
      )
    }

    if (!session) {
      return (
        <div className="bg-[#101010] border border-gray-800 rounded-3xl p-12 text-center">
          <p className="text-gray-400 mb-4">Session not found</p>
          <Link href="/sessions" className="text-white hover:text-gray-300 font-medium">
            Back to Sessions
          </Link>
        </div>
      )
    }

    if (activeView === 'transcript') {
      return (
        <TranscriptViewV2
          transcript={session.full_transcript || []}
          lineRatings={session.analytics?.line_ratings || []}
          duration={session.duration_seconds || 600}
          wordCount={session.full_transcript?.reduce((sum, line) => sum + (line.text || line.message || '').split(' ').length, 0)}
          sessionId={sessionId as string}
        />
      )
    }

    if (activeView === 'speech') {
      // Convert voice_analysis data to VoiceAnalysisData format
      const voiceAnalysis = session.analytics?.voice_analysis
      
      if (!voiceAnalysis) {
        return (
          <div className="bg-[#101010] border border-gray-800 rounded-3xl p-12 text-center">
            <p className="text-gray-400 mb-4">Speech analysis data not available for this session</p>
            <p className="text-gray-500 text-sm">
              Speech metrics are collected during live sessions with microphone access enabled.
            </p>
          </div>
        )
      }

      // Convert to VoiceAnalysisData format
      const voiceData = {
        sessionId: session.id,
        timestamp: new Date(session.created_at),
        avgPitch: voiceAnalysis.avgPitch || 0,
        minPitch: voiceAnalysis.minPitch || 0,
        maxPitch: voiceAnalysis.maxPitch || 0,
        pitchVariation: voiceAnalysis.pitchVariation || 0,
        avgVolume: voiceAnalysis.avgVolume || -60,
        volumeConsistency: voiceAnalysis.volumeConsistency || 0,
        avgWPM: voiceAnalysis.avgWPM || 0,
        totalFillerWords: voiceAnalysis.totalFillerWords || 0,
        fillerWordsPerMinute: voiceAnalysis.fillerWordsPerMinute || 0,
        longPausesCount: voiceAnalysis.longPausesCount || 0,
        monotonePeriods: voiceAnalysis.monotonePeriods || 0,
        pitchTimeline: voiceAnalysis.pitchTimeline || [],
        volumeTimeline: voiceAnalysis.volumeTimeline || [],
        wpmTimeline: voiceAnalysis.wpmTimeline || [],
        issues: {
          tooFast: voiceAnalysis.issues?.tooFast || false,
          tooSlow: voiceAnalysis.issues?.tooSlow || false,
          monotone: voiceAnalysis.issues?.monotone || false,
          lowEnergy: voiceAnalysis.issues?.lowEnergy || false,
          excessiveFillers: voiceAnalysis.issues?.excessiveFillers || false,
          poorEndings: voiceAnalysis.issues?.poorEndings || false,
        }
      }

      return (
        <div className="space-y-6">
          <SpeechQualitySection 
            voiceAnalysis={voiceData}
            durationSeconds={session.duration_seconds || 600}
          />
          
          {/* Improvement Suggestions Section */}
          {voiceData.issues && (
            <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">What Could Be Improved</h3>
              <div className="space-y-4">
                {voiceData.issues.tooFast && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="text-amber-400 font-bold">⚡</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Speaking Too Fast</h4>
                      <p className="text-gray-300 text-sm">
                        Your average pace of {voiceData.avgWPM} WPM is above the ideal range (140-160 WPM). 
                        Slow down slightly to improve clarity and give customers time to process your message.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.issues.tooSlow && (
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="text-blue-400 font-bold">🐌</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Speaking Too Slow</h4>
                      <p className="text-gray-300 text-sm">
                        Your average pace of {voiceData.avgWPM} WPM is below the ideal range (140-160 WPM). 
                        Pick up the pace slightly to maintain energy and engagement throughout the conversation.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.issues.monotone && (
                  <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="text-purple-400 font-bold">📊</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Limited Vocal Variety</h4>
                      <p className="text-gray-300 text-sm">
                        Your pitch variation of {voiceData.pitchVariation.toFixed(1)}% is below the ideal 20%. 
                        Vary your pitch more to sound more engaging and dynamic. Emphasize key points with 
                        pitch changes to maintain customer interest.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.issues.lowEnergy && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-red-400 font-bold">🔋</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Low Energy</h4>
                      <p className="text-gray-300 text-sm">
                        Your energy level could be improved. Speak with more enthusiasm and confidence. 
                        Increase your pace slightly, vary your pitch more, and reduce filler words to boost 
                        your energy. Your energy directly impacts customer engagement and trust.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.issues.excessiveFillers && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="text-yellow-400 font-bold">💬</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Excessive Filler Words</h4>
                      <p className="text-gray-300 text-sm">
                        You used {voiceData.fillerWordsPerMinute.toFixed(1)} filler words per minute. 
                        Practice pausing instead of using "um," "uh," or "like." Pauses show confidence 
                        and give you time to think clearly.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.issues.poorEndings && (
                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <div className="text-orange-400 font-bold">🎯</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Weak Sentence Endings</h4>
                      <p className="text-gray-300 text-sm">
                        Some sentences trail off or end with uncertainty. End statements with confidence 
                        and conviction. Practice finishing sentences strongly to sound more authoritative.
                      </p>
                    </div>
                  </div>
                )}
                
                {voiceData.longPausesCount > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="text-indigo-400 font-bold">⏸️</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Long Pauses Detected</h4>
                      <p className="text-gray-300 text-sm">
                        You had {voiceData.longPausesCount} long pause{voiceData.longPausesCount !== 1 ? 's' : ''} 
                        (over 3 seconds). While pauses can be powerful, too many long pauses can make you 
                        seem unprepared. Practice smoother transitions between thoughts.
                      </p>
                    </div>
                  </div>
                )}
                
                {!voiceData.issues.tooFast && !voiceData.issues.tooSlow && !voiceData.issues.monotone && 
                 !voiceData.issues.lowEnergy && !voiceData.issues.excessiveFillers && !voiceData.issues.poorEndings &&
                 voiceData.longPausesCount === 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <div className="text-green-400 font-bold">✅</div>
                    <div>
                      <h4 className="text-white font-medium mb-1">Excellent Speech Delivery</h4>
                      <p className="text-gray-300 text-sm">
                        Your speech metrics are all within ideal ranges! Keep up the great work with your 
                        pace, variety, energy, and clarity. Continue practicing to maintain this level of 
                        vocal excellence.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <>
        <ScoresViewV2
          sessionId={session.id}
          overallScore={session.overall_score || 0}
          scores={{
            rapport: session.rapport_score ?? 0,
            discovery: session.discovery_score ?? 0,
            objection_handling: session.objection_handling_score ?? 0,
            closing: session.close_score ?? 0,
            safety: session.analytics?.scores?.safety ?? 0,
            introduction: session.analytics?.scores?.introduction ?? 0,
            listening: session.analytics?.scores?.listening ?? 0,
            speaking_pace: session.speaking_pace_score ?? session.analytics?.scores?.speaking_pace,
            filler_words: session.filler_words_score ?? session.analytics?.scores?.filler_words,
            question_ratio: session.question_ratio_score ?? session.analytics?.scores?.question_ratio,
            active_listening: session.active_listening_score ?? session.analytics?.scores?.active_listening,
            assumptive_language: session.assumptive_language_score ?? session.analytics?.scores?.assumptive_language
          }}
          feedback={session.analytics?.feedback || {
            strengths: session.what_worked || [],
            improvements: session.what_failed || [],
            specific_tips: []
          }}
          virtualEarnings={session.virtual_earnings || 0}
          earningsData={session.earnings_data || session.analytics?.earnings_data || {}}
          dealDetails={session.deal_details || session.analytics?.deal_details || {}}
          conversationDynamics={session.analytics?.conversation_dynamics || {}}
          failureAnalysis={session.analytics?.failure_analysis || {}}
          saleClosed={session.sale_closed || false}
          lineRatings={session.analytics?.line_ratings || []}
          fullTranscript={session.full_transcript || []}
          timelineKeyMoments={session.analytics?.timeline_key_moments}
          agentName={session.agent_name || 'AI Agent'}
          durationSeconds={session.duration_seconds || 600}
          audioUrl={session.audio_url}
          videoUrl={session.video_url}
        />
        {/* Audio playback archived - focusing on grading consistency */}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 space-y-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/sessions"
              className="inline-flex items-center text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
            <h1 className="text-3xl font-semibold text-white">AI-Powered Performance Analysis</h1>
            {session && (
              <p className="text-gray-500 text-sm">
                {session.agent_name || 'Practice Session'} • Know Exactly What's Working
              </p>
            )}
          </div>

          {grading && (
            <div className="inline-flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-full px-5 py-2 text-purple-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is analyzing your conversation...</span>
            </div>
          )}
        </div>

        {!loading && session && (
          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 text-sm text-gray-300">
            {(['scores', 'transcript', 'speech'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-full transition-all ${
                  activeView === view
                    ? 'bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                    : 'hover:text-white'
                }`}
              >
                {view === 'scores' ? 'Scores & Feedback' : view === 'transcript' ? 'Transcript' : 'Speech Analysis'}
              </button>
            ))}
          </div>
        )}

        {renderBody()}
      </div>
    </div>
  )
}

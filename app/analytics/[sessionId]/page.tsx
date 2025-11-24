'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { HeroSection } from '@/components/analytics/HeroSection'
import { InstantInsightsGrid } from '@/components/analytics/InstantInsightsGrid'
import { CriticalMomentsTimeline } from '@/components/analytics/CriticalMomentsTimeline'
import { ComparativePerformance } from '@/components/analytics/ComparativePerformance'
import { AICoachingInsights } from '@/components/analytics/AICoachingInsights'
import { ElevenLabsSpeechMetrics } from '@/components/analytics/ElevenLabsSpeechMetrics'

interface SessionData {
  id: string
  overall_score: number | null
  rapport_score: number | null
  discovery_score: number | null
  objection_handling_score: number | null
  close_score: number | null
  sale_closed: boolean | null
  virtual_earnings: number | null
  earnings_data?: any | null
  deal_details: any | null
  instant_metrics?: any
  key_moments?: any[]
  analytics?: {
    coaching_plan?: any
    feedback?: any
    voice_analysis?: any
  }
  elevenlabs_metrics?: any
}

interface ComparisonData {
  current: {
    overall: number
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    closePercentage?: number
  }
  userAverage: {
    overall: number
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    closePercentage?: number
  }
  teamAverage: {
    overall: number
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    closePercentage?: number
  }
  vsUserAverage: {
    overall: number
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    closePercentage?: number
  }
  vsTeamAverage: {
    overall: number
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
    closePercentage?: number
  }
  trends: {
    rapport: number
    discovery: number
    objection_handling: number
    closing: number
  }
  percentile: number
  percentileLabel: string
  recentScores?: {
    rapport: number[]
    discovery: number[]
    objection_handling: number[]
    closing: number[]
  }
}

export default function AnalyticsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [userName, setUserName] = useState<string>('You')
  const [loading, setLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState({
    hero: false,
    insights: false,
    moments: false,
    comparison: false,
    coaching: false,
    speech: false
  })
  
  // Fetch user name and check for free demo redirect
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, subscription_status, used_free_demo, free_demo_used_at')
          .eq('id', user.id)
          .single()
        
        if (userData?.full_name) {
          // Get first name
          const firstName = userData.full_name.split(' ')[0] || 'You'
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
        } else if (user.email) {
          // Use email username as fallback
          const emailName = user.email.split('@')[0] || 'You'
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase())
        }
        
        // Check if user used free demo and needs to be redirected to pricing
        const status = userData?.subscription_status || null
        const usedFreeDemo = userData?.used_free_demo || false
        const freeDemoUsedAt = userData?.free_demo_used_at
        
        // If user has no subscription and used free demo, check if this session was their free demo
        if (!status || status === 'none') {
          if (usedFreeDemo && freeDemoUsedAt) {
            // Check if this session was created around the time they used free demo
            // Allow them to view analytics, then redirect after a delay
            const checkAndRedirect = async () => {
              // Wait for analytics to load (give them time to see feedback)
              setTimeout(async () => {
                // Check if they've scrolled or interacted (basic check)
                let hasInteracted = false
                const interactionTimeout = setTimeout(() => {
                  if (!hasInteracted) {
                    // Redirect to pricing after viewing analytics
                    window.location.href = '/pricing?from=demo'
                  }
                }, 30000) // 30 seconds to view analytics
                
                // Track interactions
                const handleInteraction = () => {
                  hasInteracted = true
                  clearTimeout(interactionTimeout)
                  // Redirect after they've interacted
                  setTimeout(() => {
                    window.location.href = '/pricing?from=demo'
                  }, 10000) // 10 seconds after interaction
                }
                
                window.addEventListener('scroll', handleInteraction, { once: true })
                window.addEventListener('click', handleInteraction, { once: true })
              }, 5000) // Wait 5 seconds for analytics to load
            }
            
            checkAndRedirect()
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error)
      }
    }
    
    fetchUserName()
  }, [])

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session?id=${sessionId}`)
        if (!response.ok) throw new Error('Failed to fetch session')
      
      const data = await response.json()
      setSession(data)
        setLoadingStates(prev => ({ ...prev, hero: true }))
        
        // Load insights immediately if available
        if (data.instant_metrics) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, insights: true }))
          }, 500)
        }
        
        // Load moments after insights
        if (data.key_moments && Array.isArray(data.key_moments) && data.key_moments.length > 0) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, moments: true }))
          }, 1000)
        }
        
        // Load coaching if available
        if (data.analytics?.coaching_plan || data.analytics?.feedback) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, coaching: true }))
          }, 2000)
        }
        
        // Load speech metrics if available
        if (data.elevenlabs_metrics || data.analytics?.voice_analysis) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, speech: true }))
          }, 2500)
        }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

    fetchSession()
  }, [sessionId])
  
  // Fetch comparison data
  useEffect(() => {
    if (!session || !session.overall_score) return
    
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/analytics/v2/comparison/${sessionId}`)
        if (!response.ok) throw new Error('Failed to fetch comparison')
        
        const data = await response.json()
        setComparison(data)
        
        // Mark comparison as loaded after a delay
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, comparison: true }))
        }, 1500)
      } catch (error) {
        console.error('Error fetching comparison:', error)
      }
    }
    
    fetchComparison()
  }, [session, sessionId])
  
    if (loading) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading session analysis...</p>
        </div>
        </div>
      )
    }

    if (!session) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Session not found</p>
        </div>
          </div>
        )
      }

  const overallScore = session.overall_score || 0
  
  // Generate quick verdict from feedback or create one
  const getQuickVerdict = () => {
    if (session.analytics?.feedback?.specific_tips?.[0]) {
      return session.analytics.feedback.specific_tips[0]
    }
    if (session.analytics?.feedback?.improvements?.[0]) {
      return session.analytics.feedback.improvements[0]
    }
    // Generate a simple verdict based on scores
    const rapport = session.rapport_score || 0
    const closing = session.close_score || 0
    if (rapport >= 70 && closing < 50) {
      return 'Strong rapport, weak closing'
    }
    if (closing >= 70 && rapport < 50) {
      return 'Good closing, needs better rapport'
    }
    if (overallScore >= 70) {
      return 'Solid performance overall'
    }
    return 'Room for improvement across key areas'
  }
  
  const quickVerdict = getQuickVerdict()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        {/* Hero Section - Loads immediately */}
        {loadingStates.hero && comparison && (
          <HeroSection
            overallScore={overallScore}
            vsUserAverage={comparison.vsUserAverage.overall}
            vsTeamAverage={comparison.vsTeamAverage.overall}
            percentileLabel={comparison.percentileLabel}
            saleClosed={session.sale_closed || false}
            virtualEarnings={session.virtual_earnings || 0}
            earningsData={session.earnings_data}
            dealDetails={session.deal_details}
            quickVerdict={quickVerdict}
            trends={comparison.trends}
          />
        )}
        
        {/* Instant Insights Grid - Loads after hero */}
        {session.instant_metrics ? (
          loadingStates.insights ? (
            <InstantInsightsGrid 
              instantMetrics={session.instant_metrics} 
              userName={userName}
              transcript={(session as any).full_transcript}
            />
          ) : (
            <div className="h-32 bg-slate-900/50 rounded-xl mb-8 animate-pulse" />
          )
        ) : null}
        
        {/* Critical Moments Timeline - Loads after insights */}
        {session.key_moments && Array.isArray(session.key_moments) && session.key_moments.length > 0 ? (
          loadingStates.moments ? (
            <CriticalMomentsTimeline 
              moments={session.key_moments}
              sessionStartTime={(session as any).created_at || (session as any).started_at}
              durationSeconds={(session as any).duration_seconds}
              agentName={(session as any).agent_name}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
        
        {/* Comparative Performance - Loads after moments */}
        {comparison ? (
          loadingStates.comparison ? (
            <ComparativePerformance
              currentOverall={comparison.current.overall}
              userAverageOverall={comparison.userAverage.overall}
              teamAverageOverall={comparison.teamAverage.overall}
              currentClosePercentage={comparison.current.closePercentage}
              userAverageClosePercentage={comparison.userAverage.closePercentage}
              teamAverageClosePercentage={comparison.teamAverage.closePercentage}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
        
        {/* AI Coaching Insights - Loads after comparison */}
        {(session.analytics?.coaching_plan || session.analytics?.feedback) ? (
          loadingStates.coaching ? (
            <AICoachingInsights
              coachingPlan={session.analytics?.coaching_plan}
              feedback={session.analytics?.feedback}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
        
        {/* ElevenLabs Speech Metrics - Loads last if available */}
        {(session.elevenlabs_metrics || session.analytics?.voice_analysis) ? (
          loadingStates.speech ? (
            <ElevenLabsSpeechMetrics
              elevenlabsMetrics={session.elevenlabs_metrics}
              voiceAnalysis={session.analytics?.voice_analysis}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamically import heavy analytics components to reduce initial bundle size
const HeroSection = dynamic(() => import('@/components/analytics/HeroSection').then(mod => ({ default: mod.HeroSection })), {
  loading: () => <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})
const InstantInsightsGrid = dynamic(() => import('@/components/analytics/InstantInsightsGrid').then(mod => ({ default: mod.InstantInsightsGrid })), {
  loading: () => <div className="h-32 bg-slate-900/50 rounded-xl mb-8 animate-pulse" />,
  ssr: false
})
const CriticalMomentsTimeline = dynamic(() => import('@/components/analytics/CriticalMomentsTimeline').then(mod => ({ default: mod.CriticalMomentsTimeline })), {
  loading: () => <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})
const ElevenLabsSpeechMetrics = dynamic(() => import('@/components/analytics/ElevenLabsSpeechMetrics').then(mod => ({ default: mod.ElevenLabsSpeechMetrics })), {
  loading: () => <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})
const FocusArea = dynamic(() => import('@/components/analytics/FocusArea').then(mod => ({ default: mod.FocusArea })), {
  loading: () => <div className="h-48 bg-slate-900/50 rounded-xl mb-8 animate-pulse" />,
  ssr: false
})
const ConversationFlow = dynamic(() => import('@/components/analytics/ConversationFlow').then(mod => ({ default: mod.ConversationFlow })), {
  loading: () => <div className="h-96 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})

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

// Helper function to format time in MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

// Calculate phases from session data
function calculatePhases(session: SessionData, durationSeconds: number) {
  const segmentDuration = durationSeconds / 4
  
  return [
    {
      name: 'Opening',
      timeRange: `0:00-${formatTime(segmentDuration)}`,
      score: session.rapport_score || 0,
      passed: (session.rapport_score || 0) >= 60
    },
    {
      name: 'Building Value',
      timeRange: `${formatTime(segmentDuration)}-${formatTime(segmentDuration * 2)}`,
      score: session.discovery_score || 0,
      passed: (session.discovery_score || 0) >= 60
    },
    {
      name: 'Objections',
      timeRange: `${formatTime(segmentDuration * 2)}-${formatTime(segmentDuration * 3)}`,
      score: session.objection_handling_score || 0,
      passed: (session.objection_handling_score || 0) >= 60
    },
    {
      name: 'Close',
      timeRange: `${formatTime(segmentDuration * 3)}-${formatTime(durationSeconds)}`,
      score: session.close_score || 0,
      passed: (session.close_score || 0) >= 60
    }
  ]
}

// Derive energy data from voice analysis or generate placeholder
function deriveEnergyData(voiceAnalysis: any, durationSeconds: number): number[] {
  // If we have timeline data, use it
  if (voiceAnalysis?.pitchTimeline && voiceAnalysis?.volumeTimeline) {
    const pitchTimeline = voiceAnalysis.pitchTimeline
    const volumeTimeline = voiceAnalysis.volumeTimeline
    
    // Combine pitch and volume to calculate energy
    const energyPoints: number[] = []
    const maxLength = Math.max(pitchTimeline.length, volumeTimeline.length)
    
    for (let i = 0; i < maxLength; i++) {
      const pitch = pitchTimeline[i]?.value || 0
      const volume = volumeTimeline[i]?.value || 0
      
      // Normalize pitch (assuming 0-500 Hz range, normalize to 0-5)
      const normalizedPitch = Math.min(5, (pitch / 100))
      // Normalize volume (assuming 0-100 range, normalize to 0-5)
      const normalizedVolume = Math.min(5, (volume / 20))
      
      // Combine (energy = average of normalized pitch and volume)
      const energy = (normalizedPitch + normalizedVolume) / 2
      energyPoints.push(Math.max(0, Math.min(10, energy)))
    }
    
    // If we have enough points, return them
    if (energyPoints.length >= 8) {
      return energyPoints
    }
  }
  
  // Fallback: generate energy array based on overall metrics
  const avgEnergy = voiceAnalysis?.issues?.lowEnergy 
    ? 3 
    : voiceAnalysis?.pitchVariation 
      ? Math.min(10, (voiceAnalysis.pitchVariation / 20) * 10)
      : 6
  
  // Generate smooth energy curve (start high, may drop)
  const dataPoints = Math.max(16, Math.floor(durationSeconds / 15)) // ~1 point per 15 seconds, min 16
  const energyData: number[] = []
  
  // Simulate energy curve (start high, may decline)
  const startEnergy = avgEnergy + 2
  const endEnergy = avgEnergy - 1
  
  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1)
    // Smooth curve with some variation
    const baseEnergy = startEnergy + (endEnergy - startEnergy) * progress
    const variation = Math.sin(progress * Math.PI * 4) * 1.5 // Add some wave
    energyData.push(Math.max(1, Math.min(10, baseEnergy + variation)))
  }
  
  return energyData
}

// Generate focus area from phases
function generateFocusArea(phases: ReturnType<typeof calculatePhases>, voiceAnalysis: any, instantMetrics: any) {
  // Find phase with lowest score
  const sortedPhases = [...phases].sort((a, b) => a.score - b.score)
  const focusPhase = sortedPhases[0]
  
  if (!focusPhase || focusPhase.passed) {
    return null
  }
  
  const issues: string[] = []
  
  // Energy drop detection
  if (focusPhase.name === 'Close') {
    const openingPhase = phases.find(p => p.name === 'Opening')
    if (openingPhase && openingPhase.score > focusPhase.score + 20) {
      issues.push(`Energy dropped from ${openingPhase.score}% → ${focusPhase.score}%`)
    }
  }
  
  // Talk ratio issues
  if (instantMetrics?.conversationBalance) {
    const talkRatio = instantMetrics.conversationBalance
    if (talkRatio > 70) {
      issues.push(`Talk ratio went from balanced → ${talkRatio}% (too much talking)`)
    }
  }
  
  // Closing technique detection
  if (focusPhase.name === 'Close' && focusPhase.score < 50) {
    if (!instantMetrics?.techniquesUsed || instantMetrics.techniquesUsed.length === 0) {
      issues.push('No closing technique detected')
    }
  }
  
  // Voice analysis issues
  if (voiceAnalysis?.issues?.lowEnergy && focusPhase.name === 'Close') {
    issues.push('Low energy detected in closing phase')
  }
  
  // If no specific issues found, add generic one
  if (issues.length === 0) {
    issues.push(`Score of ${focusPhase.score}% is below passing threshold`)
  }
  
  return {
    phase: focusPhase.name,
    timeRange: focusPhase.timeRange.split('-')[1] || focusPhase.timeRange,
    issues
  }
}

// Generate voice tip based on focus area
function generateVoiceTip(focusArea: ReturnType<typeof generateFocusArea>, phases: ReturnType<typeof calculatePhases>): string {
  if (!focusArea) {
    // Generic tip based on overall performance
    const avgScore = phases.reduce((sum, p) => sum + p.score, 0) / phases.length
    if (avgScore < 60) {
      return 'Focus on maintaining consistent energy throughout the conversation. Practice taking deep breaths between phases.'
    }
    return 'Great job maintaining energy! Continue practicing to refine your technique.'
  }
  
  // Phase-specific tips
  const tips: Record<string, string> = {
    'Opening': 'Start strong with confident energy. Take a deep breath before beginning and maintain enthusiasm.',
    'Building Value': 'Keep your energy steady while building value. Vary your pitch to maintain engagement.',
    'Objections': 'Stay calm and confident when handling objections. Lower your pitch slightly to show authority.',
    'Close': 'Maintain your opening energy through the close. Take a deep breath before asking for the sale.'
  }
  
  return tips[focusArea.phase] || 'Focus on maintaining consistent energy throughout the conversation.'
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
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
    speech: false,
    conversationFlow: false
  })
  
  // Fetch user name and check authentication
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        // Require authentication - redirect unsigned users
        if (!user) {
          router.push('/auth/login?redirect=/analytics/' + sessionId)
          return
        }
        
        // Check for anonymous free demo redirect (localStorage)
        const usedFreeDemo = localStorage.getItem('used_free_demo') === 'true'
        if (usedFreeDemo && !user) {
          // Anonymous user who used free demo - redirect after viewing analytics
          const checkAndRedirect = () => {
            // Wait for analytics to load (give them time to see feedback)
            setTimeout(() => {
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
        const usedFreeDemoAuth = userData?.used_free_demo || false
        const freeDemoUsedAt = userData?.free_demo_used_at
        
        // If user has no subscription and used free demo, redirect after viewing analytics
        if ((!status || status === 'none') && usedFreeDemoAuth && freeDemoUsedAt) {
          const checkAndRedirect = () => {
            // Wait for analytics to load (give them time to see feedback)
            setTimeout(() => {
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
        
        // Always load speech metrics section (even if no data - component will handle it)
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, speech: true }))
        }, 2500)
        
        // Load conversation flow if we have scores and duration
        if (data.duration_seconds && (data.rapport_score !== null || data.discovery_score !== null || data.objection_handling_score !== null || data.close_score !== null)) {
          setTimeout(() => {
            setLoadingStates(prev => ({ ...prev, conversationFlow: true }))
          }, 3000)
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
  
  // Calculate conversation flow data
  const conversationFlowData = session.duration_seconds && (session.rapport_score !== null || session.discovery_score !== null || session.objection_handling_score !== null || session.close_score !== null)
    ? (() => {
        const phases = calculatePhases(session, session.duration_seconds || 0)
        const focusArea = generateFocusArea(phases, session.analytics?.voice_analysis, session.instant_metrics)
        return {
          phases,
          energyData: deriveEnergyData(session.analytics?.voice_analysis, session.duration_seconds || 0),
          focusArea,
          voiceTip: generateVoiceTip(focusArea, phases),
          durationSeconds: session.duration_seconds || 0
        }
      })()
    : null
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-10 lg:pb-12">
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
            trends={comparison.trends}
            currentScores={{
              rapport: session.rapport_score || 0,
              discovery: session.discovery_score || 0,
              objection_handling: session.objection_handling_score || 0,
              closing: session.close_score || 0
            }}
            recentScores={comparison.recentScores}
            failureAnalysis={session.analytics?.failure_analysis}
            voiceAnalysis={session.analytics?.voice_analysis}
            instantMetrics={session.instant_metrics}
            feedback={{
              ...session.analytics?.feedback,
              session_highlight: session.analytics?.session_highlight
            }}
          />
        )}
        
        {/* ElevenLabs Speech Metrics - Right after Overall Performance - ALWAYS show */}
        {loadingStates.speech ? (
          <ElevenLabsSpeechMetrics
            elevenlabsMetrics={session.elevenlabs_metrics}
            voiceAnalysis={session.analytics?.voice_analysis}
            instantMetrics={session.instant_metrics}
            transcript={session.full_transcript}
            durationSeconds={session.duration_seconds}
            speechGradingError={session.analytics?.speech_grading_error}
          />
        ) : (
          <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
        )}
        
        {/* Instant Insights Grid - Loads after hero */}
        {session.instant_metrics ? (
          loadingStates.insights ? (
            <InstantInsightsGrid 
              instantMetrics={session.instant_metrics} 
              userName={userName}
              transcript={(session as any).full_transcript}
              voiceAnalysis={session.analytics?.voice_analysis}
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
        
        {/* Conversation Flow - Loads after moments */}
        {conversationFlowData ? (
          loadingStates.conversationFlow ? (
            <ConversationFlow
              phases={conversationFlowData.phases}
              energyData={conversationFlowData.energyData}
              focusArea={conversationFlowData.focusArea || undefined}
              voiceTip={conversationFlowData.voiceTip}
              durationSeconds={conversationFlowData.durationSeconds}
            />
          ) : (
            <div className="h-96 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
        
        {/* Focus Area - Shows biggest opportunity */}
        {comparison && session.overall_score && (
          loadingStates.comparison ? (
            <FocusArea
              currentScores={{
                rapport: session.rapport_score || 0,
                discovery: session.discovery_score || 0,
                objection_handling: session.objection_handling_score || 0,
                closing: session.close_score || 0
              }}
              userName={userName}
            />
          ) : null
        )}
        
        
        {/* AI Coaching Insights - ARCHIVED */}
        {/* {(session.analytics?.coaching_plan || session.analytics?.feedback) ? (
          loadingStates.coaching ? (
            <AICoachingInsights
              coachingPlan={session.analytics?.coaching_plan}
              feedback={session.analytics?.feedback}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null} */}
      </div>
    </div>
  )
}

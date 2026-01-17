'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { AnalyticsErrorBoundary } from '@/components/analytics/AnalyticsErrorBoundary'
import { cn } from '@/lib/utils'

// Dynamically import heavy analytics components to reduce initial bundle size
const HeroSection = dynamic(() => import('@/components/analytics/HeroSection').then(mod => ({ default: mod.HeroSection })), {
  loading: () => <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})
const InstantInsightsGrid = dynamic(() => import('@/components/analytics/InstantInsightsGrid').then(mod => ({ default: mod.InstantInsightsGrid })), {
  loading: () => <div className="h-32 bg-slate-900/50 rounded-xl mb-8 animate-pulse" />,
  ssr: false
})
const ActionableSteps = dynamic(() => import('@/components/analytics/ActionableSteps').then(mod => ({ default: mod.ActionableSteps })), {
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
const ObjectionAnalysis = dynamic(() => import('@/components/analytics/ObjectionAnalysis').then(mod => ({ default: mod.default })), {
  loading: () => <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />,
  ssr: false
})
const TranscriptViewV2 = dynamic(() => import('@/components/analytics/TranscriptViewV2').then(mod => ({ default: mod.default })), {
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
  grading_status?: string | null
  graded_at?: string | null
  analytics?: {
    coaching_plan?: any
    feedback?: any
    objection_analysis?: any
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
  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript'>('analysis')
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
    if (!sessionId) return
    
    const fetchUserName = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        // Require authentication - redirect unsigned users
        if (!user) {
          router.push('/auth/login?redirect=/analytics/' + sessionId)
          return
        }
        
        // ARCHIVED: Pricing redirects removed - software is now free for signed-in users
        // Anonymous users can still view analytics, but will be prompted to sign in for full access
        
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
        
        // ARCHIVED: Pricing redirects removed - software is now free for signed-in users
        // Authenticated users have free access - no redirects needed
      } catch (error) {
        console.error('Error fetching user name:', error)
      }
    }
    
    fetchUserName()
  }, [sessionId, router])

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/session?id=${sessionId}`, {
        cache: 'force-cache',
        next: { revalidate: 30 } // Cache for 30 seconds to reduce load
      })
        if (!response.ok) throw new Error('Failed to fetch session')
      
      const data = await response.json()
      
      // Comprehensive check for 100% complete grading
      const isGradingComplete = (sessionData: any): boolean => {
        // Must have grading_status as 'complete'
        if (sessionData.grading_status !== 'complete') {
          return false
        }
        
        // Must have sale_closed determined (can be true or false, but must be set)
        if (sessionData.sale_closed === null || sessionData.sale_closed === undefined) {
          return false
        }
        
        // Must have overall_score (required for HeroSection/overall card)
        if (sessionData.overall_score === null || sessionData.overall_score === undefined) {
          return false
        }
        
        // Must have at least the core scores
        if (
          (sessionData.rapport_score === null || sessionData.rapport_score === undefined) &&
          (sessionData.discovery_score === null || sessionData.discovery_score === undefined) &&
          (sessionData.objection_handling_score === null || sessionData.objection_handling_score === undefined) &&
          (sessionData.close_score === null || sessionData.close_score === undefined)
        ) {
          return false
        }
        
        return true
      }
      
      // Check if grading is 100% complete
      if (isGradingComplete(data)) {
        console.log('Grading 100% complete - showing analytics')
        setSession(data)
        
        // Set loading states after session is set
        setLoadingStates(prev => ({ ...prev, hero: true }))
        
        // Load insights immediately - always show performance metrics
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, insights: true }))
        }, 500)
        
        // Load actionable steps after insights (always show, doesn't depend on key_moments)
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, moments: true }))
        }, 1000)
        
        // Load objection analysis if available
        if (data.analytics?.objection_analysis) {
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
      } else {
        // Grading not complete yet - start polling for completion
        console.log('Grading not complete yet, polling for completion...', {
          grading_status: data.grading_status,
          sale_closed: data.sale_closed,
          overall_score: data.overall_score,
          hasScores: !!(data.rapport_score || data.discovery_score || data.objection_handling_score || data.close_score)
        })
        
        // Poll for grading completion (up to 3 minutes)
        let pollCount = 0
        const maxPolls = 180 // 3 minutes at 1 second intervals
        
        const pollForCompletion = async () => {
          try {
            const pollResponse = await fetch(`/api/session?id=${sessionId}`, {
              cache: 'no-store' // Don't cache polling requests
            })
            if (pollResponse.ok) {
              const pollData = await pollResponse.json()
              
              if (isGradingComplete(pollData)) {
                console.log('Grading 100% complete! Loading analytics...')
                setSession(pollData)
                // Set loading states after session is set
                setTimeout(() => {
                  setLoadingStates(prev => ({ ...prev, hero: true }))
                  setTimeout(() => {
                    setLoadingStates(prev => ({ ...prev, insights: true }))
                  }, 500)
                  setTimeout(() => {
                    setLoadingStates(prev => ({ ...prev, moments: true }))
                  }, 1000)
                  setTimeout(() => {
                    setLoadingStates(prev => ({ ...prev, speech: true }))
                  }, 2500)
                }, 100)
                return
              }
            }
            
            pollCount++
            if (pollCount < maxPolls) {
              // Continue polling
              setTimeout(pollForCompletion, 1000)
            } else {
              // Timeout - redirect back to sessions page
              console.warn('Grading timeout - redirecting to sessions page')
              router.push('/sessions?message=Grading is still in progress. Please check back in a few moments.')
            }
          } catch (error) {
            console.error('Error polling for grading completion:', error)
            // On error, redirect to sessions page
            router.push('/sessions?message=Unable to load analytics. Please try again later.')
          }
        }
        
        // Start polling after a short delay
        setTimeout(pollForCompletion, 1000)
        
        // DO NOT show partial data - keep loading state
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

    fetchSession()
  }, [sessionId, router])
  
  // Fetch comparison data - only when grading is 100% complete
  useEffect(() => {
    if (!session || session.overall_score === null || session.overall_score === undefined) return
    if (session.grading_status !== 'complete') return
    
    const fetchComparison = async () => {
      try {
        const response = await fetch(`/api/analytics/v2/comparison/${sessionId}`, {
          cache: 'force-cache',
          next: { revalidate: 60 } // Cache comparison data for 1 minute
        })
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
  
    if (loading || !session) {
      return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Loading session analysis...</p>
          <p className="text-gray-600 text-sm">Waiting for grading to complete...</p>
        </div>
        </div>
      )
    }
    
    // Auto-refresh while grading is in progress
    useEffect(() => {
      if (session && session.grading_status !== 'complete') {
        const interval = setInterval(() => {
          // Reload the page to check for updated grading status
          window.location.reload()
        }, 3000) // Check every 3 seconds
        
        return () => clearInterval(interval)
      }
    }, [session])
    
    // CRITICAL: Only show analytics if grading is 100% complete
    // Check grading_status first - must be 'complete'
    if (session.grading_status !== 'complete') {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Grading in Progress</h2>
            <p className="text-gray-400 mb-4">Please wait while we analyze your session...</p>
            <p className="text-sm text-gray-500 mb-2">
              Status: <span className="font-semibold">{session.grading_status || 'pending'}</span>
            </p>
            <p className="text-xs text-gray-600 mt-4">
              This page will automatically refresh when grading is complete.
            </p>
          </div>
        </div>
      )
    }
    
    // Double-check that we have scores before showing the page
    // Even if grading_status is complete, ensure scores exist
    if (session.overall_score === null && session.overall_score !== 0) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Finalizing Scores</h2>
            <p className="text-gray-400 mb-4">Calculating your performance metrics...</p>
            <p className="text-xs text-gray-600 mt-4">
              This page will automatically refresh when ready.
            </p>
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
    <AnalyticsErrorBoundary>
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pt-8 sm:pt-12 lg:pt-24 pb-8 sm:pb-10 lg:pb-12">
        {/* Tabs */}
        <div className="mb-6 sm:mb-8 flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "px-4 py-2 text-sm sm:text-base font-medium transition-colors border-b-2",
              activeTab === 'analysis'
                ? "text-white border-purple-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            )}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn(
              "px-4 py-2 text-sm sm:text-base font-medium transition-colors border-b-2",
              activeTab === 'transcript'
                ? "text-white border-purple-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            )}
          >
            Full Transcript
          </button>
        </div>

        {/* Transcript Tab Content */}
        {activeTab === 'transcript' && (
          <div className="mb-8">
            {session.full_transcript && Array.isArray(session.full_transcript) && session.full_transcript.length > 0 ? (
              <TranscriptViewV2
                transcript={session.full_transcript}
                duration={session.duration_seconds || 600}
                sessionId={sessionId}
                agentName={(session as any).agent_name}
              />
            ) : (
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
                <p className="text-slate-400">No transcript available</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <>
        {/* Hero Section - Only show when we have all required data */}
        {loadingStates.hero && session.overall_score !== null && session.overall_score !== undefined && (
          <HeroSection
            overallScore={overallScore}
            vsUserAverage={comparison?.vsUserAverage?.overall || 0}
            vsTeamAverage={comparison?.vsTeamAverage?.overall || 0}
            percentileLabel={comparison?.percentileLabel || 'Top 50%'}
            saleClosed={session.sale_closed || false}
            virtualEarnings={session.virtual_earnings || 0}
            earningsData={session.earnings_data}
            dealDetails={session.deal_details}
            trends={comparison?.trends || { rapport: 0, discovery: 0, objection_handling: 0, closing: 0 }}
            currentScores={{
              rapport: session.rapport_score || 0,
              discovery: session.discovery_score || 0,
              objection_handling: session.objection_handling_score || 0,
              closing: session.close_score || 0
            }}
            recentScores={comparison?.recentScores}
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
        
        {/* Instant Insights Grid - Loads after hero - Always show if we have session data */}
        {loadingStates.insights ? (
            <InstantInsightsGrid 
              instantMetrics={session.instant_metrics || {}} 
              userName={userName}
              transcript={(session as any).full_transcript || (session as any).transcript || []}
              voiceAnalysis={session.analytics?.voice_analysis}
            />
        ) : (
          <div className="h-32 bg-slate-900/50 rounded-xl mb-8 animate-pulse" />
        )}
        
        {/* Actionable Steps - Loads after insights */}
        {loadingStates.moments ? (
          <ActionableSteps
            overallScore={session.overall_score || 0}
            saleClosed={session.sale_closed}
            sessionHighlight={session.analytics?.feedback?.session_highlight}
            strengths={session.analytics?.feedback?.strengths}
            improvements={session.analytics?.feedback?.improvements}
            scores={{
              rapport: session.rapport_score || 0,
              discovery: session.discovery_score || 0,
              objection_handling: session.objection_handling_score || 0,
              closing: session.close_score || 0
            }}
          />
        ) : (
          <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
        )}
        
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
        {/* Show FocusArea if we have comparison data AND scores exist (including 0 scores) */}
        {comparison && session.overall_score !== null && session.overall_score !== undefined && (
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
        
        
        {/* Objection Analysis - Shows detailed objection handling */}
        {session.analytics?.objection_analysis ? (
          loadingStates.coaching ? (
            <ObjectionAnalysis
              objectionAnalysis={session.analytics.objection_analysis}
            />
          ) : (
            <div className="h-64 bg-slate-900/50 rounded-3xl mb-8 animate-pulse" />
          )
        ) : null}
          </>
        )}
        
        </div>
      </div>
    </AnalyticsErrorBoundary>
  )
}

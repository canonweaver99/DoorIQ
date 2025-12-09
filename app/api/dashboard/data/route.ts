import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SessionPerformance, GradeInfo, KeyIssue, VoiceMetrics, ConversationMetrics, ClosingMetrics, OverallMetrics } from '@/app/dashboard/types'

function calculateGrade(score: number): GradeInfo {
  if (score >= 90) {
    return {
      letter: 'A',
      color: 'text-green-600',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-600'
    }
  } else if (score >= 80) {
    return {
      letter: 'B',
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      borderColor: 'border-green-400'
    }
  } else if (score >= 70) {
    return {
      letter: 'C',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      borderColor: 'border-yellow-400'
    }
  } else if (score >= 60) {
    return {
      letter: 'D',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
      borderColor: 'border-orange-400'
    }
  } else {
    return {
      letter: 'F',
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      borderColor: 'border-red-400'
    }
  }
}

function extractVoiceMetrics(analytics: any, durationSeconds: number | null): VoiceMetrics {
  const voiceMetrics = analytics?.voice_metrics || {}
  const voiceAnalysis = analytics?.voice_analysis || {}
  const enhancedMetrics = analytics?.enhanced_metrics || {}
  
  // Extract WPM for calculations
  const wpm = voiceMetrics.wordsPerMinute || voiceAnalysis.avgWPM || 0
  
  // Confidence: Based on filler words and tone
  const fillerWordsPerMin = voiceAnalysis.fillerWordsPerMinute || 
    (voiceAnalysis.totalFillerWords && durationSeconds 
      ? (voiceAnalysis.totalFillerWords / (durationSeconds / 60))
      : 0)
  const confidence = fillerWordsPerMin > 0
    ? Math.max(0, Math.min(100, 100 - (fillerWordsPerMin * 20)))
    : (wpm > 0 ? 75 : 70)
  
  // Energy: Based on volume and pace
  const energy = voiceAnalysis.issues?.lowEnergy 
    ? 45 
    : (wpm > 0 && wpm >= 140 ? 75 : 70)
  
  // Clarity: Based on filler words and pace
  const clarity = fillerWordsPerMin > 0
    ? Math.max(0, Math.min(100, 100 - (fillerWordsPerMin * 10)))
    : (wpm > 0 && wpm >= 140 && wpm <= 160 ? 85 : 80)
  
  const averageScore = Math.round((confidence + energy + clarity) / 3)
  
  return {
    confidence: Math.round(confidence),
    energy: Math.round(energy),
    clarity: Math.round(clarity),
    averageScore
  }
}

function extractConversationMetrics(analytics: any, transcript: any[]): ConversationMetrics {
  const voiceMetrics = analytics?.voice_metrics || {}
  const voiceAnalysis = analytics?.voice_analysis || {}
  const enhancedMetrics = analytics?.enhanced_metrics || {}
  
  // Talk Ratio: Calculate from transcript
  let talkRatio = 61 // Default
  if (transcript && Array.isArray(transcript)) {
    const repLines = transcript.filter((line: any) => 
      line.speaker === 'rep' || line.role === 'rep' || line.type === 'rep'
    ).length
    const totalLines = transcript.length
    if (totalLines > 0) {
      talkRatio = Math.round((repLines / totalLines) * 100)
    }
  }
  
  // Pace: Extract WPM
  const pace = voiceMetrics.wordsPerMinute || voiceAnalysis.avgWPM || 166
  
  // Warning if too fast
  const warning = pace > 160 ? 'Too fast' : undefined
  
  // Average score based on talk ratio and pace
  const talkRatioScore = talkRatio >= 50 && talkRatio <= 70 ? 80 : 
    (talkRatio >= 40 && talkRatio < 50) || (talkRatio > 70 && talkRatio <= 80) ? 70 : 60
  const paceScore = pace >= 140 && pace <= 160 ? 80 :
    (pace >= 120 && pace < 140) || (pace > 160 && pace <= 180) ? 70 : 60
  const averageScore = Math.round((talkRatioScore + paceScore) / 2)
  
  return {
    talkRatio,
    pace: Math.round(pace),
    warning,
    averageScore
  }
}

function extractClosingMetrics(saleClosed: boolean | null, analytics: any): ClosingMetrics {
  const success = saleClosed === true ? 100 : 0
  const attempts = saleClosed === true ? '1/1' : '0/1'
  const status = saleClosed === true ? 'SUCCESS' : 'MISSED'
  const averageScore = saleClosed === true ? 100 : 0
  
  return {
    success,
    attempts,
    status,
    averageScore
  }
}

function extractKeyIssues(
  saleClosed: boolean | null,
  analytics: any,
  voiceMetrics: VoiceMetrics,
  conversationMetrics: ConversationMetrics
): KeyIssue[] {
  const issues: KeyIssue[] = []
  
  // Check for close attempt
  if (saleClosed === false || saleClosed === null) {
    issues.push({
      text: "Didn't ask for the close",
      severity: 'warning'
    })
  }
  
  // Check speaking pace
  if (conversationMetrics.pace > 160) {
    issues.push({
      text: `Speaking too fast (${conversationMetrics.pace} WPM)`,
      severity: 'warning'
    })
  }
  
  // Check filler words
  const voiceAnalysis = analytics?.voice_analysis || {}
  const fillerWordsPerMin = voiceAnalysis.fillerWordsPerMinute || 
    (voiceAnalysis.totalFillerWords && analytics?.duration_seconds
      ? (voiceAnalysis.totalFillerWords / (analytics.duration_seconds / 60))
      : 0)
  
  if (fillerWordsPerMin > 5) {
    issues.push({
      text: `Too many filler words (${fillerWordsPerMin.toFixed(1)}/min)`,
      severity: 'warning'
    })
  }
  
  return issues
}

function calculatePercentile(score: number): string {
  // Simple percentile calculation - can be enhanced with actual user data
  if (score >= 90) return 'Top 10%'
  if (score >= 80) return 'Top 25%'
  if (score >= 70) return 'Top 50%'
  if (score >= 60) return 'Bottom 40%'
  return 'Bottom 40%'
}

// Mock data for unauthenticated/guest users
function getMockDashboardData() {
  const mockSession: SessionPerformance = {
    id: 'mock-session-id',
    overallScore: 50,
    grade: calculateGrade(50),
    agentName: 'Average Austin',
    createdAt: new Date().toISOString(),
    keyIssues: [
      {
        text: "Didn't ask for the close",
        severity: 'warning'
      },
      {
        text: 'Speaking too fast (166 WPM)',
        severity: 'warning'
      },
      {
        text: 'Too many filler words (8.3/min)',
        severity: 'warning'
      }
    ],
    voice: {
      confidence: 70,
      energy: 70,
      clarity: 80,
      averageScore: 73
    },
    conversation: {
      talkRatio: 61,
      pace: 166,
      warning: 'Too fast',
      averageScore: 61
    },
    closing: {
      success: 0,
      attempts: '0/1',
      status: 'MISSED',
      averageScore: 0
    },
    overall: {
      score: 50,
      grade: calculateGrade(50),
      percentile: 'Bottom 40%',
      averageScore: 50
    }
  }

  return {
    userName: 'Guest',
    currentDateTime: new Date().toISOString(),
    session: mockSession
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Return mock data for unauthenticated/guest users
    if (authError || !user) {
      return NextResponse.json(getMockDashboardData(), {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Get user's first name
    const userName = userData?.full_name 
      ? userData.full_name.split(' ')[0] 
      : userData?.email?.split('@')[0] || 'User'

    // Fetch past 20 sessions with analytics
    const { data: sessions, error: sessionError } = await supabase
      .from('live_sessions')
      .select('id, overall_score, agent_name, created_at, sale_closed, analytics, duration_seconds')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (sessionError || !sessions || sessions.length === 0) {
      // Return empty data if no sessions found
      return NextResponse.json({
        userName,
        currentDateTime: new Date().toISOString(),
        session: null
      })
    }

    // Aggregate metrics across all sessions
    let totalOverallScore = 0
    let totalConfidence = 0
    let totalEnergy = 0
    let totalClarity = 0
    let totalTalkRatio = 0
    let totalPace = 0
    let totalClosingSuccess = 0
    let totalClosingAttempts = 0
    let totalDurationSeconds = 0
    let validSessions = 0
    const allKeyIssues: KeyIssue[] = []
    const agentNames: string[] = []

    for (const session of sessions) {
      if (session.overall_score === null) continue
      
      validSessions++
      totalOverallScore += session.overall_score || 0
      
      const analytics = session.analytics || {}
      const transcript = analytics.transcript || analytics.full_transcript || []
      const durationSeconds = session.duration_seconds || 0
      totalDurationSeconds += durationSeconds

      // Extract and accumulate voice metrics
      const voiceMetrics = extractVoiceMetrics(analytics, durationSeconds)
      totalConfidence += voiceMetrics.confidence
      totalEnergy += voiceMetrics.energy
      totalClarity += voiceMetrics.clarity

      // Extract and accumulate conversation metrics
      const conversationMetrics = extractConversationMetrics(analytics, transcript)
      totalTalkRatio += conversationMetrics.talkRatio
      totalPace += conversationMetrics.pace

      // Accumulate closing metrics
      if (session.sale_closed === true) {
        totalClosingSuccess++
      }
      totalClosingAttempts++

      // Collect key issues
      const sessionKeyIssues = extractKeyIssues(
        session.sale_closed,
        analytics,
        voiceMetrics,
        conversationMetrics
      )
      allKeyIssues.push(...sessionKeyIssues)

      // Collect agent names
      if (session.agent_name) {
        agentNames.push(session.agent_name)
      }
    }

    if (validSessions === 0) {
      return NextResponse.json({
        userName,
        currentDateTime: new Date().toISOString(),
        session: null
      })
    }

    // Calculate averages
    const avgOverallScore = Math.round(totalOverallScore / validSessions)
    const avgConfidence = Math.round(totalConfidence / validSessions)
    const avgEnergy = Math.round(totalEnergy / validSessions)
    const avgClarity = Math.round(totalClarity / validSessions)
    const avgTalkRatio = Math.round(totalTalkRatio / validSessions)
    const avgPace = Math.round(totalPace / validSessions)
    const closingSuccessRate = Math.round((totalClosingSuccess / totalClosingAttempts) * 100)
    const avgDurationSeconds = Math.round(totalDurationSeconds / validSessions)

    // Get most common agent name
    const agentCounts: Record<string, number> = {}
    agentNames.forEach(name => {
      agentCounts[name] = (agentCounts[name] || 0) + 1
    })
    const mostCommonAgent = agentNames.length > 0 && Object.keys(agentCounts).length > 0
      ? Object.entries(agentCounts).reduce((a, b) => 
          agentCounts[a[0]] > agentCounts[b[0]] ? a : b
        )[0]
      : 'Average Austin'

    // Aggregate key issues - count occurrences and take most common ones
    const issueCounts: Record<string, number> = {}
    allKeyIssues.forEach(issue => {
      issueCounts[issue.text] = (issueCounts[issue.text] || 0) + 1
    })
    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => ({
        text,
        severity: 'warning' as const
      }))

    const grade = calculateGrade(avgOverallScore)
    
    const voice: VoiceMetrics = {
      confidence: avgConfidence,
      energy: avgEnergy,
      clarity: avgClarity,
      averageScore: Math.round((avgConfidence + avgEnergy + avgClarity) / 3)
    }

    // Calculate conversation average score
    const talkRatioScore = avgTalkRatio >= 50 && avgTalkRatio <= 70 ? 80 : 
      (avgTalkRatio >= 40 && avgTalkRatio < 50) || (avgTalkRatio > 70 && avgTalkRatio <= 80) ? 70 : 60
    const paceScore = avgPace >= 140 && avgPace <= 160 ? 80 :
      (avgPace >= 120 && avgPace < 140) || (avgPace > 160 && avgPace <= 180) ? 70 : 60
    const conversationAverageScore = Math.round((talkRatioScore + paceScore) / 2)

    const conversation: ConversationMetrics = {
      talkRatio: avgTalkRatio,
      pace: avgPace,
      warning: avgPace > 160 ? 'Too fast' : undefined,
      averageScore: conversationAverageScore
    }

    const closing: ClosingMetrics = {
      success: closingSuccessRate,
      attempts: `${totalClosingSuccess}/${totalClosingAttempts}`,
      status: closingSuccessRate > 0 ? 'SUCCESS' : 'MISSED',
      averageScore: closingSuccessRate
    }
    
    const overall: OverallMetrics = {
      score: avgOverallScore,
      grade,
      percentile: calculatePercentile(avgOverallScore),
      averageScore: avgOverallScore
    }

    // Use the most recent session's ID and created_at for reference
    const mostRecentSession = sessions[0]

    const session: SessionPerformance = {
      id: mostRecentSession.id,
      overallScore: avgOverallScore,
      grade,
      agentName: mostCommonAgent,
      createdAt: mostRecentSession.created_at,
      durationSeconds: avgDurationSeconds,
      keyIssues: topIssues,
      voice,
      conversation,
      closing,
      overall
    }

    return NextResponse.json({
      userName,
      currentDateTime: new Date().toISOString(),
      session
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


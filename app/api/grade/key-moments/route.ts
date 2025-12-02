import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

export const maxDuration = 30 // 30 seconds max for key moments
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // Reduced from 20s to 15s for faster failure detection
  maxRetries: 1 // Reduced from 2 to 1 to prevent long retry delays
})

interface KeyMoment {
  id: string
  type: 'objection' | 'close_attempt' | 'rapport' | 'discovery' | 'safety'
  startIndex: number
  endIndex: number
  transcript: string
  timestamp: string
  importance: number // 1-10
  outcome: 'success' | 'failure' | 'neutral'
  analysis?: {
    whatHappened: string
    whatWorked: string
    whatToImprove: string
    alternativeResponse: string
  }
}

interface ConversationSegment {
  type: 'objection_start' | 'close_attempt' | 'discovery' | 'rapport' | 'neutral'
  startIndex: number
  endIndex: number
  lines: any[]
  context: any[]
  importance?: number
}

// Smart moment detection using patterns + context
function identifyConversationSegments(transcript: any[]): ConversationSegment[] {
  const segments: ConversationSegment[] = []
  let currentSegment: ConversationSegment | null = null
  
  // Patterns that indicate segment boundaries
  const segmentTriggers = {
    objection_start: [
      /but|however|actually|problem is|thing is/i,
      /already have|too expensive|not interested/i,
      /can't afford|maybe later|not right now/i
    ],
    close_attempt: [
      // Original patterns
      /so what I can do|here's what I propose|let me offer/i,
      /if I could|would you be interested/i,
      /let's get you (started|scheduled)/i,
      /ready to (start|begin)/i,
      /can we schedule/i,
      // Hard closes - collecting information
      /what is your name|what's your name/i,
      /what is your phone|what's your phone/i,
      /what is your email|what's your email/i,
      /what is.*address|what's.*address/i,
      /anything else.*special notes/i,
      /are you using.*credit.*debit|credit or debit/i,
      /payment method|how would you like to pay/i,
      // Urgency closes
      /best time to (service|treat)/i,
      /bug activity.*going to get worse/i,
      /never have a bug issue/i,
      // Option closes
      /do you want.*front yard.*back yard|front yard or back yard/i,
      /would you like.*park/i,
      /does morning.*evening work|morning or evening/i,
      /which.*would you/i,
      // Responsibility closes
      /can you make sure.*dog|put your dog away/i,
      /can you open the garage/i,
      /gate.*unlocked/i,
      // Sincerity/Pride closes
      /let me prove.*love|give me.*honest try/i,
      /give me a shot|give me a chance/i,
      /take.*pride in my work/i,
      // Bandwagon closes
      /if I can get you done.*neighbor|your neighbor.*how does that sound/i,
      // Light bulb closes
      /you're going to be here.*today|you'll be here.*right/i
    ],
    discovery: [
      /tell me about|how long have you|what kind of/i,
      /have you noticed|when did you last/i,
      /what's your experience|how often/i
    ],
    rapport: [
      /that's great|I understand|absolutely|I hear you/i,
      /same thing happened to me|I totally get it/i,
      /that makes sense|I appreciate/i
    ]
  }
  
  function detectSegmentType(line: any): ConversationSegment['type'] | null {
    const text = (line.text || line.message || '').toLowerCase()
    
    for (const pattern of segmentTriggers.objection_start) {
      if (pattern.test(text)) return 'objection_start'
    }
    for (const pattern of segmentTriggers.close_attempt) {
      if (pattern.test(text)) return 'close_attempt'
    }
    for (const pattern of segmentTriggers.discovery) {
      if (pattern.test(text)) return 'discovery'
    }
    for (const pattern of segmentTriggers.rapport) {
      if (pattern.test(text)) return 'rapport'
    }
    
    return null
  }
  
  function detectTopicChange(line: any, currentSegment: ConversationSegment): boolean {
    // Simple heuristic: if speaker changes and topic seems different
    if (currentSegment.lines.length === 0) return false
    
    const lastLine = currentSegment.lines[currentSegment.lines.length - 1]
    const currentSpeaker = line.speaker || ''
    const lastSpeaker = lastLine.speaker || ''
    
    // Topic change if speaker changes and we've had enough lines
    if (currentSpeaker !== lastSpeaker && currentSegment.lines.length > 3) {
      return true
    }
    
    return false
  }
  
  // Group transcript into logical segments
  for (let i = 0; i < transcript.length; i++) {
    const line = transcript[i]
    const nextFewLines = transcript.slice(i, Math.min(i + 5, transcript.length))
    
    // Check if this starts a new segment
    const segmentType = detectSegmentType(line)
    
    if (segmentType) {
      if (currentSegment) {
        currentSegment.endIndex = i - 1
        segments.push(currentSegment)
      }
      currentSegment = {
        type: segmentType,
        startIndex: i,
        lines: [line],
        context: nextFewLines
      }
    } else if (currentSegment) {
      currentSegment.lines.push(line)
      
      // End segment if topic changes or after 10 lines
      if (currentSegment.lines.length > 10 || detectTopicChange(line, currentSegment)) {
        currentSegment.endIndex = i
        segments.push(currentSegment)
        currentSegment = null
      }
    } else {
      // Start neutral segment if we don't have one
      if (!currentSegment) {
        currentSegment = {
          type: 'neutral',
          startIndex: i,
          lines: [line],
          context: nextFewLines
        }
      } else {
        currentSegment.lines.push(line)
        if (currentSegment.lines.length > 10) {
          currentSegment.endIndex = i
          segments.push(currentSegment)
          currentSegment = null
        }
      }
    }
  }
  
  // Add final segment if exists
  if (currentSegment) {
    currentSegment.endIndex = transcript.length - 1
    segments.push(currentSegment)
  }
  
  return segments
}

// Score segment importance using heuristics
function scoreSegmentImportance(segments: ConversationSegment[]): ConversationSegment[] {
  return segments.map(segment => {
    let importance = 5 // Base importance
    
    // Objections are very important
    if (segment.type === 'objection_start') {
      importance = 9
    }
    // Close attempts are important
    else if (segment.type === 'close_attempt') {
      importance = 8
    }
    // Discovery is important
    else if (segment.type === 'discovery') {
      importance = 7
    }
    // Rapport is moderately important
    else if (segment.type === 'rapport') {
      importance = 6
    }
    
    // Adjust based on length (longer segments might be more important)
    if (segment.lines.length > 5) {
      importance += 1
    }
    
    // Adjust based on position (early and late segments are more important)
    const totalSegments = segments.length
    const segmentIndex = segments.indexOf(segment)
    const positionRatio = segmentIndex / totalSegments
    
    if (positionRatio < 0.2 || positionRatio > 0.8) {
      importance += 1 // Beginning or end of conversation
    }
    
    return {
      ...segment,
      importance: Math.min(10, Math.max(1, importance))
    }
  })
}

// Extract top N key moments
function extractKeyMoments(scoredSegments: ConversationSegment[], maxMoments: number = 10): KeyMoment[] {
  // Sort by importance
  const sortedSegments = [...scoredSegments].sort((a, b) => 
    (b.importance || 0) - (a.importance || 0)
  )
  
  // Take top segments and convert to key moments
  const topSegments = sortedSegments.slice(0, maxMoments)
  
  return topSegments.map((segment, index) => {
    const transcriptText = segment.lines
      .map(line => `${line.speaker || 'Unknown'}: ${line.text || line.message || ''}`)
      .join('\n')
    
    // Determine outcome based on segment type and context
    let outcome: 'success' | 'failure' | 'neutral' = 'neutral'
    if (segment.type === 'close_attempt') {
      // Check if there's a positive response after
      const nextSegment = scoredSegments[scoredSegments.indexOf(segment) + 1]
      if (nextSegment && nextSegment.lines.some((line: any) => 
        /yes|sure|okay|alright|sounds good/i.test(line.text || line.message || '')
      )) {
        outcome = 'success'
      } else {
        outcome = 'neutral'
      }
    } else if (segment.type === 'objection_start') {
      outcome = 'neutral' // Will be determined by analysis
    }
    
    return {
      id: `moment-${index + 1}`,
      type: segment.type === 'objection_start' ? 'objection' : 
            segment.type === 'close_attempt' ? 'close_attempt' :
            segment.type === 'discovery' ? 'discovery' :
            segment.type === 'rapport' ? 'rapport' : 'safety',
      startIndex: segment.startIndex,
      endIndex: segment.endIndex,
      transcript: transcriptText.slice(0, 500), // Limit length
      timestamp: segment.lines[0]?.timestamp || '',
      importance: segment.importance || 5,
      outcome
    }
  })
}

// Use GPT-4o-mini to analyze ONLY the key moments (much faster)
async function analyzeKeyMoments(moments: KeyMoment[]): Promise<KeyMoment[]> {
  if (moments.length === 0) return moments
  
  try {
    const prompt = `Analyze ${moments.length} key moments. Address rep with "you".

For each: what happened (1 sentence), what worked (1 sentence), what to improve (1 sentence), alternative (1 sentence).

Moments:
${moments.map((m, i) => `${i + 1}. ${m.type}: "${m.transcript.slice(0, 150)}" Outcome: ${m.outcome}`).join('\n')}

Return JSON:
{"moments": [{"whatHappened": "s", "whatWorked": "s", "whatToImprove": "s", "alternativeResponse": "s"}]}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Best model for quality
      messages: [
        { role: 'system', content: 'Sales coach. JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower for faster responses
      max_tokens: 1200 // Reduced for speed
    })
    
    const content = response.choices[0].message.content
    if (!content) {
      logger.warn('No content from OpenAI for key moments analysis')
      return moments
    }
    
    // Parse response - it might be wrapped in an object
    let analysisData: any[]
    try {
      const parsed = JSON.parse(content)
      // Handle both {moments: [...]} and [...] formats
      analysisData = Array.isArray(parsed) ? parsed : parsed.moments || parsed.analysis || []
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response', { content: content.substring(0, 200) })
      return moments
    }
    
    // Merge analysis into moments
    return moments.map((moment, index) => {
      const analysis = analysisData[index]
      if (analysis) {
        // Clean up any "the user" references and replace with "you"
        const cleanText = (text: string) => {
          if (!text) return text
          return text
            .replace(/\bthe user\b/gi, 'you')
            .replace(/\bthe rep\b/gi, 'you')
            .replace(/\bthe sales rep\b/gi, 'you')
            .replace(/\bthey\b/gi, 'you')
            .replace(/\btheir\b/gi, 'your')
        }
        
        return {
          ...moment,
          analysis: {
            whatHappened: cleanText(analysis.whatHappened || 'Analysis pending'),
            whatWorked: cleanText(analysis.whatWorked || ''),
            whatToImprove: cleanText(analysis.whatToImprove || 'Could be improved'),
            alternativeResponse: cleanText(analysis.alternativeResponse || ''),
            interestLevelChange: analysis.interestLevelChange || null
          }
        }
      }
      return moment
    })
  } catch (error: any) {
    logger.error('Error analyzing key moments with AI', error)
    // Return moments without analysis rather than failing
    return moments
  }
}

// Generate moment-based feedback
function generateMomentFeedback(moments: KeyMoment[]): {
  strengths: string[]
  improvements: string[]
  quickTips: string[]
} {
  const strengths: string[] = []
  const improvements: string[] = []
  const quickTips: string[] = []
  
  const successfulMoments = moments.filter(m => m.outcome === 'success')
  const failedMoments = moments.filter(m => m.outcome === 'failure')
  
  if (successfulMoments.length > 0) {
    strengths.push(`Successfully handled ${successfulMoments.length} key moment(s)`)
  }
  
  if (failedMoments.length > 0) {
    improvements.push(`Had difficulty with ${failedMoments.length} key moment(s)`)
  }
  
  const closeAttempts = moments.filter(m => m.type === 'close_attempt')
  if (closeAttempts.length >= 2) {
    strengths.push('Made multiple close attempts')
  } else if (closeAttempts.length === 0) {
    improvements.push('No close attempts detected')
  }
  
  const objections = moments.filter(m => m.type === 'objection')
  if (objections.length > 0) {
    quickTips.push(`Faced ${objections.length} objection(s) - review how they were handled`)
  }
  
  return { strengths, improvements, quickTips }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { sessionId, transcript, instantMetrics } = await req.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }
    
    const supabase = await createServiceSupabaseClient()
    
    // Fetch session if transcript not provided
    let sessionTranscript = transcript
    if (!sessionTranscript) {
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .select('full_transcript')
        .eq('id', sessionId)
        .single()
      
      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      
      sessionTranscript = session.full_transcript || []
    }
    
    if (!Array.isArray(sessionTranscript) || sessionTranscript.length === 0) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }
    
    // Step 1: Identify conversation segments
    const segments = identifyConversationSegments(sessionTranscript)
    
    // Step 2: Score each segment for importance
    const scoredSegments = scoreSegmentImportance(segments)
    
    // Step 3: Extract top 5 key moments (reduced for speed)
    const keyMoments = extractKeyMoments(scoredSegments, 5)
    
    // Step 4: Quick AI analysis on key moments ONLY
    const analyzedMoments = await analyzeKeyMoments(keyMoments)
    
    // Step 5: Generate moment-based feedback
    const feedback = generateMomentFeedback(analyzedMoments)
    
    // Step 6: Update database
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        key_moments: analyzedMoments,
        moment_analysis: {
          feedback,
          analyzedAt: new Date().toISOString()
        },
        grading_status: 'moments_complete',
        grading_version: '2.0'
      })
      .eq('id', sessionId)
    
    if (updateError) {
      logger.error('Error updating session with key moments', updateError)
      return NextResponse.json({ 
        error: 'Failed to save key moments',
        details: updateError.message || updateError.code || 'Unknown database error',
        hint: 'Make sure migration 085_add_new_grading_system.sql has been run'
      }, { status: 500 })
    }
    
    const timeElapsed = Date.now() - startTime
    logger.info('Key moments detected and analyzed', {
      sessionId,
      timeElapsed: `${timeElapsed}ms`,
      momentsCount: analyzedMoments.length
    })
    
    return NextResponse.json({ 
      keyMoments: analyzedMoments,
      feedback,
      status: 'moments_complete',
      timeElapsed 
    })
  } catch (error: any) {
    logger.error('Error detecting key moments', error)
    return NextResponse.json(
      { error: error.message || 'Failed to detect key moments' },
      { status: 500 }
    )
  }
}


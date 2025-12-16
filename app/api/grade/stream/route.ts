import { NextRequest } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

export const dynamic = "force-dynamic";
// Increased timeout for reliable grading (Vercel Pro allows up to 300s)
export const maxDuration = 60 // 60 seconds - allows for longer sessions

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout - faster failure detection
  maxRetries: 2 // Increased retries for reliability
})

// Helper functions to pre-compute objective metrics
function detectFillerWords(text: string): number {
  // Only count: um, uh, uhh, erm, err, hmm (NOT "like")
  const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm)\b/gi
  const matches = text.match(fillerPattern)
  return matches ? matches.length : 0
}

function calculateWPM(transcript: any[], durationSeconds: number): number {
  if (!transcript || transcript.length === 0 || durationSeconds <= 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  const totalWords = repEntries.reduce((sum: number, entry: any) => {
    const text = entry.text || entry.message || ''
    return sum + text.split(/\s+/).filter((word: string) => word.length > 0).length
  }, 0)
  
  const durationMinutes = durationSeconds / 60
  return Math.round(totalWords / durationMinutes)
}

function calculateQuestionRatio(transcript: any[]): number {
  if (!transcript || transcript.length === 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  if (repEntries.length === 0) return 0
  
  const questions = repEntries.filter((entry: any) => {
    const text = entry.text || entry.message || ''
    return text.trim().endsWith('?')
  }).length
  
  return Math.round((questions / repEntries.length) * 100)
}

// Helper to repair incomplete JSON
function repairIncompleteJSON(jsonString: string): string {
  let repaired = jsonString.trim()
  
  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
  
  // Check if we're in an unterminated string
  let inString = false
  let escapeNext = false
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
    }
  }
  
  // If we're still in a string, close it
  if (inString) {
    // Check if the last character is a quote (shouldn't happen, but be safe)
    const lastChar = repaired[repaired.length - 1]
    if (lastChar !== '"') {
      // Add closing quote
      repaired += '"'
    }
  }
  
  // Count braces and brackets (only outside strings)
  let openBraces = 0
  let closeBraces = 0
  let openBrackets = 0
  let closeBrackets = 0
  inString = false
  escapeNext = false
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === '{') openBraces++
      if (char === '}') closeBraces++
      if (char === '[') openBrackets++
      if (char === ']') closeBrackets++
    }
  }
  
  // Remove trailing comma if present
  repaired = repaired.replace(/,(\s*)$/, '$1')
  
  // Close unclosed arrays
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']'
  }
  
  // Close unclosed objects
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}'
  }
  
  return repaired
}

// Helper to extract sections from streaming JSON
function extractCompletedSections(partialJson: string) {
  const sections: any = {}
  
  try {
    // Try to parse what we have so far
    const parsed = JSON.parse(partialJson + '}')
    return parsed
  } catch {
    // If full parse fails, try to extract completed fields
    const patterns = [
      { key: 'session_summary', regex: /"session_summary":\s*({[^}]+})/ },
      { key: 'scores', regex: /"scores":\s*({[^}]+})/ },
      { key: 'feedback', regex: /"feedback":\s*({[\s\S]*?"specific_tips":\s*\[[^\]]*\]})/ },
      { key: 'objection_analysis', regex: /"objection_analysis":\s*({[\s\S]*?"objections":\s*\[[^\]]*\]})/ },
    ]
    
    for (const pattern of patterns) {
      const match = partialJson.match(pattern.regex)
      if (match) {
        try {
          sections[pattern.key] = JSON.parse(match[1])
        } catch {
          // Incomplete section, skip
        }
      }
    }
  }
  
  return sections
}

export async function POST(request: NextRequest) {
  // Legacy streaming endpoint - redirects to new orchestration system
  // Streaming will be handled by progressive status updates in the new system
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 })
    }

    logger.info('Legacy /api/grade/stream called - redirecting to simple grading', { sessionId })
    
    // Call the simple grading endpoint internally
    const orchestrationResponse = await fetch(`${request.nextUrl.origin}/api/grade/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })
    
    if (orchestrationResponse.ok) {
      const data = await orchestrationResponse.json()
      
      // Return streaming-like response with phases
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Send instant phase
          if (data.phases?.instant) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: 'instant', ...data.phases.instant })}\n\n`))
          }
          
          // Send key moments phase
          if (data.phases?.keyMoments) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: 'keyMoments', ...data.phases.keyMoments })}\n\n`))
          }
          
          // Send deep analysis phase
          if (data.phases?.deepAnalysis) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: 'deepAnalysis', ...data.phases.deepAnalysis })}\n\n`))
          }
          
          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: 'complete', ...data })}\n\n`))
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      const error = await orchestrationResponse.text()
      logger.error('Orchestration failed from legacy streaming endpoint', { sessionId, error })
      return new Response('Grading failed - please use /api/grade/simple directly', { status: 500 })
    }
  } catch (error: any) {
    logger.error('Error in legacy streaming endpoint', error)
    return new Response(error.message || 'Failed to grade session', { status: 500 })
  }
}

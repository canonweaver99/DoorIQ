/**
 * Coach Agent Implementation
 * Uses OpenAI to generate coaching suggestions based on script content
 */

import OpenAI from 'openai'
import { ScriptSection } from './rag-retrieval'
import { CONSOLIDATED_COACH_PROMPT } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CoachSuggestion {
  suggestedLine: string
  explanation?: string
  confidence: 'high' | 'medium' | 'low'
  intent?: string
}

export interface CoachState {
  suggestedLines: string[]
  addressedObjections: string[]
  askedQuestions: string[]
}

export interface CoachAgentContext {
  homeownerText: string
  repLastStatement?: string
  conversationHistory?: Array<{ speaker: string; text: string }>
  scriptSections: ScriptSection[]
  companyName?: string
  repName?: string
  coachState?: CoachState
}

const INTENT_FALLBACKS = {
  price_objection: "Ask them what their budget range is",
  time_objection: "Ask when would work better for them",
  brush_off: "Acknowledge their concern and ask one discovery question about their situation",
  skepticism: "Ask what would make them feel comfortable moving forward",
  stall: "Ask what specifically they need to think about",
  neutral: "Ask about their current situation or biggest concern"
}

/**
 * Verify that suggested line exists in script sections
 * Returns actual script text if found, or closest match
 */
function verifyScriptLine(
  suggestion: string,
  scriptSections: ScriptSection[]
): { verified: string; isExact: boolean } {
  const suggestionLower = suggestion.toLowerCase().trim()
  
  // Check for exact match first
  for (const section of scriptSections) {
    const sectionLower = section.text.toLowerCase()
    if (sectionLower.includes(suggestionLower) || suggestionLower.includes(sectionLower.substring(0, 100))) {
      // Find the actual line in the section
      const lines = section.text.split('\n').filter(line => line.trim().length > 0)
      for (const line of lines) {
        const lineLower = line.toLowerCase().trim()
        // Check if suggestion matches this line (allowing for minor variations)
        if (lineLower === suggestionLower || 
            lineLower.includes(suggestionLower.substring(0, Math.min(30, suggestionLower.length))) ||
            suggestionLower.includes(lineLower.substring(0, Math.min(30, lineLower.length)))) {
          return { verified: line.trim(), isExact: true }
        }
      }
      // If no exact line match, return first substantial line from section
      const firstSubstantialLine = lines.find(line => line.trim().length > 20)
      if (firstSubstantialLine) {
        return { verified: firstSubstantialLine.trim(), isExact: false }
      }
    }
  }
  
  // If no match found, find closest match using simple substring matching
  let bestMatch: string | null = null
  let bestScore = 0
  
  for (const section of scriptSections) {
    const lines = section.text.split('\n').filter(line => line.trim().length > 0)
    for (const line of lines) {
      const lineLower = line.toLowerCase().trim()
      // Calculate simple similarity score
      const commonWords = suggestionLower.split(/\s+/).filter(word => 
        word.length > 3 && lineLower.includes(word)
      ).length
      const score = commonWords / Math.max(suggestionLower.split(/\s+/).length, 1)
      
      if (score > bestScore && score > 0.3) {
        bestScore = score
        bestMatch = line.trim()
      }
    }
  }
  
  if (bestMatch) {
    return { verified: bestMatch, isExact: false }
  }
  
  // Fallback: return first substantial line from first section
  const firstSection = scriptSections[0]
  if (firstSection) {
    const lines = firstSection.text.split('\n').filter(line => line.trim().length > 0)
    const firstSubstantialLine = lines.find(line => line.trim().length > 20)
    if (firstSubstantialLine) {
      return { verified: firstSubstantialLine.trim(), isExact: false }
    }
  }
  
  return { verified: suggestion, isExact: false }
}

/**
 * Normalize a line for comparison (lowercase, remove punctuation, first 50 chars)
 */
function normalizeLine(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 50)
}

/**
 * Check if a line has already been suggested
 */
function hasBeenSuggested(line: string, coachState?: CoachState): boolean {
  if (!coachState || !coachState.suggestedLines) return false
  
  const normalized = normalizeLine(line)
  return coachState.suggestedLines.some(suggested => 
    normalizeLine(suggested) === normalized
  )
}

/**
 * Generate a coaching suggestion using OpenAI - optimized for speed
 */
export async function generateSuggestion(
  context: CoachAgentContext
): Promise<CoachSuggestion> {
  try {
    // Format script sections for prompt - truncate long sections for speed
    const scriptSectionsText = context.scriptSections
      .map((section) => {
        // Limit each section to 300 chars to reduce token usage
        const text = section.text.length > 300 
          ? section.text.substring(0, 300) + '...' 
          : section.text
        return text
      })
      .join('\n\n---\n\n')
    
    const companyName = context.companyName ? `\nCompany name: ${context.companyName}` : ''
    const repName = context.repName ? `\nRep's name: ${context.repName}` : ''
    const repContext = context.repLastStatement ? `\nRep just said: "${context.repLastStatement}"` : ''
    
    // Format recent conversation history (last 8 exchanges) to prevent context loss
    let conversationHistoryText = ''
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-8) // Last 8 exchanges
      conversationHistoryText = `\n\nRecent conversation:\n${recentHistory.map((entry, idx) => {
        const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'Rep' : 'Homeowner'
        return `${speaker}: ${entry.text}`
      }).join('\n')}`
    }
    
    // Check what's already been suggested to avoid repetition
    const alreadySuggested = context.coachState?.suggestedLines || []
    const alreadySuggestedText = alreadySuggested.length > 0
      ? `\n\nIMPORTANT: Do NOT suggest these lines again:\n${alreadySuggested.slice(-5).join('\n')}`
      : ''
    
    const userPrompt = `Homeowner said: "${context.homeownerText}"

1. What objection/intent is this? (price_objection, time_objection, skepticism, interest, brush_off, neutral)
2. Suggest a SHORT, CASUAL response (1-2 sentences max) from the script that handles this well.
3. IMPORTANT: Do NOT suggest questions that have already been asked in the conversation history below.
4. CRITICAL: If this is early in the conversation (first 4 turns) and no discovery questions have been asked, suggest a discovery question about their situation, NOT a pitch or explanation of your service.

Relevant script sections:
${scriptSectionsText}${companyName}${repName}${repContext}${conversationHistoryText}${alreadySuggestedText}

Return JSON:
{
  "intent": "price_objection|time_objection|skepticism|interest|brush_off|neutral",
  "suggestedLine": "the response from script",
  "confidence": "high|medium|low"
}`
    
    // Call OpenAI with optimized settings for speed
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CONSOLIDATED_COACH_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    // Parse JSON response
    const parsed = JSON.parse(content)
    
    // Get the suggested line
    let suggestedLine = parsed.suggestedLine || ''
    const intent = parsed.intent || 'neutral'
    
    // Verify the suggestion exists in script sections
    const verification = verifyScriptLine(suggestedLine, context.scriptSections)
    suggestedLine = verification.verified
    
    // Check if this line has already been suggested
    if (hasBeenSuggested(suggestedLine, context.coachState)) {
      // Use intent-specific fallback instead
      const fallback = INTENT_FALLBACKS[intent as keyof typeof INTENT_FALLBACKS] || INTENT_FALLBACKS.neutral
      suggestedLine = fallback
    }
    
    // Replace placeholders
    suggestedLine = replacePlaceholders(suggestedLine, context.companyName, context.repName || '')
    suggestedLine = suggestedLine.replace(/—/g, '-').replace(/–/g, '-')
    
    // Adjust confidence if not exact match
    let confidence = parsed.confidence || 'medium'
    if (!verification.isExact && confidence === 'high') {
      confidence = 'medium'
    }
    
    return {
      suggestedLine,
      explanation: parsed.explanation,
      confidence: confidence as 'high' | 'medium' | 'low',
      intent
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    // Use intent-specific fallback if we can determine intent
    const intent = classifyIntentFromText(context.homeownerText)
    const fallback = INTENT_FALLBACKS[intent as keyof typeof INTENT_FALLBACKS] || INTENT_FALLBACKS.neutral
    
    return {
      suggestedLine: fallback,
      explanation: 'Unable to generate suggestion at this time.',
      confidence: 'low',
      intent
    }
  }
}

/**
 * Simple intent classification from homeowner text (fallback)
 */
function classifyIntentFromText(text: string): string {
  const lower = text.toLowerCase()
  if (lower.match(/price|cost|expensive|afford|budget|how much/)) return 'price_objection'
  if (lower.match(/busy|later|think about|not right now|maybe later/)) return 'time_objection'
  if (lower.match(/scam|trust|believe|prove|doubt|skeptical/)) return 'skepticism'
  if (lower.match(/not interested|no thanks|not today|go away/)) return 'brush_off'
  if (lower.match(/think about|talk to|discuss|decide|consider/)) return 'stall'
  if (lower.match(/tell me more|interested|sounds good|that's interesting/)) return 'interest'
  return 'neutral'
}

/**
 * Replace placeholders in suggested line with actual values
 */
function replacePlaceholders(
  line: string,
  companyName: string | undefined,
  repName: string
): string {
  let result = line

  // Replace [COMPANY NAME] or [COMPANY_NAME]
  if (companyName) {
    result = result.replace(/\[COMPANY NAME\]/gi, companyName)
    result = result.replace(/\[COMPANY_NAME\]/gi, companyName)
  }

  // Replace [YOUR NAME] or [YOUR_NAME] or [REP NAME]
  if (repName) {
    result = result.replace(/\[YOUR NAME\]/gi, repName)
    result = result.replace(/\[YOUR_NAME\]/gi, repName)
    result = result.replace(/\[REP NAME\]/gi, repName)
    result = result.replace(/\[REP_NAME\]/gi, repName)
  }

  // Remove any remaining undefined values
  result = result.replace(/\s*undefined\s*/gi, ' ').trim()
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ')

  return result
}

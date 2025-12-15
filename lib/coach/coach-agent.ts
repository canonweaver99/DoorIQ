/**
 * Coach Agent Implementation
 * Uses OpenAI to generate coaching suggestions based on script content
 */

import OpenAI from 'openai'
import { ScriptSection } from './rag-retrieval'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CoachSuggestion {
  suggestedLine: string
  explanation?: string
  confidence: 'high' | 'medium' | 'low'
  intent?: string
}

export interface CoachAgentContext {
  homeownerText: string
  repLastStatement?: string
  conversationHistory?: Array<{ speaker: string; text: string }>
  scriptSections: ScriptSection[]
  companyName?: string
  repName?: string
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
    
    // Build prompt with few-shot examples
    const systemPrompt = `You're a friend giving casual, quick advice during a practice session. Keep responses SHORT (1-2 sentences max, often just a phrase). Sound relaxed and friendly.

Examples:
Homeowner: "I'm not interested"
You: "Try: 'I hear you - most of our best customers said the same thing at first. Mind if I ask what you're using now?'"

Homeowner: "How much does it cost?"
You: "Try: 'Great question! Before I throw numbers at you, mind if I ask - are you dealing with [specific pest]?'"

Homeowner: "I need to think about it"
You: "Try: 'Totally get it. Quick question - what specifically do you want to think over? Price, timing, or something else?'"`
    
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
    
    const userPrompt = `Homeowner said: "${context.homeownerText}"

1. What objection/intent is this? (price, time, skepticism, interest, etc)
2. Suggest a SHORT, CASUAL response (1-2 sentences max) from the script that handles this well.
3. IMPORTANT: Do NOT suggest questions that have already been asked in the conversation history below.

Relevant script sections:
${scriptSectionsText}${companyName}${repName}${repContext}${conversationHistoryText}

Replace [COMPANY NAME] with the company name and [YOUR NAME] or [REP NAME] with the rep's name if provided.

Return JSON:
{
  "intent": "price_objection|time_objection|skepticism|interest|neutral",
  "suggestedLine": "the response with placeholders replaced",
  "confidence": "high|medium|low"
}`
    
    // Call OpenAI with optimized settings for speed
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
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
    
    // Get the suggested line and replace placeholders
    let suggestedLine = parsed.suggestedLine || 'Continue the conversation naturally.'
    suggestedLine = replacePlaceholders(suggestedLine, context.companyName, context.repName || '')
    suggestedLine = suggestedLine.replace(/—/g, '-').replace(/–/g, '-')
    
    return {
      suggestedLine,
      explanation: parsed.explanation,
      confidence: parsed.confidence || 'medium',
      intent: parsed.intent
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    return {
      suggestedLine: 'Continue the conversation naturally based on the script.',
      explanation: 'Unable to generate suggestion at this time.',
      confidence: 'low'
    }
  }
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

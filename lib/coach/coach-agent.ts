/**
 * Coach Agent Implementation
 * Takes homeowner statement and conversation history → suggests natural, human response
 */

import OpenAI from 'openai'
import { CONSOLIDATED_COACH_PROMPT } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CoachSuggestion {
  suggestedLine: string
}

export interface CoachAgentContext {
  homeownerText: string
  repLastStatement?: string
  conversationHistory?: Array<{ speaker: string; text: string }>
  companyName?: string
  repName?: string
}

/**
 * Clean up response formatting
 */
function humanizeResponse(line: string): string {
  let result = line.trim()
  
  // Remove exclamation points (too eager)
  result = result.replace(/!/g, '.')
  
  // Fix double periods
  result = result.replace(/\.\./g, '.')
  
  // Shorten if too long (real people don't monologue)
  const sentences = result.split(/(?<=[.?])\s+/)
  if (sentences.length > 3) {
    result = sentences.slice(0, 2).join(' ')
  }
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim()
  
  return result
}

/**
 * Replace placeholders in suggested line with actual values
 */
function replacePlaceholders(
  line: string,
  companyName: string | undefined,
  repName: string | undefined
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
  
  // Clean up extra spaces and normalize dashes
  result = result.replace(/\s+/g, ' ')
  result = result.replace(/—/g, '-').replace(/–/g, '-')

  return result
}

/**
 * Generate a coaching suggestion using OpenAI
 */
export async function generateSuggestion(
  context: CoachAgentContext
): Promise<CoachSuggestion> {
  try {
    // Format conversation history
    let conversationHistoryText = ''
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-10) // Last 10 exchanges
      conversationHistoryText = `\n\nConversation history:\n${recentHistory.map((entry) => {
        const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'Rep' : 'Homeowner'
        return `${speaker}: ${entry.text}`
      }).join('\n')}`
    }
    
    // Build context information
    const contextInfo = []
    if (context.companyName) {
      contextInfo.push(`Company name: ${context.companyName}`)
    }
    if (context.repName) {
      contextInfo.push(`Sales rep's name: ${context.repName}`)
    }
    if (context.repLastStatement) {
      contextInfo.push(`Rep just said: "${context.repLastStatement}"`)
    }
    const contextText = contextInfo.length > 0 ? `\n\nContext:\n${contextInfo.join('\n')}` : ''
    
    // User prompt - focuses on live conversation context only
    const userPrompt = `The homeowner just said: "${context.homeownerText}"

Think: How would you respond if this was your neighbor and you genuinely wanted to help them?

${contextText}${conversationHistoryText}

Respond with 1-2 short sentences max. Sound like a real person, not a salesperson.

Return JSON:
{
  "suggestedLine": "your casual, human response"
}`
    
    // Call OpenAI with increased temperature for more natural variation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CONSOLIDATED_COACH_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Increased from 0.3 for more natural variation
      max_tokens: 100,  // Reduced to force brevity
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    // Parse JSON response
    const parsed = JSON.parse(content)
    let suggestedLine = parsed.suggestedLine || ''
    
    // Clean up response formatting
    suggestedLine = humanizeResponse(suggestedLine)
    
    // Replace placeholders
    suggestedLine = replacePlaceholders(suggestedLine, context.companyName, context.repName)
    
    return {
      suggestedLine
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    return {
      suggestedLine: 'Continue the conversation naturally.'
    }
  }
}

/**
 * Coach Agent Implementation
 * Simple version: Takes homeowner statement, conversation history, and script → suggests next line
 */

import OpenAI from 'openai'
import { ScriptSection } from './rag-retrieval'
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
  scriptSections: ScriptSection[]
  companyName?: string
  repName?: string
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
    // Format script sections for prompt
    const scriptSectionsText = context.scriptSections
      .map((section) => section.text)
      .join('\n\n---\n\n')
    
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
    
    const userPrompt = `Homeowner said: "${context.homeownerText}"

Suggest the next line for the sales rep to say based on the sales script below.${contextText}${conversationHistoryText}

Sales script:
${scriptSectionsText}

Return JSON:
{
  "suggestedLine": "the next line to say from the script"
}`
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CONSOLIDATED_COACH_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    // Parse JSON response
    const parsed = JSON.parse(content)
    let suggestedLine = parsed.suggestedLine || ''
    
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

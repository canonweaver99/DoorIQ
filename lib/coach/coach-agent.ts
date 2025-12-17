/**
 * Coach Agent Implementation
 * Takes homeowner statement, conversation history, and script → suggests natural, human response
 */

import OpenAI from 'openai'
import { ScriptSection } from './rag-retrieval'
import { buildCoachPrompt } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CoachSuggestion {
  suggestedLine: string
  reasoning?: string
  phase?: 'opening' | 'discovery' | 'value' | 'objection' | 'closing'
}

export interface CoachAgentContext {
  homeownerText: string
  repLastStatement?: string
  conversationHistory?: Array<{ speaker: string; text: string }>
  scriptSections: ScriptSection[]
  companyName?: string
  repName?: string
  specialization?: string // Optional specialization paragraphs
}

/**
 * Banned phrases that sound scripted/salesy
 */
const BANNED_PHRASES = [
  // Openers
  "i appreciate your time",
  "quick question though",
  "i'll only take a minute",
  "i'm not here to sell you anything",
  "don't worry, i'm not trying to",
  
  // Transitions
  "the reason i stopped by",
  "what brings me to your door",
  "what i wanted to share with you",
  "the great news is",
  "here's the thing",
  "what sets us apart",
  
  // Validation (over-eager)
  "absolutely!",
  "definitely!",
  "perfect!",
  "that's a great question",
  "i totally understand",
  "i completely understand",
  "that's totally fair",
  
  // Pressure
  "just so you know",
  "i should mention",
  "the only thing is",
  "what i can do for you",
  "if i could show you a way",
  "would it make sense if",
  
  // Closing
  "does that sound fair",
  "how does that sound",
  "would that work for you",
  "all i need from you is",
  "the next step would be"
]

/**
 * Filter out scripted phrases and clean up response to sound more human
 */
function humanizeResponse(line: string): string {
  let result = line.trim()
  
  // Check for banned phrases and log warning
  const lowerResult = result.toLowerCase()
  for (const phrase of BANNED_PHRASES) {
    if (lowerResult.includes(phrase)) {
      console.warn(`⚠️ Banned phrase detected: "${phrase}" in response: "${result}"`)
      // Note: We'll let the AI regenerate if needed, but this helps catch issues
    }
  }
  
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
    
    // User prompt - focuses on real-time coaching
    const userPrompt = `The homeowner just said: "${context.homeownerText}"

${contextText}${conversationHistoryText}

Script for reference (adapt, don't copy):
${scriptSectionsText}

Based on the conversation so far, what should the rep say RIGHT NOW? Keep it natural, short, and perfectly timed for this moment in the conversation.

Return JSON:
{
  "suggestedResponse": "The actual line to say",
  "reasoning": "Brief explanation of why (1 sentence)",
  "phase": "opening|discovery|value|objection|closing"
}`
    
    // Build system prompt with specialization if provided
    const systemPrompt = buildCoachPrompt(context.specialization)
    
    // Call OpenAI with increased temperature for more natural variation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
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
    
    // Handle both new format (suggestedResponse) and old format (suggestedLine) for compatibility
    let suggestedLine = parsed.suggestedResponse || parsed.suggestedLine || ''
    const reasoning = parsed.reasoning
    const phase = parsed.phase
    
    // Humanize the response (remove scripted phrases, clean up)
    suggestedLine = humanizeResponse(suggestedLine)
    
    // Replace placeholders
    suggestedLine = replacePlaceholders(suggestedLine, context.companyName, context.repName)
    
    // Final check: if still contains banned phrases after humanization, use fallback
    const lowerLine = suggestedLine.toLowerCase()
    const containsBanned = BANNED_PHRASES.some(phrase => lowerLine.includes(phrase))
    
    if (containsBanned) {
      console.warn(`⚠️ Banned phrase still present after humanization. Using fallback.`)
      suggestedLine = 'Continue the conversation naturally.'
    }
    
    return {
      suggestedLine,
      ...(reasoning && { reasoning }),
      ...(phase && { phase })
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    return {
      suggestedLine: 'Continue the conversation naturally.'
    }
  }
}

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
 * Generate a contextual fallback suggestion based on homeowner's text
 * This is faster than a full OpenAI call and provides better context
 */
function generateContextualFallback(
  homeownerText: string,
  conversationHistory?: Array<{ speaker: string; text: string }>
): string {
  const lowerText = homeownerText.toLowerCase()
  
  // Pattern-based contextual responses
  if (lowerText.includes('not interested') || lowerText.includes('not looking') || lowerText.includes('not today')) {
    return 'Gotcha. What made you say that?'
  }
  
  if (lowerText.includes('already have') || lowerText.includes('already got') || lowerText.includes('already using')) {
    return 'Oh nice. How long you been with them?'
  }
  
  if (lowerText.includes('too expensive') || lowerText.includes('cost') || lowerText.includes('price') || lowerText.includes('money')) {
    return 'Fair. What are you paying now?'
  }
  
  if (lowerText.includes('think about it') || lowerText.includes('let me think')) {
    return 'Sure. What specifically are you thinking about?'
  }
  
  if (lowerText.includes('spouse') || lowerText.includes('wife') || lowerText.includes('husband') || lowerText.includes('partner')) {
    return 'She home? Happy to explain it to both of you.'
  }
  
  if (lowerText.includes('busy') || lowerText.includes('not a good time') || lowerText.includes('later')) {
    return 'No worries. When would be better?'
  }
  
  if (lowerText.includes('yes') || lowerText.includes('sure') || lowerText.includes('okay') || lowerText.includes('ok')) {
    return 'Great. When can we get started?'
  }
  
  if (lowerText.includes('no') || lowerText.includes('nah') || lowerText.includes('nope')) {
    return 'Fair enough. What changed your mind?'
  }
  
  if (lowerText.includes('maybe') || lowerText.includes('might')) {
    return 'What would help you decide?'
  }
  
  if (lowerText.includes('how much') || lowerText.includes('what does it cost')) {
    return 'Depends on your place. Mind if I take a quick look?'
  }
  
  // If homeowner asked a question, acknowledge and respond
  if (homeownerText.includes('?')) {
    return 'Good question. Let me explain.'
  }
  
  // If they made a statement, acknowledge and dig deeper
  if (conversationHistory && conversationHistory.length > 0) {
    return 'Makes sense. Tell me more about that.'
  }
  
  // Default contextual response
  return 'Gotcha. What do you think?'
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
    
    // Format conversation history - reduced to 5 exchanges for speed
    let conversationHistoryText = ''
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-5) // Last 5 exchanges only
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
    
    // Call OpenAI - optimized for speed while maintaining quality
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.6, // Slightly lower for faster, more deterministic responses
      max_tokens: 60,   // Reduced for speed (suggestions should be 1-2 sentences)
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
    
    // Final check: if still contains banned phrases after humanization, use contextual fallback
    const lowerLine = suggestedLine.toLowerCase()
    const containsBanned = BANNED_PHRASES.some(phrase => lowerLine.includes(phrase))
    
    if (containsBanned || !suggestedLine || suggestedLine.trim().length === 0) {
      console.warn(`⚠️ Banned phrase detected or empty response. Using contextual fallback.`)
      suggestedLine = generateContextualFallback(context.homeownerText, context.conversationHistory)
    }
    
    return {
      suggestedLine,
      ...(reasoning && { reasoning }),
      ...(phase && { phase })
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    // Use contextual fallback instead of generic message
    return {
      suggestedLine: generateContextualFallback(context.homeownerText, context.conversationHistory)
    }
  }
}

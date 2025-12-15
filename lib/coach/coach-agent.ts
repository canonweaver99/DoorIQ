/**
 * Coach Agent Implementation
 * Uses OpenAI to generate coaching suggestions based on script content
 */

import OpenAI from 'openai'
import { 
  COACH_SYSTEM_PROMPT, 
  ENHANCED_COACH_SYSTEM_PROMPT,
  ADAPTIVE_COACH_PROMPT,
  buildCoachPrompt,
  buildEnhancedCoachPrompt 
} from './prompts'
import { ScriptSection, ConversationAnalysis, analyzeConversation } from './rag-retrieval'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CoachSuggestion {
  suggestedLine: string
  explanation?: string
  reasoning?: string
  scriptSection?: string
  confidence: 'high' | 'medium' | 'low'
  tacticalNote?: string
  alternatives?: string[]
  isAdapted?: boolean
}

export interface CoachAgentContext {
  homeownerText: string
  transcript: Array<{ speaker: string; text: string; timestamp?: string }>
  scriptSections: ScriptSection[]
  conversationAnalysis?: ConversationAnalysis
}

/**
 * Generate a coaching suggestion using OpenAI with enhanced context awareness
 */
export async function generateSuggestion(
  context: CoachAgentContext
): Promise<CoachSuggestion> {
  try {
    // Analyze conversation if not provided
    const conversationAnalysis = context.conversationAnalysis || analyzeConversation(context.transcript)
    
    // Format conversation context from transcript
    const conversationContext = formatTranscript(context.transcript)
    const fullTranscript = formatTranscript(context.transcript)
    
    // Format script sections for prompt
    const scriptSectionsText = context.scriptSections
      .map((section, index) => `[Section ${index + 1}] (Score: ${section.score.toFixed(2)})\n${section.text}`)
      .join('\n\n---\n\n')
    
    // Use enhanced prompt if we have good script matches, otherwise use adaptive
    const hasGoodMatches = context.scriptSections.some(s => s.score > 2)
    const useEnhanced = hasGoodMatches && conversationAnalysis.turnCount > 0
    
    let userPrompt: string
    let systemPrompt: string
    
    if (useEnhanced) {
      systemPrompt = ENHANCED_COACH_SYSTEM_PROMPT
      userPrompt = buildEnhancedCoachPrompt(
        context.homeownerText,
        conversationAnalysis,
        fullTranscript,
        scriptSectionsText
      )
    } else if (context.scriptSections.length === 0 || !hasGoodMatches) {
      // Use adaptive prompt when no good script matches
      systemPrompt = ADAPTIVE_COACH_PROMPT
      userPrompt = `Homeowner said: "${context.homeownerText}"

Conversation context:
${conversationContext}

Available script sections (may not be perfect match):
${scriptSectionsText || 'No relevant script sections found.'}

Generate an adapted response based on script principles.`
    } else {
      // Fallback to standard prompt
      systemPrompt = COACH_SYSTEM_PROMPT
      userPrompt = buildCoachPrompt(
        context.homeownerText,
        conversationContext,
        scriptSectionsText
      )
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for real-time suggestions
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent, script-focused responses
      max_tokens: 400, // Increased for enhanced responses
      response_format: { type: 'json_object' }
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }
    
    // Parse JSON response
    const parsed = JSON.parse(content)
    
    // Validate and return suggestion
    return {
      suggestedLine: parsed.suggestedLine || parsed.line || 'No suggestion available',
      explanation: parsed.explanation,
      reasoning: parsed.reasoning,
      scriptSection: parsed.scriptSection,
      confidence: parsed.confidence || 'medium',
      tacticalNote: parsed.tacticalNote,
      alternatives: parsed.alternatives || [],
      isAdapted: !hasGoodMatches || parsed.isAdapted || false
    }
  } catch (error: any) {
    console.error('Error generating coach suggestion:', error)
    
    // Return fallback suggestion
    return {
      suggestedLine: 'Continue the conversation naturally based on the script.',
      explanation: 'Unable to generate suggestion at this time.',
      confidence: 'low',
      isAdapted: true
    }
  }
}

/**
 * Format transcript for context
 */
function formatTranscript(
  transcript: Array<{ speaker: string; text: string; timestamp?: string }>
): string {
  if (transcript.length === 0) {
    return 'No conversation history yet.'
  }
  
  // Get last 10 exchanges for context (to keep prompt size manageable)
  const recentTranscript = transcript.slice(-10)
  
  return recentTranscript
    .map((entry, index) => {
      const speaker = entry.speaker === 'user' || entry.speaker === 'rep' ? 'Rep' : 'Homeowner'
      return `[${index + 1}] ${speaker}: ${entry.text}`
    })
    .join('\n')
}

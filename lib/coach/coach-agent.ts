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
  companyInfo?: {
    company_name?: string
    company_mission?: string
    product_description?: string
    service_guarantees?: string
    company_values?: string[]
  } | null
  pricingInfo?: Array<{
    name?: string
    price?: number
    frequency?: string
    description?: string
  }> | null
  repName?: string
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
    
    // Format company info and pricing for prompt
    const companyInfoText = formatCompanyInfo(context.companyInfo, context.pricingInfo)
    
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
        scriptSectionsText,
        companyInfoText
      )
    } else if (context.scriptSections.length === 0 || !hasGoodMatches) {
      // Use adaptive prompt when no good script matches
      systemPrompt = ADAPTIVE_COACH_PROMPT
      userPrompt = `Homeowner said: "${context.homeownerText}"

Conversation context:
${conversationContext}

${companyInfoText ? `${companyInfoText}\n\n` : ''}Available script sections (may not be perfect match):
${scriptSectionsText || 'No relevant script sections found.'}

Generate an adapted response based on script principles.`
    } else {
      // Fallback to standard prompt
      systemPrompt = COACH_SYSTEM_PROMPT
      userPrompt = buildCoachPrompt(
        context.homeownerText,
        conversationContext,
        scriptSectionsText,
        companyInfoText
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
    
    // Get the suggested line and replace placeholders
    let suggestedLine = parsed.suggestedLine || parsed.line || 'No suggestion available'
    suggestedLine = replacePlaceholders(suggestedLine, context.companyInfo, context.repName || '')
    
    // Validate and return suggestion
    return {
      suggestedLine,
      explanation: parsed.explanation,
      reasoning: parsed.reasoning,
      scriptSection: parsed.scriptSection,
      confidence: parsed.confidence || 'medium',
      tacticalNote: parsed.tacticalNote,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.map((alt: string) => 
        replacePlaceholders(alt, context.companyInfo, context.repName || '')
      ) : [],
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
 * Format company info for prompt
 */
function formatCompanyInfo(
  companyInfo: CoachAgentContext['companyInfo'],
  pricingInfo: CoachAgentContext['pricingInfo']
): string {
  if (!companyInfo && (!pricingInfo || pricingInfo.length === 0)) {
    return ''
  }

  const parts: string[] = []
  
  if (companyInfo) {
    parts.push('🏢 COMPANY INFORMATION:')
    if (companyInfo.company_name) {
      parts.push(`- Company Name: ${companyInfo.company_name}`)
    }
    if (companyInfo.company_mission) {
      parts.push(`- Mission: ${companyInfo.company_mission}`)
    }
    if (companyInfo.product_description) {
      parts.push(`- Product/Service: ${companyInfo.product_description}`)
    }
    if (companyInfo.service_guarantees) {
      parts.push(`- Guarantees: ${companyInfo.service_guarantees}`)
    }
    if (companyInfo.company_values && companyInfo.company_values.length > 0) {
      parts.push(`- Values: ${companyInfo.company_values.join(', ')}`)
    }
  }

  if (pricingInfo && pricingInfo.length > 0) {
    parts.push('\n💰 PRICING INFORMATION:')
    pricingInfo.forEach((item, index) => {
      if (item.name || item.price) {
        const priceStr = item.price ? `$${item.price}` : 'Price not set'
        const freqStr = item.frequency ? ` (${item.frequency})` : ''
        const descStr = item.description ? ` - ${item.description}` : ''
        parts.push(`${index + 1}. ${item.name || 'Unnamed Plan'}: ${priceStr}${freqStr}${descStr}`)
      }
    })
  }

  return parts.join('\n')
}

/**
 * Replace placeholders in suggested line with actual values
 */
function replacePlaceholders(
  line: string,
  companyInfo: CoachAgentContext['companyInfo'],
  repName: string
): string {
  let result = line

  // Replace [COMPANY NAME] or [COMPANY_NAME]
  if (companyInfo?.company_name) {
    result = result.replace(/\[COMPANY NAME\]/gi, companyInfo.company_name)
    result = result.replace(/\[COMPANY_NAME\]/gi, companyInfo.company_name)
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

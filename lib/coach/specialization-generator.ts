/**
 * Specialization Generator Service
 * Generates AI-powered specialization paragraphs from manager's knowledge base content
 */

import OpenAI from 'openai'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface KnowledgeBaseContent {
  companyInfo: {
    company_name?: string
    company_mission?: string
    product_description?: string
    service_guarantees?: string
  }
  pricingInfo: Array<{
    name?: string
    price?: number
    frequency?: string
    description?: string
  }>
  scripts: Array<{
    file_name: string
    content: string
  }>
}

/**
 * Fetch all knowledge base content for a team
 */
async function fetchKnowledgeBaseContent(teamId: string): Promise<KnowledgeBaseContent> {
  const supabase = await createServiceSupabaseClient()

  // Fetch company info and pricing from team_grading_configs
  const { data: config } = await supabase
    .from('team_grading_configs')
    .select('company_name, company_mission, product_description, service_guarantees, pricing_info')
    .eq('team_id', teamId)
    .single()

  // Fetch coaching scripts from knowledge_base
  const { data: scripts } = await supabase
    .from('knowledge_base')
    .select('file_name, content')
    .eq('is_coaching_script', true)
    .eq('is_active', true)
    .contains('metadata', { team_id: teamId })

  return {
    companyInfo: {
      company_name: config?.company_name || undefined,
      company_mission: config?.company_mission || undefined,
      product_description: config?.product_description || undefined,
      service_guarantees: config?.service_guarantees || undefined
    },
    pricingInfo: (config?.pricing_info as any) || [],
    scripts: (scripts || []).map(s => ({
      file_name: s.file_name,
      content: s.content || ''
    }))
  }
}

/**
 * Format knowledge base content into a structured prompt for OpenAI
 */
function formatContentForPrompt(content: KnowledgeBaseContent): string {
  const sections: string[] = []

  // Company Information
  if (content.companyInfo.company_name || 
      content.companyInfo.company_mission || 
      content.companyInfo.product_description || 
      content.companyInfo.service_guarantees) {
    sections.push('## COMPANY INFORMATION')
    
    if (content.companyInfo.company_name) {
      sections.push(`Company Name: ${content.companyInfo.company_name}`)
    }
    if (content.companyInfo.company_mission) {
      sections.push(`Mission: ${content.companyInfo.company_mission}`)
    }
    if (content.companyInfo.product_description) {
      sections.push(`Products/Services: ${content.companyInfo.product_description}`)
    }
    if (content.companyInfo.service_guarantees) {
      sections.push(`Guarantees: ${content.companyInfo.service_guarantees}`)
    }
    sections.push('')
  }

  // Pricing Information
  if (content.pricingInfo && content.pricingInfo.length > 0) {
    sections.push('## PRICING INFORMATION')
    content.pricingInfo.forEach((item, index) => {
      if (item.name || item.price || item.frequency || item.description) {
        sections.push(`Service ${index + 1}:`)
        if (item.name) sections.push(`  Name: ${item.name}`)
        if (item.price) sections.push(`  Price: $${item.price}`)
        if (item.frequency) sections.push(`  Frequency: ${item.frequency}`)
        if (item.description) sections.push(`  Description: ${item.description}`)
        sections.push('')
      }
    })
  }

  // Scripts
  if (content.scripts && content.scripts.length > 0) {
    sections.push('## COACHING SCRIPTS')
    content.scripts.forEach((script, index) => {
      if (script.content && script.content.trim().length > 0) {
        // Truncate very long scripts to avoid token limits
        const maxScriptLength = 2000
        const scriptContent = script.content.length > maxScriptLength
          ? script.content.substring(0, maxScriptLength) + '... [truncated]'
          : script.content
        
        sections.push(`Script ${index + 1} (${script.file_name}):`)
        sections.push(scriptContent)
        sections.push('')
      }
    })
  }

  return sections.join('\n')
}

/**
 * Generate coach specialization paragraphs from knowledge base content
 */
export async function generateCoachSpecialization(teamId: string): Promise<string> {
  try {
    // Fetch all knowledge base content
    const content = await fetchKnowledgeBaseContent(teamId)

    // Check if there's any content to summarize
    const hasContent = 
      content.companyInfo.company_name ||
      content.companyInfo.company_mission ||
      content.companyInfo.product_description ||
      content.companyInfo.service_guarantees ||
      (content.pricingInfo && content.pricingInfo.length > 0) ||
      (content.scripts && content.scripts.length > 0)

    if (!hasContent) {
      return '' // Return empty string if no content - base prompt will be used
    }

    // Format content for prompt
    const formattedContent = formatContentForPrompt(content)

    // Generate specialization using OpenAI
    const prompt = `You are analyzing a door-to-door sales team's knowledge base content. Your task is to write 2-3 concise paragraphs that summarize the key information a sales coach should know to guide reps through perfect conversations.

The paragraphs should:
- Highlight unique company values, mission, and differentiators
- Summarize key product/service offerings and guarantees
- Extract core messaging and value propositions from scripts
- Focus on what makes this company/team special
- Be written in a way that helps the coach understand the company's approach to sales

Write in a clear, professional tone. These paragraphs will be injected into a coach agent's system prompt to help it provide specialized guidance.

Knowledge Base Content:
${formattedContent}

Generate 2-3 paragraphs (approximately 200-400 words total):`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing sales knowledge bases and creating concise, actionable summaries for AI coaching systems.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const specialization = response.choices[0]?.message?.content?.trim() || ''

    return specialization
  } catch (error: any) {
    console.error('Error generating coach specialization:', error)
    // Return empty string on error - base prompt will still work
    return ''
  }
}

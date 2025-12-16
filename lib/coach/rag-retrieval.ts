/**
 * RAG (Retrieval-Augmented Generation) Utility
 * Phase 1: Enhanced keyword-based search with intent classification and conversation stage awareness
 * Phase 2: Will add vector search when pgvector is available
 */

interface ScriptDocument {
  id: string
  content: string
  file_name: string
  chunks?: ScriptChunk[] // Cached chunks from JSONB column
}

export interface ScriptSection {
  text: string
  startIndex: number
  endIndex: number
  score: number
}

export interface Intent {
  type: 'price_objection' | 'time_objection' | 'competitor_mention' | 
        'skepticism' | 'interest' | 'question' | 'brush_off' | 'stall' | 'neutral';
  confidence: number;
  signals: string[];
}

export interface ConversationStage {
  stage: 'opener' | 'discovery' | 'presentation' | 'objection_handling' | 'closing';
  turnCount: number;
}

export interface ConversationAnalysis {
  stage: ConversationStage['stage'];
  turnCount: number;
  lastIntent: Intent;
  momentum: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
}

/**
 * Classify homeowner's intent from their statement
 */
export function classifyIntent(homeownerText: string): Intent {
  const text = homeownerText.toLowerCase();
  
  // Price objections
  if (text.match(/too expensive|too much|can't afford|price|cost|cheaper|budget|how much|pricing/)) {
    return {
      type: 'price_objection',
      confidence: 0.8,
      signals: ['price', 'cost', 'expensive', 'afford']
    };
  }
  
  // Time objections
  if (text.match(/busy|not a good time|later|call back|think about it|talk to|not right now|maybe later/)) {
    return {
      type: 'time_objection',
      confidence: 0.8,
      signals: ['busy', 'later', 'think', 'time']
    };
  }
  
  // Interest signals
  if (text.match(/tell me more|interested|how does|what about|sounds good|that's interesting|i'd like to know/)) {
    return {
      type: 'interest',
      confidence: 0.9,
      signals: ['interested', 'tell me more', 'sounds good']
    };
  }
  
  // Competitor mentions
  if (text.match(/already have|use another|already using|we have|current|existing/)) {
    return {
      type: 'competitor_mention',
      confidence: 0.85,
      signals: ['already have', 'current', 'using']
    };
  }
  
  // Skepticism
  if (text.match(/scam|trust|believe|prove|really|sure about|doubt|skeptical|too good to be true/)) {
    return {
      type: 'skepticism',
      confidence: 0.8,
      signals: ['trust', 'believe', 'prove', 'skeptical']
    };
  }
  
  // Brush off
  if (text.match(/not interested|no thanks|not today|go away|leave|not buying|don't want/)) {
    return {
      type: 'brush_off',
      confidence: 0.85,
      signals: ['not interested', 'no thanks', 'not today']
    };
  }
  
  // Stall
  if (text.match(/think about|talk to (spouse|partner|wife|husband)|need to discuss|decide|consider/)) {
    return {
      type: 'stall',
      confidence: 0.8,
      signals: ['think', 'talk to', 'discuss', 'decide']
    };
  }
  
  // Question
  if (text.match(/\?|what|how|why|when|where|who|which/)) {
    return {
      type: 'question',
      confidence: 0.7,
      signals: ['question', 'what', 'how']
    };
  }
  
  // Default to neutral
  return {
    type: 'neutral',
    confidence: 0.5,
    signals: []
  };
}

/**
 * Extract keywords from homeowner's statement
 * Simple keyword extraction for matching
 */
function extractKeywords(text: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ')
  
  // Split into words and filter out common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
    'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'then'
  ])
  
  const words = cleaned.split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.has(word)
  )
  
  // Return unique keywords
  return Array.from(new Set(words))
}

/**
 * Get intent-specific keywords for enhanced matching
 */
function getIntentKeywords(intentType: Intent['type']): string[] {
  const intentMap: Record<Intent['type'], string[]> = {
    'price_objection': [
      'price', 'cost', 'payment', 'financing', 'value', 'roi',
      'compare', 'affordable', 'investment', 'worth', 'save money', 'discount'
    ],
    'time_objection': [
      'schedule', 'timing', 'follow up', 'later', 'when convenient',
      'available', 'appointment', 'right time', 'best time', 'call back'
    ],
    'competitor_mention': [
      'competition', 'alternative', 'difference', 'better', 'unique',
      'compare', 'advantage', 'why us', 'superior', 'versus', 'vs'
    ],
    'skepticism': [
      'guarantee', 'proof', 'testimonial', 'review', 'trust', 'verified',
      'certified', 'proven', 'track record', 'case study', 'evidence'
    ],
    'interest': [
      'next step', 'details', 'features', 'benefits', 'how it works',
      'process', 'get started', 'sign up', 'tell me more'
    ],
    'brush_off': [
      're-engage', 'respect your time', 'one quick', 'just curious',
      'briefly', 'one question', 'moment of your time'
    ],
    'question': [
      'answer', 'explain', 'clarify', 'understand', 'question', 'help'
    ],
    'stall': [
      'decision', 'think about', 'spouse', 'partner', 'discuss',
      'urgency', 'limited time', 'special offer', 'consider'
    ],
    'neutral': []
  };
  
  return intentMap[intentType] || [];
}

/**
 * Calculate enhanced relevance score - simplified to 3 factors only
 */
function calculateEnhancedScore(
  section: string,
  keywords: string[],
  homeownerText: string,
  intent: Intent
): number {
  let score = 0
  const sectionLower = section.toLowerCase()
  const homeownerLower = homeownerText.toLowerCase()
  
  // 1. Base keyword matching (weight: 1x)
  keywords.forEach(keyword => {
    const matches = (sectionLower.match(new RegExp(keyword, 'gi')) || []).length
    score += matches
  })
  
  // 2. Intent keyword matching (weight: 2x)
  const intentKeywords = getIntentKeywords(intent.type)
  intentKeywords.forEach(keyword => {
    if (sectionLower.includes(keyword)) {
      score += 2 * intent.confidence
    }
  })
  
  // 3. Exact phrase matching (weight: 3x)
  if (sectionLower.includes(homeownerLower)) {
    score += 3
  }
  
  // Normalize by section length (prefer shorter, more focused sections)
  const lengthPenalty = Math.min(section.length / 500, 1)
  score = score / (1 + lengthPenalty * 0.5)
  
  return score
}

/**
 * Calculate relevance score for a script section (legacy function for backward compatibility)
 */
function calculateRelevanceScore(
  section: string,
  keywords: string[],
  homeownerText: string
): number {
  // Use enhanced scoring with default intent
  const intent = classifyIntent(homeownerText)
  return calculateEnhancedScore(section, keywords, homeownerText, intent)
}

/**
 * Split script content into searchable sections
 * Creates overlapping windows for better context
 */
function splitIntoChunks(content: string, chunkSize: number = 500, overlap: number = 100): ScriptSection[] {
  const chunks: ScriptSection[] = []
  let startIndex = 0
  
  while (startIndex < content.length) {
    const endIndex = Math.min(startIndex + chunkSize, content.length)
    const text = content.substring(startIndex, endIndex)
    
    chunks.push({
      text,
      startIndex,
      endIndex,
      score: 0
    })
    
    startIndex += chunkSize - overlap
  }
  
  return chunks
}

/**
 * Pre-process script content into chunks for caching
 * Returns chunks with pre-extracted keywords for faster retrieval
 */
export interface ScriptChunk {
  text: string
  keywords: string[]
  startIndex: number
  endIndex: number
}

export function preprocessScriptChunks(content: string): ScriptChunk[] {
  if (!content || content.trim().length === 0) {
    return []
  }

  // Use optimized chunk size (300 chars, 50 overlap) matching searchScripts
  const chunkSize = 300
  const overlap = 50
  const chunks: ScriptChunk[] = []
  let startIndex = 0

  while (startIndex < content.length) {
    const endIndex = Math.min(startIndex + chunkSize, content.length)
    const text = content.substring(startIndex, endIndex)
    
    // Extract keywords for this chunk
    const keywords = extractKeywords(text)

    chunks.push({
      text,
      keywords,
      startIndex,
      endIndex
    })

    startIndex += chunkSize - overlap
  }

  return chunks
}

/**
 * Analyze conversation to determine current stage and context
 * Uses content-based detection instead of turn count
 */
export function analyzeConversation(
  transcript: Array<{ speaker: string; text: string; timestamp?: string }>
): ConversationAnalysis {
  const turnCount = transcript.length;
  
  // Get rep and homeowner statements
  const repStatements = transcript.filter(m => 
    m.speaker === 'user' || m.speaker === 'rep'
  );
  const homeownerStatements = transcript.filter(m => 
    m.speaker === 'homeowner' || m.speaker === 'agent'
  );
  
  // Count discovery questions asked by rep
  const discoveryQuestions = repStatements.filter(stmt => {
    const text = stmt.text.toLowerCase()
    return text.includes('?') && 
           /(what|how|tell me|experience|deal with|see|notice|concern|problem|issue|current|situation)/i.test(text)
  }).length
  
  // Check if rep has started pitching (mentioning service, benefits, features)
  const hasStartedPitching = repStatements.some(stmt => {
    const text = stmt.text.toLowerCase()
    return text.match(/(service|treatment|protect|benefit|feature|solution|program|plan|coverage|how it works)/i) &&
           !text.match(/\?/) // Not a question
  })
  
  // Detect objections from homeowner text
  const hasObjections = homeownerStatements.some(stmt => {
    const intent = classifyIntent(stmt.text)
    return intent.type.includes('objection') || intent.type === 'brush_off' || intent.type === 'stall'
  })
  
  // Check if pricing has been discussed
  const fullText = transcript.map(m => m.text).join(' ').toLowerCase()
  const pricingDiscussed = /(price|cost|how much|pricing|payment|budget)/i.test(fullText)
  
  // Detect closing language from rep
  const closingLanguage = repStatements.some(stmt => {
    const text = stmt.text.toLowerCase()
    return /(next step|get started|sign up|schedule|move forward|let's do|ready to|when can we)/i.test(text)
  })
  
  // Determine stage from actual content
  let stage: ConversationStage['stage'] = 'opener'
  
  if (hasObjections) {
    stage = 'objection_handling'
  } else if (closingLanguage || (pricingDiscussed && discoveryQuestions >= 2)) {
    stage = 'closing'
  } else if (hasStartedPitching && discoveryQuestions >= 2) {
    stage = 'presentation'
  } else if (discoveryQuestions >= 1) {
    stage = 'discovery'
  }
  // else stays 'opener'
  
  // Analyze last homeowner message
  const lastHomeownerMsg = homeownerStatements[homeownerStatements.length - 1]?.text || ''
  const lastIntent = classifyIntent(lastHomeownerMsg)
  
  // Determine momentum
  let momentum: 'positive' | 'neutral' | 'negative' = 'neutral'
  const recentMessages = transcript.slice(-4).map(m => m.text).join(' ').toLowerCase()
  
  if (recentMessages.match(/interested|sounds good|tell me more|great|perfect|that's interesting/)) {
    momentum = 'positive'
  } else if (recentMessages.match(/not interested|no thanks|busy|already have|not today|go away/)) {
    momentum = 'negative'
  }
  
  // Extract key points
  const keyPoints: string[] = []
  if (pricingDiscussed) keyPoints.push('price_discussed')
  if (fullText.match(/spouse|partner|wife|husband/)) keyPoints.push('needs_spousal_approval')
  if (fullText.includes('competitor') || fullText.includes('already have')) keyPoints.push('comparing_options')
  if (fullText.match(/guarantee|warranty|promise/)) keyPoints.push('guarantee_discussed')
  if (discoveryQuestions === 0 && turnCount <= 4) keyPoints.push('needs_discovery_questions')
  
  return {
    stage,
    turnCount,
    lastIntent,
    momentum,
    keyPoints
  }
}

/**
 * Search scripts using simplified keyword matching - optimized for speed
 * Uses cached chunks when available, falls back to on-the-fly processing
 * Returns top N most relevant sections
 */
export function searchScripts(
  homeownerText: string,
  scripts: ScriptDocument[],
  topN: number = 2
): ScriptSection[] {
  if (!homeownerText || homeownerText.trim().length === 0) {
    return []
  }
  
  if (scripts.length === 0) {
    return []
  }
  
  const keywords = extractKeywords(homeownerText)
  const homeownerLower = homeownerText.toLowerCase()
  
  if (keywords.length === 0) {
    // If no keywords, return first sections from scripts
    return scripts.slice(0, topN).map(script => {
      // Use cached chunks if available, otherwise use content
      if (script.chunks && script.chunks.length > 0) {
        return {
          text: script.chunks[0].text,
          startIndex: script.chunks[0].startIndex,
          endIndex: script.chunks[0].endIndex,
          score: 0.5
        }
      }
      return {
        text: script.content.substring(0, 300),
        startIndex: 0,
        endIndex: Math.min(300, script.content.length),
        score: 0.5
      }
    })
  }
  
  // Use simplified scoring with intent matching
  const intent = classifyIntent(homeownerText)
  const allSections: ScriptSection[] = []
  
  scripts.forEach(script => {
    // Use cached chunks if available (much faster)
    if (script.chunks && script.chunks.length > 0) {
      script.chunks.forEach(chunk => {
        // Use simplified enhanced scoring
        const score = calculateEnhancedScore(chunk.text, keywords, homeownerText, intent)
        
        allSections.push({
          text: chunk.text,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          score
        })
      })
    } else {
      // Fall back to on-the-fly processing (backward compatibility)
      if (!script.content || script.content.trim().length === 0) {
        return
      }
      
      // Smaller chunks (300 chars) with less overlap (50) for speed
      const chunks = splitIntoChunks(script.content, 300, 50)
      
      chunks.forEach(chunk => {
        // Use simplified enhanced scoring
        const score = calculateEnhancedScore(chunk.text, keywords, homeownerText, intent)
        
        allSections.push({
          ...chunk,
          score
        })
      })
    }
  })
  
  // Sort by score (highest first) and return top N
  allSections.sort((a, b) => b.score - a.score)
  
  return allSections.slice(0, topN)
}

/**
 * Get full script content for a script ID
 */
export function getScriptContent(scriptId: string, scripts: ScriptDocument[]): string | null {
  const script = scripts.find(s => s.id === scriptId)
  return script?.content || null
}

/**
 * Format retrieved sections for prompt context
 */
export function formatSectionsForPrompt(sections: ScriptSection[]): string {
  if (sections.length === 0) {
    return 'No relevant script sections found.'
  }
  
  return sections.map((section, index) => {
    return `[Section ${index + 1}]\n${section.text}\n`
  }).join('\n---\n\n')
}

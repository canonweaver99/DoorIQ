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

interface ScriptSection {
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
 * Get stage-specific keywords
 */
function getStageKeywords(stage: ConversationStage['stage']): string[] {
  const stageMap: Record<ConversationStage['stage'], string[]> = {
    'opener': [
      'introduce', 'hello', 'my name', 'calling from', 'here because',
      'reach out', 'quick', 'moment', 'hi there'
    ],
    'discovery': [
      'currently', 'situation', 'pain point', 'challenge', 'concern',
      'tell me', 'understand', 'learn about', 'experience with', 'what\'s your'
    ],
    'presentation': [
      'benefit', 'feature', 'solution', 'how it works', 'specifically',
      'imagine', 'for example', 'what this means', 'here\'s how'
    ],
    'objection_handling': [
      'understand', 'concern', 'actually', 'many people', 'what if',
      'make sense', 'fair question', 'let me address', 'i hear you'
    ],
    'closing': [
      'next step', 'get started', 'move forward', 'sign up', 'schedule',
      'today', 'now', 'secure', 'commit', 'let\'s do this'
    ]
  };
  
  return stageMap[stage] || [];
}

/**
 * Get sales patterns for intent matching
 */
function getSalesPatterns(intentType: Intent['type']): RegExp[] {
  const patterns: Record<Intent['type'], RegExp[]> = {
    'price_objection': [
      /\$\d+/,
      /\d+% (off|discount|savings)/i,
      /payment plan/i,
      /break down the cost/i,
      /monthly payment/i
    ],
    'time_objection': [
      /takes? (just|only) \d+ minutes?/i,
      /quick question/i,
      /won't take long/i,
      /just a moment/i
    ],
    'competitor_mention': [
      /unlike (other|competitors)/i,
      /what makes us different/i,
      /our unique/i,
      /key difference/i
    ],
    'skepticism': [
      /\d+ years? (of )?(experience|in business)/i,
      /\d+ satisfied customers/i,
      /\d+% satisfaction/i,
      /money-back guarantee/i
    ],
    'interest': [
      /next step/i,
      /get started/i,
      /how do we/i,
      /what's involved/i
    ],
    'brush_off': [
      /respect your time/i,
      /one quick/i,
      /just curious/i
    ],
    'question': [],
    'stall': [
      /limited time/i,
      /special offer/i,
      /today only/i
    ],
    'neutral': []
  };
  
  return patterns[intentType] || [];
}

/**
 * Check if section is relevant to current conversation stage
 */
function isStageRelevant(section: string, currentStage: ConversationStage['stage']): boolean {
  const sectionLower = section.toLowerCase();
  
  // If we're in objection handling, opener content is irrelevant
  if (currentStage === 'objection_handling' && 
      sectionLower.match(/my name is|calling from|introduce|hello there/)) {
    return false;
  }
  
  // If we're closing, discovery questions are irrelevant
  if (currentStage === 'closing' && 
      sectionLower.match(/tell me about|what's your current|learn about|how long have/)) {
    return false;
  }
  
  // If we're in opener, closing lines are irrelevant
  if (currentStage === 'opener' && 
      sectionLower.match(/next step|get started|sign up|move forward|let's do this/)) {
    return false;
  }
  
  return true;
}

/**
 * Calculate enhanced relevance score with intent and conversation stage
 */
function calculateEnhancedScore(
  section: string,
  keywords: string[],
  homeownerText: string,
  intent: Intent,
  conversationStage: ConversationStage
): number {
  let score = 0;
  const sectionLower = section.toLowerCase();
  
  // 1. Base keyword matching (weight: 1x)
  keywords.forEach(keyword => {
    const matches = (sectionLower.match(new RegExp(keyword, 'gi')) || []).length;
    score += matches;
  });
  
  // 2. Intent-based scoring (weight: 3x) - MOST IMPORTANT
  const intentKeywords = getIntentKeywords(intent.type);
  intentKeywords.forEach(keyword => {
    if (sectionLower.includes(keyword)) {
      score += 3 * intent.confidence;
    }
  });
  
  // 3. Stage-based scoring (weight: 2x)
  const stageKeywords = getStageKeywords(conversationStage.stage);
  stageKeywords.forEach(keyword => {
    if (sectionLower.includes(keyword)) {
      score += 2;
    }
  });
  
  // 4. Exact phrase matching (weight: 5x)
  if (sectionLower.includes(homeownerText.toLowerCase())) {
    score += 5;
  }
  
  // 5. Pattern matching for common sales scenarios (weight: 4x)
  const patterns = getSalesPatterns(intent.type);
  patterns.forEach(pattern => {
    if (pattern.test(sectionLower)) {
      score += 4;
    }
  });
  
  // 6. Penalize irrelevant stages
  if (!isStageRelevant(section, conversationStage.stage)) {
    score *= 0.3; // Heavy penalty for wrong stage
  }
  
  // Normalize by section length (prefer shorter, more focused sections)
  const lengthPenalty = Math.min(section.length / 500, 1);
  score = score / (1 + lengthPenalty * 0.5);
  
  return score;
}

/**
 * Calculate relevance score for a script section (legacy function for backward compatibility)
 */
function calculateRelevanceScore(
  section: string,
  keywords: string[],
  homeownerText: string
): number {
  // Use enhanced scoring with default intent and stage
  const intent = classifyIntent(homeownerText);
  const stage: ConversationStage = { stage: 'discovery', turnCount: 5 };
  return calculateEnhancedScore(section, keywords, homeownerText, intent, stage);
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
 */
export function analyzeConversation(
  transcript: Array<{ speaker: string; text: string; timestamp?: string }>
): ConversationAnalysis {
  const turnCount = transcript.length;
  
  // Determine stage based on conversation progress and content
  let stage: ConversationStage['stage'] = 'opener';
  
  if (turnCount > 8) stage = 'closing';
  else if (turnCount > 6) stage = 'objection_handling';
  else if (turnCount > 4) stage = 'presentation';
  else if (turnCount > 2) stage = 'discovery';
  
  // Analyze last homeowner message
  const homeownerMessages = transcript.filter(m => 
    m.speaker === 'homeowner' || m.speaker === 'agent'
  );
  const lastHomeownerMsg = homeownerMessages[homeownerMessages.length - 1]?.text || '';
  const lastIntent = classifyIntent(lastHomeownerMsg);
  
  // Determine momentum
  let momentum: 'positive' | 'neutral' | 'negative' = 'neutral';
  const recentMessages = transcript.slice(-4).map(m => m.text).join(' ').toLowerCase();
  
  if (recentMessages.match(/interested|sounds good|tell me more|great|perfect|that's interesting/)) {
    momentum = 'positive';
  } else if (recentMessages.match(/not interested|no thanks|busy|already have|not today|go away/)) {
    momentum = 'negative';
  }
  
  // Extract key points
  const fullText = transcript.map(m => m.text).join(' ').toLowerCase();
  const keyPoints: string[] = [];
  if (fullText.includes('price') || fullText.includes('cost')) keyPoints.push('price_discussed');
  if (fullText.match(/spouse|partner|wife|husband/)) keyPoints.push('needs_spousal_approval');
  if (fullText.includes('competitor') || fullText.includes('already have')) keyPoints.push('comparing_options');
  if (fullText.match(/guarantee|warranty|promise/)) keyPoints.push('guarantee_discussed');
  
  return {
    stage,
    turnCount,
    lastIntent,
    momentum,
    keyPoints
  };
}

/**
 * Search scripts using simplified keyword matching - optimized for speed
 * Uses cached chunks when available, falls back to on-the-fly processing
 * Returns top N most relevant sections
 */
export function searchScripts(
  homeownerText: string,
  scripts: ScriptDocument[],
  topN: number = 2,
  conversationAnalysis?: ConversationAnalysis
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
  
  // Simplified scoring - just keyword matching (much faster)
  const allSections: ScriptSection[] = []
  
  scripts.forEach(script => {
    // Use cached chunks if available (much faster)
    if (script.chunks && script.chunks.length > 0) {
      script.chunks.forEach(chunk => {
        let score = 0
        const chunkLower = chunk.text.toLowerCase()
        
        // Use pre-extracted keywords for faster matching
        const keywordMatches = chunk.keywords.filter(kw => 
          keywords.some(searchKw => chunkLower.includes(searchKw.toLowerCase()))
        )
        score += keywordMatches.length
        
        // Also check direct keyword matches in text
        keywords.forEach(keyword => {
          const matches = (chunkLower.match(new RegExp(keyword, 'gi')) || []).length
          score += matches
        })
        
        // Boost for exact phrase matches
        if (chunkLower.includes(homeownerLower)) {
          score += 5
        }
        
        // Prefer shorter sections
        score = score / (1 + chunk.text.length / 300)
        
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
        let score = 0
        const chunkLower = chunk.text.toLowerCase()
        
        // Simple keyword matching
        keywords.forEach(keyword => {
          const matches = (chunkLower.match(new RegExp(keyword, 'gi')) || []).length
          score += matches
        })
        
        // Boost for exact phrase matches
        if (chunkLower.includes(homeownerLower)) {
          score += 5
        }
        
        // Prefer shorter sections
        score = score / (1 + chunk.text.length / 300)
        
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

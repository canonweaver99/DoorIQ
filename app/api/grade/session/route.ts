import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

// Increased timeout for reliable grading (Vercel Pro allows up to 300s)
export const maxDuration = 60 // 60 seconds - allows for longer sessions
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout - faster failure detection
  maxRetries: 2 // Increased retries for reliability
})

type JsonSchema = Record<string, any>

// Helper functions to pre-compute objective metrics
function detectFillerWords(text: string): number {
  // Only count: um, uh, uhh, erm, err, hmm (NOT "like")
  const fillerPattern = /\b(um|uhh?|uh|erm|err|hmm)\b/gi
  const matches = text.match(fillerPattern)
  return matches ? matches.length : 0
}

function calculateWPM(transcript: any[], durationSeconds: number): number {
  if (!transcript || transcript.length === 0 || durationSeconds <= 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  const totalWords = repEntries.reduce((sum: number, entry: any) => {
    const text = entry.text || entry.message || ''
    return sum + text.split(/\s+/).filter((word: string) => word.length > 0).length
  }, 0)
  
  const durationMinutes = durationSeconds / 60
  return Math.round(totalWords / durationMinutes)
}

function calculateQuestionRatio(transcript: any[]): number {
  if (!transcript || transcript.length === 0) return 0
  
  const repEntries = transcript.filter((entry: any) => 
    entry.speaker === 'rep' || entry.speaker === 'user'
  )
  
  if (repEntries.length === 0) return 0
  
  const questions = repEntries.filter((entry: any) => {
    const text = entry.text || entry.message || ''
    return text.trim().endsWith('?')
  }).length
  
  return Math.round((questions / repEntries.length) * 100)
}

const gradingResponseSchema: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'session_summary',
    'scores',
    'line_ratings',
    'feedback',
    'objection_analysis',
    'coaching_plan',
    'timeline_key_moments',
    'sale_closed',
    'return_appointment',
    'virtual_earnings',
    'earnings_data',
    'deal_details'
  ],
  properties: {
    session_summary: {
      type: 'object',
      additionalProperties: false,
      properties: {
        total_lines: { type: 'integer' },
        rep_lines: { type: 'integer' },
        customer_lines: { type: 'integer' },
        objections_detected: { type: 'integer' },
        questions_asked: { type: 'integer' }
      }
    },
    scores: {
      type: 'object',
      additionalProperties: false,
      properties: {
        overall: { type: 'number' },
        rapport: { type: 'number' },
        discovery: { type: 'number' },
        objection_handling: { type: 'number' },
        closing: { type: 'number' },
        safety: { type: 'number' },
        introduction: { type: 'number' },
        listening: { type: 'number' },
        speaking_pace: { type: 'number' },
        filler_words: { type: 'number' },
        question_ratio: { type: 'number' },
        active_listening: { type: 'number' },
        assumptive_language: { type: 'number' }
      }
    },
    line_ratings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        properties: {
          line_number: { type: 'integer' },
          speaker: { type: 'string' },
          effectiveness: { type: 'string' },
          alternative_lines: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    feedback: {
      type: 'object',
      additionalProperties: false,
      properties: {
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        specific_tips: { type: 'array', items: { type: 'string' } }
      }
    },
    conversation_dynamics: {
      type: 'object',
      additionalProperties: true,
      properties: {
        interruptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              who: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        energy_shifts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        buying_signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              signal_description: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        momentum_changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              change: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        engagement_drops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              reason: { type: 'string' }
            }
          }
        }
      }
    },
    failure_analysis: {
      type: 'object',
      additionalProperties: true,
      properties: {
        critical_moments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              event: { type: 'string' },
              customer_reaction: { type: 'string' },
              rep_recovery_attempted: { type: 'boolean' },
              success: { type: 'boolean' },
              better_approach: { type: 'string' }
            }
          }
        },
        point_of_no_return: {
          type: 'object',
          properties: {
            line: { type: 'integer' },
            reason: { type: 'string' },
            could_have_saved: { type: 'boolean' },
            how: { type: 'string' }
          }
        },
        missed_pivots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              opportunity: { type: 'string' },
              suggested_pivot: { type: 'string' }
            }
          }
        },
        recovery_failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'integer' },
              attempt: { type: 'string' },
              why_failed: { type: 'string' },
              better_approach: { type: 'string' }
            }
          }
        }
      }
    },
    objection_analysis: {
      type: 'object',
      additionalProperties: true,
      properties: {
        total_objections: { type: 'integer' }
      }
    },
    coaching_plan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        immediate_fixes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              practice_scenario: { type: 'string' },
              resource: { type: 'string' }
            }
          }
        },
        skill_development: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              current_level: { type: 'string' },
              target_level: { type: 'string' },
              exercises: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        role_play_scenarios: { type: 'array', items: { type: 'string' } }
      }
    },
    timeline_key_moments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          position: { type: 'integer' },
          line_number: { type: 'integer' },
          timestamp: { type: 'string' },
          moment_type: { type: 'string' },
          quote: { type: 'string' },
          is_positive: { type: 'boolean' },
          key_takeaway: { type: 'string' }
        },
        required: ['position', 'line_number', 'timestamp', 'moment_type', 'quote', 'is_positive', 'key_takeaway']
      }
    },
    sale_closed: { type: 'boolean' },
    return_appointment: { type: 'boolean' },
    virtual_earnings: { type: 'number' },
    earnings_data: {
      type: 'object',
      additionalProperties: false,
      properties: {
        base_amount: { type: 'number' },
        closed_amount: { type: 'number' },
        total_earned: { type: 'number' }
      },
      required: ['total_earned']
    },
    deal_details: {
      type: 'object',
      additionalProperties: false,
      properties: {
        product_sold: { type: 'string' },
        service_type: { type: 'string' },
        base_price: { type: 'number' },
        monthly_value: { type: 'number' },
        contract_length: { type: 'number' },
        total_contract_value: { type: 'number' },
        payment_method: { type: 'string' },
        add_ons: { type: 'array', items: { type: 'string' } },
        start_date: { type: 'string' },
        next_step: { type: 'string' },
        next_step_type: { type: 'string' }
      }
    }
  }
}

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  logger.error('OPENAI_API_KEY not configured')
}

export async function POST(request: NextRequest) {
  // Legacy endpoint - redirects to new orchestration system
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    logger.info('Legacy /api/grade/session called - redirecting to simple grading', { sessionId })
    
    // Call the simple grading endpoint internally
    const gradingResponse = await fetch(`${request.nextUrl.origin}/api/grade/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId })
    })
    
    if (gradingResponse.ok) {
      const data = await gradingResponse.json()
      return NextResponse.json({
        ...data,
        message: 'Grading completed via simple grading system'
      })
    } else {
      const error = await gradingResponse.text()
      logger.error('Simple grading failed from legacy endpoint', { sessionId, error })
      return NextResponse.json(
        { error: 'Grading failed - please use /api/grade/simple directly' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    logger.error('Error in legacy grading endpoint', error)
    return NextResponse.json(
      { error: error.message || 'Failed to grade session' },
      { status: 500 }
    )
  }
}

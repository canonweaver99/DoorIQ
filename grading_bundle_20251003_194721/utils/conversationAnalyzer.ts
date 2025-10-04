export type TranscriptTurn = { speaker: 'rep' | 'homeowner'; text: string; timestamp?: number }

export type BasicMetrics = {
  total_turns: number
  conversation_duration_seconds: number
  questions_asked_by_homeowner: number
  homeowner_first_words: string
  homeowner_final_words: string
  homeowner_key_questions: string[]
  interruptions_count: number
  filler_words_count: number
  time_to_value_seconds: number
  close_attempted: boolean
  closing_technique: string
  objections_raised: number
  objections_resolved: number
  rapport_score: number
}

const QUESTION_REGEX = /\?\s*$/
const FILLERS = /(\b|^)(um|uh|like|you know|so|basically|actually)(\b|$)/gi
const VALUE_REGEX = /(benefit|value|save|protect|safety|warranty|guarantee|results?|solve)/i
const CLOSE_REGEX = /(which works better|let's get you|get started|i can have a tech|we can do|which time works)/i

export function extractBasicMetrics(transcript: TranscriptTurn[]): BasicMetrics {
  const total_turns = transcript.length
  const duration = (() => {
    const withTs = transcript.filter(t => typeof t.timestamp === 'number')
    if (withTs.length >= 2) {
      const first = withTs[0]!.timestamp as number
      const last = withTs[withTs.length - 1]!.timestamp as number
      return Math.max(0, Math.round((last - first) / 1000))
    }
    return Math.max(0, Math.round(total_turns * 4))
  })()

  const homeownerTurns = transcript.filter(t => t.speaker === 'homeowner')
  const homeowner_first_words = homeownerTurns[0]?.text?.slice(0, 120) || ''
  const homeowner_final_words = homeownerTurns.at(-1)?.text?.slice(0, 120) || ''
  const homeowner_key_questions = homeownerTurns
    .map(t => t.text)
    .filter(Boolean)
    .filter(text => QUESTION_REGEX.test(text))

  const questions_asked_by_homeowner = homeowner_key_questions.length

  let interruptions_count = 0
  // Heuristic: consecutive rep turns while homeowner spoke recently
  for (let i = 1; i < transcript.length; i++) {
    const prev = transcript[i - 1]
    const cur = transcript[i]
    if (prev.speaker === 'homeowner' && cur.speaker === 'rep' && (prev.text?.length || 0) < 6) {
      interruptions_count++
    }
  }

  const filler_words_count = (transcript
    .filter(t => t.speaker === 'rep')
    .map(t => t.text || '')
    .join(' ')?.match(FILLERS)?.length) || 0

  let time_to_value_seconds = duration
  const firstValueIdx = transcript.findIndex(t => t.speaker === 'rep' && VALUE_REGEX.test(t.text || ''))
  if (firstValueIdx >= 0) {
    const firstTs = transcript[0]?.timestamp
    const hitTs = transcript[firstValueIdx]?.timestamp
    time_to_value_seconds = typeof firstTs === 'number' && typeof hitTs === 'number'
      ? Math.max(0, Math.round((hitTs - firstTs) / 1000))
      : Math.round(firstValueIdx * 4)
  }

  const close_attempted = transcript.some(t => t.speaker === 'rep' && CLOSE_REGEX.test(t.text || ''))
  const closing_technique = close_attempted ? 'assumptive/choice' : ''

  // Objection heuristics
  const objectionRegex = /(price|too expensive|busy|timing|need to think|not sure|trust|competition|compare|quote)/i
  const resolveRegex = /(understand|what if we|solution|we can|address|guarantee|warranty|no problem)/i
  let objections_raised = 0
  let objections_resolved = 0
  for (const t of homeownerTurns) {
    if (objectionRegex.test(t.text || '')) {
      objections_raised++
    }
  }
  for (const t of transcript.filter(t => t.speaker === 'rep')) {
    if (resolveRegex.test(t.text || '')) objections_resolved++
  }

  // Rapport heuristic 0-20
  const rapport_score = Math.max(0, Math.min(20, Math.round(
    (transcript.filter(t => t.speaker === 'rep' && /(thanks|appreciate|no worries|great question|makes sense|i hear you|understand)/i.test(t.text || '')).length)
      + (homeowner_key_questions.length > 2 ? 5 : 0)
  )))

  return {
    total_turns,
    conversation_duration_seconds: duration,
    questions_asked_by_homeowner,
    homeowner_first_words,
    homeowner_final_words,
    homeowner_key_questions,
    interruptions_count,
    filler_words_count,
    time_to_value_seconds,
    close_attempted,
    closing_technique,
    objections_raised,
    objections_resolved,
    rapport_score,
  }
}



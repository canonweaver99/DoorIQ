import { AIPromptOutput } from '@/api/analyzeConversation'

export type GradeBreakdown = {
  total: number
  letter: 'A+'|'A'|'B+'|'B'|'C+'|'C'|'D'|'F'
  pass: boolean
  categories: {
    opening_introduction: number
    rapport_building: number
    needs_discovery: number
    value_communication: number
    objection_handling: number
    closing: number
  }
  deductions: Array<{ reason: string; points: number }>
}

export function calculateGrade(ai: AIPromptOutput): GradeBreakdown {
  const c = ai.grading
  const rawTotal =
    (c.opening_introduction?.points || 0) +
    (c.rapport_building?.points || 0) +
    (c.needs_discovery?.points || 0) +
    (c.value_communication?.points || 0) +
    (c.objection_handling?.points || 0) +
    (c.closing?.points || 0)

  const deductions = Array.isArray(c.deductions) ? c.deductions : []
  const deductionTotal = deductions.reduce((s, d) => s + (d.points || 0), 0)
  const total = Math.max(0, Math.min(100, Math.round(rawTotal + deductionTotal)))

  const letter = total >= 97 ? 'A+' : total >= 93 ? 'A' : total >= 87 ? 'B+' : total >= 83 ? 'B' : total >= 77 ? 'C+' : total >= 70 ? 'C' : total >= 60 ? 'D' : 'F'
  const pass = total >= 70

  return {
    total,
    letter,
    pass,
    categories: {
      opening_introduction: c.opening_introduction?.points || 0,
      rapport_building: c.rapport_building?.points || 0,
      needs_discovery: c.needs_discovery?.points || 0,
      value_communication: c.value_communication?.points || 0,
      objection_handling: c.objection_handling?.points || 0,
      closing: c.closing?.points || 0,
    },
    deductions,
  }
}



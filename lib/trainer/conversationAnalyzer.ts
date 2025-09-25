export interface ConversationAnalysis {
  overallScore: number
  scores: {
    rapport: number
    introduction: number
    listening: number
    salesTechnique: number
    closing: number
  }
  keyMoments: {
    priceDiscussed: boolean
    safetyAddressed: boolean
    closeAttempted: boolean
    objectionHandled: boolean
  }
  feedback: {
    strengths: string[]
    improvements: string[]
    specificTips: string[]
  }
  transcriptSections: {
    introduction: { startIdx: number; endIdx: number }
    discovery: { startIdx: number; endIdx: number }
    presentation: { startIdx: number; endIdx: number }
    closing: { startIdx: number; endIdx: number }
  }
}

export function analyzeConversation(
  transcript: Array<{ speaker: string; text: string; timestamp?: any }>
): ConversationAnalysis {
  const analysis: ConversationAnalysis = {
    overallScore: 0,
    scores: {
      rapport: 0,
      introduction: 0,
      listening: 0,
      salesTechnique: 0,
      closing: 0
    },
    keyMoments: {
      priceDiscussed: false,
      safetyAddressed: false,
      closeAttempted: false,
      objectionHandled: false
    },
    feedback: {
      strengths: [],
      improvements: [],
      specificTips: []
    },
    transcriptSections: {
      introduction: { startIdx: 0, endIdx: -1 },
      discovery: { startIdx: -1, endIdx: -1 },
      presentation: { startIdx: -1, endIdx: -1 },
      closing: { startIdx: -1, endIdx: -1 }
    }
  }

  if (transcript.length === 0) return analysis

  // Analyze introduction (first 3-5 exchanges)
  const introEnd = Math.min(6, transcript.length)
  analysis.transcriptSections.introduction.endIdx = introEnd - 1

  const hasGreeting = transcript.slice(0, 3).some(t => 
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('hello') ||
      t.text.toLowerCase().includes('hi') ||
      t.text.toLowerCase().includes('good')
    )
  )

  const hasIntroduction = transcript.slice(0, introEnd).some(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('my name') ||
      t.text.toLowerCase().includes("i'm from") ||
      t.text.toLowerCase().includes('pest control')
    )
  )

  const hasRapport = transcript.slice(0, introEnd).some(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('how are you') ||
      t.text.toLowerCase().includes('nice weather') ||
      t.text.toLowerCase().includes('beautiful home')
    )
  )

  // Score introduction
  analysis.scores.introduction = 
    (hasGreeting ? 35 : 0) + 
    (hasIntroduction ? 35 : 0) + 
    (hasRapport ? 30 : 0)

  // Analyze discovery phase
  let discoveryStart = -1
  let discoveryEnd = -1
  const discoveryQuestions = transcript.map((t, idx) => ({
    idx,
    isDiscovery: t.speaker === 'user' && 
      t.text.includes('?') && 
      (t.text.toLowerCase().includes('pest') ||
       t.text.toLowerCase().includes('problem') ||
       t.text.toLowerCase().includes('issue') ||
       t.text.toLowerCase().includes('concern'))
  })).filter(t => t.isDiscovery)

  if (discoveryQuestions.length > 0) {
    discoveryStart = discoveryQuestions[0].idx
    discoveryEnd = discoveryQuestions[discoveryQuestions.length - 1].idx + 2
    analysis.transcriptSections.discovery = { 
      startIdx: discoveryStart, 
      endIdx: Math.min(discoveryEnd, transcript.length - 1) 
    }
  }

  // Score discovery and listening
  const customerResponses = transcript.filter(t => t.speaker === 'austin' || t.speaker === 'homeowner')
  const avgResponseLength = customerResponses.reduce((sum, r) => sum + r.text.length, 0) / (customerResponses.length || 1)
  
  analysis.scores.listening = Math.min(100, 
    (discoveryQuestions.length * 20) + 
    (avgResponseLength > 50 ? 40 : 20)
  )

  // Analyze presentation phase
  const presentationEntries = transcript.map((t, idx) => ({
    idx,
    isPresentation: t.speaker === 'user' && (
      t.text.toLowerCase().includes('service') ||
      t.text.toLowerCase().includes('treatment') ||
      t.text.toLowerCase().includes('offer') ||
      t.text.toLowerCase().includes('protect')
    )
  })).filter(t => t.isPresentation)

  if (presentationEntries.length > 0) {
    const presentationStart = presentationEntries[0].idx
    const presentationEnd = presentationEntries[presentationEntries.length - 1].idx + 2
    analysis.transcriptSections.presentation = {
      startIdx: presentationStart,
      endIdx: Math.min(presentationEnd, transcript.length - 1)
    }
  }

  // Check key moments
  analysis.keyMoments.priceDiscussed = transcript.some(t =>
    t.text.toLowerCase().includes('price') ||
    t.text.toLowerCase().includes('cost') ||
    t.text.toLowerCase().includes('$')
  )

  analysis.keyMoments.safetyAddressed = transcript.some(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('safe') ||
      t.text.toLowerCase().includes('pet') ||
      t.text.toLowerCase().includes('child') ||
      t.text.toLowerCase().includes('eco')
    )
  )

  analysis.keyMoments.closeAttempted = transcript.some(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('schedule') ||
      t.text.toLowerCase().includes('appointment') ||
      t.text.toLowerCase().includes('when can') ||
      t.text.toLowerCase().includes('get started')
    )
  )

  // Analyze objections
  const objections = transcript.filter(t =>
    (t.speaker === 'austin' || t.speaker === 'homeowner') && (
      t.text.toLowerCase().includes("can't") ||
      t.text.toLowerCase().includes('expensive') ||
      t.text.toLowerCase().includes('not interested') ||
      t.text.toLowerCase().includes('busy') ||
      t.text.toLowerCase().includes('think about it')
    )
  )

  analysis.keyMoments.objectionHandled = objections.some((obj, idx) => {
    const objIdx = transcript.indexOf(obj)
    const nextResponse = transcript[objIdx + 1]
    return nextResponse && 
      nextResponse.speaker === 'user' && (
        nextResponse.text.toLowerCase().includes('understand') ||
        nextResponse.text.toLowerCase().includes('appreciate') ||
        nextResponse.text.toLowerCase().includes('i hear you')
      )
  })

  // Score sales technique
  analysis.scores.salesTechnique = 
    (analysis.keyMoments.priceDiscussed ? 25 : 0) +
    (analysis.keyMoments.safetyAddressed ? 25 : 0) +
    (presentationEntries.length > 0 ? 25 : 0) +
    (analysis.keyMoments.objectionHandled ? 25 : 0)

  // Score closing
  const closingEntries = transcript.slice(-5).filter(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('schedule') ||
      t.text.toLowerCase().includes('appointment') ||
      t.text.toLowerCase().includes('next step') ||
      t.text.toLowerCase().includes('get started')
    )
  )

  if (closingEntries.length > 0) {
    const lastClosingIdx = transcript.lastIndexOf(closingEntries[closingEntries.length - 1])
    analysis.transcriptSections.closing = {
      startIdx: Math.max(0, lastClosingIdx - 2),
      endIdx: transcript.length - 1
    }
  }

  analysis.scores.closing = 
    (analysis.keyMoments.closeAttempted ? 50 : 0) +
    (closingEntries.length > 1 ? 30 : 0) +
    (transcript[transcript.length - 1]?.speaker === 'user' ? 20 : 0)

  // Score rapport throughout
  const rapportIndicators = transcript.filter(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('great') ||
      t.text.toLowerCase().includes('excellent') ||
      t.text.toLowerCase().includes('i understand') ||
      t.text.toLowerCase().includes('absolutely') ||
      t.text.toLowerCase().includes('definitely')
    )
  ).length

  analysis.scores.rapport = Math.min(100, 
    (hasRapport ? 40 : 0) + 
    (rapportIndicators * 15)
  )

  // Calculate overall score
  const scoreValues = Object.values(analysis.scores)
  analysis.overallScore = Math.round(
    scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
  )

  // Generate feedback
  if (analysis.scores.introduction >= 80) {
    analysis.feedback.strengths.push("Excellent introduction and opening")
  } else {
    analysis.feedback.improvements.push("Work on your introduction - be clear about who you are and why you're there")
    analysis.feedback.specificTips.push("Try: 'Hi! I'm [Name] from [Company]. We're the local pest control experts...'")
  }

  if (analysis.scores.rapport >= 70) {
    analysis.feedback.strengths.push("Good rapport building throughout the conversation")
  } else {
    analysis.feedback.improvements.push("Build more personal connection before discussing business")
  }

  if (analysis.scores.listening >= 70) {
    analysis.feedback.strengths.push("Excellent active listening and discovery questions")
  } else {
    analysis.feedback.improvements.push("Ask more open-ended questions to understand their needs")
    analysis.feedback.specificTips.push("Ask: 'What pest issues have you noticed around your home?'")
  }

  if (!analysis.keyMoments.safetyAddressed) {
    analysis.feedback.improvements.push("Remember to mention safety for pets and children")
    analysis.feedback.specificTips.push("Mention: 'All our treatments are safe for your family and pets'")
  }

  if (!analysis.keyMoments.closeAttempted) {
    analysis.feedback.improvements.push("Be more assumptive with your close")
    analysis.feedback.specificTips.push("Try: 'I have availability this Thursday or Friday - which works better?'")
  }

  if (analysis.keyMoments.objectionHandled) {
    analysis.feedback.strengths.push("Handled objections professionally")
  }

  return analysis
}

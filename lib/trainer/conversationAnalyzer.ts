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

  // Harsh scoring for introduction - perfect execution required
  let introScore = 0
  if (hasGreeting) introScore += 25
  if (hasIntroduction) introScore += 30
  if (hasRapport) introScore += 25
  
  // Perfect introduction bonus - all elements + smooth delivery
  const smoothIntro = transcript.slice(0, introEnd).filter(t => 
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('um') || 
      t.text.toLowerCase().includes('uh') ||
      t.text.length < 15
    )
  ).length === 0
  
  if (hasGreeting && hasIntroduction && hasRapport && smoothIntro) {
    introScore += 20 // Perfect intro bonus
  }
  
  analysis.scores.introduction = Math.min(100, introScore)

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

  // Harsh scoring for listening - quality over quantity
  const customerResponses = transcript.filter(t => t.speaker === 'austin' || t.speaker === 'homeowner')
  const avgResponseLength = customerResponses.reduce((sum, r) => sum + r.text.length, 0) / (customerResponses.length || 1)
  
  let listeningScore = 0
  
  // Quality discovery questions (max 40 points)
  const qualityQuestions = discoveryQuestions.filter(q => {
    const questionText = transcript[q.idx].text.toLowerCase()
    return questionText.includes('how long') || 
           questionText.includes('when did you first notice') ||
           questionText.includes('where have you seen') ||
           questionText.includes('what areas')
  })
  listeningScore += Math.min(40, qualityQuestions.length * 15)
  
  // Customer engagement (max 30 points) 
  if (avgResponseLength > 80) listeningScore += 30
  else if (avgResponseLength > 50) listeningScore += 20
  else if (avgResponseLength > 25) listeningScore += 10
  
  // Follow-up questions bonus (max 20 points)
  const followUpQuestions = transcript.filter(t => 
    t.speaker === 'user' && t.text.includes('?') &&
    transcript.indexOf(t) > 0 &&
    (transcript[transcript.indexOf(t) - 1].speaker === 'austin' || 
     transcript[transcript.indexOf(t) - 1].speaker === 'homeowner')
  )
  listeningScore += Math.min(20, followUpQuestions.length * 8)
  
  // Perfect listening bonus (max 10 points)
  const noInterruptions = transcript.filter((t, i) => 
    i > 0 && t.speaker === 'user' && 
    transcript[i-1].speaker === 'user'
  ).length === 0
  
  if (noInterruptions && qualityQuestions.length >= 3) {
    listeningScore += 10
  }
  
  analysis.scores.listening = Math.min(100, listeningScore)

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

  // Harsh scoring for sales technique - comprehensive evaluation
  let salesScore = 0
  
  // Price discussion quality (max 20 points)
  if (analysis.keyMoments.priceDiscussed) {
    const priceEntries = transcript.filter(t => 
      t.text.toLowerCase().includes('price') || 
      t.text.toLowerCase().includes('cost') || 
      t.text.toLowerCase().includes('$')
    )
    const hasValueBuilding = priceEntries.some(entry => {
      const entryIdx = transcript.indexOf(entry)
      return entryIdx > 0 && transcript[entryIdx - 1].speaker === 'user' &&
        (transcript[entryIdx - 1].text.toLowerCase().includes('value') ||
         transcript[entryIdx - 1].text.toLowerCase().includes('investment') ||
         transcript[entryIdx - 1].text.toLowerCase().includes('protection'))
    })
    salesScore += hasValueBuilding ? 20 : 10
  }
  
  // Safety addressed comprehensively (max 20 points)  
  if (analysis.keyMoments.safetyAddressed) {
    const safetyMentions = transcript.filter(t => 
      t.speaker === 'user' && (
        t.text.toLowerCase().includes('safe') ||
        t.text.toLowerCase().includes('pet') ||
        t.text.toLowerCase().includes('child') ||
        t.text.toLowerCase().includes('eco')
      )
    )
    salesScore += safetyMentions.length >= 2 ? 20 : 12
  }
  
  // Presentation quality (max 25 points)
  if (presentationEntries.length > 0) {
    const hasFeatures = transcript.some(t => 
      t.speaker === 'user' && 
      t.text.toLowerCase().includes('guarantee')
    )
    const hasBenefits = transcript.some(t => 
      t.speaker === 'user' && 
      t.text.toLowerCase().includes('protect')
    )
    const hasProof = transcript.some(t => 
      t.speaker === 'user' && (
        t.text.toLowerCase().includes('experience') ||
        t.text.toLowerCase().includes('years')
      )
    )
    
    let presentationScore = 10 // Base for having presentation
    if (hasFeatures) presentationScore += 5
    if (hasBenefits) presentationScore += 5  
    if (hasProof) presentationScore += 5
    
    salesScore += presentationScore
  }
  
  // Objection handling mastery (max 25 points)
  if (analysis.keyMoments.objectionHandled) {
    const objections = transcript.filter(t =>
      (t.speaker === 'austin' || t.speaker === 'homeowner') && (
        t.text.toLowerCase().includes("can't") ||
        t.text.toLowerCase().includes('expensive') ||
        t.text.toLowerCase().includes('not interested') ||
        t.text.toLowerCase().includes('busy') ||
        t.text.toLowerCase().includes('think about it')
      )
    )
    
    const masterfulHandling = objections.every((obj, idx) => {
      const objIdx = transcript.indexOf(obj)
      const response = transcript[objIdx + 1]
      return response && response.speaker === 'user' && (
        response.text.toLowerCase().includes('understand') ||
        response.text.toLowerCase().includes('appreciate') ||
        response.text.toLowerCase().includes('many homeowners feel')
      )
    })
    
    salesScore += masterfulHandling && objections.length >= 1 ? 25 : 15
  }
  
  // Perfect technique bonus (max 10 points)
  const noWastedWords = transcript.filter(t => 
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('um') ||
      t.text.toLowerCase().includes('uh') ||
      t.text.toLowerCase().includes('i think') ||
      t.text.toLowerCase().includes('maybe')
    )
  ).length === 0
  
  if (noWastedWords && analysis.keyMoments.priceDiscussed && 
      analysis.keyMoments.safetyAddressed && presentationEntries.length > 0) {
    salesScore += 10
  }
  
  analysis.scores.salesTechnique = Math.min(100, salesScore)

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

  // Harsh scoring for closing - assumptive close required
  let closingScore = 0
  
  if (analysis.keyMoments.closeAttempted) {
    // Quality of close attempts
    const assumptiveCloses = transcript.filter(t => 
      t.speaker === 'user' && (
        t.text.toLowerCase().includes('i have two appointments') ||
        t.text.toLowerCase().includes('which works better') ||
        t.text.toLowerCase().includes('when would you prefer') ||
        t.text.toLowerCase().includes('lets get started')
      )
    )
    
    const tentativeCloses = closingEntries.filter(entry =>
      entry.text.toLowerCase().includes('would you like') ||
      entry.text.toLowerCase().includes('are you interested')
    )
    
    // Assumptive closes get full points
    if (assumptiveCloses.length >= 1) {
      closingScore += 40
    } else if (tentativeCloses.length >= 1) {
      closingScore += 20 // Penalty for tentative closing
    } else {
      closingScore += 10 // Minimal points for any close attempt
    }
    
    // Multiple close attempts bonus
    if (closingEntries.length >= 2) closingScore += 15
    
    // Trial close before final close bonus
    const trialCloses = transcript.filter(t => 
      t.speaker === 'user' && (
        t.text.toLowerCase().includes('does that make sense') ||
        t.text.toLowerCase().includes('how does that sound')
      )
    )
    if (trialCloses.length >= 1) closingScore += 15
    
    // Perfect close bonus - ended with rep speaking
    if (transcript[transcript.length - 1]?.speaker === 'user') {
      closingScore += 15
    }
    
    // Urgency creation bonus
    const hasUrgency = transcript.some(t => 
      t.speaker === 'user' && (
        t.text.toLowerCase().includes('today only') ||
        t.text.toLowerCase().includes('limited availability') ||
        t.text.toLowerCase().includes('seasonal')
      )
    )
    if (hasUrgency) closingScore += 15
  }
  
  analysis.scores.closing = Math.min(100, closingScore)

  // Harsh scoring for rapport - genuine connection required
  let rapportScore = 0
  
  // Initial rapport building (max 25 points)
  if (hasRapport) rapportScore += 25
  
  // Continuous rapport maintenance (max 40 points)
  const genuineRapport = transcript.filter(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('i understand how you feel') ||
      t.text.toLowerCase().includes('many homeowners have told me') ||
      t.text.toLowerCase().includes('that makes perfect sense') ||
      t.text.toLowerCase().includes('i appreciate you sharing')
    )
  ).length
  
  const genericResponses = transcript.filter(t =>
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('great') ||
      t.text.toLowerCase().includes('excellent') ||
      t.text.toLowerCase().includes('absolutely') ||
      t.text.toLowerCase().includes('definitely')
    )
  ).length
  
  // Reward genuine rapport, penalize generic responses
  rapportScore += Math.min(40, genuineRapport * 15)
  rapportScore -= Math.max(0, (genericResponses - genuineRapport) * 5)
  
  // Mirroring and matching bonus (max 20 points)
  const customerTone = customerResponses.some(r => 
    r.text.length > 100 || r.text.includes('!')
  ) ? 'energetic' : 'reserved'
  
  const repMatchesTone = customerTone === 'energetic' ? 
    transcript.filter(t => t.speaker === 'user' && t.text.includes('!')).length > 0 :
    transcript.filter(t => t.speaker === 'user' && t.text.length > 50).length >= 3
  
  if (repMatchesTone) rapportScore += 20
  
  // Perfect rapport bonus (max 15 points)
  const noRapportBreaks = transcript.filter(t => 
    t.speaker === 'user' && (
      t.text.toLowerCase().includes('anyway') ||
      t.text.toLowerCase().includes('whatever') ||
      t.text.toLowerCase().includes('but listen')
    )
  ).length === 0
  
  if (noRapportBreaks && genuineRapport >= 2) {
    rapportScore += 15
  }
  
  analysis.scores.rapport = Math.max(0, Math.min(100, rapportScore))

  // Calculate harsh overall score with weighted categories
  const weightedScore = 
    analysis.scores.introduction * 0.15 +      // 15% - First impressions matter
    analysis.scores.rapport * 0.20 +           // 20% - Relationship building crucial  
    analysis.scores.listening * 0.20 +         // 20% - Discovery is key
    analysis.scores.salesTechnique * 0.25 +    // 25% - Core sales skills
    analysis.scores.closing * 0.20             // 20% - Conversion is critical
  
  // Apply perfection penalty - deduct points for any major weakness
  let perfectionPenalty = 0
  const scoreValues = Object.values(analysis.scores)
  
  // Heavy penalty if any category below 70
  scoreValues.forEach(score => {
    if (score < 70) perfectionPenalty += (70 - score) * 0.3
    if (score < 50) perfectionPenalty += (50 - score) * 0.2 // Additional penalty for very poor performance
  })
  
  // Perfect execution bonus - all categories above 90
  let perfectBonus = 0
  if (scoreValues.every(score => score >= 90)) {
    perfectBonus = 5
  }
  
  analysis.overallScore = Math.max(0, Math.min(100, Math.round(weightedScore - perfectionPenalty + perfectBonus)))

  // Generate harsh feedback - high standards required
  if (analysis.scores.introduction >= 90) {
    analysis.feedback.strengths.push("Exceptional introduction - confident and professional")
  } else if (analysis.scores.introduction >= 75) {
    analysis.feedback.improvements.push("Good introduction, but work on smoother delivery and eliminate filler words")
    analysis.feedback.specificTips.push("Practice: 'Good morning! I'm [Name] from [Company]. We specialize in comprehensive pest protection for homeowners like yourself.'")
  } else {
    analysis.feedback.improvements.push("CRITICAL: Poor introduction - first impressions are everything in door-to-door sales")
    analysis.feedback.specificTips.push("Must include: Clear greeting, name/company, value proposition, and genuine compliment")
  }

  if (analysis.scores.rapport >= 85) {
    analysis.feedback.strengths.push("Outstanding rapport building - genuine connection established")
  } else if (analysis.scores.rapport >= 70) {
    analysis.feedback.improvements.push("Good rapport foundation, but use more personalized language over generic responses")
    analysis.feedback.specificTips.push("Replace 'Great!' with 'I understand how you feel' or 'Many homeowners have told me the same thing'")
  } else {
    analysis.feedback.improvements.push("CRITICAL: Poor rapport building - customers buy from people they trust")
    analysis.feedback.specificTips.push("Focus on genuine empathy, mirroring customer tone, and finding common ground")
  }

  if (analysis.scores.listening >= 85) {
    analysis.feedback.strengths.push("Masterful discovery - quality questions led to deep customer engagement")
  } else if (analysis.scores.listening >= 70) {
    analysis.feedback.improvements.push("Good questioning, but focus on quality over quantity - ask follow-up questions")
    analysis.feedback.specificTips.push("After their answer, ask: 'How long has this been going on?' or 'Where else have you noticed this?'")
  } else {
    analysis.feedback.improvements.push("CRITICAL: Poor discovery - you can't solve problems you don't understand")
    analysis.feedback.specificTips.push("Ask open-ended questions: 'What pest issues concern you most?' and LISTEN to their full answer")
  }

  if (analysis.scores.salesTechnique >= 90) {
    analysis.feedback.strengths.push("Exceptional sales technique - comprehensive value presentation")
  } else if (analysis.scores.salesTechnique >= 75) {
    analysis.feedback.improvements.push("Good sales foundation, but ensure you build value before discussing price")
  } else {
    analysis.feedback.improvements.push("CRITICAL: Weak sales technique - missing key elements of effective presentations")
  }

  if (!analysis.keyMoments.safetyAddressed) {
    analysis.feedback.improvements.push("MUST ADDRESS: Safety concerns are critical for pest control sales")
    analysis.feedback.specificTips.push("Always mention: 'Everything we use is completely safe for your family and pets - that's our guarantee'")
  }

  if (analysis.scores.closing >= 85) {
    analysis.feedback.strengths.push("Excellent closing technique - assumptive and confident")
  } else if (analysis.scores.closing >= 70) {
    analysis.feedback.improvements.push("Good closing attempt, but be more assumptive and create urgency")
    analysis.feedback.specificTips.push("Instead of 'Would you like to schedule?' try 'I have two appointments available this week - Tuesday or Thursday, which works better?'")
  } else if (analysis.keyMoments.closeAttempted) {
    analysis.feedback.improvements.push("CRITICAL: Weak closing technique - avoid tentative language")
    analysis.feedback.specificTips.push("Never ask IF they want service - assume they do and ask WHEN")
  } else {
    analysis.feedback.improvements.push("CRITICAL: No closing attempt - you cannot make sales without asking for them")
    analysis.feedback.specificTips.push("Always close with: 'I have availability this Thursday or Friday - which works better for you?'")
  }

  if (analysis.keyMoments.objectionHandled && analysis.scores.salesTechnique >= 80) {
    analysis.feedback.strengths.push("Professional objection handling with empathy and expertise")
  }

  return analysis
}

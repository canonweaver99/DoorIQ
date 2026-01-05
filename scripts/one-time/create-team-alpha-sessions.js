/**
 * Create Test Sessions for Team Alpha
 * Creates 10 random recent sessions for each Team Alpha member (manager + 17 reps)
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Agents will be fetched from database
let AGENTS = []

const STRENGTHS = [
  'Strong opening introduction',
  'Excellent rapport building',
  'Clear value proposition',
  'Effective objection handling',
  'Confident closing technique',
  'Active listening skills',
  'Professional demeanor',
  'Good pacing and flow'
]

const IMPROVEMENTS = [
  'Work on handling price objections',
  'Improve needs discovery questions',
  'Reduce filler words',
  'Build stronger rapport early',
  'Practice closing techniques',
  'Address safety concerns proactively',
  'Listen more actively',
  'Reduce interruptions'
]

const TIPS = [
  'Try asking more open-ended questions',
  'Pause after presenting value to let it sink in',
  'Address objections before they become concerns',
  'Use assumptive language when appropriate',
  'Match the homeowner\'s energy level'
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateScore(baseScore, variance = 15) {
  const score = baseScore + randomInt(-variance, variance)
  return Math.max(0, Math.min(100, score))
}

function generateRecentDate(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(randomInt(9, 17))
  date.setMinutes(randomInt(0, 59))
  date.setSeconds(randomInt(0, 59))
  return date.toISOString()
}

function generateTranscript() {
  const lines = [
    { speaker: 'rep', text: 'Hi there! I\'m from DoorIQ, and I wanted to introduce you to our innovative home security solution.' },
    { speaker: 'homeowner', text: 'Oh, I\'m not really interested right now.' },
    { speaker: 'rep', text: 'I totally understand. Can I ask what concerns you most about home security?' },
    { speaker: 'homeowner', text: 'Well, I guess I worry about break-ins, but everything seems so expensive.' },
    { speaker: 'rep', text: 'That\'s a valid concern. Our system actually starts at just $29 a month, which is less than most people spend on coffee.' },
    { speaker: 'homeowner', text: 'Really? That\'s more reasonable than I thought.' },
    { speaker: 'rep', text: 'Absolutely. And we offer a 30-day money-back guarantee, so there\'s no risk to try it.' },
    { speaker: 'homeowner', text: 'Hmm, that does sound interesting. Can you tell me more about how it works?' },
    { speaker: 'rep', text: 'Of course! Our system uses AI-powered sensors that detect unusual activity and alert you immediately.' },
    { speaker: 'homeowner', text: 'That sounds pretty advanced. How do I get started?' }
  ]
  
  return lines.map((line, index) => ({
    line_number: index + 1,
    speaker: line.speaker,
    text: line.text,
    timestamp: index * 30,
    effectiveness: randomChoice(['excellent', 'good', 'average', 'poor']),
    score: randomInt(60, 95)
  }))
}

function generateAnalytics(scores) {
  const strengths = randomChoices(STRENGTHS, randomInt(2, 4))
  const improvements = randomChoices(IMPROVEMENTS, randomInt(2, 4))
  
  return {
    feedback: {
      strengths: strengths,
      improvements: improvements,
      specific_tips: randomChoices(TIPS, randomInt(2, 3))
    },
    line_ratings: generateTranscript().map((line, idx) => ({
      line_number: idx + 1,
      effectiveness: line.effectiveness,
      score: line.score,
      category: randomChoice(['introduction', 'rapport', 'discovery', 'objection', 'closing']),
      improvement_notes: line.effectiveness === 'poor' ? 'Could be more engaging' : null
    })),
    scores: {
      introduction: scores.introduction_score,
      listening: scores.listening_score,
      speaking_pace: randomInt(70, 90),
      filler_words: randomInt(75, 95),
      question_ratio: randomInt(65, 85),
      active_listening: scores.listening_score,
      assumptive_language: randomInt(70, 90)
    },
    conversation_dynamics: {
      interruptions_count: randomInt(0, 3),
      filler_words_count: randomInt(5, 15),
      questions_asked: randomInt(8, 15),
      homeowner_engagement: randomChoice(['high', 'moderate', 'low'])
    },
    timeline_key_moments: [
      { timestamp: 30, event: 'Introduction made', type: 'positive' },
      { timestamp: 120, event: 'Objection raised', type: 'challenge' },
      { timestamp: 180, event: 'Objection resolved', type: 'positive' },
      { timestamp: 300, event: 'Value presented', type: 'positive' },
      { timestamp: 450, event: 'Closing attempted', type: 'positive' }
    ],
    grading_version: '2.0',
    graded_at: new Date().toISOString()
  }
}

async function createSessionForUser(userId, userEmail, sessionNumber) {
  // Generate random dates within last 60 days
  const daysAgo = randomInt(0, 60)
  const startedAt = generateRecentDate(daysAgo)
  const startedDate = new Date(startedAt)
  
  // Session duration between 5-15 minutes
  const durationSeconds = randomInt(300, 900)
  const endedAt = new Date(startedDate.getTime() + durationSeconds * 1000).toISOString()
  
  // Base scores vary by user performance level (simulate some users better than others)
  const userHash = userId.split('-')[0]
  const performanceLevel = parseInt(userHash, 16) % 3 // 0=beginner, 1=intermediate, 2=advanced
  
  let baseScores = {}
  if (performanceLevel === 0) {
    // Beginner: scores 50-75
    baseScores = {
      rapport: randomInt(50, 75),
      discovery: randomInt(50, 75),
      objection: randomInt(45, 70),
      closing: randomInt(40, 70),
      safety: randomInt(60, 80),
      introduction: randomInt(55, 75),
      listening: randomInt(50, 75)
    }
  } else if (performanceLevel === 1) {
    // Intermediate: scores 65-85
    baseScores = {
      rapport: randomInt(65, 85),
      discovery: randomInt(65, 85),
      objection: randomInt(60, 80),
      closing: randomInt(60, 80),
      safety: randomInt(70, 90),
      introduction: randomInt(70, 85),
      listening: randomInt(65, 85)
    }
  } else {
    // Advanced: scores 75-95
    baseScores = {
      rapport: randomInt(75, 95),
      discovery: randomInt(75, 95),
      objection: randomInt(70, 90),
      closing: randomInt(70, 90),
      safety: randomInt(80, 95),
      introduction: randomInt(80, 95),
      listening: randomInt(75, 95)
    }
  }
  
  // Generate scores with some variance
  const rapportScore = generateScore(baseScores.rapport)
  const discoveryScore = generateScore(baseScores.discovery)
  const objectionScore = generateScore(baseScores.objection)
  const closingScore = generateScore(baseScores.closing)
  const safetyScore = generateScore(baseScores.safety)
  const introductionScore = generateScore(baseScores.introduction)
  const listeningScore = generateScore(baseScores.listening)
  
  // Calculate overall score (average of core metrics)
  const overallScore = Math.round(
    (rapportScore + discoveryScore + objectionScore + closingScore) / 4
  )
  
  // Determine if sale closed (higher scores = more likely)
  const saleClosed = overallScore >= 70 && Math.random() > 0.4
  
  // Calculate virtual earnings (based on score and whether sale closed)
  let virtualEarnings = 0
  if (saleClosed) {
    virtualEarnings = Math.round(overallScore * 2.5 + randomInt(50, 200))
  } else if (overallScore >= 60) {
    virtualEarnings = Math.round(overallScore * 1.5)
  } else {
    virtualEarnings = Math.round(overallScore * 0.8)
  }
  
  const agent = randomChoice(AGENTS)
  
  const session = {
    id: crypto.randomUUID(),
    created_at: startedAt,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: durationSeconds,
    user_id: userId,
    agent_name: agent.name,
    overall_score: overallScore,
    rapport_score: rapportScore,
    objection_handling_score: objectionScore,
    close_effectiveness_score: closingScore,
    discovery_score: discoveryScore,
    introduction_score: introductionScore,
    listening_score: listeningScore,
    virtual_earnings: virtualEarnings,
    sale_closed: saleClosed,
    full_transcript: generateTranscript(),
    analytics: generateAnalytics({
      rapport_score: rapportScore,
      discovery_score: discoveryScore,
      objection_handling_score: objectionScore,
      close_effectiveness_score: closingScore,
      introduction_score: introductionScore,
      listening_score: listeningScore
    })
  }
  
  return session
}

async function createSessionsForTeamAlpha() {
  console.log('🚀 Creating sessions for Team Alpha...\n')
  
  try {
    // Fetch real agents from database
    console.log('📡 Fetching agents from database...')
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, persona')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (agentsError) {
      throw new Error(`Failed to fetch agents: ${agentsError?.message}`)
    }
    
    if (!agentsData || agentsData.length === 0) {
      throw new Error('No active agents found in database. Please ensure agents are created first.')
    }
    
    // Map agents to the format expected by the script
    AGENTS = agentsData.map(agent => ({
      id: agent.id,
      name: agent.name,
      persona: agent.persona || 'Homeowner'
    }))
    
    console.log(`✅ Found ${AGENTS.length} active agents:`)
    AGENTS.forEach(agent => {
      console.log(`   - ${agent.name}${agent.persona ? ` (${agent.persona})` : ''}`)
    })
    console.log('')
    
    // Get Team Alpha
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('name', 'Team Alpha')
      .single()
    
    if (teamError || !team) {
      throw new Error(`Team Alpha not found: ${teamError?.message}`)
    }
    
    console.log(`✅ Found team: ${team.name} (${team.id})\n`)
    
    // Get all Team Alpha members (manager + reps)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('team_id', team.id)
    
    if (membersError || !members) {
      throw new Error(`Failed to fetch team members: ${membersError?.message}`)
    }
    
    console.log(`📋 Found ${members.length} team members:`)
    members.forEach(m => {
      console.log(`   - ${m.full_name} (${m.email}) - ${m.role}`)
    })
    console.log('')
    
    const totalSessions = members.length * 10
    console.log(`📊 Creating ${totalSessions} sessions (10 per member)...\n`)
    
    let createdCount = 0
    let errorCount = 0
    
    for (const member of members) {
      console.log(`👤 Creating sessions for ${member.full_name}...`)
      
      for (let i = 1; i <= 10; i++) {
        try {
          const session = await createSessionForUser(member.id, member.email, i)
          
          const { error: insertError } = await supabase
            .from('live_sessions')
            .insert(session)
          
          if (insertError) {
            console.error(`   ❌ Session ${i} failed:`, insertError.message)
            errorCount++
          } else {
            createdCount++
            if (i % 5 === 0) {
              console.log(`   ✅ Created ${i}/10 sessions...`)
            }
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          console.error(`   ❌ Error creating session ${i}:`, error.message)
          errorCount++
        }
      }
      
      console.log(`   ✅ Completed ${member.full_name}\n`)
    }
    
    // Update user virtual_earnings based on their sessions
    console.log('💰 Updating user virtual earnings...')
    for (const member of members) {
      const { data: userSessions } = await supabase
        .from('live_sessions')
        .select('virtual_earnings')
        .eq('user_id', member.id)
      
      if (userSessions && userSessions.length > 0) {
        const totalEarnings = userSessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0)
        
        await supabase
          .from('users')
          .update({ virtual_earnings: totalEarnings })
          .eq('id', member.id)
        
        console.log(`   ✅ ${member.full_name}: $${totalEarnings.toFixed(2)}`)
      }
    }
    
    console.log(`\n✅ Session creation complete!`)
    console.log(`   - Created: ${createdCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - Total sessions: ${createdCount}`)
    console.log(`\n🎉 Team Alpha now has realistic session data!`)
    console.log(`   - Individual rep analytics pages will show their 10 sessions`)
    console.log(`   - Manager panel will show aggregated team analytics`)
    
  } catch (error) {
    console.error('\n❌ Error creating sessions:', error)
    console.error('   Details:', error.message)
    process.exit(1)
  }
}

createSessionsForTeamAlpha()


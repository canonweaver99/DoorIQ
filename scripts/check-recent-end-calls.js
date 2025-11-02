/**
 * Script to check recent session end calls and their triggers
 * This helps debug premature auto-end issues
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRecentEndCalls() {
  console.log('🔍 Checking recent session end calls...\n')

  try {
    // Get recent sessions (last 10, ordered by created_at)
    const { data: sessions, error } = await supabase
      .from('live_sessions')
      .select('id, created_at, started_at, ended_at, duration_seconds, agent_name, full_transcript')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching sessions:', error)
      return
    }

    if (!sessions || sessions.length === 0) {
      console.log('No recent sessions found')
      return
    }

    console.log(`Found ${sessions.length} recent sessions:\n`)

    sessions.forEach((session, index) => {
      const duration = session.duration_seconds || 0
      const durationMins = Math.floor(duration / 60)
      const durationSecs = duration % 60
      const durationStr = `${durationMins}:${durationSecs.toString().padStart(2, '0')}`

      const startedAt = new Date(session.started_at)
      const endedAt = session.ended_at ? new Date(session.ended_at) : null
      const transcript = session.full_transcript || []

      // Analyze transcript for potential triggers
      const lastAgentMessage = [...transcript]
        .reverse()
        .find(msg => msg.speaker === 'homeowner')
      
      const lastUserMessage = [...transcript]
        .reverse()
        .find(msg => msg.speaker === 'user')

      // Check for goodbye phrases
      const lastAgentText = lastAgentMessage?.text?.toLowerCase() || ''
      const goodbyePhrases = [
        'goodbye', 'bye', 'see you', 'thanks for stopping', 
        'closing the door', "we're done", 'have a good day'
      ]
      const hasGoodbye = goodbyePhrases.some(phrase => 
        lastAgentText.includes(phrase)
      )

      // Check transcript length
      const transcriptLength = transcript.length

      console.log(`\n${'='.repeat(80)}`)
      console.log(`Session ${index + 1}: ${session.id.substring(0, 8)}...`)
      console.log(`Agent: ${session.agent_name || 'Unknown'}`)
      console.log(`Duration: ${durationStr} (${duration} seconds)`)
      console.log(`Started: ${startedAt.toLocaleString()}`)
      console.log(`Ended: ${endedAt ? endedAt.toLocaleString() : 'Not ended yet'}`)
      console.log(`Transcript lines: ${transcriptLength}`)
      
      if (lastAgentMessage) {
        console.log(`\nLast Agent Message:`)
        console.log(`  "${lastAgentMessage.text}"`)
        if (hasGoodbye) {
          console.log(`  ⚠️  Contains goodbye phrase (may have triggered auto-end)`)
        }
      }

      if (lastUserMessage) {
        console.log(`\nLast User Message:`)
        console.log(`  "${lastUserMessage.text}"`)
      }

      // Check if duration seems premature (< 3 minutes but has transcript)
      if (duration < 180 && transcriptLength > 10) {
        console.log(`\n⚠️  SHORT SESSION WARNING:`)
        console.log(`  Session ended after ${durationStr} but has ${transcriptLength} transcript lines`)
        console.log(`  This may indicate premature auto-end`)
      }

      // Check if there's a long gap (silence detection)
      if (transcriptLength > 0 && endedAt) {
        const lastTranscriptTime = transcript[transcript.length - 1]?.timestamp
          ? new Date(transcript[transcript.length - 1].timestamp)
          : null
        
        if (lastTranscriptTime) {
          const gapSeconds = Math.floor((endedAt - lastTranscriptTime) / 1000)
          if (gapSeconds > 20) {
            console.log(`\n⚠️  SILENCE DETECTION:`)
            console.log(`  ${gapSeconds} seconds between last transcript and end time`)
            console.log(`  May have been triggered by silence timeout`)
          }
        }
      }
    })

    console.log(`\n${'='.repeat(80)}`)
    console.log('\n💡 Tips for debugging:')
    console.log('  1. Check browser console for log messages starting with 🔚')
    console.log('  2. Look for messages like "No activity for 30 seconds"')
    console.log('  3. Look for "Agent response ends with clear goodbye phrase"')
    console.log('  4. Look for "Connection disconnected" messages')
    console.log('\nTo see console logs, open browser DevTools (F12) and check Console tab')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkRecentEndCalls()


/**
 * Create Sample Messages for Team Alpha
 * Creates realistic sample conversations between Manager Alpha and several reps
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample conversation templates
const CONVERSATIONS = [
  {
    repIndex: 0, // First rep
    messages: [
      {
        sender: 'manager',
        text: 'Hey! Great job on your session with Austin today. Your objection handling has really improved.',
        hoursAgo: 2
      },
      {
        sender: 'rep',
        text: 'Thanks! I\'ve been practicing that price objection response. Still working on closing stronger though.',
        hoursAgo: 1.5
      },
      {
        sender: 'manager',
        text: 'You\'re getting there. Try using more assumptive language when you sense they\'re ready. Want to review your last session together?',
        hoursAgo: 1
      },
      {
        sender: 'rep',
        text: 'That would be great! When works for you?',
        hoursAgo: 0.5
      }
    ]
  },
  {
    repIndex: 1, // Second rep
    messages: [
      {
        sender: 'manager',
        text: 'Quick check-in: How are you feeling about your sessions this week?',
        hoursAgo: 18
      },
      {
        sender: 'rep',
        text: 'Pretty good! I closed 2 sales in practice today. Nancy is definitely easier than Alan though 😅',
        hoursAgo: 16
      },
      {
        sender: 'manager',
        text: 'Haha, Alan is tough! But practicing with him will make you better. Keep pushing!',
        hoursAgo: 15
      }
    ]
  },
  {
    repIndex: 2, // Third rep
    messages: [
      {
        sender: 'rep',
        text: 'Hey, I had a question about handling the "I need to check with my spouse" objection.',
        hoursAgo: 48
      },
      {
        sender: 'manager',
        text: 'Great question! The key is building urgency before they even mention their spouse. Try asking "What would your spouse say if you told them about this opportunity?"',
        hoursAgo: 47
      },
      {
        sender: 'rep',
        text: 'That\'s a good approach. I\'ll try that in my next session with Spouse Check Susan.',
        hoursAgo: 46
      },
      {
        sender: 'manager',
        text: 'Perfect! Let me know how it goes.',
        hoursAgo: 45
      }
    ]
  },
  {
    repIndex: 3, // Fourth rep
    messages: [
      {
        sender: 'manager',
        text: 'Your scores have been consistently improving! Keep up the great work.',
        hoursAgo: 72
      },
      {
        sender: 'rep',
        text: 'Thank you! I\'ve been focusing on my listening skills and it\'s making a big difference.',
        hoursAgo: 70
      },
      {
        sender: 'manager',
        text: 'That\'s exactly what I wanted to hear. Active listening is one of the most important skills.',
        hoursAgo: 69
      }
    ]
  },
  {
    repIndex: 4, // Fifth rep
    messages: [
      {
        sender: 'rep',
        text: 'Just finished a session with Not Interested Nick. That was intense!',
        hoursAgo: 6
      },
      {
        sender: 'manager',
        text: 'Nick is definitely challenging. How did you handle the opening?',
        hoursAgo: 5
      },
      {
        sender: 'rep',
        text: 'I used that pattern interrupt you showed me - asked about his garden instead of going straight into the pitch.',
        hoursAgo: 4
      },
      {
        sender: 'manager',
        text: 'Smart move! That\'s the right approach with Nick. Keep practicing with him.',
        hoursAgo: 3
      }
    ]
  }
]

/**
 * Generate timestamp X hours ago
 */
function getTimestampHoursAgo(hoursAgo) {
  const date = new Date()
  date.setHours(date.getHours() - hoursAgo)
  return date.toISOString()
}

/**
 * Main function to create sample messages
 */
async function createTeamAlphaSampleMessages() {
  console.log('🚀 Creating sample messages for Team Alpha...\n')
  
  try {
    // Get Team Alpha team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('name', 'Team Alpha')
      .single()
    
    if (teamError || !team) {
      throw new Error(`Team Alpha not found: ${teamError?.message}`)
    }
    
    console.log(`✅ Found team: ${team.name} (${team.id})\n`)
    
    // Get Manager Alpha
    const { data: manager, error: managerError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('team_id', team.id)
      .eq('role', 'manager')
      .single()
    
    if (managerError || !manager) {
      throw new Error(`Manager Alpha not found: ${managerError?.message}`)
    }
    
    console.log(`✅ Found manager: ${manager.full_name} (${manager.id})\n`)
    
    // Get Team Alpha reps
    const { data: reps, error: repsError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('team_id', team.id)
      .eq('role', 'rep')
      .order('email', { ascending: true })
    
    if (repsError || !reps) {
      throw new Error(`Failed to fetch reps: ${repsError?.message}`)
    }
    
    if (reps.length === 0) {
      throw new Error('No reps found for Team Alpha')
    }
    
    console.log(`📋 Found ${reps.length} reps\n`)
    
    let createdCount = 0
    let errorCount = 0
    
    // Create conversations
    for (const conversation of CONVERSATIONS) {
      const repIndex = conversation.repIndex
      
      if (repIndex >= reps.length) {
        console.log(`⚠️  Skipping conversation - rep index ${repIndex} out of range`)
        continue
      }
      
      const rep = reps[repIndex]
      console.log(`💬 Creating conversation with ${rep.full_name}...`)
      
      for (const message of conversation.messages) {
        const senderId = message.sender === 'manager' ? manager.id : rep.id
        const recipientId = message.sender === 'manager' ? rep.id : manager.id
        const timestamp = getTimestampHoursAgo(message.hoursAgo)
        
        // Determine if message should be read
        // Manager's messages to rep are usually read, rep's messages to manager might be unread
        const isRead = message.sender === 'rep' ? Math.random() > 0.3 : true
        
        try {
          const { error: insertError } = await supabase
            .from('messages')
            .insert({
              sender_id: senderId,
              recipient_id: recipientId,
              message: message.text,
              created_at: timestamp,
              is_read: isRead,
              read_at: isRead ? timestamp : null
            })
          
          if (insertError) {
            throw insertError
          }
          
          createdCount++
        } catch (error) {
          console.error(`   ❌ Error creating message:`, error.message)
          errorCount++
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(`   ✅ Created ${conversation.messages.length} messages\n`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Message creation complete!`)
    console.log(`   Created: ${createdCount} messages`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`   Conversations: ${CONVERSATIONS.length}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
createTeamAlphaSampleMessages()


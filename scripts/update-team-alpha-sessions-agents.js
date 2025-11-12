/**
 * Update Team Alpha Sessions with Real Agent Names
 * Updates all existing sessions for Team Alpha reps to use real agent names (Austin, Nancy, Alan, etc.)
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

/**
 * Main function to update Team Alpha sessions
 */
async function updateTeamAlphaSessionsAgents() {
  console.log('🚀 Updating Team Alpha sessions with real agent names...\n')
  
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
    
    // Get all active agents from database
    console.log('📡 Fetching active agents from database...')
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
    
    const agentNames = agentsData.map(agent => agent.name)
    console.log(`✅ Found ${agentNames.length} active agents:`)
    agentNames.forEach(name => console.log(`   - ${name}`))
    console.log('')
    
    // Get all Team Alpha rep IDs
    const { data: reps, error: repsError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('team_id', team.id)
      .eq('role', 'rep')
    
    if (repsError || !reps) {
      throw new Error(`Failed to fetch reps: ${repsError?.message}`)
    }
    
    const repIds = reps.map(rep => rep.id)
    console.log(`📋 Found ${repIds.length} Team Alpha reps\n`)
    
    // Get all sessions for Team Alpha reps
    console.log('📊 Fetching sessions for Team Alpha reps...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('live_sessions')
      .select('id, user_id, agent_name, created_at')
      .in('user_id', repIds)
      .order('created_at', { ascending: false })
    
    if (sessionsError) {
      throw new Error(`Failed to fetch sessions: ${sessionsError?.message}`)
    }
    
    if (!sessions || sessions.length === 0) {
      console.log('⚠️  No sessions found for Team Alpha reps.')
      console.log('💡 You may need to run create-team-alpha-sessions.js first.')
      return
    }
    
    console.log(`✅ Found ${sessions.length} sessions to update\n`)
    
    let updatedCount = 0
    let errorCount = 0
    
    // Update each session with a random agent name
    for (const session of sessions) {
      // Randomly select an agent name
      const randomAgentName = agentNames[Math.floor(Math.random() * agentNames.length)]
      
      // Only update if agent_name is different or null/empty
      if (session.agent_name !== randomAgentName) {
        try {
          const { error: updateError } = await supabase
            .from('live_sessions')
            .update({ agent_name: randomAgentName })
            .eq('id', session.id)
          
          if (updateError) {
            throw updateError
          }
          
          updatedCount++
          
          // Log progress every 10 sessions
          if (updatedCount % 10 === 0) {
            console.log(`   ✅ Updated ${updatedCount}/${sessions.length} sessions...`)
          }
        } catch (error) {
          console.error(`   ❌ Error updating session ${session.id}:`, error.message)
          errorCount++
        }
      } else {
        // Session already has this agent name, skip
        updatedCount++
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Update complete!`)
    console.log(`   Total sessions: ${sessions.length}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Errors: ${errorCount}`)
    console.log(`\n📊 Agent distribution:`)
    
    // Show distribution of agents
    const { data: updatedSessions } = await supabase
      .from('live_sessions')
      .select('agent_name')
      .in('user_id', repIds)
    
    if (updatedSessions) {
      const agentCounts = {}
      updatedSessions.forEach(s => {
        const agent = s.agent_name || 'Unknown'
        agentCounts[agent] = (agentCounts[agent] || 0) + 1
      })
      
      Object.entries(agentCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([agent, count]) => {
          console.log(`   ${agent}: ${count} sessions`)
        })
    }
    
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
updateTeamAlphaSessionsAgents()


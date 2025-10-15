/**
 * Check Invites
 * Debug team invites
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkInvites() {
  console.log('🔍 Checking team invites...\n')

  try {
    // Get all invites
    const { data: invites, error } = await supabase
      .from('team_invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching invites:', error)
      return
    }

    console.log(`Found ${invites.length} recent invites:\n`)

    for (const invite of invites) {
      console.log(`Invite ID: ${invite.id}`)
      console.log(`  Token: ${invite.token.substring(0, 20)}...`)
      console.log(`  Email: ${invite.email}`)
      console.log(`  Role: ${invite.role}`)
      console.log(`  Status: ${invite.status}`)
      console.log(`  Team ID: ${invite.team_id}`)
      console.log(`  Invited By: ${invite.invited_by}`)
      console.log(`  Expires: ${new Date(invite.expires_at).toLocaleString()}`)
      console.log(`  Created: ${new Date(invite.created_at).toLocaleString()}`)
      
      // Check if team exists
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', invite.team_id)
        .single()

      if (teamError) {
        console.log(`  ⚠️  Team not found! This could cause "Invalid invite" errors`)
      } else {
        console.log(`  Team: ${team.name}`)
      }

      // Check if inviter exists
      const { data: inviter, error: inviterError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', invite.invited_by)
        .single()

      if (inviterError) {
        console.log(`  ⚠️  Inviter not found!`)
      } else {
        console.log(`  Inviter: ${inviter.full_name} (${inviter.email})`)
      }

      console.log('')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkInvites()


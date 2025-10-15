/**
 * Setup User Team
 * Creates a team for a user if they don't have one
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_EMAIL = 'canonweaver@loopline.design'
const TEAM_NAME = 'Canon\'s Team'

async function setupUserTeam() {
  console.log('🔧 Setting up team for', USER_EMAIL, '...\n')

  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', USER_EMAIL)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return
    }

    console.log('✅ Found user:', user.full_name)
    console.log('   Role:', user.role)

    // Check if user already has a team
    if (user.team_id) {
      console.log('✅ User already has a team!')
      
      // Get team details
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', user.team_id)
        .single()

      console.log('   Team:', team?.name || 'Unknown')
      console.log('   Team ID:', user.team_id)
      console.log('')
      console.log('✅ You can now edit team name in Manager Panel → Settings')
      return
    }

    console.log('⚠️  No team found, creating one...\n')

    // Create a new team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({ 
        name: TEAM_NAME,
        owner_id: user.id 
      })
      .select()
      .single()

    if (teamError) {
      console.error('❌ Error creating team:', teamError)
      return
    }

    console.log('✅ Team created:', newTeam.name)
    console.log('   Team ID:', newTeam.id)

    // Update user's team_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ team_id: newTeam.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user team_id:', updateError)
      return
    }

    console.log('✅ User linked to team!')
    console.log('')
    console.log('🎯 Setup complete!')
    console.log('   - Team created:', newTeam.name)
    console.log('   - User role: manager')
    console.log('   - Can now edit team name in Manager Panel → Settings')
    console.log('')
    console.log('🔄 Refresh your browser to see the changes')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupUserTeam()


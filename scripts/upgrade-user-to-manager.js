/**
 * Upgrade a user to manager, create a team, and add credits
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

async function upgradeToManager(email, teamName, credits) {
  try {
    console.log(`\n👤 Upgrading user: ${email}`)

    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !userData) {
      throw new Error(`User not found: ${userError?.message || 'User does not exist'}`)
    }

    console.log(`   ✅ Found user: ${userData.full_name} (ID: ${userData.id})`)

    // Create a new team with this user as owner
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        owner_id: userData.id
      })
      .select()
      .single()

    if (teamError) {
      throw new Error(`Failed to create team: ${teamError.message}`)
    }

    console.log(`   ✅ Team created: ${teamData.name} (ID: ${teamData.id})`)

    // Update user to be a manager and assign to team
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'manager',
        team_id: teamData.id
      })
      .eq('id', userData.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`)
    }

    console.log(`   ✅ User upgraded to manager`)

    // Update session limits to the specified credits
    const today = new Date().toISOString().split('T')[0]
    const { error: limitsError } = await supabase
      .from('user_session_limits')
      .upsert({
        user_id: userData.id,
        sessions_this_month: 0,
        sessions_limit: credits,
        last_reset_date: today
      }, {
        onConflict: 'user_id'
      })

    if (limitsError) {
      throw new Error(`Failed to update session limits: ${limitsError.message}`)
    }

    console.log(`   ✅ Session limits updated to ${credits} credits`)

    console.log(`\n✅ User upgraded successfully!`)
    console.log(`\n📝 Updated Account Details:`)
    console.log(`   - Email: ${email}`)
    console.log(`   - Full Name: ${updatedUser.full_name}`)
    console.log(`   - User ID: ${updatedUser.id}`)
    console.log(`   - Role: ${updatedUser.role}`)
    console.log(`   - Team: ${teamData.name} (ID: ${teamData.id})`)
    console.log(`   - Credits: ${credits}`)

    return { user: updatedUser, team: teamData, error: null }
  } catch (error) {
    console.error(`\n❌ Error upgrading user:`, error.message)
    return { user: null, team: null, error }
  }
}

// Get parameters from command line arguments
const email = process.argv[2] || 'peterdouglas32@gmail.com'
const teamName = process.argv[3] || `Team ${email.split('@')[0]}`
const credits = parseInt(process.argv[4]) || 100

// Run the script
upgradeToManager(email, teamName, credits)
  .then(({ error }) => {
    if (error) {
      process.exit(1)
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })


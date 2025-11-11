/**
 * Create Missing Managers
 * Creates manager1 and manager2 if they don't exist
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const PASSWORD = 'StinkyButt12'

const MANAGERS = [
  { email: 'manager1@test.dooriq.ai', name: 'Manager Alpha', teamName: 'Team Alpha' },
  { email: 'manager2@test.dooriq.ai', name: 'Manager Beta', teamName: 'Team Beta' }
]

async function createMissingManagers() {
  console.log('🔧 Creating missing managers...\n')

  try {
    // Get all existing users
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const existingEmails = new Set(usersData?.users?.map(u => u.email?.toLowerCase()) || [])

    for (const manager of MANAGERS) {
      const emailLower = manager.email.toLowerCase()
      
      if (existingEmails.has(emailLower)) {
        console.log(`✅ ${manager.email} already exists, updating password...`)
        
        const existingUser = usersData.users.find(u => u.email?.toLowerCase() === emailLower)
        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: PASSWORD,
            email_confirm: true
          })
          console.log(`   ✅ Password updated`)
        }
        continue
      }

      console.log(`\n👤 Creating ${manager.email}...`)

      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: emailLower,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: manager.name }
      })

      if (createError) {
        console.error(`❌ Failed to create ${manager.email}:`, createError.message)
        continue
      }

      console.log(`   ✅ Auth user created: ${newUser.user.id}`)

      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('name', manager.teamName)
        .single()

      const teamId = team?.id || null

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: emailLower,
          full_name: manager.name,
          rep_id: `MGR-${Date.now()}-${manager.email.includes('manager1') ? '1' : '2'}`,
          role: 'manager',
          team_id: teamId,
          virtual_earnings: 0
        })

      if (profileError) {
        if (profileError.code === '23505') {
          // Update existing
          await supabase
            .from('users')
            .update({
              role: 'manager',
              team_id: teamId,
              full_name: manager.name
            })
            .eq('id', newUser.user.id)
          console.log(`   ✅ Updated user profile`)
        } else {
          console.error(`   ❌ Failed to create profile:`, profileError.message)
        }
      } else {
        console.log(`   ✅ Created user profile`)
      }

      // Create session limits
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('user_session_limits')
        .upsert({
          user_id: newUser.user.id,
          sessions_this_month: 0,
          sessions_limit: 5,
          last_reset_date: today
        }, { onConflict: 'user_id' })

      console.log(`   ✅ Created session limits`)
      console.log(`\n✅ ${manager.email} setup complete!`)
    }

    console.log(`\n🎉 All managers created/updated!`)
    console.log(`   Password: ${PASSWORD}`)

  } catch (error) {
    console.error('\n❌ Error creating managers:', error)
    process.exit(1)
  }
}

createMissingManagers()


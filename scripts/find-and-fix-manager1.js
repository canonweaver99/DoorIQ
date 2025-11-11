/**
 * Find and Fix Manager1
 * Finds manager1 by searching all users and fixes password
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

const EMAIL = 'manager1@test.dooriq.ai'
const PASSWORD = 'StinkyButt12'

async function findAndFixManager1() {
  console.log(`🔍 Finding and fixing ${EMAIL}...\n`)

  try {
    // Get ALL users
    let allUsers = []
    let page = 1
    const perPage = 1000
    
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      })
      
      if (error) throw error
      
      if (!data?.users || data.users.length === 0) break
      
      allUsers = allUsers.concat(data.users)
      
      if (data.users.length < perPage) break
      page++
    }

    console.log(`📋 Found ${allUsers.length} total auth users\n`)

    // Search for manager1 - try multiple approaches
    let foundUser = null
    
    // Exact match (case insensitive)
    foundUser = allUsers.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())
    
    if (!foundUser) {
      // Partial match
      foundUser = allUsers.find(u => {
        const e = u.email?.toLowerCase() || ''
        return e.includes('manager1') || e.includes('manager 1')
      })
    }

    if (!foundUser) {
      console.log(`❌ Could not find ${EMAIL} in ${allUsers.length} users`)
      console.log(`\n🔍 Showing all manager emails found:`)
      const managers = allUsers.filter(u => u.email?.includes('manager'))
      managers.forEach(u => {
        console.log(`   - ${u.email} (confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'})`)
      })
      
      // Try creating it fresh
      console.log(`\n🔧 Attempting to create fresh user...`)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL.toLowerCase(),
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Manager Alpha' }
      })

      if (createError) {
        console.error(`❌ Cannot create: ${createError.message}`)
        console.log(`\n⚠️  The user may exist but be hidden or deleted.`)
        console.log(`   Try checking Supabase dashboard directly.`)
        return
      }

      foundUser = newUser.user
      console.log(`✅ Created new user: ${foundUser.id}`)
    } else {
      console.log(`✅ Found user: ${foundUser.email}`)
      console.log(`   ID: ${foundUser.id}`)
      console.log(`   Email confirmed: ${foundUser.email_confirmed_at ? 'Yes' : 'No'}`)
    }

    // Update password
    console.log(`\n🔧 Updating password...`)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      foundUser.id,
      {
        password: PASSWORD,
        email_confirm: true
      }
    )

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`)
    }

    console.log(`✅ Password updated to: ${PASSWORD}`)
    console.log(`✅ Email confirmed`)

    // Check/update profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', foundUser.id)
      .single()

    if (!profile) {
      console.log(`\n⚠️  User profile not found, creating...`)
      
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('name', 'Team Alpha')
        .single()

      await supabase
        .from('users')
        .insert({
          id: foundUser.id,
          email: EMAIL.toLowerCase(),
          full_name: 'Manager Alpha',
          rep_id: `MGR-${Date.now()}-1`,
          role: 'manager',
          team_id: team?.id || null,
          virtual_earnings: 0
        })

      console.log(`✅ Created user profile`)
    } else {
      console.log(`\n✅ User profile exists:`)
      console.log(`   Name: ${profile.full_name}`)
      console.log(`   Role: ${profile.role}`)
      console.log(`   Team: ${profile.team_id || 'None'}`)
    }

    // Ensure session limits
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('user_session_limits')
      .upsert({
        user_id: foundUser.id,
        sessions_this_month: 0,
        sessions_limit: 5,
        last_reset_date: today
      }, { onConflict: 'user_id' })

    console.log(`✅ Session limits set`)

    console.log(`\n🎉 Manager1 is ready!`)
    console.log(`   Email: ${EMAIL}`)
    console.log(`   Password: ${PASSWORD}`)
    console.log(`   You should now be able to login!`)

  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error('   Details:', error.message)
    process.exit(1)
  }
}

findAndFixManager1()


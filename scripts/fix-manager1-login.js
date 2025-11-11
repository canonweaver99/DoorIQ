/**
 * Fix Manager1 Login
 * Checks if manager1 exists and fixes password/login issues
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

async function fixManager1Login() {
  console.log(`🔍 Checking and fixing login for ${EMAIL}...\n`)

  try {
    // List all users to find manager1
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    console.log(`📋 Found ${usersData?.users?.length || 0} total auth users`)

    // Find manager1 by email (case insensitive)
    const authUser = usersData?.users?.find(u => 
      u.email?.toLowerCase() === EMAIL.toLowerCase()
    )

    if (!authUser) {
      console.log(`\n❌ Auth user not found for ${EMAIL}`)
      console.log(`\n🔍 Searching for similar emails...`)
      
      // Show all test users
      const testUsers = usersData?.users?.filter(u => 
        u.email?.includes('test.dooriq.ai')
      )
      
      if (testUsers && testUsers.length > 0) {
        console.log(`\nFound ${testUsers.length} test users:`)
        testUsers.slice(0, 10).forEach(u => {
          console.log(`   - ${u.email} (confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'})`)
        })
      }

      console.log(`\n🔧 Creating new manager1 user...`)
      
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL.toLowerCase(),
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Manager Alpha' }
      })

      if (createError) {
        // If it says already exists, try to find it differently
        if (createError.message?.includes('already')) {
          console.log(`\n⚠️  User exists but wasn't found. Searching all users...`)
          
          // Try to find by listing and checking all variations
          const allUsers = usersData?.users || []
          const found = allUsers.find(u => {
            const userEmail = u.email?.toLowerCase() || ''
            return userEmail === EMAIL.toLowerCase() || 
                   userEmail.includes('manager1') ||
                   (userEmail.includes('manager') && userEmail.includes('test'))
          })
          
          if (found) {
            console.log(`✅ Found user with email: ${found.email}`)
            await updateUserPassword(found.id, found.email)
            return
          }
          
          // If still not found, try deleting and recreating
          console.log(`\n⚠️  User exists but can't be found. This might be a database issue.`)
          console.log(`   Please check Supabase dashboard manually.`)
          throw new Error(`User exists but cannot be located: ${createError.message}`)
        }
        throw new Error(`Failed to create auth user: ${createError.message}`)
      }

      console.log(`✅ Created auth user: ${newUser.user.id}`)
      await setupUserProfile(newUser.user.id)
      console.log(`\n✅ Manager1 created successfully!`)
      console.log(`   Email: ${EMAIL}`)
      console.log(`   Password: ${PASSWORD}`)
      return
    }

    console.log(`✅ Found auth user: ${authUser.id}`)
    console.log(`   Email: ${authUser.email}`)
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`)
    
    await updateUserPassword(authUser.id, authUser.email)
    
  } catch (error) {
    console.error('\n❌ Error fixing manager1 login:', error)
    console.error('   Details:', error.message)
    process.exit(1)
  }
}

async function updateUserPassword(userId, userEmail) {
  console.log(`\n🔧 Updating password for ${userEmail}...`)
  
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { 
      password: PASSWORD,
      email_confirm: true // Ensure email is confirmed
    }
  )

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`)
  }

  console.log(`✅ Password updated successfully`)
  console.log(`✅ Email confirmed`)

  // Check user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.log(`\n⚠️  User profile not found in database`)
    console.log(`   Creating profile...`)
    await setupUserProfile(userId)
  } else {
    console.log(`\n✅ User profile found:`)
    console.log(`   Name: ${profile.full_name}`)
    console.log(`   Role: ${profile.role}`)
    console.log(`   Team ID: ${profile.team_id || 'None'}`)
  }

  console.log(`\n✅ Manager1 login should now work!`)
  console.log(`   Email: ${EMAIL}`)
  console.log(`   Password: ${PASSWORD}`)
}

async function setupUserProfile(userId) {
  // Get team for manager1 (Team Alpha)
  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('name', 'Team Alpha')
    .single()

  const teamId = teams?.id || null

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: EMAIL.toLowerCase(),
      full_name: 'Manager Alpha',
      rep_id: `MGR-${Date.now()}-1`,
      role: 'manager',
      team_id: teamId,
      virtual_earnings: 0
    })

  if (insertError) {
    if (insertError.code === '23505') {
      // User already exists, update it
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: 'manager',
          team_id: teamId,
          full_name: 'Manager Alpha'
        })
        .eq('id', userId)

      if (updateError) {
        console.error(`❌ Failed to update user profile:`, updateError.message)
      } else {
        console.log(`✅ Updated existing user profile`)
      }
    } else {
      console.error(`❌ Failed to create user profile:`, insertError.message)
    }
  } else {
    console.log(`✅ Created user profile`)
  }

  // Create session limits
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('user_session_limits')
    .upsert({
      user_id: userId,
      sessions_this_month: 0,
      sessions_limit: 5,
      last_reset_date: today
    }, { onConflict: 'user_id' })

  console.log(`✅ Created session limits`)
}

fixManager1Login()

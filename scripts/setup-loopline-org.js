/**
 * Setup Loopline Organization
 * Creates Loopline organization, assigns current user to it, and creates 10 random reps
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

// Random first and last names for generating rep names
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie',
  'Kai', 'Logan', 'Parker', 'Reese', 'River', 'Rowan', 'Sage', 'Skylar',
  'Spencer', 'Tatum', 'Tyler', 'Zion', 'Aiden', 'Blake', 'Carter', 'Dylan',
  'Ethan', 'Finn', 'Grayson', 'Hunter', 'Isaac', 'Jaxon', 'Kai', 'Liam',
  'Mason', 'Noah', 'Owen', 'Parker', 'Quinn', 'Riley', 'Sawyer', 'Tyler'
]

const lastNames = [
  'Anderson', 'Brown', 'Davis', 'Garcia', 'Harris', 'Jackson', 'Johnson', 'Jones',
  'Lee', 'Martinez', 'Miller', 'Moore', 'Robinson', 'Smith', 'Taylor', 'Thomas',
  'Thompson', 'White', 'Williams', 'Wilson', 'Young', 'Adams', 'Baker', 'Clark',
  'Collins', 'Cook', 'Cooper', 'Evans', 'Green', 'Hall', 'Hill', 'King',
  'Lewis', 'Martin', 'Mitchell', 'Nelson', 'Parker', 'Phillips', 'Roberts', 'Rodriguez',
  'Scott', 'Stewart', 'Turner', 'Walker', 'Ward', 'Watson', 'Wright', 'Young'
]

const companies = [
  'SalesPro', 'Apex', 'Summit', 'Elite', 'Prime', 'Vanguard', 'Nexus', 'Pinnacle',
  'Catalyst', 'Velocity', 'Momentum', 'Horizon', 'Frontier', 'Legacy', 'Dynamo', 'Titan'
]

/**
 * Generate a random rep name
 */
function generateRepName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

/**
 * Generate a random email
 */
function generateEmail(fullName) {
  const nameParts = fullName.toLowerCase().split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  const randomNum = Math.floor(Math.random() * 1000)
  return `${firstName}.${lastName}${randomNum}@loopline.com`
}

/**
 * Create an auth user
 */
async function createAuthUser(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (error) {
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
        if (existingUser) {
          return { user: existingUser, error: null }
        }
      }
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

/**
 * Create user profile
 */
async function createUserProfile(userId, email, fullName, role, organizationId, repId) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      rep_id: repId,
      role: role,
      organization_id: organizationId,
      virtual_earnings: 0,
      credits: 5,
      last_daily_credit_reset: today
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // User already exists, update them
      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({
          role: role,
          organization_id: organizationId,
          full_name: fullName
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError
      return { profile: updated, error: null }
    }
    throw error
  }

  // Create session limits
  await supabase
    .from('user_session_limits')
    .upsert({
      user_id: userId,
      sessions_this_month: 0,
      sessions_limit: 5,
      last_reset_date: today
    }, {
      onConflict: 'user_id'
    })

  return { profile: data, error: null }
}

/**
 * Main function
 */
async function setupLoopline() {
  try {
    const userEmail = process.argv[2]
    
    if (!userEmail) {
      console.error('❌ Please provide your email address')
      console.error('   Usage: node scripts/setup-loopline-org.js <your-email>')
      process.exit(1)
    }

    console.log('\n🏢 Setting up Loopline Organization...\n')

    // Find current user
    console.log(`📧 Looking up user: ${userEmail}`)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, organization_id')
      .eq('email', userEmail.toLowerCase())
      .single()

    if (userError || !userData) {
      console.error(`❌ User not found: ${userEmail}`)
      console.error('   Make sure you have an account in the users table')
      process.exit(1)
    }

    console.log(`✅ Found user: ${userData.full_name || userData.email}`)
    console.log(`   User ID: ${userData.id}`)

    // Check if Loopline organization already exists
    console.log('\n🔍 Checking for existing Loopline organization...')
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('id, name, seats_used, seat_limit')
      .eq('name', 'Loopline')
      .single()

    let organizationId

    if (existingOrg) {
      console.log(`✅ Loopline organization already exists`)
      console.log(`   Organization ID: ${existingOrg.id}`)
      console.log(`   Seats used: ${existingOrg.seats_used}/${existingOrg.seat_limit}`)
      organizationId = existingOrg.id
    } else {
      // Create Loopline organization
      console.log('\n📝 Creating Loopline organization...')
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Loopline',
          plan_tier: 'team',
          seat_limit: 20, // Enough for user + 10 reps + buffer
          seats_used: 0
        })
        .select()
        .single()

      if (orgError) {
        console.error('❌ Error creating organization:', orgError)
        throw orgError
      }

      console.log(`✅ Created Loopline organization`)
      console.log(`   Organization ID: ${newOrg.id}`)
      organizationId = newOrg.id
    }

    // Update current user to be part of Loopline (as manager/admin)
    console.log('\n👤 Assigning you to Loopline organization...')
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        organization_id: organizationId,
        role: 'manager' // Make user a manager
      })
      .eq('id', userData.id)

    if (updateUserError) {
      console.error('❌ Error updating user:', updateUserError)
      throw updateUserError
    }

    console.log(`✅ Assigned you to Loopline as manager`)

    // Check how many reps already exist in Loopline
    const { data: existingReps, error: repsCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'rep')

    const existingRepCount = existingReps?.length || 0
    const repsToCreate = Math.max(0, 10 - existingRepCount)

    if (repsToCreate === 0) {
      console.log(`\n✅ Loopline already has 10 reps!`)
    } else {
      console.log(`\n👥 Creating ${repsToCreate} rep${repsToCreate > 1 ? 's' : ''}...`)

      const password = 'Loopline2024!'
      const createdReps = []

      for (let i = 0; i < repsToCreate; i++) {
        const fullName = generateRepName()
        const email = generateEmail(fullName)
        const repId = `REP-${Date.now().toString().slice(-6)}-${i}`

        console.log(`\n   Creating rep ${i + 1}/${repsToCreate}: ${fullName}`)
        console.log(`      Email: ${email}`)

        // Create auth user
        const { user: authUser, error: authError } = await createAuthUser(email, password, fullName)
        if (authError) {
          console.error(`      ❌ Failed to create auth user: ${authError.message}`)
          continue
        }

        // Create user profile
        const { profile, error: profileError } = await createUserProfile(
          authUser.id,
          email,
          fullName,
          'rep',
          organizationId,
          repId
        )

        if (profileError) {
          console.error(`      ❌ Failed to create profile: ${profileError.message}`)
          continue
        }

        createdReps.push({ email, password, fullName, repId })
        console.log(`      ✅ Created successfully`)
      }

      // Update organization seat count
      const totalMembers = (existingRepCount + createdReps.length + 1) // +1 for manager
      const { error: updateSeatsError } = await supabase
        .from('organizations')
        .update({
          seats_used: totalMembers
        })
        .eq('id', organizationId)

      if (updateSeatsError) {
        console.error('⚠️  Warning: Could not update seat count:', updateSeatsError.message)
      }

      console.log(`\n✅ Created ${createdReps.length} rep${createdReps.length > 1 ? 's' : ''} successfully!`)
      
      if (createdReps.length > 0) {
        console.log(`\n📋 Rep Credentials:`)
        console.log(`   Password for all reps: ${password}`)
        createdReps.forEach((rep, idx) => {
          console.log(`\n   ${idx + 1}. ${rep.fullName}`)
          console.log(`      Email: ${rep.email}`)
          console.log(`      Rep ID: ${rep.repId}`)
        })
      }
    }

    // Final summary
    const { data: finalOrg } = await supabase
      .from('organizations')
      .select('seats_used, seat_limit')
      .eq('id', organizationId)
      .single()

    console.log(`\n🎉 Setup Complete!`)
    console.log(`\n📊 Organization Summary:`)
    console.log(`   Name: Loopline`)
    console.log(`   Seats Used: ${finalOrg?.seats_used || 0}/${finalOrg?.seat_limit || 0}`)
    console.log(`   Your Role: Manager`)
    console.log(`\n✅ You can now view your organization at /settings/organization`)

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the script
setupLoopline()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })


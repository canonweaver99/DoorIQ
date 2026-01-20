/**
 * Add 10 test teammates to Canon Weaver's organization (canonweaver@looplne.design)
 * Creates realistic rep users for testing team functionality
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

// Test teammate names
const TEAMMATE_NAMES = [
  'Alex Thompson',
  'Jordan Martinez',
  'Casey Kim',
  'Morgan Davis',
  'Riley Johnson',
  'Taylor Chen',
  'Quinn Williams',
  'Sage Rodriguez',
  'Blake Anderson',
  'Cameron Lee'
]

const PASSWORD = 'TestTeammate2024!'

/**
 * Find organization by user email or organization name/ID
 */
async function findOrganization(emailPattern, orgId = null) {
  // If orgId provided, use it directly
  if (orgId) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, seat_limit, seats_used')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      throw new Error(`Organization not found with ID: ${orgId}`)
    }

    // Find owner
    const { data: owner } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organization_id', orgId)
      .in('role', ['manager', 'admin'])
      .limit(1)
      .single()

    return {
      organization: org,
      userId: owner?.id || null,
      userName: owner?.full_name || 'Unknown',
      userEmail: owner?.email || 'Unknown'
    }
  }

  // Try to find by user email
  const { data: usersData } = await supabase.auth.admin.listUsers()
  let user = usersData?.users?.find(u => u.email?.toLowerCase() === emailPattern.toLowerCase())
  
  // If not found, try partial match
  if (!user) {
    user = usersData?.users?.find(u => 
      u.email?.toLowerCase().includes(emailPattern.toLowerCase().split('@')[0])
    )
  }
  
  if (!user) {
    // Try to find "Loopline Design" organization automatically
    const { data: looplineOrg } = await supabase
      .from('organizations')
      .select('id, name, seat_limit, seats_used')
      .ilike('name', '%loopline%')
      .limit(1)
      .single()

    if (looplineOrg) {
      console.log(`\n✅ Found Loopline organization automatically: ${looplineOrg.name}\n`)
      // Find owner
      const { data: owner } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('organization_id', looplineOrg.id)
        .in('role', ['manager', 'admin'])
        .limit(1)
        .single()

      return {
        organization: looplineOrg,
        userId: owner?.id || null,
        userName: owner?.full_name || 'Unknown',
        userEmail: owner?.email || 'Unknown'
      }
    }

    // List all organizations instead
    console.log(`\n⚠️  User not found. Listing all organizations:\n`)
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name, seat_limit, seats_used')
      .order('created_at', { ascending: false })
      .limit(20)

    if (allOrgs && allOrgs.length > 0) {
      console.log('Available organizations:')
      allOrgs.forEach((org, idx) => {
        console.log(`   ${idx + 1}. ${org.name} (ID: ${org.id})`)
        console.log(`      Seats: ${org.seats_used}/${org.seat_limit}`)
      })
      console.log(`\n💡 Tip: Run with organization ID: node scripts/add-test-teammates-to-canon.js <org-id>`)
    }
    throw new Error(`User not found: ${emailPattern}`)
  }

  console.log(`✅ Found user: ${user.email}`)

  // Get user profile to find organization
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (error || !userProfile) {
    throw new Error(`User profile not found for ${user.email}`)
  }

  if (!userProfile.organization_id) {
    throw new Error(`User ${user.email} is not part of an organization`)
  }

  // Get organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, seat_limit, seats_used')
    .eq('id', userProfile.organization_id)
    .single()

  if (orgError || !org) {
    throw new Error(`Organization not found for user ${user.email}`)
  }

  return {
    organization: org,
    userId: user.id,
    userName: userProfile.full_name,
    userEmail: user.email
  }
}

/**
 * Create an auth user
 */
async function createAuthUser(email, password, fullName) {
  try {
    // Check if user already exists
    const { data: usersData } = await supabase.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (existingUser) {
      console.log(`   ⚠️  Auth user already exists: ${email}`)
      return { user: existingUser, error: null, isNew: false }
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    return { user: data?.user, error, isNew: true }
  } catch (error) {
    return { user: null, error, isNew: false }
  }
}

/**
 * Create user profile and add to organization
 */
async function createUserProfile(userId, email, fullName, organizationId, teamId = null) {
  // Generate rep ID
  const repId = `REP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`
  
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role: 'rep',
      organization_id: organizationId,
      team_id: teamId,
      rep_id: repId,
      virtual_earnings: 0,
      is_active: true,
      onboarding_completed: false, // Let them go through onboarding
    }, {
      onConflict: 'id'
    })
    .select()
    .single()
  
  return { data, error }
}

/**
 * Get or create a default team in the organization
 */
async function getOrCreateDefaultTeam(organizationId, ownerId) {
  // Try to find an existing team
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('organization_id', organizationId)
    .limit(1)
    .single()

  if (existingTeam) {
    return existingTeam
  }

  // Create a default team
  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({
      name: 'Default Team',
      organization_id: organizationId,
      owner_id: ownerId
    })
    .select()
    .single()

  if (error) {
    console.warn(`   ⚠️  Could not create team: ${error.message}`)
    return null
  }

  return newTeam
}

/**
 * Main function
 */
async function addTestTeammates() {
  try {
    // Check if org ID provided as argument
    const orgId = process.argv[2]
    const searchPattern = orgId ? null : 'canonweaver'
    
    if (orgId) {
      console.log(`\n🔍 Finding organization by ID: ${orgId}...\n`)
    } else {
      console.log('\n🔍 Finding organization for canonweaver@looplne.design...\n')
    }
    
    const { organization, userId, userName, userEmail } = await findOrganization(searchPattern, orgId)
    
    console.log(`✅ Found organization:`)
    console.log(`   Name: ${organization.name}`)
    console.log(`   ID: ${organization.id}`)
    console.log(`   Seats: ${organization.seats_used}/${organization.seat_limit}`)
    console.log(`   Owner: ${userName} (${userEmail})`)
    console.log(`   Owner ID: ${userId}\n`)

    // Check seat availability
    const availableSeats = organization.seat_limit - organization.seats_used
    if (availableSeats < TEAMMATE_NAMES.length) {
      console.warn(`⚠️  Warning: Only ${availableSeats} seats available, but trying to add ${TEAMMATE_NAMES.length} teammates`)
      console.warn(`   The organization may need more seats.\n`)
    }

    // Get or create a default team
    console.log('🔍 Finding or creating team...\n')
    const team = await getOrCreateDefaultTeam(organization.id, userId)
    if (team) {
      console.log(`✅ Using team: ${team.name} (${team.id})\n`)
    } else {
      console.log(`⚠️  No team available - teammates will be added to organization only\n`)
    }

    console.log(`📝 Creating ${TEAMMATE_NAMES.length} test teammates...\n`)

    const results = {
      created: [],
      skipped: [],
      errors: []
    }

    for (let i = 0; i < TEAMMATE_NAMES.length; i++) {
      const fullName = TEAMMATE_NAMES[i]
      const email = `test.teammate${i + 1}@looplne.design`
      
      console.log(`\n${i + 1}. Creating ${fullName} (${email})...`)

      try {
        // Create auth user
        const { user: authUser, error: authError, isNew } = await createAuthUser(email, PASSWORD, fullName)
        
        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`)
        }

        if (!authUser) {
          throw new Error('Auth user creation returned no user')
        }

        if (!isNew) {
          // Check if user is already in this organization
          const { data: existingProfile } = await supabase
            .from('users')
            .select('organization_id, full_name')
            .eq('id', authUser.id)
            .single()

          if (existingProfile?.organization_id === organization.id) {
            console.log(`   ⚠️  User already in this organization - skipping`)
            results.skipped.push({ email, fullName, reason: 'Already in organization' })
            continue
          }
        }

        // Create user profile
        const { data: profile, error: profileError } = await createUserProfile(
          authUser.id,
          email,
          fullName,
          organization.id,
          team?.id || null
        )

        if (profileError) {
          // If profile creation fails and we created a new auth user, clean it up
          if (isNew) {
            await supabase.auth.admin.deleteUser(authUser.id)
          }
          throw new Error(`Profile creation failed: ${profileError.message}`)
        }

        console.log(`   ✅ Created successfully`)
        console.log(`      User ID: ${authUser.id}`)
        console.log(`      Rep ID: ${profile.rep_id}`)
        console.log(`      Team: ${team ? team.name : 'None'}`)

        results.created.push({
          email,
          fullName,
          userId: authUser.id,
          repId: profile.rep_id,
          password: PASSWORD
        })

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`)
        results.errors.push({ email, fullName, error: error.message })
      }
    }

    // Summary
    console.log(`\n\n${'='.repeat(60)}`)
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Created: ${results.created.length}`)
    console.log(`⚠️  Skipped: ${results.skipped.length}`)
    console.log(`❌ Errors: ${results.errors.length}`)
    console.log(`\n📋 Created Teammates:`)
    
    results.created.forEach((teammate, idx) => {
      console.log(`\n${idx + 1}. ${teammate.fullName}`)
      console.log(`   Email: ${teammate.email}`)
      console.log(`   Password: ${teammate.password}`)
      console.log(`   User ID: ${teammate.userId}`)
      console.log(`   Rep ID: ${teammate.repId}`)
    })

    if (results.skipped.length > 0) {
      console.log(`\n⚠️  Skipped:`)
      results.skipped.forEach((teammate, idx) => {
        console.log(`   ${idx + 1}. ${teammate.email} - ${teammate.reason}`)
      })
    }

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach((teammate, idx) => {
        console.log(`   ${idx + 1}. ${teammate.email} - ${teammate.error}`)
      })
    }

    console.log(`\n🔗 Login URL: https://dooriq.ai/auth/login`)
    console.log(`\n✅ Done!\n`)

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the script
addTestTeammates().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

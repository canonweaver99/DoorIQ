/**
 * Setup Enterprise Plan and Reset Onboarding for Testing
 * Sets canonweaver@loopline.design to enterprise plan and resets onboarding
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupEnterpriseOnboarding() {
  const email = 'canonweaver@loopline.design'
  
  console.log(`🔧 Setting up enterprise plan and onboarding for: ${email}\n`)

  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return
    }

    console.log(`✅ Found user: ${user.full_name || user.email}`)
    console.log(`   Current role: ${user.role || 'none'}`)
    console.log(`   Current subscription: ${user.subscription_status || 'none'}`)
    console.log(`   Organization ID: ${user.organization_id || 'none'}\n`)

    // Get or create organization
    let organizationId = user.organization_id
    let organization

    if (organizationId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (org) {
        organization = org
        console.log(`✅ Found existing organization: ${org.name}`)
      }
    }

    // Create organization if it doesn't exist
    if (!organization) {
      console.log('📝 Creating new organization...')
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Loopline Design',
          plan_tier: 'enterprise',
          seat_limit: 50,
          seats_used: 1,
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating organization:', createError)
        return
      }

      organization = newOrg
      organizationId = newOrg.id
      console.log(`✅ Created organization: ${newOrg.name} (${newOrg.id})`)
    } else {
      // Update existing organization to enterprise
      console.log('📝 Updating organization to enterprise plan...')
      const { error: updateOrgError } = await supabase
        .from('organizations')
        .update({
          plan_tier: 'enterprise',
          seat_limit: 50,
          seats_used: 1,
        })
        .eq('id', organizationId)

      if (updateOrgError) {
        console.error('❌ Error updating organization:', updateOrgError)
        return
      }
      console.log('✅ Organization updated to enterprise plan')
    }

    // Update user to enterprise plan, manager role, and reset onboarding
    console.log('\n📝 Updating user...')
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'manager',
        organization_id: organizationId,
        subscription_status: 'active',
        subscription_plan: 'enterprise',
        subscription_current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        is_active: true,
        // Reset onboarding steps
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_steps_completed: {
          invite_team: false,
          configure_settings: false,
          first_session: false,
          explore_features: false,
        },
        onboarding_dismissed: false,
        onboarding_dismissed_at: null,
        // Reset credits for enterprise (unlimited)
        credits: 9999,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      return
    }

    console.log('✅ User updated successfully!')
    console.log('\n📊 Updated Settings:')
    console.log(`   Role: manager`)
    console.log(`   Subscription: active (enterprise)`)
    console.log(`   Organization: ${organization.name} (${organizationId})`)
    console.log(`   Plan Tier: enterprise`)
    console.log(`   Seat Limit: 50`)
    console.log(`   Credits: 9999`)
    console.log(`   Onboarding: Reset (all steps incomplete)`)
    console.log('\n🎉 Setup complete! You can now test the onboarding flow.')
    console.log('\n💡 To test:')
    console.log('   1. Complete a practice session')
    console.log('   2. You should be redirected to /onboarding/invite-team')
    console.log('   3. Send an invite')
    console.log('   4. You\'ll be taken to settings with walkthrough')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupEnterpriseOnboarding()


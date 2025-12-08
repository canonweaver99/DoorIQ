import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { sendNewUserNotification, sendWelcomeEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, organization_name, team_name, invite_token } = await request.json()

    // ============================================
    // INVITE-ONLY SIGNUP VALIDATION
    // ============================================
    if (!invite_token) {
      return NextResponse.json(
        { error: 'Signups are invite-only. Please use a valid invite link.' },
        { status: 403 }
      )
    }

    // Validate invite token
    const serviceSupabase = await createServiceSupabaseClient()
    const { data: invite, error: inviteError } = await serviceSupabase
      .from('admin_invites')
      .select('*')
      .eq('token', invite_token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invite token. Please request a new invite.' },
        { status: 403 }
      )
    }
    
    // Check email match if invite has email
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite is for a different email address.' },
        { status: 403 }
      )
    }
    
    // Store invite data for later use (to mark as used)
    const inviteData = invite

    if (!email || !password || !full_name || !role || !organization_name || !team_name) {
      return NextResponse.json(
        { error: 'Email, password, full name, role, organization name, and team name are required' },
        { status: 400 }
      )
    }

    if (!['rep', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "rep" or "manager"' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists by listing users and filtering
    // serviceSupabase is already defined above for invite validation
    const { data: usersData } = await (serviceSupabase as any).auth.admin.listUsers()
    if (usersData?.users) {
      const existingUser = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Create auth user (auto-confirmed for bulk signup)
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm email for bulk signup
      user_metadata: {
        full_name: full_name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message || 'Failed to create account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Generate rep ID
    const repId = `REP-${Date.now().toString().slice(-6)}`

    // Find or create organization
    const orgName = organization_name.trim()
    let { data: organization, error: orgFindError } = await serviceSupabase
      .from('organizations')
      .select('id, seat_limit, seats_used')
      .eq('name', orgName)
      .single()

    let organizationId: string

    if (!organization) {
      // Create new organization
      const { data: newOrg, error: orgCreateError } = await serviceSupabase
        .from('organizations')
        .insert({
          name: orgName,
          plan_tier: 'team',
          seat_limit: 100, // Default high limit for bulk signups
          seats_used: 0
        })
        .select()
        .single()

      if (orgCreateError || !newOrg) {
        console.error('Error creating organization:', orgCreateError)
        await serviceSupabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: 'Failed to create organization' },
          { status: 500 }
        )
      }

      organization = newOrg
      organizationId = newOrg.id
    } else {
      organizationId = organization.id
    }

    // Find or create team within organization
    const teamName = team_name.trim()
    let { data: team } = await serviceSupabase
      .from('teams')
      .select('id')
      .eq('name', teamName)
      .eq('organization_id', organizationId)
      .maybeSingle()

    let teamId: string

    if (!team) {
      // Create new team
      const { data: newTeam, error: teamCreateError } = await serviceSupabase
        .from('teams')
        .insert({
          name: teamName,
          organization_id: organizationId
          // owner_id will be set after user is created if role is manager
        })
        .select()
        .single()

      if (teamCreateError || !newTeam) {
        console.error('Error creating team:', teamCreateError)
        await serviceSupabase.auth.admin.deleteUser(userId)
        return NextResponse.json(
          { error: 'Failed to create team' },
          { status: 500 }
        )
      }

      team = newTeam
      teamId = newTeam.id
    } else {
      teamId = team.id
    }

    // Create user profile - unlimited practice, no credits
    const { error: profileError } = await serviceSupabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: full_name,
        rep_id: repId,
        role: role,
        organization_id: organizationId,
        team_id: teamId,
        virtual_earnings: 0,
        onboarding_completed: true, // Skip onboarding for bulk signups
        onboarding_dismissed: true
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Try to clean up auth user if profile creation fails
      await serviceSupabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // If user is manager and team doesn't have owner, set them as owner
    if (role === 'manager') {
      // Check if team has owner
      const { data: teamData } = await serviceSupabase
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single()
      
      if (teamData && !teamData.owner_id) {
        try {
          const { error: updateError } = await serviceSupabase
            .from('teams')
            .update({ owner_id: userId })
            .eq('id', teamId)
          
          if (updateError) {
            console.error('Warning: Failed to set team owner:', updateError)
            // Don't fail the request
          }
        } catch (err) {
          console.error('Warning: Failed to set team owner:', err)
          // Don't fail the request
        }
      }
    }

    // Update organization seats_used (if trigger doesn't handle it)
    // The trigger should handle this automatically, but we'll update just in case
    try {
      const { error: rpcError } = await serviceSupabase.rpc('increment_organization_seats', { org_id: organizationId })
      
      if (rpcError) {
        // If RPC doesn't exist, manually update
        const { data: orgData } = await serviceSupabase
          .from('organizations')
          .select('seats_used')
          .eq('id', organizationId)
          .single()
        
        if (orgData) {
          const { error: updateError } = await serviceSupabase
            .from('organizations')
            .update({ seats_used: (orgData.seats_used || 0) + 1 })
            .eq('id', organizationId)
          
          if (updateError) {
            console.error('Warning: Failed to update organization seats:', updateError)
          }
        }
      }
    } catch (err) {
      console.error('Warning: Failed to update organization seats:', err)
      // Don't fail the request
    }

    // No session limits - unlimited practice for all users

    // Send notification email to admin (bulk signup)
    try {
      await sendNewUserNotification(email, full_name, userId, 'bulk-signup')
    } catch (emailError) {
      console.error('Warning: Failed to send notification email:', emailError)
      // Don't fail the request
    }

    // Send welcome email to new user
    try {
      await sendWelcomeEmail(email, full_name)
    } catch (emailError) {
      console.error('Warning: Failed to send welcome email:', emailError)
      // Don't fail the request
    }

    // Mark invite as used
    if (invite_token && inviteData) {
      try {
        await serviceSupabase
          .from('admin_invites')
          .update({
            used_at: new Date().toISOString(),
            used_by: userId
          })
          .eq('token', invite_token)
        
        console.log('✅ Admin invite marked as used:', invite_token)
      } catch (inviteUpdateError) {
        console.error('Warning: Failed to mark invite as used:', inviteUpdateError)
        // Don't fail the request
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: userId
    })
  } catch (error: any) {
    console.error('Error in bulk signup:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


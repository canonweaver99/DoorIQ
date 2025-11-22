import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role = 'rep' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get the user's profile to check their team and role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id, organization_id, role, full_name, referral_code')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user is a manager or admin
    if (!['manager', 'admin'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Only managers and admins can invite teammates' }, { status: 403 })
    }

    // Check if user has a team or organization
    const orgId = userProfile.organization_id || userProfile.team_id
    if (!orgId) {
      return NextResponse.json({ error: 'You must be part of a team to invite teammates' }, { status: 400 })
    }

    // Check seat availability if organization exists
    if (userProfile.organization_id) {
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('seat_limit, seats_used')
        .eq('id', userProfile.organization_id)
        .single()

      if (!orgError && organization) {
        if (organization.seats_used >= organization.seat_limit) {
          return NextResponse.json(
            { error: `No seats available. You have ${organization.seats_used}/${organization.seat_limit} seats used. Please upgrade your plan or contact support.` },
            { status: 400 }
          )
        }
      }
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        team_id: userProfile.team_id,
        organization_id: userProfile.organization_id || userProfile.team_id,
        invited_by: user.id,
        email,
        token,
        role,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Generate the invite URL with referral code
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${token}?ref=${userProfile.referral_code || ''}`

    // Send invite email via Resend (don't fail if this fails)
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          inviteUrl,
          inviterName: userProfile.full_name || 'Your teammate',
          role
        })
      })
      
      if (emailResponse.ok) {
        console.log('✅ Invite email sent successfully to:', email)
      } else {
        console.warn('⚠️ Failed to send invite email, but invite was created')
      }
    } catch (emailError) {
      console.error('⚠️ Email send error:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ 
      success: true, 
      invite,
      inviteUrl 
    })
  } catch (error) {
    console.error('Error in create invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


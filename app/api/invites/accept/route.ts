import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
    }

    // Check if invite is still valid
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    // Get organization_id from invite (prefer organization_id over team_id)
    const orgId = invite.organization_id || invite.team_id

    // Check seat availability before accepting (for organizations)
    if (orgId) {
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('seat_limit, seats_used')
        .eq('id', orgId)
        .single()

      if (!orgError && organization) {
        // Check if seats are full
        if (organization.seats_used >= organization.seat_limit) {
          return NextResponse.json(
            { error: `No seats available. This organization has ${organization.seats_used}/${organization.seat_limit} seats used. Please contact the organization admin.` },
            { status: 400 }
          )
        }
      }
    }

    // Update user record - activate them and set organization/role
    // Check if this is a pre-created user (from bulk invite) that was inactive
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, full_name, is_active')
      .eq('id', user.id)
      .single()

    // Use existing name if available, otherwise from user metadata or email
    const userName = existingUser?.full_name || user.user_metadata?.full_name || invite.email.split('@')[0]

    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: userName,
        team_id: invite.team_id,
        organization_id: orgId,
        role: invite.role,
        is_active: true, // Set as active - trigger will handle seats_used increment
        virtual_earnings: existingUser ? undefined : 0, // Only set if new user
      }, {
        onConflict: 'id'
      })

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
    }

    // Mark the invite as accepted
    const { error: inviteUpdateError } = await supabase
      .from('team_invites')
      .update({ 
        status: 'accepted',
        used_at: new Date().toISOString(),
        used_by: user.id
      })
      .eq('id', invite.id)

    if (inviteUpdateError) {
      console.error('Error updating invite:', inviteUpdateError)
      // Don't fail the request if we can't update the invite status
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


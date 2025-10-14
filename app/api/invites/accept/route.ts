import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
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

    // Update the user's team_id and role
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        team_id: invite.team_id,
        role: invite.role 
      })
      .eq('id', user.id)

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


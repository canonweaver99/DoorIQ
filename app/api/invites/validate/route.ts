import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get the invite
    const { data: invite, error: inviteError } = await (supabase as any)
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      console.error('Invite error:', inviteError)
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
    }

    // Get team info separately
    const { data: team, error: teamError } = await (supabase as any)
      .from('teams')
      .select('id, name')
      .eq('id', invite.team_id)
      .single()

    if (teamError || !team) {
      console.error('Team error:', teamError)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get inviter info separately
    const { data: inviter, error: inviterError } = await (supabase as any)
      .from('users')
      .select('full_name, email')
      .eq('id', invite.invited_by)
      .single()

    if (inviterError || !inviter) {
      console.error('Inviter error:', inviterError)
      return NextResponse.json({ error: 'Inviter not found' }, { status: 404 })
    }

    // Combine the data
    invite.team = team
    invite.inviter = inviter

    // Check if invite is still valid
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('team_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      invite: {
        id: invite.id,
        team: invite.team,
        inviter: invite.inviter,
        role: invite.role,
        email: invite.email
      }
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select(`
        *,
        team:teams(id, name),
        inviter:users!team_invites_invited_by_fkey(full_name, email)
      `)
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


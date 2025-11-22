import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can invite team members' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.organization_id === userData.organization_id) {
        return NextResponse.json(
          { error: 'User is already a member of your team' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'User is already part of another organization' },
        { status: 400 }
      )
    }

    // Check seat availability
    const { data: org } = await supabase
      .from('organizations')
      .select('seat_limit, seats_used')
      .eq('id', userData.organization_id)
      .single()

    if (org && org.seats_used >= org.seat_limit) {
      return NextResponse.json(
        { error: 'No available seats. Please add more seats to your plan.' },
        { status: 400 }
      )
    }

    // Create team invite (you may have a team_invites table)
    // For now, we'll use the existing invite system
    const inviteResponse = await fetch(`${request.nextUrl.origin}/api/invites/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        organizationId: userData.organization_id,
      }),
    })

    if (!inviteResponse.ok) {
      const errorData = await inviteResponse.json()
      throw new Error(errorData.error || 'Failed to create invite')
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' })
  } catch (error: any) {
    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


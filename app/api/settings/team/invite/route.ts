export const dynamic = "force-static";

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

    // Generate a unique token
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invite directly
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        team_id: null, // Teams are now within organizations
        organization_id: userData.organization_id,
        invited_by: user.id,
        email: email.toLowerCase(),
        token,
        role: 'rep',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: inviteError.message || 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Generate the invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/invite/${token}`

    // Send invite email via Resend (don't fail if this fails)
    try {
      const { data: inviterData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/api/email/send-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          inviteUrl,
          inviterName: inviterData?.full_name || 'Your teammate',
          role: 'rep'
        })
      })
      
      if (!emailResponse.ok) {
        console.warn('⚠️ Failed to send invite email, but invite was created')
      }
    } catch (emailError) {
      console.error('⚠️ Email send error:', emailError)
      // Continue even if email fails
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


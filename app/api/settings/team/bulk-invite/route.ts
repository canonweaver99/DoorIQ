import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server'

interface SeatData {
  name: string
  email: string
  role: 'rep' | 'manager'
}

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
    const { seats }: { seats: SeatData[] } = body

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { error: 'At least one seat is required' },
        { status: 400 }
      )
    }

    // Validate all seats have required fields
    for (const seat of seats) {
      if (!seat.name || !seat.email || !seat.role) {
        return NextResponse.json(
          { error: 'All seats must have name, email, and role' },
          { status: 400 }
        )
      }
      if (!seat.email.includes('@')) {
        return NextResponse.json(
          { error: 'All emails must be valid' },
          { status: 400 }
        )
      }
      if (!['rep', 'manager'].includes(seat.role)) {
        return NextResponse.json(
          { error: 'Role must be either "rep" or "manager"' },
          { status: 400 }
        )
      }
    }

    // Check seat availability
    const { data: org } = await supabase
      .from('organizations')
      .select('seat_limit, seats_used')
      .eq('id', userData.organization_id)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const availableSeats = org.seat_limit - org.seats_used
    if (seats.length > availableSeats) {
      return NextResponse.json(
        { error: `Only ${availableSeats} seat${availableSeats !== 1 ? 's' : ''} available. You're trying to invite ${seats.length} people.` },
        { status: 400 }
      )
    }

    // Check for duplicate emails
    const emails = seats.map(s => s.email.toLowerCase())
    const uniqueEmails = new Set(emails)
    if (emails.length !== uniqueEmails.size) {
      return NextResponse.json(
        { error: 'Duplicate emails found. Each seat must have a unique email.' },
        { status: 400 }
      )
    }

    // Check if any users already exist
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, organization_id')
      .in('email', emails)

    if (existingUsers && existingUsers.length > 0) {
      const existingInOrg = existingUsers.filter(u => u.organization_id === userData.organization_id)
      const existingInOtherOrg = existingUsers.filter(u => u.organization_id !== userData.organization_id)
      
      if (existingInOrg.length > 0) {
        return NextResponse.json(
          { error: `Some users are already members: ${existingInOrg.map(u => u.email).join(', ')}` },
          { status: 400 }
        )
      }
      if (existingInOtherOrg.length > 0) {
        return NextResponse.json(
          { error: `Some users are already in other organizations: ${existingInOtherOrg.map(u => u.email).join(', ')}` },
          { status: 400 }
        )
      }
    }

    const crypto = await import('crypto')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const results = {
      successful: [] as Array<{ email: string; name: string }>,
      failed: [] as Array<{ email: string; name: string; error: string }>,
    }

    // Process each seat
    for (const seat of seats) {
      try {
        const token = crypto.randomBytes(32).toString('hex')
        const emailLower = seat.email.toLowerCase()

        // Create invite with user metadata stored in invite
        // Store name in metadata (we'll use this when creating user on accept)
        const { error: inviteError } = await supabase
          .from('team_invites')
          .insert({
            team_id: null,
            organization_id: userData.organization_id,
            invited_by: user.id,
            email: emailLower,
            token,
            role: seat.role,
            expires_at: expiresAt.toISOString(),
            // Store name in metadata JSONB field if it exists, otherwise we'll use email metadata
          })

        if (inviteError) {
          throw new Error(inviteError.message || 'Failed to create invite')
        }

        // Create user account (unclaimed/inactive) - user will claim via invite link
        // Use service role client for admin operations
        const serviceClient = await createServiceSupabaseClient()
        
        // Check if user already exists
        const { data: existingAuthUser } = await serviceClient.auth.admin.getUserByEmail(emailLower)
        
        let userId: string | null = null
        
        if (existingAuthUser?.user) {
          // User exists in auth - update their profile
          userId = existingAuthUser.user.id
          const { error: updateError } = await serviceClient
            .from('users')
            .upsert({
              id: userId,
              email: emailLower,
              full_name: seat.name,
              organization_id: userData.organization_id,
              role: seat.role,
              is_active: false, // Unclaimed until they accept invite
            }, {
              onConflict: 'id'
            })

          if (updateError) {
            throw new Error(updateError.message || 'Failed to update user')
          }
        } else {
          // Create new auth user (unconfirmed - they'll confirm via invite)
          const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
            email: emailLower,
            email_confirm: false, // They'll confirm via invite link
            user_metadata: {
              full_name: seat.name,
            },
          })

          if (createError || !newUser.user) {
            throw new Error(createError?.message || 'Failed to create user')
          }

          userId = newUser.user.id

          // Create user profile (inactive/unclaimed)
          const { error: profileError } = await serviceClient
            .from('users')
            .insert({
              id: userId,
              email: emailLower,
              full_name: seat.name,
              organization_id: userData.organization_id,
              role: seat.role,
              is_active: false, // Unclaimed until they accept invite and set password
              virtual_earnings: 0,
            })

          if (profileError) {
            // Try to clean up auth user if profile creation fails
            await serviceClient.auth.admin.deleteUser(userId)
            throw new Error(profileError.message || 'Failed to create user profile')
          }
        }

        // Send invite email
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/invite/${token}`
        
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
              email: emailLower,
              inviteUrl,
              inviterName: inviterData?.full_name || 'Your teammate',
              role: seat.role,
              userName: seat.name,
            })
          })
          
          if (!emailResponse.ok) {
            console.warn(`⚠️ Failed to send invite email to ${emailLower}, but invite was created`)
          }
        } catch (emailError) {
          console.error(`⚠️ Email send error for ${emailLower}:`, emailError)
          // Continue - invite is created even if email fails
        }

        results.successful.push({ email: seat.email, name: seat.name })
      } catch (error: any) {
        results.failed.push({ 
          email: seat.email, 
          name: seat.name, 
          error: error.message || 'Unknown error' 
        })
      }
    }

    // Mark invite_team step as complete if at least one invite succeeded
    if (results.successful.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/api/onboarding/complete-step`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'invite_team' }),
        })
      } catch (error) {
        console.error('Error marking onboarding step complete:', error)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully invited ${results.successful.length} of ${seats.length} teammates`,
    })
  } catch (error: any) {
    console.error('Error bulk inviting team members:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { sendNewUserNotification } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const serviceSupabase = await createServiceSupabaseClient()

    // Check if user already exists by listing users and filtering
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

    // Create user profile - unlimited practice, no credits
    const { error: profileError } = await serviceSupabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: full_name,
        rep_id: repId,
        role: 'rep',
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

    // No session limits - unlimited practice for all users

    // Send notification email to admin (bulk signup)
    try {
      await sendNewUserNotification(email, full_name, userId, 'bulk-signup')
    } catch (emailError) {
      console.error('Warning: Failed to send notification email:', emailError)
      // Don't fail the request
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


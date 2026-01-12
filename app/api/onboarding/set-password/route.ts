import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, sessionId } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = await createServiceSupabaseClient()

    // Find the user by email
    const { data: usersData } = await (supabase as any).auth.admin.listUsers()
    const existingUser = usersData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (!existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please complete checkout first.' },
        { status: 404 }
      )
    }

    // Update the user's password
    const { error: updateError } = await (supabase as any).auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true, // Confirm email since they're setting up their account
      }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to set password. Please try again.' },
        { status: 500 }
      )
    }

    // Update user profile with setup info
    await supabase
      .from('users')
      .update({
        account_setup_completed_at: new Date().toISOString(),
        checkout_session_id: sessionId || null,
      })
      .eq('id', existingUser.id)

    console.log('✅ Password set successfully for:', email)

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    })
  } catch (error: any) {
    console.error('Error in set-password:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


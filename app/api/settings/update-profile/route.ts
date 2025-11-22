import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, email } = body

    // Update user profile
    const updates: any = {}
    if (full_name !== undefined) {
      updates.full_name = full_name.trim()
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile' },
        { status: 400 }
      )
    }

    // Update email if provided
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        console.error('Error updating email:', emailError)
        return NextResponse.json(
          { error: emailError.message || 'Failed to update email' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in update-profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

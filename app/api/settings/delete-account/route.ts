import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user from database (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete account' },
        { status: 400 }
      )
    }

    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      // Continue even if auth deletion fails - user record is already deleted
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in delete-account:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


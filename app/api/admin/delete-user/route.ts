
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Admin endpoint to delete a user account
 * Deletes from users table, user_session_limits, and auth
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createServiceSupabaseClient()
    
    // Get the auth token from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Bearer token required' }, { status: 401 })
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { email, userId } = await request.json()

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId is required' }, { status: 400 })
    }

    let targetUserId = userId

    // If email provided, find the user
    if (!targetUserId && email) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (userData) {
        targetUserId = userData.id
      } else {
        // Try to find in auth
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const authUser = authUsers?.users?.find((u) => 
          u.email?.toLowerCase() === email.toLowerCase()
        )
        if (authUser) {
          targetUserId = authUser.id
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete from user_session_limits
    await supabase
      .from('user_session_limits')
      .delete()
      .eq('user_id', targetUserId)

    // Delete from users table
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (deleteUserError) {
      console.error('Error deleting from users table:', deleteUserError)
    }

    // Delete from auth
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(targetUserId)

    if (deleteAuthError) {
      console.error('Error deleting from auth:', deleteAuthError)
      return NextResponse.json({ 
        error: 'Failed to delete from auth',
        details: deleteAuthError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully',
      userId: targetUserId
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}


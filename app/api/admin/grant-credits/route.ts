import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/grant-credits
 * 
 * Admin-only endpoint to grant additional practice call credits to a user
 * 
 * Body:
 * {
 *   userId: string (UUID of user)
 *   credits: number (number of credits to add to sessions_limit)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { userId, credits } = body
    
    if (!userId || typeof credits !== 'number' || credits < 0) {
      return NextResponse.json(
        { error: 'Invalid request. Provide userId and positive credits number.' },
        { status: 400 }
      )
    }
    
    // Update or insert user session limits
    const { data: existingLimit } = await supabase
      .from('user_session_limits')
      .select('sessions_limit')
      .eq('user_id', userId)
      .single()
    
    if (existingLimit) {
      // Update existing limit
      const newLimit = existingLimit.sessions_limit + credits
      const { error: updateError } = await supabase
        .from('user_session_limits')
        .update({ 
          sessions_limit: newLimit,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (updateError) {
        console.error('Error updating session limit:', updateError)
        return NextResponse.json(
          { error: 'Failed to grant credits' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: `Granted ${credits} credits. New limit: ${newLimit}`,
        newLimit
      })
    } else {
      // Create new limit record
      const { error: insertError } = await supabase
        .from('user_session_limits')
        .insert({
          user_id: userId,
          sessions_this_month: 0,
          sessions_limit: 10 + credits,
          last_reset_date: new Date().toISOString().split('T')[0]
        })
      
      if (insertError) {
        console.error('Error creating session limit:', insertError)
        return NextResponse.json(
          { error: 'Failed to grant credits' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: `Granted ${credits} credits. New limit: ${10 + credits}`,
        newLimit: 10 + credits
      })
    }
  } catch (error) {
    console.error('Error in grant-credits API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


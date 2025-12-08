import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
    const supabase = await createServerSupabaseClient()
    
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
    
    // Add credits to users.credits (source of truth)
    // Get current credits
    const { data: userData } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()
    
    const currentCredits = userData?.credits || 75
    const newCredits = currentCredits + credits
    
    // Update users.credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to grant credits' },
        { status: 500 }
      )
    }
    
    // Ensure user_session_limits record exists (for tracking)
    const { error: limitError } = await supabase
      .from('user_session_limits')
      .upsert({
        user_id: userId,
        sessions_this_month: 0,
        sessions_limit: 75, // Universal limit
        last_reset_date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
    
    if (limitError) {
      console.warn('Warning: Could not update user_session_limits:', limitError)
      // Non-critical, continue
    }
    
    return NextResponse.json({
      success: true,
      message: `Granted ${credits} credits. New balance: ${newCredits}`,
      credits: newCredits,
      creditsLimit: 75 // Universal monthly limit
    })
  } catch (error) {
    console.error('Error in grant-credits API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


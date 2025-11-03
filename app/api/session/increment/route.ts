import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Increment session count for ALL users (free users have 10 credits, paid users have 50 credits/month)
    // The increment_user_session_count function handles both cases based on subscription status
    const { error: incrementError } = await supabase.rpc(
      'increment_user_session_count',
      { p_user_id: user.id }
    )

    if (incrementError) {
      console.error('Error incrementing session count:', incrementError)
      return NextResponse.json(
        { error: 'Failed to increment session count' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Session increment error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

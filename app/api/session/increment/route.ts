import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has active subscription (skip increment for premium users)
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    const status = userData?.subscription_status
    const isTrialing = status === 'trialing' && userData?.trial_ends_at && new Date(userData.trial_ends_at) > new Date()
    const hasActiveSubscription = status === 'active' || isTrialing

    if (hasActiveSubscription) {
      return NextResponse.json({ 
        success: true, 
        message: 'Premium user - no limit' 
      })
    }

    // Increment session count for free tier users
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

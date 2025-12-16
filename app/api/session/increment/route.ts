export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Credit system removed - no credit decrement needed
    // User will integrate free trial and Stripe paywall separately
    // Just track session count for analytics purposes
    const { error: incrementError } = await supabase.rpc(
      'increment_user_session_count',
      { p_user_id: user.id }
    )

    // Don't fail if increment fails - it's just for tracking
    if (incrementError) {
      console.warn('Session count increment failed (non-critical):', incrementError)
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

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { checkSessionLimit } from '@/lib/subscription/feature-access'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionInfo = await checkSessionLimit(user.id)

    return NextResponse.json({
      ...sessionInfo,
      subscription: {
        status: 'none',
        hasActiveSubscription: false,
        isTrialing: false,
        daysRemainingInTrial: null,
        trialEndsAt: null
      }
    })
  } catch (error: any) {
    console.error('Error checking session limit:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check session limit' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_completed_at, onboarding_steps_completed, onboarding_dismissed, onboarding_dismissed_at')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw userError
    }

    return NextResponse.json({
      onboarding_completed: userData?.onboarding_completed || false,
      onboarding_completed_at: userData?.onboarding_completed_at,
      steps_completed: userData?.onboarding_steps_completed || {
        invite_team: false,
        configure_settings: false,
        first_session: false,
        explore_features: false,
      },
      onboarding_dismissed: userData?.onboarding_dismissed || false,
      onboarding_dismissed_at: userData?.onboarding_dismissed_at,
    })
  } catch (error: any) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update onboarding_dismissed and onboarding_dismissed_at
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_dismissed: true,
        onboarding_dismissed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding reminder dismissed',
    })
  } catch (error: any) {
    console.error('Error dismissing onboarding:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


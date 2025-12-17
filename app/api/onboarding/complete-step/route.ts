
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { step } = body

    const validSteps = ['invite_team', 'configure_settings', 'first_session', 'explore_features']
    if (!step || !validSteps.includes(step)) {
      return NextResponse.json(
        { error: 'Invalid step. Must be one of: ' + validSteps.join(', ') },
        { status: 400 }
      )
    }

    // Get current steps completed
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('onboarding_steps_completed')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const currentSteps = userData?.onboarding_steps_completed || {
      invite_team: false,
      configure_settings: false,
      first_session: false,
      explore_features: false,
    }

    // Update the specific step
    const updatedSteps = {
      ...currentSteps,
      [step]: true,
    }

    // Update database
    const { error: updateError } = await supabase
      .from('users')
      .update({ onboarding_steps_completed: updatedSteps })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Check if all steps are completed
    const allCompleted = Object.values(updatedSteps).every(Boolean)

    return NextResponse.json({
      success: true,
      step,
      steps_completed: updatedSteps,
      all_completed: allCompleted,
    })
  } catch (error: any) {
    console.error('Error completing onboarding step:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


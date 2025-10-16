import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { incrementSessionCount } from '@/lib/subscription/feature-access'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await incrementSessionCount(user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error incrementing session count:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to increment session count' },
      { status: 500 }
    )
  }
}


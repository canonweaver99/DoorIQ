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

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ members: [] })
    }

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })

    if (membersError) {
      throw membersError
    }

    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


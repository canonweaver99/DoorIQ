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
      .select('organization_id, team_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ invites: [] })
    }

    // Get pending invites for organization or team
    const orgId = userData.organization_id || userData.team_id
    if (!orgId) {
      return NextResponse.json({ invites: [] })
    }

    const { data: invites, error: invitesError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('status', 'pending')
      .or(`organization_id.eq.${orgId},team_id.eq.${orgId}`)
      .order('created_at', { ascending: false })

    if (invitesError) {
      throw invitesError
    }

    return NextResponse.json({ invites: invites || [] })
  } catch (error: any) {
    console.error('Error fetching pending invites:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


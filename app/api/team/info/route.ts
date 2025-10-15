import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team membership
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Not part of a team' }, { status: 404 })
    }

    // Get team info
    const { data: team, error: teamError } = await (supabase as any)
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error fetching team info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


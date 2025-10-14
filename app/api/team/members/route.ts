import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's team_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!userProfile.team_id) {
      // No team yet
      return NextResponse.json({ members: [] })
    }

    // Get team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('users')
      .select('id, full_name, email, role, virtual_earnings, created_at')
      .eq('team_id', userProfile.team_id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    return NextResponse.json({ members: teamMembers || [] })
  } catch (error) {
    console.error('Error in team members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


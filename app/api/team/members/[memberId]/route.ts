export const dynamic = "force-static";

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function generateStaticParams() {
  return []
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { memberId } = await context.params
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a manager or admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('team_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (!['manager', 'admin'].includes(userProfile.role || '')) {
      return NextResponse.json({ error: 'Only managers and admins can remove team members' }, { status: 403 })
    }

    if (!userProfile.team_id) {
      return NextResponse.json({ error: 'You are not part of a team' }, { status: 400 })
    }

    // Get the member to be removed
    const { data: memberToRemove, error: memberError } = await supabase
      .from('users')
      .select('id, team_id, role, email, full_name')
      .eq('id', memberId)
      .single()

    if (memberError || !memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify the member is in the same team
    if (memberToRemove.team_id !== userProfile.team_id) {
      return NextResponse.json({ error: 'Member is not in your team' }, { status: 403 })
    }

    // Prevent removing yourself
    if (memberToRemove.id === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the team' }, { status: 400 })
    }

    // Prevent removing other managers/admins (only allow removing reps)
    if (memberToRemove.role !== 'rep' && memberToRemove.id !== user.id) {
      return NextResponse.json({ error: 'You can only remove sales reps from the team' }, { status: 403 })
    }

    // Remove the member by setting team_id to null
    const { error: updateError } = await supabase
      .from('users')
      .update({ team_id: null })
      .eq('id', memberId)

    if (updateError) {
      console.error('Error removing team member:', updateError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${memberToRemove.full_name || memberToRemove.email} has been removed from the team` 
    })
  } catch (error: any) {
    console.error('Error in remove team member:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


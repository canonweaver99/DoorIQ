export const dynamic = "force-static";

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/organizations/[id]/activate-member
 * Activate a rep (set is_active = true)
 * Check if seats available before activating
 * Increments seats_used in organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orgId } = params
    const body = await request.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      )
    }

    // Get user's organization and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is manager/admin of this organization
    if (userData.organization_id !== orgId || !['manager', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: You must be a manager or admin of this organization' },
        { status: 403 }
      )
    }

    // Get organization to check seat availability
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('seat_limit, seats_used')
      .eq('id', orgId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get member to activate
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('id, organization_id, is_active')
      .eq('id', memberId)
      .eq('organization_id', orgId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found or does not belong to this organization' },
        { status: 404 }
      )
    }

    // Check if already active
    if (member.is_active === true) {
      return NextResponse.json(
        { error: 'Member is already active' },
        { status: 400 }
      )
    }

    // Check seat availability (only if activating would exceed limit)
    // Note: seats_used might be less than actual active count if trigger hasn't run
    // So we check: if seats_used >= seat_limit, we can't activate
    if (organization.seats_used >= organization.seat_limit) {
      return NextResponse.json(
        { 
          error: `No seats available. You have ${organization.seats_used}/${organization.seat_limit} seats used. Please upgrade your plan first.` 
        },
        { status: 400 }
      )
    }

    // Activate member (trigger will handle seats_used increment)
    const { data: updatedMember, error: updateError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error activating member:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: 'Member activated successfully',
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


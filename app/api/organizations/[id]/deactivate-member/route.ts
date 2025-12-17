
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/organizations/[id]/deactivate-member
 * Deactivate a rep (set is_active = false)
 * Decrements seats_used in organization
 * Don't update Stripe (they still pay for reserved seats)
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

    // Get member to deactivate
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

    // Check if already inactive
    if (member.is_active === false) {
      return NextResponse.json(
        { error: 'Member is already inactive' },
        { status: 400 }
      )
    }

    // Deactivate member (trigger will handle seats_used decrement)
    const { data: updatedMember, error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error deactivating member:', updateError)
      return NextResponse.json(
        { error: 'Failed to deactivate member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: 'Member deactivated successfully',
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


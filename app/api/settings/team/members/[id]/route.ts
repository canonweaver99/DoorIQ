
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendManagerPromotionEmail } from '@/lib/email/send'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can update member roles' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { role } = body

    if (!role || !['rep', 'manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "rep" or "manager"' },
        { status: 400 }
      )
    }

    // Verify member belongs to same organization
    // Query with organization_id filter to ensure member is in the same org
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role, email, full_name')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single()

    if (memberError) {
      console.error('Error fetching member:', memberError)
      // Check if it's a "not found" error or a different error
      if (memberError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Member not found or not in your organization' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to verify member' },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found or not in your organization' },
        { status: 404 }
      )
    }

    // Don't allow changing admin role
    if (member.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin role' },
        { status: 403 }
      )
    }

    // Check if this is a promotion to manager (from rep)
    const isPromotionToManager = member.role === 'rep' && role === 'manager'

    // Get promoter's name for email
    const { data: promoterData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const promotedBy = promoterData?.full_name || undefined

    // Update role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Send promotion email if user was promoted to manager
    if (isPromotionToManager && member.email && member.full_name) {
      sendManagerPromotionEmail(member.email, member.full_name, promotedBy).catch(error => {
        console.error('Failed to send manager promotion email:', error)
        // Don't fail the request if email fails
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can remove team members' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    const { id } = params

    // Verify member belongs to same organization
    // Query with organization_id filter to ensure member is in the same org
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .single()

    if (memberError) {
      console.error('Error fetching member:', memberError)
      if (memberError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Member not found or not in your organization' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to verify member' },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found or not in your organization' },
        { status: 404 }
      )
    }

    // Don't allow removing admin or yourself
    if (member.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin user' },
        { status: 403 }
      )
    }

    if (id === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    // Remove from organization (set organization_id to null)
    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: null, is_active: false })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Decrement organization seats_used
    const { error: decrementError } = await supabase.rpc(
      'decrement_organization_seats',
      { org_id: userData.organization_id }
    )

    if (decrementError) {
      console.error('Error decrementing seats:', decrementError)
      // Don't fail the request if seat decrement fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


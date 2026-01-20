import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/discount/create
 * Create a new discount code (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      code,
      discount_type,
      discount_value,
      expires_at,
      max_uses,
      description,
    } = body

    // Validation
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    if (!discount_type || !['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json(
        { error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    if (!discount_value || typeof discount_value !== 'number' || discount_value <= 0) {
      return NextResponse.json(
        { error: 'Discount value must be a positive number' },
        { status: 400 }
      )
    }

    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existingCode } = await supabase
      .from('discount_codes')
      .select('code')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (existingCode) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      )
    }

    // Create discount code
    const { data: newDiscountCode, error: createError } = await supabase
      .from('discount_codes')
      .insert({
        code: code.trim().toUpperCase(),
        discount_type,
        discount_value,
        created_by: user.id,
        expires_at: expires_at || null,
        max_uses: max_uses || null,
        description: description || null,
        is_active: true,
        uses_count: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating discount code:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create discount code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      discount_code: {
        id: newDiscountCode.id,
        code: newDiscountCode.code,
        discount_type: newDiscountCode.discount_type,
        discount_value: Number(newDiscountCode.discount_value),
        expires_at: newDiscountCode.expires_at,
        max_uses: newDiscountCode.max_uses,
        description: newDiscountCode.description,
      },
    })
  } catch (error: any) {
    console.error('Error creating discount code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



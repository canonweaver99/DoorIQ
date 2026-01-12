import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/discount/validate
 * Validate a discount code
 * Public endpoint - no auth required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Query for active, non-expired discount code
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !discountCode) {
      return NextResponse.json(
        { error: 'Invalid or expired discount code' },
        { status: 404 }
      )
    }

    // Check if code has expired
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Discount code has expired' },
        { status: 400 }
      )
    }

    // Check if code has reached max uses
    if (discountCode.max_uses && discountCode.uses_count >= discountCode.max_uses) {
      return NextResponse.json(
        { error: 'Discount code has reached its usage limit' },
        { status: 400 }
      )
    }

    // Return discount code details (without sensitive info)
    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      discount_type: discountCode.discount_type,
      discount_value: Number(discountCode.discount_value),
      description: discountCode.description,
    })
  } catch (error: any) {
    console.error('Error validating discount code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


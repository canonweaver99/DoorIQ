import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's referral code
    const { data: userData } = await supabase
      .from('users')
      .select('referral_code, referral_earnings')
      .eq('id', user.id)
      .single()

    // Get referral statistics
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    const totalReferrals = referrals?.length || 0
    const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0
    const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0
    const totalEarnings = userData?.referral_earnings || 0

    return NextResponse.json({
      referralCode: userData?.referral_code,
      totalReferrals,
      activeReferrals,
      pendingReferrals,
      totalEarnings,
      referrals: referrals || []
    })

  } catch (error: any) {
    console.error('Referral stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}


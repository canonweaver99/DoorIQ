import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards/daily
 * Check if user can claim daily reward and get current status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get daily reward status
    const { data: rewardData } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    // Check if can claim
    const { data: canClaim } = await supabase.rpc('can_claim_daily_reward', {
      p_user_id: user.id
    })
    
    // Get user's current virtual earnings
    const { data: userData } = await supabase
      .from('users')
      .select('virtual_earnings')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      canClaim: canClaim === true,
      lastClaimDate: rewardData?.last_claim_date || null,
      currentStreak: rewardData?.current_streak || 0,
      longestStreak: rewardData?.longest_streak || 0,
      totalRewardsClaimed: rewardData?.total_rewards_claimed || 0,
      totalEarnings: rewardData?.total_virtual_earnings || 0,
      currentBalance: userData?.virtual_earnings || 0
    })
  } catch (error) {
    console.error('Error fetching daily reward status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rewards/daily
 * Claim daily reward
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Claim the reward
    const { data, error } = await supabase.rpc('claim_daily_reward', {
      p_user_id: user.id
    })
    
    if (error) {
      console.error('Error claiming daily reward:', error)
      return NextResponse.json(
        { error: 'Failed to claim reward' },
        { status: 500 }
      )
    }
    
    const result = data?.[0]
    
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Cannot claim reward' },
        { status: 400 }
      )
    }
    
    // Get updated balance
    const { data: userData } = await supabase
      .from('users')
      .select('virtual_earnings')
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      reward: result.reward_amount,
      streak: result.new_streak,
      isStreakBonus: result.is_streak_bonus,
      message: result.message,
      newBalance: userData?.virtual_earnings || 0
    })
  } catch (error) {
    console.error('Error claiming daily reward:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


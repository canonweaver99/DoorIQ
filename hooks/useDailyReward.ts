'use client'

import { useState, useEffect } from 'react'

export interface DailyRewardStatus {
  canClaim: boolean
  lastClaimDate: string | null
  currentStreak: number
  longestStreak: number
  totalRewardsClaimed: number
  totalEarnings: number
  currentBalance: number
  loading: boolean
}

export interface ClaimRewardResult {
  success: boolean
  reward: number
  streak: number
  isStreakBonus: boolean
  message: string
  newBalance: number
}

export function useDailyReward() {
  const [status, setStatus] = useState<DailyRewardStatus>({
    canClaim: false,
    lastClaimDate: null,
    currentStreak: 0,
    longestStreak: 0,
    totalRewardsClaimed: 0,
    totalEarnings: 0,
    currentBalance: 0,
    loading: true
  })
  
  const [claiming, setClaiming] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/rewards/daily')
      if (response.ok) {
        const data = await response.json()
        setStatus({
          ...data,
          loading: false
        })
      } else {
        setStatus(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error fetching daily reward status:', error)
      setStatus(prev => ({ ...prev, loading: false }))
    }
  }

  const claimReward = async (): Promise<ClaimRewardResult | null> => {
    setClaiming(true)
    try {
      const response = await fetch('/api/rewards/daily', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Refresh status after claiming
        await fetchStatus()
        setClaiming(false)
        return data
      } else {
        setClaiming(false)
        return null
      }
    } catch (error) {
      console.error('Error claiming daily reward:', error)
      setClaiming(false)
      return null
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return {
    ...status,
    claimReward,
    claiming,
    refresh: fetchStatus
  }
}


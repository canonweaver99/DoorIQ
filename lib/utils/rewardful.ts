/**
 * Utility function to get Rewardful referral ID from browser
 * Returns the referral ID if available, null otherwise
 */
export function getRewardfulReferralId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Check if Rewardful is loaded and has a referral ID
  const rewardful = (window as any).Rewardful
  if (rewardful && rewardful.referral) {
    return rewardful.referral
  }

  return null
}


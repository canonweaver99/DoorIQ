/**
 * Pricing utilities for calculating seat costs based on organization seat count
 * 
 * Pricing Model:
 * - Starter: 1 seat at $49/month (flat rate)
 * - Team: 2-100 seats at $39/seat/month
 * - Enterprise: 101+ seats at $29/seat/month
 */

export type PricingTier = 'starter' | 'team' | 'enterprise'

export interface PricingInfo {
  tier: PricingTier
  pricePerSeat: number
  totalSeats: number
  monthlyCost: number
}

/**
 * Determine pricing tier based on total seat count
 */
export function getPricingTier(seatCount: number): PricingTier {
  if (seatCount === 1) {
    return 'starter'
  } else if (seatCount >= 2 && seatCount <= 100) {
    return 'team'
  } else {
    return 'enterprise'
  }
}

/**
 * Get price per seat for a given tier
 */
export function getPricePerSeat(tier: PricingTier): number {
  const prices = {
    starter: 49, // Flat rate for 1 seat
    team: 39, // Per seat
    enterprise: 29, // Per seat
  }
  return prices[tier]
}

/**
 * Calculate pricing information based on total seat count
 */
export function calculatePricing(totalSeats: number): PricingInfo {
  const tier = getPricingTier(totalSeats)
  const pricePerSeat = getPricePerSeat(tier)
  
  // Starter plan is flat rate, others are per seat
  const monthlyCost = tier === 'starter' 
    ? pricePerSeat 
    : totalSeats * pricePerSeat

  return {
    tier,
    pricePerSeat,
    totalSeats,
    monthlyCost,
  }
}

/**
 * Calculate the cost for adding seats
 * This takes into account that adding seats might change the pricing tier
 */
export function calculateSeatAdditionCost(
  currentSeats: number,
  seatsToAdd: number
): {
  newTier: PricingTier
  newPricePerSeat: number
  currentMonthlyCost: number
  newMonthlyCost: number
  additionalMonthlyCost: number
  requiresTierUpgrade: boolean
} {
  const newTotalSeats = currentSeats + seatsToAdd
  const currentPricing = calculatePricing(currentSeats)
  const newPricing = calculatePricing(newTotalSeats)

  const requiresTierUpgrade = currentPricing.tier !== newPricing.tier

  return {
    newTier: newPricing.tier,
    newPricePerSeat: newPricing.pricePerSeat,
    currentMonthlyCost: currentPricing.monthlyCost,
    newMonthlyCost: newPricing.monthlyCost,
    additionalMonthlyCost: newPricing.monthlyCost - currentPricing.monthlyCost,
    requiresTierUpgrade,
  }
}

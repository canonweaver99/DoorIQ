/**
 * Stripe Configuration
 * 
 * Price IDs and Payment Links for DoorIQ Plans
 */

/**
 * Stripe Configuration - PRODUCTION
 * 
 * Price IDs and Payment Links for DoorIQ Plans
 * Updated for production use
 */

export const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk', // Production: DoorIQ Software - Individual plan
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
    // Individual plan: 1 seat at $49/month (flat rate)
    perSeatPriceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk',
  },
  team: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj', // Production: DoorIQ Software - Team plan
    paymentLink: 'https://buy.stripe.com/00w6oz9sSgLM42x2i32go02',
    // Team plan: 2-100 reps at $39/rep/month
    perSeatPriceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
  },
  enterprise: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj', // Production: DoorIQ Software - Enterprise plan (using team price for now)
    // Enterprise plan: 101+ reps at $29/rep/month
    // TODO: Add dedicated enterprise price ID when available
    perSeatPriceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
  },
} as const

export type StripePlanId = keyof typeof STRIPE_CONFIG


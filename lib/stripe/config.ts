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
    priceId: 'prod_TmlX1S82Ed4Gpe', // Production: DoorIQ Software - Tiered monthly pricing
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
    // Individual plan: 1 seat at $49/month (flat rate)
    perSeatPriceId: 'prod_TmlX1S82Ed4Gpe',
  },
  team: {
    priceId: 'prod_TmlX1S82Ed4Gpe', // Production: DoorIQ Software - Tiered monthly pricing
    paymentLink: 'https://buy.stripe.com/00w6oz9sSgLM42x2i32go02',
    // Team plan: 2-100 reps at $39/rep/month
    perSeatPriceId: 'prod_TmlX1S82Ed4Gpe',
  },
  enterprise: {
    priceId: 'prod_TmlX1S82Ed4Gpe', // Production: DoorIQ Software - Tiered monthly pricing
    // Enterprise plan: 101+ reps at $29/rep/month
    perSeatPriceId: 'prod_TmlX1S82Ed4Gpe',
  },
} as const

export type StripePlanId = keyof typeof STRIPE_CONFIG


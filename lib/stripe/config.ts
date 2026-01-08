/**
 * Stripe Configuration
 * 
 * Price IDs and Payment Links for DoorIQ Plans
 */

export const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2', // Tiered monthly pricing
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
    // Tiered pricing: 1-20 reps at $49/rep/month
    perSeatPriceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2',
  },
  team: {
    priceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2', // Tiered monthly pricing
    paymentLink: 'https://buy.stripe.com/00w6oz9sSgLM42x2i32go02',
    // Tiered pricing: 21-100 reps at $39/rep/month
    perSeatPriceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2',
  },
  enterprise: {
    priceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2', // Tiered monthly pricing
    // Tiered pricing: 101+ reps at $29/rep/month
    perSeatPriceId: 'price_1SnNyq1WkNBozaYxhlXfEjg2',
  },
} as const

export type StripePlanId = keyof typeof STRIPE_CONFIG


/**
 * Stripe Configuration
 * 
 * Price IDs and Payment Links for DoorIQ Plans
 */

export const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk',
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
    // Per-seat price ID for starter plan ($99/seat/month)
    // This should be created in Stripe as a recurring monthly price with quantity-based billing
    perSeatPriceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk', // Per-seat price ID for quantity-based billing
  },
  team: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
    paymentLink: 'https://buy.stripe.com/00w6oz9sSgLM42x2i32go02',
    // Per-seat price ID for team plan ($69/seat/month)
    // This should be created in Stripe as a recurring monthly price with quantity-based billing
    perSeatPriceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj', // Per-seat price ID for quantity-based billing
  },
  // Add enterprise plan here when configured
  // enterprise: {
  //   priceId: 'price_...',
  //   paymentLink: 'https://buy.stripe.com/...',
  // },
} as const

export type StripePlanId = keyof typeof STRIPE_CONFIG


/**
 * Stripe Configuration
 * 
 * Price IDs and Payment Links for DoorIQ Plans
 */

export const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SW61m1fQ6MPQdN0K9cEgwzk',
    paymentLink: 'https://buy.stripe.com/8x228j5cC2UWaqVe0L2go01',
  },
  // Add other plans here as they're configured
  // team: {
  //   priceId: 'price_...',
  //   paymentLink: 'https://buy.stripe.com/...',
  // },
  // enterprise: {
  //   priceId: 'price_...',
  //   paymentLink: 'https://buy.stripe.com/...',
  // },
} as const

export type StripePlanId = keyof typeof STRIPE_CONFIG


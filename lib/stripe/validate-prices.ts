/**
 * Validation utility to ensure all Stripe prices belong to the correct product
 * All prices MUST belong to product: prod_TmlX1S82Ed4Gpe
 */

import Stripe from 'stripe'
import { STRIPE_CONFIG, STRIPE_PRODUCT_ID } from './config'

/**
 * Validate that a price ID belongs to the correct product
 */
export async function validatePriceBelongsToProduct(
  stripe: Stripe,
  priceId: string,
  expectedProductId: string = STRIPE_PRODUCT_ID
): Promise<{ valid: boolean; error?: string; price?: Stripe.Price }> {
  try {
    const price = await stripe.prices.retrieve(priceId)
    const productId = typeof price.product === 'string' ? price.product : price.product?.id

    if (productId !== expectedProductId) {
      return {
        valid: false,
        error: `Price ${priceId} belongs to product ${productId}, but expected ${expectedProductId}`,
        price,
      }
    }

    return { valid: true, price }
  } catch (error: any) {
    return {
      valid: false,
      error: `Failed to retrieve price ${priceId}: ${error.message}`,
    }
  }
}

/**
 * Validate all prices in STRIPE_CONFIG belong to the correct product
 */
export async function validateAllConfigPrices(
  stripe: Stripe,
  expectedProductId: string = STRIPE_PRODUCT_ID
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  for (const [planName, config] of Object.entries(STRIPE_CONFIG)) {
    const priceIds = [config.priceId, config.perSeatPriceId].filter(Boolean) as string[]

    for (const priceId of priceIds) {
      const result = await validatePriceBelongsToProduct(stripe, priceId, expectedProductId)
      if (!result.valid) {
        errors.push(`[${planName}] ${result.error}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get all prices for the configured product
 */
export async function getProductPrices(
  stripe: Stripe,
  productId: string = STRIPE_PRODUCT_ID
): Promise<Stripe.Price[]> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })

  return prices.data
}


/**
 * Validate that all Stripe prices in config belong to the correct product
 * Usage: node scripts/validate-stripe-config.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Import config values (matching lib/stripe/config.ts)
const STRIPE_PRODUCT_ID = 'prod_TmlX1S82Ed4Gpe';
const STRIPE_CONFIG = {
  starter: {
    priceId: 'price_1SpC081fQ6MPQdN0Oi42IDV0',
    perSeatPriceId: 'price_1SpC081fQ6MPQdN0Oi42IDV0',
  },
  team: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
    perSeatPriceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
  },
  enterprise: {
    priceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
    perSeatPriceId: 'price_1SW66b1fQ6MPQdN0SJ1r5Kbj',
  },
};

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function validateConfig() {
  console.log(`\n🔍 Validating Stripe Configuration\n`);
  console.log(`Expected Product ID: ${STRIPE_PRODUCT_ID}\n`);

  const errors = [];
  const warnings = [];

  for (const [planName, config] of Object.entries(STRIPE_CONFIG)) {
    console.log(`📦 Checking ${planName} plan:`);
    console.log(`   Price ID: ${config.priceId}`);
    console.log(`   Per Seat Price ID: ${config.perSeatPriceId}`);

    const priceIds = [config.priceId, config.perSeatPriceId].filter(Boolean);

    for (const priceId of priceIds) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        const productId = typeof price.product === 'string' ? price.product : price.product?.id;

        console.log(`   ✅ Price ${priceId}:`);
        console.log(`      Product: ${productId}`);
        console.log(`      Active: ${price.active}`);
        console.log(`      Amount: $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);

        if (productId !== STRIPE_PRODUCT_ID) {
          errors.push(`[${planName}] Price ${priceId} belongs to product ${productId}, but expected ${STRIPE_PRODUCT_ID}`);
          console.log(`      ❌ ERROR: Wrong product!`);
        } else {
          console.log(`      ✅ Correct product`);
        }

        if (!price.active) {
          warnings.push(`[${planName}] Price ${priceId} is inactive`);
          console.log(`      ⚠️  WARNING: Price is inactive`);
        }
      } catch (error) {
        errors.push(`[${planName}] Failed to retrieve price ${priceId}: ${error.message}`);
        console.log(`   ❌ ERROR: ${error.message}`);
      }
      console.log('');
    }
  }

  // Get all prices for the expected product
  console.log(`\n📋 All prices for product ${STRIPE_PRODUCT_ID}:\n`);
  try {
    const prices = await stripe.prices.list({
      product: STRIPE_PRODUCT_ID,
      active: true,
      limit: 100,
    });

    if (prices.data.length === 0) {
      warnings.push(`No active prices found for product ${STRIPE_PRODUCT_ID}`);
      console.log('   ⚠️  No active prices found');
    } else {
      prices.data.forEach((price, index) => {
        console.log(`${index + 1}. ${price.id}`);
        console.log(`   Amount: $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
        console.log(`   Active: ${price.active}`);
        console.log('');
      });
    }
  } catch (error) {
    if (error.code === 'resource_missing') {
      errors.push(`Product ${STRIPE_PRODUCT_ID} not found in Stripe`);
      console.log(`   ❌ Product not found (are you in the correct mode - test vs production?)`);
    } else {
      errors.push(`Failed to list prices: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All prices are valid and belong to the correct product!');
  } else {
    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(warn => console.log(`   - ${warn}`));
    }
  }

  console.log('');

  return { valid: errors.length === 0, errors, warnings };
}

validateConfig().then(({ valid }) => {
  process.exit(valid ? 0 : 1);
});


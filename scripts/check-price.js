/**
 * Check a specific Stripe price and verify it belongs to the correct product
 * Usage: node scripts/check-price.js price_1SpC081fQ6MPQdN0Oi42IDV0
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const expectedProductId = 'prod_TmlX1S82Ed4Gpe';

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function checkPrice(priceId) {
  console.log(`\n🔍 Checking price: ${priceId}\n`);
  console.log(`Expected Product ID: ${expectedProductId}\n`);

  try {
    const price = await stripe.prices.retrieve(priceId);
    
    const productId = typeof price.product === 'string' ? price.product : price.product?.id;
    
    console.log('📊 Price Details:');
    console.log(`   Price ID: ${price.id}`);
    console.log(`   Product ID: ${productId}`);
    console.log(`   Active: ${price.active}`);
    console.log(`   Type: ${price.type}`);
    console.log(`   Currency: ${price.currency}`);
    
    if (price.unit_amount) {
      console.log(`   Amount: $${price.unit_amount / 100}`);
    }
    
    if (price.recurring) {
      console.log(`   Recurring: ${price.recurring.interval} (${price.recurring.interval_count}x)`);
      if (price.recurring.trial_period_days) {
        console.log(`   Trial Period: ${price.recurring.trial_period_days} days`);
      }
    }
    
    if (price.metadata && Object.keys(price.metadata).length > 0) {
      console.log(`   Metadata:`, price.metadata);
    }

    console.log('\n' + '='.repeat(60));
    
    if (productId === expectedProductId) {
      console.log('✅ SUCCESS: Price belongs to the correct product!');
    } else {
      console.log('❌ ERROR: Price belongs to wrong product!');
      console.log(`   Expected: ${expectedProductId}`);
      console.log(`   Found: ${productId}`);
    }
    
    if (!price.active) {
      console.log('⚠️  WARNING: Price is inactive');
    }
    
    console.log('');

  } catch (error) {
    if (error.code === 'resource_missing') {
      console.error(`❌ Price not found: ${priceId}`);
      console.error('   This might be a production price and you\'re in test mode, or vice versa.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

const priceId = process.argv[2] || 'price_1SpC081fQ6MPQdN0Oi42IDV0';
checkPrice(priceId).then(() => process.exit(0));


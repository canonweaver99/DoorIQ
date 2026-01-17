/**
 * Check prices for a specific product
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

async function checkProductPrices(productId) {
  console.log(`\n🔍 Checking prices for product: ${productId}\n`);

  try {
    // Get product details
    const product = await stripe.products.retrieve(productId);
    console.log(`Product: ${product.name}`);
    console.log(`Active: ${product.active}`);
    console.log(`Description: ${product.description || 'N/A'}\n`);

    // Get all prices for this product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
    });

    console.log(`Found ${prices.data.length} active prices:\n`);

    prices.data.forEach((price, index) => {
      console.log(`${index + 1}. Price ID: ${price.id}`);
      console.log(`   Amount: $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
      console.log(`   Currency: ${price.currency}`);
      console.log(`   Type: ${price.type}`);
      if (price.recurring) {
        console.log(`   Recurring: ${price.recurring.interval} (${price.recurring.interval_count}x)`);
        console.log(`   Trial Period: ${price.recurring.trial_period_days || 'None'} days`);
      }
      if (price.metadata && Object.keys(price.metadata).length > 0) {
        console.log(`   Metadata:`, price.metadata);
      }
      console.log('');
    });

    // Identify which price is for which plan
    console.log('\n📋 Price Recommendations:\n');
    const monthlyPrices = prices.data.filter(p => p.recurring?.interval === 'month');
    const yearlyPrices = prices.data.filter(p => p.recurring?.interval === 'year');
    
    if (monthlyPrices.length > 0) {
      console.log('Monthly Prices:');
      monthlyPrices.forEach(p => {
        const amount = (p.unit_amount || 0) / 100;
        if (amount === 0) {
          console.log(`   Individual/Starter: ${p.id} ($${amount}/month)`);
        } else if (amount < 50) {
          console.log(`   Individual/Starter: ${p.id} ($${amount}/month)`);
        } else if (amount < 100) {
          console.log(`   Team: ${p.id} ($${amount}/month per seat)`);
        } else {
          console.log(`   Enterprise: ${p.id} ($${amount}/month per seat)`);
        }
      });
    }

    if (yearlyPrices.length > 0) {
      console.log('\nYearly Prices:');
      yearlyPrices.forEach(p => {
        const amount = (p.unit_amount || 0) / 100;
        console.log(`   ${p.id} ($${amount}/year)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const productId = process.argv[2] || 'prod_TmlX1S82Ed4Gpe';
checkProductPrices(productId).then(() => process.exit(0));


/**
 * List Stripe prices to find the correct test price ID
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

async function listPrices() {
  console.log('\n🔍 Listing Stripe prices...\n');

  try {
    const prices = await stripe.prices.list({
      limit: 100,
      active: true,
    });

    console.log(`Found ${prices.data.length} active prices:\n`);

    // Group by product
    const byProduct = {};
    prices.data.forEach(price => {
      const productId = typeof price.product === 'string' ? price.product : price.product?.id || 'unknown';
      if (!byProduct[productId]) {
        byProduct[productId] = [];
      }
      byProduct[productId].push(price);
    });

    for (const [productId, productPrices] of Object.entries(byProduct)) {
      const product = productPrices[0].product;
      const productName = typeof product === 'object' ? product.name : productId;
      
      console.log(`📦 Product: ${productName} (${productId})`);
      productPrices.forEach(price => {
        console.log(`   Price: ${price.id}`);
        console.log(`   Amount: $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
        console.log(`   Currency: ${price.currency}`);
        console.log(`   Type: ${price.type}`);
        if (price.recurring) {
          console.log(`   Recurring: ${price.recurring.interval} (${price.recurring.interval_count}x)`);
        }
        console.log('');
      });
    }

    // Find individual/monthly prices
    const individualPrices = prices.data.filter(p => 
      p.recurring?.interval === 'month' && 
      (p.unit_amount || 0) < 5000 // Less than $50
    );

    if (individualPrices.length > 0) {
      console.log('\n🎯 Likely Individual Plan Prices:\n');
      individualPrices.forEach(price => {
        console.log(`   ${price.id} - $${(price.unit_amount || 0) / 100}/month`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listPrices().then(() => process.exit(0));


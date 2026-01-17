/**
 * Check Stripe for customer and subscription info
 * Usage: node scripts/check-stripe-customer.js test12345@dooriq.ai
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function checkStripeCustomer(email) {
  console.log(`\n🔍 Checking Stripe for: ${email}\n`);

  try {
    // Search for customers by email
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log('❌ No Stripe customer found for this email');
      console.log('\n💡 This means:');
      console.log('   - User account exists in database');
      console.log('   - But no Stripe checkout was completed');
      console.log('   - Or checkout failed before customer creation');
      return;
    }

    console.log(`✅ Found ${customers.data.length} Stripe customer(s):\n`);

    for (const customer of customers.data) {
      console.log(`Customer ID: ${customer.id}`);
      console.log(`Email: ${customer.email}`);
      console.log(`Created: ${new Date(customer.created * 1000).toLocaleString()}`);
      console.log(`Metadata:`, customer.metadata);

      // Get subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      if (subscriptions.data.length === 0) {
        console.log(`\n⚠️  No subscriptions found for this customer`);
      } else {
        console.log(`\n📊 Subscriptions (${subscriptions.data.length}):`);
        subscriptions.data.forEach((sub, index) => {
          console.log(`\n   ${index + 1}. Subscription ${sub.id}:`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Created: ${new Date(sub.created * 1000).toLocaleString()}`);
          console.log(`      Trial End: ${sub.trial_end ? new Date(sub.trial_end * 1000).toLocaleString() : 'No trial'}`);
          console.log(`      Current Period End: ${new Date(sub.current_period_end * 1000).toLocaleString()}`);
          console.log(`      Cancel At Period End: ${sub.cancel_at_period_end}`);
          console.log(`      Items:`, sub.items.data.map(item => ({
            price: item.price.id,
            quantity: item.quantity
          })));
        });
      }

      // Check checkout sessions
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 10,
      });

      if (sessions.data.length > 0) {
        console.log(`\n🛒 Checkout Sessions (${sessions.data.length}):`);
        sessions.data.forEach((session, index) => {
          console.log(`\n   ${index + 1}. Session ${session.id}:`);
          console.log(`      Status: ${session.status}`);
          console.log(`      Payment Status: ${session.payment_status}`);
          console.log(`      Created: ${new Date(session.created * 1000).toLocaleString()}`);
          console.log(`      Mode: ${session.mode}`);
          if (session.subscription) {
            console.log(`      Subscription: ${session.subscription}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking Stripe:', error.message);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check-stripe-customer.js <email>');
  process.exit(1);
}

checkStripeCustomer(email).then(() => {
  process.exit(0);
});


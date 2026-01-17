/**
 * Check Stripe checkout sessions for an email
 * Usage: node scripts/check-checkout-sessions.js test12345@dooriq.ai
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

async function checkCheckoutSessions(email) {
  console.log(`\n🔍 Checking checkout sessions for: ${email}\n`);

  try {
    // List all checkout sessions (limited to recent ones)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    console.log(`Found ${sessions.data.length} recent checkout sessions\n`);

    const matchingSessions = sessions.data.filter(session => 
      session.customer_email?.toLowerCase() === email.toLowerCase() ||
      session.metadata?.user_email?.toLowerCase() === email.toLowerCase()
    );

    if (matchingSessions.length === 0) {
      console.log('❌ No checkout sessions found for this email');
      console.log('\n💡 Possible reasons:');
      console.log('   1. Checkout was completed with a different email');
      console.log('   2. Checkout sessions are older than 100 sessions');
      console.log('   3. Checkout was in test mode but we\'re checking live mode (or vice versa)');
      console.log('   4. Checkout was never actually completed');
      return;
    }

    console.log(`✅ Found ${matchingSessions.length} matching session(s):\n`);

    for (const session of matchingSessions) {
      console.log(`Session ID: ${session.id}`);
      console.log(`Status: ${session.status}`);
      console.log(`Payment Status: ${session.payment_status}`);
      console.log(`Mode: ${session.mode}`);
      console.log(`Created: ${new Date(session.created * 1000).toLocaleString()}`);
      console.log(`Customer Email: ${session.customer_email || 'N/A'}`);
      console.log(`Customer ID: ${session.customer || 'N/A'}`);
      console.log(`Subscription ID: ${session.subscription || 'N/A'}`);
      console.log(`Metadata:`, JSON.stringify(session.metadata || {}, null, 2));
      
      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log(`\n   Subscription Details:`);
          console.log(`   Status: ${subscription.status}`);
          console.log(`   Trial End: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleString() : 'No trial'}`);
          console.log(`   Current Period End: ${new Date(subscription.current_period_end * 1000).toLocaleString()}`);
        } catch (err) {
          console.log(`   ⚠️  Could not retrieve subscription: ${err.message}`);
        }
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check-checkout-sessions.js <email>');
  process.exit(1);
}

checkCheckoutSessions(email).then(() => {
  process.exit(0);
});


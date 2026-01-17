/**
 * List recent checkout sessions to find the one for test12345@dooriq.ai
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

async function listRecentCheckouts() {
  console.log('\n🔍 Listing recent checkout sessions...\n');

  const sessions = await stripe.checkout.sessions.list({
    limit: 50,
  });

  console.log(`Found ${sessions.data.length} recent sessions:\n`);

  sessions.data.forEach((session, index) => {
    console.log(`${index + 1}. Session: ${session.id}`);
    console.log(`   Email: ${session.customer_email || session.metadata?.user_email || 'N/A'}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Payment: ${session.payment_status}`);
    console.log(`   Subscription: ${session.subscription || 'N/A'}`);
    console.log(`   Created: ${new Date(session.created * 1000).toLocaleString()}`);
    console.log(`   Metadata:`, JSON.stringify(session.metadata || {}, null, 2));
    console.log('');
  });

  // Look for any session that might be related
  const possibleMatches = sessions.data.filter(s => 
    s.customer_email?.includes('test') ||
    s.metadata?.user_email?.includes('test') ||
    s.metadata?.user_email?.includes('dooriq')
  );

  if (possibleMatches.length > 0) {
    console.log(`\n🎯 Possible matches (${possibleMatches.length}):\n`);
    possibleMatches.forEach(session => {
      console.log(`Session: ${session.id}`);
      console.log(`Email: ${session.customer_email || session.metadata?.user_email}`);
      console.log(`Subscription: ${session.subscription || 'N/A'}`);
      console.log('');
    });
  }
}

listRecentCheckouts().then(() => process.exit(0));

